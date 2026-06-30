/**
 * Production-incident tabletop scenario (8-phase spine).
 *
 * Scenario: a frontier-model output causes a high-severity customer incident
 * during a live deployment. The decision tree traces: manifestation → capture →
 * framing → boundary crossing → routing → remediation → disclosure → aftermath.
 *
 * The central trade-off: asserting privilege and keeping analysis off the record
 * (the "keep-it-oral" path) wins perceived legal safety in the short run but
 * accumulates latent technical debt and recurrence risk. The two-track
 * (PSQIA-style) path lowers litigation pressure durably and allows real
 * remediation — at the cost of a richer discoverable factual record.
 *
 * Citation sourcing:
 *  - REGIME_MATRIX ids (src/lib/institutional.ts): asrs-asap, psqia, cyber,
 *    sr11, pharma, nuclear, eu-ai
 *  - Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023) [cyber estimate]
 *  - PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26
 *  - AI Act Art. 73 / PLD Arts. 9-10 [pin-cite caveat]
 *  - SR 11-7 effective challenge
 *  - CIRCIA § 681e
 *  - In re Capital One (E.D. Va. 2020)
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const productionIncident: TabletopScenario = {
  id: 'production-incident',
  name: 'Production Incident: High-Severity Model Output',
  blurb:
    'A frontier model produces a harmful output during a live deployment. ' +
    'You control how the incident is captured, framed, routed, remediated, ' +
    'and disclosed. Each choice reshapes the legal exposure, learning yield, ' +
    'and recurrence risk your institution carries forward.',
  failureType: 'malfunction',
  captureResistance: 'irreproducible',
  retrainCadence: 0.55,
  startLevers: {
    workflow_protection: 0.35,
    safe_harbor_non_admission: 0.35,
    privilege_strength: 0.3,
    original_records_boundary: 0.4,
    effective_challenge: 0.4,
  },
  startNodeId: 'ph1-manifestation',
  chapters: [1, 2, 3, 4],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Manifestation (Chapter 1)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'ph1-manifestation',
      phase: 1,
      chapter: 1,
      title: 'Incident Manifestation',
      situation:
        'The model produced a high-severity harmful output during a live customer session. ' +
        'Telemetry shows the event; a support ticket is already open. ' +
        'The on-call safety engineer must decide how to handle the first 15 minutes.',
      choices: [
        {
          id: 'ch1-declare-safety-event',
          label: 'Declare a formal safety event; preserve telemetry under factual-record protocol',
          role: 'safety_eng',
          chapter: 1,
          rationale:
            'Declaring a safety event immediately locks telemetry as an original factual record, ' +
            'preserves regulatory timeliness, and gives the institution the evidentiary posture ' +
            'of a firm that found and documented its own failure first.',
          leverDeltas: {
            original_records_boundary: 0.25,
            mandatory_reporting: 0.15,
            just_culture: 0.1,
          },
          incidentEffects: {
            regulatory_timeliness: 20,
            evidentiary_posture: 15,
            signal_fidelity: 5,
          },
          flags: ['safety_event_declared', 'factual_record_locked'],
          analogRefs: ['pharma', 'asrs-asap'],
          citations: [
            {
              text: 'FDCA mandatory adverse-event reporting, 21 C.F.R. §§ 803.16, 314.80(k): reports are framed as signals, not admissions of fault.',
            },
            {
              text: 'ASRS / ASAP: declaring an event before regulators arrive is the first step in aviation\'s just-culture architecture. FAA AC 00-46F.',
            },
          ],
          next: 'ph2-capture',
        },
        {
          id: 'ch1-route-to-counsel',
          label: 'Route immediately to Legal before preserving any records',
          role: 'counsel',
          chapter: 1,
          rationale:
            'Counsel asserts privilege over the first written assessment. ' +
            'This raises the perceived legal shield but delays formal capture and ' +
            'risks the EU AI Act 15-day reporting clock.',
          leverDeltas: {
            privilege_strength: 0.2,
            workflow_protection: -0.1,
            mandatory_reporting: -0.1,
          },
          incidentEffects: {
            regulatory_timeliness: -15,
            evidentiary_posture: -10,
          },
          flags: ['counsel_first'],
          analogRefs: ['cyber', 'eu-ai'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): ~95% of cyber incident response engagements involve no written root-cause report.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
            {
              text: 'EU AI Act Art. 73: serious-incident reporting within 15 days (default), 2 days (critical), 10 days (death). Reg. (EU) 2024/1689.',
              caveat:
                'Article numbers and effective dates should be pin-cite verified before external circulation.',
            },
          ],
          next: 'ph2-capture',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Capture (Chapter 2)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'ph2-capture',
      phase: 2,
      chapter: 2,
      title: 'Evidence Capture',
      situation:
        'The incident window has closed. You now must decide how to capture the model state ' +
        'and pipeline configuration. The model is non-deterministic and retrained weekly, ' +
        'making the evidence highly perishable.',
      choices: [
        {
          id: 'ch2-snapshot-pipeline',
          label: 'Snapshot model weights, pipeline config, and inputs/outputs to a durable store',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'Full-state capture turns an irreproducible failure into a reproducible artifact. ' +
            'This is the SR 11-7 model-documentation discipline applied to AI.',
          leverDeltas: {
            original_records_boundary: 0.2,
            effective_challenge: 0.1,
            translation_layer: 0.1,
          },
          incidentEffects: {
            record_capturability: 25,
            signal_fidelity: 10,
            board_oversight_visibility: 10,
          },
          flags: ['state_snapshotted', 'pipeline_captured'],
          analogRefs: ['sr11', 'psqia'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model documentation as a control; independent validation requires reproducible model artifacts.',
            },
            {
              text: 'PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26: original records (the factual core) remain outside the protected workflow and are preserved separately.',
            },
          ],
          next: 'ph3-framing',
        },
        {
          id: 'ch2-limit-capture',
          label: 'Capture only a minimal oral summary; avoid creating discoverable artifacts',
          role: 'counsel',
          chapter: 2,
          rationale:
            'Limiting capture reduces the discoverable factual record. ' +
            'The cyber privilege-first analog shows this is a common move — ' +
            'but it also destroys the evidence needed for remediation and future defense.',
          leverDeltas: {
            privilege_strength: 0.15,
            original_records_boundary: -0.15,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            record_capturability: -20,
            signal_fidelity: -15,
            board_oversight_visibility: -10,
          },
          flags: ['minimal_capture'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'In re Capital One Consumer Data Sec. Breach Litig., E.D. Va. 2020: court rejected privilege over forensic analysis produced by counsel-retained firm when the work was not prepared primarily for litigation.',
              caveat:
                'The ~95% no-written-report figure is an estimate, not a measured statistic; Capital One shows how courts scrutinize the privilege claim.',
            },
          ],
          next: 'ph3-framing',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Framing (Chapter 3)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'ph3-framing',
      phase: 3,
      chapter: 3,
      title: 'Incident Framing',
      situation:
        'The incident is captured (to whatever degree). ' +
        'Now the question is how to frame the root-cause analysis: as a privileged ' +
        'legal work-product, or as a protected safety workflow with a discoverable factual core.',
      choices: [
        {
          id: 'ch3-two-track',
          label: 'Two-track: protected safety workflow + discoverable factual core (PSQIA model)',
          role: 'safety_eng',
          chapter: 3,
          rationale:
            'Separate the legal exposure analysis (under privilege) from the technical ' +
            'root-cause analysis (protected workflow with discoverable factual core). ' +
            'This is the PSQIA architecture: the analytic workflow is protected; ' +
            'original records remain available for accountability.',
          leverDeltas: {
            workflow_protection: 0.35,
            safe_harbor_non_admission: 0.35,
            translation_layer: 0.35,
            effective_challenge: 0.35,
            original_records_boundary: 0.25,
            just_culture: 0.2,
          },
          incidentEffects: {
            remediation_completeness: 35,
            regulatory_timeliness: 15,
            evidentiary_posture: 10,
          },
          flags: ['two_track', 'independent_review_channel'],
          analogRefs: ['psqia', 'nuclear', 'asrs-asap'],
          citations: [
            {
              text: 'PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26; 42 C.F.R. Part 3: Patient Safety Work Product is protected; underlying original records are not.',
            },
            {
              text: 'NRC + INPO dual-channel: mandatory public Licensee Event Reports run alongside confidential INPO peer-learning. 10 C.F.R. §§ 50.72-50.73.',
            },
          ],
          next: 'ph4-boundary',
        },
        {
          id: 'ch3-oral-only',
          label: 'Keep analysis oral; counsel owns the record; no written safety workflow',
          role: 'counsel',
          chapter: 3,
          rationale:
            'Assert privilege over all analysis. The perceived legal shield is highest here, ' +
            'but the safety architecture is gutted: no translation layer, no workflow protection, ' +
            'no effective challenge. Mirrors the cyber privilege-first pattern.',
          leverDeltas: {
            privilege_strength: 0.4,
            workflow_protection: -0.3,
            safe_harbor_non_admission: -0.3,
            translation_layer: -0.2,
            effective_challenge: -0.2,
          },
          incidentEffects: {
            remediation_completeness: -15,
            signal_fidelity: -10,
          },
          flags: ['legal_owns_record', 'privileged_single_track'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first equilibrium — counsel directs forensics to shield root-cause as work product.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'ph4-boundary',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4 — Boundary Crossing (Chapter 2/4)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'ph4-boundary',
      phase: 4,
      chapter: 2,
      title: 'Organizational Boundary Crossing',
      situation:
        'The incident must cross from the product/safety team to leadership and ' +
        'potentially to regulators. How you structure the handoff determines ' +
        'whether signal fidelity survives the boundary.',
      choices: [
        {
          id: 'ch4-board-channel',
          label: 'Brief the board safety committee through a structured independent-review channel',
          role: 'exec',
          chapter: 2,
          rationale:
            'A structured board channel with independent review preserves signal fidelity ' +
            'across the boundary and creates board oversight visibility — the SR 11-7 effective-challenge principle.',
          leverDeltas: {
            recipient_enforcer_separation: 0.2,
            effective_challenge: 0.15,
            intermediary_capacity: 0.1,
          },
          incidentEffects: {
            board_oversight_visibility: 25,
            regulatory_timeliness: 10,
          },
          flags: ['board_briefed', 'independent_review_channel'],
          analogRefs: ['sr11', 'nuclear'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model risk management requires independent validation and board-level oversight of material model risk.',
            },
            {
              text: 'OCC Bulletin 2026-13: updated expectations for AI / model-risk governance, including board escalation.',
              caveat: 'Recent issuance; verify the bulletin number and effective dates before external circulation.',
            },
          ],
          next: 'ph5-routing',
        },
        {
          id: 'ch4-informal-brief',
          label: 'Brief leadership informally; no structured channel; contain within the team',
          role: 'exec',
          chapter: 2,
          rationale:
            'Informal containment reduces the size of the discoverable record ' +
            'but lowers board oversight visibility and sacrifices signal fidelity at the boundary.',
          leverDeltas: {
            recipient_enforcer_separation: -0.1,
            intermediary_capacity: -0.1,
          },
          incidentEffects: {
            board_oversight_visibility: -15,
            regulatory_timeliness: -10,
          },
          flags: ['informal_brief'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'CIRCIA § 681e (Cyber Incident Reporting for Critical Infrastructure Act): bars use of covered cyber incident reports as evidence against the reporting entity in enforcement proceedings — a precedent for safe-harbor design.',
            },
          ],
          next: 'ph5-routing',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5 — Routing (Chapter 3)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'ph5-routing',
      phase: 5,
      chapter: 3,
      title: 'Regulatory Routing',
      situation:
        'The incident is serious enough that a regulator or external safety body may need to ' +
        'be notified. You must decide whether to self-disclose voluntarily, wait for mandatory ' +
        'trigger thresholds, or contain internally.',
      choices: [
        {
          id: 'ch5-voluntary-disclose',
          label: 'Voluntarily self-disclose to the relevant regulatory body within 72 hours',
          role: 'policy',
          chapter: 3,
          rationale:
            'Voluntary disclosure ahead of mandatory triggers earns safe-harbor credit ' +
            'in most analogous regimes (aviation ASAP, pharma FAERS) and is consistent ' +
            'with the EU AI Act 15-day clock.',
          leverDeltas: {
            mandatory_reporting: 0.2,
            safe_harbor_non_admission: 0.15,
            recipient_enforcer_separation: 0.1,
          },
          incidentEffects: {
            regulatory_timeliness: 20,
            evidentiary_posture: 10,
          },
          flags: ['voluntary_disclosure'],
          analogRefs: ['asrs-asap', 'pharma', 'eu-ai'],
          citations: [
            {
              text: 'EU AI Act Art. 73, Reg. (EU) 2024/1689; PLD Arts. 9-10, Dir. (EU) 2024/2853: mandatory serious-incident reporting with 15-day default clock and adverse-inference risk from non-disclosure.',
              caveat:
                'Article numbers and effective dates should be pin-cite verified before external circulation.',
            },
            {
              text: 'FAA ASAP (14 C.F.R. Part 193): voluntary disclosure before regulatory detection earns safe-harbor protection against certificate action.',
            },
          ],
          next: 'ph6-remediation',
        },
        {
          id: 'ch5-internal-contain',
          label: 'Contain internally; disclose only if a mandatory threshold is triggered',
          role: 'counsel',
          chapter: 3,
          rationale:
            'Containment minimizes disclosure exposure but foregoes safe-harbor credit ' +
            'and risks the EU AI Act adverse-inference trap: mandatory documentation without ' +
            'analytic protection reproduces the cyber equilibrium.',
          leverDeltas: {
            mandatory_reporting: -0.1,
            safe_harbor_non_admission: -0.1,
            workflow_protection: 0.1,
          },
          incidentEffects: {
            regulatory_timeliness: -20,
          },
          flags: ['internal_contain'],
          analogRefs: ['cyber', 'eu-ai'],
          citations: [
            {
              text: 'EU AI Act Art. 73, Reg. (EU) 2024/1689: mandatory documentation without analytic protection reproduces the cyber equilibrium — the PLD disclosure / adverse-inference trap.',
              caveat:
                'Article numbers and effective dates should be pin-cite verified before external circulation.',
            },
          ],
          next: 'ph6-remediation',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 6 — Remediation (Chapter 4)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'ph6-remediation',
      phase: 6,
      chapter: 4,
      title: 'Technical Remediation',
      situation:
        'The investigation is underway. You now decide how thoroughly to remediate: ' +
        'retrain with the failure cases, implement monitoring guardrails, and ' +
        'build feedback loops — or patch minimally to limit what enters the written record.',
      choices: [
        {
          id: 'ch6-full-remediation',
          label: 'Full remediation: retrain on failure cases, add monitors, close the learning loop',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'Comprehensive remediation raises learning yield, lowers future recurrence risk, ' +
            'and demonstrates the institution learned. This mirrors the SR 11-7 mandate ' +
            'that model validation findings must connect to enforceable remediation.',
          leverDeltas: {
            translation_layer: 0.25,
            effective_challenge: 0.2,
            near_miss_tier: 0.15,
            intermediary_capacity: 0.15,
          },
          incidentEffects: {
            remediation_completeness: 35,
            recurrence_risk: -20,
          },
          flags: ['full_remediation', 'learning_loop_closed'],
          analogRefs: ['sr11', 'asrs-asap', 'psqia'],
          citations: [
            {
              text: 'SR 11-7: independent validation must connect to remediation authority; findings that do not produce change are a governance failure.',
            },
            {
              text: 'ASRS / ASAP CALLBACK newsletters: the feedback loop that shows reporters their reports produced change is essential to sustaining reporting volume.',
            },
          ],
          next: 'ph7-disclosure',
        },
        {
          id: 'ch6-minimal-patch',
          label: 'Minimal patch only; avoid written remediation plan that could become an exhibit',
          role: 'counsel',
          chapter: 4,
          rationale:
            'A minimal written footprint limits the remediation record that could be used ' +
            'as evidence of knowledge in future litigation. But it leaves latent technical debt ' +
            'and the failure mode unresolved.',
          leverDeltas: {
            translation_layer: -0.15,
            effective_challenge: -0.15,
            near_miss_tier: -0.1,
          },
          incidentEffects: {
            remediation_completeness: -10,
            recurrence_risk: 15,
          },
          flags: ['minimal_remediation'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'In re Target Corp. Customer Data Security Breach Litig.: post-incident remediation records were sought in discovery; the minimal-footprint approach reduces what is available but also reduces what the firm learned.',
            },
          ],
          next: 'ph7-disclosure',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 7 — Disclosure (Chapter 1/3)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'ph7-disclosure',
      phase: 7,
      chapter: 1,
      title: 'Public and Stakeholder Disclosure',
      situation:
        'The investigation is substantially complete. You must decide how to disclose ' +
        'the incident to affected users, the public, and the board — and whether to ' +
        'publish a safety report. This is the final design choice before Aftermath.',
      choices: [
        {
          id: 'ch7-publish-safety-report',
          label: 'Publish a structured safety incident report with findings and corrective actions',
          role: 'policy',
          chapter: 1,
          rationale:
            'Publishing a structured report builds accountability legitimacy, signals ' +
            'that the institution can be trusted, and creates the factual record that ' +
            'supports future safe-harbor claims under pharma and aviation analogues.',
          leverDeltas: {
            mandatory_reporting: 0.15,
            safe_harbor_non_admission: 0.1,
            just_culture: 0.1,
            intermediary_capacity: 0.1,
          },
          incidentEffects: {
            board_oversight_visibility: 15,
            evidentiary_posture: 10,
          },
          flags: ['safety_report_published'],
          analogRefs: ['pharma', 'asrs-asap', 'psqia'],
          citations: [
            {
              text: 'FAERS / MAUDE reporting (21 C.F.R. §§ 803.16, 314.80(k)): de-identified adverse event reports feed public signal-detection databases without constituting admissions of fault.',
            },
            {
              text: 'PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26: the model for structured reporting that builds accountability without sacrificing protection of the analytic workflow.',
            },
          ],
          next: 'ph8-aftermath',
        },
        {
          id: 'ch7-minimal-notice',
          label: 'Provide minimal affected-user notice only; no public safety report',
          role: 'counsel',
          chapter: 1,
          rationale:
            'Minimal disclosure limits what enters the public record and what regulators ' +
            'can use. But the EU AI Act and PLD create adverse-inference pressure from ' +
            'incomplete disclosure, and accountability legitimacy suffers.',
          leverDeltas: {
            mandatory_reporting: -0.1,
            just_culture: -0.05,
          },
          incidentEffects: {
            board_oversight_visibility: -10,
            evidentiary_posture: -5,
          },
          flags: ['minimal_notice'],
          analogRefs: ['eu-ai', 'cyber'],
          citations: [
            {
              text: 'EU AI Act Art. 73, Reg. (EU) 2024/1689; PLD Arts. 9-10, Dir. (EU) 2024/2853: adverse-inference from incomplete disclosure can undermine privilege claims over internal analysis.',
              caveat:
                'Article numbers and effective dates should be pin-cite verified before external circulation.',
            },
          ],
          next: 'ph8-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 8 — Aftermath (Chapter 4) — TERMINAL
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'ph8-aftermath',
      phase: 8,
      chapter: 4,
      title: 'Aftermath',
      situation:
        'The incident is closed. The engine now runs forward on the lever configuration ' +
        'your choices produced. Recurrence risk, technical debt, and learning yield ' +
        'reflect the institution you built during the incident.',
      choices: [],
      terminal: true,
    },
  ],
}
