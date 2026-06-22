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
import { defaultInitState, defaultSettings } from './registry'
import { integrate, summarize, type Regime } from './simulate'
import { findAllEquilibria, type Equilibrium } from './equilibria'

export type Metric = 'f_doc' | 'TD' | 'L' | 'C' | 'E' | 'U' | 'D'

export function metricOfEquilibrium(eq: Equilibrium, metric: Metric): number {
  if (metric === 'f_doc') return eq.fdoc
  return eq.state[metric]
}

function metricOfState(s: State, fdoc: number, metric: Metric): number {
  if (metric === 'f_doc') return fdoc
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
      zr.push(metricOfState(summary.finalState, summary.finalFdoc, metric))
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
  /** True if up and down branches differ meaningfully (path dependence). */
  hasHysteresis: boolean
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

  let state = opts.init ?? defaultInitState()
  for (let i = 0; i <= steps; i++) {
    const value = min + ((max - min) * i) / steps
    const p = { ...params, [leverId]: value }
    const traj = integrate(state, p, settings)
    const s = summarize(traj)
    state = { ...s.finalState }
    up.push({ value, metric: metricOfState(s.finalState, s.finalFdoc, metric) })
  }
  for (let i = steps; i >= 0; i--) {
    const value = min + ((max - min) * i) / steps
    const p = { ...params, [leverId]: value }
    const traj = integrate(state, p, settings)
    const s = summarize(traj)
    state = { ...s.finalState }
    down.unshift({ value, metric: metricOfState(s.finalState, s.finalFdoc, metric) })
  }

  let maxGap = 0
  for (let i = 0; i <= steps; i++) maxGap = Math.max(maxGap, Math.abs(up[i].metric - down[i].metric))
  const range = Math.max(...up.map((u) => u.metric), ...down.map((d) => d.metric)) - Math.min(...up.map((u) => u.metric), ...down.map((d) => d.metric))
  return { leverId, metric, up, down, hasHysteresis: range > 0 && maxGap > 0.1 * Math.max(range, 1e-9) }
}
