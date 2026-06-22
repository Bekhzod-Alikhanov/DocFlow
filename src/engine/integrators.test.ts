import { describe, it, expect } from 'vitest'
import { stepEuler, stepRK4, clampState, RUNAWAY_BOUND } from './integrators'
import { integrate } from './simulate'
import { defaultParams } from './registry'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'
import type { State, SimSettings } from './types'

const s0: State = { U: 20, D: 5, TD: 10, L: 30, E: 10, C: 0.4 }

describe('integrators: step functions', () => {
  it('Euler and RK4 produce finite next states', () => {
    const p = defaultParams()
    for (const next of [stepEuler(s0, p, 0.5), stepRK4(s0, p, 0.5)]) {
      for (const v of Object.values(next)) expect(Number.isFinite(v)).toBe(true)
    }
  })

  it('RK4 and Euler agree to first order as dt → 0', () => {
    const p = defaultParams()
    const e = stepEuler(s0, p, 1e-4)
    const r = stepRK4(s0, p, 1e-4)
    for (const k of ['U', 'D', 'TD', 'L', 'E', 'C'] as const) {
      expect(r[k]).toBeCloseTo(e[k], 6)
    }
  })
})

describe('integrators: clamping never hides divergence (spec §2.1, §4.5)', () => {
  it('clamps negative stocks to 0 and records min events', () => {
    const { state, events } = clampState({ U: -5, D: 5, TD: 10, L: 30, E: 10, C: 0.4 }, 3, 1.5)
    expect(state.U).toBe(0)
    expect(events.some((e) => e.stock === 'U' && e.kind === 'min')).toBe(true)
  })

  it('clamps C to [0,1] and L to [0,100]', () => {
    expect(clampState({ ...s0, C: 1.5 }, 1, 1).state.C).toBe(1)
    expect(clampState({ ...s0, C: -0.2 }, 1, 1).state.C).toBe(0)
    expect(clampState({ ...s0, L: 250 }, 1, 1).state.L).toBe(100)
  })

  it('flags non-finite values as divergence and resets to default', () => {
    const { state, diverged, events } = clampState({ ...s0, TD: Number.NaN }, 5, 2.5)
    expect(diverged).toBe(true)
    expect(events.some((e) => e.kind === 'nonfinite')).toBe(true)
    expect(Number.isFinite(state.TD)).toBe(true)
  })

  it('flags runaway magnitudes as divergence', () => {
    const { diverged, state } = clampState({ ...s0, U: 1e9 }, 1, 1)
    expect(diverged).toBe(true)
    expect(state.U).toBeLessThanOrEqual(RUNAWAY_BOUND)
  })
})

describe('integrators: integration-error convergence (spec §2.6, §3.1)', () => {
  const params = paramsFromPreset(PRESET_BY_ID.aviation)
  const init = initFromPreset(PRESET_BY_ID.aviation)

  function finalState(dt: number, solver: 'rk4' | 'euler'): State {
    const settings: SimSettings = { horizon: 120, dt, solver }
    const traj = integrate(init, params, settings)
    return traj.states[traj.states.length - 1]
  }

  it('RK4 trajectory converges when dt is halved (within tolerance)', () => {
    const coarse = finalState(1.0, 'rk4')
    const fine = finalState(0.5, 'rk4')
    const finer = finalState(0.25, 'rk4')
    // The dt/2 → dt/4 change should be much smaller than dt → dt/2 (high-order convergence).
    const d1 = Math.abs(coarse.TD - fine.TD)
    const d2 = Math.abs(fine.TD - finer.TD)
    expect(d2).toBeLessThanOrEqual(d1 + 1e-9)
    expect(Math.abs(fine.C - finer.C)).toBeLessThan(1e-2)
  })

  it('Euler converges to the same answer as RK4 at small dt', () => {
    const euler = finalState(0.05, 'euler')
    const rk4 = finalState(0.05, 'rk4')
    expect(euler.TD).toBeCloseTo(rk4.TD, 1)
    expect(euler.C).toBeCloseTo(rk4.C, 2)
  })
})
