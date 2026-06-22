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
function cultureG(C: number, p: Params): number {
  const a = computeAux({ U: 0, D: 0, TD: 0, L: 0, E: 0, C }, p)
  // safety_wins/backfire depend only on f_doc(C); cultureTarget mirrors model.ts.
  const cultureTarget = p.a_jc_c * p.just_culture + p.a_sep * p.recipient_enforcer_separation + a.safety_wins - a.backfire
  return cultureTarget - C
}

/** All roots of g(C) on [0,1] (plus stable boundaries), bracketed + bisected. */
export function cultureEquilibria(p: Params): number[] {
  const roots: number[] = []
  const M = 1000
  let prevC = 0
  let prevG = cultureG(0, p)
  // C = 0 is an equilibrium of C·(1−C)·g; it is an attractor if g(0+) < 0.
  if (cultureG(1e-6, p) < 0) roots.push(0)
  for (let i = 1; i <= M; i++) {
    const C = i / M
    const g = cultureG(C, p)
    if ((prevG <= 0 && g > 0) || (prevG >= 0 && g < 0)) {
      // Bisect for the interior root.
      let lo = prevC
      let hi = C
      for (let b = 0; b < 60; b++) {
        const mid = 0.5 * (lo + hi)
        const gm = cultureG(mid, p)
        if (prevG <= 0 ? gm > 0 : gm < 0) hi = mid
        else lo = mid
      }
      roots.push(0.5 * (lo + hi))
    }
    prevC = C
    prevG = g
  }
  if (cultureG(1 - 1e-6, p) > 0) roots.push(1)
  return roots
}

/** Equilibrium of the 5 fast stocks at a fixed culture C (integrate to steady state). */
export function fastEquilibriumAt(C: number, p: Params): State {
  // Integrate the full system but pin C each step (cheap, robust to stiffness).
  let s: State = { U: 20, D: 5, TD: 10, L: 30, E: 10, C }
  const dt = 0.5
  for (let i = 0; i < 4000; i++) {
    const d = derivatives(s, p)
    const next: State = {
      U: Math.max(0, s.U + dt * d.U),
      D: Math.max(0, s.D + dt * d.D),
      TD: Math.max(0, s.TD + dt * d.TD),
      L: Math.min(100, Math.max(0, s.L + dt * d.L)),
      E: Math.max(0, s.E + dt * d.E),
      C,
    }
    let delta = 0
    for (const k of STOCK_KEYS) delta += Math.abs(next[k] - s[k])
    s = next
    if (delta < 1e-9) break
  }
  return s
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
    out.push(eq)
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
