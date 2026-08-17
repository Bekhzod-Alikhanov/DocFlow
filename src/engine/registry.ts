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
  R1: {
    id: 'R1',
    label: 'Channel One — factual record',
    short: 'C1 factual',
    unit: 'records',
    min: 0,
    max: null,
    default: 5,
    note: 'Contemporaneous telemetry and system-state facts, discoverable by design. Written regardless of legal posture.',
  },
  R2: {
    id: 'R2',
    label: 'Channel Two — privileged analysis',
    short: 'C2 privileged',
    unit: 'analyses',
    min: 0,
    max: null,
    default: 0,
    note: 'Counsel-directed causal and liability analysis, entered through the pre-committed tripwire. The only channel whose existence depends on its legal protection.',
  },
  R3: {
    id: 'R3',
    label: 'Channel Three — remediation',
    short: 'C3 remediation',
    unit: 'work orders',
    min: 0,
    max: null,
    default: 0,
    note: 'Regression tests, guardrail changes and deployment restrictions in operational language, stripped of causal reasoning. The learning conduit.',
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
  E_pl: {
    id: 'E_pl',
    label: 'Products-liability exposure',
    short: 'PL exposure',
    unit: 'exposure index',
    min: 0,
    max: null,
    default: 10,
    note: 'RISES WITH CANDOUR: discovery of the factual record, plus privileged analysis to the extent privilege fails. The gradient that makes suppression tempting.',
  },
  E_reg: {
    id: 'E_reg',
    label: 'Regulatory exposure',
    short: 'Reg exposure',
    unit: 'exposure index',
    min: 0,
    max: null,
    default: 5,
    note: 'RISES WITH SUPPRESSION: unmet affirmative duties (EU AI Act Art. 73) and the PLD Art. 9(1) rebuttable presumption on undocumented incidents.',
  },
  E_fid: {
    id: 'E_fid',
    label: 'Fiduciary / oversight exposure',
    short: 'Fiduciary exposure',
    unit: 'exposure index',
    min: 0,
    max: null,
    default: 2,
    note: 'RISES WITH SUPPRESSION: Caremark-style oversight liability when the board is deprived of the incident data its duties require.',
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
    id: 'precommit',
    label: 'Pre-committed escalation',
    unit: '0-1',
    default: 0.3,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'In re Target (2015) protection survived; In re Capital One (2020) and In re Rutter\'s (2021) failed',
    note: 'Was entry to the protected channel fixed BEFORE any incident, by a published telemetry tripwire, or decided after the fact? The single strongest factor distinguishing the cases where privilege survived from those where it did not.',
    advanced: false,
    leverFamily: 'legal',
    tier: 'T4',
    whatWouldConstrainIt:
      'Coded outcomes of privilege rulings on incident forensics, scored for pre-commitment (CALIBRATION.md section 3; not executed).',
    citationStatus: 'unverified',
  },
  {
    id: 'significant_purpose',
    label: 'Significant legal purpose',
    unit: '0-1',
    default: 0.35,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'In re Kellogg Brown & Root (D.C. Cir. 2014) significant-purpose test',
    note: 'Was obtaining or providing legal advice A significant purpose of the work? Protection can survive a parallel regulatory or business purpose, but not a purely operational one.',
    advanced: false,
    leverFamily: 'legal',
    tier: 'T4',
    whatWouldConstrainIt:
      'The same case-law coding, scored for stated purpose. Also whether courts treat this as binary in practice (OPEN_QUESTIONS Q8).',
    citationStatus: 'unverified',
  },
  {
    id: 'valve_discipline',
    label: 'One-way valve discipline',
    unit: '0-1',
    default: 0.35,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'Playbook 3.2.2 strict one-way valve; Fed. R. Evid. 407 independent-admission limit',
    note: 'How tightly causal and normative conclusions are kept out of engineering tickets and dashboards. Low discipline leaks conclusions outward, which risks waiver AND creates independent admissions that can survive Rule 407 exclusion.',
    advanced: false,
    leverFamily: 'legal',
    tier: 'T4',
    whatWouldConstrainIt:
      'Audit of whether real remediation tickets carry causal language; discovery outcomes where they did.',
    citationStatus: 'unverified',
  },
  {
    id: 'kovel_evaluator',
    label: 'Outside evaluator under Kovel',
    unit: '0-1',
    default: 0.2,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'United States v. Kovel, 296 F.2d 918 (2d Cir. 1961)',
    note: 'An independent technical expert retained to assist counsel. Raises the significant-purpose showing, but widens the circle and so raises leakage hazard. Privilege does not protect an auditor merely because counsel arranged the engagement.',
    advanced: false,
    leverFamily: 'governance',
    tier: 'T4',
    whatWouldConstrainIt:
      'Outcomes of privilege challenges where a technical consultant was engaged through counsel.',
    citationStatus: 'unverified',
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
    leverFamily: 'governance',
    tier: 'T4',
    whatWouldConstrainIt:
      'Adoption and effect data for codified just-culture standards (ASAP "Big Five", EU Reg. 376/2014 Art. 16(10)).',
    citationStatus: 'unverified',
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
    leverFamily: 'legal',
    tier: 'T4',
    whatWouldConstrainIt:
      'Compliance and reporting-volume data once EU AI Act Art. 73 is operative.',
    citationStatus: 'pin-cite-pending',
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
    leverFamily: 'legal',
    tier: 'T4',
    whatWouldConstrainIt:
      'Frequency with which courts apply the PLD Art. 9(1) rebuttable presumption after non-compliance.',
    citationStatus: 'pin-cite-pending',
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
    leverFamily: 'governance',
    tier: 'T4',
    whatWouldConstrainIt:
      'ASRS vs FAA-direct reporting volumes as a natural experiment in separation.',
    citationStatus: 'unverified',
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
    leverFamily: 'learning',
    tier: 'T4',
    whatWouldConstrainIt:
      'Fraction of safety findings that reach engineering as an actioned requirement.',
    citationStatus: 'unverified',
  },
  {
    id: 'workflow_protection',
    label: 'Workflow protection',
    unit: '0–1',
    default: 0.2,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3; PSQIA PSES, 42 U.S.C. §§299b-21–26; HHS Guidance 81 Fed. Reg. 32655',
    note: 'PSQIA-style protection of a defined safety-evaluation process rather than a single document. Lowers dual-purpose backfire.',
    advanced: false,
    leverFamily: 'legal',
    tier: 'T4',
    whatWouldConstrainIt:
      'PSQIA listing and adoption data, plus outcomes of PSES protection challenges.',
    citationStatus: 'unverified',
  },
  {
    id: 'original_records_boundary',
    label: 'Original-records boundary',
    unit: '0–1',
    default: 0.3,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3; PSQIA original-records exception; AI Incident Playbook factual-record architecture',
    note: 'A discoverable factual core is kept outside protected analysis, making documentation more legitimate and less weaponizable.',
    advanced: false,
    leverFamily: 'legal',
    tier: 'T4',
    whatWouldConstrainIt:
      'Discovery outcomes where a firm maintained a clean factual/analytic split.',
    citationStatus: 'unverified',
  },
  {
    id: 'safe_harbor_non_admission',
    label: 'Safe harbor / non-admission',
    unit: '0–1',
    default: 0.1,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3; CIRCIA §681e; 21 C.F.R. §§803.16, 314.80(k), 600.80(k)',
    note: 'Reporting is treated as a signal rather than an admission of fault. Lowers litigation pressure from candid reports.',
    advanced: false,
    leverFamily: 'legal',
    tier: 'T4',
    whatWouldConstrainIt:
      'Reporting volumes before and after CIRCIA section 681e-style non-admission rules.',
    citationStatus: 'unverified',
  },
  {
    id: 'effective_challenge',
    label: 'Effective challenge',
    unit: '0–1',
    default: 0.2,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3; Federal Reserve/OCC SR 11-7 model risk management',
    note: 'Independent review with competence, incentives, and influence. Converts incident findings into forced model changes.',
    advanced: false,
    leverFamily: 'governance',
    tier: 'T4',
    whatWouldConstrainIt:
      'SR 11-7 examination findings on validation independence and its effect on remediation.',
    citationStatus: 'unverified',
  },
  {
    id: 'near_miss_tier',
    label: 'Voluntary near-miss tier',
    unit: '0–1',
    default: 0.2,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3; ASRS; EU Reg. 376/2014 mandatory floor + voluntary tier',
    note: 'A low-stakes weak-signal channel alongside mandatory serious-incident reporting. Adds learning without much exposure.',
    advanced: false,
    leverFamily: 'learning',
    tier: 'T4',
    whatWouldConstrainIt:
      'Near-miss vs serious-incident report ratios in ASRS and EU Reg. 376/2014 regimes.',
    citationStatus: 'unverified',
  },
  {
    id: 'intermediary_capacity',
    label: 'Intermediary capacity',
    unit: '0–1',
    default: 0.2,
    min: 0,
    max: 1,
    group: 'lever',
    evidence_basis: ILLUSTRATIVE,
    source: 'WS3; NASA ASRS, AHRQ PSOs/NPSD, ASIAS/MITRE, INPO SEE-IN',
    note: 'A funded analytic body that turns raw reports into shared safety outputs and visible feedback.',
    advanced: false,
    leverFamily: 'learning',
    tier: 'T4',
    whatWouldConstrainIt:
      'Funding and throughput data for ASIAS, AHRQ NPSD and INPO operating-experience programmes.',
    citationStatus: 'unverified',
  },
]

/** Structural coefficients (spec §2.2–2.3) — the Advanced panel. */
const STRUCTURAL_SPECS: ParamSpec[] = [
  // --- documentation fraction f_doc + perceived discoverability ---
  { id: 'gain', label: 'Logistic gain (f_doc steepness)', unit: 'dimensionless', default: 15, min: 1, max: 20, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Steepness of the documentation-fraction sigmoid. Higher → sharper tipping threshold; also deepens the culture fold. Calibrated for bistability (see MODEL.md).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Observed sharpness of the transition between documenting and not documenting, e.g. from a firm that crossed it.' },
  { id: 'threshold', label: 'Documentation drive threshold', unit: 'drive units', default: 0.6, min: 0, max: 1.5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Net drive at which f_doc = 0.5. Calibrated so the cyber chilling attractor lands near f_doc ≈ 0.05 (the Schwarcz 2023 estimate).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'A measured documentation rate at a known lever configuration.' },
  { id: 'a_c', label: 'Culture → drive weight', unit: 'drive/culture', default: 1.0, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How strongly culture C raises the drive to document. The main dynamic input to f_doc.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Effect size of psychological safety on the decision to record.' },
  { id: 'a_jc', label: 'Just-culture → drive weight', unit: 'drive/lever', default: 0.6, min: 0, max: 1.5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Direct lift to documentation drive from a codified just-culture line.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Direct effect of a written just-culture standard on the decision to record.' },
  { id: 'a_m', label: 'Mandatory-reporting → drive weight', unit: 'drive/lever', default: 0.35, min: 0, max: 1.5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Compulsion stick: raises documentation drive.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Compliance uplift attributable to a mandatory-reporting duty.' },
  { id: 'a_disc', label: 'Discoverability → drive penalty', unit: 'drive/PD', default: 0.8, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How strongly perceived discoverability (when positive) suppresses the drive to document.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Measured suppression attributable to perceived discoverability.' },
  { id: 'w_m', label: 'Mandatory-reporting → discoverability', unit: 'PD/lever', default: 0.5, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Compulsion also raises felt exposure of the records it creates.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Elicited or measured contribution of this mechanism to perceived discoverability; currently these eight are jointly unidentifiable (AUDIT.md 5.2).' },
  { id: 'w_p', label: 'PLD penalty → discoverability', unit: 'PD/lever', default: 0.7, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Adverse-inference regime raises the felt discoverability of the record environment.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Elicited or measured contribution of this mechanism to perceived discoverability; currently these eight are jointly unidentifiable (AUDIT.md 5.2).' },
  { id: 'w_priv', label: 'Privilege → discoverability (−)', unit: 'PD/lever', default: 1.0, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Credible privilege lowers perceived discoverability.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Elicited or measured contribution of this mechanism to perceived discoverability; currently these eight are jointly unidentifiable (AUDIT.md 5.2).' },
  { id: 'w_sep', label: 'Separation → discoverability (−)', unit: 'PD/lever', default: 0.8, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Recipient–enforcer separation lowers perceived discoverability.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Elicited or measured contribution of this mechanism to perceived discoverability; currently these eight are jointly unidentifiable (AUDIT.md 5.2).' },
  { id: 'w_tl', label: 'Translation layer → discoverability (−)', unit: 'PD/lever', default: 0.6, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'A factual record decoupled from fault narrative lowers perceived discoverability.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Elicited or measured contribution of this mechanism to perceived discoverability; currently these eight are jointly unidentifiable (AUDIT.md 5.2).' },
  { id: 'w_workflow', label: 'Workflow protection → discoverability (−)', unit: 'PD/lever', default: 0.7, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'DocFlow v0.2; PSQIA workflow-protection analogy', note: 'Defined workflow protection lowers the dual-purpose discoverability penalty.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Elicited or measured contribution of this mechanism to perceived discoverability; currently these eight are jointly unidentifiable (AUDIT.md 5.2).' },
  { id: 'w_records', label: 'Original-record boundary → discoverability (−)', unit: 'PD/lever', default: 0.35, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'DocFlow v0.2; PSQIA original-records exception', note: 'A clean factual/analytic boundary lowers discoverability pressure by keeping facts accessible and analysis bounded.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Elicited or measured contribution of this mechanism to perceived discoverability; currently these eight are jointly unidentifiable (AUDIT.md 5.2).' },
  { id: 'pd_sharpness', label: 'Discoverability kink sharpness', unit: '1/PD', default: 20, min: 5, max: 100, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Smoothness fix v0.3.0 (AUDIT.md F15); not in BUILD_SPEC', note: 'Sharpness of the softplus that replaced the hard ReLU on perceived discoverability. Higher = closer to a kink; lower = smoother but a larger positive bias (ln2/beta) at the zero crossing. Purely a numerical-form parameter: it has no institutional meaning and its influence should be reported by the steepness sweep, not interpreted.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Softplus sharpness replacing a hard kink. Numerical form with no institutional meaning.' },
  { id: 'w_safe', label: 'Safe harbor → discoverability (−)', unit: 'PD/lever', default: 0.65, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'DocFlow v0.2; CIRCIA §681e and FDA non-admission rules', note: 'Safe-harbor and non-admission rules lower the perceived litigation penalty of reporting.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Elicited or measured contribution of this mechanism to perceived discoverability; currently these eight are jointly unidentifiable (AUDIT.md 5.2).' },

  // --- incident generation ---
  { id: 'base_incident_rate', label: 'Base incident rate', unit: 'incidents/month', default: 3, min: 0.5, max: 8, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Incident inflow at zero debt and zero learning.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Incident counts per unit deployment from AIID or internal telemetry.' },
  { id: 'alpha_td', label: 'Debt → incident amplification', unit: 'per TD_ref', default: 0.6, min: 0, max: 2, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: 'Direction per Sculley et al. 2015 (debt compounds); magnitude illustrative', note: 'Latent technical debt breeds new incidents. Sign is theory-grounded; magnitude is assumed.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Measured relationship between accumulated technical debt and incident rate.' },
  { id: 'TD_ref', label: 'Reference technical debt', unit: 'debt index', default: 10, min: 1, max: 50, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Normalizer for the debt→incident term.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'A normaliser that defines the debt index scale; it fixes units rather than asserting a magnitude.' },
  { id: 'td_sat', label: 'Debt→incident saturation', unit: 'TD_ref units', default: 4, min: 0.5, max: 20, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: 'Well-posedness refinement (MODEL.md); not in BUILD_SPEC', note: 'Saturation point of the debt→incident feedback. The max amplification is 1 + alpha_td·td_sat. Replaces the spec’s unbounded linear term so the chilling regime stays finite.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Saturation ceiling introduced for well-posedness (the linear form diverged). A form choice, not a measurement.' },
  { id: 'beta_L', label: 'Learning → incident suppression', unit: 'per 100 L', default: 0.4, min: 0, max: 0.9, group: 'incidents', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Capability reduces incident generation (kept <1 so inflow stays positive).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Measured reduction in incident rate attributable to safety capability.' },

  // --- learning ---
  { id: 'eta_learn', label: 'Learning gain per documented incident', unit: 'L per incident', default: 0.8, min: 0, max: 2, group: 'learning', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How much durable capability a documented, analyzed incident produces.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Measured capability gain per documented and analysed incident.' },
  { id: 'base_eff', label: 'Base translation efficiency', unit: 'dimensionless', default: 0.5, min: 0.1, max: 1, group: 'learning', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Baseline conversion of documented incidents into learning, with no translation layer.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Fraction of documented incidents that yield an actioned engineering change.' },
  { id: 'tl_boost', label: 'Translation-layer efficiency boost', unit: 'per lever', default: 0.8, min: 0, max: 2, group: 'learning', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Added learning efficiency from a strong safety translation layer.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Difference in that fraction with and without a translation function.' },
  { id: 'intermediary_efficiency_boost', label: 'Intermediary efficiency boost', unit: 'per lever', default: 0.55, min: 0, max: 2, group: 'learning', evidence_basis: ILLUSTRATIVE, source: 'DocFlow v0.2; ASIAS/MITRE, AHRQ NPSD, INPO operating experience', note: 'Added learning efficiency from a funded analytic intermediary that converts reports into reusable safety outputs.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'ASIAS/AHRQ NPSD data on analytic yield with a funded intermediary.' },
  { id: 'challenge_learning_boost', label: 'Effective-challenge learning boost', unit: 'per lever', default: 0.45, min: 0, max: 2, group: 'learning', evidence_basis: ILLUSTRATIVE, source: 'DocFlow v0.2; SR 11-7 effective challenge', note: 'Independent reviewers with influence make each documented incident more likely to become durable learning.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'SR 11-7 validation outcomes: change rate with vs without independent challenge.' },
  { id: 'near_miss_learning_boost', label: 'Near-miss weak-signal learning', unit: 'L per signal', default: 0.28, min: 0, max: 1, group: 'learning', evidence_basis: ILLUSTRATIVE, source: 'DocFlow v0.2; ASRS and EU Reg. 376/2014 voluntary occurrence tier', note: 'Learning contribution from low-exposure near-miss reports that may not become formal incident records.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Learning yield of near-miss reports relative to serious-incident reports (ASRS).' },
  { id: 'delta_L', label: 'Learning erosion (turnover)', unit: '1/month', default: 0.1, min: 0.01, max: 0.5, group: 'learning', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Rate at which capability decays without reinforcement.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Capability decay measured against engineering turnover rates.' },

  // --- documented-incident & debt dynamics ---
  { id: 'rho', label: 'Remediation rate', unit: '1/month', default: 0.15, min: 0, max: 0.5, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Debt fixed per documented incident, scaled by capability (rho·D·L/100).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Observed debt-retirement rate per documented incident.' },
  { id: 'challenge_remediation_boost', label: 'Effective-challenge remediation boost', unit: 'per lever', default: 0.65, min: 0, max: 2, group: 'debt', evidence_basis: ILLUSTRATIVE, source: 'DocFlow v0.2; SR 11-7 validation → forced change loop', note: 'Independent validation with standing accelerates conversion of documented findings into remediation.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Remediation throughput with vs without independent validation.' },
  { id: 'kappa_D', label: 'Documented-incident closeout', unit: '1/month', default: 0.3, min: 0.05, max: 0.8, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Rate at which documented incidents are closed out of the active stock.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Mean time an incident stays open in a real tracker.' },
  { id: 'mu', label: 'Belated documentation rate', unit: '1/month', default: 0.1, min: 0, max: 0.5, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Fraction of undocumented incidents belatedly documented (hard, no contemporaneous record).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Rate at which previously undocumented incidents are belatedly written up.' },
  { id: 'sigma', label: 'Undocumented → debt rate', unit: '1/month', default: 0.25, min: 0.02, max: 0.6, group: 'debt', evidence_basis: 'illustrative-assumption', source: 'Direction per Sculley et al. 2015; magnitude illustrative', note: 'Undocumented incidents decay into latent technical debt.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Rate at which unanalysed incidents become latent debt.' },
  { id: 'td_baseline', label: 'Baseline debt accrual', unit: 'debt/month', default: 0.5, min: 0, max: 3, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Debt that accrues independent of incidents (entropy, drift).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Background debt accrual independent of incidents (entropy, drift).' },
  { id: 'delta_TD', label: 'Natural debt retirement', unit: '1/month', default: 0.05, min: 0, max: 0.3, group: 'debt', evidence_basis: ILLUSTRATIVE, source: 'Well-posedness refinement (MODEL.md); not in BUILD_SPEC', note: 'Debt retired independent of incident learning (refactoring, deprecation, system replacement). Added so a finite chilling equilibrium exists.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Natural debt retirement, added so a finite chilling equilibrium exists. Well-posedness.' },
  { id: 'gamma', label: 'Debt → harm conversion', unit: 'harm per TD', default: 0.5, min: 0, max: 2, group: 'debt', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How much latent debt surfaces as harm events, mitigated by capability (1−L/100).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Measured conversion of latent debt into user-visible harm.' },
  { id: 'td_k', label: 'Debt availability half-saturation', unit: 'debt index', default: 2, min: 0.1, max: 20, group: 'debt', evidence_basis: ILLUSTRATIVE, source: 'Well-posedness fix v0.3.0 (AUDIT.md F2); not in BUILD_SPEC', note: 'Gates remediation by how much debt is actually available to fix: TD/(TD+td_k). Makes TD=0 an invariant of the equations, so the lower bound no longer has to be enforced by a clamp.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Half-saturation that makes TD = 0 an invariant of the equations. Purely structural.' },

  // --- exposure ---
  { id: 'phi_doc', label: 'Documenting → exposure', unit: 'exposure/incident', default: 0.4, min: 0, max: 1, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Discovery exposure from creating records, UNLESS privilege protects them.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Discovery exposure realised per document produced, from litigation records.' },
  { id: 'phi_harm', label: 'Harm → exposure', unit: 'exposure/harm', default: 0.3, min: 0, max: 1, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Realized harm raises litigation/regulatory exposure.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Exposure realised per harm event, from settlement and enforcement data.' },
  { id: 'phi_pld', label: 'PLD adverse inference → exposure', unit: 'exposure/incident', default: 0.5, min: 0, max: 1.5, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Non-documentation penalty applied to undocumented incidents (punishes suppression).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Adverse-inference exposure per undocumented incident under PLD Art. 9(1).' },
  { id: 'theta_E', label: 'Exposure decay/settlement', unit: '1/month', default: 0.2, min: 0.02, max: 0.6, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Exposure settles/decays over time.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Observed settlement and decay timescale of litigation exposure.' },

  // --- culture ---
  { id: 'omega', label: 'Safety wins → culture', unit: 'culture/f_doc', default: 2.1, min: 0, max: 4, group: 'culture', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Visible safety wins (documentation working, scaled by translation efficiency) raise culture (R2 reinforcement). Strength of the virtuous loop. Calibrated for bistability.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Longitudinal data on whether visible safety wins raise reporting rates.' },
  { id: 'psi', label: 'Backfire → culture (−)', unit: 'culture/f_doc', default: 1.04, min: 0, max: 5, group: 'culture', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Seeing records weaponized (documenting without privilege) lowers culture; gated by (1−protection). v0.3.0: phi_doc was removed from this term (it is an exposure/incident conversion and had no business in the culture equation — AUDIT.md F7). The default 1.04 preserves the v0.2 effective product psi·phi_doc = 2.6 × 0.4, so this is a dimensional repair, not a re-tuning.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Longitudinal data on reporting rates after a candid record was used adversely.' },
  { id: 'lambda_C', label: 'Culture adjustment speed', unit: '1/month', default: 0.3, min: 0.02, max: 1, group: 'culture', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'How fast culture moves toward its target. Slow → strong hysteresis.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Time constant of measured culture-survey change after a policy intervention.' },
  { id: 'a_sep', label: 'Separation → culture', unit: 'culture/lever', default: 0.13, min: 0, max: 1.5, group: 'culture', evidence_basis: ILLUSTRATIVE, source: SPEC_SRC, note: 'Recipient–enforcer separation directly raises the culture target.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Effect size of recipient-enforcer separation on reporting, e.g. ASRS vs FAA-direct reporting.' },
  { id: 'a_jc_c', label: 'Just culture → culture target', unit: 'culture/lever', default: 0.38, min: 0, max: 1.5, group: 'culture', evidence_basis: 'illustrative-assumption', source: 'Refinement (MODEL.md): the spec used coefficient 1 implicitly', note: 'Weight of the just-culture baseline in the culture target (symmetric with a_sep).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Effect size of a codified just-culture policy on reporting, e.g. from ASAP adoption studies.' },

  // --- v0.3.0 M3b: endogenous privilege and the one-way valve ---
  { id: 'b0', label: 'Privilege logit intercept', unit: 'logit', default: -1.2, min: -5, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Uncalibrated. Baseline odds that a privilege claim over incident forensics survives', note: 'Intercept of the privilege-survival logit. Negative by default because courts have repeatedly declined to extend protection to incident forensics.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'The case-law coding protocol in CALIBRATION.md section 3, which is specified but NOT EXECUTED. Until it is, this coefficient is uncalibrated with stated bounds.' },
  { id: 'b_pre', label: 'Weight: pre-commitment', unit: 'logit/factor', default: 2.2, min: 0, max: 5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'In re Target (2015) vs In re Capital One (2020)', note: 'Largest weight: pre-committed entry is what most distinguishes surviving claims from pierced ones.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'The case-law coding protocol in CALIBRATION.md section 3, which is specified but NOT EXECUTED. Until it is, this coefficient is uncalibrated with stated bounds.' },
  { id: 'b_sep', label: 'Weight: separation from ordinary course', unit: 'logit/factor', default: 1.8, min: 0, max: 5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'The would-have-been-done-anyway test', note: 'Weight on demonstrable separation of the protected workstream from work that would have happened regardless.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'The case-law coding protocol in CALIBRATION.md section 3, which is specified but NOT EXECUTED. Until it is, this coefficient is uncalibrated with stated bounds.' },
  { id: 'b_purp', label: 'Weight: significant legal purpose', unit: 'logit/factor', default: 1.5, min: 0, max: 5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'In re Kellogg Brown & Root (2014)', note: 'Weight on the significant-purpose showing.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'The case-law coding protocol in CALIBRATION.md section 3, which is specified but NOT EXECUTED. Until it is, this coefficient is uncalibrated with stated bounds.' },
  { id: 'b_valve', label: 'Weight: valve integrity', unit: 'logit/factor', default: 1.0, min: 0, max: 5, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Waiver on outward leakage of conclusions', note: 'Weight on keeping causal conclusions inside the protected channel.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'The case-law coding protocol in CALIBRATION.md section 3, which is specified but NOT EXECUTED. Until it is, this coefficient is uncalibrated with stated bounds.' },
  { id: 'p_court', label: 'P(court credits the tripwire)', unit: '0-1', default: 0.5, min: 0, max: 1, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'UNTESTED DEVICE. The paper concedes no court has yet passed on its central device', note: 'Probability that a court accepts a pre-committed telemetry tripwire as genuine anticipation of litigation. UNKNOWABLE BY CONSTRUCTION - sweep it across [0,1] and report outcomes as a range; never quote a point value.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Nothing available: no court has ruled. Only an actual decision on the device would constrain this.' },
  { id: 'lambda_base', label: 'Base leakage pressure', unit: '0-1', default: 0.6, min: 0, max: 1, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Organisational pressure to explain causes in operational records', note: 'Leakage pressure before valve discipline is applied. Engineers naturally want to write down why something broke.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Audit of how often causal language appears in remediation tickets absent an explicit discipline.' },
  { id: 'l_kovel', label: 'Kovel leakage surcharge', unit: '0-1', default: 0.12, min: 0, max: 0.6, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'United States v. Kovel (1961); widening the circle widens the leak', note: 'Additional leakage hazard from admitting an outside evaluator to the protected channel.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Privilege outcomes in matters with vs without a counsel-retained technical consultant.' },
  { id: 'g_valve', label: 'Waiver cliff steepness', unit: '1/leak', default: 25, min: 5, max: 100, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Waiver is adjudicated, not gradual; subject-matter waiver can extend beyond the leaked document', note: 'Steepness of the waiver transition. Deliberately steep: a court finds privilege waived or it does not, so a smooth ramp would misrepresent the mechanism. Sensitivity to this MUST be reported (VALIDATION V9.1).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Distribution of leakage severity across cases where waiver was and was not found.' },
  { id: 'lambda_crit', label: 'Waiver threshold', unit: '0-1', default: 0.45, min: 0.05, max: 0.95, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Leakage at which a waiver finding becomes likely', note: 'Leakage level at which the waiver probability passes one half.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Coded leakage severity in decisions that did and did not find waiver.' },
  { id: 'w_max', label: 'Maximum waiver loss', unit: '0-1', default: 0.9, min: 0, max: 1, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Subject-matter waiver can reach the whole subject, not just the leaked document', note: 'Share of privilege destroyed by a full waiver finding.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Scope of waiver actually granted in decided cases.' },
  { id: 'adm', label: 'Independent admissions per leak', unit: 'admissions/analysis', default: 0.5, min: 0, max: 2, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'Fed. R. Evid. 407 excludes the remedial measure, not statements made alongside it', note: 'Independent admissions created when causal language leaks into the operational record. These may remain admissible EVEN WHERE Rule 407 excludes the remedial measure itself - so leakage costs twice.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Frequency with which leaked causal statements were admitted despite a 407 exclusion.' },
  { id: 'xi_adm', label: 'Admission -> products-liability exposure', unit: 'exposure/admission', default: 1.2, min: 0, max: 4, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'An admission is directly probative in a way a remedial measure is not', note: 'Exposure per independent admission. Higher per unit than record discovery because an admission speaks to fault rather than to facts.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Case outcomes where an independent admission was admitted over a 407 objection.' },

  // --- v0.3.0 M3: three channels, tripwire, and decomposed exposure ---
  { id: 'g_trip', label: 'Tripwire steepness', unit: '1/severity', default: 12, min: 2, max: 40, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Pre-committed telemetry tripwire (Playbook 3.2.2); frontier-lab capability thresholds', note: 'Sharpness of the pre-committed threshold that opens Channel Two. Higher = more switch-like.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Observed crossing behaviour of a published capability threshold.' },
  { id: 'tau_review', label: 'Tripwire review threshold', unit: 'severity', default: 0.35, min: 0, max: 1, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Playbook 3.2.2 tiered band (logging tier beneath review tier)', note: 'Normalised severity at which counsel is engaged and the privileged channel opens. RED-TEAM TARGET: raising this is the nominally-compliant, practically-inert gaming strategy.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'A firm publishing its actual threshold and its crossing rate.' },
  { id: 'sev_k', label: 'Severity half-saturation', unit: 'harm', default: 18, min: 1, max: 200, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Structural: normalises harm onto a 0-1 severity scale', note: 'Maps unbounded harm onto the 0-1 severity scale the tripwire compares against.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Structural normaliser; it defines the severity scale rather than asserting a magnitude.' },
  { id: 'kappa_2', label: 'Tripwire to privileged analysis', unit: 'analyses/incident', default: 0.8, min: 0, max: 2, group: 'documentation', evidence_basis: ILLUSTRATIVE, source: 'Playbook 1.2.2', note: 'Share of tripped incidents that become a counsel-directed analysis.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Observed rate at which escalations become formal privileged reviews.' },
  { id: 'delta_R1', label: 'Factual-record decay', unit: '1/month', default: 0.02, min: 0, max: 0.3, group: 'debt', evidence_basis: ILLUSTRATIVE, source: 'Retention and rotation of telemetry', note: 'Records age out of the active window (retention limits, schema drift).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Actual telemetry retention windows at a deployed AI service.' },
  { id: 'delta_R2', label: 'Privileged-analysis closeout', unit: '1/month', default: 0.25, min: 0.02, max: 0.8, group: 'debt', evidence_basis: ILLUSTRATIVE, source: 'Matter lifecycle', note: 'Rate at which a privileged matter closes.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Mean duration of a counsel-led incident review.' },
  { id: 'delta_R3', label: 'Remediation closeout', unit: '1/month', default: 0.3, min: 0.05, max: 0.8, group: 'debt', evidence_basis: ILLUSTRATIVE, source: 'Engineering ticket lifecycle', note: 'Rate at which remediation work orders are completed and closed.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Mean time-to-close on remediation tickets in a real tracker.' },
  { id: 'rate_23', label: 'Privileged analysis to remediation', unit: 'work orders/analysis', default: 0.7, min: 0, max: 2, group: 'learning', evidence_basis: ILLUSTRATIVE, source: 'Playbook 1.2.3 (analysis exits as remedial requirements)', note: 'Conversion of protected analysis into operational work orders, scaled by surviving privilege.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Share of counsel-led reviews that produce a tracked engineering change.' },
  { id: 'rate_13', label: 'Factual record to direct fix', unit: 'work orders/record', default: 0.12, min: 0, max: 1, group: 'learning', evidence_basis: ILLUSTRATIVE, source: 'Routine fixes that never need counsel', note: 'Routine remediation driven straight off the factual record without entering Channel Two.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Share of incidents remediated without legal escalation.' },
  { id: 'c_rec_exp', label: 'Discovery exposure per record', unit: 'exposure/record', default: 0.05, min: 0, max: 0.5, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'Structural unit conversion (AUDIT.md F7 named it)', note: 'Converts factual records into products-liability exposure. Previously folded invisibly into phi_doc.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Structural conversion defining the exposure index in terms of records.' },
  { id: 'disc_prob', label: 'Probability the record is reached in discovery', unit: '0-1', default: 0.5, min: 0, max: 1, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'Fed. R. Civ. P. 26(b)(1) proportionality', note: 'Chance the factual record is actually produced. Channel One is discoverable BY DESIGN, so this is high and largely irreducible.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Production rates for engineering telemetry in comparable product-liability discovery.' },
  { id: 'xi_2', label: 'Unprotected analysis to exposure', unit: 'exposure/analysis', default: 0.9, min: 0, max: 3, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'Playbook 1.2.2; In re Capital One (2020)', note: 'Exposure per privileged analysis TO THE EXTENT PRIVILEGE FAILS. Scaled by (1 - privilege survival).', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Observed damage when a privilege claim over incident forensics is pierced.' },
  { id: 'c_harm_exp', label: 'Exposure per harm event', unit: 'exposure/harm', default: 0.3, min: 0, max: 1.5, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'Structural unit conversion', note: 'Converts realised harm into products-liability exposure.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Structural conversion defining exposure in terms of harm events.' },
  { id: 'rate_harm', label: 'Harm rate conversion', unit: '1/month', default: 0.1, min: 0.01, max: 1, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'Structural (AUDIT.md F7: harm_events was used as both level and rate)', note: 'Converts the harm LEVEL into a per-month rate. v0.2 omitted this and used a level directly as a flow.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Structural conversion; it fixes the level-vs-rate mismatch rather than asserting a magnitude.' },
  { id: 'xi_duty', label: 'Unmet reporting duty to regulatory exposure', unit: 'exposure/incident', default: 0.45, min: 0, max: 2, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'EU AI Act (Reg. 2024/1689) Art. 73 serious-incident reporting', note: 'Regulatory exposure accruing from incidents that a duty required be reported and were not.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Enforcement action rates under Art. 73 once operative.' },
  { id: 'xi_pld', label: 'PLD presumption to regulatory exposure', unit: 'exposure/incident', default: 0.6, min: 0, max: 2, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'PLD Dir. (EU) 2024/2853 Art. 9(1) rebuttable presumption', note: 'Exposure from the rebuttable presumption of defectiveness triggered by failure to disclose.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Frequency with which courts actually apply the Art. 9(1) presumption.' },
  { id: 'xi_board', label: 'Board blind-spot to fiduciary exposure', unit: 'exposure/harm', default: 0.5, min: 0, max: 2, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'In re Caremark (Del. Ch. 1996); Shapira 2022', note: 'Oversight exposure when harm occurs and the board lacked the incident data its duties require.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Survival rates of Caremark oversight claims past a motion to dismiss.' },
  { id: 'bv_k', label: 'Board visibility half-saturation', unit: 'records', default: 12, min: 1, max: 100, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'Structural normaliser', note: 'Volume of factual record at which board visibility reaches half its maximum.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Structural normaliser for the visibility curve.' },
  { id: 'v_pl', label: 'Weight: products-liability exposure', unit: 'dimensionless', default: 1, min: 0, max: 3, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'FREE. Determines the dominance boundary (RISKS.md R2)', note: 'Weight of PL exposure in total exposure. THIS RATIO DETERMINES THE HEADLINE RESULT and nobody has measured it.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Distribution of realised products-liability judgments and settlements against software defendants.' },
  { id: 'v_reg', label: 'Weight: regulatory exposure', unit: 'dimensionless', default: 1, min: 0, max: 3, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'FREE. Determines the dominance boundary (RISKS.md R2)', note: 'Weight of regulatory exposure in total exposure. Set to 0 to model a no-enforcement world.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Enforcement base rates and penalty magnitudes under the AI Act and PLD.' },
  { id: 'v_fid', label: 'Weight: fiduciary exposure', unit: 'dimensionless', default: 0.6, min: 0, max: 3, group: 'exposure', evidence_basis: ILLUSTRATIVE, source: 'FREE. May be near-zero if Caremark is doctrinally weak (OPEN_QUESTIONS Q3)', note: 'Weight of fiduciary exposure. Explicitly permitted to be zero: if Caremark is near-dead, this channel should not carry weight.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Outcomes and settlement values of oversight-liability claims.' },

  // --- culture: the R1 loop closure (v0.3.0) ---
  // Before v0.3.0 the culture equation depended only on C and parameters, so the
  // documented debt → harm → exposure → culture loop did NOT exist in the code
  // (AUDIT.md F1). These four coefficients are what close it.
  { id: 'psi_E', label: 'Realised exposure → culture (−)', unit: 'culture', default: 0.35, min: 0, max: 2, group: 'culture', evidence_basis: ILLUSTRATIVE, source: 'v0.3.0 loop closure (AUDIT.md F1); direction per Schwarcz et al. 2023, magnitude free', note: 'Accumulated litigation/regulatory exposure chills the willingness to document — the return arrow of the R1 suppression spiral. Saturating in E so unbounded exposure cannot drive culture arbitrarily negative.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Reporting rates before vs after a firm entered litigation with a known exposure level.' },
  { id: 'E_k', label: 'Exposure → culture half-saturation', unit: 'exposure index', default: 60, min: 1, max: 500, group: 'culture', evidence_basis: ILLUSTRATIVE, source: 'v0.3.0 loop closure; free parameter', note: 'Exposure level at which the chilling effect on culture reaches half its maximum.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Half-saturation setting the scale of the exposure chill; defines the curve shape, not its strength.' },
  { id: 'psi_H', label: 'Realised harm → culture (−)', unit: 'culture', default: 0.25, min: 0, max: 2, group: 'culture', evidence_basis: ILLUSTRATIVE, source: 'v0.3.0 loop closure (AUDIT.md F1); direction per Vaughan 1996, magnitude free', note: 'Visible harm events raise blame pressure and lower psychological safety — the second return arrow of the R1 loop. Saturating in harm.', advanced: true, tier: 'T4', whatWouldConstrainIt: 'Reporting rates before vs after a publicised harm event.' },
  { id: 'h_k', label: 'Harm → culture half-saturation', unit: 'harm', default: 20, min: 0.5, max: 200, group: 'culture', evidence_basis: ILLUSTRATIVE, source: 'v0.3.0 loop closure; free parameter', note: 'Harm rate at which the blame-pressure effect on culture reaches half its maximum.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Half-saturation setting the scale of the harm chill; defines the curve shape, not its strength.' },
  { id: 'eps_C', label: 'Culture kernel floor (anti-absorbing)', unit: 'dimensionless', default: 0.08, min: 0.001, max: 0.5, group: 'culture', evidence_basis: ILLUSTRATIVE, source: 'Well-posedness fix v0.3.0 (AUDIT.md F9); not in BUILD_SPEC', note: 'The pure logistic kernel C(1−C) makes C=0 and C=1 absorbing, so culture became permanently irreversible once it saturated. Blending in a floor keeps the bistable shape while allowing recovery from either boundary.', advanced: true, tier: 'T3', whatWouldConstrainIt: 'Kernel floor that removes the absorbing culture states. Numerical form.' },
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
