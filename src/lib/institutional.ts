import {
  LEVER_KEYS,
  PARAM_SPEC_BY_ID,
  PRESET_BY_ID,
  type Auxiliaries,
  type ConfidenceLevel,
  type LeverKey,
  type Params,
  type Preset,
  type Trajectory,
} from '../engine'

export type Transferability = 'private' | 'partly-private' | 'statute'
export type ActionDependency = 'private-ordering' | 'regulator' | 'statute' | 'mixed'
export type RecommendationBucket = 'build-now' | 'needs-law' | 'watch'

export const NO_LEGAL_ADVICE_LINE = 'This output is structured decision-support, not legal advice.'

export interface RegimeRecord {
  id: string
  name: string
  sector: string
  mechanism: string
  protectedThing: string
  sourceOfProtection: string
  transferablePrinciple: string
  transferability: Transferability
  caveat: string
  sources: string[]
}

export interface DesignPrinciple {
  id: number
  principle: string
  origin: string
  accomplishes: string
  transferability: Transferability
  caveat: string
}

export interface GuidedDemo {
  id: string
  title: string
  presetId: string
  thesis: string
  moves: string[]
}

export interface ChapterNarrativeStep {
  id: string
  title: string
  thesis: string
  presetId: string
  keyLevers: LeverKey[]
  watchReadouts: ScoreItem['id'][]
  takeaway: string
}

export interface AudienceMode {
  id: 'research' | 'lab' | 'thinktank'
  label: string
  emphasis: string
  outputs: string[]
}

export interface ScoreItem {
  id: keyof Pick<
    Auxiliaries,
    | 'safe_to_report_score'
    | 'accountability_legitimacy'
    | 'learning_yield'
    | 'litigation_pressure'
    | 'private_ordering_gap'
    | 'policy_scaffold_dependency'
  >
  label: string
  value: number
  kind: 'good' | 'bad' | 'neutral'
  note: string
  sensitive?: boolean
}

export interface DecisionRecommendation {
  id: string
  title: string
  why: string
  doNow: string
  dependency: ActionDependency
  linkedLevers: LeverKey[]
  confidence: ConfidenceLevel
  caveat: string
}

export interface PolicyComponent {
  id: string
  title: string
  description: string
  targetLevers: Partial<Record<LeverKey, number>>
  dependency: ActionDependency
  confidence: ConfidenceLevel
  caveat: string
}

export interface PolicyPackageTemplate {
  id: string
  title: string
  description: string
  componentIds: string[]
}

export interface ChecklistSection {
  id: string
  title: string
  items: string[]
}

export const REGIME_MATRIX: RegimeRecord[] = [
  {
    id: 'asrs-asap',
    name: 'ASRS / ASAP / VDRP',
    sector: 'Aviation',
    mechanism: 'Neutral NASA intake, ASAP Event Review Committees, corporate self-disclosure with verified fixes.',
    protectedThing: 'Reporter identity, voluntary reports, and bounded enforcement use.',
    sourceOfProtection: '49 U.S.C. Sec. 40123; 14 C.F.R. Sec. 91.25; 14 C.F.R. Part 193; FAA ACs.',
    transferablePrinciple: 'Separate the listener from the enforcer and draw the just-culture line before the incident.',
    transferability: 'partly-private',
    caveat: 'A firm can imitate the workflow, but cannot bind regulators or plaintiffs without public-law scaffolding.',
    sources: ['FAA AC 00-46F', 'FAA AC 120-66C', 'EU Reg. 376/2014 Arts. 15-16'],
  },
  {
    id: 'psqia',
    name: 'PSQIA / PSO / PSES',
    sector: 'Healthcare',
    mechanism: 'Patient Safety Evaluation System routes adverse-event analysis to a Patient Safety Organization.',
    protectedThing: 'Workflow-based Patient Safety Work Product, not underlying original records.',
    sourceOfProtection: '42 U.S.C. Secs. 299b-21 to 299b-26; 42 C.F.R. Part 3.',
    transferablePrinciple: 'Protect the analytic workflow while preserving a discoverable factual core.',
    transferability: 'statute',
    caveat: 'The workflow is copyable; the privilege and preemption are not privately creatable.',
    sources: ['PSQIA', 'HHS Guidance 81 Fed. Reg. 32655', 'Charles v. Southern Baptist'],
  },
  {
    id: 'pharma',
    name: 'FAERS / MAUDE / pharmacovigilance',
    sector: 'Pharma and devices',
    mechanism: 'Mandatory adverse-event reports feed public de-identified databases and signal detection.',
    protectedThing: 'No privilege; reports are framed as signals rather than admissions.',
    sourceOfProtection: 'FDCA reporting duties plus non-admission rules and evidence limits.',
    transferablePrinciple: 'Make silence riskier than candor, and make reporting non-admission of fault.',
    transferability: 'partly-private',
    caveat: 'The reporting discipline is copyable; non-admission and criminal backstops require law.',
    sources: ['21 C.F.R. Secs. 803.16, 314.80(k)', 'United States v. Park', 'EU MDR Arts. 87-92'],
  },
  {
    id: 'sr11',
    name: 'SR 11-7 model risk management',
    sector: 'Financial services',
    mechanism: 'Model inventory, independent validation, monitoring, effective challenge, and board oversight.',
    protectedThing: 'Supervisory exchanges under Confidential Supervisory Information doctrine.',
    sourceOfProtection: '12 C.F.R. Part 261; 12 U.S.C. Sec. 1828(x); bank-examiner privilege.',
    transferablePrinciple: 'Treat model documentation as a control and give independent reviewers power to force change.',
    transferability: 'partly-private',
    caveat: 'The governance discipline transfers; the regulator-held CSI shield does not.',
    sources: ['SR 11-7', 'OCC Bulletin 2026-13', 'In re Subpoena Served Upon Comptroller'],
  },
  {
    id: 'nuclear',
    name: 'NRC + INPO dual channel',
    sector: 'Nuclear',
    mechanism: 'Mandatory public Licensee Event Reports plus confidential INPO peer-learning network.',
    protectedThing: 'INPO peer exchanges and operating-experience material.',
    sourceOfProtection: 'FOIA Exemption 4, NRC-INPO MOU, and concentrated-industry trust.',
    transferablePrinciple: 'Run a public accountability floor and confidential learning track in parallel.',
    transferability: 'partly-private',
    caveat: 'AI lacks nuclear\'s shared insurer, small operator set, and mature trust base.',
    sources: ['10 C.F.R. Secs. 50.72-50.73', 'Critical Mass Energy Project v. NRC', 'INPO SEE-IN'],
  },
  {
    id: 'cyber',
    name: 'Cyber privilege-first IR',
    sector: 'Cybersecurity',
    mechanism: 'Counsel-directed forensics tries to shield root-cause analysis as privileged work product.',
    protectedThing: 'Attempted attorney-client / work-product privilege over forensic analysis.',
    sourceOfProtection: 'Fragile case-by-case privilege claims; CIRCIA protections not yet broadly operative.',
    transferablePrinciple: 'Do not make privilege the primary knowledge architecture.',
    transferability: 'private',
    caveat: 'The ~95% no-written-report figure is an estimate, not a measured statistic.',
    sources: ['Schwarcz, Wolff & Woods 2023', 'In re Capital One', 'In re Target'],
  },
  {
    id: 'eu-ai',
    name: 'EU AI Act + PLD trap',
    sector: 'AI current law',
    mechanism: 'Serious-incident reporting and technical documentation duties meet PLD disclosure/adverse inference.',
    protectedThing: 'No AI-specific privilege scaffold for internal root-cause or red-team analysis.',
    sourceOfProtection: 'Reg. (EU) 2024/1689; Dir. (EU) 2024/2853.',
    transferablePrinciple: 'Mandatory documentation without analytic protection reproduces the cyber equilibrium.',
    transferability: 'statute',
    caveat: 'Article numbers and effective dates should be pin-cite verified before external circulation.',
    sources: ['AI Act Art. 73', 'PLD Arts. 9-10', 'Arcadia Scoping Doc'],
  },
]

export const DESIGN_PRINCIPLES: DesignPrinciple[] = [
  { id: 1, principle: 'Separate report recipient from enforcer', origin: 'ASRS; INPO', accomplishes: 'Trust and reporting volume.', transferability: 'partly-private', caveat: 'External enforceability needs statute.' },
  { id: 2, principle: 'Protect a workflow, not a document', origin: 'PSQIA PSES', accomplishes: 'Defeats the dual-purpose objection.', transferability: 'statute', caveat: 'Requires legal-design literacy.' },
  { id: 3, principle: 'Preserve original records', origin: 'PSQIA', accomplishes: 'Keeps accountability factual.', transferability: 'private', caveat: 'The factual core must be defined precisely.' },
  { id: 4, principle: 'Codify the just-culture line', origin: 'EU Reg. 376/2014; ASAP Big Five', accomplishes: 'Protects honest error, excludes misconduct.', transferability: 'partly-private', caveat: 'Line drawing is fact-intensive.' },
  { id: 5, principle: 'Pair mandatory floor with near-miss tier', origin: 'EU 376/2014; ASRS', accomplishes: 'Captures both serious incidents and weak signals.', transferability: 'private', caveat: 'Adds process overhead.' },
  { id: 6, principle: 'Standardize reporting formats', origin: 'AHRQ Common Formats; ICH E2B; OECD', accomplishes: 'Enables aggregation and cross-firm analysis.', transferability: 'private', caveat: 'Full value needs ecosystem coordination.' },
  { id: 7, principle: 'Require independent validation', origin: 'SR 11-7', accomplishes: 'Gives findings a route to forced change.', transferability: 'private', caveat: 'Independence can collapse under commercial pressure.' },
  { id: 8, principle: 'Name an accountable officer', origin: 'QPPV; CISO certification', accomplishes: 'Makes safety ownership visible.', transferability: 'partly-private', caveat: 'Can become scapegoating.' },
  { id: 9, principle: 'Bar civil liability for compliant reports', origin: 'CIRCIA Sec. 681e', accomplishes: 'Removes the litigation penalty for honest disclosure.', transferability: 'statute', caveat: 'Politically difficult.' },
  { id: 10, principle: 'Limit admissibility of remedial analysis', origin: 'FRE 407-style logic', accomplishes: 'Lets firms fix problems without making the fix the exhibit.', transferability: 'statute', caveat: 'Exceptions remain.' },
  { id: 11, principle: 'Fund an analytic intermediary', origin: 'ASIAS; AHRQ NPSD; INPO', accomplishes: 'Turns reports into safety outputs.', transferability: 'private', caveat: 'Under-funding hollows it out.' },
  { id: 12, principle: 'Build visible feedback loops', origin: 'CALLBACK; Sentinel alerts; SOERs', accomplishes: 'Shows reporters that reports matter.', transferability: 'private', caveat: 'Feedback must be timely.' },
  { id: 13, principle: 'Protect whistleblowers', origin: 'PSQIA; AIR21', accomplishes: 'Protects people who surface bad news.', transferability: 'partly-private', caveat: 'Private policy lacks statutory teeth.' },
  { id: 14, principle: 'Use narrow misconduct carve-outs', origin: 'PSQIA in camera review; ASAP', accomplishes: 'Preserves accountability without exposing the whole workflow.', transferability: 'partly-private', caveat: 'Gaming risk remains.' },
  { id: 15, principle: 'Prefer examination-based supervision', origin: 'Bank model-risk supervision', accomplishes: 'Surfaces precursors before litigation.', transferability: 'statute', caveat: 'Requires a capable AI supervisor.' },
]

export const GUIDED_DEMOS: GuidedDemo[] = [
  { id: 'cyber-chills', title: 'Why cyber chills documentation', presetId: 'cybersecurity', thesis: 'Fragile privilege and high discoverability make not writing the rational move.', moves: ['Start with the cyber anti-pattern preset.', 'Raise safe harbor and workflow protection.', 'Watch backfire and litigation pressure fall.'] },
  { id: 'aviation-reports', title: 'Why aviation reports before catastrophe', presetId: 'aviation', thesis: 'A trusted listener plus near-miss tier turns weak signals into learning.', moves: ['Load Aviation ASRS + ASAP.', 'Lower recipient-enforcer separation.', 'Watch safe-to-report and learning yield degrade.'] },
  { id: 'psqia-facts', title: 'Why PSQIA protects workflow, not facts', presetId: 'healthcare', thesis: 'Workflow protection works because the original factual record remains outside the shield.', moves: ['Load PSQIA-style workflow protection.', 'Lower original-records boundary.', 'Watch accountability legitimacy drop.'] },
  { id: 'mandatory-safe', title: 'Why mandatory reporting needs safe-to-report', presetId: 'pharma-safe-report', thesis: 'Mandatory reporting becomes productive when the report is not treated as a confession.', moves: ['Load Pharma mandatory-safe-to-report.', 'Lower safe harbor.', 'Compare against EU trap.'] },
  { id: 'sr11-control', title: 'Why SR 11-7 makes documentation a control', presetId: 'sr11-effective-challenge', thesis: 'Effective challenge gives validation findings authority to become changes.', moves: ['Load SR 11-7 effective challenge.', 'Lower effective challenge.', 'Watch remediation and learning yield weaken.'] },
  { id: 'nuclear-dual', title: 'Why nuclear runs two channels', presetId: 'nuclear-dual-channel', thesis: 'A public floor and confidential peer-learning channel cover each other\'s blind spots.', moves: ['Load Nuclear dual-channel.', 'Lower intermediary capacity.', 'Watch the private-ordering gap and learning yield move.'] },
]

export const CHAPTER3_STEPS: ChapterNarrativeStep[] = [
  {
    id: 'cyber-chills',
    title: 'Cyber chills documentation',
    thesis: 'Privilege-first incident response can make silence feel safer than analysis.',
    presetId: 'cybersecurity',
    keyLevers: ['privilege_strength', 'workflow_protection', 'recipient_enforcer_separation'],
    watchReadouts: ['litigation_pressure', 'safe_to_report_score'],
    takeaway: 'Chapter 3 starts from the pathology: fragile privilege suppresses the factual memory a safety system needs.',
  },
  {
    id: 'two-track',
    title: 'Use a two-track architecture',
    thesis: 'Separate the factual safety record from counsel-directed exposure analysis.',
    presetId: 'healthcare',
    keyLevers: ['original_records_boundary', 'workflow_protection', 'translation_layer'],
    watchReadouts: ['accountability_legitimacy', 'safe_to_report_score'],
    takeaway: 'The design target is not secrecy; it is a durable factual core plus bounded protected analysis.',
  },
  {
    id: 'psqia-workflow',
    title: 'PSQIA protects workflow, not facts',
    thesis: 'The protected object is the safety-evaluation process; original records stay available.',
    presetId: 'healthcare',
    keyLevers: ['workflow_protection', 'original_records_boundary', 'intermediary_capacity'],
    watchReadouts: ['accountability_legitimacy', 'private_ordering_gap'],
    takeaway: 'AI governance can borrow the workflow logic, but statutory privilege requires public law.',
  },
  {
    id: 'pharma-safe-report',
    title: 'Mandatory reporting needs safe-to-report',
    thesis: 'Mandatory reporting becomes useful when reports are not treated as admissions of fault.',
    presetId: 'pharma-safe-report',
    keyLevers: ['mandatory_reporting', 'safe_harbor_non_admission', 'original_records_boundary'],
    watchReadouts: ['safe_to_report_score', 'litigation_pressure'],
    takeaway: 'The rule should make silence risky without making candor self-incriminating.',
  },
  {
    id: 'sr11-control',
    title: 'SR 11-7 makes documentation a control',
    thesis: 'Independent validation matters when reviewers have authority to force change.',
    presetId: 'sr11-effective-challenge',
    keyLevers: ['effective_challenge', 'translation_layer', 'original_records_boundary'],
    watchReadouts: ['learning_yield', 'accountability_legitimacy'],
    takeaway: 'Documentation has to connect to remediation power, not just archival completeness.',
  },
  {
    id: 'dual-channel',
    title: 'Aviation and nuclear run two channels',
    thesis: 'Public accountability floors can coexist with confidential learning tracks.',
    presetId: 'nuclear-dual-channel',
    keyLevers: ['mandatory_reporting', 'near_miss_tier', 'intermediary_capacity'],
    watchReadouts: ['learning_yield', 'accountability_legitimacy'],
    takeaway: 'The strongest regimes separate accountability from learning without abandoning either.',
  },
  {
    id: 'ai-implication',
    title: 'AI governance needs both private ordering and law',
    thesis: 'Labs can build workflows now, but courts and regulators control safe harbor and admissibility.',
    presetId: 'eu-trap',
    keyLevers: ['safe_harbor_non_admission', 'workflow_protection', 'pld_penalty'],
    watchReadouts: ['private_ordering_gap', 'policy_scaffold_dependency'],
    takeaway: 'The policy ask is not more documentation in the abstract; it is protected, accountable safety learning.',
  },
]

export const AUDIENCE_MODES: AudienceMode[] = [
  { id: 'research', label: 'Research Associate', emphasis: 'Citations, caveats, chapter-ready comparisons, and unresolved pin-cite flags.', outputs: ['Chapter 3 matrix', 'source caveats', 'demo script', 'playbook brief'] },
  { id: 'lab', label: 'AI Lab', emphasis: 'What can be built under private ordering, where legal scaffolding is missing, and which controls change behavior.', outputs: ['internal architecture checklist', 'private-ordering gap', 'two-track diagram', 'scenario export'] },
  { id: 'thinktank', label: 'Think Tank', emphasis: 'Policy package comparison, statutory asks, safe-harbor logic, and public/private channel design.', outputs: ['statutory dependency score', 'regime comparison', 'policy caveats', 'briefing PDF/markdown'] },
]

export const SOURCE_CAVEATS = [
  'Decision-support and structured reasoning only; DocFlow is not a forecast.',
  'All model coefficients are illustrative assumptions unless separately validated.',
  'The cyber ~95% suppression figure is an estimate from Schwarcz, Wolff & Woods, not a measured rate.',
  'AI Act / PLD article numbers and dates should be pin-cite verified before external circulation.',
  'Private ordering can create workflows and culture, but cannot bind courts, plaintiffs, or regulators without statute.',
]

export const POLICY_COMPONENTS: PolicyComponent[] = [
  { id: 'factual-record-boundary', title: 'Factual safety record boundary', description: 'Define telemetry, model version, inputs/outputs, and observable behavior as durable factual records.', targetLevers: { original_records_boundary: 0.8 }, dependency: 'private-ordering', confidence: 'high', caveat: 'Requires discipline so teams do not bury facts inside protected analysis.' },
  { id: 'protected-analysis-workflow', title: 'Protected analysis workflow', description: 'Route root-cause and safety analysis through a defined protected workflow.', targetLevers: { workflow_protection: 0.85 }, dependency: 'statute', confidence: 'medium', caveat: 'A lab can copy the workflow, but legal protection requires public law.' },
  { id: 'safe-harbor-non-admission', title: 'Safe harbor / non-admission', description: 'Treat compliant incident reports as safety signals rather than admissions of fault.', targetLevers: { safe_harbor_non_admission: 0.85 }, dependency: 'statute', confidence: 'high', caveat: 'Cannot be created unilaterally against plaintiffs or regulators.' },
  { id: 'effective-challenge', title: 'Independent effective challenge', description: 'Give reviewers competence, independence, and authority to force model or process changes.', targetLevers: { effective_challenge: 0.85 }, dependency: 'private-ordering', confidence: 'high', caveat: 'Independence can collapse if reviewers lack budget or escalation rights.' },
  { id: 'near-miss-tier', title: 'Voluntary near-miss tier', description: 'Create a low-exposure weak-signal channel alongside mandatory serious-incident reporting.', targetLevers: { near_miss_tier: 0.8 }, dependency: 'private-ordering', confidence: 'high', caveat: 'Needs clear routing so minor reports do not become punitive evidence traps.' },
  { id: 'analytic-intermediary', title: 'Analytic intermediary', description: 'Fund a team or external body that converts reports into reusable safety outputs.', targetLevers: { intermediary_capacity: 0.85 }, dependency: 'mixed', confidence: 'medium', caveat: 'A lab can fund one internally; ecosystem-wide learning needs trusted cross-lab capacity.' },
  { id: 'recipient-enforcer-separation', title: 'Recipient/enforcer separation', description: 'Separate the reporting recipient from disciplinary or enforcement authority.', targetLevers: { recipient_enforcer_separation: 0.8 }, dependency: 'mixed', confidence: 'high', caveat: 'Internal separation helps, but regulator/plaintiff separation requires external design.' },
  { id: 'just-culture-carveouts', title: 'Just-culture carve-outs', description: 'Protect honest error while excluding reckless, intentional, or knowing misconduct.', targetLevers: { just_culture: 0.8 }, dependency: 'private-ordering', confidence: 'high', caveat: 'The misconduct line must be written before incidents happen.' },
  { id: 'translation-layer', title: 'Safety translation layer', description: 'Turn factual reports into tests, monitors, rollback gates, and model-improvement requirements.', targetLevers: { translation_layer: 0.75 }, dependency: 'private-ordering', confidence: 'high', caveat: 'Translation must connect to engineering backlogs and release gates.' },
]

export const POLICY_COMPONENT_BY_ID: Record<string, PolicyComponent> = Object.fromEntries(
  POLICY_COMPONENTS.map((c) => [c.id, c]),
)

export const POLICY_PACKAGE_TEMPLATES: PolicyPackageTemplate[] = [
  { id: 'lab-starter', title: 'Lab private-ordering starter kit', description: 'Actions a lab can build now without waiting for statute.', componentIds: ['factual-record-boundary', 'effective-challenge', 'near-miss-tier', 'just-culture-carveouts', 'translation-layer'] },
  { id: 'psqia-workflow', title: 'PSQIA-style protected workflow', description: 'Workflow protection plus factual accountability boundary.', componentIds: ['factual-record-boundary', 'protected-analysis-workflow', 'analytic-intermediary', 'translation-layer'] },
  { id: 'aviation-near-miss', title: 'Aviation near-miss learning system', description: 'Trusted recipient, voluntary near-miss tier, and visible learning outputs.', componentIds: ['recipient-enforcer-separation', 'near-miss-tier', 'analytic-intermediary', 'just-culture-carveouts'] },
  { id: 'pharma-safe-report', title: 'Pharma mandatory-safe-to-report package', description: 'Mandatory floor plus non-admission and factual-record discipline.', componentIds: ['safe-harbor-non-admission', 'factual-record-boundary', 'translation-layer', 'effective-challenge'] },
  { id: 'sr11-challenge', title: 'SR 11-7 effective challenge package', description: 'Model-risk controls that make documentation force remediation.', componentIds: ['effective-challenge', 'translation-layer', 'factual-record-boundary', 'just-culture-carveouts'] },
  { id: 'nuclear-dual', title: 'Nuclear dual-channel package', description: 'Public accountability floor plus confidential learning channel.', componentIds: ['recipient-enforcer-separation', 'near-miss-tier', 'analytic-intermediary', 'factual-record-boundary'] },
  { id: 'eu-trap-mitigation', title: 'EU AI Act + PLD mitigation package', description: 'Reduce chilling from duty-plus-disclosure pressure.', componentIds: ['safe-harbor-non-admission', 'protected-analysis-workflow', 'factual-record-boundary', 'recipient-enforcer-separation', 'translation-layer'] },
]

export const LAB_CHECKLIST_SECTIONS: ChecklistSection[] = [
  { id: 'facts', title: 'Factual record checklist', items: ['Define the factual safety record before incidents happen.', 'Keep telemetry, model version, input/output, and observable behavior outside privileged analysis.', 'Make factual records accessible to engineering remediation teams.'] },
  { id: 'analysis', title: 'Protected analysis checklist', items: ['Define a separate root-cause and exposure-analysis workflow.', 'Document who can initiate counsel-directed analysis.', 'Keep protected analysis bounded by purpose and access controls.'] },
  { id: 'reporting', title: 'Reporting channel checklist', items: ['Create a serious-incident reporting floor.', 'Create a voluntary near-miss tier.', 'Separate learning recipients from discipline where possible.'] },
  { id: 'challenge', title: 'Independent review checklist', items: ['Assign independent reviewers with technical competence.', 'Give reviewers escalation rights and authority to force change.', 'Track remediation commitments to closure.'] },
  { id: 'intermediary', title: 'Near-miss / intermediary checklist', items: ['Fund a translation function that converts reports into safety outputs.', 'Publish feedback loops so reporters see reports matter.', 'Aggregate weak signals into recurring-risk patterns.'] },
  { id: 'statute', title: 'Statutory asks checklist', items: ['Seek safe-harbor / non-admission protection for compliant reports.', 'Limit admissibility of protected remedial analysis.', 'Clarify regulator-held confidentiality and plaintiff-access boundaries.'] },
]

export function finalAux(traj: Trajectory): Auxiliaries {
  return traj.aux[traj.aux.length - 1]
}

export function institutionalScorecard(params: Params, traj: Trajectory): ScoreItem[] {
  const aux = finalAux(traj)
  return [
    { id: 'safe_to_report_score', label: 'Safe-to-report', value: aux.safe_to_report_score, kind: 'good', sensitive: true, note: 'How safe a candid report feels after privilege, separation, workflow protection, and safe harbor are considered.' },
    { id: 'accountability_legitimacy', label: 'Accountability legitimacy', value: aux.accountability_legitimacy, kind: 'good', sensitive: true, note: 'Whether protection is bounded by facts, just-culture rules, reporting duties, and independent review.' },
    { id: 'learning_yield', label: 'Learning yield', value: Math.min(1, aux.learning_yield / 2), kind: 'good', sensitive: true, note: 'Durable learning produced per incident signal, scaled for display.' },
    { id: 'litigation_pressure', label: 'Litigation pressure', value: aux.litigation_pressure, kind: 'bad', sensitive: true, note: 'Discoverability and adverse-inference pressure that pushes teams away from writing things down.' },
    { id: 'private_ordering_gap', label: 'Private-ordering gap', value: aux.private_ordering_gap, kind: 'bad', sensitive: true, note: 'How much the scenario relies on statute-dependent protection that a lab cannot create alone.' },
    { id: 'policy_scaffold_dependency', label: 'Policy scaffold dependency', value: aux.policy_scaffold_dependency, kind: params.safe_harbor_non_admission + params.workflow_protection > 1.2 ? 'neutral' : 'bad', sensitive: true, note: 'Reliance on public-law scaffolds such as workflow privilege, safe harbor, and regulator-held privilege.' },
  ]
}

export function recommendationBucket(rec: DecisionRecommendation): RecommendationBucket {
  if (rec.confidence === 'low') return 'watch'
  if (rec.dependency === 'private-ordering') return 'build-now'
  return 'needs-law'
}

export function decisionRecommendations(params: Params, traj: Trajectory): DecisionRecommendation[] {
  const aux = finalAux(traj)
  const recs: DecisionRecommendation[] = []

  if (aux.litigation_pressure >= 0.5) {
    recs.push({
      id: 'lower-litigation-pressure',
      title: 'Reduce report weaponization pressure',
      why: 'Litigation pressure is high enough that teams may rationally avoid candid written analysis.',
      doNow: 'Separate factual records from analysis, add a non-admission policy statement, and identify the statutory safe-harbor ask.',
      dependency: 'statute',
      linkedLevers: ['safe_harbor_non_admission', 'original_records_boundary', 'workflow_protection'],
      confidence: 'high',
      caveat: 'Internal policy helps, but courts and regulators control admissibility and civil-use limits.',
    })
  }

  if (aux.private_ordering_gap >= 0.2) {
    recs.push({
      id: 'close-private-ordering-gap',
      title: 'Separate private controls from statutory asks',
      why: 'The scenario relies on protections that a lab cannot fully create alone.',
      doNow: 'Write the internal workflow now, but label safe harbor, privilege, and admissibility as regulator/statute dependencies.',
      dependency: 'mixed',
      linkedLevers: ['workflow_protection', 'safe_harbor_non_admission', 'privilege_strength'],
      confidence: 'medium',
      caveat: 'This is a planning distinction, not a legal conclusion about any jurisdiction.',
    })
  }

  if (aux.safe_to_report_score < 0.55) {
    recs.push({
      id: 'raise-safe-to-report',
      title: 'Make reporting safe before making it mandatory',
      why: 'The safe-to-report score is too low for candid incident analysis to be a stable habit.',
      doNow: 'Raise recipient/enforcer separation, define workflow protection, and make reports non-admissions where possible.',
      dependency: 'mixed',
      linkedLevers: ['recipient_enforcer_separation', 'workflow_protection', 'safe_harbor_non_admission'],
      confidence: 'high',
      caveat: 'Mandatory reporting without protection can still chill documentation.',
    })
  }

  if (aux.learning_yield < 0.45) {
    recs.push({
      id: 'increase-learning-yield',
      title: 'Build the translation layer before collecting more reports',
      why: 'Current reports are not producing much durable learning per incident signal.',
      doNow: 'Fund an analytic intermediary, add a near-miss tier, and turn reports into tests, monitors, and remediation tickets.',
      dependency: 'private-ordering',
      linkedLevers: ['intermediary_capacity', 'near_miss_tier', 'translation_layer'],
      confidence: 'high',
      caveat: 'Cross-lab learning still requires trust, standard formats, and potentially public coordination.',
    })
  }

  if (aux.accountability_legitimacy < 0.55) {
    recs.push({
      id: 'restore-accountability-legitimacy',
      title: 'Protect analysis without hiding facts',
      why: 'The accountability legitimacy score is low, so the protection package may look like concealment.',
      doNow: 'Preserve original records, define just-culture carve-outs, and give independent reviewers authority to force change.',
      dependency: 'private-ordering',
      linkedLevers: ['original_records_boundary', 'just_culture', 'effective_challenge'],
      confidence: 'high',
      caveat: 'Misconduct carve-outs and factual-record boundaries need precise drafting.',
    })
  }

  if (params.pld_penalty >= 0.6 && params.safe_harbor_non_admission < 0.4) {
    recs.push({
      id: 'verify-pld-pin-cites',
      title: 'Verify the PLD / AI Act trap before external use',
      why: 'The scenario combines high adverse-inference pressure with weak safe harbor.',
      doNow: 'Pin-cite the applicable provisions and identify whether any jurisdiction-specific privilege or reporting protection applies.',
      dependency: 'regulator',
      linkedLevers: ['pld_penalty', 'mandatory_reporting', 'safe_harbor_non_admission'],
      confidence: 'low',
      caveat: 'Article numbers, effective dates, and national implementation details can change the analysis.',
    })
  }

  return recs
}

export function groupedRecommendations(recs: DecisionRecommendation[]): Record<RecommendationBucket, DecisionRecommendation[]> {
  return recs.reduce<Record<RecommendationBucket, DecisionRecommendation[]>>(
    (acc, rec) => {
      acc[recommendationBucket(rec)].push(rec)
      return acc
    },
    { 'build-now': [], 'needs-law': [], watch: [] },
  )
}

export function applyPolicyComponents(params: Params, componentIds: string[]): Params {
  const next = { ...params }
  for (const id of componentIds) {
    const component = POLICY_COMPONENT_BY_ID[id]
    if (!component) continue
    for (const [key, target] of Object.entries(component.targetLevers) as [LeverKey, number][]) {
      next[key] = Math.max(next[key], target)
    }
  }
  return next
}

export function dependencyCounts(componentIds: string[]): Record<ActionDependency, number> {
  const counts: Record<ActionDependency, number> = { 'private-ordering': 0, regulator: 0, statute: 0, mixed: 0 }
  for (const id of componentIds) {
    const component = POLICY_COMPONENT_BY_ID[id]
    if (component) counts[component.dependency] += 1
  }
  return counts
}

export function presetSourceNotes(presetId: string | null | undefined): string[] {
  const preset = presetId ? PRESET_BY_ID[presetId] : null
  if (!preset) return []
  return LEVER_KEYS.map((key) => {
    const r = preset.leverRationales[key]
    return `${PARAM_SPEC_BY_ID[key].label}: ${r.confidence}/${r.caveatLevel}. ${r.sourceNote}`
  })
}

export function presetMainCaveat(preset: Preset): string {
  return preset.citations.find((c) => c.caveat)?.caveat ?? preset.leverRationales[LEVER_KEYS[0]].sourceNote
}

export function topRegimeMatches(params: Params): RegimeRecord[] {
  const scores = REGIME_MATRIX.map((r) => {
    let score: number
    if (r.id === 'asrs-asap') score = params.recipient_enforcer_separation + params.near_miss_tier + params.intermediary_capacity
    else if (r.id === 'psqia') score = params.workflow_protection + params.original_records_boundary + params.privilege_strength
    else if (r.id === 'pharma') score = params.mandatory_reporting + params.safe_harbor_non_admission + params.original_records_boundary
    else if (r.id === 'sr11') score = params.effective_challenge + params.translation_layer + params.original_records_boundary
    else if (r.id === 'nuclear') score = params.mandatory_reporting + params.intermediary_capacity + params.recipient_enforcer_separation
    else if (r.id === 'cyber') score = (1 - params.workflow_protection) + (1 - params.safe_harbor_non_admission) + (1 - params.recipient_enforcer_separation)
    else score = params.mandatory_reporting + params.pld_penalty + (1 - params.safe_harbor_non_admission)
    return { r, score }
  })
  return scores.sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.r)
}
