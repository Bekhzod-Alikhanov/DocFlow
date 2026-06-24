/**
 * Core type system for the DocFlow simulation engine.
 *
 * The engine is a pure, dependency-light, framework-agnostic module (spec §6):
 * nothing here imports React, the DOM, or any I/O. It is the portable scientific
 * core — it could be compiled to a worker, ported to Python, or run from a CLI.
 */

// ---------------------------------------------------------------------------
// Stocks (state variables integrated over time) — spec §2.1
// ---------------------------------------------------------------------------

/** Fixed ordering of the six stocks; used for vectors, Jacobians, and display. */
export const STOCK_KEYS = ['U', 'D', 'TD', 'L', 'E', 'C'] as const
export type StockKey = (typeof STOCK_KEYS)[number]

/** The system state: one number per stock. */
export type State = Record<StockKey, number>

/** Human-readable metadata for each stock (labels, units, display bounds). */
export interface StockSpec {
  id: StockKey
  label: string
  short: string
  unit: string
  /** Physical lower bound (all stocks are non-negative). */
  min: number
  /** Physical/normalized upper bound, or null if only softly bounded. */
  max: number | null
  default: number
  note: string
}

// ---------------------------------------------------------------------------
// Parameters: levers (sliders) + structural constants — spec §2.4, §2.5
// ---------------------------------------------------------------------------

/** Policy / institutional levers, all in [0, 1]. */
export const LEVER_KEYS = [
  'privilege_strength',
  'just_culture',
  'mandatory_reporting',
  'pld_penalty',
  'recipient_enforcer_separation',
  'translation_layer',
  'workflow_protection',
  'original_records_boundary',
  'safe_harbor_non_admission',
  'effective_challenge',
  'near_miss_tier',
  'intermediary_capacity',
] as const
export type LeverKey = (typeof LEVER_KEYS)[number]

/** Structural parameters (the Advanced panel) — functional-form coefficients. */
export const STRUCTURAL_KEYS = [
  // documentation fraction f_doc + perceived-discoverability weights (§2.2)
  'gain',
  'threshold',
  'a_c',
  'a_jc',
  'a_m',
  'a_disc',
  'w_m',
  'w_p',
  'w_priv',
  'w_sep',
  'w_tl',
  'w_workflow',
  'w_records',
  'w_safe',
  // incident generation (§2.3)
  'base_incident_rate',
  'alpha_td',
  'TD_ref',
  'td_sat',
  'beta_L',
  // learning (§2.3)
  'eta_learn',
  'base_eff',
  'tl_boost',
  'intermediary_efficiency_boost',
  'challenge_learning_boost',
  'near_miss_learning_boost',
  'delta_L',
  // documented-incident & debt dynamics (§2.3)
  'rho',
  'challenge_remediation_boost',
  'kappa_D',
  'mu',
  'sigma',
  'td_baseline',
  'delta_TD',
  'gamma',
  // exposure (§2.3)
  'phi_doc',
  'phi_harm',
  'phi_pld',
  'theta_E',
  // culture (§2.3)
  'omega',
  'psi',
  'lambda_C',
  'a_sep',
  'a_jc_c',
] as const
export type StructuralKey = (typeof STRUCTURAL_KEYS)[number]

/** Every tunable parameter id (levers ∪ structural). */
export type ParamKey = LeverKey | StructuralKey

/** A complete parameter vector: every ParamKey mapped to a value. */
export type Params = Record<ParamKey, number>

/**
 * Evidence basis for a parameter (spec §2.5). Drives the epistemic-integrity
 * UI: `illustrative-assumption` values are rendered visually distinct from
 * `empirical-anchor` ones. No coefficient may claim `empirical-anchor` without
 * a real citation in `source`.
 */
export type EvidenceBasis = 'empirical-anchor' | 'expert-estimate' | 'illustrative-assumption'

/** Grouping for the Advanced panel / Assumptions table. */
export type ParamGroup =
  | 'lever'
  | 'documentation'
  | 'incidents'
  | 'learning'
  | 'debt'
  | 'exposure'
  | 'culture'

/** Full metadata record for a single parameter (spec §2.5 mandatory schema). */
export interface ParamSpec {
  id: ParamKey
  label: string
  unit: string
  default: number
  min: number
  max: number
  group: ParamGroup
  evidence_basis: EvidenceBasis
  source: string
  note: string
  /** false → a primary lever slider; true → lives in the Advanced panel. */
  advanced: boolean
  /** Optional UI grouping for primary lever surfaces. */
  leverFamily?: 'legal' | 'learning' | 'governance'
}

// ---------------------------------------------------------------------------
// Integration & simulation — spec §2.6, §3.1
// ---------------------------------------------------------------------------

export type Solver = 'rk4' | 'euler'

export interface SimSettings {
  /** Number of steps (interpreted as months). Default 120. */
  horizon: number
  /** Integration step size. */
  dt: number
  solver: Solver
}

/**
 * Auxiliary (derived) quantities computed at each step. These are not stocks
 * but are charted and reasoned about (f_doc, harm_events, perceived
 * discoverability, the two competing culture pressures, etc.) — spec §5.2.
 */
export interface Auxiliaries {
  perceived_discoverability: number
  drive_to_document: number
  f_doc: number
  incident_inflow: number
  to_D: number
  to_U: number
  translation_layer_efficiency: number
  learning_gain: number
  remediation: number
  d_closeout: number
  belated_doc: number
  u_to_debt: number
  harm_events: number
  safety_wins: number
  backfire: number
  near_miss_signal: number
  private_ordering_gap: number
  accountability_legitimacy: number
  safe_to_report_score: number
  learning_yield: number
  litigation_pressure: number
  policy_scaffold_dependency: number
}

export const AUX_KEYS = [
  'perceived_discoverability',
  'drive_to_document',
  'f_doc',
  'incident_inflow',
  'to_D',
  'to_U',
  'translation_layer_efficiency',
  'learning_gain',
  'remediation',
  'd_closeout',
  'belated_doc',
  'u_to_debt',
  'harm_events',
  'safety_wins',
  'backfire',
  'near_miss_signal',
  'private_ordering_gap',
  'accountability_legitimacy',
  'safe_to_report_score',
  'learning_yield',
  'litigation_pressure',
  'policy_scaffold_dependency',
] as const satisfies readonly (keyof Auxiliaries)[]

/** Records a clamp or numerical-guard event so divergence is never hidden (spec §2.1, §4.5). */
export interface ClampEvent {
  step: number
  t: number
  stock: StockKey | 'global'
  kind: 'min' | 'max' | 'nonfinite'
  rawValue: number
  clampedTo: number
}

/** Result of a deterministic single run. */
export interface Trajectory {
  t: number[]
  states: State[]
  aux: Auxiliaries[]
  /** True if a NaN/Inf or runaway bound was hit (results are then suspect). */
  diverged: boolean
  clampEvents: ClampEvent[]
  settings: SimSettings
}

/**
 * Complete, re-runnable provenance for a simulation (spec §3.8). `timestamp` is
 * intentionally optional and supplied by the (impure) caller — the engine never
 * reads the clock, preserving determinism.
 */
export interface RunRecord {
  modelVersion: string
  params: Params
  init: State
  settings: SimSettings
  seed: number | null
  timestamp: string | null
}

// ---------------------------------------------------------------------------
// Scenarios & presets — spec §5.6, §5.7
// ---------------------------------------------------------------------------

/** A citation / reliability caveat attached to a preset (spec §4.4). */
export interface Citation {
  text: string
  /** A reliability caveat to surface in-app, e.g. the "95% is an estimate" flag. */
  caveat?: string
}

export type ConfidenceLevel = 'low' | 'medium' | 'high'
export type CaveatLevel = 'illustrative' | 'source-backed' | 'needs-verification'

export interface LeverRationale {
  basis: string
  confidence: ConfidenceLevel
  caveatLevel: CaveatLevel
  sourceNote: string
}

export type PresetLeverRationales = Record<LeverKey, LeverRationale>

export interface Preset {
  id: string
  name: string
  /** Short narrative shown on the preset card. */
  blurb: string
  /** Which attractor this preset is expected to settle toward, for the UI. */
  expectedRegime: 'chilling' | 'learning' | 'contested'
  /** Sparse overrides applied on top of registry defaults. */
  overrides: Partial<Params>
  init?: Partial<State>
  citations: Citation[]
  leverRationales: PresetLeverRationales
}

/** A named, saveable scenario — the unit of persistence, export, and sharing. */
export interface Scenario {
  id: string
  name: string
  description: string
  /** Origin preset id, if derived from one. */
  presetId: string | null
  params: Params
  init: State
  settings: SimSettings
  annotations: string
  /** Stamped by the persistence layer (impure), not the engine. */
  createdAt: string | null
  updatedAt: string | null
}
