/**
 * Stalled Escalation — weak-tie signal death, pure Ch.2 (Chapter 2 only).
 *
 * Scenario: an error-rate creep signal is born at the engineer level and must travel
 * through a five-hop chain (engineer → safety → legal → exec → board). At each hop
 * the signal loses fidelity via translation loss and normalization of deviance (Vaughan,
 * Perrow, Røvik). The player faces the pivotal choice at the legal/exec boundary:
 * open a formal independent-review channel (two-track) or route informally through
 * the normal management hierarchy (normalize/legal-owns-record). The board ultimately
 * sees — or does not see — a meaningful signal, and the fidelity degradation across
 * each hop is visible in the meter trajectory.
 *
 * Central trade-off (no-dominant-path): the formal independent-review channel
 * (independent_review_channel / two_track) raises effective_challenge,
 * recipient_enforcer_separation, near_miss_tier, and translation_layer, preserving
 * board_oversight_visibility but adds process friction; the informal/normalize path
 * (legal_owns_record) raises privilege_strength but drops workflow_protection,
 * effective_challenge, and causes fidelity to decay at each subsequent hop.
 *
 * failureType: malfunction (org failure); captureResistance: silent; chapters [2]
 *
 * Citations (all from dossier):
 *  - SR 11-7 + OCC Bulletin 2026-13: effective challenge, board-level governance
 *  - Vaughan (normalization of deviance), Perrow (normal accidents), Røvik
 *    (organizational translation), Hansen (strength of weak ties) — cited in text
 *  - ASRS CALLBACK (FAA AC 00-46F): fidelity-preservation feedback loop
 *  - 10 C.F.R. §§ 50.72-50.73 (NRC): mandatory escalation timelines
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const stalledEscalation: TabletopScenario = {
  id: 'stalled-escalation',
  name: 'Stalled Escalation: Weak-Tie Signal Death',
  blurb:
    'An error-rate creep signal is detected at the engineer level. It must travel ' +
    'five organizational hops to reach the board: engineer → safety team → legal → exec → board. ' +
    'At each hop, Røvik translation loss and normalization of deviance (Vaughan/Perrow) degrade the signal. ' +
    'The pivotal choice arrives at the legal/exec boundary: open a formal independent-review channel ' +
    'with translation-layer investment — or route the finding informally through the management hierarchy, ' +
    'letting legal normalize it as "within acceptable parameters." ' +
    'Board oversight visibility and recurrence risk track which path you built.',
  failureType: 'malfunction',
  captureResistance: 'silent',
  retrainCadence: 0.55,
  startLevers: {
    workflow_protection: 0.25,
    effective_challenge: 0.25,
    near_miss_tier: 0.2,
    translation_layer: 0.2,
    just_culture: 0.45,
    recipient_enforcer_separation: 0.2,
    privilege_strength: 0.35,
    original_records_boundary: 0.3,
    intermediary_capacity: 0.2,
  },
  startNodeId: 'se-ph1-engineer-detection',
  chapters: [2],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Engineer Detection (Chapter 2)
    // The signal is born. How does the engineer hand it off to the safety team?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'se-ph1-engineer-detection',
      phase: 1,
      chapter: 2,
      title: 'Hop 1 — Engineer to Safety Team: How Is the Signal Handed Off?',
      situation:
        'A senior ML engineer has noticed a creep in error rates over three deployment cycles — ' +
        'individually within the accepted variance band, but trending upward as a sequence. ' +
        'The engineer raises the finding to the safety team in the weekly technical review. ' +
        'The safety team lead must decide how to receive and record the signal: ' +
        'as a near-miss requiring structured documentation and root-cause triage, ' +
        'or as a "watch item" logged informally in the meeting notes. ' +
        'The Røvik translation-loss problem is immediate: the engineer\'s tacit sense that ' +
        '"this pattern looks wrong" can survive the crossing only if the receiving channel ' +
        'is strong enough to carry the nuance.',
      choices: [
        {
          id: 'se-ch1-structured-near-miss',
          label: 'Receive as a near-miss: open a structured near-miss report, document the error-rate trend, assign a root-cause triage task, and route through the safety-team formal review pathway',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'Treating the error-rate creep as a near-miss activates the institution\'s formal ' +
            'triage machinery. The near-miss tier (ASRS model: voluntary, non-punitive, structured) ' +
            'gives the signal a defensible written record before the next hop. ' +
            'SR 11-7\'s model risk governance framework requires that monitoring findings ' +
            'be routed to teams with effective challenge authority — the near-miss pathway ' +
            'creates that routing. OCC Bulletin 2026-13 updates this effective-challenge ' +
            'doctrine to require board-visible escalation metrics for model performance anomalies.',
          leverDeltas: {
            near_miss_tier: 0.3,
            translation_layer: 0.2,
            effective_challenge: 0.15,
            original_records_boundary: 0.15,
            just_culture: 0.1,
          },
          incidentEffects: {
            signal_fidelity: 10,
            record_capturability: 15,
            board_oversight_visibility: 5,
          },
          flags: ['state_snapshotted', 'near_miss_documented'],
          analogRefs: ['asrs-asap', 'sr11'],
          citations: [
            {
              text: 'FAA AC 00-46F (ASRS, April 2, 2021): the ASRS near-miss tier (voluntary, confidential, non-punitive) sustains ~131,000 reports/year by making the signal recording friction-free while the CALLBACK loop demonstrates that signals produce safety enhancements.',
            },
            {
              text: 'SR 11-7 (Fed. Reserve / OCC, April 4, 2011) + OCC Bulletin 2026-13 (April 2026): model risk governance requires monitoring findings to be routed to teams with effective challenge authority. Escalation must reach levels with remediation power, not only logging levels.',
            },
          ],
          next: 'se-ph2-safety-to-legal',
        },
        {
          id: 'se-ch1-watch-item',
          label: 'Log as a watch item: record the trend in the meeting notes without opening a formal near-miss report; monitor for an additional cycle before escalating',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'Logging informally preserves flexibility and avoids creating a document that ' +
            'could frame the firm as having known about a trend. But the Røvik translation ' +
            'problem strikes immediately: meeting notes are the weakest possible carrier ' +
            'for a tacit pattern-recognition finding. The signal will re-enter the next hop ' +
            'as "a watch item from last week" rather than as a structured near-miss finding. ' +
            'The normalization-of-deviance dynamic (Vaughan: small normalized deviations ' +
            'accumulate invisibly until structural failure) is precisely this pattern.',
          leverDeltas: {
            near_miss_tier: -0.15,
            translation_layer: -0.1,
            original_records_boundary: -0.1,
            privilege_strength: 0.1,
          },
          incidentEffects: {
            signal_fidelity: -10,
            record_capturability: -10,
          },
          flags: ['normalized_deviance'],
          analogRefs: ['asrs-asap', 'nuclear'],
          citations: [
            {
              text: '10 C.F.R. § 50.72 (NRC): requires prompt reporting of operational events exceeding defined thresholds. The NRC framework distinguishes a "watch item" (no required action) from a reportable event (1h/4h/8h notification) — and the failure to classify correctly at the detection stage is the most common precursor to late escalation.',
            },
            {
              text: 'FAA AC 00-46F (ASRS): the non-punitive, voluntary near-miss tier exists precisely to avoid the normalization dynamic — giving reporters a low-friction, no-blame route that does not require the reporter to be certain of severity before the signal is recorded.',
            },
            {
              text: 'Vaughan, The Challenger Launch Decision (1996) and Perrow, Normal Accidents (1984) — normalization of deviance and normal-accident theory.',
              caveat: 'Organizational-theory sources drawn from the playbook Ch.2, not the comparative safety-reporting dossier.',
            },
          ],
          next: 'se-ph2-safety-to-legal',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Safety to Legal (Chapter 2)
    // Hop 2: the signal crosses from Safety to Legal.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'se-ph2-safety-to-legal',
      phase: 2,
      chapter: 2,
      title: 'Hop 2 — Safety Team to Legal: Translation Loss at the Professional Boundary',
      situation:
        'The safety team must brief Legal on the error-rate trend before it reaches executive leadership. ' +
        'Legal needs to assess potential liability exposure. The question is HOW the brief is structured: ' +
        'as a full technical handoff (the safety team\'s documented finding, root-cause triage, and ' +
        'recommended escalation path) or as an oral briefing in which counsel summarizes the concern ' +
        'in normalized language for the executive audience. ' +
        'The Røvik translation-loss problem intensifies: Legal will translate a technical safety ' +
        'finding into a legal-risk framing, and detail that does not fit the legal-risk frame ' +
        'tends to be omitted in transit (Hansen: weak ties cannot carry tacit knowledge; ' +
        'the safety-to-legal crossing is structurally a weak tie).',
      choices: [
        {
          id: 'se-ch2-technical-handoff',
          label: 'Full technical handoff: Legal receives the structured near-miss finding and the engineering data; counsel runs a parallel exposure assessment on a summary; the safety document flows to the exec briefing separately from the legal exposure memo',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'The PSQIA model (42 U.S.C. §§ 299b-21 to 299b-26) is the template: protect the ' +
            'safety-evaluation workflow while preserving the original factual record. ' +
            'The safety finding (the factual record) flows to the exec; counsel\'s exposure ' +
            'memo (the legal analysis) flows separately. The signal arrives at the next hop ' +
            'with the technical nuance intact because it is not re-encoded into the legal ' +
            'risk frame before the crossing.',
          leverDeltas: {
            translation_layer: 0.25,
            original_records_boundary: 0.2,
            effective_challenge: 0.15,
            workflow_protection: 0.2,
            recipient_enforcer_separation: 0.15,
          },
          incidentEffects: {
            signal_fidelity: 10,
            board_oversight_visibility: 10,
          },
          flags: ['technical_record_preserved'],
          analogRefs: ['psqia', 'sr11'],
          citations: [
            {
              text: 'PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26: the Patient Safety Evaluation System route protects the analytic workflow, not the underlying factual record. The original-records exception preserves discoverability of the facts while the analysis is protected. The AI governance analog: the safety finding (factual) flows to remediation; counsel\'s exposure memo (normative) stays in the privileged channel.',
            },
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model risk governance requires independent validation with effective challenge. The validation finding must reach governance levels with genuine authority — not re-encoded into management-acceptable framing before it crosses the boundary.',
            },
          ],
          next: 'se-ph3-pivotal-choice',
        },
        {
          id: 'se-ch2-oral-brief',
          label: 'Oral briefing only: counsel briefs the executives on legal exposure; the engineering data and near-miss documentation do not cross the boundary; the exec receives a normalized summary',
          role: 'counsel',
          chapter: 2,
          rationale:
            'Counsel argues that routing everything through the legal summary minimizes the ' +
            'discoverable record. But the Langevoort gate-keeping dynamic strikes: when counsel ' +
            'controls the record, organizational incentives suppress bad news at each hop. ' +
            'The exec receives a normalized summary ("within acceptable parameters, being monitored") ' +
            'rather than the engineer\'s actual finding ("three consecutive cycles of upward drift ' +
            'that individually cleared the variance band but collectively show a trend").',
          leverDeltas: {
            privilege_strength: 0.3,
            translation_layer: -0.2,
            original_records_boundary: -0.2,
            workflow_protection: -0.15,
            effective_challenge: -0.15,
          },
          incidentEffects: {
            signal_fidelity: -15,
            board_oversight_visibility: -10,
          },
          flags: ['legal_owns_record'],
          analogRefs: ['cyber', 'sr11'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first model produces systematic bias toward summarizing incidents at a level of abstraction sufficient to claim privilege but insufficient to demonstrate that root cause was understood.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): effective challenge requires that model risk findings reach decision-makers with the granularity needed to evaluate them, not summaries pre-processed to fit the management risk appetite. The CSI doctrine (12 CFR § 261.2; 12 U.S.C. § 1828(x)) protects regulator-held examination records — a scaffold banks have and AI firms do not.',
            },
          ],
          next: 'se-ph3-pivotal-choice',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Pivotal Choice at Legal/Exec Boundary (Chapter 2)
    // The dominant structural branch: formal independent-review channel vs. informal normalize.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'se-ph3-pivotal-choice',
      phase: 3,
      chapter: 2,
      title: 'Hop 3 — Legal / Exec Boundary: Formal Independent Channel or Informal Normalization?',
      situation:
        'The signal has now crossed two boundaries and is about to enter the executive layer. ' +
        'The exec team will decide what to surface to the board. ' +
        'This is the pivotal node. ' +
        'The VP Safety is arguing for a formal independent-review channel: an ad hoc governance ' +
        'review committee that sees the original engineering data, runs an independent assessment ' +
        'against the model\'s stated performance thresholds, and reports directly to the board ' +
        'risk committee — bypassing the normal management summary process for this signal. ' +
        'General Counsel argues the opposite: route through the standard management briefing ' +
        'process; legal will ensure the framing is defensible; there is no need to create ' +
        'a formal record that escalates the apparent severity of what is, on any individual ' +
        'reading, a within-band observation.',
      choices: [
        {
          id: 'se-ch3-independent-channel',
          label: 'Open a formal independent-review channel: a governance review committee with direct board-risk-committee visibility sees the original engineering data and reports independently of the management summary chain',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'The formal independent-review channel is the AI governance analog of SR 11-7\'s ' +
            'independent validation with effective challenge: the validation team sees the full ' +
            'technical record; governance receives the finding, not a management-filtered summary. ' +
            'OCC Bulletin 2026-13 requires board-level governance to have direct access to ' +
            'model performance anomaly findings that cross defined thresholds — the channel ' +
            'is not optional decoration but a structural safeguard against the normalization-of-deviance ' +
            'dynamic that killed signals in Challenger, Columbia, and post-TMI NRC near-misses. ' +
            'The INPO/NRC dual-track (10 C.F.R. §§ 50.72-50.73 + INPO SEE-IN) shows ' +
            'that a private safety body can operate the independent channel when no regulator ' +
            'holds the formal role.',
          leverDeltas: {
            effective_challenge: 0.35,
            recipient_enforcer_separation: 0.3,
            near_miss_tier: 0.25,
            translation_layer: 0.3,
            workflow_protection: 0.35,
            safe_harbor_non_admission: 0.25,
            just_culture: 0.1,
          },
          incidentEffects: {
            signal_fidelity: 15,
            board_oversight_visibility: 30,
            remediation_completeness: 30,
            regulatory_timeliness: 20,
          },
          flags: ['independent_review_channel', 'two_track'],
          analogRefs: ['sr11', 'nuclear', 'asrs-asap'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011) + OCC Bulletin 2026-13 (April 2026): effective challenge requires that model risk findings reach governance levels with genuine authority. The update requires board-visible escalation metrics for performance anomalies — not a management summary but a direct finding with verification.',
            },
            {
              text: '10 C.F.R. §§ 50.72-50.73 (NRC): the nuclear reporting framework uses a bifurcated structure: NRC receives public Licensee Event Reports (§ 50.73) while INPO operates SEE-IN as the private learning channel. The structural separation — regulator receives the formal record; industry body runs the learning analysis — is the model for an independent-review channel that does not destroy the factual record by routing it through privilege.',
            },
            {
              text: 'FAA AC 00-46F (ASRS): the ASRS CALLBACK loop (feedback from the safety system to the original reporter) is the signal that the independent channel produced a real safety enhancement. Without feedback, the just-culture reporting culture degrades.',
            },
          ],
          next: 'se-ph4-exec-to-board',
        },
        {
          id: 'se-ch3-informal-normalize',
          label: 'Route informally: the exec receives the management summary; legal frames the finding as "within acceptable parameters, being monitored"; no independent channel is opened; the board receives the management narrative',
          role: 'counsel',
          chapter: 2,
          rationale:
            'Routing informally keeps the signal in the management summary chain. ' +
            'The normalization-of-deviance dynamic (Vaughan) is precisely the pattern of ' +
            'small, individually-acceptable deviations that accumulate invisibly because ' +
            'each one is read through the existing "within-band" frame. ' +
            'The board receives the management narrative: "error-rate monitoring in progress, ' +
            'no reportable event at this time." ' +
            'The signal\'s technical nuance — three consecutive cycles of upward drift — ' +
            'does not survive this hop. Board_oversight_visibility drops to near zero.',
          leverDeltas: {
            privilege_strength: 0.4,
            effective_challenge: -0.25,
            workflow_protection: -0.3,
            safe_harbor_non_admission: -0.3,
            translation_layer: -0.25,
            just_culture: -0.1,
          },
          incidentEffects: {
            signal_fidelity: -20,
            board_oversight_visibility: -20,
            remediation_completeness: -15,
          },
          flags: ['legal_owns_record', 'normalized_deviance'],
          analogRefs: ['nuclear', 'asrs-asap'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): the normalization-of-deviance failure mode is well-documented in model risk governance — when findings are routed through the management summary chain rather than an independent validation pathway, the "within-parameters" frame applies at each hop, and the signal is successively normalized.',
            },
            {
              text: '10 C.F.R. §§ 50.72-50.73 (NRC): post-TMI analysis found that NRC licensing staff had received multiple near-miss signals about the Three Mile Island facility design that were individually logged as "within-band" before the accident. The normalization pattern is the canonical example of signal death at the management-summary hop.',
            },
            {
              text: 'Hansen, "The Search-Transfer Problem" (1999) on tie strength, and Røvik on organizational translation loss.',
              caveat: 'Organizational-theory sources drawn from the playbook Ch.2, not the comparative safety-reporting dossier.',
            },
          ],
          next: 'se-ph4-exec-to-board',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4 — Exec to Board (Chapter 2)
    // The final hop: what the board sees.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'se-ph4-exec-to-board',
      phase: 4,
      chapter: 2,
      title: 'Hop 4/5 — Exec to Board: What Does the Board Actually See?',
      situation:
        'The executive team is preparing the board risk committee briefing. ' +
        'The signal has now crossed four organizational hops. ' +
        'The board risk committee must make a governance decision: ' +
        'how to characterize the model\'s current performance posture in the next ' +
        'quarterly risk report, and whether to commission an independent technical review ' +
        'or accept the management assurance. ' +
        'The meter trajectory is now visible: the signal_fidelity the board receives ' +
        'reflects every translation loss and normalization haircut from the four prior hops. ' +
        'Board_oversight_visibility is the output variable that determines whether the ' +
        'board can exercise meaningful governance or is ratifying a management summary.',
      choices: [
        {
          id: 'se-ch4-board-direct-visibility',
          label: 'Board direct visibility: the risk committee receives the original engineering finding (or the independent-channel report) alongside the management narrative; it can ask technically-informed questions and commission further work',
          role: 'board',
          chapter: 2,
          rationale:
            'Board direct visibility requires that the chain of custody from engineer to board ' +
            'preserved enough signal fidelity to make the board\'s governance meaningful. ' +
            'The SR 11-7 + OCC Bulletin 2026-13 model requires board-level escalation metrics ' +
            'to be based on the independent validation finding — not the management summary. ' +
            'A board that can only ratify a management narrative has no effective oversight ' +
            'function. The independent-review channel (if opened at the pivotal node) ' +
            'is the structural prerequisite for this choice.',
          leverDeltas: {
            effective_challenge: 0.2,
            recipient_enforcer_separation: 0.2,
            near_miss_tier: 0.15,
            translation_layer: 0.1,
          },
          incidentEffects: {
            board_oversight_visibility: 20,
            regulatory_timeliness: 15,
            evidentiary_posture: 10,
          },
          flags: ['board_has_visibility'],
          analogRefs: ['sr11', 'nuclear'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011) + OCC Bulletin 2026-13 (April 2026): the board or board risk committee must receive model risk governance reports based on independent validation findings. Management assurance is not a substitute for the independent finding when the anomaly crosses defined escalation thresholds.',
            },
            {
              text: '10 C.F.R. § 50.72 (NRC): the 1h/4h/8h notification framework ensures that the board-equivalent (NRC) receives time-sensitive operational signals through a formal channel that does not depend on management framing. The channel structure enforces visibility regardless of the management preference for normalization.',
            },
          ],
          next: 'se-ph5-aftermath',
        },
        {
          id: 'se-ch4-board-management-narrative',
          label: 'Board receives management narrative only: the risk committee hears the prepared executive summary; no original engineering data is provided; the board ratifies the "being monitored" framing',
          role: 'exec',
          chapter: 2,
          rationale:
            'The management summary is expedient and avoids alarming the board unnecessarily. ' +
            'But the board_oversight_visibility meter tracks what the board can actually ' +
            'governance-evaluate vs. what it is ratifying. Ratifying a "within-band, being monitored" ' +
            'narrative when the underlying signal has been degraded by four hops of translation loss ' +
            'means the board is exercising no real oversight function — it is absorbing the ' +
            'normalization-of-deviance outcome as if it were a governance decision.',
          leverDeltas: {
            privilege_strength: 0.25,
            effective_challenge: -0.2,
            recipient_enforcer_separation: -0.15,
            near_miss_tier: -0.1,
          },
          incidentEffects: {
            board_oversight_visibility: -15,
            evidentiary_posture: -10,
          },
          flags: ['board_normalized'],
          analogRefs: ['nuclear', 'sr11'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): governance failure is characterized not by absence of board meetings about model risk, but by the structural inability of the board to evaluate findings independently of the management framing — a condition the OCC has identified as the dominant failure mode in model risk incidents.',
            },
            {
              text: 'FAA AC 00-46F (ASRS): the aviation near-miss system learned that a board receiving only management summaries after safety signals had been normalized through the chain was structurally equivalent to a board that received no safety signals at all — the information content at the receiving end was indistinguishable.',
            },
          ],
          next: 'se-ph5-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5 — Aftermath (terminal)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'se-ph5-aftermath',
      phase: 5,
      chapter: 2,
      title: 'Aftermath',
      situation:
        'The escalation chain is complete. The engine now runs forward on the lever ' +
        'configuration your choices produced across four organizational hops. ' +
        'Board_oversight_visibility reflects how much of the original engineer\'s signal ' +
        'survived the translation chain. Signal_fidelity tracks the cumulative loss ' +
        'across each boundary crossing via the crossBoundary transfer function. ' +
        'Recurrence risk is highest when the board received only the normalized management ' +
        'narrative; lowest when the independent-review channel preserved fidelity to the top. ' +
        'The institution you designed is the one that will handle the next signal.',
      choices: [],
      terminal: true,
    },
  ],
}
