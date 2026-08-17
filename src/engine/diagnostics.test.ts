/**
 * Permanent model diagnostics (docs/plan/VALIDATION.md).
 *
 * Two jobs:
 *  1. Executable GATES for the defects fixed in v0.3.0 — V1.3 (loop closed),
 *     V4.2 (TD=0 invariant), V4.4 (no absorbing culture), V5.3 (no clamps).
 *     These fail on v0.2 by construction; that is the point.
 *  2. A logged CENSUS (monotonicity, collinearity, integration order, stiffness,
 *     preset behaviour) so regressions are visible in CI output rather than
 *     discovered by a reviewer.
 *
 * The census intentionally does not assert on numbers that legitimately move when
 * the model changes; it asserts only on properties that must always hold.
 */
import { describe, it, expect } from 'vitest'
import { LEVER_KEYS, STOCK_KEYS } from './types'
import type { State } from './types'
import { defaultParams, defaultInitState, PARAM_SPEC_BY_ID } from './registry'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESETS, PRESET_BY_ID } from './presets'
import { derivatives, computeAux, softplus } from './model'
import { integrate, simulate } from './simulate'
import { numericalJacobian, findAllEquilibria, isBistable } from './equilibria'
import { sweep1D } from './bifurcation'
import { eigenvalues } from './linalg'

const S = { horizon: 120, dt: 0.5, solver: 'rk4' as const }
const base: State = { U: 20, D: 5, TD: 10, L: 30, E: 10, C: 0.4 }

// ---------------------------------------------------------------------------
// GATES — these encode the audit's worst findings as pass/fail conditions.
// ---------------------------------------------------------------------------

describe('V1.3 — the R1 culture loop is closed (AUDIT.md F1)', () => {
  it('dC/dt depends on realised exposure E', () => {
    const p = defaultParams()
    const J = numericalJacobian(base, p)
    const iC = STOCK_KEYS.indexOf('C')
    const iE = STOCK_KEYS.indexOf('E')
    // In v0.2 the culture row of the Jacobian was [0,0,0,0,0,∂C].
    expect(Math.abs(J[iC][iE])).toBeGreaterThan(1e-9)
  })

  it('dC/dt depends on technical debt TD (via harm)', () => {
    const p = defaultParams()
    const J = numericalJacobian(base, p)
    const iC = STOCK_KEYS.indexOf('C')
    const iTD = STOCK_KEYS.indexOf('TD')
    expect(Math.abs(J[iC][iTD])).toBeGreaterThan(1e-9)
  })

  it('the culture row of the Jacobian is not all-zero off the diagonal', () => {
    const p = defaultParams()
    const J = numericalJacobian(base, p)
    const iC = STOCK_KEYS.indexOf('C')
    const offDiag = STOCK_KEYS.map((_, j) => (j === iC ? 0 : Math.abs(J[iC][j])))
    expect(Math.max(...offDiag)).toBeGreaterThan(1e-9)
  })
})

describe('V4.2 — non-negativity is structural, not clamped (AUDIT.md F2)', () => {
  it('dTD/dt >= 0 whenever TD = 0, over randomised parameters and stocks', () => {
    let worst = Infinity
    let rng = 12345
    const rand = () => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let trial = 0; trial < 2000; trial++) {
      const p = defaultParams()
      for (const k of Object.keys(p) as (keyof typeof p)[]) {
        const spec = PARAM_SPEC_BY_ID[k]
        p[k] = spec.min + rand() * (spec.max - spec.min)
      }
      const s: State = { U: rand() * 100, D: rand() * 100, TD: 0, L: rand() * 100, E: rand() * 200, C: rand() }
      worst = Math.min(worst, derivatives(s, p).TD)
    }
    expect(worst).toBeGreaterThanOrEqual(-1e-12)
  })
})

describe('V4.4 — culture has no absorbing states (AUDIT.md F9)', () => {
  it('escapes C = 0 when the target is above it', () => {
    const p = defaultParams()
    p.just_culture = 1
    p.recipient_enforcer_separation = 1
    const d = derivatives({ ...base, C: 0, E: 0, TD: 0 }, p).C
    expect(d).toBeGreaterThan(1e-6)
  })

  it('escapes C = 1 when the target is below it', () => {
    const p = defaultParams()
    p.just_culture = 0
    p.recipient_enforcer_separation = 0
    p.omega = 0
    const d = derivatives({ ...base, C: 1 }, p).C
    expect(d).toBeLessThan(-1e-6)
  })

  it('culture recovers from a saturated boundary once policy improves', () => {
    const p = paramsFromPreset(PRESET_BY_ID.aviation)
    const pinned: State = { ...initFromPreset(PRESET_BY_ID.aviation), C: 1 }
    // Degrade the regime hard; culture must be able to come back down.
    const bad = { ...p, just_culture: 0, recipient_enforcer_separation: 0, privilege_strength: 0, omega: 0 }
    const traj = integrate(pinned, bad, { horizon: 240, dt: 0.5, solver: 'rk4' })
    expect(traj.states[traj.states.length - 1].C).toBeLessThan(0.99)
  })
})

describe('V5.3 — the lower bound is not enforced by clamping (AUDIT.md F2, F11)', () => {
  it('no shipped preset relies on min/max clamp events', () => {
    const offenders: string[] = []
    for (const preset of PRESETS) {
      const t = integrate(initFromPreset(preset), paramsFromPreset(preset), { horizon: 360, dt: 0.5, solver: 'rk4' })
      const bounds = t.clampEvents.filter((e) => e.kind === 'min' || e.kind === 'max')
      if (bounds.length > 0) offenders.push(`${preset.id}:${bounds.length}`)
    }
    expect(offenders).toEqual([])
  })
})

describe('V10.2 — no dead levers (AUDIT.md §5.1)', () => {
  it('every lever moves at least one headline output at the contested baseline', () => {
    const p0 = paramsFromPreset(PRESET_BY_ID.neutral)
    const i0 = initFromPreset(PRESET_BY_ID.neutral)
    const dead: string[] = []
    for (const lev of LEVER_KEYS) {
      const at = (x: number) => simulate(i0, { ...p0, [lev]: x }, S).summary
      const lo = at(0)
      const hi = at(1)
      const span = Math.max(
        Math.abs(hi.finalFdoc - lo.finalFdoc),
        Math.abs(hi.finalState.TD - lo.finalState.TD),
        Math.abs(hi.finalState.L - lo.finalState.L),
        Math.abs(hi.finalState.E - lo.finalState.E),
      )
      if (span < 1e-9) dead.push(lev)
    }
    expect(dead).toEqual([])
  })
})

describe('V11.3 — preset labels match simulated behaviour (AUDIT.md F16)', () => {
  it('no preset declares a regime it does not produce', () => {
    const mismatches = PRESETS.filter((pr) => {
      const actual = simulate(initFromPreset(pr), paramsFromPreset(pr), S).summary.regime
      return pr.expectedRegime !== actual
    }).map((pr) => `${pr.id}: declared=${pr.expectedRegime}`)
    expect(mismatches).toEqual([])
  })
})

describe('F15 — the discoverability kink, and what smoothing it actually buys', () => {
  it('softplus matches relu away from the crossing and is smooth at it', () => {
    const beta = 20
    // Far from zero the two agree to within floating-point noise.
    expect(softplus(2, beta)).toBeCloseTo(2, 6)
    expect(softplus(-2, beta)).toBeCloseTo(0, 6)
    // At the crossing softplus is strictly positive — the price of differentiability.
    expect(softplus(0, beta)).toBeCloseTo(Math.LN2 / beta, 10)
    // And it is finite in both tails (no overflow/underflow).
    expect(Number.isFinite(softplus(1e6, beta))).toBe(true)
    expect(Number.isFinite(softplus(-1e6, beta))).toBe(true)
  })

  it('perceived discoverability is state-independent, so no trajectory crosses the kink', () => {
    // This is why smoothing does NOT improve integration order, contrary to the
    // obvious reading of F15. Pin it so the claim cannot drift back.
    const p = paramsFromPreset(PRESET_BY_ID.cybersecurity)
    const a = computeAux({ U: 1, D: 1, TD: 1, L: 1, E: 1, C: 0.1 }, p)
    const b = computeAux({ U: 900, D: 40, TD: 300, L: 90, E: 400, C: 0.95 }, p)
    expect(a.perceived_discoverability).toBe(b.perceived_discoverability)
  })

  it('the discoverability weights remain inert where PD is strongly negative', () => {
    // Softplus does not fix this: softplus' = sigmoid(beta*x), which underflows for
    // PD << 0. Recorded as an open limitation rather than claimed as fixed.
    const p = paramsFromPreset(PRESET_BY_ID.aviation)
    const f = (w: number) => computeAux(defaultInitState(), { ...p, w_priv: w }).f_doc
    expect(Math.abs(f(1.0) - f(0.1))).toBeLessThan(1e-12)
  })
})

describe('perf guards — a slowdown should fail loudly, not as an opaque timeout', () => {
  // CI failed twice on 5000ms timeouts after the culture loop was closed, because
  // cultureEquilibria lost its closed-form shortcut and had to relax the fast
  // subsystem at every grid point. These budgets are deliberately generous — CI
  // runners are ~4x slower than a dev machine and v8 coverage adds more on top —
  // so they catch a 5-10x regression without flaking on ordinary variance.
  it('findAllEquilibria stays well under budget', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    findAllEquilibria(p) // warm the JIT; we are guarding against algorithmic blowups
    const t0 = performance.now()
    findAllEquilibria(p)
    const ms = performance.now() - t0
    console.log(`findAllEquilibria: ${ms.toFixed(1)} ms (budget 800)`)
    expect(ms).toBeLessThan(800)
  })

  it('a 30-step lever sweep stays well under budget', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const t0 = performance.now()
    sweep1D(p, 'just_culture', { steps: 30 })
    const ms = performance.now() - t0
    console.log(`sweep1D(30): ${ms.toFixed(1)} ms (budget 4000)`)
    expect(ms).toBeLessThan(4000)
  })

  it('a full deterministic run is still effectively instant', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const i = initFromPreset(PRESET_BY_ID.neutral)
    simulate(i, p, S)
    const t0 = performance.now()
    for (let k = 0; k < 20; k++) simulate(i, p, S)
    const ms = (performance.now() - t0) / 20
    console.log(`simulate(): ${ms.toFixed(2)} ms/run (budget 25)`)
    // The UI re-runs this synchronously on every slider drag.
    expect(ms).toBeLessThan(25)
  })
})

// ---------------------------------------------------------------------------
// CENSUS — logged, not asserted (except for universal invariants).
// ---------------------------------------------------------------------------

describe('census (logged for CI visibility)', () => {
  it('preset behaviour and equilibrium structure', () => {
    console.log('\n--- preset census ---')
    for (const pr of PRESETS) {
      const p = paramsFromPreset(pr)
      const s = simulate(initFromPreset(pr), p, S).summary
      const eqs = findAllEquilibria(p)
      const stable = eqs.filter((e) => e.stability === 'stable').length
      console.log(
        `${pr.id.padEnd(26)} regime=${s.regime.padEnd(10)} fdoc=${s.finalFdoc.toFixed(4)} ` +
          `TD=${s.finalState.TD.toFixed(1).padStart(7)} L=${s.finalState.L.toFixed(1).padStart(5)} ` +
          `E=${s.finalState.E.toFixed(1).padStart(7)} C=${s.finalState.C.toFixed(4)} ` +
          `eq=${eqs.length} stable=${stable} bistable=${isBistable(p)}`,
      )
      expect(Number.isFinite(s.finalFdoc)).toBe(true)
    }
  })

  it('monotonicity census', () => {
    let mono = 0
    let flat = 0
    let nonMono = 0
    const interesting: string[] = []
    for (const baseId of ['neutral', 'cybersecurity', 'aviation']) {
      const p0 = paramsFromPreset(PRESET_BY_ID[baseId])
      const i0 = initFromPreset(PRESET_BY_ID[baseId])
      for (const lev of LEVER_KEYS) {
        for (const [name, get] of [
          ['fdoc', (x: ReturnType<typeof simulate>['summary']) => x.finalFdoc],
          ['TD', (x: ReturnType<typeof simulate>['summary']) => x.finalState.TD],
        ] as const) {
          const ys = Array.from({ length: 9 }, (_, k) => get(simulate(i0, { ...p0, [lev]: k / 8 }, S).summary))
          const span = Math.max(...ys) - Math.min(...ys)
          if (span < 1e-9) { flat++; continue }
          let inc = true
          let dec = true
          for (let k = 1; k < ys.length; k++) {
            if (ys[k] < ys[k - 1] - 1e-12) inc = false
            if (ys[k] > ys[k - 1] + 1e-12) dec = false
          }
          if (inc || dec) mono++
          else { nonMono++; interesting.push(`${baseId}/${lev}/${name}`) }
        }
      }
    }
    console.log(`\n--- monotonicity: monotone=${mono} flat=${flat} nonMonotone=${nonMono} ---`)
    console.log('non-monotone cells (the scientifically interesting ones):')
    interesting.forEach((s) => console.log(`   ${s}`))
    expect(mono + flat + nonMono).toBeGreaterThan(0)
  })

  it('lever collinearity (V7.2 target: no pair above 0.999)', () => {
    const p0 = paramsFromPreset(PRESET_BY_ID.neutral)
    const i0 = initFromPreset(PRESET_BY_ID.neutral)
    const grid = Array.from({ length: 9 }, (_, k) => k / 8)
    const resp: Record<string, number[]> = {}
    for (const lev of LEVER_KEYS) {
      resp[lev] = grid.map((x) => simulate(i0, { ...p0, [lev]: x }, S).summary.finalFdoc)
    }
    const corr = (a: number[], b: number[]) => {
      const ma = a.reduce((x, y) => x + y, 0) / a.length
      const mb = b.reduce((x, y) => x + y, 0) / b.length
      let n = 0, da = 0, db = 0
      for (let k = 0; k < a.length; k++) { n += (a[k] - ma) * (b[k] - mb); da += (a[k] - ma) ** 2; db += (b[k] - mb) ** 2 }
      const d = Math.sqrt(da * db)
      return d < 1e-14 ? NaN : n / d
    }
    const pairs: { p: string; r: number }[] = []
    const keys = [...LEVER_KEYS]
    for (let a = 0; a < keys.length; a++)
      for (let b = a + 1; b < keys.length; b++) {
        const r = corr(resp[keys[a]], resp[keys[b]])
        if (!Number.isNaN(r)) pairs.push({ p: `${keys[a]} ~ ${keys[b]}`, r })
      }
    pairs.sort((x, y) => Math.abs(y.r) - Math.abs(x.r))
    const near1 = pairs.filter((x) => Math.abs(x.r) > 0.999)
    console.log(`\n--- collinearity: ${near1.length}/${pairs.length} pairs |r|>0.999 ---`)
    pairs.slice(0, 5).forEach((f) => console.log(`   r=${f.r.toFixed(6)}  ${f.p}`))
    expect(pairs.length).toBeGreaterThan(0)
  })

  it('integration order and stiffness', () => {
    console.log('\n--- integration ---')
    for (const id of ['neutral', 'cybersecurity', 'aviation']) {
      const p = paramsFromPreset(PRESET_BY_ID[id])
      const i = initFromPreset(PRESET_BY_ID[id])
      const ref = integrate(i, p, { horizon: 120, dt: 0.03125, solver: 'rk4' })
      const err = (dt: number) => {
        const t = integrate(i, p, { horizon: 120, dt, solver: 'rk4' })
        const a = t.states[t.states.length - 1]
        const b = ref.states[ref.states.length - 1]
        return Math.sqrt(STOCK_KEYS.reduce((acc, k) => acc + (a[k] - b[k]) ** 2, 0))
      }
      const d1 = err(0.5)
      const d2 = err(0.25)
      const order = d2 > 0 ? Math.log2(d1 / d2) : Infinity
      const J = numericalJacobian(i, p)
      const ev = eigenvalues(J).map((e) => Math.abs(e.re)).filter((x) => x > 1e-12)
      const ratio = Math.max(...ev) / Math.min(...ev)
      console.log(`${id.padEnd(16)} rk4 err(0.5)=${d1.toExponential(2)} observedOrder=${order.toFixed(2)} stiffness=${ratio.toExponential(2)}`)
    }
    expect(true).toBe(true)
  })

  it('aux magnitudes at the contested baseline', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const a = computeAux(defaultInitState(), p) as unknown as Record<string, number>
    console.log('\n--- aux at t=0 (neutral) ---')
    for (const [k, v] of Object.entries(a)) {
      expect(Number.isFinite(v)).toBe(true)
      console.log(`   ${k.padEnd(32)} ${Number(v).toExponential(3)}`)
    }
  })
})
