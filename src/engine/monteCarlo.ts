/**
 * Monte Carlo uncertainty propagation (spec §3.5). Samples parameters from
 * distributions over their registry ranges, runs N seeded trajectories, and
 * returns median + percentile bands for every tracked series, plus the fraction
 * of runs ending in each regime. Reproducible: same seed + config → same result.
 */
import type { State, Params, ParamKey, SimSettings, StockKey } from './types'
import { STOCK_KEYS } from './types'
import { PARAM_SPEC_BY_ID } from './registry'
import { integrate, summarize, type Regime } from './simulate'
import { mulberry32, uniform, triangular, normal, type Rng } from './rng'

export type SamplingDistribution = 'uniform' | 'scenario' | 'triangular' | 'normal'

/** Series we band: the six stocks plus the key auxiliaries (spec §5.2). */
export const MC_SERIES = [...STOCK_KEYS, 'f_doc', 'harm_events'] as const
export type McSeriesKey = (typeof MC_SERIES)[number]

export interface MonteCarloConfig {
  n: number
  seed: number
  distribution: SamplingDistribution
  /** Which parameters to sample; the rest stay fixed at the base value. */
  vary: ParamKey[]
  /** Percentiles to report, e.g. [10, 50, 90]. */
  percentiles: number[]
  settings: SimSettings
  /**
   * Half-width of the `scenario` distribution as a fraction of each parameter's
   * registry range. Ignored by the other distributions.
   */
  spread?: number
}

export interface MonteCarloResult {
  t: number[]
  /** seriesKey → percentile → value-at-each-timestep. */
  bands: Record<string, Record<number, number[]>>
  regimeFractions: Record<Regime, number>
  divergedFraction: number
  /** Distributions of final stocks (for histograms / summary). */
  finalDistributions: Record<StockKey, number[]>
  finalFdoc: number[]
  config: MonteCarloConfig
}

/** Default half-width of the `scenario` band, as a fraction of each param's range. */
export const DEFAULT_SCENARIO_SPREAD = 0.15

/**
 * Draw one parameter value from the chosen distribution.
 *
 * IMPORTANT (AUDIT.md F10). `uniform` ignores `base` entirely and redraws across the
 * whole registry range. That answers "what if we knew nothing about this firm?" —
 * a legitimate question, but NOT uncertainty around the displayed scenario. Because
 * the app ran `uniform` by default, the 10–90% band drawn around *every* preset was
 * the band of the entire lever hypercube, identical for aviation and cybersecurity.
 *
 * `scenario` is the scenario-anchored alternative and is now the UI default: it
 * samples within ±`spread` of the base value (as a fraction of the parameter's
 * range), clipped to the registry bounds. The band then means what a reader
 * assumes it means — uncertainty about *this* scenario.
 */
export function sampleParam(
  id: ParamKey,
  base: number,
  dist: SamplingDistribution,
  rng: Rng,
  spread: number = DEFAULT_SCENARIO_SPREAD,
): number {
  const spec = PARAM_SPEC_BY_ID[id]
  switch (dist) {
    case 'uniform':
      return uniform(rng, spec.min, spec.max)
    case 'scenario': {
      const half = spread * (spec.max - spec.min)
      const lo = Math.max(spec.min, base - half)
      const hi = Math.min(spec.max, base + half)
      return hi <= lo ? base : uniform(rng, lo, hi)
    }
    case 'triangular':
      return triangular(rng, spec.min, base, spec.max)
    case 'normal':
      return normal(rng, base, (spec.max - spec.min) / 6, spec.min, spec.max)
  }
}

export function sampleParams(
  base: Params,
  vary: ParamKey[],
  dist: SamplingDistribution,
  rng: Rng,
  spread: number = DEFAULT_SCENARIO_SPREAD,
): Params {
  const out = { ...base }
  for (const id of vary) out[id] = sampleParam(id, base[id], dist, rng, spread)
  return out
}

/** Linear-interpolated percentile of a (to-be-sorted) numeric array. */
export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return NaN
  if (sortedAsc.length === 1) return sortedAsc[0]
  const rank = (p / 100) * (sortedAsc.length - 1)
  const lo = Math.floor(rank)
  const hi = Math.ceil(rank)
  if (lo === hi) return sortedAsc[lo]
  return sortedAsc[lo] + (rank - lo) * (sortedAsc[hi] - sortedAsc[lo])
}

function seriesValue(key: McSeriesKey, s: State, fdoc: number, harm: number): number {
  if (key === 'f_doc') return fdoc
  if (key === 'harm_events') return harm
  return s[key]
}

export function monteCarlo(base: Params, init: State, config: MonteCarloConfig): MonteCarloResult {
  const rng = mulberry32(config.seed)
  const n = Math.max(1, Math.floor(config.n))

  // Reference time axis from one run (all runs share settings ⇒ same length).
  const ref = integrate(init, base, config.settings)
  const T = ref.t.length

  // Accumulate each series as [timestep][run] for later percentile extraction.
  const acc: Record<string, number[][]> = {}
  for (const key of MC_SERIES) acc[key] = Array.from({ length: T }, () => new Array<number>(n))

  const regimeCounts: Record<Regime, number> = { chilling: 0, learning: 0, contested: 0 }
  let diverged = 0
  const finalDistributions = Object.fromEntries(STOCK_KEYS.map((k) => [k, new Array<number>(n)])) as Record<StockKey, number[]>
  const finalFdoc = new Array<number>(n)

  for (let run = 0; run < n; run++) {
    const params = sampleParams(base, config.vary, config.distribution, rng, config.spread)
    const traj = integrate(init, params, config.settings)
    if (traj.diverged) diverged++
    for (let ti = 0; ti < T; ti++) {
      const s = traj.states[ti]
      const a = traj.aux[ti]
      for (const key of MC_SERIES) acc[key][ti][run] = seriesValue(key, s, a.f_doc, a.harm_events)
    }
    const summary = summarize(traj)
    regimeCounts[summary.regime]++
    for (const k of STOCK_KEYS) finalDistributions[k][run] = summary.finalState[k]
    finalFdoc[run] = summary.finalFdoc
  }

  const bands: Record<string, Record<number, number[]>> = {}
  for (const key of MC_SERIES) {
    bands[key] = {}
    for (const p of config.percentiles) bands[key][p] = new Array<number>(T)
    for (let ti = 0; ti < T; ti++) {
      const col = acc[key][ti].slice().sort((a, b) => a - b)
      for (const p of config.percentiles) bands[key][p][ti] = percentile(col, p)
    }
  }

  return {
    t: ref.t,
    bands,
    regimeFractions: {
      chilling: regimeCounts.chilling / n,
      learning: regimeCounts.learning / n,
      contested: regimeCounts.contested / n,
    },
    divergedFraction: diverged / n,
    finalDistributions,
    finalFdoc,
    config,
  }
}
