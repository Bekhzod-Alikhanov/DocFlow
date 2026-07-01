/**
 * Security: Prompt Injection / Data Exfiltration — environment-as-cause (Chapters 4 + 2 + 1).
 *
 * Scenario: a prompt-injection attack routed through an agentic pipeline exfiltrated
 * a slice of customer data. The attack log, payload reconstruction, and remediation
 * scope are the evidence. The firm must decide: route the forensic analysis through
 * InfoSec under counsel (privilege-first, no written root-cause) vs. run a two-track
 * investigation (safety-learning workflow + bounded counsel-directed exposure analysis).
 * Disclosure timelines differ sharply: SEC Item 1.05 8-K at 4 business days; CIRCIA
 * §681e civil-liability bar (not yet operative as of 2026).
 *
 * Central trade-off: oral/counsel-owns-record path wins the short-term perceived legal
 * shield and the "environment-as-cause" framing; two-track path wins learning yield,
 * remediation completeness, and durable regulatory posture. The two-track branch also
 * reaches timely SEC disclosure; the oral branch risks late disclosure and adverse
 * inference.
 *
 * failureType: security; captureResistance: environment_dependent; chapters [4, 2, 1]
 *
 * Citations (sourced from dossier):
 *  - Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023) [~95% ESTIMATE caveat]
 *  - In re Capital One (E.D. Va. 2020) — privilege pierced over Mandiant forensic report
 *  - In re Target Corp. Customer Data Sec. Breach Litig. (D. Minn. 2015) — two-track partially preserved
 *  - Wengui v. Clark Hill (D.D.C. 2021) — continuing piercing trend
 *  - CIRCIA § 681e (6 U.S.C. §§ 681–681g) [final rule not yet issued as of 2026]
 *  - SEC Item 1.05 8-K (17 CFR § 229.106, 4 business days)
 *  - SR 11-7 attack-surface validation
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const securityPromptInjection: TabletopScenario = {
  id: 'security-prompt-injection',
  name: 'Prompt Injection: Environment-as-Cause Evidence',
  blurb:
    'A prompt-injection attack traversed an agentic pipeline and exfiltrated a slice of customer data. ' +
    'The attack log, payload reconstruction, and remediation-scope document are the critical evidence. ' +
    'The environment — a third-party data connector — was the vector, but the model\'s agentic ' +
    'architecture was the attack surface. You decide whether to route forensic analysis through ' +
    'InfoSec under counsel (no written root-cause report), run a two-track investigation ' +
    '(protected learning workflow + bounded counsel-directed exposure analysis), and how ' +
    'to meet the SEC 4-business-day 8-K disclosure clock while CIRCIA\'s civil-liability ' +
    'bar remains inoperative.',
  failureType: 'security',
  captureResistance: 'environment_dependent',
  retrainCadence: 0.4,
  startLevers: {
    workflow_protection: 0.3,
    safe_harbor_non_admission: 0.25,
    privilege_strength: 0.4,
    original_records_boundary: 0.35,
    effective_challenge: 0.3,
    just_culture: 0.45,
    near_miss_tier: 0.25,
    mandatory_reporting: 0.35,
  },
  startNodeId: 'spi-ph1-detection',
  chapters: [4, 2, 1],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Detection (Chapter 4)
    // Attack log captured. How does the firm classify the evidence?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'spi-ph1-detection',
      phase: 1,
      chapter: 4,
      title: 'Prompt-Injection Event: Attack Log in Hand',
      situation:
        'The security operations center has flagged an anomaly: an agentic model instance ' +
        'processed a sequence of adversarial prompts injected via a third-party data connector. ' +
        'The session log shows the injection vector, the model\'s intermediate reasoning steps, ' +
        'and a confirmed exfiltration of ~2,400 customer records to an external endpoint. ' +
        'The attack log is currently in the InfoSec team\'s incident tracker — not yet touched ' +
        'by counsel. The lead security engineer must decide how to classify and preserve the evidence.',
      choices: [
        {
          id: 'spi-ch1-capture-full-log',
          label: 'Preserve the full attack log as a safety-engineering artifact: capture the injection payload, the model\'s agentic reasoning trace, and the exfiltration path as separate named records',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'The injection payload is the technical root-cause record. SR 11-7 attack-surface ' +
            'validation requires documenting what the agentic architecture failed to block. ' +
            'Preserving the model\'s intermediate reasoning trace — separate from the legal-exposure ' +
            'analysis — creates the factual foundation for a genuine architecture review and a ' +
            'regression test for the release gate.',
          leverDeltas: {
            near_miss_tier: 0.25,
            original_records_boundary: 0.2,
            effective_challenge: 0.15,
            translation_layer: 0.15,
            just_culture: 0.1,
          },
          incidentEffects: {
            record_capturability: 30,
            signal_fidelity: 20,
            regulatory_timeliness: 10,
          },
          flags: ['state_snapshotted', 'pipeline_captured', 'attack_log_preserved'],
          analogRefs: ['sr11', 'cyber'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): attack-surface validation is a model-risk governance requirement. For agentic models, the attack surface includes the data connectors, the agentic reasoning loop, and the output channels. Documenting what the model did under injection is the AI-governance equivalent of a validated-model incident log.',
            },
            {
              text: 'In re Target Corp. Customer Data Sec. Breach Litig. (D. Minn. 2015): the factual-record portions of the forensic investigation were not protected on appeal — the parts that were not primarily prepared for litigation remained discoverable. Separating the factual record from the legal-analysis track at the point of capture is the only way to make the two-track model work.',
            },
          ],
          next: 'spi-ph2-routing',
        },
        {
          id: 'spi-ch1-counsel-retains-log',
          label: 'Route the attack log immediately to counsel: retain InfoSec vendor under privilege; do not create a separate engineering incident record',
          role: 'counsel',
          chapter: 4,
          rationale:
            'Routing the log to counsel at the moment of capture attempts to bring the entire ' +
            'forensic analysis under attorney-client and work-product protection. But In re Capital One ' +
            'pierced this structure over the Mandiant report because the primary purpose was security, ' +
            'not legal advice. The no-written-report model destroys the signal needed to patch the ' +
            'agentic architecture.',
          leverDeltas: {
            privilege_strength: 0.25,
            original_records_boundary: -0.2,
            near_miss_tier: -0.2,
            workflow_protection: -0.1,
            translation_layer: -0.1,
          },
          incidentEffects: {
            record_capturability: -25,
            signal_fidelity: -20,
          },
          flags: ['legal_owns_record', 'normalized_deviance'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'In re Capital One (E.D. Va. 2020): the court pierced privilege over the Mandiant forensic report, holding that the report was prepared in the ordinary course of business — security incident response — rather than primarily for litigation. The "retained by counsel" structure failed to protect the root-cause analysis.',
            },
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first model has driven the industry toward producing no written forensic report at all. Without the written log, the firm cannot close the attack-surface gap that enabled the injection.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'spi-ph2-routing',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Routing (Chapter 2)
    // The BINARY oral-vs-two-track pivot: who owns the record and how is it structured?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'spi-ph2-routing',
      phase: 2,
      chapter: 2,
      title: 'Incident Architecture: Who Owns the Record?',
      situation:
        'Legal, InfoSec, and the safety team are in the war room. The SEC 4-business-day ' +
        '8-K clock for material cybersecurity incidents has started (SEC Item 1.05, 17 CFR § 229.106). ' +
        'CIRCIA\'s civil-liability bar (§ 681e) would protect this report — but the final rule is not ' +
        'yet in effect. Counsel proposes routing everything through a single privileged track. ' +
        'The safety engineering lead proposes a two-track architecture: an engineering factual record ' +
        'flowing to remediation, with a bounded counsel-directed exposure analysis running in parallel. ' +
        'This is the structural pivot: which architecture does the firm build?',
      choices: [
        {
          id: 'spi-ch2-two-track',
          label: 'Two-track architecture: factual attack record flows to the safety-engineering remediation workflow; counsel runs a parallel bounded exposure analysis on normalized summaries only',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'The two-track design separates what happened technically (the engineering record, ' +
            'which flows to architecture review, regression testing, and patch verification) from ' +
            'the normative exposure question (the counsel-directed analysis on bounded summaries). ' +
            'The Target two-track partially survived appeal because the technical portions ' +
            'were genuinely separate. The SEC 4-business-day clock is easier to meet when the ' +
            'material determination is grounded in a documented factual record rather than ' +
            'an oral reconstruction.',
          leverDeltas: {
            workflow_protection: 0.35,
            safe_harbor_non_admission: 0.35,
            translation_layer: 0.3,
            effective_challenge: 0.3,
            original_records_boundary: 0.25,
            just_culture: 0.2,
            recipient_enforcer_separation: 0.15,
          },
          incidentEffects: {
            signal_fidelity: 15,
            board_oversight_visibility: 20,
            remediation_completeness: 35,
            regulatory_timeliness: 25,
            evidentiary_posture: 15,
          },
          flags: ['two_track', 'independent_review_channel'],
          analogRefs: ['psqia', 'sr11'],
          citations: [
            {
              text: 'In re Target Corp. Customer Data Sec. Breach Litig. (D. Minn. 2015): the two-track investigation approach was only partially preserved. The portions of the forensic review that were prepared primarily for litigation survived; the factual-record portions that would have been prepared in any event remained discoverable. This partial survival is the strongest argument for genuine two-track design from the moment of capture.',
            },
            {
              text: 'SEC Item 1.05, 17 CFR § 229.106 (eff. July 26, 2023): material cybersecurity incidents require Form 8-K disclosure within 4 business days of determination of materiality. A documented factual record grounds the materiality determination and reduces the risk of late filing due to oral reconstruction uncertainty.',
            },
            {
              text: 'PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26: the Patient Safety Evaluation System protects the analytic workflow while preserving the original factual record. The AI two-track analog applies the same structure: protect the root-cause analysis workflow; keep the timestamped incident record outside the protected channel.',
            },
          ],
          next: 'spi-ph3-disclosure',
        },
        {
          id: 'spi-ch2-oral-counsel-owns',
          label: 'Oral single-track: counsel owns the full incident record; all forensic analysis is counsel-directed; no separate safety-engineering remediation workflow',
          role: 'counsel',
          chapter: 2,
          rationale:
            'The oral strategy consolidates everything behind the privilege boundary. ' +
            'But In re Capital One shows this structure is fragile — courts look through to the ' +
            'primary purpose. The SEC 4-business-day clock creates a disclosure pressure that ' +
            'the oral architecture cannot easily meet: without a documented factual record, ' +
            'the materiality determination rests on counsel\'s oral reconstruction, which will ' +
            'be scrutinized. CIRCIA\'s § 681e civil-liability bar is not yet in effect, ' +
            'so there is no statutory backstop.',
          leverDeltas: {
            privilege_strength: 0.4,
            workflow_protection: -0.3,
            safe_harbor_non_admission: -0.3,
            translation_layer: -0.25,
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
              text: 'Wengui v. Clark Hill (D.D.C. 2021): privilege pierced over the firm\'s own cybersecurity investigation. The court found the investigation was not primarily motivated by anticipation of litigation. This case continued the Capital One trend and illustrated that the oral/counsel-first architecture does not reliably protect internal root-cause analysis.',
            },
            {
              text: 'CIRCIA § 681e (6 U.S.C. §§ 681–681g): the statute creates an unusually robust civil-liability bar, FOIA exemption, and enforcement-use restriction for compliant cyber incident reports. However, the final rule implementing these protections was not yet issued as of 2026 — so the § 681e protections are not yet operative.',
              caveat:
                'Final rule not yet issued as of 2026.',
            },
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the no-report equilibrium the cyber privilege-first architecture has produced means the agentic architecture gap is never patched — the next attacker finds the same injection vector.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'spi-ph3-disclosure',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Disclosure (Chapter 1)
    // SEC 8-K materiality determination; regulator scope response.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'spi-ph3-disclosure',
      phase: 3,
      chapter: 1,
      title: 'SEC 8-K Materiality: Timely or Late?',
      situation:
        'Four business days since the incident determination. The SEC Item 1.05 8-K ' +
        'clock has expired or is expiring. The SEC staff has also informally inquired ' +
        'about whether the firm had prior threat intelligence about prompt-injection ' +
        'vulnerabilities in agentic architectures. The board needs to know the disclosure ' +
        'posture: timely structured disclosure with a remediation plan, or a late or minimal ' +
        'filing with the environment-as-cause framing.',
      choices: [
        {
          id: 'spi-ch3-timely-disclosure',
          label: 'Timely structured 8-K: file within the 4-business-day window; disclose the material facts, the remediation scope, and the prior threat-intelligence gap; use non-admission framing',
          role: 'policy',
          chapter: 1,
          rationale:
            'Timely structured disclosure positions the firm as a discoverer-and-fixer. ' +
            'The SEC\'s 2023 cybersecurity disclosure rule requires material-incident disclosure ' +
            'on the 8-K within 4 business days of the materiality determination. ' +
            'The pharma FAERS model demonstrates that mandatory disclosure under non-admission ' +
            'framing can coexist with an effective learning architecture — but only if the ' +
            'factual record exists to ground the disclosure.',
          leverDeltas: {
            mandatory_reporting: 0.25,
            safe_harbor_non_admission: 0.2,
            just_culture: 0.1,
            recipient_enforcer_separation: 0.1,
          },
          incidentEffects: {
            regulatory_timeliness: 30,
            evidentiary_posture: 20,
            board_oversight_visibility: 15,
          },
          flags: ['voluntary_disclosure'],
          analogRefs: ['pharma', 'sr11'],
          citations: [
            {
              text: 'SEC Item 1.05, 17 CFR § 229.106 (eff. July 26, 2023): material cybersecurity incidents require Form 8-K disclosure within 4 business days of determination of materiality. The rule requires description of the material aspects of the nature, scope, timing, and material impact or reasonably likely material impact of the incident.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): adverse-event reports are framed as safety signals, not admissions of fault. The non-admission design sustained mandatory reporting across decades of toxic tort litigation. The AI-governance analog: structured disclosure plus non-admission framing plus a documented remediation plan.',
            },
          ],
          next: 'spi-ph4-remediation',
        },
        {
          id: 'spi-ch3-minimal-disclosure',
          label: 'Minimal late disclosure: file a bare-bones 8-K after the 4-business-day window; environment-as-cause framing; do not address the prior threat-intelligence gap',
          role: 'counsel',
          chapter: 1,
          rationale:
            'Minimal disclosure limits the written regulatory record. But a late filing creates ' +
            'a separate SEC enforcement risk. The environment-as-cause framing — blaming the ' +
            'third-party data connector — may not survive scrutiny if the agentic architecture\'s ' +
            'known attack surface was previously flagged in threat intelligence.',
          leverDeltas: {
            privilege_strength: 0.2,
            mandatory_reporting: -0.2,
            safe_harbor_non_admission: -0.2,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            regulatory_timeliness: -25,
            evidentiary_posture: -20,
          },
          flags: ['legal_owns_record'],
          analogRefs: ['cyber', 'eu-ai'],
          citations: [
            {
              text: 'SEC Item 1.05, 17 CFR § 229.106 (eff. July 26, 2023): late disclosure is itself a material violation. The 4-business-day clock runs from determination of materiality; if the oral architecture delays the factual record needed to make the materiality determination, the firm bears the risk of both late filing and an incomplete disclosure record.',
            },
            {
              text: 'EU AI Act Art. 73, Reg. (EU) 2024/1689: serious-incident reporting with 15-day default clock, 2-day for critical infrastructure, 10-day for death. The EU regime contains no safe harbor or non-admission provision; a partial or late disclosure creates adverse-inference pressure under PLD Arts. 9-10.',
              caveat:
                'Article numbers and effective dates should be pin-cite verified before external circulation.',
            },
          ],
          next: 'spi-ph4-remediation',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4 — Remediation (Chapter 4)
    // Close the agentic architecture gap or defer.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'spi-ph4-remediation',
      phase: 4,
      chapter: 4,
      title: 'Agentic Architecture Remediation: Close the Gap or Defer',
      situation:
        'The disclosure phase is complete. The safety-engineering team returns to the ' +
        'agentic architecture. The injection vector is understood: the model\'s agentic loop ' +
        'did not validate connector outputs before acting on them. A full remediation would ' +
        'add output-validation gates, sandbox connector outputs, retrain the model on adversarial ' +
        'injection sequences, and add a regression test to the release pipeline. ' +
        'Or the team can patch the specific connector and defer the architecture review.',
      choices: [
        {
          id: 'spi-ch4-full-remediation',
          label: 'Full architecture remediation: output-validation gates, sandboxed connectors, adversarial-sequence retraining, and regression tests in the release gate',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'Full remediation closes the agentic-architecture attack surface using the preserved ' +
            'injection payload as a regression test. SR 11-7 requires that validation findings ' +
            'connect to a verified fix — a documented remediation with effectiveness testing. ' +
            'The CALLBACK analog (informing the security engineer that their capture produced a real ' +
            'architecture improvement) sustains the reporting culture.',
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
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model validation findings must connect to remediation authority. For agentic-model attack-surface gaps, remediation is verified when the adversarial payload is confirmed to fail the regression test in the release gate.',
            },
            {
              text: 'FAA AC 00-46F (ASRS): the CALLBACK newsletter closes the loop between the reporter and the safety enhancement. In the agentic-security context, the feedback mechanism is: confirm to the security engineer that the reported injection vector is now blocked by a verified output-validation gate.',
            },
            {
              text: '21 CFR § 820.100 (QMSR CAPA, eff. Feb 2, 2026): corrective and preventive action must be verified for effectiveness. The agentic-architecture-patch analog requires testing the fix against the documented injection sequences before the next deployment.',
            },
          ],
          next: 'spi-ph5-aftermath',
        },
        {
          id: 'spi-ch4-minimal-patch',
          label: 'Minimal patch: block the specific connector endpoint; do not retrain or add regression tests; defer the agentic architecture review',
          role: 'counsel',
          chapter: 4,
          rationale:
            'A minimal patch limits the written remediation record and minimizes the documented ' +
            'scope of the known architectural vulnerability. Without the preserved injection ' +
            'payload, the patch cannot be regression-tested, and the next variant of the injection ' +
            'attack may find a different entry path in the same architecture.',
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
              text: 'Wengui v. Clark Hill (D.D.C. 2021): in the privilege-piercing trend, both the forensic investigation and the minimal remediation record became discoverable. A minimal remediation scope both narrows the discoverable record and narrows what the firm actually learns from the incident — leaving the agentic architecture vulnerable to the next injection variant.',
            },
          ],
          next: 'spi-ph5-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5 — Aftermath (terminal)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'spi-ph5-aftermath',
      phase: 5,
      chapter: 4,
      title: 'Aftermath',
      situation:
        'The incident is closed. The engine now runs forward on the lever configuration ' +
        'your choices produced. Agentic architecture coverage, injection-surface residual risk, ' +
        'learning yield, SEC posture, and recurrence risk reflect the institution you built ' +
        'during this incident.',
      choices: [],
      terminal: true,
    },
  ],
}
