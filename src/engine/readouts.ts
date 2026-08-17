/**
 * Composite-index weights for the derived institutional readouts (MODEL.md §6).
 *
 * WHY THIS FILE EXISTS. Through v0.2 these ~29 numbers lived as bare literals
 * inside `computeAux`. They drive `safe_to_report_score`, `litigation_pressure`,
 * `accountability_legitimacy`, `private_ordering_gap` and
 * `policy_scaffold_dependency` — the six figures the Institutional Design view,
 * the tabletop meter rail and the exported playbook brief all present as headline
 * numbers — and they were absent from the parameter registry, absent from the
 * Assumptions panel (whose own copy claimed to list "every parameter"), and
 * excluded from every sensitivity analysis. See `docs/plan/AUDIT.md` F8.
 *
 * WHAT THEY ARE. These are *definitional* weights of composite indices, not
 * dynamic coefficients: they fix what "safe to report" means as a blend of levers,
 * in the way a unit conversion fixes what a debt index means. They are therefore
 * modelled as declared constants rather than as tunable `Params`.
 *
 * SCOPE. This file covers the ~29 weights that were inside `computeAux`. A further
 * 20 remain as bare literals in the tabletop engine (boundary.ts 15, score.ts 3,
 * outcome.ts 2) and are NOT yet registered; the source-scan guard in
 * readouts.test.ts covers computeAux only.
 *
 * WHAT THAT COSTS, STATED PLAINLY. Because they are not `Params`, they are still
 * outside the swept space — Sobol/PRCC/tornado do not vary them. Moving them into
 * the swept space is roadmap item M1/M5 (`docs/plan/ROADMAP.md`). What this file
 * fixes is that they are now named, tiered, cited, rendered in the UI, and
 * impossible to change without the change being visible in a diff.
 *
 * PROVENANCE. Every weight below is `illustrative-assumption`. Each group's
 * positive weights sum to 1.00 by construction — that normalisation is a
 * structural choice, not a finding, and it encodes an untested assumption of
 * PERFECT SUBSTITUTABILITY between the mechanisms in each blend (a privilege
 * score of 1.0 counts the same as an equivalent-weight workflow-protection score).
 */
import type { EvidenceBasis } from './types'

export interface ReadoutWeightSpec {
  id: string
  label: string
  value: number
  /** Which composite index this weight belongs to. */
  group: ReadoutGroup
  evidence_basis: EvidenceBasis
  source: string
  note: string
}

export type ReadoutGroup =
  | 'protection_bundle'
  | 'near_miss_signal'
  | 'private_ordering'
  | 'policy_scaffold'
  | 'accountability_legitimacy'
  | 'safe_to_report'
  | 'litigation_pressure'

export const READOUT_GROUP_LABEL: Record<ReadoutGroup, string> = {
  protection_bundle: 'Protection bundle (gates culture backfire)',
  near_miss_signal: 'Near-miss weak-signal channel',
  private_ordering: 'Private-ordering gap',
  policy_scaffold: 'Policy-scaffold dependency',
  accountability_legitimacy: 'Accountability legitimacy',
  safe_to_report: 'Safe-to-report score',
  litigation_pressure: 'Litigation pressure',
}

const ILL: EvidenceBasis = 'illustrative-assumption'
const SRC_V2 = 'DocFlow v0.2 institutional readouts; weights illustrative, normalised to sum 1.00'
const SRC_PLAYBOOK = 'AI Incident Playbook §2.2 (organizational conditions); ordering argued, magnitudes illustrative'

// --- the weights, as code-facing grouped constants -------------------------

/** Gates `backfire`: how much each mechanism protects a candid record. */
export const PROTECTION_BUNDLE = {
  privilege_survival: 0.36,
  workflow_protection: 0.22,
  safe_harbor_non_admission: 0.18,
  original_records_boundary: 0.14,
  recipient_enforcer_separation: 0.1,
} as const

/** Near-miss signal strength: base share plus the separation-dependent share. */
export const NEAR_MISS_SIGNAL = {
  base_share: 0.35,
  separation_share: 0.65,
} as const

/** Private-ordering gap: how much private capacity offsets scaffold dependence. */
export const PRIVATE_ORDERING = {
  capacity_offset: 0.65,
} as const

/** Dependence on statutory scaffolding rather than private ordering. */
export const POLICY_SCAFFOLD = {
  safe_harbor_non_admission: 0.42,
  workflow_protection: 0.34,
  privilege_survival: 0.24,
} as const

/** Whether the accountability story would survive outside scrutiny. */
export const ACCOUNTABILITY_LEGITIMACY = {
  original_records_boundary: 0.34,
  just_culture: 0.26,
  mandatory_reporting: 0.18,
  effective_challenge: 0.12,
  near_miss_tier: 0.1,
} as const

/** Whether an individual engineer can rationally expect recording to be safe. */
export const SAFE_TO_REPORT = {
  privilege_survival: 0.22,
  recipient_enforcer_separation: 0.18,
  workflow_protection: 0.18,
  safe_harbor_non_admission: 0.16,
  original_records_boundary: 0.12,
  just_culture: 0.08,
  intermediary_capacity: 0.06,
  /** Subtracted, and in PD units — see the dimensional caveat in the spec list. */
  discoverability_penalty: 0.16,
} as const

/** Felt legal pressure on the documentation decision. */
export const LITIGATION_PRESSURE = {
  discoverability: 0.32,
  pld_penalty: 0.24,
  mandatory_reporting: 0.16,
  unsafe_to_report: 0.18,
  no_records_boundary: 0.1,
} as const

// --- the same weights, as UI/doc-facing specs ------------------------------

function spec(
  group: ReadoutGroup,
  id: string,
  label: string,
  value: number,
  note: string,
  source = SRC_V2,
): ReadoutWeightSpec {
  return { id: `${group}.${id}`, label, value, group, evidence_basis: ILL, source, note }
}

export const READOUT_WEIGHT_SPECS: ReadoutWeightSpec[] = [
  // protection bundle
  spec('protection_bundle', 'privilege_survival', 'Privilege strength', PROTECTION_BUNDLE.privilege_survival, 'Largest single share: a credible privilege architecture is the strongest protection against a candid record being weaponised.', SRC_PLAYBOOK),
  spec('protection_bundle', 'workflow_protection', 'Workflow protection', PROTECTION_BUNDLE.workflow_protection, 'PSQIA-style protection of a defined evaluation process rather than a single document.', SRC_PLAYBOOK),
  spec('protection_bundle', 'safe_harbor_non_admission', 'Safe harbor / non-admission', PROTECTION_BUNDLE.safe_harbor_non_admission, 'Reporting treated as a signal rather than an admission of fault.'),
  spec('protection_bundle', 'original_records_boundary', 'Original-records boundary', PROTECTION_BUNDLE.original_records_boundary, 'A clean factual/analytic split makes the protected channel defensible.'),
  spec('protection_bundle', 'recipient_enforcer_separation', 'Recipient–enforcer separation', PROTECTION_BUNDLE.recipient_enforcer_separation, 'Smallest share: separation protects the reporter more than the record.'),

  // near-miss signal
  spec('near_miss_signal', 'base_share', 'Base share', NEAR_MISS_SIGNAL.base_share, 'Fraction of near-miss signal captured with no recipient–enforcer separation.'),
  spec('near_miss_signal', 'separation_share', 'Separation-dependent share', NEAR_MISS_SIGNAL.separation_share, 'Additional share unlocked by separation. The near-miss tier is the highest-value, lowest-liability data class and the first thing a fear-designed regime discards.', SRC_PLAYBOOK),

  // private ordering
  spec('private_ordering', 'capacity_offset', 'Private-capacity offset', PRIVATE_ORDERING.capacity_offset, 'How much private-ordering capacity offsets dependence on statutory scaffolding. Below 1.0 because private ordering cannot fully substitute for statute.'),

  // policy scaffold
  spec('policy_scaffold', 'safe_harbor_non_admission', 'Safe harbor / non-admission', POLICY_SCAFFOLD.safe_harbor_non_admission, 'The most statute-dependent of the three: non-admission rules require legislation.', SRC_PLAYBOOK),
  spec('policy_scaffold', 'workflow_protection', 'Workflow protection', POLICY_SCAFFOLD.workflow_protection, 'PSQIA-style workflow privilege exists only where a statute creates it.'),
  spec('policy_scaffold', 'privilege_survival', 'Privilege strength', POLICY_SCAFFOLD.privilege_survival, 'Least statute-dependent: attorney-client privilege exists at common law, though its application to incident forensics is contested.'),

  // accountability legitimacy
  spec('accountability_legitimacy', 'original_records_boundary', 'Original-records boundary', ACCOUNTABILITY_LEGITIMACY.original_records_boundary, 'Largest share: a preserved discoverable factual core is what makes the arrangement legitimate rather than concealment.', SRC_PLAYBOOK),
  spec('accountability_legitimacy', 'just_culture', 'Just culture', ACCOUNTABILITY_LEGITIMACY.just_culture, 'A written line between inadvertent error and willful misconduct.'),
  spec('accountability_legitimacy', 'mandatory_reporting', 'Mandatory reporting', ACCOUNTABILITY_LEGITIMACY.mandatory_reporting, 'External duty to report constrains self-serving classification.'),
  spec('accountability_legitimacy', 'effective_challenge', 'Effective challenge', ACCOUNTABILITY_LEGITIMACY.effective_challenge, 'Independent review with standing.'),
  spec('accountability_legitimacy', 'near_miss_tier', 'Near-miss tier', ACCOUNTABILITY_LEGITIMACY.near_miss_tier, 'Retaining weak signals is evidence of good faith.'),

  // safe to report
  spec('safe_to_report', 'privilege_survival', 'Privilege strength', SAFE_TO_REPORT.privilege_survival, 'What the individual engineer can rationally expect to be protected.'),
  spec('safe_to_report', 'recipient_enforcer_separation', 'Recipient–enforcer separation', SAFE_TO_REPORT.recipient_enforcer_separation, 'The reporter is not reporting to the party that can punish them.', SRC_PLAYBOOK),
  spec('safe_to_report', 'workflow_protection', 'Workflow protection', SAFE_TO_REPORT.workflow_protection, 'Protection attaches to the process, so the engineer need not judge document-by-document.'),
  spec('safe_to_report', 'safe_harbor_non_admission', 'Safe harbor / non-admission', SAFE_TO_REPORT.safe_harbor_non_admission, 'Reporting is not itself evidence of fault.'),
  spec('safe_to_report', 'original_records_boundary', 'Original-records boundary', SAFE_TO_REPORT.original_records_boundary, 'Clear rules about what is factual reduce the judgement burden on the reporter.'),
  spec('safe_to_report', 'just_culture', 'Just culture', SAFE_TO_REPORT.just_culture, 'Small direct share: the stated norm matters less than the structural protections above it.'),
  spec('safe_to_report', 'intermediary_capacity', 'Intermediary capacity', SAFE_TO_REPORT.intermediary_capacity, 'Smallest share: a funded analytic body signals the report will be used.'),
  spec('safe_to_report', 'discoverability_penalty', 'Discoverability penalty (subtracted)', SAFE_TO_REPORT.discoverability_penalty, 'DIMENSIONAL CAVEAT: this multiplies relu(perceived_discoverability), which is in synthetic PD units (range up to +4), and the product is subtracted from a dimensionless 0–1 index before clamping. The clamp hides the incoherence. Flagged in AUDIT.md §4; scheduled for repair in the v0.3 exposure decomposition.'),

  // litigation pressure
  spec('litigation_pressure', 'discoverability', 'Perceived discoverability', LITIGATION_PRESSURE.discoverability, 'Largest share. Same PD-unit caveat as the safe-to-report penalty above.'),
  spec('litigation_pressure', 'pld_penalty', 'PLD adverse-inference penalty', LITIGATION_PRESSURE.pld_penalty, 'Product Liability Directive Art. 9(1) rebuttable presumption on non-compliance with a disclosure order.', SRC_PLAYBOOK),
  spec('litigation_pressure', 'mandatory_reporting', 'Mandatory reporting', LITIGATION_PRESSURE.mandatory_reporting, 'Compulsion raises the felt exposure of the records it creates.'),
  spec('litigation_pressure', 'unsafe_to_report', 'Unsafe-to-report share', LITIGATION_PRESSURE.unsafe_to_report, 'Applied to (1 − safe_to_report_score): felt pressure rises where reporting is not protected.'),
  spec('litigation_pressure', 'no_records_boundary', 'Missing records boundary', LITIGATION_PRESSURE.no_records_boundary, 'Applied to (1 − original_records_boundary): without a clean factual core, everything looks like analysis.'),
]

export const READOUT_WEIGHTS_BY_GROUP: Record<ReadoutGroup, ReadoutWeightSpec[]> =
  READOUT_WEIGHT_SPECS.reduce(
    (acc, s) => {
      ;(acc[s.group] ??= []).push(s)
      return acc
    },
    {} as Record<ReadoutGroup, ReadoutWeightSpec[]>,
  )

/**
 * The unweighted mean in `privateOrderableCapacity` is itself a modelling choice:
 * it asserts that all seven private-ordering levers are equally substitutable.
 * Named here so the assumption is visible rather than buried in a `/ 7`.
 */
export const PRIVATE_ORDERABLE_LEVERS = [
  'original_records_boundary',
  'effective_challenge',
  'near_miss_tier',
  'intermediary_capacity',
  'translation_layer',
  'just_culture',
  'recipient_enforcer_separation',
] as const
