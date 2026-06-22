/**
 * Time-series chart for the six stocks and key auxiliaries (spec §5.2). 0–1 indices
 * (f_doc, culture) share the left axis; counts/indices use the right axis. When
 * Monte Carlo is on, 10–90 percentile bands are overlaid (uncertainty-by-default
 * nudge, spec §4.2).
 */
import { useMemo } from 'react'
import type { Data } from 'plotly.js'
import { Plot } from '../lib/Plot'
import { useStore } from '../state/store'
import { monteCarlo, LEVER_KEYS, STOCK_KEYS, type MonteCarloResult, type Trajectory } from '../engine'
import { STOCK_COLORS } from '../lib/theme'
import { setPrimaryGd } from '../lib/chartRegistry'

const LABELS: Record<string, string> = {
  U: 'Undocumented', D: 'Documented', TD: 'Tech debt', L: 'Learning', E: 'Exposure', C: 'Culture',
  f_doc: 'Doc. fraction', harm_events: 'Harm events',
}
const UNIT_INTERVAL = new Set(['f_doc', 'C'])

/** Extract a series (stock or auxiliary) from a trajectory by key. */
function seriesValues(traj: Trajectory, key: string): number[] {
  const isStock = (STOCK_KEYS as readonly string[]).includes(key)
  return isStock
    ? traj.states.map((s) => (s as unknown as Record<string, number>)[key])
    : traj.aux.map((a) => (a as unknown as Record<string, number>)[key])
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function TimeSeriesChart({
  seriesKeys,
  height = 340,
  title,
  overlay,
}: {
  seriesKeys: string[]
  height?: number
  title?: string
  /** A second trajectory (scenario B) drawn dashed/faded for comparison. */
  overlay?: { trajectory: Trajectory; label: string }
}) {
  const trajectory = useStore((s) => s.trajectory)
  const params = useStore((s) => s.params)
  const init = useStore((s) => s.init)
  const settings = useStore((s) => s.settings)
  const showMonteCarlo = useStore((s) => s.showMonteCarlo)

  const mc: MonteCarloResult | null = useMemo(() => {
    if (!showMonteCarlo) return null
    return monteCarlo(params, init, {
      n: 120,
      seed: 4242,
      distribution: 'uniform',
      vary: [...LEVER_KEYS],
      percentiles: [10, 50, 90],
      settings,
    })
  }, [showMonteCarlo, params, init, settings])

  // Monte Carlo bands and the comparison overlay are mutually exclusive (both
  // would be visual overload); the overlay wins when present.
  const effectiveMc = overlay ? null : mc

  const data = useMemo<Data[]>(() => {
    const t = trajectory.t
    const traces: Data[] = []
    for (const key of seriesKeys) {
      const onUnitAxis = UNIT_INTERVAL.has(key)
      const color = STOCK_COLORS[key] ?? '#3a4fb0'
      const values = seriesValues(trajectory, key)
      const mc = effectiveMc

      if (mc && mc.bands[key]) {
        const yUpper = mc.bands[key][90]
        const yLower = mc.bands[key][10]
        traces.push({
          x: [...t, ...[...t].reverse()],
          y: [...yUpper, ...[...yLower].reverse()],
          fill: 'toself',
          fillcolor: hexToRgba(color, 0.13),
          line: { color: 'rgba(0,0,0,0)' },
          hoverinfo: 'skip',
          showlegend: false,
          yaxis: onUnitAxis ? 'y' : 'y2',
          name: `${LABELS[key]} 10–90%`,
        } as Data)
      }

      traces.push({
        x: t,
        y: values,
        type: 'scatter',
        mode: 'lines',
        name: LABELS[key] ?? key,
        line: { color, width: 2, dash: mc ? 'dot' : 'solid' },
        yaxis: onUnitAxis ? 'y' : 'y2',
      } as Data)

      if (mc && mc.bands[key]) {
        traces.push({
          x: t,
          y: mc.bands[key][50],
          type: 'scatter',
          mode: 'lines',
          name: `${LABELS[key]} median`,
          line: { color, width: 2 },
          yaxis: onUnitAxis ? 'y' : 'y2',
          showlegend: false,
        } as Data)
      }
    }

    if (overlay) {
      const tb = overlay.trajectory.t
      for (const key of seriesKeys) {
        const onUnitAxis = UNIT_INTERVAL.has(key)
        const color = STOCK_COLORS[key] ?? '#3a4fb0'
        traces.push({
          x: tb,
          y: seriesValues(overlay.trajectory, key),
          type: 'scatter',
          mode: 'lines',
          name: `${LABELS[key] ?? key} · ${overlay.label}`,
          line: { color, width: 2, dash: 'dash' },
          opacity: 0.55,
          yaxis: onUnitAxis ? 'y' : 'y2',
        } as Data)
      }
    }

    return traces
  }, [trajectory, seriesKeys, effectiveMc, overlay])

  const anyUnit = seriesKeys.some((k) => UNIT_INTERVAL.has(k))
  const anyOther = seriesKeys.some((k) => !UNIT_INTERVAL.has(k))

  return (
    <div style={{ height }}>
      <Plot
        ariaLabel={`Time series of ${seriesKeys.map((k) => LABELS[k] ?? k).join(', ')} over months`}
        data={data}
        onReady={setPrimaryGd}
        layout={{
          title: title ? { text: title, font: { size: 13 } } : undefined,
          xaxis: { title: { text: 'Months' } },
          yaxis: anyUnit ? { title: { text: '0–1 indices' }, range: [0, 1.02], side: 'left' } : { visible: false },
          yaxis2: anyOther
            ? { title: { text: 'counts / indices' }, overlaying: 'y', side: 'right', rangemode: 'tozero' }
            : undefined,
        }}
      />
    </div>
  )
}
