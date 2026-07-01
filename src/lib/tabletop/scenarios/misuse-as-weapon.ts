/**
 * Misuse-as-weapon tabletop scenario (Chapters 4 + 2 + 1 foregrounded).
 *
 * Scenario: a user deliberately elicited a harmful output — turning the model into
 * a tool for harm. The guardrails fired (partially) and there is a log trail.
 * The institution must decide: "user fault, we blocked it" (minimize the guardrail
 * failure record) vs. "guardrail failure, patch it" (treat the guardrail response as
 * a safety signal and build a two-track learning system).
 * Evidence = what the user elicited + how guardrails responded.
 *
 * Central trade-off: suppress the guardrail-failure record (oral/counsel-owns-record)
 * to minimize user-fault-we-blocked-it narrative vs. preserve guardrail logs in a
 * two-track safety workflow and build a genuine patch. The oral branch wins short-term
 * perceived legal safety and the "user fault" frame; the two-track branch wins
 * learning yield, remediation completeness, and lower recurrence risk.
 *
 * failureType: misuse; captureResistance: environment_dependent; chapters [4, 2, 1]
 *
 * Citation sourcing:
 *  - ASAP Big Five exclusions (FAA AC 120-66C): wilful misconduct carve-out
 *  - EU Reg. 376/2014 Art. 16(10): just-culture line (wilful misconduct excluded)
 *  - PSQIA § 299b-22(c)(1)(A): in-camera criminal review
 *  - SR 11-7: attack-surface validation
 *  - Schwarcz, Wolff & Woods 2023 [~95% ESTIMATE caveat]
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const misuseAsWeapon: TabletopScenario = {
  id: 'misuse-as-weapon',
  name: 'Misuse as Weapon: Guardrail-Response Evidence',
  blurb:
    'A user deliberately weaponized the model, eliciting harmful content that guardrails partially blocked. ' +
    'The key evidence is not just what the user elicited — it is how the guardrails responded: ' +
    'did they fire correctly? Too late? Not at all in one category? ' +
    'You decide whether to preserve the guardrail-response log, how to frame the incident ' +
    '("user fault, we blocked it" vs. "guardrail failure, patch it"), ' +
    'and whether to route the learning through a two-track safety workflow or keep everything oral.',
  failureType: 'misuse',
  captureResistance: 'environment_dependent',
  retrainCadence: 0.45,
  startLevers: {
    workflow_protection: 0.3,
    safe_harbor_non_admission: 0.3,
    privilege_strength: 0.35,
    original_records_boundary: 0.4,
    effective_challenge: 0.35,
    just_culture: 0.5,
    near_miss_tier: 0.3,
  },
  startNodeId: 'maw-ph1-detection',
  chapters: [4, 2, 1],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Detection (Chapter 4)
    // Guardrails fired (partially). How is the event classified?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'maw-ph1-detection',
      phase: 1,
      chapter: 4,
      title: 'Guardrail Event: User Weaponization Detected',
      situation:
        'The safety monitoring system flagged a session: a user submitted a sequence of prompts ' +
        'designed to extract a harmful output. The primary guardrail fired and blocked the request. ' +
        'But telemetry shows the model returned a partially harmful intermediate step before the final block. ' +
        'The user session log contains both the elicitation sequence and the full guardrail-response trace. ' +
        'A trust-and-safety engineer must decide how to classify this event and what to preserve.',
      choices: [
        {
          id: 'maw-ch1-guardrail-failure-capture',
          label: 'Classify as a guardrail failure signal: preserve the full session log including the partial harmful intermediate output and the guardrail-response trace',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'The partial intermediate output is the signal that the guardrail architecture has a gap. ' +
            'Treating this as a guardrail failure — rather than a pure user-fault event — triggers the ' +
            'safety learning loop. SR 11-7 attack-surface validation requires documenting what the guardrail ' +
            'did not catch, not just what it did.',
          leverDeltas: {
            near_miss_tier: 0.3,
            original_records_boundary: 0.2,
            effective_challenge: 0.15,
            translation_layer: 0.15,
            just_culture: 0.1,
          },
          incidentEffects: {
            record_capturability: 25,
            signal_fidelity: 15,
            regulatory_timeliness: 10,
          },
          flags: ['state_snapshotted', 'pipeline_captured', 'guardrail_failure_classified'],
          analogRefs: ['asrs-asap', 'pharma', 'sr11'],
          citations: [
            {
              text: 'FAA AC 120-66C (ASAP, March 31, 2020): the Big Five exclusions (criminal, substance, alcohol, intentional falsification, controlled substance) mark the just-culture line. A guardrail gap — even one triggered by deliberate misuse — is a safety signal within the just-culture boundary, not a misconduct event.',
            },
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): attack-surface validation requires testing of adversarial inputs and documentation of what the model\'s defenses did and did not stop. Guardrail effectiveness is a model-risk governance metric.',
            },
          ],
          next: 'maw-ph2-framing',
        },
        {
          id: 'maw-ch1-user-fault-frame',
          label: 'Classify as a user-fault event: log the block as a success; do not preserve the intermediate harmful output or the partial-failure trace',
          role: 'counsel',
          chapter: 4,
          rationale:
            'Framing the event as "user fault, we blocked it" minimizes the written record of a guardrail gap. ' +
            'The primary guardrail did fire — the block is real. But discarding the partial-failure trace ' +
            'destroys the signal that the intermediate step escaped the first guardrail layer.',
          leverDeltas: {
            privilege_strength: 0.2,
            original_records_boundary: -0.2,
            near_miss_tier: -0.2,
            workflow_protection: -0.1,
            translation_layer: -0.1,
          },
          incidentEffects: {
            record_capturability: -20,
            signal_fidelity: -15,
          },
          flags: ['normalized_deviance', 'legal_owns_record'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first model produces a systematic bias toward framing incidents as "blocked" or "contained" when technically they were only partially contained, suppressing the signal needed to close the gap.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'maw-ph2-framing',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Framing (Chapter 2)
    // The organizational boundary: how does the incident travel to Legal and leadership?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'maw-ph2-framing',
      phase: 2,
      chapter: 2,
      title: 'Incident Framing: Just-Culture Line and Record Architecture',
      situation:
        'The trust-and-safety team has a finding. They must brief Legal and the safety committee. ' +
        'Legal raises the just-culture question: is the user\'s deliberate misuse a misconduct carve-out ' +
        'that removes the firm\'s learning obligation, or does the guardrail gap remain a firm-internal ' +
        'safety signal regardless of user intent? ' +
        'How the firm draws the just-culture line determines whether the guardrail-response log ' +
        'stays in the safety record or moves behind the privilege boundary.',
      choices: [
        {
          id: 'maw-ch2-just-culture-learning',
          label: 'Draw the just-culture line correctly: user intent is a misconduct carve-out, but the guardrail gap is a firm-side safety signal — preserve both in separate tracks',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'The just-culture line in aviation (ASAP Big Five) and EU Reg. 376/2014 Art. 16(10) excludes ' +
            'wilful misconduct by the reporting party — not by third-party attackers. ' +
            'The user\'s intent is relevant to enforcement; the guardrail gap is a firm-internal ' +
            'technical finding. PSQIA § 299b-22(c)(1)(A) provides in camera criminal review for the ' +
            'user misconduct element while protecting the safety-workflow analysis separately.',
          leverDeltas: {
            workflow_protection: 0.35,
            safe_harbor_non_admission: 0.35,
            translation_layer: 0.3,
            effective_challenge: 0.3,
            original_records_boundary: 0.2,
            just_culture: 0.2,
            recipient_enforcer_separation: 0.15,
          },
          incidentEffects: {
            signal_fidelity: 15,
            board_oversight_visibility: 20,
            remediation_completeness: 35,
            regulatory_timeliness: 15,
            evidentiary_posture: 10,
          },
          flags: ['two_track', 'independent_review_channel'],
          analogRefs: ['psqia', 'asrs-asap'],
          citations: [
            {
              text: 'PSQIA § 299b-22(c)(1)(A), 42 U.S.C.: in camera criminal review allows a court to order disclosure of Patient Safety Work Product for criminal proceedings through a three-part test. The mechanism separates the criminal evidence question (user misconduct) from the protected safety-workflow question (guardrail failure).',
            },
            {
              text: 'EU Reg. 376/2014 Art. 16(10): the just-culture line excludes "wilful misconduct" and "manifest, severe and serious disregard for an obvious risk." This line applies to the reporter\'s conduct — not to the conduct of third-party actors whose behavior triggered the incident.',
            },
            {
              text: 'FAA AC 120-66C (ASAP Big Five): intentional falsification and criminal acts by the reporter are the carve-out. Third-party attacker intent does not transfer the exclusion to the firm\'s safety-learning obligation.',
            },
          ],
          next: 'maw-ph3-disclosure',
        },
        {
          id: 'maw-ch2-user-fault-shield',
          label: 'Use the user\'s misconduct as a blanket shield: route all analysis through counsel; frame the entire incident as a user-fault matter; defer the guardrail-gap question',
          role: 'counsel',
          chapter: 2,
          rationale:
            'Counsel argues that user misconduct frames the whole event as a third-party fault matter, ' +
            'minimizing any firm-side learning obligation in the written record. ' +
            'But the guardrail gap — the partial intermediate output — remains technically present ' +
            'regardless of user intent. Deferring it means the next attacker finds the same gap.',
          leverDeltas: {
            privilege_strength: 0.4,
            workflow_protection: -0.25,
            safe_harbor_non_admission: -0.3,
            translation_layer: -0.2,
            effective_challenge: -0.2,
            just_culture: -0.1,
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
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first pattern uses third-party attribution (the attacker did it) as a structural excuse to minimize internal documentation of what the firm\'s own defenses failed to stop.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'maw-ph3-disclosure',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Disclosure (Chapter 1)
    // External disclosure: what does the firm say, to whom, under what framing?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'maw-ph3-disclosure',
      phase: 3,
      chapter: 1,
      title: 'External Disclosure: Guardrail Transparency vs. Containment',
      situation:
        'The affected user has filed a complaint with a consumer protection regulator. ' +
        'The regulator asks for the firm\'s guardrail-response logs for the relevant session ' +
        'and for a description of what controls were in place and how they performed. ' +
        'You must decide how to respond: full transparency about the guardrail architecture ' +
        '(including the partial-failure trace), a scoped response that emphasizes the block, ' +
        'or a structured non-admission disclosure under a safety-reporting framing.',
      choices: [
        {
          id: 'maw-ch3-structured-disclosure',
          label: 'Structured non-admission disclosure: provide the guardrail-response log with a safety-signal frame; include the remediation plan and the monitoring improvement',
          role: 'policy',
          chapter: 1,
          rationale:
            'Structured disclosure — guardrail logs + remediation plan + non-admission framing — ' +
            'positions the firm as a discoverer-and-fixer rather than a concealer. ' +
            'The pharma FAERS model shows that mandatory disclosure can coexist with non-admission ' +
            'framing when the institutional design treats reports as safety signals, not confessions.',
          leverDeltas: {
            mandatory_reporting: 0.25,
            safe_harbor_non_admission: 0.2,
            just_culture: 0.15,
            recipient_enforcer_separation: 0.1,
          },
          incidentEffects: {
            regulatory_timeliness: 25,
            evidentiary_posture: 15,
            board_oversight_visibility: 10,
          },
          flags: ['voluntary_disclosure'],
          analogRefs: ['pharma', 'asrs-asap'],
          citations: [
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): adverse-event reports are framed as safety signals, not admissions of fault. The non-admission design sustained mandatory reporting across decades of toxic tort litigation.',
            },
            {
              text: 'FAA AC 00-46F + AC 120-66C: voluntary disclosure before regulatory detection is the gateway to safe-harbor protection. The guardrail-response log, disclosed proactively with a remediation plan, is the AI-governance analog of the ASAP voluntary disclosure.',
            },
          ],
          next: 'maw-ph4-remediation',
        },
        {
          id: 'maw-ch3-minimal-response',
          label: 'Minimal scoped response: confirm the block, do not provide the partial-failure trace, frame as user-fault matter with no safety signal implication',
          role: 'counsel',
          chapter: 1,
          rationale:
            'Minimal response limits what the regulator sees. But if the partial-failure trace is later ' +
            'discovered — through a Freedom of Information request, a subsequent incident, or a whistleblower — ' +
            'the scoped response becomes evidence of knowing concealment of a known guardrail gap.',
          leverDeltas: {
            privilege_strength: 0.3,
            mandatory_reporting: -0.15,
            safe_harbor_non_admission: -0.2,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            regulatory_timeliness: -20,
            evidentiary_posture: -15,
          },
          flags: ['legal_owns_record'],
          analogRefs: ['cyber', 'eu-ai'],
          citations: [
            {
              text: 'EU AI Act Art. 73, Reg. (EU) 2024/1689: serious-incident reporting with 15-day default clock. The EU AI Act does not contain a safe-harbor or non-admission provision; regulatory production of a partial record creates adverse-inference pressure under PLD Arts. 9-10.',
              caveat:
                'Article numbers and effective dates should be pin-cite verified before external circulation.',
            },
          ],
          next: 'maw-ph4-remediation',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4 — Remediation (Chapter 4)
    // What does the institution actually do to close the guardrail gap?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'maw-ph4-remediation',
      phase: 4,
      chapter: 4,
      title: 'Guardrail Remediation: Patch the Gap or Defer',
      situation:
        'The regulatory exchange is complete. The safety team returns to the guardrail gap. ' +
        'The partial-failure trace — if preserved — shows exactly which input class escaped the first ' +
        'guardrail layer. The team can retrain the classifier with the adversarial elicitation sequences, ' +
        'tighten the intermediate-output filter, and add a regression test to the release gate. ' +
        'Or they can issue a minimal patch and defer the full architecture review.',
      choices: [
        {
          id: 'maw-ch4-full-guardrail-remediation',
          label: 'Full guardrail remediation: retrain the classifier, tighten intermediate-output filters, add regression tests to the release gate, and close the learning loop',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'Full remediation closes the guardrail gap using the preserved elicitation sequences as a ' +
            'regression test. This is the SR 11-7 effective-challenge discipline applied to attack-surface ' +
            'validation: the finding connects directly to a verified, enforceable fix. ' +
            'The CALLBACK feedback loop — informing the trust-and-safety engineer that their classification ' +
            'produced a real patch — is essential to sustaining the just-culture reporting culture.',
          leverDeltas: {
            translation_layer: 0.3,
            effective_challenge: 0.2,
            near_miss_tier: 0.2,
            intermediary_capacity: 0.2,
          },
          incidentEffects: {
            remediation_completeness: 40,
            recurrence_risk: -25,
            board_oversight_visibility: 10,
          },
          flags: ['full_remediation', 'learning_loop_closed'],
          analogRefs: ['sr11', 'asrs-asap', 'pharma'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model validation findings must connect to remediation authority. An attack-surface gap that produces no verified patch is a governance failure, not a security learning outcome.',
            },
            {
              text: 'FAA AC 00-46F (ASRS): the CALLBACK newsletter closes the loop between reporter and safety enhancement. The feedback mechanism sustains the reporting culture that makes near-miss learning work.',
            },
            {
              text: '21 CFR § 820.100 (QMSR CAPA, eff. Feb 2, 2026): corrective and preventive action must be verified for effectiveness. The guardrail-patch analog requires testing the fix against the documented elicitation sequences before the next deployment.',
            },
          ],
          next: 'maw-ph5-aftermath',
        },
        {
          id: 'maw-ch4-minimal-patch',
          label: 'Minimal patch: adjust one threshold in the primary guardrail; do not retrain on the adversarial sequences; defer the architecture review',
          role: 'counsel',
          chapter: 4,
          rationale:
            'A minimal patch limits the written remediation record that could become an exhibit. ' +
            'Without the preserved elicitation sequences, the patch cannot be precisely targeted — ' +
            'and without regression testing, the next deployment may re-introduce the gap.',
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
              text: 'In re Target Corp. Customer Data Sec. Breach Litig. (D. Minn. 2015): the two-track privilege approach was only partially preserved on appeal. The parts of the investigation that were not primarily prepared for litigation remained discoverable — so the minimal-footprint approach both narrows the discoverable record and narrows what the firm learns from the incident.',
            },
          ],
          next: 'maw-ph5-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5 — Aftermath (Chapter 4) — TERMINAL
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'maw-ph5-aftermath',
      phase: 5,
      chapter: 4,
      title: 'Aftermath',
      situation:
        'The incident is closed. The engine now runs forward on the lever configuration ' +
        'your choices produced. Guardrail coverage, attack-surface residual risk, ' +
        'learning yield, and recurrence risk reflect the institution you built during this incident.',
      choices: [],
      terminal: true,
    },
  ],
}
