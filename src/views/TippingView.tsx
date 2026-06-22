/**
 * Tipping explorer (spec §5.4). Two modes: a 1-lever bifurcation diagram (with an
 * optional hysteresis overlay) and a 2-lever tipping heatmap. All heavy sweeps run
 * in the engine Web Worker via useWorkerTask, so dragging selectors never blocks the
 * UI and stale results are dropped. Clicking a chart loads those lever values into
 * the working scenario.
 */
import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { BifurcationChart } from '../components/BifurcationChart'
import { HeatmapChart } from '../components/HeatmapChart'
import { ChartSkeleton } from '../components/ChartSkeleton'
import { useWorkerTask } from '../workers/useWorkerTask'
import { LEVER_KEYS, PARAM_SPEC_BY_ID, type LeverKey, type Metric } from '../engine'

const METRIC_OPTS: { value: Metric; label: string }[] = [
  { value: 'f_doc', label: 'Documentation fraction' },
  { value: 'TD', label: 'Technical debt' },
  { value: 'L', label: 'Learning' },
  { value: 'C', label: 'Culture' },
  { value: 'E', label: 'Exposure' },
]
const METRIC_LABEL: Record<Metric, string> = {
  f_doc: 'Documentation fraction',
  TD: 'Technical debt',
  L: 'Learning',
  C: 'Culture',
  E: 'Exposure',
  U: 'Undocumented',
  D: 'Documented',
}
const leverLabel = (k: LeverKey) => PARAM_SPEC_BY_ID[k].label

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border border-line bg-surface px-2 py-1 text-[12px] text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TippingView() {
  const params = useStore((s) => s.params)
  const settings = useStore((s) => s.settings)
  const setParam = useStore((s) => s.setParam)

  const [mode, setMode] = useState<'1d' | '2d'>('1d')
  const [leverId, setLeverId] = useState<LeverKey>('just_culture')
  const [xId, setXId] = useState<LeverKey>('privilege_strength')
  const [yId, setYId] = useState<LeverKey>('just_culture')
  const [metric, setMetric] = useState<Metric>('f_doc')
  const [showHyst, setShowHyst] = useState(true)

  const paramsKey = useMemo(() => JSON.stringify(params), [params])
  const settingsKey = useMemo(() => JSON.stringify(settings), [settings])

  const sweep1 = useWorkerTask(
    mode === '1d' ? { op: 'sweep1D' as const, params, leverId, opts: { steps: 60, metric } } : null,
    [mode, leverId, metric, paramsKey],
  )
  const hyst = useWorkerTask(
    mode === '1d' && showHyst
      ? { op: 'hysteresis' as const, params, leverId, opts: { steps: 36, metric } }
      : null,
    [mode, leverId, metric, showHyst, paramsKey],
  )
  const sweep2 = useWorkerTask(
    mode === '2d'
      ? { op: 'sweep2D' as const, params, xId, yId, opts: { nx: 21, ny: 21, metric, settings } }
      : null,
    [mode, xId, yId, metric, paramsKey, settingsKey],
  )

  const leverOpts = LEVER_KEYS.map((k) => ({ value: k, label: leverLabel(k) }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-3">
        <div role="tablist" aria-label="Explorer mode" className="flex rounded-md border border-line p-0.5">
          {(['1d', '2d'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1 text-[12px] font-medium transition-colors ${mode === m ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'}`}
            >
              {m === '1d' ? '1 lever' : '2 levers'}
            </button>
          ))}
        </div>

        {mode === '1d' ? (
          <>
            <Select label="Lever" value={leverId} options={leverOpts} onChange={setLeverId} />
            <Select label="Metric" value={metric} options={METRIC_OPTS} onChange={setMetric} />
            <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
              <input type="checkbox" checked={showHyst} onChange={(e) => setShowHyst(e.target.checked)} />
              Hysteresis overlay
            </label>
          </>
        ) : (
          <>
            <Select label="X lever" value={xId} options={leverOpts} onChange={setXId} />
            <Select label="Y lever" value={yId} options={leverOpts} onChange={setYId} />
            <Select label="Metric" value={metric} options={METRIC_OPTS} onChange={setMetric} />
          </>
        )}
        <span className="ml-auto text-[11px] text-muted">Click the chart to load those lever values →</span>
      </div>

      <div className="rounded-lg border border-line bg-surface p-4">
        {mode === '1d' ? (
          sweep1.error ? (
            <ErrorBox msg={sweep1.error} />
          ) : sweep1.result ? (
            <BifurcationChart
              sweep={sweep1.result}
              hysteresis={hyst.result}
              leverLabel={leverLabel(leverId)}
              metricLabel={METRIC_LABEL[metric]}
              onPick={(v) => setParam(leverId, v)}
            />
          ) : (
            <ChartSkeleton label="Computing bifurcation…" />
          )
        ) : sweep2.error ? (
          <ErrorBox msg={sweep2.error} />
        ) : sweep2.result ? (
          <HeatmapChart
            sweep={sweep2.result}
            xLabel={leverLabel(xId)}
            yLabel={leverLabel(yId)}
            metricLabel={METRIC_LABEL[metric]}
            onPick={(x, y) => {
              setParam(xId, x)
              setParam(yId, y)
            }}
          />
        ) : (
          <ChartSkeleton label="Computing tipping map (this runs off the main thread)…" />
        )}
      </div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="rounded-md border border-chilling/40 bg-chilling-soft p-3 text-[12px] text-chilling">
      Analysis failed: {msg}
    </div>
  )
}
