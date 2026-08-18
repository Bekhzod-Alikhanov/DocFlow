/**
 * Deterministic simulation driver (spec §2.6, §3.8). Integrates the model over a
 * horizon, recording the full trajectory, all auxiliaries, and any clamp/divergence
 * events, plus summary metrics used by the headline readout and compare view.
 */
import type {
  State,
  Params,
  SimSettings,
  Trajectory,
  Auxiliaries,
  RunRecord,
  ClampEvent,
} from './types'
import { computeAux } from './model'
import { step, clampState, stepRK45Adaptive } from './integrators'
import { MODEL_VERSION } from './version'

/** Hard cap on integration steps — a runaway-loop backstop, far above any real run. */
export const MAX_STEPS = 200_000

/**
 * Number of integration steps for a given horizon/dt.
 *
 * V5.4. This used to read `Math.min(MAX_STEPS, ...)`, which SILENTLY SIMULATED A SHORTER
 * SPAN than the caller asked for. At `horizon 10000, dt 0.01` you got 2,000 months back,
 * labelled as 10,000, with nothing anywhere reporting the difference — the same defect
 * class as F2, where a run pinned against a boundary reported success.
 *
 * It now throws. A request the engine cannot honour is a caller error, not a numerical
 * outcome, and it must not be reported through the same channel as `diverged`. Untrusted
 * settings are clamped at the decode boundary by `sanitizeSettings` so that a corrupt or
 * crafted share link produces a clamped scenario rather than an exception.
 */
export function stepCount(settings: SimSettings): number {
  const dt = Math.max(1e-6, settings.dt)
  const horizon = Math.max(0, settings.horizon)
  const n = Math.max(1, Math.round(horizon / dt))
  if (n > MAX_STEPS) {
    throw new RangeError(
      // 'en-US' pinned: bare toLocaleString() follows the host locale, so the same
      // failure produced "1 000 000" here and "1,000,000" in CI. Error text that varies
      // by machine is not text you can grep for or write a test against.
      `Simulation would need ${n.toLocaleString('en-US')} steps (horizon ${horizon} / dt ${dt}), ` +
        `above the ${MAX_STEPS.toLocaleString('en-US')} cap. Raise dt or shorten the horizon. ` +
        `Refusing rather than silently simulating a shorter span (VALIDATION.md V5.4).`,
    )
  }
  return n
}

/**
 * Largest horizon that can be simulated at a given dt. Used by `sanitizeSettings` to
 * clamp untrusted input to something the engine will accept.
 */
export function maxHorizonFor(dt: number): number {
  return MAX_STEPS * Math.max(1e-6, dt)
}

/**
 * Integrate the model. Returns time, states, auxiliaries (length n+1, sampled at
 * every step), and divergence/clamp diagnostics.
 */
export function integrate(init: State, params: Params, settings: SimSettings): Trajectory {
  const dt = Math.max(1e-6, settings.dt)
  const n = stepCount(settings)

  const t: number[] = new Array(n + 1)
  const states: State[] = new Array(n + 1)
  const aux: Auxiliaries[] = new Array(n + 1)
  const clampEvents: ClampEvent[] = []
  let diverged = false
  // v0.3.0 (AUDIT.md F2): boundary saturation is tracked separately from
  // divergence. A trajectory held together by clamps is not a solution of the
  // differential equation, and v0.2 reported exactly that case as healthy.
  let saturatedSteps = 0
  const adaptive = { accepted: 0, rejected: 0, maxErrorRatio: 0, minStep: Infinity }
  const isAdaptive = settings.solver === 'rk45'

  // Clamp the initial state too, so a user-supplied init can't start out-of-bounds.
  const first = clampState({ ...init }, 0, 0)
  clampEvents.push(...first.events)
  diverged = diverged || first.diverged
  if (first.saturated) saturatedSteps++

  let current = first.state
  t[0] = 0
  states[0] = current
  aux[0] = computeAux(current, params)

  for (let i = 1; i <= n; i++) {
    const time = i * dt
    let raw: State
    if (isAdaptive) {
      const r = stepRK45Adaptive(current, params, dt, { rtol: settings.rtol, atol: settings.atol })
      raw = r.state
      adaptive.accepted += r.accepted
      adaptive.rejected += r.rejected
      adaptive.maxErrorRatio = Math.max(adaptive.maxErrorRatio, r.maxErrorRatio)
      adaptive.minStep = Math.min(adaptive.minStep, r.minStep)
    } else {
      raw = step(current, params, dt, settings.solver)
    }
    const clamped = clampState(raw, i, time)
    if (clamped.events.length) clampEvents.push(...clamped.events)
    diverged = diverged || clamped.diverged
    if (clamped.saturated) saturatedSteps++
    current = clamped.state
    t[i] = time
    states[i] = current
    aux[i] = computeAux(current, params)
  }

  const saturatedFraction = saturatedSteps / (n + 1)
  return {
    t,
    states,
    aux,
    diverged,
    // A single incidental clamp is noise; sustained residence at a bound means the
    // reported trajectory is the clamp's, not the model's. 2% is the threshold.
    saturated: saturatedFraction > 0.02,
    saturatedFraction,
    clampEvents,
    settings,
    adaptive: isAdaptive
      ? { ...adaptive, minStep: Number.isFinite(adaptive.minStep) ? adaptive.minStep : dt }
      : undefined,
  }
}

/** Build a complete, re-runnable provenance record. `timestamp` is supplied by the caller. */
export function buildRunRecord(
  params: Params,
  init: State,
  settings: SimSettings,
  opts: { seed?: number | null; timestamp?: string | null } = {},
): RunRecord {
  return {
    modelVersion: MODEL_VERSION,
    params: { ...params },
    init: { ...init },
    settings: { ...settings },
    seed: opts.seed ?? null,
    timestamp: opts.timestamp ?? null,
  }
}

export type Regime = 'chilling' | 'learning' | 'contested'

export interface SummaryMetrics {
  finalState: State
  finalFdoc: number
  finalHarm: number
  /** Weighted total exposure at the end of the run (v0.3.0 M3). */
  finalETot: number
  /** Per-channel exposure at the end of the run. */
  finalExposure: { pl: number; reg: number; fid: number }
  cumulativeExposure: number
  cumulativeHarm: number
  /** First time f_doc crosses 0.5 relative to its starting side, or null. */
  timeToTip: number | null
  regime: Regime
  diverged: boolean
}

/**
 * Classify the destination regime from the settled state. Thresholds chosen for
 * readability (the model itself defines the attractors); `contested` flags a run
 * that ends in the ambiguous middle band.
 */
export function classifyRegime(finalFdoc: number): Regime {
  if (finalFdoc >= 0.5) return 'learning'
  if (finalFdoc <= 0.2) return 'chilling'
  return 'contested'
}

/** Trapezoidal integral of a per-step series over time. */
function trapz(values: number[], t: number[]): number {
  let sum = 0
  for (let i = 1; i < values.length; i++) {
    sum += 0.5 * (values[i] + values[i - 1]) * (t[i] - t[i - 1])
  }
  return sum
}

export function summarize(traj: Trajectory): SummaryMetrics {
  const last = traj.states.length - 1
  const finalState = traj.states[last]
  const finalFdoc = traj.aux[last].f_doc
  const finalHarm = traj.aux[last].harm_events
  const finalETot = traj.aux[last].E_tot
  const finalExposure = {
    pl: finalState.E_pl,
    reg: finalState.E_reg,
    fid: finalState.E_fid,
  }

  const exposureSeries = traj.aux.map((a) => a.E_tot)
  const harmSeries = traj.aux.map((a) => a.harm_events)
  const cumulativeExposure = trapz(exposureSeries, traj.t)
  const cumulativeHarm = trapz(harmSeries, traj.t)

  // Time to tip: first crossing of f_doc through 0.5 relative to its initial side.
  const f0 = traj.aux[0].f_doc
  const startedBelow = f0 < 0.5
  let timeToTip: number | null = null
  for (let i = 1; i < traj.aux.length; i++) {
    const f = traj.aux[i].f_doc
    if ((startedBelow && f >= 0.5) || (!startedBelow && f < 0.5)) {
      // Linear interpolation to the crossing time for a smoother estimate.
      const fPrev = traj.aux[i - 1].f_doc
      const frac = (0.5 - fPrev) / (f - fPrev)
      timeToTip = traj.t[i - 1] + frac * (traj.t[i] - traj.t[i - 1])
      break
    }
  }

  return {
    finalState,
    finalFdoc,
    finalHarm,
    finalETot,
    finalExposure,
    cumulativeExposure,
    cumulativeHarm,
    timeToTip,
    regime: classifyRegime(finalFdoc),
    diverged: traj.diverged,
  }
}

/** One-call convenience used widely by the UI and analytics. */
export function simulate(
  init: State,
  params: Params,
  settings: SimSettings,
): { trajectory: Trajectory; summary: SummaryMetrics } {
  const trajectory = integrate(init, params, settings)
  return { trajectory, summary: summarize(trajectory) }
}
