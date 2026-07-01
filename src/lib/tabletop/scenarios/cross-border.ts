/**
 * Cross-Border — EU AI Act Art. 73 vs US posture.
 * (Chapters 1 + 3 foregrounded.)
 *
 * Scenario: a serious incident occurs in a model deployed across EU and US jurisdictions.
 * Conflicting disclosure windows and liability postures create a mandatory sequencing
 * problem. The pivotal choice is whether to file immediately under the mandatory-reporting
 * posture (satisfying EU Art. 73 timeline but creating PLD adverse-inference risk with no
 * privilege scaffold) or to structure the disclosure using a two-track + non-admission
 * framing (meeting timelines while protecting the analytic channel).
 *
 * Timelines in play:
 *  - EU AI Act Art. 73: 15-day default; 2-day for critical infrastructure; 10-day for death
 *  - SEC Item 1.05 8-K: 4 business days (17 CFR § 229.106)
 *  - California SB 53: 15-day to Cal OES; 24h for imminent danger (eff. Jan 1, 2026)
 *  - EU PLD Arts. 9-10 (Dir. (EU) 2024/2853): disclosure obligation + adverse-inference
 *    presumption; no privilege scaffold in EU
 *
 * Central trade-off:
 *  - Mandatory-file-without-protection (legal_owns_record): raises mandatory_reporting,
 *    raises pld_penalty, low safe_harbor. Wins compliance-clock satisfaction but creates
 *    adverse-inference exposure under PLD and no factual record defense.
 *  - Two-track + non-admission framing (two_track): raises safe_harbor_non_admission,
 *    workflow_protection, original_records_boundary. Meets timelines with a structured
 *    disclosure that limits PLD adverse-inference exposure.
 *
 * All EU AI Act article numbers carry the pin-cite caveat.
 * PLD Arts. 9-10 carry the pin-cite caveat.
 * Cyber ~95% figure carries the estimate caveat.
 *
 * failureType: malfunction (cross-border); captureResistance: distributional; chapters [1, 3]
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const crossBorder: TabletopScenario = {
  id: 'cross-border',
  name: 'Cross-Border: EU AI Act Art. 73 vs US Disclosure Posture',
  blurb:
    'A serious incident occurs in a model deployed across EU and US jurisdictions simultaneously. ' +
    'Three disclosure clocks start: EU AI Act Art. 73 (15-day default; 2-day critical infrastructure; 10-day death); ' +
    'SEC Item 1.05 8-K (4 business days); California SB 53 (15-day to Cal OES; 24h imminent danger). ' +
    'The EU offers no privilege scaffold — PLD Arts. 9-10 create a disclosure obligation plus ' +
    'an adverse-inference presumption when documentation is incomplete. ' +
    'Your pivotal choice: file immediately under the mandatory-reporting posture ' +
    '(meeting the clock, but with no protection for the analytic channel) ' +
    'or structure a two-track + non-admission disclosure that satisfies the timelines ' +
    'while limiting PLD adverse-inference exposure. ' +
    'EU citation numbers carry a pin-cite verification caveat.',
  failureType: 'malfunction',
  captureResistance: 'distributional',
  retrainCadence: 0.45,
  startLevers: {
    mandatory_reporting: 0.35,
    workflow_protection: 0.25,
    safe_harbor_non_admission: 0.2,
    privilege_strength: 0.35,
    original_records_boundary: 0.3,
    effective_challenge: 0.3,
    just_culture: 0.45,
    pld_penalty: 0.4,
    translation_layer: 0.25,
    recipient_enforcer_separation: 0.2,
  },
  startNodeId: 'cb-ph1-incident-triage',
  chapters: [1, 3],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Incident Triage and Disclosure Architecture (Chapter 1)
    // The clocks are running. Which jurisdiction is optimized and how?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'cb-ph1-incident-triage',
      phase: 1,
      chapter: 1,
      title: 'Cross-Border Incident: Three Clocks, Two Frameworks, One Architecture Choice',
      situation:
        'At 08:00 CET on a Tuesday, a serious incident is confirmed in a deployed model used by ' +
        'both EU and US users: the model produced harmful outputs across a distributional shift ' +
        'in user inputs that the monitoring system flagged as anomalous at hour six. ' +
        'Three disclosure clocks start simultaneously: ' +
        '(1) EU AI Act Art. 73 — 15-day default for serious incidents, 2-day for critical infrastructure, ' +
        '10-day if death or serious harm is confirmed (Reg. (EU) 2024/1689); ' +
        '(2) SEC Item 1.05 8-K — 4 business days if the incident is material to a public company ' +
        '(17 CFR § 229.106); ' +
        '(3) California SB 53 — 15-day reporting to Cal OES; 24h for imminent danger (eff. Jan 1, 2026). ' +
        'The EU framework has no privilege scaffold: PLD Arts. 9-10 (Dir. (EU) 2024/2853) create ' +
        'a disclosure obligation and an adverse-inference presumption when documentation is ' +
        '"excessively difficult" to obtain — a standard that may be triggered by any analytical ' +
        'record that exists and is withheld. ' +
        'The US side has attorney-client / work-product options, but the Capital One / Target / Wengui ' +
        'trend means those options are fragile for forensic analysis. ' +
        'How does the firm structure the disclosure architecture?',
      choices: [
        {
          id: 'cb-ch1-two-track-non-admission',
          label: 'Two-track + non-admission framing: file a structured factual disclosure on all three clocks within their windows; maintain a separate protected analytic channel; use pharma FAERS non-admission framing to limit PLD adverse-inference exposure',
          role: 'policy',
          chapter: 1,
          rationale:
            'The two-track architecture meets all three clocks with a structured factual disclosure ' +
            '(the discoverable factual core) while maintaining a separate protected analytic channel ' +
            '(the remediation/root-cause analysis). ' +
            'The non-admission framing — modeled on FAERS adverse-event reporting ' +
            '(21 CFR §§ 314.80(k), 803.16) — frames the disclosure as a safety signal, not a ' +
            'fault admission, which limits PLD Arts. 9-10 adverse-inference exposure. ' +
            'The EU AI Act Art. 73 disclosure obligation is satisfied by the factual-core filing; ' +
            'the protected channel is maintained separately and described on the filing as ' +
            '"additional remediation analysis ongoing." ' +
            'California SB 53\'s 15-day window is satisfied by the same factual-core filing. ' +
            'The SEC 8-K (if material) is filed within 4 business days with the factual disclosure ' +
            'and a remediation status note. The key: no clock is missed; no admission is made; ' +
            'the analytic channel is structurally separated from the disclosure.',
          leverDeltas: {
            workflow_protection: 0.4,
            safe_harbor_non_admission: 0.4,
            original_records_boundary: 0.35,
            translation_layer: 0.3,
            effective_challenge: 0.3,
            recipient_enforcer_separation: 0.2,
            mandatory_reporting: 0.2,
            just_culture: 0.15,
          },
          incidentEffects: {
            signal_fidelity: 15,
            record_capturability: 15,
            regulatory_timeliness: 30,
            evidentiary_posture: 30,
            remediation_completeness: 35,
            board_oversight_visibility: 20,
          },
          flags: ['two_track', 'state_snapshotted'],
          analogRefs: ['pharma', 'cyber', 'eu-ai'],
          citations: [
            {
              text: 'EU AI Act Art. 73, Reg. (EU) 2024/1689: serious-incident reporting with 15-day default clock (2-day for critical infrastructure; 10-day for death or serious harm). The obligation runs to the national market surveillance authority. There is no EU privilege scaffold for the underlying analytic record — filing the factual-core disclosure satisfies Art. 73 without requiring the analytic channel to be produced.',
              caveat:
                'Article numbers and effective dates for the EU AI Act should be pin-cite verified before external circulation. The Commission Draft Guidance (Sept 26, 2025, consultation closed Nov 7) may affect interpretation of Art. 73 timelines and content requirements.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): adverse-event reports are safety signals, not admissions of fault. The non-admission design has sustained mandatory reporting across decades of toxic tort litigation and is directly applicable to the EU filing — frame the Art. 73 report as a safety signal with a remediation plan, not as an admission that the model was defective.',
            },
            {
              text: '17 CFR § 229.106 (SEC Item 1.05 8-K, effective July 2023): material cybersecurity incidents must be disclosed within 4 business days of a materiality determination. The determination is management\'s, not regulators\'; a structured factual disclosure filed simultaneously with the EU Art. 73 filing satisfies the 8-K clock for dual-listed firms.',
            },
            {
              text: 'California SB 53 (signed Sept 29, 2025; effective Jan 1, 2026): 15-day reporting to Cal OES for covered AI developers (10^26 FLOP threshold); 24h for imminent danger. The Cal OES filing requirement runs separately from the EU Art. 73 filing; the same factual-core disclosure, adapted for the Cal OES format, satisfies both.',
            },
          ],
          next: 'cb-ph2-pld-exposure',
        },
        {
          id: 'cb-ch1-mandatory-bare-file',
          label: 'Mandatory bare file: file the minimum required by each clock; route all analytic work through counsel; assert privilege over the root-cause analysis; no non-admission framing; no separate factual-core document',
          role: 'counsel',
          chapter: 1,
          rationale:
            'The bare-file approach satisfies the literal clock requirements but creates three structural risks: ' +
            '(1) PLD Arts. 9-10 adverse-inference: the EU framework has no privilege scaffold; ' +
            'withholding the analytic record triggers the "excessively difficult" presumption — ' +
            'the court may presume the analytic record confirms defect if it is not produced; ' +
            '(2) the factual-core gap: without a documented factual incident record, the firm ' +
            'cannot demonstrate to EU regulators or plaintiffs that root cause was understood ' +
            'or remediation was completed; ' +
            '(3) the privilege claim is fragile under Capital One / Target / Wengui in the US ' +
            'proceedings, which run concurrently. ' +
            'The bare-file approach prioritizes the short-term legal shield over the structural ' +
            'integrity of the disclosure posture.',
          leverDeltas: {
            privilege_strength: 0.4,
            pld_penalty: 0.3,
            mandatory_reporting: 0.1,
            workflow_protection: -0.25,
            safe_harbor_non_admission: -0.3,
            original_records_boundary: -0.25,
            effective_challenge: -0.2,
            translation_layer: -0.15,
          },
          incidentEffects: {
            signal_fidelity: -15,
            record_capturability: -15,
            evidentiary_posture: -20,
            remediation_completeness: -20,
            regulatory_timeliness: 10,
          },
          flags: ['legal_owns_record'],
          analogRefs: ['cyber', 'eu-ai'],
          citations: [
            {
              text: 'EU AI Act Art. 73, Reg. (EU) 2024/1689: the bare-file minimum satisfies the notification timing requirement but does not satisfy the content requirement for demonstrating that the provider "took appropriate measures." Without a documented factual incident record and remediation plan, the Art. 73 filing is procedurally complete but substantively inadequate.',
              caveat:
                'Article numbers and effective dates for the EU AI Act should be pin-cite verified before external circulation. The Commission Draft Guidance (Sept 26, 2025) may affect content requirements.',
            },
            {
              text: 'PLD Arts. 9-10, Dir. (EU) 2024/2853: the disclosure obligation (Art. 9) and the adverse-inference presumption for "excessively difficult" access to technical documentation (Art. 10(4)) create a structural trap: withholding the analytic record triggers the presumption; producing it without protection creates the admission. The EU has no privilege scaffold to resolve this tension.',
              caveat:
                'PLD directive article numbers and the "excessive difficulties" standard (Art. 10(4)) should be pin-cite verified before external circulation. The AI Liability Directive was withdrawn (OJ notice C/2025/5423, Oct 6, 2025), leaving the PLD as the primary EU civil liability mechanism.',
            },
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first bare-file model produces the minimum-compliance equilibrium — the firm satisfies the notification clock without creating any analytic record that demonstrates root cause was understood. Applied to the EU context, this approach maximizes PLD adverse-inference exposure because the "excessively difficult" standard is triggered by the absence of a documented record.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'cb-ph2-pld-exposure',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — PLD Exposure and Cross-Border Remediation (Chapter 3)
    // EU plaintiffs invoke PLD; US proceedings run concurrently; remediation is tested.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'cb-ph2-pld-exposure',
      phase: 2,
      chapter: 3,
      title: 'PLD Adverse-Inference Exposure: EU Plaintiffs and the Documentation Gap',
      situation:
        'Three months after the incident, EU-based plaintiffs have filed under the Product Liability ' +
        'Directive (Dir. (EU) 2024/2853). They invoke Art. 9 (disclosure obligation) and Art. 10(4) ' +
        '(adverse-inference presumption for technical complexity / "excessive difficulties"). ' +
        'The EU court has asked the firm to produce its incident analysis, root-cause finding, ' +
        'and remediation record. ' +
        'Simultaneously, the US class-action is in discovery. ' +
        'The EU proceeding has no privilege scaffold: there is no PSQIA-equivalent, ' +
        'no CSI doctrine, no CIRCIA § 681e protection (final rule not yet issued as of 2026). ' +
        'The two architectures diverge sharply: ' +
        'the two-track firm has a bounded, producible factual record and a defined protected ' +
        'channel it can describe in its EU submission; ' +
        'the bare-file firm has only the minimum notification and a privilege assertion ' +
        'that may not survive the PLD disclosure obligation.',
      choices: [
        {
          id: 'cb-ch2-structured-eu-production',
          label: 'Structured EU production: produce the factual incident record and remediation log under the PLD Art. 9 disclosure obligation; describe the protected analytic channel in bounded terms; use non-admission framing throughout; demonstrate remediation was completed',
          role: 'policy',
          chapter: 3,
          rationale:
            'The two-track architecture makes this response possible: the factual record is producible ' +
            '(it was always the discoverable core); the protected channel is described in bounded terms. ' +
            'Demonstrating that remediation was completed is the key defense against the Art. 10(4) ' +
            '"excessive difficulties" presumption: the presumption applies when the plaintiff cannot ' +
            'access the technical evidence needed to establish defect and damage — producing the ' +
            'factual record and remediation documentation removes the factual basis for the presumption. ' +
            'The pharma model shows that producing factual incident data with non-admission framing ' +
            'has been a stable litigation posture across decades. ' +
            'The CIRCIA § 681e civil-liability bar model is the closest statutory analog, but the ' +
            'final rule has not yet been issued as of 2026.',
          leverDeltas: {
            mandatory_reporting: 0.25,
            safe_harbor_non_admission: 0.2,
            just_culture: 0.1,
            recipient_enforcer_separation: 0.1,
            pld_penalty: -0.25,
          },
          incidentEffects: {
            regulatory_timeliness: 25,
            evidentiary_posture: 25,
            board_oversight_visibility: 10,
          },
          flags: ['voluntary_disclosure'],
          analogRefs: ['pharma', 'eu-ai', 'cyber'],
          citations: [
            {
              text: 'PLD Arts. 9-10, Dir. (EU) 2024/2853: the Art. 9 disclosure obligation requires defendants to disclose "relevant evidence" in their control that is "necessary and proportionate" for the plaintiff to establish liability. Art. 10(4) creates the adverse-inference presumption for situations where "technical or scientific complexity" makes access to evidence "excessively difficult." Producing the factual incident record and remediation log addresses both provisions without waiving any claim over the protected analytic channel.',
              caveat:
                'PLD Arts. 9-10 (Dir. (EU) 2024/2853) article numbers and the adverse-inference standard should be pin-cite verified before external circulation. The AI Liability Directive was withdrawn (OJ C/2025/5423, Oct 6, 2025); the PLD is the operative EU civil liability mechanism.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): adverse-event reports frame safety incidents as signals requiring remediation, not admissions of liability. This framing has sustained mandatory disclosure across decades of EU and US litigation. The same framing — incident as safety signal, disclosure as remediation evidence — is the optimal posture for the PLD Art. 9 production.',
            },
            {
              text: 'CIRCIA § 681e (6 U.S.C. §§ 681-681g): the most robust US civil-liability bar for cyber incident reports — protects covered reports from use in private civil litigation, FOIA disclosure, and agency enforcement. The final rule has not yet been issued as of 2026 (May 2026 target slipped), so this protection is not currently operative for AI incident reports.',
            },
          ],
          next: 'cb-ph3-aftermath',
        },
        {
          id: 'cb-ch2-privilege-challenge-eu',
          label: 'Challenge the PLD disclosure obligation: assert that the analytic record is protected by attorney-client privilege under the law of the governing US proceedings; contest the EU court\'s authority to require production of US-privileged documents',
          role: 'counsel',
          chapter: 3,
          rationale:
            'The cross-jurisdictional privilege challenge is the only available defense for the ' +
            'bare-file firm — there is no EU privilege scaffold to rely on. ' +
            'But the structural problem is that the PLD Art. 9 disclosure obligation runs under ' +
            'EU law; the EU court applies EU law; there is no harmonized EU attorney-client ' +
            'privilege doctrine for corporate internal investigations. ' +
            'The AM & S / Akzo Nobel line establishes limited protection for in-house communications ' +
            'with external counsel, but does not protect internal root-cause analysis. ' +
            'The challenge creates delay and signals to the court that the firm\'s documentation ' +
            'is incomplete — which is precisely the factual predicate for the Art. 10(4) ' +
            'adverse-inference presumption. ' +
            'The bare-file architecture has no factual record to produce in lieu of the privileged ' +
            'analysis — so the challenge, if it fails, leaves the firm with no alternative.',
          leverDeltas: {
            privilege_strength: 0.3,
            pld_penalty: 0.25,
            mandatory_reporting: -0.15,
            safe_harbor_non_admission: -0.2,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            regulatory_timeliness: -25,
            evidentiary_posture: -25,
          },
          flags: ['legal_owns_record'],
          analogRefs: ['cyber', 'eu-ai'],
          citations: [
            {
              text: 'PLD Arts. 9-10, Dir. (EU) 2024/2853: the "excessive difficulties" standard is met by the absence of accessible technical documentation — not only by active concealment. A firm that structured its investigation to minimize written records under the cyber-pattern model has created the factual predicate for the Art. 10(4) adverse-inference presumption even without any intentional misconduct.',
              caveat:
                'PLD Arts. 9-10 article numbers and the adverse-inference standard should be pin-cite verified before external circulation.',
            },
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first pattern produces a minimum-compliance equilibrium that is uniquely fragile under EU law because the PLD has no safe-harbor analog and no privilege scaffold. The bare-file model that worked (partly) in US proceedings under the Capital One-era minimum-compliance framing is directly incompatible with the PLD adverse-inference mechanism.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
            {
              text: 'EU AI Act Art. 73, Reg. (EU) 2024/1689: the Art. 73 notification is a floor, not a safe harbor. Filing the minimum notification does not satisfy the Art. 73 content requirement to demonstrate that "appropriate measures" were taken — and the PLD Art. 9 obligation is independent of and additive to the Art. 73 notification.',
              caveat:
                'EU AI Act Art. 73 article numbers should be pin-cite verified before external circulation.',
            },
          ],
          next: 'cb-ph3-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Aftermath (terminal)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'cb-ph3-aftermath',
      phase: 3,
      chapter: 3,
      title: 'Aftermath',
      situation:
        'The cross-border disclosure cycle is complete. The engine now runs forward on the ' +
        'lever configuration your choices produced. Evidentiary posture and regulatory timeliness ' +
        'reflect whether the firm\'s disclosure architecture satisfied the competing cross-border ' +
        'windows without creating PLD adverse-inference exposure. ' +
        'Recurrence risk is highest when the analytic record is structurally absent and remediation ' +
        'cannot be demonstrated; lowest when the two-track architecture produced a verifiable ' +
        'remediation log across both jurisdictions. ' +
        'The EU has no privilege scaffold. The institution you built is the one that will handle ' +
        'the next incident across both sides of the Atlantic.',
      choices: [],
      terminal: true,
    },
  ],
}
