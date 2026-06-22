/**
 * 1-lever bifurcation diagram (spec §3.3, §5.4). Plots the chosen metric of every
 * equilibrium as a lever is swept: stable branches solid, unstable/saddle branches
 * dashed, fold/tipping values marked with vertical rules. An optional hysteresis
 * overlay shows the up/down continuation branches (path dependence). Clicking
 * anywhere loads that lever value into the working scenario.
 */
import { useMemo } from 'react'
import type { Data } from 'plotly.js'
import { Plot, type PlotClickEvent } from '../lib/Plot'
import type { Sweep1DResult, HysteresisResult } from '../engine'
import { regimeColors } from '../lib/theme'

export function BifurcationChart({
  sweep,
  hysteresis,
  leverLabel,
  metricLabel,
  onPick,
}: {
  sweep: Sweep1DResult
  hysteresis?: HysteresisResult | null
  leverLabel: string
  metricLabel: string
  onPick?: (value: number) => void
}) {
  const data = useMemo<Data[]>(() => {
    const c = regimeColors()
    const traces: Data[] = []

    // Scatter the stable / unstable equilibrium points (a branch can fork, so we
    // emit per-point markers rather than assuming a single line).
    const stableX: number[] = []
    const stableY: number[] = []
    const unstableX: number[] = []
    const unstableY: number[] = []
    for (const p of sweep.points) {
      for (const y of p.stable) {
        stableX.push(p.value)
        stableY.push(y)
      }
      for (const y of p.unstable) {
        unstableX.push(p.value)
        unstableY.push(y)
      }
    }
    traces.push({
      x: stableX,
      y: stableY,
      type: 'scatter',
      mode: 'markers',
      name: 'Stable equilibria',
      marker: { color: c.learning, size: 5 },
    } as Data)
    if (unstableX.length) {
      traces.push({
        x: unstableX,
        y: unstableY,
        type: 'scatter',
        mode: 'markers',
        name: 'Unstable / saddle',
        marker: { color: c.chilling, size: 5, symbol: 'circle-open' },
      } as Data)
    }

    if (hysteresis) {
      traces.push({
        x: hysteresis.up.map((u) => u.value),
        y: hysteresis.up.map((u) => u.metric),
        type: 'scatter',
        mode: 'lines',
        name: 'Ramp up →',
        line: { color: c.accent, width: 2 },
      } as Data)
      traces.push({
        x: hysteresis.down.map((d) => d.value),
        y: hysteresis.down.map((d) => d.metric),
        type: 'scatter',
        mode: 'lines',
        name: '← Ramp down',
        line: { color: c.estimate, width: 2, dash: 'dash' },
      } as Data)
    }
    return traces
  }, [sweep, hysteresis])

  const shapes = useMemo(
    () =>
      sweep.tippingValues.map((v) => ({
        type: 'line' as const,
        x0: v,
        x1: v,
        y0: 0,
        y1: 1,
        yref: 'paper' as const,
        line: { color: regimeColors().muted, width: 1, dash: 'dot' as const },
      })),
    [sweep],
  )

  const handleClick = onPick
    ? (e: PlotClickEvent) => {
        const x = e.points?.[0]?.x
        if (typeof x === 'number') onPick(x)
      }
    : undefined

  return (
    <div style={{ height: 360 }}>
      <Plot
        ariaLabel={`Bifurcation diagram of ${metricLabel} as ${leverLabel} varies, with ${sweep.tippingValues.length} tipping point(s).`}
        data={data}
        onClick={handleClick}
        layout={{
          shapes,
          xaxis: { title: { text: leverLabel } },
          yaxis: { title: { text: metricLabel } },
          legend: { orientation: 'h', y: -0.22 },
        }}
      />
    </div>
  )
}
