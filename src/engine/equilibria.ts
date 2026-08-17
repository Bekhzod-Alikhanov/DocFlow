/**
 * Equilibrium location and stability analysis (spec §3.2). Two complementary tools:
 *
 *  1. A general damped-Newton fixed-point finder with a numerical Jacobian, for
 *     arbitrary use and tests.
 *  2. A complete enumerator that exploits a structural fact of this model: the
 *     culture stock C is dynamically decoupled (its rate depends only on f_doc(C),
 *     not on the fast stocks — see MODEL.md). So every equilibrium has a culture
 *     value that is a root of g(C) = cultureTarget(C) − C. We find all such roots,
 *     solve the fast subsystem at each, and classify the full 6-D fixed point by
 *     the eigenvalues of the full Jacobian. This guarantees we find *both*
 *     attractors and the unstable separatrix between them.
 */
import type { State, Params } from './types'
import { STOCK_KEYS } from './types'
import { derivatives, computeAux } from './model'
import { eigenvalues, maxRealPart, solveLinear, type Complex, type Matrix } from './linalg'

export type StabilityClass = 'stable' | 'unstable' | 'saddle' | 'marginal'

export interface Equilibrium {
  state: State
  fdoc: number
  residualNorm: number
  converged: boolean
  eigenvalues: Complex[]
  maxRealPart: number
  stability: StabilityClass
  /** Culture value (convenient discriminator between attractors). */
  C: number
}

const N = STOCK_KEYS.length

function stateToVec(s: State): number[] {
  return STOCK_KEYS.map((k) => s[k])
}
function vecToState(v: number[]): State {
  const s = {} as State
  STOCK_KEYS.forEach((k, i) => (s[k] = v[i]))
  return s
}
function norm(v: number[]): number {
  return Math.sqrt(v.reduce((a, x) => a + x * x, 0))
}

/** Numerical Jacobian of the derivatives field via central differences. */
export function numericalJacobian(s: State, p: Params, eps = 1e-6): Matrix {
  const x = stateToVec(s)
  const J: Matrix = Array.from({ length: N }, () => new Array<number>(N).fill(0))
  for (let j = 0; j < N; j++) {
    const h = eps * Math.max(1, Math.abs(x[j]))
    const xp = x.slice()
    const xm = x.slice()
    xp[j] += h
    xm[j] -= h
    const fp = stateToVec(derivatives(vecToState(xp), p))
    const fm = stateToVec(derivatives(vecToState(xm), p))
    for (let i = 0; i < N; i++) J[i][j] = (fp[i] - fm[i]) / (2 * h)
  }
  return J
}

export function classifyStability(eigs: Complex[], tol = 1e-7): StabilityClass {
  const maxRe = maxRealPart(eigs)
  const minRe = eigs.reduce((m, e) => Math.min(m, e.re), Infinity)
  if (maxRe < -tol) return 'stable'
  if (maxRe > tol) return minRe < -tol ? 'saddle' : 'unstable'
  return 'marginal'
}

/** Damped Newton iteration toward derivatives(state) = 0 from an initial guess. */
export function findEquilibrium(
  p: Params,
  guess: State,
  opts: { maxIter?: number; tol?: number } = {},
): Equilibrium {
  const maxIter = opts.maxIter ?? 100
  const tol = opts.tol ?? 1e-9
  let x = stateToVec(guess)
  let converged = false
  let resNorm = Infinity

  for (let iter = 0; iter < maxIter; iter++) {
    const f = stateToVec(derivatives(vecToState(x), p))
    resNorm = norm(f)
    if (resNorm < tol) {
      converged = true
      break
    }
    const J = numericalJacobian(vecToState(x), p)
    const neg = f.map((v) => -v)
    const dx = solveLinear(J, neg)
    if (!dx) break
    // Damped step: backtrack until the residual decreases (or accept a small step).
    let lambda = 1
    let accepted = false
    for (let bt = 0; bt < 20; bt++) {
      const xn = x.map((xi, i) => xi + lambda * dx[i])
      const rn = norm(stateToVec(derivatives(vecToState(xn), p)))
      if (rn < resNorm || lambda < 1e-6) {
        x = xn
        accepted = true
        break
      }
      lambda *= 0.5
    }
    if (!accepted) break
  }

  const state = vecToState(x)
  const eigs = eigenvalues(numericalJacobian(state, p))
  return {
    state,
    fdoc: computeAux(state, p).f_doc,
    residualNorm: resNorm,
    converged: converged && resNorm < tol * 100,
    eigenvalues: eigs,
    maxRealPart: maxRealPart(eigs),
    stability: classifyStability(eigs),
    C: state.C,
  }
}

// --- Complete enumeration via the decoupled culture root structure ---

/** g(C) = cultureTarget(C) − C, using only f_doc(C) (culture is decoupled). */
/**
 * dC/dt evaluated on the SLOW MANIFOLD: the fast stocks are first relaxed to their
 * equilibrium at this culture value, then the culture rate is read off there.
 *
 * v0.3.0: this replaces a version that duplicated the cultureTarget formula and
 * evaluated it at all-zero stocks. That was valid only while culture was decoupled.
 * Now that realised exposure and harm feed back into the culture target
 * (AUDIT.md F1), E, TD and L must be at their C-consistent values or the roots are
 * simply wrong. Calling `derivatives` directly also removes the duplicated formula,
 * which had already drifted out of sync with `model.ts`.
 *
 * Sign note: dC/dt = lambda_C·(target − C)·kernel with kernel > 0 everywhere
 * (eps_C > 0), so the sign of dC/dt is the sign of (target − C) and root-bracketing
 * on it is equivalent.
 */
function cultureG(
  C: number,
  p: Params,
  guess?: State,
  opts?: FastEquilibriumOpts,
): { g: number; state: State } {
  const state = fastEquilibriumDetail(C, p, guess, opts).state
  return { g: derivatives(state, p).C, state }
}

/** Loose during the sign scan, tight during bisection — see fastEquilibriumDetail. */
const SCAN_OPTS: FastEquilibriumOpts = { tol: 1e-5, maxIter: 600 }
const REFINE_OPTS: FastEquilibriumOpts = { tol: 1e-8, maxIter: 2000 }

/**
 * All roots of dC/dt on [0,1], bracketed on a grid and bisected.
 *
 * The scan is warm-started: each grid point seeds the next fast-subsystem solve
 * (numerical continuation along C). That is both markedly faster than solving each
 * point cold and more accurate, because consecutive solves stay on the same branch.
 */
export function cultureEquilibria(p: Params): number[] {
  const roots: number[] = []
  const M = 200
  let warm: State | undefined
  const at = (C: number) => {
    const r = cultureG(C, p, warm, SCAN_OPTS)
    warm = r.state
    return r.g
  }

  // C = 0 is a fixed point only if the target sits at or below it.
  if (at(1e-6) < 0) roots.push(0)
  warm = undefined

  let prevC = 0
  let prevG = at(0)
  for (let i = 1; i <= M; i++) {
    const C = i / M
    const g = at(C)
    if ((prevG <= 0 && g > 0) || (prevG >= 0 && g < 0)) {
      // Bisect for the interior root, warm-starting each evaluation.
      let lo = prevC
      let hi = C
      let seed: State | undefined = warm
      for (let b = 0; b < 40; b++) {
        const mid = 0.5 * (lo + hi)
        const r = cultureG(mid, p, seed, REFINE_OPTS)
        seed = r.state
        if (prevG <= 0 ? r.g > 0 : r.g < 0) hi = mid
        else lo = mid
      }
      roots.push(0.5 * (lo + hi))
    }
    prevC = C
    prevG = g
  }
  if (at(1 - 1e-6) > 0) roots.push(1)
  return roots
}

/**
 * Equilibrium of the 5 fast stocks at a fixed culture C (relax to steady state).
 *
 * `guess` warm-starts the relaxation — used by `cultureEquilibria` to continue
 * along C rather than solving each point cold.
 *
 * v0.3.0: the previous version clamped L into [0,100] *inside* the loop, so a true
 * equilibrium with L* > 100 would park at the bound, never satisfy the convergence
 * test, and be returned after 4000 steps as a non-fixed-point that callers then
 * classified as "stable" (AUDIT.md F13). The relaxation is now unclamped and the
 * caller is told whether it actually converged.
 */
export function fastEquilibriumAt(C: number, p: Params, guess?: State): State {
  return fastEquilibriumDetail(C, p, guess).state
}

export interface FastEquilibriumResult {
  state: State
  converged: boolean
  residual: number
}

export interface FastEquilibriumOpts {
  /** Residual at which the relaxation stops. */
  tol?: number
  maxIter?: number
}

/**
 * `tol`/`maxIter` exist for performance: the root SCAN only needs the sign of
 * dC/dt, which is robust at a loose tolerance, while the bisection that follows
 * needs precision. Solving the whole 400-point scan to 1e-9 made `sweep1D` take
 * ~6 s, which is too slow for the Tipping view.
 */
/** The five stocks that relax fast relative to culture. */
const FAST_KEYS = ['U', 'D', 'TD', 'L', 'E'] as const

/**
 * Newton solve for the fast subsystem with C pinned. Quadratically convergent, so
 * it reaches machine precision in a handful of iterations where the Euler
 * relaxation needs hundreds: `E` has a ~5-month time constant, so at dt = 0.5 it
 * takes >100 steps just to settle the slowest mode. That cost is what pushed
 * `sweep1D` past the CI test timeout. Returns null if Newton fails, in which case
 * the caller falls back to relaxation.
 */
function fastEquilibriumNewton(C: number, p: Params, guess: State, tol: number): State | null {
  const x = FAST_KEYS.map((k) => guess[k])
  const toState = (v: number[]): State => {
    const s = { C } as State
    FAST_KEYS.forEach((k, i) => (s[k] = v[i]))
    return s
  }
  const residual = (v: number[]) => {
    const d = derivatives(toState(v), p)
    return FAST_KEYS.map((k) => d[k])
  }

  let cur = x
  let f = residual(cur)
  for (let iter = 0; iter < 25; iter++) {
    if (norm(f) < tol) return toState(cur)

    // 5×5 numerical Jacobian by central differences.
    const J: number[][] = Array.from({ length: 5 }, () => new Array<number>(5).fill(0))
    for (let j = 0; j < 5; j++) {
      const h = 1e-6 * Math.max(1, Math.abs(cur[j]))
      const up = cur.slice()
      const dn = cur.slice()
      up[j] += h
      dn[j] -= h
      const fu = residual(up)
      const fd = residual(dn)
      for (let i = 0; i < 5; i++) J[i][j] = (fu[i] - fd[i]) / (2 * h)
    }

    const step = solveLinear(
      J,
      f.map((v) => -v),
    )
    if (!step) return null

    // Damped: accept the first step length that reduces the residual.
    let accepted = false
    for (let bt = 0, lambda = 1; bt < 12; bt++, lambda *= 0.5) {
      const next = cur.map((xi, i) => xi + lambda * step[i])
      const fn = residual(next)
      if (fn.every(Number.isFinite) && norm(fn) < norm(f)) {
        cur = next
        f = fn
        accepted = true
        break
      }
    }
    if (!accepted) return null
  }
  return norm(f) < tol ? toState(cur) : null
}

export function fastEquilibriumDetail(
  C: number,
  p: Params,
  guess?: State,
  opts: FastEquilibriumOpts = {},
): FastEquilibriumResult {
  const tol = opts.tol ?? 1e-9
  const maxIter = opts.maxIter ?? 4000
  const seed: State = guess ? { ...guess, C } : { U: 20, D: 5, TD: 10, L: 30, E: 10, C }

  // Fast path. Newton is tried first and succeeds on the overwhelming majority of
  // points, especially when warm-started along a continuation scan.
  const viaNewton = fastEquilibriumNewton(C, p, seed, Math.min(tol, 1e-8))
  if (viaNewton) {
    const d = derivatives(viaNewton, p)
    return { state: viaNewton, converged: true, residual: norm(FAST_KEYS.map((k) => d[k])) }
  }

  let s: State = seed
  const dt = 0.5
  let residual = Infinity
  let converged = false
  for (let i = 0; i < maxIter; i++) {
    const d = derivatives(s, p)
    // Unclamped: the equations now keep the non-negative stocks non-negative on
    // their own (TD = 0 is invariant via debtAvailability), so a clamp here would
    // only hide a genuine out-of-domain equilibrium.
    const next: State = {
      U: s.U + dt * d.U,
      D: s.D + dt * d.D,
      TD: s.TD + dt * d.TD,
      L: s.L + dt * d.L,
      E: s.E + dt * d.E,
      C,
    }
    if (!Number.isFinite(next.U + next.D + next.TD + next.L + next.E)) break
    let delta = 0
    for (const k of STOCK_KEYS) delta += Math.abs(next[k] - s[k])
    s = next
    residual = delta / dt
    if (residual < tol) {
      converged = true
      break
    }
  }
  return { state: s, converged, residual }
}

/**
 * Find ALL equilibria of the full system, classifying each by full-Jacobian
 * eigenvalues. Returns them sorted by culture value (chilling → learning).
 */
export function findAllEquilibria(p: Params): Equilibrium[] {
  const out: Equilibrium[] = []
  for (const C of cultureEquilibria(p)) {
    const fast = fastEquilibriumAt(C, p)
    // Polish with a couple of Newton steps on the full system for accuracy.
    const polished = findEquilibrium(p, fast, { maxIter: 40 })
    // Keep the enumerated culture value if Newton drifted to a different basin.
    const eq = Math.abs(polished.C - C) < 0.02 ? polished : refineAt(C, fast, p)

    // v0.3.0: DEDUPLICATE. An attracting boundary and an interior root adjacent to
    // it can enumerate separately and then polish to the SAME fixed point, which
    // silently inflated the attractor count (neutral reported 3 stable attractors
    // when it has 2). Compare the full state, not just C, since distinct culture
    // roots that converge to one point are exactly the case being caught.
    const dup = out.some((e) => {
      let d = 0
      for (const k of STOCK_KEYS) d += Math.abs(e.state[k] - eq.state[k]) / (1 + Math.abs(e.state[k]))
      return d < 1e-4
    })
    if (!dup) out.push(eq)
  }
  return out.sort((a, b) => a.C - b.C)
}

/** Build an Equilibrium record at a fixed culture root with its fast equilibrium. */
function refineAt(C: number, fast: State, p: Params): Equilibrium {
  const state: State = { ...fast, C }
  const res = stateToVec(derivatives(state, p))
  const eigs = eigenvalues(numericalJacobian(state, p))
  return {
    state,
    fdoc: computeAux(state, p).f_doc,
    residualNorm: norm(res),
    converged: norm(res) < 1e-5,
    eigenvalues: eigs,
    maxRealPart: maxRealPart(eigs),
    stability: classifyStability(eigs),
    C,
  }
}

/** Convenience: just the stable attractors. */
export function stableAttractors(p: Params): Equilibrium[] {
  return findAllEquilibria(p).filter((e) => e.stability === 'stable')
}

/** True if the system has (at least) two stable attractors — i.e. is bistable. */
export function isBistable(p: Params): boolean {
  return stableAttractors(p).length >= 2
}
