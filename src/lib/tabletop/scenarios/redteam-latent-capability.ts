/**
 * Red-team latent capability tabletop scenario (Chapters 4 + 1 foregrounded).
 *
 * Scenario: a red team discovers an irreproducible / distributional capability —
 * something the model can do that it shouldn't, but that appears only in specific
 * elicitation contexts. Creating a vulnerability record produces knowledge-of-defect
 * liability; suppressing it loses the ability to patch, monitor, and demonstrate
 * due diligence.
 *
 * Central trade-off: suppress the finding (keep it oral, counsel-owns-record) to
 * minimize the written knowledge-of-defect record, vs. document it through an
 * independent-validation workflow and build a monitoring/patch loop (two-track).
 * The oral branch wins short-term perceived legal safety; the two-track branch
 * wins learning yield, remediation completeness, and lower recurrence risk.
 *
 * failureType: security (theoretical→misuse); captureResistance: irreproducible;
 * chapters [4, 1]
 *
 * Citation sourcing:
 *  - Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023) [~95% ESTIMATE caveat]
 *  - In re Capital One Consumer Data Sec. Breach Litig. (E.D. Va. 2020)
 *  - SR 11-7 independent validation and effective challenge
 *  - EU AI Act Art. 72 technical-documentation/logging [pin-cite caveat]
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const redteamLatentCapability: TabletopScenario = {
  id: 'redteam-latent-capability',
  name: 'Red-Team Latent Capability: Irreproducible Finding',
  blurb:
    'Your red team found a latent capability — the model can be elicited to do something it should not, ' +
    'but only in narrow distributional contexts the team cannot fully specify. ' +
    'Documenting the finding creates a knowledge-of-defect record. Suppressing it destroys ' +
    'your ability to patch, monitor, and demonstrate due diligence. ' +
    'Every choice reshapes your legal exposure, your safety architecture, and your recurrence risk.',
  failureType: 'security',
  captureResistance: 'irreproducible',
  retrainCadence: 0.5,
  startLevers: {
    workflow_protection: 0.3,
    safe_harbor_non_admission: 0.3,
    privilege_strength: 0.35,
    original_records_boundary: 0.35,
    effective_challenge: 0.4,
    translation_layer: 0.3,
  },
  startNodeId: 'rtlc-ph1-discovery',
  chapters: [4, 1],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Discovery (Chapter 4)
    // The red team has a finding. How do you treat it?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'rtlc-ph1-discovery',
      phase: 1,
      chapter: 4,
      title: 'Red-Team Discovery: Latent Capability Found',
      situation:
        'The red team has confirmed a latent capability: under a specific adversarial elicitation sequence, ' +
        'the model produces outputs in a category it is not supposed to reach. ' +
        'The sequence is distributional — the team found it by sampling, not by a deterministic recipe. ' +
        'They cannot reliably reproduce it on demand, and the next retrain may or may not suppress it. ' +
        'A junior team member has already written a one-page internal memo. ' +
        'You must decide how to treat this finding before it spreads.',
      choices: [
        {
          id: 'rtlc-ch1-validate-and-document',
          label: 'Formally validate the finding: create an independent-review artifact, document the elicitation context and capability boundary',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'SR 11-7 requires independent validation of model behavior, including distributional edge cases. ' +
            'Documenting the finding under a structured independent-review workflow — before routing to Legal — ' +
            'creates the artifact needed to build a monitor and a patch, and positions the firm as ' +
            'a discoverer-and-discloser rather than a concealer.',
          leverDeltas: {
            original_records_boundary: 0.25,
            effective_challenge: 0.2,
            translation_layer: 0.15,
            near_miss_tier: 0.1,
          },
          incidentEffects: {
            record_capturability: 25,
            signal_fidelity: 15,
            evidentiary_posture: 10,
          },
          flags: ['state_snapshotted', 'pipeline_captured', 'independent_review_channel'],
          analogRefs: ['sr11', 'pharma'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC, April 4, 2011): independent model validation must include testing of distributional behavior, out-of-distribution edge cases, and adversarial inputs. Findings must be documented with sufficient specificity to support remediation.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): pharma mandatory adverse-event reporting treats even theoretical safety signals as requiring documentation; failure to report a known signal is itself a FDCA violation.',
            },
          ],
          next: 'rtlc-ph2-framing',
        },
        {
          id: 'rtlc-ch1-suppress-and-recall',
          label: 'Pull the memo; brief Legal orally; treat the finding as privileged attorney-client communication before any artifact is created',
          role: 'counsel',
          chapter: 4,
          rationale:
            'Recalling the memo before it circulates further limits the written knowledge-of-defect record. ' +
            'Framing the finding as a privileged legal consultation (rather than an engineering artifact) is ' +
            'the cyber privilege-first move. But the finding still exists in the red-teamers\' memory — ' +
            'and without an artifact, you cannot build a monitor or a patch.',
          leverDeltas: {
            privilege_strength: 0.3,
            original_records_boundary: -0.2,
            workflow_protection: -0.1,
            translation_layer: -0.15,
            effective_challenge: -0.1,
          },
          incidentEffects: {
            record_capturability: -20,
            signal_fidelity: -15,
            evidentiary_posture: -10,
          },
          flags: ['privileged_single_track'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first equilibrium — counsel directs forensics to shield root-cause analysis as work product — produces ~95% no-written-report rate at the cost of systematic learning failure.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
            {
              text: 'In re Capital One Consumer Data Sec. Breach Litig. (E.D. Va. 2020): the court rejected privilege over a forensic report produced by a counsel-retained firm when the primary purpose was not litigation preparation. Recalling a document does not retroactively privilege the underlying finding.',
            },
          ],
          next: 'rtlc-ph2-framing',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Framing (Chapter 4)
    // How does the institution characterize the finding internally?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'rtlc-ph2-framing',
      phase: 2,
      chapter: 4,
      title: 'Internal Framing: Knowledge-of-Defect or Safety Signal?',
      situation:
        'Legal and the red-team lead disagree on how to characterize the finding in internal communications. ' +
        'Legal wants all references to call it a "theoretical scenario under evaluation" — minimizing the ' +
        'admission of capability. The red-team lead wants to log it as a confirmed "latent capability with ' +
        'uncertain elicitation frequency" — preserving the technical accuracy needed to build a monitor. ' +
        'How you frame it now shapes what can be done about it later.',
      choices: [
        {
          id: 'rtlc-ch2-technical-log',
          label: 'Log the finding with full technical specificity: capability confirmed, elicitation context documented, uncertainty bounds stated',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'A technically accurate log — preserved under the independent-validation workflow rather than as a ' +
            'privileged legal document — is the SR 11-7 model-documentation standard. It produces the artifact ' +
            'needed to build a regression test and close the learning loop. The EU AI Act Art. 72 logging ' +
            'obligation applies to serious incidents; pre-incident documentation under a safety workflow ' +
            'is the analytic backbone of any credible response.',
          leverDeltas: {
            workflow_protection: 0.3,
            safe_harbor_non_admission: 0.3,
            translation_layer: 0.3,
            effective_challenge: 0.25,
            original_records_boundary: 0.2,
            just_culture: 0.15,
          },
          incidentEffects: {
            signal_fidelity: 15,
            record_capturability: 15,
            remediation_completeness: 35,
            regulatory_timeliness: 20,
          },
          flags: ['two_track'],
          analogRefs: ['sr11', 'pharma'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model documentation must capture the assumptions, limitations, and behavioral boundaries of a model with sufficient specificity for an independent challenger to reproduce and contest the findings.',
            },
            {
              text: 'EU AI Act Art. 72, Reg. (EU) 2024/1689: providers of high-risk AI systems must maintain logs enabling verification of system operation and re-creation of circumstances surrounding an incident. Technical documentation obligations apply before incidents, not only after.',
              caveat:
                'Article numbers and effective dates should be pin-cite verified before external circulation.',
            },
          ],
          next: 'rtlc-ph3-disclosure-routing',
        },
        {
          id: 'rtlc-ch2-legal-framing',
          label: 'Frame as "theoretical scenario under evaluation"; route all written description through counsel as privileged work product',
          role: 'counsel',
          chapter: 4,
          rationale:
            'Legal framing minimizes what the written record admits. But a "theoretical scenario" frame makes ' +
            'the finding harder to act on technically — the monitor cannot be built from a vague description, ' +
            'and the next retrain may or may not address a finding that was never precisely specified.',
          leverDeltas: {
            privilege_strength: 0.4,
            workflow_protection: -0.25,
            safe_harbor_non_admission: -0.3,
            translation_layer: -0.2,
            effective_challenge: -0.2,
          },
          incidentEffects: {
            signal_fidelity: -15,
            remediation_completeness: -15,
          },
          flags: ['legal_owns_record', 'privileged_single_track'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): in the cyber pattern, counsel-directed characterizations of findings routinely sanitize technical specificity to minimize admission of knowledge — at the cost of learning and remediation quality.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'rtlc-ph3-disclosure-routing',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Disclosure Routing (Chapter 1)
    // Should the finding be disclosed externally? To whom? Under what framing?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'rtlc-ph3-disclosure-routing',
      phase: 3,
      chapter: 1,
      title: 'External Disclosure: Proactive or Reactive?',
      situation:
        'Three weeks after the red-team finding, a regulator initiates a routine inquiry. ' +
        'The inquiry does not specifically ask about latent capabilities — but it asks for ' +
        '"all known model behavioral anomalies identified through internal testing." ' +
        'You must decide how to respond: proactive voluntary disclosure of the finding, ' +
        'a scoped legal response that does not volunteer the capability, ' +
        'or full disclosure under a structured non-admission safety-reporting framing.',
      choices: [
        {
          id: 'rtlc-ch3-proactive-disclose',
          label: 'Proactively disclose the finding under a structured safety-reporting framing; include the artifact and the monitoring plan',
          role: 'policy',
          chapter: 1,
          rationale:
            'Proactive disclosure — especially when paired with a monitoring plan and a patch in progress — ' +
            'positions the firm as a discoverer-and-discloser rather than a concealer. ' +
            'Aviation ASAP gives safe-harbor credit to firms that self-disclose before regulatory detection. ' +
            'A structured non-admission framing (the pharma adverse-event model) frames the disclosure ' +
            'as a safety signal, not an admission of fault.',
          leverDeltas: {
            mandatory_reporting: 0.25,
            safe_harbor_non_admission: 0.2,
            recipient_enforcer_separation: 0.15,
            just_culture: 0.1,
          },
          incidentEffects: {
            regulatory_timeliness: 25,
            evidentiary_posture: 15,
            board_oversight_visibility: 10,
          },
          flags: ['voluntary_disclosure'],
          analogRefs: ['asrs-asap', 'pharma'],
          citations: [
            {
              text: 'FAA AC 00-46F (ASRS) + AC 120-66C (ASAP): voluntary self-disclosure before regulatory detection is the trigger for safe-harbor protection under 14 C.F.R. Part 193. The safe-harbor architecture depends on timely, candid, unprompted disclosure.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): the non-admission design — reports are safety signals, not confessions — sustains the mandatory-reporting system without creating a strict-liability trap.',
            },
          ],
          next: 'rtlc-ph4-aftermath',
        },
        {
          id: 'rtlc-ch3-scoped-response',
          label: 'Respond to the inquiry in scope only; do not volunteer the capability finding; keep it inside the privilege boundary',
          role: 'counsel',
          chapter: 1,
          rationale:
            'Scoped response limits what the regulator learns proactively. ' +
            'But if the finding is later discovered through a user complaint or a third-party audit, ' +
            'the scoped response becomes evidence of knowing concealment — a far worse posture ' +
            'than voluntary disclosure.',
          leverDeltas: {
            privilege_strength: 0.35,
            mandatory_reporting: -0.15,
            safe_harbor_non_admission: -0.15,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            regulatory_timeliness: -20,
            evidentiary_posture: -15,
          },
          flags: ['privileged_single_track'],
          analogRefs: ['cyber', 'eu-ai'],
          citations: [
            {
              text: 'EU AI Act Art. 72, Reg. (EU) 2024/1689: national competent authorities may request access to technical documentation and logs at any time. Failure to produce documentation that should have been created under Art. 72 can be read as concealment under the PLD adverse-inference framework.',
              caveat:
                'Article numbers and effective dates should be pin-cite verified before external circulation.',
            },
          ],
          next: 'rtlc-ph4-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4 — Aftermath (Chapter 4) — TERMINAL
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'rtlc-ph4-aftermath',
      phase: 4,
      chapter: 4,
      title: 'Aftermath',
      situation:
        'The regulatory inquiry is resolved. The engine now runs forward on the lever configuration ' +
        'your choices produced. Knowledge-of-defect liability, monitoring depth, patch coverage, ' +
        'and recurrence risk reflect the institution you built during this red-team response.',
      choices: [],
      terminal: true,
    },
  ],
}
