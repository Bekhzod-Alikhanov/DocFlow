// src/views/Tabletop/scoringLogic.ts
//
// Scoring-logic metadata for the Tabletop meter rail, kept out of the component file.
// eslint's react-refresh rule objected to exporting these from MeterRail.tsx, and it
// was right for a better reason than fast refresh: this is a description of what the
// engine computes, it is asserted against the engine by tests, and it has no business
// living inside a view.
import type { LeverKey } from '../../engine'
import type { InstitutionalMeterKey, IncidentMeterKey } from '../../engine/tabletop'
import type { ScoringLogicEntry } from './ScoringLogicPanel'

// ---------------------------------------------------------------------------
// Scoring-logic metadata for each institutional meter
//
// These strings must name what `computeAux` actually computes. Weights are the
// grouped constants in `readouts.ts`; π is the computed privilege-survival
// probability from `privilegeSurvival` (v0.3.0 M3b), NOT a lever.
// ---------------------------------------------------------------------------

/**
 * The design choices that produce π. Privilege stopped being a slider in M3b, so a
 * meter driven by π is driven by these four (plus `workflow_protection`, which does
 * double duty as the separation factor) rather than by any single "privilege" lever.
 */
const PRIVILEGE_LEVERS: LeverKey[] = [
  'precommit',
  'significant_purpose',
  'workflow_protection',
  'valve_discipline',
  'kovel_evaluator',
]

export const INSTITUTIONAL_LOGIC: Record<InstitutionalMeterKey, ScoringLogicEntry> = {
  safe_to_report_score: {
    formula:
      '0.22·π + 0.18·recipient_enforcer_separation + 0.18·workflow_protection + 0.16·safe_harbor_non_admission + 0.12·original_records_boundary + 0.08·just_culture + 0.06·intermediary_capacity − 0.16·perceived_discoverability, clamped to [0,1]',
    levers: [
      ...PRIVILEGE_LEVERS,
      'recipient_enforcer_separation',
      'safe_harbor_non_admission',
      'original_records_boundary',
      'just_culture',
      'intermediary_capacity',
    ],
    flags: [],
  },
  accountability_legitimacy: {
    formula:
      'Weighted blend of original_records_boundary, just_culture, mandatory_reporting, effective_challenge and near_miss_tier (weights in readouts.ts ACCOUNTABILITY_LEGITIMACY), clamped to [0,1]. Privilege does NOT enter: legitimacy is about what stays visible.',
    levers: ['original_records_boundary', 'just_culture', 'mandatory_reporting', 'effective_challenge', 'near_miss_tier'],
    flags: [],
  },
  learning_yield: {
    formula:
      'learning_gain / incident_inflow — a ratio, not a blend. learning_gain rises with translation-layer efficiency, effective_challenge and the near-miss signal (itself gated by recipient_enforcer_separation).',
    levers: ['translation_layer', 'intermediary_capacity', 'effective_challenge', 'near_miss_tier', 'recipient_enforcer_separation'],
    flags: [],
  },
  litigation_pressure: {
    formula:
      '0.32·softplus(perceived_discoverability) + 0.24·pld_penalty + 0.16·mandatory_reporting + 0.18·(1 − safe_to_report_score) + 0.10·(1 − original_records_boundary), clamped to [0,1]. π enters twice, indirectly: through perceived_discoverability and through safe_to_report_score.',
    levers: ['pld_penalty', 'mandatory_reporting', 'original_records_boundary', ...PRIVILEGE_LEVERS],
    flags: [],
  },
  private_ordering_gap: {
    formula:
      'policy_scaffold_dependency − 0.65 × mean(privately-orderable levers), clamped to [0,1]. What a lab still needs statute for after doing everything it can do alone.',
    levers: [...PRIVILEGE_LEVERS, 'safe_harbor_non_admission', 'intermediary_capacity', 'translation_layer', 'effective_challenge'],
    flags: [],
  },
  policy_scaffold_dependency: {
    formula:
      '0.42·safe_harbor_non_admission + 0.34·workflow_protection + 0.24·π, clamped to [0,1]. Reporting duties are deliberately absent from this sum: an obligation to report is not a scaffold that protects the reporter.',
    levers: ['safe_harbor_non_admission', ...PRIVILEGE_LEVERS],
    flags: [],
  },
}

// Scoring-logic for the PERCEIVED legal shield.
//
// This is deliberately not π. It models the BELIEF that produces the keep-it-oral
// move — "we involved a lawyer and wrote nothing down" — which the case law has
// repeatedly pierced. The gap between this and `actualLegalShield` is the quantity
// the playbook is written against; see `legalShieldIllusion` in tabletop/score.ts.
export const SHIELD_LOGIC: ScoringLogicEntry = {
  formula:
    '0.55 × significant_purpose + 0.30 × (legal_owns_record | privileged_single_track ? 1 : 0) + 0.15 × (1 − original_records_boundary). This is the BELIEF, not the doctrine: it ignores pre-commitment and valve integrity, which is precisely why it can exceed actual privilege survival π.',
  levers: ['significant_purpose', 'original_records_boundary'],
  flags: ['legal_owns_record', 'privileged_single_track'],
}

// Scoring-logic for incident meters.
// These strings describe the REAL engine (boundary.ts, capturability.ts, applyChoice.ts).
// Only signal_fidelity, record_capturability, and board_oversight_visibility are computed
// by formulas; the rest move purely via each choice's explicit incidentEffects deltas.
export const INCIDENT_LOGIC: Record<IncidentMeterKey, ScoringLogicEntry> = {
  signal_fidelity: {
    formula: 'Ch.2 transfer function at each chapter-2 handoff: fidelity × tieStrength × (1 − translationLoss) × (1 − 0.5·normalization).',
    levers: [
      'recipient_enforcer_separation', 'near_miss_tier', 'effective_challenge', 'intermediary_capacity', // raise tie strength
      'translation_layer', 'original_records_boundary', // lower translation loss
      'just_culture', // lower normalization (near_miss_tier also lowers it)
    ],
    flags: ['independent_review_channel', 'legal_owns_record'],
  },
  record_capturability: {
    formula: 'base(captureResistance) + 30·state_snapshotted + 15·pipeline_captured − 40·retrainCadence (erosion applies only when state is not snapshotted).',
    levers: [],
    flags: ['state_snapshotted', 'pipeline_captured'],
  },
  regulatory_timeliness: {
    formula: 'Moved by the explicit effect of each choice you make (e.g. voluntary disclosure raises it, containment lowers it); see the choice rationale.',
    levers: [],
    flags: [],
  },
  board_oversight_visibility: {
    formula: 'After a chapter-2 handoff it equals signal_fidelity + the choice’s board-routing delta (structured channel vs. informal brief). Tracks signal_fidelity.',
    levers: [],
    flags: [],
  },
  evidentiary_posture: {
    formula: 'Higher = more defensible objective record. Moved by the explicit effect of each choice you make; see the choice rationale.',
    levers: [],
    flags: [],
  },
  remediation_completeness: {
    formula: 'Moved by the explicit effect of each choice you make (full remediation raises it, minimal patch lowers it); see the choice rationale.',
    levers: [],
    flags: [],
  },
  recurrence_risk: {
    formula: 'Moved by the explicit effect of each choice (e.g. full remediation −20, minimal patch +15). The authoritative verdict is the engine-forward AftermathOutcome.recurrenceRisk, revealed only after the terminal node fires.',
    levers: [],
    flags: [],
  },
}

