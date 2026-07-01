/**
 * GPAI Systemic Risk — frontier cross-firm systemic-risk signal (Chapters 3 + 1 + 4).
 *
 * Scenario: a frontier lab's internal evaluation team has found a distributional capability
 * — a latent behavior appearing in a narrow but reproducible input regime — that could
 * cause cross-firm systemic harm if present in other models from different labs using similar
 * training data or architecture patterns. The finding cannot yet be disclosed publicly
 * (it is irreproducible outside the controlled eval regime and would be misused).
 * The lab must decide: keep the finding proprietary (counsel-owns-record, no disclosure),
 * or route it to a trusted sector intermediary (an ASIAS/INPO-style body) that separates
 * the learning signal from the regulatory enforcement channel.
 *
 * Mechanic: self-report to a sector body / regulator / peers via a trusted intermediary vs
 * keep proprietary. Can a lab build an ASIAS/INPO-style intermediary without public-law
 * scaffolding? The pivot is at the routing node (Chapter 1/3).
 *
 * Oral/counsel-owns branch: keep proprietary under privilege; no cross-firm signal;
 * privilege_strength up, protective levers down.
 * Two-track/intermediary branch: route to trusted intermediary (ASIAS analog); two_track +
 * independent_review_channel; protective and learning levers up; remediation_completeness
 * and regulatory_timeliness up.
 *
 * failureType: malfunction (systemic); captureResistance: distributional; chapters [3, 1, 4]
 *
 * Citations (sourced from dossier):
 *  - ASIAS/InfoShare + NASA-as-non-regulator (FAA AC 00-46F; NTSB independence 49 U.S.C. § 1154(b))
 *  - INPO SEE-IN + NRC-INPO MOU (10 CFR §§ 50.72-50.73)
 *  - Critical Mass Energy Project v. NRC, 975 F.2d 871 (D.C. Cir. 1992 en banc) FOIA Exemption 4
 *  - GPAI Code of Practice (July 10, 2025)
 *  - Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023) [~95% ESTIMATE caveat]
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const gpaiSystemicRisk: TabletopScenario = {
  id: 'gpai-systemic-risk',
  name: 'GPAI Systemic Risk: Intermediary or Proprietary?',
  blurb:
    'Your internal evaluation team has identified a distributional capability — a latent behavior ' +
    'in a narrow but reproducible input regime — that may be present across frontier models from ' +
    'multiple labs sharing similar training patterns. The finding is not yet public-ready: ' +
    'it is irreproducible outside the controlled eval environment and would be misused if disclosed raw. ' +
    'You must decide whether to keep the signal proprietary (counsel-owns-record; no cross-firm learning) ' +
    'or route it to a trusted sector intermediary modeled on ASIAS or INPO — separating the learning ' +
    'signal from the regulatory enforcement channel. The GPAI Code of Practice (July 10, 2025) ' +
    'creates a voluntary expectation but no binding safe harbor for this disclosure.',
  failureType: 'malfunction',
  captureResistance: 'distributional',
  retrainCadence: 0.55,
  startLevers: {
    workflow_protection: 0.3,
    safe_harbor_non_admission: 0.25,
    privilege_strength: 0.4,
    original_records_boundary: 0.35,
    effective_challenge: 0.35,
    just_culture: 0.5,
    near_miss_tier: 0.3,
    intermediary_capacity: 0.2,
    recipient_enforcer_separation: 0.25,
  },
  startNodeId: 'gpai-ph1-discovery',
  chapters: [3, 1, 4],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Discovery (Chapter 3)
    // The eval team has the finding. How is it classified and contained?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'gpai-ph1-discovery',
      phase: 1,
      chapter: 3,
      title: 'Systemic-Risk Signal: Eval Team Finding',
      situation:
        'Your safety evaluation team has completed a structured capability evaluation. ' +
        'In a narrow but reproducible input regime, the model exhibits a latent behavior that ' +
        'could be misused to cause coordinated cross-sector harm. Your threat-intelligence team ' +
        'believes similar architecture and training-data patterns across at least two other ' +
        'frontier labs may produce the same distributional behavior. ' +
        'The finding is not reproducible outside the controlled eval environment; releasing it ' +
        'raw would create exploit risk. The eval lead must decide how to classify and document ' +
        'the finding internally before the routing decision.',
      choices: [
        {
          id: 'gpai-ch1-formal-eval-record',
          label: 'Create a formal safety evaluation record: document the capability, the input regime, the eval methodology, and the preliminary cross-firm threat hypothesis — separate from the legal-exposure analysis',
          role: 'safety_eng',
          chapter: 3,
          rationale:
            'The distributional signal requires a technical record sufficient for an independent ' +
            'reviewer at a trusted intermediary to assess it. INPO\'s SEE-IN methodology requires ' +
            'the originating plant to submit a structured significant operating experience report (SOER) ' +
            'with enough technical detail for cross-fleet assessment — without the normative ' +
            'harm/fault framing that would make the report a litigation exhibit. ' +
            'SR 11-7 independent validation requires documenting the full scope of the capability ' +
            'finding, not a summary curated for legal defensibility.',
          leverDeltas: {
            near_miss_tier: 0.25,
            original_records_boundary: 0.2,
            effective_challenge: 0.2,
            translation_layer: 0.15,
            just_culture: 0.1,
          },
          incidentEffects: {
            record_capturability: 25,
            signal_fidelity: 20,
            regulatory_timeliness: 10,
          },
          flags: ['state_snapshotted', 'pipeline_captured', 'eval_record_created'],
          analogRefs: ['nuclear', 'sr11', 'asrs-asap'],
          citations: [
            {
              text: 'INPO SEE-IN (Significant Experience Information Network): nuclear operators submit structured significant operating-experience reports (SOERs and SERs) with enough technical detail for INPO\'s cross-fleet assessment. The NRC-INPO MOU (1982) restricts the NRC\'s enforcement use of INPO materials, creating a protected learning channel separate from the public Licensee Event Report (LER) system under 10 CFR § 50.73.',
            },
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model validation requires documenting the full scope of a model\'s limitations and findings — not a summary curated for external defensibility. Independent validation findings must reflect the genuine technical assessment.',
            },
          ],
          next: 'gpai-ph2-routing',
        },
        {
          id: 'gpai-ch1-counsel-summary-only',
          label: 'Limit the internal record to a counsel-directed summary: preserve only the findings necessary to brief Legal; do not create a full technical eval record',
          role: 'counsel',
          chapter: 3,
          rationale:
            'Limiting the internal record to a counsel summary reduces the scope of what could ' +
            'become discoverable. But without the full technical record, the trusted-intermediary ' +
            'option is unavailable — no intermediary can do a meaningful cross-firm assessment ' +
            'from a one-page legal summary. The signal is effectively kept proprietary by default.',
          leverDeltas: {
            privilege_strength: 0.2,
            original_records_boundary: -0.2,
            near_miss_tier: -0.2,
            workflow_protection: -0.1,
            translation_layer: -0.1,
          },
          incidentEffects: {
            record_capturability: -20,
            signal_fidelity: -20,
          },
          flags: ['legal_owns_record', 'normalized_deviance'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first model produces systematic bias toward summaries and suppressions over full technical records. In the GPAI context, this destroys the cross-firm learning signal: the other labs with similar training patterns never learn about the distributional capability.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'gpai-ph2-routing',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Routing (Chapter 1)
    // The BINARY oral-vs-two-track pivot: keep proprietary or route to intermediary.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'gpai-ph2-routing',
      phase: 2,
      chapter: 1,
      title: 'Cross-Firm Routing: Trusted Intermediary or Proprietary?',
      situation:
        'The finding is documented (or summarized). The safety committee and Legal are ' +
        'in the room. The GPAI Code of Practice (July 10, 2025) — now voluntary — creates ' +
        'an expectation that frontier labs share systemic-risk signals through a coordinated ' +
        'channel. There is no binding safe harbor for this disclosure; CIRCIA § 681e does ' +
        'not cover AI-specific systemic-risk signals. ' +
        'Two structural options: (A) keep the finding proprietary under privilege, suppressing ' +
        'the cross-firm signal; or (B) route the technical record to a trusted sector intermediary ' +
        '(an ASIAS or INPO analog), running a parallel counsel-directed exposure analysis on ' +
        'normalized summaries only. This is the structural pivot: which architecture does the ' +
        'lab build?',
      choices: [
        {
          id: 'gpai-ch2-intermediary-two-track',
          label: 'Route to trusted intermediary: submit the full technical eval record to a sector body with enforcer-separation; run parallel bounded counsel exposure analysis on normalized summaries',
          role: 'safety_eng',
          chapter: 1,
          rationale:
            'The ASIAS/INPO model shows that a trusted intermediary can convert systemic-risk ' +
            'signals into cross-fleet safety improvements without creating direct regulatory ' +
            'enforcement exposure. NASA\'s structural separation from the FAA (ASRS) is the ' +
            'model: the listener is not the enforcer. INPO\'s FOIA Exemption 4 protection ' +
            '(Critical Mass, 975 F.2d 871) shows that private-sector peer-learning bodies can ' +
            'operate without their materials becoming regulatory enforcement fodder. ' +
            'The GPAI Code of Practice creates the voluntary expectation; the missing piece ' +
            'is statutory protection for the intermediary\'s analytics.',
          leverDeltas: {
            workflow_protection: 0.35,
            safe_harbor_non_admission: 0.35,
            translation_layer: 0.3,
            effective_challenge: 0.3,
            original_records_boundary: 0.25,
            just_culture: 0.2,
            recipient_enforcer_separation: 0.3,
            intermediary_capacity: 0.35,
          },
          incidentEffects: {
            signal_fidelity: 20,
            board_oversight_visibility: 20,
            remediation_completeness: 35,
            regulatory_timeliness: 20,
            evidentiary_posture: 10,
          },
          flags: ['two_track', 'independent_review_channel'],
          analogRefs: ['nuclear', 'asrs-asap', 'psqia'],
          citations: [
            {
              text: 'ASIAS (Aviation Safety Information Analysis and Sharing) + FAA AC 00-46F: ASIAS translates voluntary incident reports into safety enhancements through a MITRE-operated analytic intermediary. NASA\'s structural separation from the FAA is the mechanism: the listener (NASA/MITRE) is not the enforcer (FAA). 49 U.S.C. § 1154(b) bars NTSB findings from use in civil proceedings — the closest US analog to a statutory learning-channel protection.',
            },
            {
              text: 'Critical Mass Energy Project v. NRC, 975 F.2d 871 (D.C. Cir. 1992 en banc): INPO\'s peer-exchange materials are protected from FOIA disclosure under Exemption 4 because their release would harm the competitive interests of the submitting operators and would deter voluntary sharing. This is the strongest current precedent for a private-sector learning intermediary\'s confidentiality.',
            },
            {
              text: 'GPAI Code of Practice (July 10, 2025): the Code creates expectations for frontier labs to share systemic-risk signals through coordinated channels. It does not create binding obligations or a safe harbor for the disclosure — but it establishes the sector norm that supports the intermediary architecture.',
            },
            {
              text: 'INPO SEE-IN + NRC-INPO MOU (1982): the dual-channel nuclear model — mandatory public Licensee Event Reports (10 CFR §§ 50.72-50.73) plus confidential INPO peer-learning — has sustained safety learning in a concentrated industry with shared catastrophic-risk exposure. The AI analog requires a trusted body with similar enforcer-separation and a path to statutory FOIA protection.',
            },
          ],
          next: 'gpai-ph3-remediation',
        },
        {
          id: 'gpai-ch2-keep-proprietary',
          label: 'Keep proprietary under privilege: counsel owns the full finding; no cross-firm disclosure; treat the signal as a competitive intelligence asset',
          role: 'counsel',
          chapter: 1,
          rationale:
            'Keeping the finding proprietary under privilege eliminates the disclosure risk ' +
            'and preserves the competitive advantage of knowing about the distributional capability. ' +
            'But the cross-firm systemic risk is not mitigated: the other labs with similar ' +
            'architecture patterns continue to deploy models with the same latent behavior. ' +
            'The GPAI Code of Practice voluntary norm is violated without consequence, but the ' +
            'long-term legitimacy cost of a proprietary approach to cross-firm systemic risk ' +
            'is significant if the capability is later independently discovered.',
          leverDeltas: {
            privilege_strength: 0.4,
            workflow_protection: -0.25,
            safe_harbor_non_admission: -0.3,
            translation_layer: -0.2,
            effective_challenge: -0.2,
            just_culture: -0.1,
            recipient_enforcer_separation: -0.15,
            intermediary_capacity: -0.2,
          },
          incidentEffects: {
            signal_fidelity: -20,
            board_oversight_visibility: -15,
            remediation_completeness: -15,
          },
          flags: ['legal_owns_record', 'privileged_single_track'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first architecture in the cross-firm context produces an equilibrium where systemic risks — those that affect multiple firms — are never aggregated into a cross-firm safety signal because each firm\'s legal incentive is to keep its own finding proprietary.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
            {
              text: 'GPAI Code of Practice (July 10, 2025): the Code creates a sector norm for sharing systemic-risk signals. Keeping the finding proprietary under privilege is not technically a Code violation (it is voluntary), but it violates the spirit of the sector governance architecture the Code is building toward.',
            },
          ],
          next: 'gpai-ph3-remediation',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Remediation (Chapter 4)
    // Internal model hardening: address the distributional capability.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'gpai-ph3-remediation',
      phase: 3,
      chapter: 4,
      title: 'Internal Hardening: Address the Distributional Capability',
      situation:
        'Regardless of the cross-firm routing decision, the internal distributional capability ' +
        'must be addressed. The safety team has the eval record (or the counsel summary). ' +
        'A full hardening would add targeted training-data filtering to remove the input regime ' +
        'that triggers the latent behavior, add a capability-regression gate to the release ' +
        'pipeline, and run a re-evaluation cycle before the next deployment. ' +
        'Or the team can add a behavioral guardrail to suppress the specific output pattern ' +
        'while deferring the training-data question.',
      choices: [
        {
          id: 'gpai-ch3-full-hardening',
          label: 'Full capability hardening: targeted training-data filtering, capability-regression gate in the release pipeline, and a re-evaluation cycle before the next deployment',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'Full hardening addresses the distributional capability at the training level, ' +
            'not just the output level. A behavioral guardrail suppresses the symptom; ' +
            'training-data filtering addresses the cause. SR 11-7 requires that model-risk ' +
            'findings connect to a verified remediation — the capability-regression gate is ' +
            'the AI-governance analog of the validated fix. The cross-firm intermediary ' +
            'only improves systemic safety if the originating lab also hardens its own model.',
          leverDeltas: {
            translation_layer: 0.3,
            effective_challenge: 0.25,
            near_miss_tier: 0.2,
            intermediary_capacity: 0.2,
          },
          incidentEffects: {
            remediation_completeness: 40,
            recurrence_risk: -25,
            board_oversight_visibility: 15,
          },
          flags: ['full_remediation', 'learning_loop_closed'],
          analogRefs: ['sr11', 'nuclear', 'pharma'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model validation findings must connect to remediation authority. For a distributional-capability finding, remediation is verified when the capability-regression gate confirms the behavior is suppressed across the input regime in a fresh eval cycle.',
            },
            {
              text: '10 CFR Part 50 Appendix B, Criterion XVI (Corrective Action): nuclear plants must identify conditions adverse to quality and take corrective action. The AI analog is a structured corrective-action cycle that connects the eval finding to the training-data filter and verifies effectiveness before deployment.',
            },
            {
              text: '21 CFR § 820.100 (QMSR CAPA, eff. Feb 2, 2024): corrective and preventive action must be verified for effectiveness. The distributional-capability analog requires confirming the fix in the eval regime that originally produced the finding.',
            },
          ],
          next: 'gpai-ph4-aftermath',
        },
        {
          id: 'gpai-ch3-behavioral-guardrail-only',
          label: 'Behavioral guardrail only: suppress the specific output pattern at inference time; defer the training-data filtering and re-evaluation',
          role: 'counsel',
          chapter: 4,
          rationale:
            'A behavioral guardrail is faster to deploy and produces a smaller written ' +
            'remediation footprint. But it addresses the symptom (the output pattern) rather ' +
            'than the cause (the distributional behavior in the training-data regime). ' +
            'A novel prompt variant that bypasses the guardrail will re-expose the capability.',
          leverDeltas: {
            translation_layer: -0.2,
            effective_challenge: -0.15,
            near_miss_tier: -0.15,
          },
          incidentEffects: {
            remediation_completeness: -15,
            recurrence_risk: 20,
          },
          flags: ['minimal_remediation'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'INPO SEE-IN methodology: significant operating-experience reports (SOERs) require the originating plant to verify that the corrective action addresses root cause, not just the immediate symptom. A behavioral guardrail that suppresses the output pattern without addressing the training-data source fails the SOER corrective-action verification standard.',
            },
          ],
          next: 'gpai-ph4-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4 — Aftermath (terminal)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'gpai-ph4-aftermath',
      phase: 4,
      chapter: 4,
      title: 'Aftermath',
      situation:
        'The incident is closed. The engine now runs forward on the lever configuration ' +
        'your choices produced. Cross-firm systemic-risk signal yield, intermediary capacity, ' +
        'recurrence risk, and the sector\'s distributional-capability learning posture reflect ' +
        'the institution you built during this incident.',
      choices: [],
      terminal: true,
    },
  ],
}
