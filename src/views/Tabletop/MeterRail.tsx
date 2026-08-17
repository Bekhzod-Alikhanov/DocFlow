// src/views/Tabletop/MeterRail.tsx
import { useMemo } from 'react'
import { useTabletopStore } from '../../state/tabletopStore'
import { institutionalScorecard } from '../../lib/institutional'
import {
  INCIDENT_METER_KEYS,
  perceivedLegalShield,
  type InstitutionalMeterKey,
  type IncidentMeterKey,
} from '../../engine/tabletop'
import { simulate, type LeverKey } from '../../engine'
import { ScoringLogicPanel, type ScoringLogicEntry } from './ScoringLogicPanel'

// ---------------------------------------------------------------------------
// Scoring-logic metadata for each institutional meter
//
// These strings must name what `computeAux` actually computes. Weights are the
// grouped constants in `readouts.ts`; π is the computed privilege-survival
// probability from `privilegeSurvival` (v0.3.0 M3b), NOT a lever.
// ---------------------------------------------------------------------------

/**
 * The design choices that produce π. Privilege stopped being a slider in M3b, so a
 * meter driven by π is driven by these four (plus `workflow_protection`, which does
 * double duty as the separation factor) rather than by any single "privilege" lever.
 */
const PRIVILEGE_LEVERS: LeverKey[] = [
  'precommit',
  'significant_purpose',
  'workflow_protection',
  'valve_discipline',
  'kovel_evaluator',
]

export const INSTITUTIONAL_LOGIC: Record<InstitutionalMeterKey, ScoringLogicEntry> = {
  safe_to_report_score: {
    formula:
      '0.22·π + 0.18·recipient_enforcer_separation + 0.18·workflow_protection + 0.16·safe_harbor_non_admission + 0.12·original_records_boundary + 0.08·just_culture + 0.06·intermediary_capacity − 0.16·perceived_discoverability, clamped to [0,1]',
    levers: [
      ...PRIVILEGE_LEVERS,
      'recipient_enforcer_separation',
      'safe_harbor_non_admission',
      'original_records_boundary',
      'just_culture',
      'intermediary_capacity',
    ],
    flags: [],
  },
  accountability_legitimacy: {
    formula:
      'Weighted blend of original_records_boundary, just_culture, mandatory_reporting, effective_challenge and near_miss_tier (weights in readouts.ts ACCOUNTABILITY_LEGITIMACY), clamped to [0,1]. Privilege does NOT enter: legitimacy is about what stays visible.',
    levers: ['original_records_boundary', 'just_culture', 'mandatory_reporting', 'effective_challenge', 'near_miss_tier'],
    flags: [],
  },
  learning_yield: {
    formula:
      'learning_gain / incident_inflow — a ratio, not a blend. learning_gain rises with translation-layer efficiency, effective_challenge and the near-miss signal (itself gated by recipient_enforcer_separation).',
    levers: ['translation_layer', 'intermediary_capacity', 'effective_challenge', 'near_miss_tier', 'recipient_enforcer_separation'],
    flags: [],
  },
  litigation_pressure: {
    formula:
      '0.32·softplus(perceived_discoverability) + 0.24·pld_penalty + 0.16·mandatory_reporting + 0.18·(1 − safe_to_report_score) + 0.10·(1 − original_records_boundary), clamped to [0,1]. π enters twice, indirectly: through perceived_discoverability and through safe_to_report_score.',
    levers: ['pld_penalty', 'mandatory_reporting', 'original_records_boundary', ...PRIVILEGE_LEVERS],
    flags: [],
  },
  private_ordering_gap: {
    formula:
      'policy_scaffold_dependency − 0.65 × mean(privately-orderable levers), clamped to [0,1]. What a lab still needs statute for after doing everything it can do alone.',
    levers: [...PRIVILEGE_LEVERS, 'safe_harbor_non_admission', 'intermediary_capacity', 'translation_layer', 'effective_challenge'],
    flags: [],
  },
  policy_scaffold_dependency: {
    formula:
      '0.42·safe_harbor_non_admission + 0.34·workflow_protection + 0.24·π, clamped to [0,1]. Reporting duties are deliberately absent from this sum: an obligation to report is not a scaffold that protects the reporter.',
    levers: ['safe_harbor_non_admission', ...PRIVILEGE_LEVERS],
    flags: [],
  },
}

// Scoring-logic for the PERCEIVED legal shield.
//
// This is deliberately not π. It models the BELIEF that produces the keep-it-oral
// move — "we involved a lawyer and wrote nothing down" — which the case law has
// repeatedly pierced. The gap between this and `actualLegalShield` is the quantity
// the playbook is written against; see `legalShieldIllusion` in tabletop/score.ts.
export const SHIELD_LOGIC: ScoringLogicEntry = {
  formula:
    '0.55 × significant_purpose + 0.30 × (legal_owns_record | privileged_single_track ? 1 : 0) + 0.15 × (1 − original_records_boundary). This is the BELIEF, not the doctrine: it ignores pre-commitment and valve integrity, which is precisely why it can exceed actual privilege survival π.',
  levers: ['significant_purpose', 'original_records_boundary'],
  flags: ['legal_owns_record', 'privileged_single_track'],
}

// Scoring-logic for incident meters.
// These strings describe the REAL engine (boundary.ts, capturability.ts, applyChoice.ts).
// Only signal_fidelity, record_capturability, and board_oversight_visibility are computed
// by formulas; the rest move purely via each choice's explicit incidentEffects deltas.
export const INCIDENT_LOGIC: Record<IncidentMeterKey, ScoringLogicEntry> = {
  signal_fidelity: {
    formula: 'Ch.2 transfer function at each chapter-2 handoff: fidelity × tieStrength × (1 − translationLoss) × (1 − 0.5·normalization).',
    levers: [
      'recipient_enforcer_separation', 'near_miss_tier', 'effective_challenge', 'intermediary_capacity', // raise tie strength
      'translation_layer', 'original_records_boundary', // lower translation loss
      'just_culture', // lower normalization (near_miss_tier also lowers it)
    ],
    flags: ['independent_review_channel', 'legal_owns_record'],
  },
  record_capturability: {
    formula: 'base(captureResistance) + 30·state_snapshotted + 15·pipeline_captured − 40·retrainCadence (erosion applies only when state is not snapshotted).',
    levers: [],
    flags: ['state_snapshotted', 'pipeline_captured'],
  },
  regulatory_timeliness: {
    formula: 'Moved by the explicit effect of each choice you make (e.g. voluntary disclosure raises it, containment lowers it); see the choice rationale.',
    levers: [],
    flags: [],
  },
  board_oversight_visibility: {
    formula: 'After a chapter-2 handoff it equals signal_fidelity + the choice’s board-routing delta (structured channel vs. informal brief). Tracks signal_fidelity.',
    levers: [],
    flags: [],
  },
  evidentiary_posture: {
    formula: 'Higher = more defensible objective record. Moved by the explicit effect of each choice you make; see the choice rationale.',
    levers: [],
    flags: [],
  },
  remediation_completeness: {
    formula: 'Moved by the explicit effect of each choice you make (full remediation raises it, minimal patch lowers it); see the choice rationale.',
    levers: [],
    flags: [],
  },
  recurrence_risk: {
    formula: 'Moved by the explicit effect of each choice (e.g. full remediation −20, minimal patch +15). The authoritative verdict is the engine-forward AftermathOutcome.recurrenceRisk, revealed only after the terminal node fires.',
    levers: [],
    flags: [],
  },
}

// ---------------------------------------------------------------------------
// Helper: pretty-print meter keys
// ---------------------------------------------------------------------------
function fmtKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ---------------------------------------------------------------------------
// Single meter row
// ---------------------------------------------------------------------------
interface MeterRowProps {
  label: string
  value: number   // 0–1 for institutional; 0–100 for incident
  scale?: 100 | 1  // display scale; default 1 (value already 0–1)
  kind?: 'good' | 'bad' | 'neutral'
  meterId: string
  logic: ScoringLogicEntry
  activeFlags?: string[]
  /** One-line "why" shown at rest (not only inside the scoring-logic panel). */
  note?: string
  /** Emphasized caveat shown at rest, italic (e.g. the perceived-shield fragility caveat). */
  caveat?: string
  /** Override the derived bar color (e.g. the amber perceived-legal-shield bar). */
  barColorClass?: string
}

function MeterRow({
  label,
  value,
  scale = 1,
  kind = 'neutral',
  meterId,
  logic,
  activeFlags = [],
  note,
  caveat,
  barColorClass,
}: MeterRowProps) {
  const pct = Math.round(Math.min(100, Math.max(0, scale === 100 ? value : value * 100)))
  const barColor =
    barColorClass ??
    (kind === 'good'
      ? 'bg-accent'
      : kind === 'bad'
        ? 'bg-red-500'
        : 'bg-zinc-400')

  const logicWithActiveFlags: ScoringLogicEntry = {
    ...logic,
    flags: activeFlags.length > 0
      ? logic.flags.filter((f) => activeFlags.includes(f))
      : logic.flags,
  }

  return (
    <div className="py-2 border-b border-line last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-ink-soft tabular-nums">{pct}%</span>
      </div>
      {caveat && <p className="text-xs text-muted mb-1 italic">{caveat}</p>}
      <div
        className="h-2 w-full rounded-full bg-accent-soft overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}
      <ScoringLogicPanel meterId={meterId} logic={logicWithActiveFlags} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// MeterRail
// ---------------------------------------------------------------------------
export function MeterRail() {
  const runState = useTabletopStore((s) => s.runState)
  const finished = useTabletopStore((s) => s.finished)

  const { trajectory } = useMemo(
    () => simulate(runState.init, runState.params, runState.settings),
    [runState],
  )
  const scoreItems = institutionalScorecard(runState.params, trajectory)

  const shieldValue = perceivedLegalShield(runState)
  const activeFlags = runState.flags

  return (
    <aside aria-label="Meter Rail" className="flex flex-col gap-6 p-4 bg-surface border-l border-line w-72 shrink-0 overflow-y-auto">
      {/* ── Institutional meters ──────────────────────────────── */}
      <section aria-labelledby="institutional-heading">
        <h2 id="institutional-heading" className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
          Institutional meters
        </h2>

        {scoreItems.map((item) => (
          <div key={item.id}>
            <MeterRow
              label={item.label}
              value={item.value}
              scale={1}
              kind={item.kind}
              meterId={item.id}
              logic={INSTITUTIONAL_LOGIC[item.id] ?? { formula: '—', levers: [], flags: [] }}
              activeFlags={activeFlags}
              note={item.note}
            />

            {/* Perceived legal shield row — rendered directly after litigation_pressure.
                Uses the shared MeterRow (amber bar) and keeps its short-term/fragility caveat. */}
            {item.id === 'litigation_pressure' && (
              <div className="ml-3 mt-0 mb-1 pl-3 border-l-2 border-accent-soft">
                <MeterRow
                  label="Perceived legal shield"
                  value={shieldValue}
                  scale={1}
                  kind="neutral"
                  barColorClass="bg-amber-400"
                  meterId="perceived_legal_shield"
                  logic={SHIELD_LOGIC}
                  caveat="Short-term / perceived — asserting privilege appears protective; fragile — not a durable reduction in exposure. The oral-path trap."
                />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ── Incident meters ───────────────────────────────────── */}
      <section aria-labelledby="incident-heading">
        <h2 id="incident-heading" className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
          Incident meters
        </h2>

        {INCIDENT_METER_KEYS.filter(
          (key) => key !== 'recurrence_risk' || finished,
        ).map((key) => (
          <MeterRow
            key={key}
            label={fmtKey(key)}
            value={runState.incident[key]}
            scale={100}
            kind="neutral"
            meterId={key}
            logic={INCIDENT_LOGIC[key]}
            activeFlags={activeFlags}
          />
        ))}
      </section>
    </aside>
  )
}
