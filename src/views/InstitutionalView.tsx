import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { pct, fmt } from '../lib/format'
import {
  AUDIENCE_MODES,
  DESIGN_PRINCIPLES,
  GUIDED_DEMOS,
  REGIME_MATRIX,
  SOURCE_CAVEATS,
  finalAux,
  institutionalScorecard,
  topRegimeMatches,
  type AudienceMode,
  type ScoreItem,
} from '../lib/institutional'

const transferLabel = {
  private: 'Private-orderable',
  'partly-private': 'Partial',
  statute: 'Needs statute',
}

function ScoreBar({ item }: { item: ScoreItem }) {
  const display = item.kind === 'bad' ? 1 - item.value : item.value
  const tone =
    item.kind === 'bad'
      ? item.value > 0.55
        ? 'bg-chilling'
        : 'bg-learning'
      : item.value > 0.55
        ? 'bg-learning'
        : 'bg-estimate'
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="text-[12px] font-semibold text-ink">{item.label}</div>
        <div className="text-[13px] font-semibold tabular-nums text-ink">
          {item.id === 'learning_yield' ? fmt(item.value * 2, 2) : pct(item.value)}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full ${tone}`} style={{ width: `${Math.round(display * 100)}%` }} />
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted">{item.note}</p>
    </div>
  )
}

function ArchitectureDiagram() {
  return (
    <section aria-labelledby="architecture-h" className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 id="architecture-h" className="m-0 text-[15px] font-semibold text-ink">
            Two-track incident architecture
          </h2>
          <p className="mt-1 text-[12px] text-muted">Factual safety records remain durable; legal analysis stays separate.</p>
        </div>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
          safety translation layer
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-md border border-learning/30 bg-learning-soft p-3">
          <div className="text-[11px] uppercase tracking-wide text-learning">Factual safety record</div>
          <div className="mt-1 text-[13px] font-semibold text-ink">Telemetry, model version, input/output, observable behavior</div>
          <div className="mt-2 text-[11px] text-ink-soft">Engineering route: regression tests, monitoring thresholds, guardrails, rollback gates.</div>
        </div>
        <div className="hidden min-w-20 items-center justify-center text-center text-[11px] font-semibold text-accent lg:flex">
          facts in
          <br />
          requirements out
        </div>
        <div className="rounded-md border border-chilling/30 bg-chilling-soft p-3">
          <div className="text-[11px] uppercase tracking-wide text-chilling">Counsel-directed legal analysis</div>
          <div className="mt-1 text-[13px] font-semibold text-ink">Fault, causation, exposure, privilege, regulatory posture</div>
          <div className="mt-2 text-[11px] text-ink-soft">Legal route: protected advice and escalation, without starving remediation teams.</div>
        </div>
      </div>
    </section>
  )
}

function GuidedDemos() {
  const loadPreset = useStore((s) => s.loadPreset)
  return (
    <section aria-labelledby="demos-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="demos-h" className="m-0 text-[15px] font-semibold text-ink">
        Guided demos
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        {GUIDED_DEMOS.map((demo) => (
          <button
            key={demo.id}
            type="button"
            onClick={() => loadPreset(demo.presetId)}
            className="rounded-md border border-line p-3 text-left transition-colors hover:border-accent hover:bg-accent-soft/45"
          >
            <div className="text-[13px] font-semibold text-ink">{demo.title}</div>
            <p className="mt-1 text-[11.5px] leading-snug text-ink-soft">{demo.thesis}</p>
            <p className="mt-2 text-[10.5px] leading-snug text-muted">{demo.moves.join(' ')}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function AudiencePanel() {
  const [mode, setMode] = useState<AudienceMode['id']>('research')
  const current = AUDIENCE_MODES.find((m) => m.id === mode) ?? AUDIENCE_MODES[0]
  return (
    <section aria-labelledby="audience-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="audience-h" className="m-0 text-[15px] font-semibold text-ink">
        Audience lens
      </h2>
      <div className="mt-3 flex flex-wrap gap-1 rounded-md border border-line p-1">
        {AUDIENCE_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded px-2.5 py-1 text-[11px] font-medium ${
              mode === m.id ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ink-soft">{current.emphasis}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {current.outputs.map((o) => (
          <span key={o} className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] text-ink-soft">
            {o}
          </span>
        ))}
      </div>
    </section>
  )
}

function RegimeMatrix() {
  const params = useStore((s) => s.params)
  const matches = useMemo(() => new Set(topRegimeMatches(params).map((r) => r.id)), [params])
  return (
    <section aria-labelledby="matrix-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="matrix-h" className="m-0 text-[15px] font-semibold text-ink">
        Regime matrix
      </h2>
      <div className="mt-3 max-h-[48vh] overflow-auto rounded-md border border-line">
        <table className="w-full border-collapse text-[11.5px]">
          <thead className="sticky top-0 bg-surface-2 text-left text-[10px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-2 py-1.5">Regime</th>
              <th className="px-2 py-1.5">Mechanism</th>
              <th className="px-2 py-1.5">Transfer</th>
              <th className="px-2 py-1.5">Caveat</th>
            </tr>
          </thead>
          <tbody>
            {REGIME_MATRIX.map((r) => (
              <tr key={r.id} className={`border-t border-line align-top ${matches.has(r.id) ? 'bg-accent-soft/45' : ''}`}>
                <td className="min-w-40 px-2 py-2">
                  <div className="font-semibold text-ink">{r.name}</div>
                  <div className="text-[10.5px] text-muted">{r.sector}</div>
                </td>
                <td className="px-2 py-2 text-ink-soft">
                  <div>{r.transferablePrinciple}</div>
                  <div className="mt-1 text-[10.5px] text-muted">{r.protectedThing}</div>
                </td>
                <td className="min-w-28 px-2 py-2">
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                    {transferLabel[r.transferability]}
                  </span>
                </td>
                <td className="px-2 py-2 text-muted">{r.caveat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PrincipleStrip() {
  return (
    <section aria-labelledby="principles-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="principles-h" className="m-0 text-[15px] font-semibold text-ink">
        Design principles
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {DESIGN_PRINCIPLES.map((p) => (
          <div key={p.id} className="rounded-md border border-line bg-surface px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-muted">
                {p.id}
              </span>
              <div className="text-[12px] font-semibold text-ink">{p.principle}</div>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-ink-soft">{p.accomplishes}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function InstitutionalView() {
  const params = useStore((s) => s.params)
  const trajectory = useStore((s) => s.trajectory)
  const aux = finalAux(trajectory)
  const score = institutionalScorecard(params, trajectory)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <ArchitectureDiagram />
          <GuidedDemos />
        </div>
        <div className="space-y-4">
          <section aria-labelledby="score-h" className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 id="score-h" className="m-0 text-[15px] font-semibold text-ink">
                  Institutional scorecard
                </h2>
                <p className="mt-1 text-[12px] text-muted">Live readout from the current scenario.</p>
              </div>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-soft">
                pressure {pct(aux.litigation_pressure)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {score.map((item) => (
                <ScoreBar key={item.id} item={item} />
              ))}
            </div>
          </section>
          <AudiencePanel />
        </div>
      </div>
      <RegimeMatrix />
      <PrincipleStrip />
      <section aria-labelledby="caveats-h" className="rounded-lg border border-line bg-surface p-4">
        <h2 id="caveats-h" className="m-0 text-[15px] font-semibold text-ink">
          Source caveats
        </h2>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {SOURCE_CAVEATS.map((c) => (
            <div key={c} className="rounded-md bg-estimate-soft px-3 py-2 text-[11.5px] leading-snug text-estimate">
              {c}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
