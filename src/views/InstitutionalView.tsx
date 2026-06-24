import { useMemo, useState } from 'react'
import { PARAM_SPEC_BY_ID, simulate, type LeverKey } from '../engine'
import { useStore } from '../state/store'
import { pct, fmt } from '../lib/format'
import {
  AUDIENCE_MODES,
  CHAPTER3_STEPS,
  DESIGN_PRINCIPLES,
  GUIDED_DEMOS,
  LAB_CHECKLIST_SECTIONS,
  POLICY_COMPONENTS,
  POLICY_PACKAGE_TEMPLATES,
  REGIME_MATRIX,
  SOURCE_CAVEATS,
  applyPolicyComponents,
  decisionRecommendations,
  dependencyCounts,
  finalAux,
  groupedRecommendations,
  institutionalScorecard,
  topRegimeMatches,
  type ActionDependency,
  type AudienceMode,
  type ChapterNarrativeStep,
  type DecisionRecommendation,
  type RecommendationBucket,
  type ScoreItem,
} from '../lib/institutional'

const transferLabel = {
  private: 'Private-orderable',
  'partly-private': 'Partial',
  statute: 'Needs statute',
}

const dependencyLabel: Record<ActionDependency, string> = {
  'private-ordering': 'Private ordering',
  regulator: 'Regulator',
  statute: 'Statute',
  mixed: 'Mixed',
}

const bucketMeta: Record<RecommendationBucket, { title: string; hint: string }> = {
  'build-now': { title: 'Build internally now', hint: 'Actions a lab can start under private ordering.' },
  'needs-law': { title: 'Needs regulator/statute', hint: 'Policy scaffolds that require public authority.' },
  watch: { title: 'Watch / caveat', hint: 'Low-confidence or jurisdiction-sensitive items.' },
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' | 'warn' | 'good' }) {
  const cls =
    tone === 'accent'
      ? 'bg-accent-soft text-accent'
      : tone === 'warn'
        ? 'bg-estimate-soft text-estimate'
        : tone === 'good'
          ? 'bg-learning-soft text-learning'
          : 'bg-surface-2 text-ink-soft'
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>{children}</span>
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
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold text-ink">{item.label}</div>
          {item.sensitive && <div className="mt-0.5"><Badge tone="warn">illustrative only</Badge></div>}
        </div>
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

function RecommendationCard({ rec }: { rec: DecisionRecommendation }) {
  const depTone = rec.dependency === 'private-ordering' ? 'good' : rec.confidence === 'low' ? 'warn' : 'accent'
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12px] font-semibold text-ink">{rec.title}</div>
        <div className="flex gap-1">
          <Badge tone={depTone}>{dependencyLabel[rec.dependency]}</Badge>
          <Badge tone={rec.confidence === 'low' ? 'warn' : 'neutral'}>{rec.confidence} confidence</Badge>
        </div>
      </div>
      <p className="mt-1 text-[11.5px] leading-snug text-ink-soft">{rec.why}</p>
      <p className="mt-1 text-[11.5px] leading-snug text-ink"><strong>Do now:</strong> {rec.doNow}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {rec.linkedLevers.map((key) => (
          <Badge key={key}>{PARAM_SPEC_BY_ID[key].label}</Badge>
        ))}
      </div>
      <p className="mt-2 text-[10.5px] leading-snug text-muted">{rec.caveat}</p>
    </div>
  )
}

function DecisionPanel() {
  const params = useStore((s) => s.params)
  const trajectory = useStore((s) => s.trajectory)
  const recs = useMemo(() => decisionRecommendations(params, trajectory), [params, trajectory])
  const grouped = useMemo(() => groupedRecommendations(recs), [recs])

  return (
    <section aria-labelledby="decision-h" className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="decision-h" className="m-0 text-[15px] font-semibold text-ink">
            What should a lab do now?
          </h2>
          <p className="mt-1 text-[12px] text-muted">Rule-backed recommendations from the current scenario.</p>
        </div>
        <Badge tone="warn">not legal advice</Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {(['build-now', 'needs-law', 'watch'] as RecommendationBucket[]).map((bucket) => (
          <div key={bucket}>
            <div className="mb-2">
              <div className="text-[12px] font-semibold text-ink">{bucketMeta[bucket].title}</div>
              <div className="text-[10.5px] text-muted">{bucketMeta[bucket].hint}</div>
            </div>
            <div className="space-y-2">
              {grouped[bucket].length ? (
                grouped[bucket].map((rec) => <RecommendationCard key={rec.id} rec={rec} />)
              ) : (
                <div className="rounded-md border border-line bg-surface-2 px-3 py-2 text-[11px] text-muted">
                  No triggered recommendation in this bucket.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
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
        <Badge tone="accent">safety translation layer</Badge>
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

function ChapterNarrativePanel() {
  const loadPreset = useStore((s) => s.loadPreset)
  const [activeId, setActiveId] = useState(CHAPTER3_STEPS[0].id)
  const active = CHAPTER3_STEPS.find((s) => s.id === activeId) ?? CHAPTER3_STEPS[0]

  const selectStep = (step: ChapterNarrativeStep) => {
    setActiveId(step.id)
    loadPreset(step.presetId)
  }

  return (
    <section aria-labelledby="chapter-h" className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="chapter-h" className="m-0 text-[15px] font-semibold text-ink">
            Chapter 3 narrative
          </h2>
          <p className="mt-1 text-[12px] text-muted">A guided sequence for demos and chapter drafting.</p>
        </div>
        <Badge tone="accent">guided story</Badge>
      </div>
      <div className="grid gap-3 xl:grid-cols-[240px_1fr]">
        <div className="space-y-1">
          {CHAPTER3_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => selectStep(step)}
              className={`w-full rounded-md border px-3 py-2 text-left text-[11.5px] transition-colors ${
                step.id === active.id ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-soft hover:border-accent'
              }`}
            >
              {index + 1}. {step.title}
            </button>
          ))}
        </div>
        <div className="rounded-md border border-line bg-surface px-3 py-3">
          <h3 className="m-0 text-[14px] font-semibold text-ink">{active.title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{active.thesis}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Inspect levers</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {active.keyLevers.map((key) => <Badge key={key}>{PARAM_SPEC_BY_ID[key].label}</Badge>)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Watch readouts</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {active.watchReadouts.map((id) => <Badge key={id}>{id.replace(/_/g, ' ')}</Badge>)}
              </div>
            </div>
          </div>
          <p className="mt-3 rounded-md bg-estimate-soft px-3 py-2 text-[11.5px] leading-snug text-estimate">
            <strong>Chapter takeaway:</strong> {active.takeaway}
          </p>
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
            className={`rounded px-2.5 py-1 text-[11px] font-medium ${mode === m.id ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ink-soft">{current.emphasis}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {current.outputs.map((o) => <Badge key={o}>{o}</Badge>)}
      </div>
    </section>
  )
}

function scoreDisplay(item: ScoreItem) {
  return item.id === 'learning_yield' ? fmt(item.value * 2, 2) : pct(item.value)
}

function PolicyPackageBuilder() {
  const params = useStore((s) => s.params)
  const init = useStore((s) => s.init)
  const settings = useStore((s) => s.settings)
  const trajectory = useStore((s) => s.trajectory)
  const setParam = useStore((s) => s.setParam)
  const [selected, setSelected] = useState<string[]>(POLICY_PACKAGE_TEMPLATES[0].componentIds)

  const projectedParams = useMemo(() => applyPolicyComponents(params, selected), [params, selected])
  const projectedRun = useMemo(() => simulate(init, projectedParams, settings), [init, projectedParams, settings])
  const beforeScore = useMemo(() => institutionalScorecard(params, trajectory), [params, trajectory])
  const afterScore = useMemo(() => institutionalScorecard(projectedParams, projectedRun.trajectory), [projectedParams, projectedRun])
  const counts = useMemo(() => dependencyCounts(selected), [selected])

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  const chooseTemplate = (ids: string[]) => setSelected(ids)
  const apply = () => {
    for (const key of Object.keys(projectedParams) as LeverKey[]) {
      if (params[key] !== projectedParams[key]) setParam(key, projectedParams[key])
    }
  }

  return (
    <section aria-labelledby="package-h" className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="package-h" className="m-0 text-[15px] font-semibold text-ink">
            Policy package builder
          </h2>
          <p className="mt-1 text-[12px] text-muted">Select components, preview the scorecard, then apply to the live scenario.</p>
        </div>
        <button
          type="button"
          onClick={apply}
          className="rounded-md border border-accent bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent hover:bg-accent hover:text-white"
        >
          Apply package to scenario
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {POLICY_PACKAGE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => chooseTemplate(template.componentIds)}
            className="rounded-md border border-line px-2 py-1 text-[11px] text-ink-soft hover:border-accent hover:text-accent"
            title={template.description}
          >
            {template.title}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {POLICY_COMPONENTS.map((component) => (
            <label key={component.id} className="rounded-md border border-line px-3 py-2 text-[11.5px] text-ink-soft">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={selected.includes(component.id)} onChange={() => toggle(component.id)} className="mt-0.5" />
                <div>
                  <div className="font-semibold text-ink">{component.title}</div>
                  <div className="mt-0.5 leading-snug">{component.description}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone={component.dependency === 'private-ordering' ? 'good' : 'accent'}>{dependencyLabel[component.dependency]}</Badge>
                    <Badge>{component.confidence} confidence</Badge>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="rounded-md border border-line bg-surface px-3 py-2">
          <div className="mb-2 flex flex-wrap gap-1">
            <Badge tone="good">{counts['private-ordering']} private</Badge>
            <Badge tone="accent">{counts.statute + counts.regulator + counts.mixed} law/regulator/mixed</Badge>
          </div>
          <table className="w-full border-collapse text-[11.5px]">
            <thead className="text-left text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th className="py-1">Readout</th>
                <th className="py-1 text-right">Now</th>
                <th className="py-1 text-right">Package</th>
              </tr>
            </thead>
            <tbody>
              {beforeScore.map((item) => {
                const next = afterScore.find((x) => x.id === item.id)!
                return (
                  <tr key={item.id} className="border-t border-line">
                    <td className="py-1.5 pr-2 text-ink-soft">{item.label}</td>
                    <td className="py-1.5 text-right tabular-nums text-muted">{scoreDisplay(item)}</td>
                    <td className="py-1.5 text-right tabular-nums font-semibold text-ink">{scoreDisplay(next)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
                  <Badge>{transferLabel[r.transferability]}</Badge>
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

function LabChecklistPreview() {
  return (
    <section aria-labelledby="checklist-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="checklist-h" className="m-0 text-[15px] font-semibold text-ink">
        Lab architecture checklist
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {LAB_CHECKLIST_SECTIONS.map((section) => (
          <div key={section.id} className="rounded-md border border-line px-3 py-2">
            <div className="text-[12px] font-semibold text-ink">{section.title}</div>
            <ul className="mt-1 space-y-1 text-[11px] leading-snug text-ink-soft">
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
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
      <DecisionPanel />
      <PolicyPackageBuilder />
      <ChapterNarrativePanel />
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
              <Badge>pressure {pct(aux.litigation_pressure)}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {score.map((item) => <ScoreBar key={item.id} item={item} />)}
            </div>
          </section>
          <AudiencePanel />
        </div>
      </div>
      <RegimeMatrix />
      <PrincipleStrip />
      <LabChecklistPreview />
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
