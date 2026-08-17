/**
 * Tabletop coefficients — the last unregistered constants in the model (AUDIT.md F8).
 *
 * F8 was reported closed after M1 extracted the ~29 composite-index weights from
 * `computeAux`. That was an overclaim: the tabletop engine still carried roughly
 * twenty bare numeric literals across `boundary.ts`, `capturability.ts`, `score.ts`
 * and `outcome.ts`, and those are the coefficients that drive the discrete scenario
 * layer a reader is most likely to interact with first. They are gathered here so the
 * V2.1 gate can mean what it says: zero unregistered constants.
 *
 * Registering a number does not make it better evidenced. Every coefficient below is
 * T4 — freely chosen — and saying so is the entire value of this file. The tabletop
 * layer is a teaching instrument whose coefficients were picked to make the
 * organisational mechanisms legible, and a reader is entitled to know that before
 * treating any tabletop output as a finding.
 */
import type { ProvenanceTier } from '../types'
import type { CaptureResistance } from './types'

export interface TabletopCoefficientSpec {
  id: string
  label: string
  value: number
  /** Which mechanism this coefficient belongs to. */
  group: TabletopCoefficientGroup
  unit: string
  tier: ProvenanceTier
  source: string
  note: string
  whatWouldConstrainIt: string
}

export type TabletopCoefficientGroup =
  | 'tie_strength'
  | 'translation_loss'
  | 'normalization'
  | 'boundary_transfer'
  | 'capturability'
  | 'perceived_shield'
  | 'recurrence'

// ---------------------------------------------------------------------------
// Ch.2 boundary mechanics — tie strength (Hansen)
// ---------------------------------------------------------------------------

/**
 * Weak ties cannot carry tacit or complex knowledge across a professional handoff.
 * The base is what a handoff retains with no structural support at all.
 */
export const TIE_STRENGTH = {
  base: 0.45,
  recipient_enforcer_separation: 0.18,
  near_miss_tier: 0.14,
  effective_challenge: 0.13,
  intermediary_capacity: 0.1,
  independent_channel_bonus: 0.15,
} as const

// ---------------------------------------------------------------------------
// Ch.2 boundary mechanics — translation loss (Røvik)
// ---------------------------------------------------------------------------

export const TRANSLATION_LOSS = {
  base: 0.3,
  translation_layer: 0.22,
  original_records_boundary: 0.12,
  legal_bottleneck_surcharge: 0.25,
} as const

// ---------------------------------------------------------------------------
// Ch.2 boundary mechanics — normalization of deviance (Vaughan/Perrow)
// ---------------------------------------------------------------------------

export const NORMALIZATION = {
  base: 0.15,
  retrain_cadence: 0.55,
  just_culture: 0.35,
  near_miss_tier: 0.15,
} as const

/** How much of a normalised signal survives the handoff. */
export const BOUNDARY_TRANSFER = {
  normalization_haircut: 0.5,
} as const

// ---------------------------------------------------------------------------
// Ch.4 record capturability
// ---------------------------------------------------------------------------

/**
 * Base capturability by failure mode, 0–100.
 *
 * THE ORDERING IS THE CLAIM; the magnitudes are not. A silent failure is hardest to
 * capture faithfully because nothing announces it; a distributional shift is easiest
 * because it shows up in aggregate statistics whether or not anyone was watching.
 * That ranking is a structural assertion about ML failure modes and is falsifiable.
 * The specific numbers 30/35/45/55 are not, and nothing should be read off them.
 */
export const RESISTANCE_BASE: Record<CaptureResistance, number> = {
  silent: 30,
  irreproducible: 35,
  environment_dependent: 45,
  distributional: 55,
}

export const CAPTURABILITY = {
  /** Used when a scenario declares a resistance class the table does not know. */
  unknown_resistance_base: 45,
  state_snapshot_boost: 30,
  pipeline_capture_boost: 15,
  /** Retraining overwrites the evidence — but only when no snapshot was taken. */
  retrain_erosion: 40,
} as const

// ---------------------------------------------------------------------------
// The perceived legal shield — a belief, not a doctrine
// ---------------------------------------------------------------------------

/**
 * Weights of the naive belief that produces the keep-it-oral move. These are NOT the
 * privilege model: see `privilegeSurvival` for what the doctrine actually implies, and
 * `legalShieldIllusion` for the gap between them.
 */
export const PERCEIVED_SHIELD = {
  significant_purpose: 0.55,
  single_track_flag: 0.3,
  no_records_boundary: 0.15,
} as const

// ---------------------------------------------------------------------------
// Recurrence risk
// ---------------------------------------------------------------------------

export const RECURRENCE = {
  debt_pressure: 0.6,
  learning_shortfall: 0.4,
} as const

// ---------------------------------------------------------------------------
// The register
// ---------------------------------------------------------------------------

const ILLUSTRATIVE = 'Illustrative coefficient; no source establishes this value.'

function coef(
  group: TabletopCoefficientGroup,
  id: string,
  label: string,
  value: number,
  unit: string,
  note: string,
  whatWouldConstrainIt: string,
  source = ILLUSTRATIVE,
  tier: ProvenanceTier = 'T4',
): TabletopCoefficientSpec {
  return { id: `${group}.${id}`, label, value, group, unit, tier, source, note, whatWouldConstrainIt }
}

const HANDOFF_STUDY =
  'Measured fidelity of the same incident description before and after a real engineering→legal or engineering→board handoff.'
const CAPTURE_AUDIT =
  'An audit of real post-incident artefacts scored for whether the failure could be reproduced from what was recorded.'

export const TABLETOP_COEFFICIENT_SPECS: TabletopCoefficientSpec[] = [
  // --- tie strength ---
  coef('tie_strength', 'base', 'Base tie strength', TIE_STRENGTH.base, '0-1',
    'What a professional handoff retains with no structural support. Deliberately below one half: the default assumption is that most of a complex signal does not survive an unsupported handoff.',
    HANDOFF_STUDY, 'Hansen (1999) on weak ties and complex knowledge transfer — direction only, not magnitude.'),
  coef('tie_strength', 'recipient_enforcer_separation', 'Separation → tie strength', TIE_STRENGTH.recipient_enforcer_separation, '0-1/lever',
    'Largest lever share: people tell a listener who is not also the enforcer more than they tell one who is.', HANDOFF_STUDY),
  coef('tie_strength', 'near_miss_tier', 'Near-miss tier → tie strength', TIE_STRENGTH.near_miss_tier, '0-1/lever',
    'A low-stakes channel keeps the relationship open between serious incidents.', HANDOFF_STUDY),
  coef('tie_strength', 'effective_challenge', 'Effective challenge → tie strength', TIE_STRENGTH.effective_challenge, '0-1/lever',
    'Reviewers with authority are worth talking to; reviewers without it are not.', HANDOFF_STUDY),
  coef('tie_strength', 'intermediary_capacity', 'Intermediary capacity → tie strength', TIE_STRENGTH.intermediary_capacity, '0-1/lever',
    'Smallest lever share: a funded translation function helps, but does not substitute for a direct relationship.', HANDOFF_STUDY),
  coef('tie_strength', 'independent_channel_bonus', 'Independent channel bonus', TIE_STRENGTH.independent_channel_bonus, '0-1',
    'Flat bonus when a scenario opens an independent review channel. Flat rather than proportional because the channel either exists or it does not.', HANDOFF_STUDY),

  // --- translation loss ---
  coef('translation_loss', 'base', 'Base translation loss', TRANSLATION_LOSS.base, '0-1',
    'Detail lost in transit with no translation support.',
    HANDOFF_STUDY, 'Røvik on translation of organisational ideas — direction only.'),
  coef('translation_loss', 'translation_layer', 'Translation layer → loss', -TRANSLATION_LOSS.translation_layer, '0-1/lever',
    'A dedicated translation function is the strongest single reducer of transit loss.', HANDOFF_STUDY),
  coef('translation_loss', 'original_records_boundary', 'Records boundary → loss', -TRANSLATION_LOSS.original_records_boundary, '0-1/lever',
    'A defined factual core gives the recipient something that does not need translating.', HANDOFF_STUDY),
  coef('translation_loss', 'legal_bottleneck_surcharge', 'Legal-bottleneck surcharge', TRANSLATION_LOSS.legal_bottleneck_surcharge, '0-1',
    'Added loss when counsel owns the record. Nearly as large as the base loss itself, which is the mechanism the scenario exists to show: routing everything through legal is not free.',
    'Comparison of signal fidelity in matters where counsel did and did not own the incident record.'),

  // --- normalization ---
  coef('normalization', 'base', 'Base normalization probability', NORMALIZATION.base, '0-1',
    'Chance a true warning reads as routine noise even in a healthy organisation.',
    'Rate at which real precursor signals were classified as routine, from post-hoc incident reviews.', 'Vaughan on normalization of deviance — direction only.'),
  coef('normalization', 'retrain_cadence', 'Retrain cadence → normalization', NORMALIZATION.retrain_cadence, '0-1/rate',
    'Dominant term: when the system changes under you, anomalies become expected. This is the mechanism that makes ML incident signals decay faster than in other domains.',
    'Precursor-classification rates as a function of deployment/retraining frequency.'),
  coef('normalization', 'just_culture', 'Just culture → normalization', -NORMALIZATION.just_culture, '0-1/lever',
    'A codified just-culture line makes raising an anomaly cheap enough to be worth doing.',
    'Precursor-report rates before and after a just-culture policy was adopted.'),
  coef('normalization', 'near_miss_tier', 'Near-miss tier → normalization', -NORMALIZATION.near_miss_tier, '0-1/lever',
    'A place to put weak signals stops them being rounded to zero.',
    'Weak-signal report volume with and without a near-miss channel.'),

  // --- boundary transfer ---
  coef('boundary_transfer', 'normalization_haircut', 'Normalization haircut', BOUNDARY_TRANSFER.normalization_haircut, 'fraction',
    'A fully normalised signal loses half its fidelity rather than all of it: reading a warning as routine degrades it but does not delete the underlying facts.',
    'Whether normalised warnings retain any actionable content in real reviews — plausibly the weakest assumption in the boundary model.'),

  // --- capturability ---
  coef('capturability', 'silent', 'Base: silent failure', RESISTANCE_BASE.silent, '0-100',
    'Hardest to capture: nothing announces the failure, so there is often no artefact to preserve.', CAPTURE_AUDIT),
  coef('capturability', 'irreproducible', 'Base: irreproducible failure', RESISTANCE_BASE.irreproducible, '0-100',
    'The event happened but cannot be made to happen again, so the record cannot be verified.', CAPTURE_AUDIT),
  coef('capturability', 'environment_dependent', 'Base: environment-dependent failure', RESISTANCE_BASE.environment_dependent, '0-100',
    'Capturable if the environment is captured with it, which is usually the part that is missed.', CAPTURE_AUDIT),
  coef('capturability', 'distributional', 'Base: distributional failure', RESISTANCE_BASE.distributional, '0-100',
    'Easiest: visible in aggregate statistics whether or not anyone was watching at the time.', CAPTURE_AUDIT),
  coef('capturability', 'unknown_resistance_base', 'Base: unknown resistance class', CAPTURABILITY.unknown_resistance_base, '0-100',
    'Fallback for a scenario declaring a resistance class this table does not know. Set to the middle of the range so an unknown class is neither optimistic nor alarming.', CAPTURE_AUDIT),
  coef('capturability', 'state_snapshot_boost', 'State snapshot boost', CAPTURABILITY.state_snapshot_boost, '0-100',
    'Largest single control: snapshotting model state at the time of failure is what makes the record survive the next training run.',
    'Reproduction rates for incidents where state was and was not snapshotted.'),
  coef('capturability', 'pipeline_capture_boost', 'Pipeline capture boost', CAPTURABILITY.pipeline_capture_boost, '0-100',
    'Capturing the data pipeline adds context the snapshot alone does not carry.', CAPTURE_AUDIT),
  coef('capturability', 'retrain_erosion', 'Retrain erosion', CAPTURABILITY.retrain_erosion, '0-100',
    'Evidence destroyed by retraining when no snapshot was taken. Large enough to dominate the base for a frequently-retrained system, which is the point: for ML, evidence has a shelf life measured in training runs.',
    'How often a past incident could still be reproduced after N subsequent training runs.'),

  // --- perceived shield ---
  coef('perceived_shield', 'significant_purpose', 'Belief: a lawyer was involved', PERCEIVED_SHIELD.significant_purpose, '0-1/lever',
    'Dominant term in the BELIEF, and that dominance is the error being modelled: stated legal purpose is only one of four factors the doctrine weighs.',
    'Survey of what practitioners believe protects an incident analysis, against what courts have held.'),
  coef('perceived_shield', 'single_track_flag', 'Belief: nothing was written down', PERCEIVED_SHIELD.single_track_flag, '0-1',
    'Flat bonus when counsel owns the record or the analysis is oral-only.',
    'The same survey, for the keep-it-oral move specifically.'),
  coef('perceived_shield', 'no_records_boundary', 'Belief: no separate factual record', PERCEIVED_SHIELD.no_records_boundary, '0-1/lever',
    'Smallest term: the absence of a factual boundary feels protective and is not.',
    'Whether a maintained factual boundary correlates with privilege outcomes in decided cases.'),

  // --- recurrence ---
  coef('recurrence', 'debt_pressure', 'Recurrence: debt pressure share', RECURRENCE.debt_pressure, 'fraction',
    'Unremediated debt weighted above learning shortfall, on the reasoning that a known-unfixed flaw recurs more reliably than an unlearned lesson.',
    'Recurrence rates against measured backlog versus measured capability.'),
  coef('recurrence', 'learning_shortfall', 'Recurrence: learning shortfall share', RECURRENCE.learning_shortfall, 'fraction',
    'The complement. The two shares sum to one by construction, so only their ratio is a modelling choice.',
    'The same data; the ratio is what would be estimated.'),
]

export const TABLETOP_COEFFICIENT_BY_ID: Record<string, TabletopCoefficientSpec> = Object.fromEntries(
  TABLETOP_COEFFICIENT_SPECS.map((c) => [c.id, c]),
)
