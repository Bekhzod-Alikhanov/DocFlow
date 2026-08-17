/**
 * M2 remainder (docs/plan/ROADMAP.md): adaptive RK45, the `saturated` flag, and
 * `converged` gating. Each closes a specific way v0.2 could report a bad result as
 * a good one.
 */
import { describe, it, expect } from 'vitest'
import { STOCK_KEYS } from './types'
import type { State } from './types'
import { stepRK45Adaptive, DEFAULT_RTOL } from './integrators'
import { defaultParams, defaultInitState } from './registry'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESETS, PRESET_BY_ID } from './presets'
import { integrate, simulate } from './simulate'
import {
  findAllEquilibria,
  stableAttractors,
  isBistable,
  isReliableEquilibrium,
  EQUILIBRIUM_RESIDUAL_TOL,
} from './equilibria'

const l2 = (a: State, b: State) =>
  Math.sqrt(STOCK_KEYS.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0))

describe('adaptive RK45 — error control', () => {
  it('agrees with a tightly-resolved RK4 reference', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const i = initFromPreset(PRESET_BY_ID.neutral)
    const ref = integrate(i, p, { horizon: 120, dt: 0.015625, solver: 'rk4' })
    const ad = integrate(i, p, { horizon: 120, dt: 0.5, solver: 'rk45' })
    const err = l2(ad.states[ad.states.length - 1], ref.states[ref.states.length - 1])
    expect(err).toBeLessThan(1e-4)
  })

  it('tightening the tolerance reduces the error', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const i = initFromPreset(PRESET_BY_ID.neutral)
    const ref = integrate(i, p, { horizon: 120, dt: 0.015625, solver: 'rk4' })
    const last = (tr: ReturnType<typeof integrate>) => tr.states[tr.states.length - 1]
    const loose = l2(last(integrate(i, p, { horizon: 120, dt: 0.5, solver: 'rk45', rtol: 1e-4, atol: 1e-6 })), last(ref))
    const tight = l2(last(integrate(i, p, { horizon: 120, dt: 0.5, solver: 'rk45', rtol: 1e-10, atol: 1e-12 })), last(ref))
    expect(tight).toBeLessThanOrEqual(loose)
  })

  it('reports substep diagnostics the fixed-step solvers cannot', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const tr = integrate(initFromPreset(PRESET_BY_ID.neutral), p, { horizon: 120, dt: 0.5, solver: 'rk45' })
    expect(tr.adaptive).toBeDefined()
    expect(tr.adaptive!.accepted).toBeGreaterThan(0)
    expect(Number.isFinite(tr.adaptive!.maxErrorRatio)).toBe(true)
    // Fixed-step runs carry no adaptive block at all.
    expect(integrate(initFromPreset(PRESET_BY_ID.neutral), p, { horizon: 120, dt: 0.5, solver: 'rk4' }).adaptive).toBeUndefined()
  })

  it('takes more substeps where the dynamics are fast', () => {
    // The contested baseline moves quickly early and settles later; the controller
    // should not spend the same effort on both halves.
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const i = initFromPreset(PRESET_BY_ID.neutral)
    const early = stepRK45Adaptive(i, p, 5)
    const settled = simulate(i, p, { horizon: 240, dt: 0.5, solver: 'rk4' }).summary.finalState
    const late = stepRK45Adaptive(settled, p, 5)
    expect(early.accepted).toBeGreaterThanOrEqual(late.accepted)
  })

  it('is deterministic', () => {
    const p = defaultParams()
    const a = stepRK45Adaptive(defaultInitState(), p, 1)
    const b = stepRK45Adaptive(defaultInitState(), p, 1)
    expect(a.state).toEqual(b.state)
    expect(a.accepted).toBe(b.accepted)
  })

  it('uses the documented default tolerance', () => {
    expect(DEFAULT_RTOL).toBeLessThanOrEqual(1e-6)
  })
})

describe('saturated flag (AUDIT.md F2)', () => {
  it('is false and quantified for every shipped preset', () => {
    for (const pr of PRESETS) {
      const tr = integrate(initFromPreset(pr), paramsFromPreset(pr), { horizon: 360, dt: 0.5, solver: 'rk4' })
      expect(tr.saturated, `${pr.id} should not rely on clamping`).toBe(false)
      expect(tr.saturatedFraction).toBe(0)
    }
  })

  it('fires when a stock really is pinned at a bound', () => {
    // Force the old failure mode: start culture above its bound so the clamp must
    // act. v0.2 would have reported diverged=false and said nothing at all.
    const p = paramsFromPreset(PRESET_BY_ID.aviation)
    const bad: State = { ...initFromPreset(PRESET_BY_ID.aviation), C: 5, TD: -20 }
    const tr = integrate(bad, p, { horizon: 12, dt: 0.5, solver: 'rk4' })
    expect(tr.saturatedFraction).toBeGreaterThan(0)
    expect(tr.clampEvents.length).toBeGreaterThan(0)
  })

  it('is reported separately from divergence', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const tr = integrate(initFromPreset(PRESET_BY_ID.neutral), p, { horizon: 120, dt: 0.5, solver: 'rk4' })
    expect(tr.diverged).toBe(false)
    expect(typeof tr.saturated).toBe('boolean')
  })
})

describe('converged gating (AUDIT.md F13)', () => {
  it('every reported attractor is a genuine, in-domain fixed point', () => {
    for (const pr of PRESETS) {
      const p = paramsFromPreset(pr)
      for (const e of stableAttractors(p)) {
        expect(e.converged, `${pr.id}: attractor must have converged`).toBe(true)
        expect(e.residualNorm).toBeLessThan(EQUILIBRIUM_RESIDUAL_TOL)
        expect(e.C).toBeGreaterThanOrEqual(-1e-9)
        expect(e.C).toBeLessThanOrEqual(1 + 1e-9)
      }
    }
  })

  it('rejects a non-converged point regardless of its eigenvalues', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const real = findAllEquilibria(p).find((e) => e.stability === 'stable')!
    // Same point, but declared non-converged with a large residual — exactly the
    // object v0.2 would have counted as an attractor.
    expect(isReliableEquilibrium(real)).toBe(true)
    expect(isReliableEquilibrium({ ...real, converged: false })).toBe(false)
    expect(isReliableEquilibrium({ ...real, residualNorm: 1 })).toBe(false)
  })

  it('rejects an out-of-domain point', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const real = findAllEquilibria(p).find((e) => e.stability === 'stable')!
    expect(isReliableEquilibrium({ ...real, C: 1.5, state: { ...real.state, C: 1.5 } })).toBe(false)
    expect(isReliableEquilibrium({ ...real, state: { ...real.state, L: 250 } })).toBe(false)
    expect(isReliableEquilibrium({ ...real, state: { ...real.state, U: -5 } })).toBe(false)
  })

  it('isBistable counts only reliable attractors', () => {
    // Regression on the specific v0.2 path: bistability asserted from points the
    // solver never actually converged to.
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    expect(isBistable(p)).toBe(stableAttractors(p).length >= 2)
    for (const e of stableAttractors(p)) expect(isReliableEquilibrium(e)).toBe(true)
  })
})
