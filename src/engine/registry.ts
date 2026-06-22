/**
 * The parameter registry — the single, typed source of truth for every stock
 * and parameter (spec §2.5). Each parameter carries the mandatory metadata
 * schema: { id, label, unit, default, min, max, group, evidence_basis, source,
 * note }. The UI's Assumptions & Methods panel (spec §4.1) renders directly
 * from this; the engine's defaults are derived from it.
 *
 * Honesty rule (spec §2.5): no coefficient is tagged `empirical-anchor` without
 * a real citation. Lever→behavior couplings and functional-form coefficients
 * are `illustrative-assumption`s with candid notes. The one empirical anchor in
 * the whole model is a *calibration target*, not a coefficient: the cyber preset
 * is tuned so f_doc settles near 0.05 (the Schwarcz/Wolff/Woods 2023 estimate),
 * and that estimate is labeled as an estimate wherever it appears.
 */
import type { ParamSpec, Params, ParamKey, State, StockSpec, SimSettings } from './types'
import { STOCK_KEYS, LEVER_KEYS, STRUCTURAL_KEYS } from './types'

// ---------------------------------------------------------------------------
// Stocks
// ---------------------------------------------------------------------------

export const STOCK_SPECS: Record<string, StockSpec> = {
  U: {
    id: 'U',
    label: 'Undocumented incidents',
    short: 'Undocumented',
    unit: 'incidents',
    min: 0,
    max: null,
    default: 20,
    note: 'Incidents that occurred but were never formally analyzed; decay into latent technical debt.',
  },
  D: {
    id: 'D',
    label: 'Documented & analyzed incidents',
    short: 'Documented',
    unit: 'incidents',
    min: 0,
    max: null,
    default: 5,
    note: 'Incidents with written root-cause analysis; these feed organizational learning.',
  },
  TD: {
    id: 'TD',
    label: 'Latent technical debt',
    short: 'Tech debt',
    unit: 'debt index',
    min: 0,
    max: null,
    default: 10,
    note: 'Compounding unresolved flaws (Sculley et al., NeurIPS 2015). Surfaces later as failures.',
  },
  L: {
    id: 'L',
    label: 'Organizational learning / safety capability',
    short: 'Learning',
    unit: '0–100 index',
    min: 0,
    max: 100,
    default: 30,
    note: 'Durable engineering knowledge. Erodes with turnover; rebuilt from documented incidents.',
  },
  E: {
    id: 'E',
    label: 'Litigation + regulatory exposure',
    short: 'Exposure',
    unit: 'exposure index',
    min: 0,
    max: null,
    default: 10,
    note: 'Accumulated discovery/regulatory risk. An observable; it does not feed back into behavior in this model (see MODEL.md).',
  },
  C: {
    id: 'C',
    label: 'Documentation culture / psychological safety',
    short: 'Culture',
    unit: '0–1',
    min: 0,
    max: 1,
    default: 0.4,
    note: 'Slow, hysteretic stock with logistic dynamics — the seat of the bistability.',
  },
}

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

const SPEC_SRC = 'DocFlow BUILD_SPEC §2'
const ILLUSTRATIVE = 'illustrative-assumption' as const

/** Levers (spec §2.4) — policy dials in [0,1]. Defaults match the spec table. */
const LEVER_SPECS: ParamSpec[] = [
  {
    id: 'privilege_strength',
    label: 'Privilege strength',
    unit: '0–1',
    default: 0.3,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS1/WS3; PSQIA workflow privilege; In re Capital One (E.D. Va. 2020)',
    note: 'Credible privilege architecture. Lowers perceived discoverability and the documenting→exposure (backfire) coupling.',
    advanced: false,
  },
  {
    id: 'just_culture',
    label: 'Just culture',
    unit: '0–1',
    default: 0.4,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS2/WS3; EU Reg. 376/2014 Art. 16(10); ASAP "Big Five"',
    note: 'Codified non-punitive learning line. Raises the drive to document and the culture growth target.',
    advanced: false,
  },
  {
    id: 'mandatory_reporting',
    label: 'Mandatory reporting',
    unit: '0–1',
    default: 0.3,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3; EU AI Act (Reg. 2024/1689) Art. 73 [pin-cite to verify]',
    note: 'Compulsion to report. A stick that raises documentation BUT also raises felt discoverability of records.',
    advanced: false,
  },
  {
    id: 'pld_penalty',
    label: 'Non-documentation penalty (PLD)',
    unit: '0–1',
    default: 0.2,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS1; EU PLD Dir. (EU) 2024/2853 Arts. 9–10 adverse-inference [pin-cite to verify]',
    note: 'Adverse-inference regime penalizing suppression. Raises exposure for undocumented incidents and felt discoverability.',
    advanced: false,
  },
  {
    id: 'recipient_enforcer_separation',
    label: 'Recipient–enforcer separation',
    unit: '0–1',
    default: 0.2,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3; NASA ASRS (49 U.S.C. §40123); INPO; DSMB',
    note: 'The entity that learns is not the entity that punishes. Lowers perceived discoverability and lifts culture.',
    advanced: false,
  },
  {
    id: 'translation_layer',
    label: 'Safety translation layer',
    unit: '0–1',
    default: 0.2,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3/WS4; PSQIA PSES; Sculley et al. 2015',
    note: 'Decouples the factual record from the fault narrative. Raises learning efficiency and lowers felt discoverability.',
    advanced: false,
  },
]

/** Structural coefficients (spec §2.2–2.3) — the Advanced panel. */
const STRUCTURAL_SPECS: ParamSpec[] = [
  // --- documentation fraction f_doc + perceived discoverability ---
  { id: 'gain', label: 'Logistic gain (f_doc steepness)', unit: 'dimensionless', default: 15, min: 1, max: 20, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Steepness of the documentation-fraction sigmoid. Higher → sharper tipping threshold; also deepens the culture fold. Calibrated for bistability (see MODEL.md).', advanced: true },
  { id: 'threshold', label: 'Documentation drive threshold', unit: 'drive units', default: 0.6, min: 0, max: 1.5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Net drive at which f_doc = 0.5. Calibrated so the cyber chilling attractor lands near f_doc ≈ 0.05 (the Schwarcz 2023 estimate).', advanced: true },
  { id: 'a_c', label: 'Culture → drive weight', unit: 'drive/culture', default: 1.0, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How strongly culture C raises the drive to document. The main dynamic input to f_doc.', advanced: true },
  { id: 'a_jc', label: 'Just-culture → drive weight', unit: 'drive/lever', default: 0.6, min: 0, max: 1.5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Direct lift to documentation drive from a codified just-culture line.', advanced: true },
  { id: 'a_m', label: 'Mandatory-reporting → drive weight', unit: 'drive/lever', default: 0.35, min: 0, max: 1.5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Compulsion stick: raises documentation drive.', advanced: true },
  { id: 'a_disc', label: 'Discoverability → drive penalty', unit: 'drive/PD', default: 0.8, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How strongly perceived discoverability (when positive) suppresses the drive to document.', advanced: true },
  { id: 'w_m', label: 'Mandatory-reporting → discoverability', unit: 'PD/lever', default: 0.5, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Compulsion also raises felt exposure of the records it creates.', advanced: true },
  { id: 'w_p', label: 'PLD penalty → discoverability', unit: 'PD/lever', default: 0.7, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Adverse-inference regime raises the felt discoverability of the record environment.', advanced: true },
  { id: 'w_priv', label: 'Privilege → discoverability (−)', unit: 'PD/lever', default: 1.0, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Credible privilege lowers perceived discoverability.', advanced: true },
  { id: 'w_sep', label: 'Separation → discoverability (−)', unit: 'PD/lever', default: 0.8, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Recipient–enforcer separation lowers perceived discoverability.', advanced: true },
  { id: 'w_tl', label: 'Translation layer → discoverability (−)', unit: 'PD/lever', default: 0.6, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'A factual record decoupled from fault narrative lowers perceived discoverability.', advanced: true },

  // --- incident generation ---
  { id: 'base_incident_rate', label: 'Base incident rate', unit: 'incidents/month', default: 3, min: 0.5, max: 8, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Incident inflow at zero debt and zero learning.', advanced: true },
  { id: 'alpha_td', label: 'Debt → incident amplification', unit: 'per TD_ref', default: 0.6, min: 0, max: 2, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: 'Direction per Sculley et al. 2015 (debt compounds); magnitude illustrative', note: 'Latent technical debt breeds new incidents. Sign is theory-grounded; magnitude is assumed.', advanced: true },
  { id: 'TD_ref', label: 'Reference technical debt', unit: 'debt index', default: 10, min: 1, max: 50, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Normalizer for the debt→incident term.', advanced: true },
  { id: 'td_sat', label: 'Debt→incident saturation', unit: 'TD_ref units', default: 4, min: 0.5, max: 20, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: 'Well-posedness refinement (MODEL.md); not in BUILD_SPEC', note: 'Saturation point of the debt→incident feedback. The max amplification is 1 + alpha_td·td_sat. Replaces the spec’s unbounded linear term so the chilling regime stays finite.', advanced: true },
  { id: 'beta_L', label: 'Learning → incident suppression', unit: 'per 100 L', default: 0.4, min: 0, max: 0.9, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Capability reduces incident generation (kept <1 so inflow stays positive).', advanced: true },

  // --- learning ---
  { id: 'eta_learn', label: 'Learning gain per documented incident', unit: 'L per incident', default: 0.8, min: 0, max: 2, group: 'learning', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How much durable capability a documented, analyzed incident produces.', advanced: true },
  { id: 'base_eff', label: 'Base translation efficiency', unit: 'dimensionless', default: 0.5, min: 0.1, max: 1, group: 'learning', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Baseline conversion of documented incidents into learning, with no translation layer.', advanced: true },
  { id: 'tl_boost', label: 'Translation-layer efficiency boost', unit: 'per lever', default: 0.8, min: 0, max: 2, group: 'learning', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Added learning efficiency from a strong safety translation layer.', advanced: true },
  { id: 'delta_L', label: 'Learning erosion (turnover)', unit: '1/month', default: 0.1, min: 0.01, max: 0.5, group: 'learning', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Rate at which capability decays without reinforcement.', advanced: true },

  // --- documented-incident & debt dynamics ---
  { id: 'rho', label: 'Remediation rate', unit: '1/month', default: 0.15, min: 0, max: 0.5, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Debt fixed per documented incident, scaled by capability (rho·D·L/100).', advanced: true },
  { id: 'kappa_D', label: 'Documented-incident closeout', unit: '1/month', default: 0.3, min: 0.05, max: 0.8, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Rate at which documented incidents are closed out of the active stock.', advanced: true },
  { id: 'mu', label: 'Belated documentation rate', unit: '1/month', default: 0.1, min: 0, max: 0.5, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Fraction of undocumented incidents belatedly documented (hard, no contemporaneous record).', advanced: true },
  { id: 'sigma', label: 'Undocumented → debt rate', unit: '1/month', default: 0.25, min: 0.02, max: 0.6, group: 'debt', evidence_basis: 'illustrative-assumption', source: 'Direction per Sculley et al. 2015; magnitude illustrative', note: 'Undocumented incidents decay into latent technical debt.', advanced: true },
  { id: 'td_baseline', label: 'Baseline debt accrual', unit: 'debt/month', default: 0.5, min: 0, max: 3, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Debt that accrues independent of incidents (entropy, drift).', advanced: true },
  { id: 'delta_TD', label: 'Natural debt retirement', unit: '1/month', default: 0.05, min: 0, max: 0.3, group: 'debt', evidence_basis: ILLUSTRATIVE, source: 'Well-posedness refinement (MODEL.md); not in BUILD_SPEC', note: 'Debt retired independent of incident learning (refactoring, deprecation, system replacement). Added so a finite chilling equilibrium exists.', advanced: true },
  { id: 'gamma', label: 'Debt → harm conversion', unit: 'harm per TD', default: 0.5, min: 0, max: 2, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How much latent debt surfaces as harm events, mitigated by capability (1−L/100).', advanced: true },

  // --- exposure ---
  { id: 'phi_doc', label: 'Documenting → exposure', unit: 'exposure/incident', default: 0.4, min: 0, max: 1, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Discovery exposure from creating records, UNLESS privilege protects them.', advanced: true },
  { id: 'phi_harm', label: 'Harm → exposure', unit: 'exposure/harm', default: 0.3, min: 0, max: 1, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Realized harm raises litigation/regulatory exposure.', advanced: true },
  { id: 'phi_pld', label: 'PLD adverse inference → exposure', unit: 'exposure/incident', default: 0.5, min: 0, max: 1.5, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Non-documentation penalty applied to undocumented incidents (punishes suppression).', advanced: true },
  { id: 'theta_E', label: 'Exposure decay/settlement', unit: '1/month', default: 0.2, min: 0.02, max: 0.6, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Exposure settles/decays over time.', advanced: true },

  // --- culture ---
  { id: 'omega', label: 'Safety wins → culture', unit: 'culture/f_doc', default: 2.1, min: 0, max: 4, group: 'culture', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Visible safety wins (documentation working, scaled by translation efficiency) raise culture (R2 reinforcement). Strength of the virtuous loop. Calibrated for bistability.', advanced: true },
  { id: 'psi', label: 'Backfire → culture (−)', unit: 'culture/f_doc', default: 2.6, min: 0, max: 5, group: 'culture', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Seeing records weaponized (documenting without privilege) lowers culture (R1 reinforcement). Strength of the chilling loop; gated by (1−privilege). Calibrated for bistability.', advanced: true },
  { id: 'lambda_C', label: 'Culture adjustment speed', unit: '1/month', default: 0.3, min: 0.02, max: 1, group: 'culture', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How fast culture moves toward its target. Slow → strong hysteresis.', advanced: true },
  { id: 'a_sep', label: 'Separation → culture', unit: 'culture/lever', default: 0.13, min: 0, max: 1.5, group: 'culture', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Recipient–enforcer separation directly raises the culture target.', advanced: true },
  { id: 'a_jc_c', label: 'Just culture → culture target', unit: 'culture/lever', default: 0.38, min: 0, max: 1.5, group: 'culture', evidence_basis: 'illustrative-assumption', source: 'Refinement (MODEL.md): the spec used coefficient 1 implicitly', note: 'Weight of the just-culture baseline in the culture target (symmetric with a_sep). Tunable so the bistable window sits at sensible lever values.', advanced: true },
]

export const PARAM_SPECS: ParamSpec[] = [...LEVER_SPECS, ...STRUCTURAL_SPECS]

/** Lookup table by id. */
export const PARAM_SPEC_BY_ID: Record<ParamKey, ParamSpec> = Object.fromEntries(
  PARAM_SPECS.map((p) => [p.id, p]),
) as Record<ParamKey, ParamSpec>

// ---------------------------------------------------------------------------
// Derived defaults & validation helpers
// ---------------------------------------------------------------------------

/** Build the default parameter vector from the registry. */
export function defaultParams(): Params {
  const out = {} as Params
  for (const spec of PARAM_SPECS) out[spec.id] = spec.default
  return out
}

/** The default initial state (spec §2.1 "Default init" column). */
export function defaultInitState(): State {
  const out = {} as State
  for (const key of STOCK_KEYS) out[key] = STOCK_SPECS[key].default
  return out
}

/** Default integration settings (spec §2.6). */
export function defaultSettings(): SimSettings {
  return { horizon: 120, dt: 0.5, solver: 'rk4' }
}

/** Clamp a single parameter to its registry range. */
export function clampParam(id: ParamKey, value: number): number {
  const spec = PARAM_SPEC_BY_ID[id]
  if (!spec) return value
  if (!Number.isFinite(value)) return spec.default
  return Math.min(spec.max, Math.max(spec.min, value))
}

/** Validate & clamp a full parameter vector against registry ranges (spec §7.5). */
export function sanitizeParams(input: Partial<Params>): Params {
  const out = defaultParams()
  for (const spec of PARAM_SPECS) {
    const v = input[spec.id]
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[spec.id] = Math.min(spec.max, Math.max(spec.min, v))
    }
  }
  return out
}

/** Assert the registry covers exactly the declared parameter keys (used in tests). */
export function registryKeySet(): Set<ParamKey> {
  return new Set(PARAM_SPECS.map((p) => p.id))
}

export const ALL_PARAM_KEYS: ParamKey[] = [...LEVER_KEYS, ...STRUCTURAL_KEYS]
