/**
 * A/B scenario comparison (spec §5.4). Snapshot the current working scenario (A)
 * into the frozen B slot, or load a saved scenario as B, then read the delta table
 * and an overlaid time-series. B is a snapshot in the store — editing A's levers
 * never disturbs it.
 */
import { useStore } from '../state/store'
import { TimeSeriesChart } from '../components/TimeSeriesChart'
import { listScenarios } from '../lib/persistence'
import { fmt, REGIME_LABEL } from '../lib/format'
import type { SummaryMetrics } from '../engine'

interface Row {
  label: string
  get: (s: SummaryMetrics) => number
  digits?: number
}
const ROWS: Row[] = [
  { label: 'Documentation fraction', get: (s) => s.finalFdoc, digits: 3 },
  { label: 'Technical debt', get: (s) => s.finalState.TD },
  { label: 'Learning', get: (s) => s.finalState.L, digits: 3 },
  { label: 'Culture', get: (s) => s.finalState.C, digits: 3 },
  { label: 'Cumulative exposure', get: (s) => s.cumulativeExposure },
  { label: 'Cumulative harm', get: (s) => s.cumulativeHarm },
  { label: 'Time to tip (months)', get: (s) => s.timeToTip ?? NaN },
]

function deltaPct(a: number, b: number): string {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return '—'
  if (a === 0) return b === 0 ? '0%' : '—'
  const d = ((b - a) / Math.abs(a)) * 100
  return `${d > 0 ? '+' : ''}${d.toFixed(0)}%`
}
function deltaAbs(a: number, b: number): string {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return '—'
  const d = b - a
  return `${d > 0 ? '+' : ''}${fmt(d, 3)}`
}

export function CompareView() {
  const summaryA = useStore((s) => s.summary)
  const nameA = useStore((s) => s.scenarioName)
  const scenarioB = useStore((s) => s.scenarioB)
  const captureBFromA = useStore((s) => s.captureBFromA)
  const clearScenarioB = useStore((s) => s.clearScenarioB)
  const setScenarioB = useStore((s) => s.setScenarioB)

  const saved = listScenarios() // cheap localStorage read; re-run on each render is fine

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3">
        <button
          type="button"
          onClick={captureBFromA}
          className="rounded-md border border-accent bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent hover:bg-accent hover:text-white"
        >
          Capture current as B
        </button>
        <label className="flex items-center gap-1.5 text-[11px] text-muted">
          or load saved as B
          <select
            value=""
            onChange={(e) => {
              const sc = saved.find((s) => s.id === e.target.value)
              if (sc) setScenarioB({ params: sc.params, init: sc.init, settings: sc.settings, name: sc.name, presetId: sc.presetId })
            }}
            className="rounded-md border border-line bg-surface px-2 py-1 text-[12px] text-ink"
          >
            <option value="">— select —</option>
            {saved.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {scenarioB && (
          <button
            type="button"
            onClick={clearScenarioB}
            className="ml-auto rounded-md border border-line px-3 py-1 text-[12px] text-ink-soft hover:border-chilling hover:text-chilling"
          >
            Clear B
          </button>
        )}
      </div>

      {!scenarioB ? (
        <div role="status" className="rounded-md border border-line bg-surface p-6 text-center text-[13px] text-muted">
          Capture the current scenario (or load a saved one) as <strong>B</strong> to compare it against the live
          scenario <strong>A</strong>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full border-collapse text-[12px]">
              <caption className="border-b border-line bg-paper px-3 py-2 text-left text-[13px] font-semibold text-ink">
                Delta table
              </caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="px-3 py-1.5 font-medium">Metric</th>
                  <th className="px-3 py-1.5 text-right font-medium">A · {nameA}</th>
                  <th className="px-3 py-1.5 text-right font-medium">B · {scenarioB.scenarioName}</th>
                  <th className="px-3 py-1.5 text-right font-medium">Δ</th>
                  <th className="px-3 py-1.5 text-right font-medium">%Δ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line/60">
                  <td className="px-3 py-1.5 text-ink-soft">Regime</td>
                  <td className="px-3 py-1.5 text-right text-ink">{REGIME_LABEL[summaryA.regime]}</td>
                  <td className="px-3 py-1.5 text-right text-ink">{REGIME_LABEL[scenarioB.summary.regime]}</td>
                  <td className="px-3 py-1.5 text-right text-muted" colSpan={2}>
                    {summaryA.regime === scenarioB.summary.regime ? 'same' : 'changed'}
                  </td>
                </tr>
                {ROWS.map((r) => {
                  const a = r.get(summaryA)
                  const b = r.get(scenarioB.summary)
                  return (
                    <tr key={r.label} className="border-b border-line/60 last:border-0">
                      <td className="px-3 py-1.5 text-ink-soft">{r.label}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink">{Number.isFinite(a) ? fmt(a, r.digits) : '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink">{Number.isFinite(b) ? fmt(b, r.digits) : '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-soft">{deltaAbs(a, b)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-soft">{deltaPct(a, b)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-line bg-surface p-4">
            <h3 className="m-0 mb-2 text-[13px] font-semibold text-ink">A (solid) vs B (dashed)</h3>
            <TimeSeriesChart
              seriesKeys={['f_doc', 'C', 'TD']}
              overlay={{ trajectory: scenarioB.trajectory, label: scenarioB.scenarioName }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
