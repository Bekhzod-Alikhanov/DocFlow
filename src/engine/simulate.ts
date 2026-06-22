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
import { step, clampState } from './integrators'
import { MODEL_VERSION } from './version'

/** Hard cap on integration steps — a runaway-loop backstop, far above any real run. */
const MAX_STEPS = 200_000

/** Number of integration steps for a given horizon/dt. */
export function stepCount(settings: SimSettings): number {
  const dt = Math.max(1e-6, settings.dt)
  const horizon = Math.max(0, settings.horizon)
  return Math.min(MAX_STEPS, Math.max(1, Math.round(horizon / dt)))
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

  // Clamp the initial state too, so a user-supplied init can't start out-of-bounds.
  const first = clampState({ ...init }, 0, 0)
  clampEvents.push(...first.events)
  diverged = diverged || first.diverged

  let current = first.state
  t[0] = 0
  states[0] = current
  aux[0] = computeAux(current, params)

  for (let i = 1; i <= n; i++) {
    const time = i * dt
    const raw = step(current, params, dt, settings.solver)
    const clamped = clampState(raw, i, time)
    if (clamped.events.length) clampEvents.push(...clamped.events)
    diverged = diverged || clamped.diverged
    current = clamped.state
    t[i] = time
    states[i] = current
    aux[i] = computeAux(current, params)
  }

  return { t, states, aux, diverged, clampEvents, settings }
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

  const exposureSeries = traj.states.map((s) => s.E)
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
