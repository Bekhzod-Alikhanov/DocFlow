/**
 * Sector presets (spec §1, §5.6). Each is a sparse set of lever overrides on top
 * of the registry defaults, plus citations and — where the spec requires it — a
 * reliability caveat surfaced in the UI (e.g. the cyber "95% is an estimate" flag).
 *
 * Lever values are illustrative encodings of each regime's structural posture, not
 * measured quantities. The cyber preset is the one calibration target: it is tuned
 * to settle near f_doc ≈ 0.05 (the Schwarcz/Wolff/Woods 2023 *estimate*).
 */
import type { Preset } from './types'

export const PRESETS: Preset[] = [
  {
    id: 'cybersecurity',
    name: 'Cybersecurity (negative analog)',
    blurb:
      'High perceived discoverability, fragile/weak privilege, no recipient–enforcer separation. Lawyer-led IR pushes analysis out of the written record. Settles near the chilling attractor.',
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
    name: 'Aviation (ASRS / ASAP)',
    blurb:
      'Strong recipient–enforcer separation (NASA is not the regulator), codified just-culture line, statutory non-disclosure. Voluntary confidential reporting sustains learning.',
    expectedRegime: 'learning',
    overrides: {
      privilege_strength: 0.8,
      just_culture: 0.85,
      mandatory_reporting: 0.4,
      pld_penalty: 0.05,
      recipient_enforcer_separation: 0.9,
      translation_layer: 0.7,
    },
    init: { C: 0.6 },
    citations: [
      { text: 'FAA Advisory Circular AC 00-46F (Apr. 2, 2021) — ASRS voluntary, confidential, non-punitive.' },
      { text: '49 U.S.C. §40123 — statutory non-disclosure of safety reports; 14 C.F.R. §91.25.' },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare (PSQIA)',
    blurb:
      'Privilege attaches to a workflow (the Patient Safety Evaluation System), not a document — defeating the dual-purpose objection. Strong translation layer converts reports to safety.',
    expectedRegime: 'learning',
    overrides: {
      privilege_strength: 0.85,
      just_culture: 0.7,
      mandatory_reporting: 0.45,
      pld_penalty: 0.1,
      recipient_enforcer_separation: 0.75,
      translation_layer: 0.85,
    },
    init: { C: 0.6 },
    citations: [
      { text: 'Patient Safety and Quality Improvement Act, 42 U.S.C. §§299b-21 to 299b-26; 42 C.F.R. Part 3.' },
      { text: 'HHS PSQIA Guidance, 81 Fed. Reg. 32655 (May 24, 2016) — three pathways to protected status.' },
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
