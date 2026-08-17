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
/**
 * v0.3.0 M3: the state vector now carries the paper's three-channel architecture
 * and three opposing exposure gradients.
 *
 * `D` (documented incidents) is RETIRED: it conflated three artifacts with
 * materially different evidentiary status, which is why v0.2 could not express the
 * valve, the tripwire, or the Rule 407 hedge, and why the protection levers all
 * collapsed onto a single pathway (AUDIT.md F6).
 *
 * `E` (lumped exposure) is RETIRED: the paper's central claim is that exposure
 * gradients OPPOSE one another — candour raises products-liability exposure through
 * discovery while suppression raises regulatory and fiduciary exposure — and a
 * single lumped stock that fed nothing could not represent that at all.
 */
export const STOCK_KEYS = [
  'U',
  'R1',
  'R2',
  'R3',
  'TD',
  'L',
  'E_pl',
  'E_reg',
  'E_fid',
  'C',
] as const
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
  // v0.3.0 M3b: `privilege_strength` is GONE as a lever. In the case law privilege
  // is not a dial a firm sets — it is an OUTCOME of design choices that a court
  // later evaluates, and it can be lost. The four levers below are those design
  // choices; `privilege_survival` is the computed result (ADR: MODEL_v3_SPEC 5).
  'precommit',
  'significant_purpose',
  'valve_discipline',
  'kovel_evaluator',
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
  'pd_sharpness',
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
  'td_k',
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
  // v0.3.0 M3b — endogenous privilege and the one-way valve
  'b0',
  'b_pre',
  'b_sep',
  'b_purp',
  'b_valve',
  'p_court',
  'lambda_base',
  'l_kovel',
  'g_valve',
  'lambda_crit',
  'w_max',
  'adm',
  'xi_adm',
  // v0.3.0 M3 — three channels, tripwire, decomposed exposure
  'g_trip',
  'tau_review',
  'sev_k',
  'kappa_2',
  'delta_R1',
  'delta_R2',
  'delta_R3',
  'rate_23',
  'rate_13',
  'c_rec_exp',
  'disc_prob',
  'xi_2',
  'c_harm_exp',
  'rate_harm',
  'xi_duty',
  'xi_pld',
  'xi_board',
  'bv_k',
  'v_pl',
  'v_reg',
  'v_fid',
  // v0.3.0 — closing the R1 loop (see MODEL.md §9). Culture now depends on the
  // physical stocks via realised exposure and harm, not on f_doc alone.
  'psi_E',
  'E_k',
  'psi_H',
  'h_k',
  'eps_C',
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

/**
 * Provenance tier (MODEL_v3_SPEC §8). The governing standard for v0.3 is that a
 * reader can tell, for any number, which of exactly four categories it falls in.
 * `evidence_basis` above answers "how good is the evidence"; `tier` answers the
 * sharper question "is there any evidence at all, and if not, what would it take".
 *
 *  T1 measured          — measured in THIS domain, with a citation and a data location.
 *  T2 analog-estimated  — measured in an analog domain (aviation, healthcare, cyber);
 *                         the transfer argument must be written out.
 *  T3 structural        — fixed by a modelling commitment (a normalisation, a unit
 *                         conversion, a well-posedness or numerical-form choice).
 *                         Not free, but not measured either.
 *  T4 free              — no empirical basis. MUST state what would constrain it.
 *
 * Expected census for v0.3.0: T1 = 0. Nothing in this model is measured, and the
 * registry says so rather than implying otherwise (VALIDATION.md V12).
 */
export type ProvenanceTier = 'T1' | 'T2' | 'T3' | 'T4'

export const PROVENANCE_TIER_LABEL: Record<ProvenanceTier, string> = {
  T1: 'Measured',
  T2: 'Analog-estimated',
  T3: 'Structural',
  T4: 'Free parameter',
}

/** Verification status of a statutory or case citation (VALIDATION.md V2.5). */
export type CitationStatus = 'verified' | 'unverified' | 'pin-cite-pending'

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
  /** v0.3.0: provenance tier. Required — a parameter with no tier cannot merge. */
  tier: ProvenanceTier
  /**
   * Required for T4. What observation would move this from a free parameter to an
   * estimated one. Enforced by VALIDATION.md V2.3 — a free parameter that cannot
   * say what would constrain it is an admission that the modeller has not thought
   * about whether it is knowable.
   */
  whatWouldConstrainIt?: string
  /** Verification status of `source` where it cites a statute or case. */
  citationStatus?: CitationStatus
}

// ---------------------------------------------------------------------------
// Integration & simulation — spec §2.6, §3.1
// ---------------------------------------------------------------------------

export type Solver = 'rk4' | 'euler' | 'rk45'

export interface SimSettings {
  /** Number of steps (interpreted as months). Default 120. */
  horizon: number
  /** Integration step size. For `rk45` this is the SAMPLE spacing; the solver
   *  takes adaptive substeps between samples. */
  dt: number
  solver: Solver
  /** Relative tolerance for the adaptive solver. Ignored by rk4/euler. */
  rtol?: number
  /** Absolute tolerance for the adaptive solver. Ignored by rk4/euler. */
  atol?: number
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
  /** v0.3.0: R1 return arrows — realised exposure and harm chilling culture. */
  exposure_chill: number
  harm_chill: number
  /** v0.3.0 M3: tripwire, channel routing and decomposed exposure flows. */
  severity: number
  trip: number
  to_R1: number
  to_R2: number
  to_R3: number
  privilege_survival: number
  /** v0.3.0 M3b: privilege after the untested-device discount (p_court). */
  privilege_survival_eff: number
  valve_leakage: number
  waiver_probability: number
  independent_admissions: number
  pl_from_admissions: number
  harm_rate: number
  board_visibility: number
  pl_from_records: number
  pl_from_analysis: number
  pl_from_harm: number
  reg_from_duty: number
  reg_from_pld: number
  fid_from_blindness: number
  E_tot: number
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
  'exposure_chill',
  'harm_chill',
  'severity',
  'trip',
  'to_R1',
  'to_R2',
  'to_R3',
  'privilege_survival',
  'privilege_survival_eff',
  'valve_leakage',
  'waiver_probability',
  'independent_admissions',
  'pl_from_admissions',
  'harm_rate',
  'board_visibility',
  'pl_from_records',
  'pl_from_analysis',
  'pl_from_harm',
  'reg_from_duty',
  'reg_from_pld',
  'fid_from_blindness',
  'E_tot',
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
  /**
   * v0.3.0: true if a stock spent a material share of the run pinned at a physical
   * bound. Distinct from `diverged` on purpose. Through v0.2 `clampState` set
   * `diverged` only for non-finite/runaway values, never for min/max saturation —
   * so the five learning presets ran with TD pinned at zero on >83% of steps while
   * reporting `diverged: false`, i.e. perfectly healthy (AUDIT.md F2). A clamped
   * trajectory is not a solution of the differential equation and must say so.
   */
  saturated: boolean
  /** Fraction of steps on which at least one bound clamp fired. */
  saturatedFraction: number
  clampEvents: ClampEvent[]
  settings: SimSettings
  /** Adaptive-solver diagnostics; undefined for fixed-step solvers. */
  adaptive?: {
    accepted: number
    rejected: number
    maxErrorRatio: number
    minStep: number
  }
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
