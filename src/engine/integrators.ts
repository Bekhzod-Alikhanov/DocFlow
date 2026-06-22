/**
 * ODE integrators (spec §2.6, §3.1): classic RK4 (default) and explicit Euler
 * (for comparison and the integration-error convergence check). Pure step
 * functions plus a clamping guard that keeps stocks physical without silently
 * masking divergence — every clamp is recorded as a ClampEvent (spec §2.1, §4.5).
 */
import type { State, Params, Solver, ClampEvent, StockKey } from './types'
import { STOCK_KEYS } from './types'
import { STOCK_SPECS } from './registry'
import { derivatives } from './model'

/** Above this magnitude we treat a stock as diverging rather than physical. */
export const RUNAWAY_BOUND = 1e7

function addStates(a: State, b: State, scale: number): State {
  const out = {} as State
  for (const k of STOCK_KEYS) out[k] = a[k] + scale * b[k]
  return out
}

/** One explicit-Euler step (raw, unclamped). */
export function stepEuler(s: State, p: Params, dt: number): State {
  const k = derivatives(s, p)
  return addStates(s, k, dt)
}

/** One classic Runge–Kutta-4 step (raw, unclamped). */
export function stepRK4(s: State, p: Params, dt: number): State {
  const k1 = derivatives(s, p)
  const k2 = derivatives(addStates(s, k1, dt / 2), p)
  const k3 = derivatives(addStates(s, k2, dt / 2), p)
  const k4 = derivatives(addStates(s, k3, dt), p)
  const out = {} as State
  for (const key of STOCK_KEYS) {
    out[key] = s[key] + (dt / 6) * (k1[key] + 2 * k2[key] + 2 * k3[key] + k4[key])
  }
  return out
}

export function step(s: State, p: Params, dt: number, solver: Solver): State {
  return solver === 'euler' ? stepEuler(s, p, dt) : stepRK4(s, p, dt)
}

/**
 * Clamp a raw state to physical bounds, recording any clamp/non-finite events.
 * Returns the clamped state and whether divergence was detected.
 */
export function clampState(
  raw: State,
  step: number,
  t: number,
): { state: State; events: ClampEvent[]; diverged: boolean } {
  const state = {} as State
  const events: ClampEvent[] = []
  let diverged = false

  for (const key of STOCK_KEYS as readonly StockKey[]) {
    const spec = STOCK_SPECS[key]
    let v = raw[key]

    if (!Number.isFinite(v)) {
      diverged = true
      events.push({ step, t, stock: key, kind: 'nonfinite', rawValue: v, clampedTo: spec.default })
      v = spec.default
    }

    if (Math.abs(v) > RUNAWAY_BOUND) {
      diverged = true
      const capped = Math.sign(v) * RUNAWAY_BOUND
      events.push({ step, t, stock: key, kind: 'max', rawValue: v, clampedTo: capped })
      v = capped
    }

    if (v < spec.min) {
      events.push({ step, t, stock: key, kind: 'min', rawValue: v, clampedTo: spec.min })
      v = spec.min
    }
    if (spec.max !== null && v > spec.max) {
      events.push({ step, t, stock: key, kind: 'max', rawValue: v, clampedTo: spec.max })
      v = spec.max
    }

    state[key] = v
  }

  return { state, events, diverged }
}
