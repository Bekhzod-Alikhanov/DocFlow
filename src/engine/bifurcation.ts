/**
 * Bifurcation, tipping, and hysteresis analysis (spec §3.3, §3.4).
 *
 *  - sweep1D: for each value of one lever, enumerate the equilibria and record a
 *    chosen metric on the stable vs unstable branches → the bifurcation diagram,
 *    which exposes the fold (tipping threshold).
 *  - sweep2D: settle the system from a fixed start across a grid of two levers and
 *    record a metric → the 2-parameter tipping heatmap.
 *  - hysteresis: ramp a lever up, then down, carrying the settled state forward
 *    (numerical continuation) → path dependence in the bistable window.
 */
import type { State, Params, LeverKey, SimSettings } from './types'
import { STOCK_KEYS } from './types'
import { defaultInitState, defaultSettings } from './registry'
import { derivatives } from './model'
import { integrate, summarize, type Regime } from './simulate'
import { findAllEquilibria, type Equilibrium } from './equilibria'

export type Metric = 'f_doc' | 'TD' | 'L' | 'C' | 'E_tot' | 'E_pl' | 'E_reg' | 'E_fid' | 'U' | 'R1' | 'R2' | 'R3'

export function metricOfEquilibrium(eq: Equilibrium, metric: Metric): number {
  if (metric === 'f_doc') return eq.fdoc
  if (metric === 'E_tot') return eq.eTot
  return eq.state[metric]
}

function metricOfState(s: State, fdoc: number, metric: Metric, eTot: number): number {
  if (metric === 'f_doc') return fdoc
  if (metric === 'E_tot') return eTot
  return s[metric]
}

export interface BifurcationPoint {
  value: number
  stable: number[]
  unstable: number[]
}

export interface Sweep1DResult {
  leverId: LeverKey
  metric: Metric
  points: BifurcationPoint[]
  /** Lever value(s) where the number of stable attractors changes (fold/tipping). */
  tippingValues: number[]
}

/** Bifurcation sweep of one lever over [min,max], enumerating equilibria per step. */
export function sweep1D(
  params: Params,
  leverId: LeverKey,
  opts: { min?: number; max?: number; steps?: number; metric?: Metric } = {},
): Sweep1DResult {
  const min = opts.min ?? 0
  const max = opts.max ?? 1
  const steps = opts.steps ?? 60
  const metric = opts.metric ?? 'f_doc'
  const points: BifurcationPoint[] = []
  const tippingValues: number[] = []
  let prevStableCount = -1

  for (let i = 0; i <= steps; i++) {
    const value = min + ((max - min) * i) / steps
    const p = { ...params, [leverId]: value }
    const eqs = findAllEquilibria(p)
    const stable = eqs.filter((e) => e.stability === 'stable').map((e) => metricOfEquilibrium(e, metric))
    const unstable = eqs
      .filter((e) => e.stability !== 'stable')
      .map((e) => metricOfEquilibrium(e, metric))
    points.push({ value, stable, unstable })
    if (prevStableCount !== -1 && stable.length !== prevStableCount) tippingValues.push(value)
    prevStableCount = stable.length
  }

  return { leverId, metric, points, tippingValues }
}

export interface Sweep2DResult {
  xId: LeverKey
  yId: LeverKey
  metric: Metric
  xs: number[]
  ys: number[]
  /** z[yi][xi] = settled metric; regime[yi][xi] = settled regime. */
  z: number[][]
  regime: Regime[][]
}

/** 2-lever tipping heatmap: settle from a fixed init across the grid. */
export function sweep2D(
  params: Params,
  xId: LeverKey,
  yId: LeverKey,
  opts: {
    init?: State
    settings?: SimSettings
    nx?: number
    ny?: number
    metric?: Metric
  } = {},
): Sweep2DResult {
  const init = opts.init ?? defaultInitState()
  const settings = opts.settings ?? { ...defaultSettings(), horizon: 360 }
  const nx = opts.nx ?? 25
  const ny = opts.ny ?? 25
  const metric = opts.metric ?? 'TD'
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < nx; i++) xs.push(i / (nx - 1))
  for (let j = 0; j < ny; j++) ys.push(j / (ny - 1))

  const z: number[][] = []
  const regime: Regime[][] = []
  for (let j = 0; j < ny; j++) {
    const zr: number[] = []
    const rr: Regime[] = []
    for (let i = 0; i < nx; i++) {
      const p = { ...params, [xId]: xs[i], [yId]: ys[j] }
      const summary = summarize(integrate(init, p, settings))
      zr.push(metricOfState(summary.finalState, summary.finalFdoc, metric, summary.finalETot))
      rr.push(summary.regime)
    }
    z.push(zr)
    regime.push(rr)
  }
  return { xId, yId, metric, xs, ys, z, regime }
}

export interface HysteresisResult {
  leverId: LeverKey
  metric: Metric
  up: { value: number; metric: number }[]
  down: { value: number; metric: number }[]
  /**
   * True only if the up and down branches differ meaningfully **and** every ramp
   * step actually relaxed. See `relaxed` — a gap between branches means nothing
   * unless both were allowed to settle.
   */
  hasHysteresis: boolean
  /**
   * v0.3.0 (AUDIT.md F14). False if any ramp step finished with a residual above
   * tolerance, i.e. the horizon was too short for the state to settle. Without
   * this the routine could not tell genuine bistability from transient lag, and
   * `hasHysteresis` fired on either. Critical slowing down near a fold makes this
   * a live risk, not a theoretical one.
   */
  relaxed: boolean
  /** Largest per-step equilibrium residual observed across both branches. */
  maxResidual: number
}

/**
 * Hysteresis sweep: ramp the lever up carrying the settled state forward, then
 * ramp back down. In the bistable window the two branches diverge.
 */
export function hysteresis(
  params: Params,
  leverId: LeverKey,
  opts: { min?: number; max?: number; steps?: number; metric?: Metric; init?: State; settings?: SimSettings } = {},
): HysteresisResult {
  const min = opts.min ?? 0
  const max = opts.max ?? 1
  const steps = opts.steps ?? 40
  const metric = opts.metric ?? 'f_doc'
  const settings = opts.settings ?? { ...defaultSettings(), horizon: 240 }

  const up: { value: number; metric: number }[] = []
  const down: { value: number; metric: number }[] = []

  // v0.3.0: track how far each ramp step is from equilibrium. `relaxed` is the
  // guard that separates genuine bistability from incomplete relaxation.
  let maxResidual = 0
  const RELAX_TOL = 1e-4
  const noteResidual = (s: State, p: Params) => {
    const d = derivatives(s, p)
    // Scale-relative so a large TD does not dominate a 0–1 culture residual.
    let r = 0
    for (const k of STOCK_KEYS) r = Math.max(r, Math.abs(d[k]) / (1 + Math.abs(s[k])))
    maxResidual = Math.max(maxResidual, r)
  }

  let state = opts.init ?? defaultInitState()
  for (let i = 0; i <= steps; i++) {
    const value = min + ((max - min) * i) / steps
    const p = { ...params, [leverId]: value }
    const traj = integrate(state, p, settings)
    const s = summarize(traj)
    state = { ...s.finalState }
    noteResidual(state, p)
    up.push({ value, metric: metricOfState(s.finalState, s.finalFdoc, metric, s.finalETot) })
  }
  for (let i = steps; i >= 0; i--) {
    const value = min + ((max - min) * i) / steps
    const p = { ...params, [leverId]: value }
    const traj = integrate(state, p, settings)
    const s = summarize(traj)
    state = { ...s.finalState }
    noteResidual(state, p)
    down.unshift({ value, metric: metricOfState(s.finalState, s.finalFdoc, metric, s.finalETot) })
  }

  let maxGap = 0
  for (let i = 0; i <= steps; i++) maxGap = Math.max(maxGap, Math.abs(up[i].metric - down[i].metric))
  const range =
    Math.max(...up.map((u) => u.metric), ...down.map((d) => d.metric)) -
    Math.min(...up.map((u) => u.metric), ...down.map((d) => d.metric))

  const relaxed = maxResidual < RELAX_TOL
  const branchesDiffer = range > 0 && maxGap > 0.1 * Math.max(range, 1e-9)

  return {
    leverId,
    metric,
    up,
    down,
    // Both conditions required. A gap between branches that were never allowed to
    // settle is transient lag, not path dependence, and must not be reported as
    // hysteresis (AUDIT.md F14).
    hasHysteresis: branchesDiffer && relaxed,
    relaxed,
    maxResidual,
  }
}
