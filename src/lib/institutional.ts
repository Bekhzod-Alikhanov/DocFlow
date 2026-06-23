import type { Auxiliaries, Params, Trajectory } from '../engine'

export type Transferability = 'private' | 'partly-private' | 'statute'

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
}

export const REGIME_MATRIX: RegimeRecord[] = [
  {
    id: 'asrs-asap',
    name: 'ASRS / ASAP / VDRP',
    sector: 'Aviation',
    mechanism: 'Neutral NASA intake, ASAP Event Review Committees, corporate self-disclosure with verified fixes.',
    protectedThing: 'Reporter identity, voluntary reports, and bounded enforcement use.',
    sourceOfProtection: '49 U.S.C. §40123; 14 C.F.R. §91.25; 14 C.F.R. Part 193; FAA ACs.',
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
    sourceOfProtection: '42 U.S.C. §§299b-21 to 299b-26; 42 C.F.R. Part 3.',
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
    sources: ['21 C.F.R. §§803.16, 314.80(k)', 'United States v. Park', 'EU MDR Arts. 87-92'],
  },
  {
    id: 'sr11',
    name: 'SR 11-7 model risk management',
    sector: 'Financial services',
    mechanism: 'Model inventory, independent validation, monitoring, effective challenge, and board oversight.',
    protectedThing: 'Supervisory exchanges under Confidential Supervisory Information doctrine.',
    sourceOfProtection: '12 C.F.R. Part 261; 12 U.S.C. §1828(x); bank-examiner privilege.',
    transferablePrinciple: 'Treat model documentation as a control and give independent reviewers power to force change.',
    transferability: 'partly-private',
    caveat: 'The governance discipline transfers; the regulator-held CSI shield does not.',
    sources: ['SR 11-7', 'SR 26-2 / OCC 2026-13', 'In re Subpoena Served Upon Comptroller'],
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
    caveat: 'AI lacks nuclear’s shared insurer, small operator set, and mature trust base.',
    sources: ['10 C.F.R. §§50.72-50.73', 'Critical Mass Energy Project v. NRC', 'INPO SEE-IN'],
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
  { id: 9, principle: 'Bar civil liability for compliant reports', origin: 'CIRCIA §681e', accomplishes: 'Removes the litigation penalty for honest disclosure.', transferability: 'statute', caveat: 'Politically difficult.' },
  { id: 10, principle: 'Limit admissibility of remedial analysis', origin: 'FRE 407-style logic', accomplishes: 'Lets firms fix problems without making the fix the exhibit.', transferability: 'statute', caveat: 'Exceptions remain.' },
  { id: 11, principle: 'Fund an analytic intermediary', origin: 'ASIAS; AHRQ NPSD; INPO', accomplishes: 'Turns reports into safety outputs.', transferability: 'private', caveat: 'Under-funding hollows it out.' },
  { id: 12, principle: 'Build visible feedback loops', origin: 'CALLBACK; Sentinel alerts; SOERs', accomplishes: 'Shows reporters that reports matter.', transferability: 'private', caveat: 'Feedback must be timely.' },
  { id: 13, principle: 'Protect whistleblowers', origin: 'PSQIA; AIR21', accomplishes: 'Protects people who surface bad news.', transferability: 'partly-private', caveat: 'Private policy lacks statutory teeth.' },
  { id: 14, principle: 'Use narrow misconduct carve-outs', origin: 'PSQIA in camera review; ASAP', accomplishes: 'Preserves accountability without exposing the whole workflow.', transferability: 'partly-private', caveat: 'Gaming risk remains.' },
  { id: 15, principle: 'Prefer examination-based supervision', origin: 'Bank model-risk supervision', accomplishes: 'Surfaces precursors before litigation.', transferability: 'statute', caveat: 'Requires a capable AI supervisor.' },
]

export const GUIDED_DEMOS: GuidedDemo[] = [
  {
    id: 'cyber-chills',
    title: 'Why cyber chills documentation',
    presetId: 'cybersecurity',
    thesis: 'Fragile privilege and high discoverability make not writing the rational move.',
    moves: ['Start with the cyber anti-pattern preset.', 'Raise safe harbor and workflow protection.', 'Watch backfire and litigation pressure fall.'],
  },
  {
    id: 'aviation-reports',
    title: 'Why aviation reports before catastrophe',
    presetId: 'aviation',
    thesis: 'A trusted listener plus near-miss tier turns weak signals into learning.',
    moves: ['Load Aviation ASRS + ASAP.', 'Lower recipient-enforcer separation.', 'Watch safe-to-report and learning yield degrade.'],
  },
  {
    id: 'psqia-facts',
    title: 'Why PSQIA protects workflow, not facts',
    presetId: 'healthcare',
    thesis: 'Workflow protection works because the original factual record remains outside the shield.',
    moves: ['Load PSQIA-style workflow protection.', 'Lower original-records boundary.', 'Watch accountability legitimacy drop.'],
  },
  {
    id: 'mandatory-safe',
    title: 'Why mandatory reporting needs safe-to-report',
    presetId: 'pharma-safe-report',
    thesis: 'Mandatory reporting becomes productive when the report is not treated as a confession.',
    moves: ['Load Pharma mandatory-safe-to-report.', 'Lower safe harbor.', 'Compare against EU trap.'],
  },
  {
    id: 'sr11-control',
    title: 'Why SR 11-7 makes documentation a control',
    presetId: 'sr11-effective-challenge',
    thesis: 'Effective challenge gives validation findings authority to become changes.',
    moves: ['Load SR 11-7 effective challenge.', 'Lower effective challenge.', 'Watch remediation and learning yield weaken.'],
  },
  {
    id: 'nuclear-dual',
    title: 'Why nuclear runs two channels',
    presetId: 'nuclear-dual-channel',
    thesis: 'A public floor and confidential peer-learning channel cover each other’s blind spots.',
    moves: ['Load Nuclear dual-channel.', 'Lower intermediary capacity.', 'Watch the private-ordering gap and learning yield move.'],
  },
]

export const AUDIENCE_MODES: AudienceMode[] = [
  {
    id: 'research',
    label: 'Research Associate',
    emphasis: 'Citations, caveats, chapter-ready comparisons, and unresolved pin-cite flags.',
    outputs: ['Chapter 3 matrix', 'source caveats', 'demo script', 'playbook brief'],
  },
  {
    id: 'lab',
    label: 'AI Lab',
    emphasis: 'What can be built under private ordering, where legal scaffolding is missing, and which controls change behavior.',
    outputs: ['internal architecture checklist', 'private-ordering gap', 'two-track diagram', 'scenario export'],
  },
  {
    id: 'thinktank',
    label: 'Think Tank',
    emphasis: 'Policy package comparison, statutory asks, safe-harbor logic, and public/private channel design.',
    outputs: ['statutory dependency score', 'regime comparison', 'policy caveats', 'briefing PDF/markdown'],
  },
]

export const SOURCE_CAVEATS = [
  'Decision-support and structured reasoning only; DocFlow is not a forecast.',
  'All model coefficients are illustrative assumptions unless separately validated.',
  'The cyber ~95% suppression figure is an estimate from Schwarcz, Wolff & Woods, not a measured rate.',
  'AI Act / PLD article numbers and dates should be pin-cite verified before external circulation.',
  'Private ordering can create workflows and culture, but cannot bind courts, plaintiffs, or regulators without statute.',
]

export function finalAux(traj: Trajectory): Auxiliaries {
  return traj.aux[traj.aux.length - 1]
}

export function institutionalScorecard(params: Params, traj: Trajectory): ScoreItem[] {
  const aux = finalAux(traj)
  return [
    {
      id: 'safe_to_report_score',
      label: 'Safe-to-report',
      value: aux.safe_to_report_score,
      kind: 'good',
      note: 'How safe a candid report feels after privilege, separation, workflow protection, and safe harbor are considered.',
    },
    {
      id: 'accountability_legitimacy',
      label: 'Accountability legitimacy',
      value: aux.accountability_legitimacy,
      kind: 'good',
      note: 'Whether protection is bounded by facts, just-culture rules, reporting duties, and independent review.',
    },
    {
      id: 'learning_yield',
      label: 'Learning yield',
      value: Math.min(1, aux.learning_yield / 2),
      kind: 'good',
      note: 'Durable learning produced per incident signal, scaled for display.',
    },
    {
      id: 'litigation_pressure',
      label: 'Litigation pressure',
      value: aux.litigation_pressure,
      kind: 'bad',
      note: 'Discoverability and adverse-inference pressure that pushes teams away from writing things down.',
    },
    {
      id: 'private_ordering_gap',
      label: 'Private-ordering gap',
      value: aux.private_ordering_gap,
      kind: 'bad',
      note: 'How much the scenario relies on statute-dependent protection that a lab cannot create alone.',
    },
    {
      id: 'policy_scaffold_dependency',
      label: 'Policy scaffold dependency',
      value: aux.policy_scaffold_dependency,
      kind: params.safe_harbor_non_admission + params.workflow_protection > 1.2 ? 'neutral' : 'bad',
      note: 'Reliance on public-law scaffolds such as workflow privilege, safe harbor, and regulator-held privilege.',
    },
  ]
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
