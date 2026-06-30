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
import { simulate } from '../../engine'
import { ScoringLogicPanel, type ScoringLogicEntry } from './ScoringLogicPanel'

// ---------------------------------------------------------------------------
// Scoring-logic metadata for each institutional meter
// ---------------------------------------------------------------------------
const INSTITUTIONAL_LOGIC: Record<InstitutionalMeterKey, ScoringLogicEntry> = {
  safe_to_report_score: {
    formula: 'f(privilege_strength, recipient_enforcer_separation, workflow_protection, safe_harbor_non_admission, just_culture)',
    levers: ['privilege_strength', 'recipient_enforcer_separation', 'workflow_protection', 'safe_harbor_non_admission', 'just_culture'],
    flags: [],
  },
  accountability_legitimacy: {
    formula: 'f(original_records_boundary, just_culture, mandatory_reporting, effective_challenge)',
    levers: ['original_records_boundary', 'just_culture', 'mandatory_reporting', 'effective_challenge'],
    flags: [],
  },
  learning_yield: {
    formula: 'f(intermediary_capacity, near_miss_tier, translation_layer)',
    levers: ['intermediary_capacity', 'near_miss_tier', 'translation_layer'],
    flags: [],
  },
  litigation_pressure: {
    formula: 'f(pld_penalty, privilege_strength, safe_harbor_non_admission, mandatory_reporting)',
    levers: ['pld_penalty', 'privilege_strength', 'safe_harbor_non_admission', 'mandatory_reporting'],
    flags: [],
  },
  private_ordering_gap: {
    formula: 'f(workflow_protection, safe_harbor_non_admission, privilege_strength)',
    levers: ['workflow_protection', 'safe_harbor_non_admission', 'privilege_strength'],
    flags: [],
  },
  policy_scaffold_dependency: {
    formula: 'f(mandatory_reporting, workflow_protection, safe_harbor_non_admission)',
    levers: ['mandatory_reporting', 'workflow_protection', 'safe_harbor_non_admission'],
    flags: [],
  },
}

// Scoring-logic for perceived legal shield
const SHIELD_LOGIC: ScoringLogicEntry = {
  formula: '0.55 × privilege_strength + 0.30 × (legal_owns_record | privileged_single_track ? 1 : 0) + 0.15 × (1 − original_records_boundary)',
  levers: ['privilege_strength', 'original_records_boundary'],
  flags: ['legal_owns_record', 'privileged_single_track'],
}

// Scoring-logic for incident meters.
// These strings describe the REAL engine (boundary.ts, capturability.ts, applyChoice.ts).
// Only signal_fidelity, record_capturability, and board_oversight_visibility are computed
// by formulas; the rest move purely via each choice's explicit incidentEffects deltas.
const INCIDENT_LOGIC: Record<IncidentMeterKey, ScoringLogicEntry> = {
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
    formula: 'Moved by the explicit effect of each choice, and revealed via the engine-forward Aftermath; the in-play value is a static placeholder until Aftermath is reached.',
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
}

function MeterRow({ label, value, scale = 1, kind = 'neutral', meterId, logic, activeFlags = [] }: MeterRowProps) {
  const pct = Math.round(Math.min(100, Math.max(0, scale === 100 ? value : value * 100)))
  const barColor =
    kind === 'good'
      ? 'bg-accent'
      : kind === 'bad'
        ? 'bg-red-500'
        : 'bg-zinc-400'

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
            />

            {/* Perceived legal shield row — rendered directly after litigation_pressure */}
            {item.id === 'litigation_pressure' && (
              <div className="ml-3 mt-0 mb-1 pl-3 border-l-2 border-accent-soft">
                <div className="py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink">Perceived legal shield</span>
                    <span className="text-xs text-ink-soft tabular-nums">{Math.round(shieldValue * 100)}%</span>
                  </div>
                  <p className="text-xs text-muted mb-1 italic">Short-term / perceived — asserting privilege appears protective; fragile — not a durable reduction in exposure. The oral-path trap.</p>
                  <div
                    className="h-2 w-full rounded-full bg-accent-soft overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(shieldValue * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Perceived legal shield"
                  >
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${Math.round(shieldValue * 100)}%` }}
                    />
                  </div>
                  <ScoringLogicPanel meterId="perceived_legal_shield" logic={SHIELD_LOGIC} />
                </div>
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
