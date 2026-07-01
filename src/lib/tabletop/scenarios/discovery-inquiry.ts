/**
 * Discovery Inquiry — privilege architecture tested under litigation/regulatory inquiry.
 * (Chapters 1 + 3 foregrounded.)
 *
 * Scenario: months after a model malfunction caused measurable user harm, litigation
 * arrives and a regulator serves a document request. The pivotal question is the
 * earlier record-architecture choice: was the incident analysis kept on a single oral/
 * privileged track (oral, legal_owns_record) or on a two-track structure (protected
 * workflow + discoverable factual core)? The discovery pressure now tests which
 * architecture survives.
 *
 * The scenario plays the DIRECTION of the law — Capital One (privilege pierced over
 * Mandiant report), Target (two-track partially preserved), Wengui v. Clark Hill
 * (piercing trend), PSQIA original-records exception — not settled holdings. Players
 * confront the caveat directly.
 *
 * Central trade-off:
 *  - Single-track oral (privileged_single_track / legal_owns_record): high privilege_strength,
 *    low workflow_protection / safe_harbor / effective_challenge. Wins short-term perceived
 *    shield but loses evidentiary_posture and remediation completeness when written facts
 *    surface elsewhere (whistleblower, regulator's own records, plaintiff discovery).
 *  - Two-track (two_track): workflow_protection + safe_harbor_non_admission + original_records_boundary.
 *    Survives discovery because the protected channel is bounded; the factual core was
 *    always discoverable and is produced cleanly.
 *
 * failureType: malfunction; captureResistance: irreproducible; chapters [1, 3]
 *
 * Citations:
 *  - In re Capital One (E.D. Va. 2020): privilege pierced over Mandiant report
 *  - In re Target (D. Minn. 2015): two-track partially preserved on appeal
 *  - Wengui v. Clark Hill (D.D.C. 2021): continued piercing trend
 *  - PSQIA § 299b-22(c): original-records exception + drop-out mechanism
 *  Direction caveat: "play the direction of the law, not settled holdings."
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const discoveryInquiry: TabletopScenario = {
  id: 'discovery-inquiry',
  name: 'Discovery Inquiry: Privilege Architecture Under Pressure',
  blurb:
    'Months after a model malfunction, litigation and a regulatory document request arrive simultaneously. ' +
    'The pivotal question is no longer what happened — it is the record architecture your institution built ' +
    'in the hours and days after the incident. ' +
    'Did counsel run a single-track oral analysis (privileged, but fragile when written facts surface ' +
    'from other sources)? Or did the firm build a two-track structure — a protected safety-evaluation ' +
    'workflow running parallel to a discoverable factual core? ' +
    'Capital One (E.D. Va. 2020) pierced privilege over the Mandiant forensic report. ' +
    'Target (D. Minn. 2015) partially preserved the two-track. ' +
    'The direction of the law is clear; the settled holdings are not. ' +
    'You are playing an architecture decision with real evidentiary stakes.',
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
  startNodeId: 'di-ph1-architecture-choice',
  chapters: [1, 3],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Record Architecture Choice (Chapter 1)
    // The earlier incident-response design is the pivot — revealed now under discovery.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'di-ph1-architecture-choice',
      phase: 1,
      chapter: 1,
      title: 'Incident Record Architecture: The Choice That Defines Your Discovery Posture',
      situation:
        'A malfunction in a deployed model produced an irreproducible harmful output eight months ago. ' +
        'The incident was investigated internally. Now a class-action complaint has been filed and ' +
        'a consumer-protection regulator has served a broad document request: ' +
        '"All documents, communications, analyses, and reports relating to the incident, ' +
        'the model\'s performance, the investigation, and any remediation undertaken." ' +
        'The firm\'s outside counsel is reviewing what was created during the incident response. ' +
        'The key variable is the architecture decision made at the time: ' +
        'was the entire investigation routed through the attorney-client / work-product channel ' +
        '(oral analysis, vendor retained by counsel, no stand-alone factual record), ' +
        'or was a two-track structure built (a protected safety-evaluation workflow for the ' +
        'normative/fault analysis + a separate discoverable factual incident record)? ' +
        'You are playing that choice now, knowing its discovery consequences.',
      choices: [
        {
          id: 'di-ch1-two-track-architecture',
          label: 'Two-track architecture: a protected safety-evaluation workflow (counsel-directed normative analysis) runs parallel to a separately maintained discoverable factual incident record; the workflow boundary is documented and maintained',
          role: 'safety_eng',
          chapter: 1,
          rationale:
            'The two-track architecture is the PSQIA model: information developed for reporting ' +
            'through a Patient Safety Evaluation System is protected Patient Safety Work Product; ' +
            'the underlying original records (the factual incident record) remain discoverable. ' +
            'The original-records exception is the key: the firm can produce the factual record ' +
            'cleanly because it was always maintained separately. The protected channel is bounded ' +
            'and defensible because it was structured for a defined purpose from the outset. ' +
            'Target (D. Minn. 2015) partially preserved the two-track because the investigation ' +
            'had a documented structure separating the business/remediation stream from the ' +
            'litigation-anticipation stream. ' +
            'NOTE: This scenario plays the direction of the law, not settled holdings. ' +
            'The case law trend favors documented two-track structures over post-hoc privilege assertions.',
          leverDeltas: {
            workflow_protection: 0.4,
            safe_harbor_non_admission: 0.4,
            original_records_boundary: 0.35,
            translation_layer: 0.3,
            effective_challenge: 0.3,
            just_culture: 0.2,
            recipient_enforcer_separation: 0.2,
          },
          incidentEffects: {
            signal_fidelity: 20,
            record_capturability: 20,
            evidentiary_posture: 30,
            remediation_completeness: 35,
            regulatory_timeliness: 20,
            board_oversight_visibility: 15,
          },
          flags: ['two_track', 'state_snapshotted', 'pipeline_captured'],
          analogRefs: ['psqia', 'cyber', 'pharma'],
          citations: [
            {
              text: 'In re Target Corp. Customer Data Sec. Breach Litig. (D. Minn. 2015): the court partially preserved the two-track investigation structure — the portions of the Verizon forensic report primarily prepared for anticipated litigation retained work-product protection; the portions prepared for business/remediation purposes remained discoverable. The lesson: a documented two-track structure with contemporaneous records of the purpose boundary survives better than a post-hoc privilege assertion.',
              caveat:
                'This scenario plays the direction of the law, not settled holdings. The Target partial-preservation holding is jurisdiction-specific and fact-intensive; consult current case law before making privilege architecture decisions.',
            },
            {
              text: 'PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26: the original-records exception is the structural safeguard of the two-track design — the underlying patient records (the factual core) remain discoverable while the PSES workflow analysis is protected. Maintaining the factual incident record outside the protected channel is not a weakness; it is what makes the protection of the workflow defensible.',
            },
            {
              text: 'HHS Guidance, 81 Fed. Reg. 32655 (May 24, 2016): the segregation requirement — that information developed for reporting through the PSES be maintained separately from operational records — is the procedural mechanism that makes the PSQIA protection work. Without documented segregation, the protection does not attach.',
            },
          ],
          next: 'di-ph2-document-review',
        },
        {
          id: 'di-ch1-oral-single-track',
          label: 'Single-track oral analysis: counsel directed the entire investigation; the vendor (forensic firm) was retained by counsel; no stand-alone factual incident record was created outside the privileged channel; all findings are oral or in counsel-directed documents',
          role: 'counsel',
          chapter: 1,
          rationale:
            'The single-track oral analysis is the cyber-pattern approach (Schwarcz, Wolff & Woods 2023): ' +
            'the forensic vendor is retained by counsel; reports are structured as attorney work product; ' +
            'no factual incident record exists outside the privileged channel. ' +
            'The Capital One court pierced this structure: the Mandiant report was "prepared because ' +
            'of the data breach" (not primarily for litigation), and Capital One\'s attempt to shield ' +
            'the investigation under attorney-client privilege failed because it could not show the ' +
            'report was "primarily prepared in anticipation of litigation." ' +
            'The oral approach avoids creating a discoverable document but loses remediation ' +
            'completeness, signal fidelity, and evidentiary posture when written facts surface ' +
            'from other sources (regulatory records, whistleblowers, plaintiff\'s own evidence).',
          leverDeltas: {
            privilege_strength: 0.45,
            workflow_protection: -0.3,
            safe_harbor_non_admission: -0.35,
            original_records_boundary: -0.3,
            effective_challenge: -0.25,
            translation_layer: -0.2,
          },
          incidentEffects: {
            signal_fidelity: -20,
            record_capturability: -20,
            evidentiary_posture: -20,
            remediation_completeness: -20,
          },
          flags: ['legal_owns_record', 'privileged_single_track'],
          analogRefs: ['cyber', 'psqia'],
          citations: [
            {
              text: 'In re Capital One Financial Corp. Customer Data Security Breach Litigation (E.D. Va. 2020): the court held that the Mandiant forensic report was not protected by attorney-client privilege or work product doctrine because (1) Mandiant was retained before litigation was anticipated, (2) the report served a business purpose (understanding the breach), and (3) Capital One could not demonstrate the report was "primarily prepared in anticipation of litigation." The case is a direct warning against the single-track oral model that routes everything through counsel without maintaining a documented two-track structure.',
              caveat:
                'This scenario plays the direction of the law, not settled holdings. Capital One is a district-court decision; the primary-purpose test is circuit-specific and fact-intensive.',
            },
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first model — forensic vendor retained by counsel, no stand-alone written report — has become the dominant incident-response pattern after Capital One drove firms toward the no-report model. The cost is that the institution has no documented factual basis for its remediation and cannot demonstrate to regulators or courts that root cause was understood.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'di-ph2-document-review',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Document Review (Chapter 3)
    // The regulator/plaintiff's document request reveals which architecture survives.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'di-ph2-document-review',
      phase: 2,
      chapter: 3,
      title: 'Document Review: Which Architecture Survives the Request?',
      situation:
        'Outside counsel has completed the privilege review of all documents created during ' +
        'the incident response. The picture is now clear. ' +
        'Under the two-track architecture: the factual incident record is identified, is ' +
        'producible without privilege claim, and demonstrates a documented remediation. ' +
        'The protected safety-evaluation workflow analysis is separately maintained and ' +
        'can be described in bounded terms on a privilege log. ' +
        'Under the single-track oral architecture: the only available productions are ' +
        'the vendor\'s engagement letter (retained by counsel), a handful of email threads ' +
        'with privilege claims, and the remediation deployment records. ' +
        'There is no stand-alone factual root-cause analysis to produce — ' +
        'and the plaintiff\'s counsel has subpoenaed the vendor directly, arguing the ' +
        'vendor\'s underlying work was not primarily prepared for litigation ' +
        '(citing Capital One). ' +
        'The regulator is asking for the incident\'s root-cause analysis and remediation log. ' +
        'You must decide how to respond.',
      choices: [
        {
          id: 'di-ch2-grounded-production',
          label: 'Grounded production: produce the factual incident record with a non-admission cover letter; provide the privilege log for the protected channel; attach the remediation verification; demonstrate root cause was understood and addressed',
          role: 'policy',
          chapter: 3,
          rationale:
            'The two-track architecture makes this response straightforward: the factual record ' +
            'is produced because it was always maintained as discoverable; the protected channel ' +
            'is described in the privilege log with sufficient specificity to sustain the claim. ' +
            'The pharma FAERS model shows that mandatory disclosure coexists with non-admission ' +
            'framing when the institutional design treats reports as safety signals. ' +
            'PSQIA\'s original-records exception is directly analogous: the firm produces ' +
            'the factual record (which was never in the protected channel) and describes ' +
            'the protected analysis (which was) on the privilege log.',
          leverDeltas: {
            mandatory_reporting: 0.25,
            safe_harbor_non_admission: 0.2,
            just_culture: 0.1,
            recipient_enforcer_separation: 0.1,
          },
          incidentEffects: {
            regulatory_timeliness: 30,
            evidentiary_posture: 25,
            board_oversight_visibility: 10,
          },
          flags: ['voluntary_disclosure'],
          analogRefs: ['psqia', 'pharma', 'cyber'],
          citations: [
            {
              text: 'PSQIA § 299b-22(c), 42 U.S.C.: the drop-out mechanism allows a provider to remove information from Patient Safety Work Product status before reporting — preserving the ability to produce the factual core under discovery while maintaining protection for the workflow analysis. The original-records exception is the structural guarantee that the factual core was never protected and can be produced cleanly.',
              caveat:
                'This scenario plays the direction of the law, not settled holdings. PSQIA\'s applicability to AI firms requires statutory or regulatory action that has not yet occurred.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): adverse-event reports are safety signals, not admissions of fault. The non-admission design has sustained mandatory reporting across decades of toxic tort litigation by allowing firms to disclose factual incident data without the disclosure becoming an admission of liability.',
            },
          ],
          next: 'di-ph3-aftermath',
        },
        {
          id: 'di-ch2-privilege-assertion',
          label: 'Broad privilege assertion: claim attorney-client privilege and work-product protection over all incident analysis; produce only the remediation deployment records; challenge the vendor subpoena',
          role: 'counsel',
          chapter: 3,
          rationale:
            'The broad privilege assertion is the instinctive response under the single-track oral ' +
            'architecture — but it is the posture Capital One, Target, Wengui, and the piercing ' +
            'trend all caution against. The three risks are: (1) the primary-purpose test fails ' +
            'because the investigation was not primarily prepared in anticipation of litigation; ' +
            '(2) the regulator finds the privilege log insufficient and files a motion to compel; ' +
            '(3) the plaintiff\'s vendor subpoena surfaces the underlying forensic work, showing ' +
            'the firm\'s broad privilege assertion was not accurate. ' +
            'Without a factual incident record to produce, the firm cannot demonstrate that ' +
            'root cause was understood or remediation was completed — the recurrence risk ' +
            'narrative is entirely in the regulator\'s control.',
          leverDeltas: {
            privilege_strength: 0.3,
            mandatory_reporting: -0.2,
            safe_harbor_non_admission: -0.2,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            regulatory_timeliness: -30,
            evidentiary_posture: -30,
          },
          flags: ['legal_owns_record'],
          analogRefs: ['cyber', 'psqia'],
          citations: [
            {
              text: 'In re Capital One Financial Corp. Customer Data Security Breach Litigation (E.D. Va. 2020): Capital One\'s broad privilege assertion over the Mandiant forensic report failed because the court found the report was not primarily prepared in anticipation of litigation. The primary-purpose test is the governing standard in most circuits; a broad privilege claim without a documented litigation-anticipation purpose collapses under it.',
              caveat:
                'This scenario plays the direction of the law, not settled holdings. Capital One is a district-court decision; outcomes vary by circuit, judge, and specific facts.',
            },
            {
              text: 'Wengui v. Clark Hill, PLC (D.D.C. 2021): the court compelled production of a cybersecurity forensic report despite the firm\'s privilege claim, finding that the primary purpose of the investigation was business remediation, not litigation preparation. The Wengui-Capital One trend confirms that the single-track oral architecture\'s privilege claim is fragile when written forensic work exists in any form.',
              caveat:
                'This scenario plays the direction of the law, not settled holdings. The Wengui-Capital One trend describes a directional shift, not a uniform rule.',
            },
          ],
          next: 'di-ph3-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Aftermath (terminal)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'di-ph3-aftermath',
      phase: 3,
      chapter: 3,
      title: 'Aftermath',
      situation:
        'The discovery exchange is complete. The engine now runs forward on the lever ' +
        'configuration your choices produced. Evidentiary posture, remediation completeness, ' +
        'regulatory timeliness, and recurrence risk reflect the record architecture your ' +
        'institution built — or failed to build — in the days after the original incident. ' +
        'The architecture decision (two-track vs. single-track oral) was made eight months ago; ' +
        'the discovery pressure revealed which one survives.',
      choices: [],
      terminal: true,
    },
  ],
}
