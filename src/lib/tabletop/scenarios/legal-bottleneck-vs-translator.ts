/**
 * Legal Bottleneck vs. Translator — same incident, pivotal Ch.2 design branch
 * (Chapters 2 + 1 foregrounded).
 *
 * Scenario: a malfunction in a deployed model produced an irreproducible harmful output
 * that caused measurable harm to a user. The incident has been detected, the harm is
 * documented, and the safety team has a preliminary technical finding. Now the organizational
 * boundary question dominates: does Legal become a bottleneck (counsel owns the record;
 * nothing flows to remediation without counsel sign-off; the factual record is absorbed
 * into the privileged channel) or does Legal act as a translator (counsel runs a parallel
 * exposure assessment while the factual record flows unimpeded to the remediation workflow)?
 *
 * The pivot IS the whole point. The bottleneck vs. translator branch is the dominant
 * structural choice. The scenario makes that choice explicit at the first (and only major)
 * decision node, then traces the diverging meter trajectories through disclosure.
 *
 * Meters show fidelity/litigation/learning/remediation diverging clearly:
 *  - Bottleneck (oral/legal_owns_record): signal_fidelity falls at each hop, remediation
 *    stalls, recurrence risk rises; privilege_strength up, protective levers down.
 *  - Translator (two_track): workflow_protection, safe_harbor_non_admission, translation_layer,
 *    effective_challenge, original_records_boundary, just_culture all up; remediation_completeness
 *    and regulatory_timeliness up.
 *
 * failureType: malfunction; captureResistance: irreproducible; chapters [2, 1]
 *
 * Citations (sourced from dossier):
 *  - PSQIA 42 U.S.C. §§ 299b-21..26 (PSES separates workflow from work-product)
 *  - Langevoort legal gate-keeping (doctrine + organization theory)
 *  - Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023) [~95% ESTIMATE caveat]
 *  - SR 11-7 CSI doctrine (12 CFR § 261.2; 12 U.S.C. § 1828(x))
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const legalBottleneckVsTranslator: TabletopScenario = {
  id: 'legal-bottleneck-vs-translator',
  name: 'Legal Bottleneck vs. Translator: The Ch.2 Design Choice',
  blurb:
    'A deployed model produced an irreproducible harmful output causing measurable user harm. ' +
    'The safety team has a preliminary technical finding. Everything now turns on one organizational ' +
    'design question: does Legal become a bottleneck — owning the record, gatekeeping every ' +
    'communication, absorbing the factual incident into the privileged channel — or does Legal ' +
    'act as a translator, running a parallel exposure assessment while the factual record flows ' +
    'unimpeded to the remediation workflow? ' +
    'The PSQIA model (42 U.S.C. §§ 299b-21..26) is the closest legal template: protect the ' +
    'Patient Safety Evaluation System workflow, preserve the original records. ' +
    'The Langevoort gate-keeping dynamic shows what goes wrong when the bottleneck role is adopted.',
  failureType: 'malfunction',
  captureResistance: 'irreproducible',
  retrainCadence: 0.5,
  startLevers: {
    workflow_protection: 0.25,
    safe_harbor_non_admission: 0.25,
    privilege_strength: 0.4,
    original_records_boundary: 0.35,
    effective_challenge: 0.3,
    just_culture: 0.5,
    near_miss_tier: 0.3,
    translation_layer: 0.25,
  },
  startNodeId: 'lbvt-ph1-pivot',
  chapters: [2, 1],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — The Pivot (Chapter 2)
    // The dominant structural branch: bottleneck vs. translator.
    // This is a single binary choice node — both paths lead to disclosure.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'lbvt-ph1-pivot',
      phase: 1,
      chapter: 2,
      title: 'The Organizational Design Pivot: Bottleneck or Translator?',
      situation:
        'An hour after the harmful output is confirmed, the crisis call assembles: ' +
        'VP Safety, General Counsel, Head of Engineering, Head of Policy. ' +
        'The safety team\'s preliminary technical finding is on the table: the model produced ' +
        'the harmful output through an irreproducible interaction of two features that the ' +
        'monitoring system flagged as low-probability individually. ' +
        'General Counsel interrupts: "Nothing leaves this room without my review. ' +
        'All engineering notes go through Legal. The incident is attorney-client from this moment." ' +
        'The VP Safety pushes back: "We need the factual record to flow to the remediation team ' +
        'now. Counsel can run a parallel exposure assessment on summaries. ' +
        'That\'s how PSQIA does it: protect the workflow, not the facts." ' +
        'This is the structural pivot. How does the firm design the incident architecture?',
      choices: [
        {
          id: 'lbvt-ch1-translator',
          label: 'Translator model: the factual incident record flows unimpeded to the remediation workflow; counsel runs a parallel bounded exposure assessment on normalized summaries; the two tracks are kept structurally separate',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'The translator design separates what happened technically (the factual record, ' +
            'which flows to engineering remediation) from what it means legally (the counsel-directed ' +
            'exposure analysis on bounded summaries). PSQIA\'s Patient Safety Evaluation System ' +
            'is the template: information developed for reporting through the PSES workflow is ' +
            'protected Patient Safety Work Product; the underlying original records remain ' +
            'discoverable. This design sustains learning and remediation while running the ' +
            'legal exposure analysis on a bounded, separately-maintained track. ' +
            'SR 11-7 independent validation has the same structure: the validation team sees ' +
            'the full technical record; management receives the finding summary.',
          leverDeltas: {
            workflow_protection: 0.4,
            safe_harbor_non_admission: 0.4,
            translation_layer: 0.35,
            effective_challenge: 0.35,
            original_records_boundary: 0.3,
            just_culture: 0.25,
            recipient_enforcer_separation: 0.2,
          },
          incidentEffects: {
            signal_fidelity: 20,
            board_oversight_visibility: 25,
            remediation_completeness: 40,
            regulatory_timeliness: 20,
            evidentiary_posture: 15,
          },
          flags: ['two_track', 'independent_review_channel'],
          analogRefs: ['psqia', 'sr11', 'asrs-asap'],
          citations: [
            {
              text: 'PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26 (Patient Safety and Quality Improvement Act, 2005): the Patient Safety Evaluation System (PSES) route protects the analytic workflow — information developed for reporting to a Patient Safety Organization through the PSES. The original-records exception ensures that the underlying patient records (the factual core) remain discoverable. The PSQIA design is the AI-governance template for separating the factual incident record from the protected safety-evaluation workflow.',
            },
            {
              text: 'HHS Guidance, 81 Fed. Reg. 32655 (May 24, 2016): clarified the three pathways to Patient Safety Work Product status and the segregation requirement. The segregation requirement confirms that the factual record must be maintained separately from the protected workflow analysis.',
            },
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model risk management requires independent validation with effective challenge. The validation team sees the full technical record; governance receives a finding summary. This structural separation — full record to technical review; summary to governance — is the SR 11-7 translator model for AI incident analysis.',
            },
            {
              text: 'FAA AC 00-46F (ASRS): NASA\'s role as the non-regulatory listener separates receipt of the safety signal from FAA enforcement. The AI translator analog is the safety team receiving the factual record without the legal-exposure framing that would suppress technical candor.',
            },
          ],
          next: 'lbvt-ph2-disclosure',
        },
        {
          id: 'lbvt-ch1-bottleneck',
          label: 'Bottleneck model: counsel owns the full incident record from this moment; all engineering communications and technical findings route through Legal; the factual record is absorbed into the privileged channel',
          role: 'counsel',
          chapter: 2,
          rationale:
            'The bottleneck design gives Legal control of every communication — at the cost ' +
            'of two structural failures. First, the Langevoort gate-keeping dynamic: when ' +
            'counsel controls the record, organizational incentives systematically suppress ' +
            'bad news at each translation hop (engineer → counsel → leadership), producing ' +
            'the documented gap between what engineers know and what leadership sees. ' +
            'Second, the remediation team cannot act on a technical record it cannot see: ' +
            'the patch waits for counsel sign-off, the recurrence window stays open. ' +
            'SR 11-7\'s CSI doctrine shows that regulator-held privilege (not firm-held ' +
            'attorney-client privilege) is the structural backstop that makes documentation-intensive ' +
            'governance work in financial services — a backstop AI firms cannot replicate.',
          leverDeltas: {
            privilege_strength: 0.45,
            workflow_protection: -0.3,
            safe_harbor_non_admission: -0.35,
            translation_layer: -0.3,
            effective_challenge: -0.25,
            just_culture: -0.15,
            original_records_boundary: -0.2,
          },
          incidentEffects: {
            signal_fidelity: -25,
            board_oversight_visibility: -20,
            remediation_completeness: -20,
          },
          flags: ['legal_owns_record', 'privileged_single_track'],
          analogRefs: ['cyber', 'sr11'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first model is the canonical bottleneck: counsel controls the forensic process, vendor reports are structured to avoid creating discoverable analysis, and the organizational result is that the technical team\'s full understanding of the incident never reaches the safety record.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
            {
              text: 'SR 11-7 CSI doctrine (12 CFR § 261.2; 12 U.S.C. § 1828(x)): the Confidential Supervisory Information doctrine protects bank examination records held by the regulator, not attorney-client privilege held by the bank. The SR 11-7 documentation-intensive model works because the regulator holds the privilege — banks cannot replicate this structure with attorney-client privilege alone, and AI firms face the same structural gap.',
            },
          ],
          next: 'lbvt-ph2-disclosure',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Disclosure (Chapter 1)
    // External disclosure: regulator inquiry; the two architectures diverge sharply.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'lbvt-ph2-disclosure',
      phase: 2,
      chapter: 1,
      title: 'Regulatory Inquiry: The Two Architectures Diverge',
      situation:
        'Three weeks after the incident, the relevant regulator (a consumer-protection ' +
        'agency in the jurisdiction) requests the firm\'s incident record: what the model did, ' +
        'what the firm knew at each stage, and what remediation was undertaken. ' +
        'The two architectures produce radically different disclosure postures. ' +
        'The translator model has a factual record that can be produced, a completed remediation ' +
        'that can be documented, and a safety-workflow analysis that is bounded and defensible. ' +
        'The bottleneck model has an oral reconstruction, a stalled remediation, and a counsel-summary ' +
        'that is being tested for privilege in a jurisdiction where attorney-client protection for ' +
        'internal root-cause analysis is fragile.',
      choices: [
        {
          id: 'lbvt-ch2-grounded-disclosure',
          label: 'Structured grounded disclosure: produce the factual incident record; describe the safety-workflow analysis in bounded terms; attach the remediation verification; use non-admission framing throughout',
          role: 'policy',
          chapter: 1,
          rationale:
            'The translator architecture produces a disclosure that is grounded, complete, ' +
            'and defensible. The factual record is already documented; the remediation is ' +
            'verified; the safety-workflow analysis is separately maintained and can be ' +
            'described in bounded terms without producing every document in the channel. ' +
            'The pharma FAERS non-admission design demonstrates that mandatory disclosure ' +
            'with non-admission framing is a stable equilibrium over decades of litigation.',
          leverDeltas: {
            mandatory_reporting: 0.25,
            safe_harbor_non_admission: 0.2,
            just_culture: 0.1,
            recipient_enforcer_separation: 0.1,
          },
          incidentEffects: {
            regulatory_timeliness: 30,
            evidentiary_posture: 20,
            board_oversight_visibility: 10,
          },
          flags: ['voluntary_disclosure'],
          analogRefs: ['pharma', 'psqia'],
          citations: [
            {
              text: 'PSQIA § 299b-22(c)(1)(A), 42 U.S.C.: the in camera criminal review mechanism allows a court to order disclosure of Patient Safety Work Product for criminal proceedings through a three-part test. The mechanism confirms that protected workflow analysis has a defined disclosure pathway when the regulator or court has genuine need — and that this pathway does not destroy the protection for the learning channel.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): adverse-event reports are safety signals, not admissions of fault. The non-admission design enables the firm to disclose the factual incident record and the remediation plan without the disclosure becoming an admission of liability.',
            },
          ],
          next: 'lbvt-ph3-aftermath',
        },
        {
          id: 'lbvt-ch2-oral-reconstruction',
          label: 'Oral reconstruction disclosure: produce a counsel-drafted narrative; claim privilege over all technical analysis; provide no underlying factual record or remediation verification',
          role: 'counsel',
          chapter: 1,
          rationale:
            'The bottleneck architecture forces an oral-reconstruction disclosure: the factual ' +
            'record was absorbed into the privileged channel, so the only production is a ' +
            'counsel-drafted narrative. This creates three risks: (1) the regulator finds the ' +
            'narrative incomplete and demands underlying documents; (2) the privilege claim is ' +
            'challenged as lacking a primary-purpose basis; (3) the missing remediation verification ' +
            'signals to the regulator that the recurrence risk is unaddressed.',
          leverDeltas: {
            privilege_strength: 0.25,
            mandatory_reporting: -0.15,
            safe_harbor_non_admission: -0.2,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            regulatory_timeliness: -30,
            evidentiary_posture: -25,
          },
          flags: ['legal_owns_record'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): in the bottleneck architecture, the regulator receives a counsel narrative that describes the incident at a level of abstraction sufficient to claim privilege but insufficient to demonstrate that root cause was understood or remediation was completed. This is the cyber minimum-compliance equilibrium applied to an AI malfunction incident.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
            {
              text: 'SR 11-7 CSI doctrine (12 CFR § 261.2; 12 U.S.C. § 1828(x)): in financial services, the CSI doctrine means the regulator\'s examination findings are protected from third-party use — the bank can be candid with the examiner without creating plaintiff-accessible admissions. Without a statutory equivalent, the AI firm\'s oral reconstruction to the regulator is not protected from use in subsequent civil proceedings.',
            },
          ],
          next: 'lbvt-ph3-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Aftermath (terminal)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'lbvt-ph3-aftermath',
      phase: 3,
      chapter: 2,
      title: 'Aftermath',
      situation:
        'The incident is closed. The engine now runs forward on the lever configuration ' +
        'your choices produced. Signal fidelity, remediation completeness, litigation pressure, ' +
        'recurrence risk, and learning yield reflect the organizational design choice you made ' +
        'at the Ch.2 pivot — bottleneck or translator.',
      choices: [],
      terminal: true,
    },
  ],
}
