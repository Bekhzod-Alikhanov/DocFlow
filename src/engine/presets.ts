/**
 * Institutional-design presets. Each is a sparse set of lever overrides on top
 * of the registry defaults, plus citations and lever-level rationales.
 *
 * Lever values are illustrative encodings of each regime's structural posture,
 * not measured quantities. The cyber preset is a calibration target: it is
 * tuned to settle near f_doc ~= 0.05 using the Schwarcz/Wolff/Woods estimate.
 */
import type { CaveatLevel, ConfidenceLevel, LeverKey, LeverRationale, Params, Preset } from './types'
import { LEVER_KEYS } from './types'

interface RationaleSeed {
  basis: string
  sourceNote: string
  confidence?: ConfidenceLevel
  caveatLevel?: CaveatLevel
}

const LEVER_RATIONALE_SEED: Record<LeverKey, RationaleSeed> = {
  privilege_strength: {
    basis: 'Privilege posture captures how credible the legal shield is for candid analysis.',
    sourceNote: 'PSQIA, work-product doctrine, and Capital One cyber privilege failure.',
  },
  just_culture: {
    basis: 'Just-culture posture captures whether honest error is protected while misconduct remains outside the shield.',
    sourceNote: 'ASAP just-culture carve-outs and EU occurrence-reporting protections.',
  },
  mandatory_reporting: {
    basis: 'Mandatory-reporting posture captures the public accountability floor for serious incidents.',
    sourceNote: 'AI Act, aviation occurrence reporting, nuclear LERs, and pharma/device reporting duties.',
  },
  pld_penalty: {
    basis: 'PLD/adverse-inference posture captures litigation pressure created by disclosure and missing-document penalties.',
    sourceNote: 'EU Product Liability Directive disclosure/adverse-inference logic.',
    confidence: 'medium',
  },
  recipient_enforcer_separation: {
    basis: 'Recipient/enforcer separation captures whether the learning body is institutionally separated from punishment.',
    sourceNote: 'NASA ASRS, INPO, PSOs, and confidential peer-learning analogs.',
  },
  translation_layer: {
    basis: 'Translation-layer posture captures whether reports become engineering requirements rather than fault narratives.',
    sourceNote: 'PSQIA PSES, model-risk governance, and safety-management-system analogs.',
  },
  workflow_protection: {
    basis: 'Workflow protection captures whether the safety process itself is protected rather than a single document.',
    sourceNote: 'PSQIA Patient Safety Evaluation System design.',
  },
  original_records_boundary: {
    basis: 'Original-record boundary captures whether factual records remain discoverable while analysis is bounded.',
    sourceNote: 'PSQIA original-records exception and playbook two-track architecture.',
  },
  safe_harbor_non_admission: {
    basis: 'Safe harbor / non-admission posture captures whether reporting is treated as a safety signal rather than a confession.',
    sourceNote: 'CIRCIA civil-use protection and FDA adverse-event non-admission rules.',
  },
  effective_challenge: {
    basis: 'Effective challenge captures whether independent reviewers can force model or process changes.',
    sourceNote: 'Federal Reserve/OCC SR 11-7 model-risk management.',
  },
  near_miss_tier: {
    basis: 'Near-miss tier captures whether weak signals can be reported before serious harm occurs.',
    sourceNote: 'ASRS, ASAP, and EU occurrence-reporting voluntary tiers.',
  },
  intermediary_capacity: {
    basis: 'Intermediary capacity captures whether a funded body converts raw reports into shared learning.',
    sourceNote: 'NASA ASRS, AHRQ PSOs/NPSD, ASIAS/MITRE, and INPO.',
  },
}

const posture = (value: number): string => {
  if (value >= 0.75) return 'strong'
  if (value >= 0.45) return 'moderate'
  if (value >= 0.2) return 'limited'
  return 'weak'
}

function makeLeverRationales(
  presetName: string,
  overrides: Partial<Params>,
  overridesByLever: Partial<Record<LeverKey, Partial<LeverRationale>>> = {},
): Record<LeverKey, LeverRationale> {
  const out = {} as Record<LeverKey, LeverRationale>
  for (const key of LEVER_KEYS) {
    const seed = LEVER_RATIONALE_SEED[key]
    const value = overrides[key] ?? 0
    out[key] = {
      basis: `${presetName} encodes a ${posture(value)} value for this lever. ${seed.basis}`,
      confidence: seed.confidence ?? 'medium',
      caveatLevel: seed.caveatLevel ?? 'source-backed',
      sourceNote: seed.sourceNote,
      ...overridesByLever[key],
    }
  }
  return out
}

function withRationales(
  preset: Omit<Preset, 'leverRationales'>,
  overridesByLever: Partial<Record<LeverKey, Partial<LeverRationale>>> = {},
): Preset {
  return {
    ...preset,
    leverRationales: makeLeverRationales(preset.name, preset.overrides, overridesByLever),
  }
}

export const PRESETS: Preset[] = [
  withRationales(
    {
      id: 'cybersecurity',
      name: 'Cyber privilege-first anti-pattern',
      blurb:
        'Lawyer-led incident response with fragile privilege, no neutral recipient, no workflow protection, and no durable factual/analytic split. It is the minimum-compliance, zero-learning anti-pattern.',
      expectedRegime: 'chilling',
      overrides: {
        privilege_strength: 0.05,
        just_culture: 0.45,
        mandatory_reporting: 0.3,
        pld_penalty: 0.2,
        recipient_enforcer_separation: 0.0,
        translation_layer: 0.05,
        workflow_protection: 0.0,
        original_records_boundary: 0.15,
        safe_harbor_non_admission: 0.0,
        effective_challenge: 0.1,
        near_miss_tier: 0.05,
        intermediary_capacity: 0.0,
      },
      init: { C: 0.35, U: 25, D: 4, TD: 14, L: 25, E: 12 },
      citations: [
        {
          text: 'Schwarcz, Wolff & Woods, How Privilege Undermines Cybersecurity, 36 Harv. J.L. & Tech. 421 (2023).',
          caveat:
            'The ~95% "no written forensic report" figure is an ESTIMATE, not a measured statistic. DocFlow tunes this preset toward f_doc ~= 0.05 as a calibration target, not a prediction.',
        },
        { text: 'In re Capital One Consumer Data Sec. Breach Litig., 2020 (E.D. Va.) - privilege pierced over the Mandiant forensic report.' },
      ],
    },
    {
      privilege_strength: {
        confidence: 'high',
        sourceNote: 'Capital One and similar cyber privilege disputes make weak privilege a strong analog signal.',
      },
      intermediary_capacity: {
        confidence: 'medium',
        caveatLevel: 'illustrative',
        sourceNote: 'Cyber sector lacks a mature ASRS/INPO-like learning intermediary; value is illustrative.',
      },
    },
  ),
  withRationales({
    id: 'aviation',
    name: 'Aviation ASRS + ASAP',
    blurb:
      'Neutral third-party intake, de-identification, ASAP review committees, just-culture carve-outs, and visible feedback loops turn near-misses into system-wide fixes.',
    expectedRegime: 'learning',
    overrides: {
      privilege_strength: 0.8,
      just_culture: 0.85,
      mandatory_reporting: 0.4,
      pld_penalty: 0.05,
      recipient_enforcer_separation: 0.9,
      translation_layer: 0.7,
      workflow_protection: 0.45,
      original_records_boundary: 0.65,
      safe_harbor_non_admission: 0.65,
      effective_challenge: 0.65,
      near_miss_tier: 0.95,
      intermediary_capacity: 0.9,
    },
    init: { C: 0.6 },
    citations: [
      { text: 'FAA Advisory Circular AC 00-46F (Apr. 2, 2021) - ASRS voluntary, confidential, non-punitive.' },
      { text: '49 U.S.C. Sec. 40123 - statutory non-disclosure of safety reports; 14 C.F.R. Sec. 91.25.' },
    ],
  }),
  withRationales({
    id: 'healthcare',
    name: 'PSQIA-style workflow protection',
    blurb:
      'Protection attaches to a defined safety-evaluation workflow, not a single document, while the original factual record remains discoverable.',
    expectedRegime: 'learning',
    overrides: {
      privilege_strength: 0.85,
      just_culture: 0.7,
      mandatory_reporting: 0.45,
      pld_penalty: 0.1,
      recipient_enforcer_separation: 0.75,
      translation_layer: 0.85,
      workflow_protection: 0.95,
      original_records_boundary: 0.9,
      safe_harbor_non_admission: 0.5,
      effective_challenge: 0.6,
      near_miss_tier: 0.65,
      intermediary_capacity: 0.8,
    },
    init: { C: 0.6 },
    citations: [
      { text: 'Patient Safety and Quality Improvement Act, 42 U.S.C. Secs. 299b-21 to 299b-26; 42 C.F.R. Part 3.' },
      { text: 'HHS PSQIA Guidance, 81 Fed. Reg. 32655 (May 24, 2016) - three pathways to protected status.' },
    ],
  }),
  withRationales({
    id: 'pharma-safe-report',
    name: 'Pharma mandatory-safe-to-report',
    blurb:
      'Mandatory public adverse-event reporting works because legal pressure points at non-reporting while reports are treated as safety signals, not admissions of fault.',
    expectedRegime: 'learning',
    overrides: {
      privilege_strength: 0.35,
      just_culture: 0.62,
      mandatory_reporting: 0.9,
      pld_penalty: 0.25,
      recipient_enforcer_separation: 0.55,
      translation_layer: 0.72,
      workflow_protection: 0.35,
      original_records_boundary: 0.85,
      safe_harbor_non_admission: 0.9,
      effective_challenge: 0.72,
      near_miss_tier: 0.45,
      intermediary_capacity: 0.78,
    },
    init: { C: 0.55, U: 16, D: 8, TD: 9, L: 35, E: 12 },
    citations: [
      { text: '21 C.F.R. Secs. 803.16, 314.80(k), 600.80(k) - adverse-event reports are not necessarily admissions of causation or fault.' },
      { text: 'FDCA Secs. 301, 303; United States v. Park, 421 U.S. 658 (1975) - non-reporting can carry criminal exposure for responsible officers.' },
    ],
  }),
  withRationales({
    id: 'sr11-effective-challenge',
    name: 'SR 11-7 effective challenge',
    blurb:
      'Model inventory, independent validation, ongoing monitoring, and reviewers with authority make documentation a control rather than a liability habit.',
    expectedRegime: 'learning',
    overrides: {
      privilege_strength: 0.65,
      just_culture: 0.58,
      mandatory_reporting: 0.55,
      pld_penalty: 0.12,
      recipient_enforcer_separation: 0.55,
      translation_layer: 0.68,
      workflow_protection: 0.5,
      original_records_boundary: 0.75,
      safe_harbor_non_admission: 0.45,
      effective_challenge: 0.95,
      near_miss_tier: 0.35,
      intermediary_capacity: 0.45,
    },
    init: { C: 0.52, U: 18, D: 8, TD: 12, L: 36, E: 12 },
    citations: [
      { text: 'Federal Reserve/OCC SR 11-7 - model development, independent validation, governance, model inventory, and effective challenge.' },
      { text: '12 C.F.R. Part 261; 12 U.S.C. Sec. 1828(x); bank-examiner privilege - supervisory confidentiality is regulator-held, not firm-owned.' },
    ],
  }),
  withRationales({
    id: 'nuclear-dual-channel',
    name: 'Nuclear dual-channel',
    blurb:
      'A mandatory public floor plus confidential peer-learning body: NRC reporting supplies accountability; INPO/SEE-IN supplies candid operating experience.',
    expectedRegime: 'learning',
    overrides: {
      privilege_strength: 0.7,
      just_culture: 0.72,
      mandatory_reporting: 0.82,
      pld_penalty: 0.18,
      recipient_enforcer_separation: 0.82,
      translation_layer: 0.78,
      workflow_protection: 0.6,
      original_records_boundary: 0.82,
      safe_harbor_non_admission: 0.52,
      effective_challenge: 0.82,
      near_miss_tier: 0.75,
      intermediary_capacity: 0.95,
    },
    init: { C: 0.58, U: 18, D: 9, TD: 10, L: 38, E: 11 },
    citations: [
      { text: '10 C.F.R. Secs. 50.72-50.73 - NRC prompt notifications and Licensee Event Reports provide the public mandatory floor.' },
      { text: 'Critical Mass Energy Project v. NRC, 975 F.2d 871 (D.C. Cir. 1992) - INPO peer-learning materials protected through FOIA Exemption 4.' },
    ],
  }),
  withRationales(
    {
      id: 'eu-trap',
      name: 'EU AI Act + PLD (the structural trap)',
      blurb:
        'Maximum documentation duty AND maximum litigation exposure, but no privilege scaffold and weak separation. The key teaching case: piling on duty + exposure without protection does not reliably reach the learning attractor.',
      expectedRegime: 'contested',
      overrides: {
        privilege_strength: 0.1,
        just_culture: 0.35,
        mandatory_reporting: 0.85,
        pld_penalty: 0.8,
        recipient_enforcer_separation: 0.15,
        translation_layer: 0.2,
        workflow_protection: 0.05,
        original_records_boundary: 0.25,
        safe_harbor_non_admission: 0.0,
        effective_challenge: 0.25,
        near_miss_tier: 0.2,
        intermediary_capacity: 0.15,
      },
      init: { C: 0.45 },
      citations: [
        {
          text: 'Reg. (EU) 2024/1689 (AI Act) Art. 73; Dir. (EU) 2024/2853 (PLD) Arts. 9-10.',
          caveat:
            'EU article numbers and effective dates need verification. No EU privilege scaffold analogous to PSQIA/CIRCIA Sec. 681e currently exists.',
        },
      ],
    },
    {
      mandatory_reporting: { confidence: 'medium', caveatLevel: 'needs-verification' },
      pld_penalty: { confidence: 'medium', caveatLevel: 'needs-verification' },
      safe_harbor_non_admission: {
        confidence: 'high',
        caveatLevel: 'source-backed',
        sourceNote: 'Low value reflects absence of a clear AI-specific reporting safe harbor in the modeled EU trap.',
      },
    },
  ),
  withRationales(
    {
      id: 'neutral',
      name: 'Contested baseline',
      blurb:
        'A mid-range regime sitting inside the bistable window: moderate privilege, separation, and translation, with no sector dominating. It loads in the chilling basin but can tip to learning when culture rises.',
      expectedRegime: 'contested',
      overrides: {
        privilege_strength: 0.5,
        just_culture: 0.1,
        mandatory_reporting: 0.3,
        pld_penalty: 0.2,
        recipient_enforcer_separation: 0.3,
        translation_layer: 0.3,
        workflow_protection: 0.25,
        original_records_boundary: 0.35,
        safe_harbor_non_admission: 0.15,
        effective_challenge: 0.3,
        near_miss_tier: 0.25,
        intermediary_capacity: 0.25,
      },
      init: { C: 0.3 },
      citations: [
        { text: 'Illustrative balanced baseline; no sector basis. Levers chosen to sit inside the bistable region so path dependence is visible.' },
      ],
    },
    Object.fromEntries(
      LEVER_KEYS.map((key) => [
        key,
        {
          confidence: 'low' as ConfidenceLevel,
          caveatLevel: 'illustrative' as CaveatLevel,
          sourceNote: 'Illustrative baseline value used to demonstrate bistability rather than encode a real sector.',
        },
      ]),
    ) as Partial<Record<LeverKey, Partial<LeverRationale>>>,
  ),
]

export const PRESET_BY_ID: Record<string, Preset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
)

export const DEFAULT_PRESET_ID = 'neutral'
