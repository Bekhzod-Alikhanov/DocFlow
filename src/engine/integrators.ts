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

// ---------------------------------------------------------------------------
// Adaptive Dormand–Prince 5(4) — v0.3.0 (docs/plan/MODEL_v3_SPEC.md §9)
// ---------------------------------------------------------------------------

/**
 * Dormand–Prince tableau. The method computes a 5th-order solution and an
 * embedded 4th-order one from the same seven stage evaluations; their difference
 * is a local error estimate, which is what buys step-size control for free.
 *
 * Why this matters here rather than being numerical vanity: fixed-step RK4 gives
 * no error estimate at all, so v0.2 could not tell an accurate trajectory from an
 * inaccurate one. It took a clamp firing on >83% of steps to reveal that RK4 had
 * silently degraded to first order (AUDIT.md F11) — an adaptive method would have
 * reported the error growth immediately.
 */
const DP_C = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1] as const
const DP_A: readonly (readonly number[])[] = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
]
/** 5th-order weights (FSAL: identical to the last A row). */
const DP_B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0] as const
/** Embedded 4th-order weights. */
const DP_B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40] as const

export interface AdaptiveResult {
  /**
   * False when the substep budget ran out before the step reached `dtTotal`.
   *
   * V5.4, second instance. This routine used to return `{ state: y }` on exhaustion with
   * `y` sitting at some t < dtTotal, and `step()` discards everything but the state — so
   * a step that advanced a fraction of the requested dt was indistinguishable from one
   * that completed. Silent partial progress is worse than a thrown error: the trajectory
   * carries on with a time axis that no longer matches the states on it.
   */
  complete: boolean
  /** How far the step actually advanced. Equals dtTotal when `complete`. */
  tReached: number
  state: State
  /** Number of accepted substeps taken across the interval. */
  accepted: number
  /** Number of rejected (retried) substeps. */
  rejected: number
  /** Largest normalised local error ratio seen; > 1 means a step was rejected. */
  maxErrorRatio: number
  /** Smallest substep actually used — a proxy for local stiffness. */
  minStep: number
}

export interface AdaptiveOpts {
  rtol?: number
  atol?: number
  /** Refuse to shrink below this; prevents a pathological RHS from hanging. */
  minStep?: number
  maxSubsteps?: number
}

export const DEFAULT_RTOL = 1e-7
export const DEFAULT_ATOL = 1e-9

/** One raw DP5(4) trial step. Returns both orders so the caller can estimate error. */
function dp45Trial(s: State, p: Params, h: number): { y5: State; y4: State } {
  const k: State[] = []
  for (let i = 0; i < 7; i++) {
    let stage = s
    if (i > 0) {
      const acc = {} as State
      for (const key of STOCK_KEYS) {
        let sum = 0
        for (let j = 0; j < i; j++) sum += DP_A[i][j] * k[j][key]
        acc[key] = s[key] + h * sum
      }
      stage = acc
    }
    void DP_C // tableau nodes are implicit in the A rows for this method
    k.push(derivatives(stage, p))
  }
  const y5 = {} as State
  const y4 = {} as State
  for (const key of STOCK_KEYS) {
    let s5 = 0
    let s4 = 0
    for (let i = 0; i < 7; i++) {
      s5 += DP_B5[i] * k[i][key]
      s4 += DP_B4[i] * k[i][key]
    }
    y5[key] = s[key] + h * s5
    y4[key] = s[key] + h * s4
  }
  return { y5, y4 }
}

/**
 * Integrate across `dtTotal` using adaptive substeps, returning the state at the
 * far end. The sample grid the caller sees is unchanged — adaptivity happens
 * *between* sample points — so `Trajectory` keeps its regular `t[]` contract while
 * the solution inside each interval is error-controlled.
 */
export function stepRK45Adaptive(
  s: State,
  p: Params,
  dtTotal: number,
  opts: AdaptiveOpts = {},
): AdaptiveResult {
  const rtol = opts.rtol ?? DEFAULT_RTOL
  const atol = opts.atol ?? DEFAULT_ATOL
  const hardMin = opts.minStep ?? dtTotal * 1e-8
  const maxSubsteps = opts.maxSubsteps ?? 10_000

  let t = 0
  let y = s
  let h = dtTotal
  let accepted = 0
  let rejected = 0
  let maxErrorRatio = 0
  let minStep = dtTotal

  for (let iter = 0; iter < maxSubsteps && t < dtTotal - 1e-15; iter++) {
    h = Math.min(h, dtTotal - t)
    const { y5, y4 } = dp45Trial(y, p, h)

    // Normalised error: componentwise, relative to the larger of |y| and |y5|.
    let err = 0
    let finite = true
    for (const key of STOCK_KEYS) {
      if (!Number.isFinite(y5[key]) || !Number.isFinite(y4[key])) {
        finite = false
        break
      }
      const scale = atol + rtol * Math.max(Math.abs(y[key]), Math.abs(y5[key]))
      err = Math.max(err, Math.abs(y5[key] - y4[key]) / scale)
    }

    if (!finite) {
      // Shrink hard rather than propagate a non-finite state.
      rejected++
      h *= 0.1
      if (h < hardMin)
        return { state: y5, accepted, rejected, maxErrorRatio: Infinity, minStep: h, complete: false, tReached: t }
      continue
    }

    maxErrorRatio = Math.max(maxErrorRatio, err)

    if (err <= 1 || h <= hardMin) {
      y = y5
      t += h
      accepted++
      minStep = Math.min(minStep, h)
    } else {
      rejected++
    }

    // PI-free standard controller with safety factor and bounded growth/shrink.
    const factor = err === 0 ? 5 : 0.9 * Math.pow(err, -1 / 5)
    h *= Math.min(5, Math.max(0.2, factor))
    if (h < hardMin) h = hardMin
  }

  return {
    state: y,
    accepted,
    rejected,
    maxErrorRatio,
    minStep,
    complete: t >= dtTotal - 1e-12,
    tReached: t,
  }
}

export function step(s: State, p: Params, dt: number, solver: Solver): State {
  if (solver === 'euler') return stepEuler(s, p, dt)
  if (solver === 'rk45') {
    const r = stepRK45Adaptive(s, p, dt)
    // `step`'s contract is "advance by dt". If the adaptive stepper could not, saying so
    // is the only honest option: the caller is about to write this state against a time
    // that it never reached.
    if (!r.complete) {
      throw new RangeError(
        `Adaptive step did not complete: reached t = ${r.tReached.toPrecision(6)} of ${dt} ` +
          `after ${r.accepted} accepted and ${r.rejected} rejected substeps ` +
          `(max error ratio ${r.maxErrorRatio.toPrecision(3)}). The problem is too stiff for ` +
          `the substep budget at this dt (VALIDATION.md V5.4).`,
      )
    }
    return r.state
  }
  return stepRK4(s, p, dt)
}

/**
 * Clamp a raw state to physical bounds, recording any clamp/non-finite events.
 * Returns the clamped state and whether divergence was detected.
 */
export function clampState(
  raw: State,
  step: number,
  t: number,
): { state: State; events: ClampEvent[]; diverged: boolean; saturated: boolean } {
  const state = {} as State
  const events: ClampEvent[] = []
  let diverged = false
  // v0.3.0: bound clamps now surface as `saturated` rather than passing silently.
  let saturated = false

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
      saturated = true
      v = spec.min
    }
    if (spec.max !== null && v > spec.max) {
      events.push({ step, t, stock: key, kind: 'max', rawValue: v, clampedTo: spec.max })
      saturated = true
      v = spec.max
    }

    state[key] = v
  }

  return { state, events, diverged, saturated }
}
