/**
 * Public API of the DocFlow simulation engine. Import from here (`@/engine`) rather
 * than reaching into individual modules. This barrel is the engine's contract with
 * the rest of the app — and the surface that a future Python/CLI port would mirror.
 */
export * from './types'
export { MODEL_VERSION } from './version'
export {
  PARAM_SPECS,
  PARAM_SPEC_BY_ID,
  STOCK_SPECS,
  ALL_PARAM_KEYS,
  defaultParams,
  defaultInitState,
  defaultSettings,
  sanitizeParams,
  clampParam,
  registryKeySet,
} from './registry'
export {
  sigmoid,
  relu,
  perceivedDiscoverability,
  driveToDocument,
  documentationFraction,
  computeAux,
  derivatives,
  derivativesFromAux,
} from './model'
export { stepEuler, stepRK4, step, clampState, RUNAWAY_BOUND } from './integrators'
export {
  integrate,
  simulate,
  summarize,
  classifyRegime,
  buildRunRecord,
  stepCount,
  type Regime,
  type SummaryMetrics,
} from './simulate'
export { PRESETS, PRESET_BY_ID, DEFAULT_PRESET_ID } from './presets'
export {
  paramsFromPreset,
  initFromPreset,
  scenarioFromPreset,
  defaultScenario,
} from './scenario'

export {
  findEquilibrium,
  findAllEquilibria,
  cultureEquilibria,
  fastEquilibriumAt,
  stableAttractors,
  isBistable,
  classifyStability,
  numericalJacobian,
  type Equilibrium,
  type StabilityClass,
} from './equilibria'
export {
  eigenvalues,
  maxRealPart,
  isStable,
  solveLinear,
  type Complex,
  type Matrix,
} from './linalg'
export {
  sweep1D,
  sweep2D,
  hysteresis,
  metricOfEquilibrium,
  type Metric,
  type Sweep1DResult,
  type Sweep2DResult,
  type HysteresisResult,
  type BifurcationPoint,
} from './bifurcation'
export {
  monteCarlo,
  sampleParams,
  sampleParam,
  percentile,
  MC_SERIES,
  type MonteCarloConfig,
  type MonteCarloResult,
  type SamplingDistribution,
  type McSeriesKey,
} from './monteCarlo'
export {
  sobolAnalysis,
  sobolIndicesUnit,
  prccAnalysis,
  tornado,
  latinHypercube,
  modelOutput,
  OUTPUT_LABELS,
  type SobolResult,
  type PrccResult,
  type TornadoBar,
  type OutputName,
} from './sensitivity'
