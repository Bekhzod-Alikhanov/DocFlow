/**
 * Institutional-design presets. Each is a sparse set of lever overrides on top
 * of the registry defaults, plus citations and — where the packet requires it —
 * a reliability caveat surfaced in the UI (e.g. the cyber "95% is an estimate" flag).
 *
 * Lever values are illustrative encodings of each regime's structural posture, not
 * measured quantities. The cyber preset is the one calibration target: it is tuned
 * to settle near f_doc ≈ 0.05 (the Schwarcz/Wolff/Woods 2023 *estimate*).
 */
import type { Preset } from './types'

export const PRESETS: Preset[] = [
  {
    id: 'cybersecurity',
    name: 'Cyber privilege-first anti-pattern',
    blurb:
      'Lawyer-led incident response with fragile privilege, no neutral recipient, no workflow protection, and no durable factual/analytic split. It is the minimum-compliance, zero-learning anti-pattern.',
    expectedRegime: 'chilling',
    overrides: {
      privilege_strength: 0.05,
      // Cyber's chilling is legal/discoverability-driven (lawyer-led IR, pierced
      // privilege), NOT a lack of desire to learn — security teams want root-cause
      // analysis. So just_culture is moderate; low privilege + no separation are
      // what trap it in the chilling attractor.
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
        text:
          'Schwarcz, Wolff & Woods, How Privilege Undermines Cybersecurity, 36 Harv. J.L. & Tech. 421 (2023).',
        caveat:
          'The ~95% "no written forensic report" figure is an ESTIMATE (a podcast/expert estimate), not a measured statistic. DocFlow tunes this preset toward f_doc ≈ 0.05 as a calibration target, not a prediction.',
      },
      { text: 'In re Capital One Consumer Data Sec. Breach Litig., 2020 (E.D. Va.) — privilege pierced over the Mandiant forensic report.' },
    ],
  },
  {
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
      { text: 'FAA Advisory Circular AC 00-46F (Apr. 2, 2021) — ASRS voluntary, confidential, non-punitive.' },
      { text: '49 U.S.C. §40123 — statutory non-disclosure of safety reports; 14 C.F.R. §91.25.' },
    ],
  },
  {
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
      { text: 'Patient Safety and Quality Improvement Act, 42 U.S.C. §§299b-21 to 299b-26; 42 C.F.R. Part 3.' },
      { text: 'HHS PSQIA Guidance, 81 Fed. Reg. 32655 (May 24, 2016) — three pathways to protected status.' },
    ],
  },
  {
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
      { text: '21 C.F.R. §§803.16, 314.80(k), 600.80(k) — adverse-event reports are not necessarily admissions of causation or fault.' },
      { text: 'FDCA §§301, 303; United States v. Park, 421 U.S. 658 (1975) — non-reporting can carry criminal exposure for responsible officers.' },
    ],
  },
  {
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
      { text: 'Federal Reserve/OCC SR 11-7 — model development, independent validation, governance, model inventory, and effective challenge.' },
      { text: '12 C.F.R. Part 261; 12 U.S.C. §1828(x); bank-examiner privilege — supervisory confidentiality is regulator-held, not firm-owned.' },
    ],
  },
  {
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
      { text: '10 C.F.R. §§50.72–50.73 — NRC prompt notifications and Licensee Event Reports provide the public mandatory floor.' },
      { text: 'Critical Mass Energy Project v. NRC, 975 F.2d 871 (D.C. Cir. 1992) — INPO peer-learning materials protected through FOIA Exemption 4.' },
    ],
  },
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
        text:
          'Reg. (EU) 2024/1689 (AI Act) Art. 73 (serious-incident reporting); Dir. (EU) 2024/2853 (PLD) Arts. 9–10 (disclosure + adverse-inference).',
        caveat:
          'EU article numbers and effective dates need verification (pin-cites to be confirmed). No EU privilege scaffold analogous to PSQIA/CIRCIA §681e currently exists.',
      },
    ],
  },
  {
    id: 'neutral',
    name: 'Contested baseline',
    blurb:
      'A mid-range regime sitting inside the bistable window: moderate privilege, separation, and translation, with no sector dominating. It LOADS in the chilling basin — documentation collapses and technical debt compounds — but a small nudge of Just culture (or starting culture higher) tips it to the learning attractor. Same levers, two destinations: that is the path dependence.',
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
    // Start just below the saddle (C* ≈ 0.375) so the baseline opens in the
    // chilling basin and the bistability is visible on load; raising Just culture
    // past ~0.2 tips it to learning (the signature demo). See docs/MODEL.md.
    init: { C: 0.3 },
    citations: [
      { text: 'Illustrative balanced baseline; no sector basis. Levers chosen to sit inside the bistable region so path dependence (hysteresis) is visible.' },
    ],
  },
]

export const PRESET_BY_ID: Record<string, Preset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
)

export const DEFAULT_PRESET_ID = 'neutral'
