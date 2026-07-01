/**
 * Malfunction-near-miss tabletop scenario (Chapters 4 + 2 foregrounded).
 *
 * Scenario: a harmful output is caught internally — a near-miss that never reaches
 * the customer. The failure falls within the expected error-rate band and could be
 * dismissed as "normal variation." The signal can die at any organizational boundary
 * through normalization of deviance.
 *
 * Central trade-off: route through Legal to suppress the weak signal (protecting the
 * record, keeping analysis oral) vs. capture it through a formal near-miss tier and
 * two-track safety workflow (PSQIA/ASRS analog). The oral/protect branch wins short-term
 * legal safety but accumulates normalization of deviance; the two-track branch wins
 * learning yield and lowers recurrence risk.
 *
 * failureType: malfunction; captureResistance: silent; chapters [4, 2]
 *
 * Citation sourcing:
 *  - REGIME_MATRIX ids: asrs-asap, pharma, sr11, nuclear
 *  - FAA AC 00-46F (ASRS near-miss tier, ~131k reports/yr)
 *  - FAA AC 120-66C (ASAP Big Five; Big-Five exclusions)
 *  - PSQIA / HHS 81 Fed. Reg. 32655 (42 CFR Part 3; Common Formats)
 *  - SR 11-7 monitoring thresholds
 *  - FAERS signal detection (21 CFR §§ 314.80(k), 803.16)
 */
import type { TabletopScenario } from '../../../engine/tabletop'

export const malfunctionNearMiss: TabletopScenario = {
  id: 'malfunction-near-miss',
  name: 'Malfunction Near-Miss: Silent Failure Caught Internally',
  blurb:
    'A harmful model output was caught by an internal reviewer before reaching a customer. ' +
    'The failure is within the normal error-rate band and could be dismissed as "expected variation." ' +
    'You decide whether to classify it as a near-miss, how to capture the signal, and whether ' +
    'to build a two-track review or route everything through counsel to keep analysis off the record.',
  failureType: 'malfunction',
  captureResistance: 'silent',
  retrainCadence: 0.65,
  startLevers: {
    near_miss_tier: 0.25,
    workflow_protection: 0.3,
    safe_harbor_non_admission: 0.3,
    privilege_strength: 0.35,
    original_records_boundary: 0.35,
    effective_challenge: 0.35,
    just_culture: 0.4,
  },
  startNodeId: 'nmm-ph1-detection',
  chapters: [4, 2],
  nodes: [
    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 — Detection (Chapter 4)
    // The signal surfaces. Does it register as something worth capturing?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'nmm-ph1-detection',
      phase: 1,
      chapter: 4,
      title: 'Internal Detection: Near-Miss Signal',
      situation:
        'An internal quality reviewer flags a model output that would have been harmful if sent to a customer. ' +
        'The output was caught by the review layer and never reached anyone externally. ' +
        'The signal classification team notes: the failure rate is 0.12% — within the "expected variation" band ' +
        'established at deployment. A Slack thread proposes marking it "reviewed, no escalation needed." ' +
        'You must decide how to treat this detection.',
      choices: [
        {
          id: 'nmm-ch1-near-miss-tier',
          label: 'Classify as a near-miss; route to the voluntary near-miss reporting tier with full state capture',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'Treating the event as a near-miss — rather than "normal variation" — triggers the voluntary ' +
            'reporting tier, captures the model state, and begins the signal-fidelity chain. ' +
            'Aviation ASRS and EU Reg. 376/2014 both show that the near-miss tier is where safety learning ' +
            'accumulates; it is the first choke-point in normalization of deviance.',
          leverDeltas: {
            near_miss_tier: 0.35,
            original_records_boundary: 0.2,
            just_culture: 0.15,
            mandatory_reporting: 0.1,
          },
          incidentEffects: {
            record_capturability: 25,
            signal_fidelity: 15,
            regulatory_timeliness: 10,
          },
          flags: ['near_miss_classified', 'state_snapshotted', 'pipeline_captured'],
          analogRefs: ['asrs-asap', 'pharma'],
          citations: [
            {
              text: 'FAA AC 00-46F (April 2, 2021): ASRS receives ~131,000 voluntary near-miss reports per year. The system attributes this volume to confidentiality, non-punitiveness, and separation of the listener (NASA) from the enforcer (FAA).',
            },
            {
              text: 'PSQIA Common Formats (HHS 81 Fed. Reg. 32655, May 2016; 42 CFR Part 3): define a near-miss as an event that could have caused harm but did not. Capture is required to trigger Patient Safety Work Product protection.',
            },
            {
              text: 'EU Reg. 376/2014 Art. 16(10): codifies the just-culture line excluding wilful misconduct; near-miss reporting is mandatory for aviation and voluntary for hazards under Art. 5-6.',
            },
          ],
          next: 'nmm-ph2-signal-routing',
        },
        {
          id: 'nmm-ch1-normalize',
          label: 'Mark as reviewed; log as expected variation; no near-miss classification',
          role: 'counsel',
          chapter: 4,
          rationale:
            'Keeping the event inside the "expected variation" band avoids creating a formal near-miss record ' +
            'that could later be used to show pattern knowledge. ' +
            'This is the normalization-of-deviance move: a deliberate decision not to let the signal register. ' +
            'It wins short-term legal safety but destroys the near-miss learning tier.',
          leverDeltas: {
            privilege_strength: 0.2,
            near_miss_tier: -0.2,
            original_records_boundary: -0.15,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            record_capturability: -20,
            signal_fidelity: -15,
            regulatory_timeliness: -5,
          },
          flags: ['normalized_deviance'],
          analogRefs: ['cyber', 'pharma'],
          citations: [
            {
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first equilibrium — keeping root-cause analysis off the record to minimize discoverable knowledge — is the exact pattern near-miss suppression replicates in AI.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS/MAUDE): pharma mandatory adverse-event reporting extends to signals that might indicate a safety problem; under-reporting is a criminal violation (Park doctrine). The AI near-miss suppression decision is the inverse of this design.',
            },
          ],
          next: 'nmm-ph2-signal-routing',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 — Signal Routing (Chapter 4)
    // How does the signal travel through the organization?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'nmm-ph2-signal-routing',
      phase: 2,
      chapter: 4,
      title: 'Signal Routing: Capture and Documentation',
      situation:
        'Regardless of classification, the detection must now move through the organization. ' +
        'The safety engineer has a 24-hour window before the model is retrained (weekly cadence). ' +
        'After retraining, reproducing the exact failure state becomes extremely difficult. ' +
        'You must decide how much to capture before the window closes.',
      choices: [
        {
          id: 'nmm-ch2-full-capture',
          label: 'Full capture: snapshot model weights, pipeline config, and the flagged input/output pair',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'Full state capture before retraining is the SR 11-7 model-documentation discipline applied to a near-miss. ' +
            'Without it, the signal is irreproducible and the near-miss tier produces no usable artifact. ' +
            'The ASRS model survives because NASA actually receives and processes the report before it degrades.',
          leverDeltas: {
            original_records_boundary: 0.25,
            effective_challenge: 0.15,
            translation_layer: 0.15,
            intermediary_capacity: 0.1,
          },
          incidentEffects: {
            record_capturability: 30,
            signal_fidelity: 10,
            board_oversight_visibility: 10,
          },
          flags: ['state_snapshotted', 'pipeline_captured'],
          analogRefs: ['sr11', 'asrs-asap'],
          citations: [
            {
              text: 'SR 11-7 (Fed. Reserve / OCC, April 4, 2011): model documentation is a control; independent validation requires reproducible model artifacts with sufficient detail to support challenge and review.',
            },
            {
              text: 'FAA AC 120-66C (March 31, 2020): ASAP Event Review Committees rely on the timeliness of the report. Reports received before the next regulatory inspection get safe-harbor credit; delayed or degraded reports do not.',
            },
          ],
          next: 'nmm-ph3-boundary',
        },
        {
          id: 'nmm-ch2-minimal-capture',
          label: 'Capture only a summary note; avoid preserving the model state or full input/output',
          role: 'counsel',
          chapter: 4,
          rationale:
            'Limiting capture reduces the discoverable technical record. ' +
            'But after retraining, the failure is no longer reproducible — and the summary note, ' +
            'without the artifact, is insufficient to support any meaningful remediation.',
          leverDeltas: {
            privilege_strength: 0.15,
            original_records_boundary: -0.2,
            translation_layer: -0.15,
            workflow_protection: -0.1,
          },
          incidentEffects: {
            record_capturability: -25,
            signal_fidelity: -10,
          },
          flags: ['minimal_capture'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'In re Capital One Consumer Data Sec. Breach Litig. (E.D. Va. 2020): the court rejected privilege over a forensic analysis produced by counsel-retained firm when the work was not prepared primarily for litigation. Minimal capture that destroys the artifact may lose the protection it was designed to gain.',
              caveat:
                'Capital One shows how courts scrutinize privilege claims over technical analyses; the ruling is specific to its facts.',
            },
          ],
          next: 'nmm-ph3-boundary',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 — Boundary Crossing (Chapter 2)
    // The signal must cross from detection to the safety committee and Legal.
    // Signal fidelity is at risk at every hop.
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'nmm-ph3-boundary',
      phase: 3,
      chapter: 2,
      title: 'Organizational Boundary: Signal Handoff',
      situation:
        'The captured (or minimally noted) near-miss must now cross from the safety engineering team ' +
        'to the safety committee and to Legal. Each boundary hop risks translation loss. ' +
        'The safety engineer has the artifact; the committee lead wants a summary. ' +
        'Legal asks whether the near-miss record should be routed through the privilege workflow or kept in the factual record.',
      choices: [
        {
          id: 'nmm-ch3-independent-channel',
          label: 'Route via a structured independent review channel; preserve the artifact; debrief both safety committee and Legal in parallel',
          role: 'safety_eng',
          chapter: 2,
          rationale:
            'A structured independent-review channel preserves signal fidelity across the boundary. ' +
            'The factual artifact stays in the safety record (PSQIA original-records analog); ' +
            'Legal receives a privileged exposure assessment separately. ' +
            'This is the two-track design: the signal survives the boundary intact.',
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
          },
          flags: ['two_track', 'independent_review_channel'],
          analogRefs: ['psqia', 'nuclear', 'sr11'],
          citations: [
            {
              text: 'PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26; 42 C.F.R. Part 3: Patient Safety Work Product is protected; underlying original records — including the model artifact — are not. The boundary between the two must be explicit.',
            },
            {
              text: 'SR 11-7 (Fed. Reserve / OCC 2011): model risk governance requires independent validation and board-level oversight of material model risk; independent reviewers must have access to original model documentation.',
            },
            {
              text: 'NRC + INPO dual-channel: mandatory public Licensee Event Reports run alongside confidential INPO peer-learning. 10 C.F.R. §§ 50.72–50.73. Signal fidelity on both channels depends on separation of learning from enforcement.',
            },
          ],
          next: 'nmm-ph4-remediation',
        },
        {
          id: 'nmm-ch3-counsel-gate',
          label: 'Route everything through counsel; counsel frames the summary for the committee; keep the artifact inside the privilege boundary',
          role: 'counsel',
          chapter: 2,
          rationale:
            'Routing through counsel means the artifact is framed, filtered, and potentially suppressed ' +
            'before it reaches the safety committee. The perceived legal shield is highest, ' +
            'but signal fidelity is lost at the boundary — the committee receives a legal frame, not a safety artifact.',
          leverDeltas: {
            privilege_strength: 0.4,
            workflow_protection: -0.25,
            safe_harbor_non_admission: -0.25,
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
              text: 'Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023): the cyber privilege-first model collapses learning because counsel-directed forensics produce findings shaped by litigation strategy, not safety improvement. Counsel gates distort the signal at the boundary.',
              caveat:
                'The ~95% no-written-report figure is an estimate from Schwarcz, Wolff & Woods, not a measured statistic.',
            },
          ],
          next: 'nmm-ph4-remediation',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4 — Remediation (Chapter 4)
    // What does the institution do with what it captured?
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'nmm-ph4-remediation',
      phase: 4,
      chapter: 4,
      title: 'Technical Remediation and Learning Closure',
      situation:
        'The near-miss review is complete. ' +
        'The safety team has identified the triggering input class and a candidate threshold adjustment. ' +
        'You must decide whether to implement a full remediation loop — retraining exclusion, new monitors, ' +
        'CALLBACK-style feedback to the safety engineer who caught it — or to patch minimally to reduce ' +
        'what enters the written remediation record.',
      choices: [
        {
          id: 'nmm-ch4-full-remediation',
          label: 'Full remediation: add the near-miss to the training exclusion list, build a regression monitor, close the learning loop with visible feedback',
          role: 'safety_eng',
          chapter: 4,
          rationale:
            'Full remediation closes the learning loop — the ASRS CALLBACK analog. ' +
            'Reporters need visible evidence that their reports produced change. ' +
            'Building a regression monitor is the SR 11-7 effective-challenge discipline: ' +
            'validation findings must connect to enforceable remediation to be meaningful.',
          leverDeltas: {
            translation_layer: 0.3,
            effective_challenge: 0.2,
            near_miss_tier: 0.15,
            intermediary_capacity: 0.2,
          },
          incidentEffects: {
            remediation_completeness: 40,
            recurrence_risk: -25,
            board_oversight_visibility: 10,
          },
          flags: ['full_remediation', 'learning_loop_closed'],
          analogRefs: ['asrs-asap', 'sr11', 'pharma'],
          citations: [
            {
              text: 'FAA AC 00-46F: the ASRS CALLBACK newsletter shows reporters their reports produced safety enhancements. The feedback loop is essential to sustaining ~131,000 annual reports.',
            },
            {
              text: 'SR 11-7: independent validation must connect to remediation authority; findings that do not produce change are a model-risk governance failure.',
            },
            {
              text: '21 CFR §§ 314.80(k), 803.16 (FAERS): de-identified adverse-event reports feed signal-detection databases and drive CAPA-equivalent documentation. Pharma treats the near-miss signal as the trigger for a corrective-action loop.',
            },
          ],
          next: 'nmm-ph5-aftermath',
        },
        {
          id: 'nmm-ch4-minimal-patch',
          label: 'Minimal patch only: adjust one threshold; do not create a written remediation plan or connect to the training pipeline',
          role: 'counsel',
          chapter: 4,
          rationale:
            'A minimal written footprint limits the remediation record that could later become ' +
            'evidence of pattern knowledge. But it leaves the failure mode active in the training pipeline ' +
            'and breaks the near-miss learning tier — the signal produced nothing durable.',
          leverDeltas: {
            translation_layer: -0.2,
            effective_challenge: -0.15,
            near_miss_tier: -0.15,
            intermediary_capacity: -0.1,
          },
          incidentEffects: {
            remediation_completeness: -15,
            recurrence_risk: 20,
          },
          flags: ['minimal_remediation'],
          analogRefs: ['cyber'],
          citations: [
            {
              text: 'In re Target Corp. Customer Data Sec. Breach Litig. (D. Minn. 2015): the two-track privilege approach was only partially preserved. Courts still pierce the parts not primarily prepared for litigation, so minimal-footprint approaches both narrow discoverable records and narrow what the firm learns.',
            },
          ],
          next: 'nmm-ph5-aftermath',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5 — Aftermath (Chapter 4) — TERMINAL
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'nmm-ph5-aftermath',
      phase: 5,
      chapter: 4,
      title: 'Aftermath',
      situation:
        'The near-miss review is closed. The engine now runs forward on the lever configuration ' +
        'your choices produced. Normalization-of-deviance risk, near-miss learning yield, ' +
        'and recurrence risk reflect the institution you built during this incident.',
      choices: [],
      terminal: true,
    },
  ],
}
