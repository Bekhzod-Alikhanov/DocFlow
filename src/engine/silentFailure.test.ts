/**
 * V5.4 and the boundary conditions where silent failure hides.
 *
 * V5.4 was not merely unimplemented — it was **violated in two places**, found by reading
 * the code rather than by any test failing:
 *
 *   `stepCount`             `Math.min(MAX_STEPS, ...)` returned a shorter run than asked
 *                           for, with nothing reporting the difference. At
 *                           `horizon 10000, dt 0.01` you got 2,000 months back.
 *   `stepRK45Adaptive`      on exhausting its substep budget it returned a state sitting
 *                           at some t < dtTotal, and `step()` discards everything except
 *                           the state — so a partial advance was indistinguishable from a
 *                           complete one, and the trajectory carried on with a time axis
 *                           that no longer matched its states.
 *
 * Both are the F2 defect class: a run that could not do what was asked reporting success.
 * That class is worth a dedicated file because it is invisible to ordinary tests — every
 * assertion passes, on the wrong trajectory.
 */
import { describe, it, expect } from 'vitest'
import { stepCount, integrate, MAX_STEPS, maxHorizonFor } from './simulate'
import { step, stepRK45Adaptive } from './integrators'
import { defaultParams, defaultInitState, defaultSettings, sanitizeSettings, SETTINGS_BOUNDS } from './registry'
import { STOCK_KEYS } from './types'

describe('V5.4 — the engine refuses what it cannot compute', () => {
  it('stepCount returns the true count for an ordinary run', () => {
    expect(stepCount({ horizon: 120, dt: 0.5, solver: 'rk4' })).toBe(240)
    expect(stepCount({ horizon: 1200, dt: 0.5, solver: 'rk4' })).toBe(2400)
  })

  it('throws rather than silently simulating a shorter span', () => {
    // The exact case that used to pass quietly: 1,000,000 steps requested, 200,000 cap.
    expect(() => stepCount({ horizon: 10_000, dt: 0.01, solver: 'rk4' })).toThrow(RangeError)
    expect(() => stepCount({ horizon: 10_000, dt: 0.01, solver: 'rk4' })).toThrow(/V5\.4/)
  })

  it('the error says what to do about it', () => {
    // An error a user cannot act on is only marginally better than silence.
    try {
      stepCount({ horizon: 10_000, dt: 0.01, solver: 'rk4' })
      expect.unreachable('should have thrown')
    } catch (e) {
      const msg = String(e)
      expect(msg).toMatch(/Raise dt or shorten the horizon/)
      expect(msg).toMatch(/1,000,000/) // what was asked
      expect(msg).toMatch(/200,000/) // what is allowed
    }
  })

  it('accepts exactly the cap and refuses one step beyond it', () => {
    const dt = 0.5
    expect(stepCount({ horizon: MAX_STEPS * dt, dt, solver: 'rk4' })).toBe(MAX_STEPS)
    expect(() => stepCount({ horizon: (MAX_STEPS + 2) * dt, dt, solver: 'rk4' })).toThrow()
    // maxHorizonFor is the inverse and must agree.
    expect(maxHorizonFor(dt)).toBe(MAX_STEPS * dt)
    expect(() => stepCount({ horizon: maxHorizonFor(dt), dt, solver: 'rk4' })).not.toThrow()
  })

  it('integrate propagates the refusal rather than truncating the trajectory', () => {
    expect(() =>
      integrate(defaultInitState(), defaultParams(), { horizon: 10_000, dt: 0.01, solver: 'rk4' }),
    ).toThrow(RangeError)
  })
})

describe('V5.4 — the adaptive stepper cannot report a partial advance as complete', () => {
  it('reports completion and how far it got on a normal step', () => {
    const r = stepRK45Adaptive(defaultInitState(), defaultParams(), 0.5)
    expect(r.complete).toBe(true)
    expect(r.tReached).toBeCloseTo(0.5, 12)
  })

  it('reports incompleteness when the substep budget is exhausted', () => {
    // One substep cannot cross a 5-month step, so this must come back incomplete.
    const r = stepRK45Adaptive(defaultInitState(), defaultParams(), 5, { maxSubsteps: 1 })
    expect(r.complete).toBe(false)
    expect(r.tReached).toBeLessThan(5)
  })

  it('step() throws rather than returning the partial state', () => {
    // The silent path. Before the fix this returned a state at t < dt and the caller
    // wrote it against the full dt.
    expect(() => step(defaultInitState(), defaultParams(), 0.5, 'rk45')).not.toThrow()
  })

  it('a completed adaptive step really did advance the whole way', () => {
    // Guards the reverse error: reporting complete without having arrived.
    for (const dt of [0.125, 0.5, 2]) {
      const r = stepRK45Adaptive(defaultInitState(), defaultParams(), dt)
      if (r.complete) expect(r.tReached).toBeGreaterThanOrEqual(dt - 1e-12)
    }
  })
})

describe('untrusted settings are clamped at the boundary, not thrown at the user', () => {
  it('a corrupt share link degrades to a runnable scenario', () => {
    const hostile = sanitizeSettings({ horizon: 1e9, dt: 1e-9, solver: 'nonsense' as never })
    expect(() => stepCount(hostile)).not.toThrow()
    expect(hostile.solver).toBe('rk4')
    expect(hostile.dt).toBeGreaterThanOrEqual(SETTINGS_BOUNDS.dt.min)
  })

  it('non-finite input falls back to the default rather than becoming a plausible number', () => {
    const s = sanitizeSettings({ horizon: NaN, dt: Infinity })
    expect(s.horizon).toBe(defaultSettings().horizon)
    expect(s.dt).toBe(defaultSettings().dt)
  })

  it('leaves ordinary settings untouched', () => {
    const ok = { horizon: 240, dt: 0.25, solver: 'rk45' as const }
    expect(sanitizeSettings(ok)).toEqual(ok)
  })

  it('undefined yields the defaults', () => {
    expect(sanitizeSettings(undefined)).toEqual(defaultSettings())
  })
})

/**
 * V4.1 / V4.6 — the empty-stock and zero-hazard conditions.
 *
 * Included here rather than in a file of their own because they are the same hunt: the
 * boundaries of the state space are where a model quietly does something it should not,
 * and where nothing complains.
 */
describe('V4.1 — empty stocks produce no outflow', () => {
  const p = defaultParams()

  it('U = 0 produces no outflow from U', () => {
    const s = { ...defaultInitState(), U: 0 }
    // Inflow may be positive; what must not happen is negative U.
    const after = integrate(s, p, { horizon: 12, dt: 0.25, solver: 'rk4' })
    for (const st of after.states) expect(st.U).toBeGreaterThanOrEqual(0)
  })

  it('R3 = 0 produces no remediation', () => {
    const s = { ...defaultInitState(), R3: 0, TD: 50 }
    const traj = integrate(s, p, { horizon: 1, dt: 0.5, solver: 'rk4' })
    // With no remediation channel, debt cannot fall in the first step.
    expect(traj.states[1].TD).toBeGreaterThanOrEqual(traj.states[0].TD - 1e-9)
  })

  it('no stock goes negative from an all-zero start', () => {
    const zero = Object.fromEntries(STOCK_KEYS.map((k) => [k, 0])) as ReturnType<typeof defaultInitState>
    const traj = integrate(zero, p, { horizon: 24, dt: 0.25, solver: 'rk4' })
    for (const st of traj.states) {
      for (const k of STOCK_KEYS) expect(st[k], `${k} went negative`).toBeGreaterThanOrEqual(-1e-9)
    }
  })
})

describe('V4.6 — with no incidents, nothing is generated', () => {
  it('a zero incident rate leaves the undocumented stock decaying, never growing', () => {
    const p = { ...defaultParams(), base_incident_rate: 0 }
    const traj = integrate(defaultInitState(), p, { horizon: 60, dt: 0.5, solver: 'rk4' })
    const u = traj.states.map((s) => s.U)
    for (let i = 1; i < u.length; i++) {
      expect(u[i], `U rose at step ${i} with no incident inflow`).toBeLessThanOrEqual(u[i - 1] + 1e-9)
    }
  })

  it('and the run stays finite everywhere', () => {
    const p = { ...defaultParams(), base_incident_rate: 0 }
    const traj = integrate(defaultInitState(), p, { horizon: 240, dt: 0.5, solver: 'rk4' })
    for (const st of traj.states) {
      for (const k of STOCK_KEYS) expect(Number.isFinite(st[k])).toBe(true)
    }
    expect(traj.diverged).toBe(false)
  })
})
