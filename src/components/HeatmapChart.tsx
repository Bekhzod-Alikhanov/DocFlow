/**
 * 2-lever tipping heatmap (spec §3.3, §5.4). Colors the settled metric across a
 * grid of two levers; a contour-ish overlay is implied by the colorscale. Clicking
 * a cell loads that (x, y) lever pair into the working scenario.
 */
import { useMemo } from 'react'
import type { Data } from 'plotly.js'
import { Plot, type PlotClickEvent } from '../lib/Plot'
import type { Sweep2DResult } from '../engine'

export function HeatmapChart({
  sweep,
  xLabel,
  yLabel,
  metricLabel,
  onPick,
}: {
  sweep: Sweep2DResult
  xLabel: string
  yLabel: string
  metricLabel: string
  onPick?: (x: number, y: number) => void
}) {
  const data = useMemo<Data[]>(
    () => [
      {
        x: sweep.xs,
        y: sweep.ys,
        z: sweep.z,
        type: 'heatmap',
        colorscale: 'RdYlGn',
        reversescale: sweep.metric === 'TD' || sweep.metric === 'E', // high debt/exposure = bad = red
        colorbar: { title: { text: metricLabel }, thickness: 12 },
        hovertemplate: `${xLabel}: %{x:.2f}<br>${yLabel}: %{y:.2f}<br>${metricLabel}: %{z:.3f}<extra></extra>`,
      } as Data,
    ],
    [sweep, xLabel, yLabel, metricLabel],
  )

  const handleClick = onPick
    ? (e: PlotClickEvent) => {
        const p = e.points?.[0]
        if (p && typeof p.x === 'number' && typeof p.y === 'number') onPick(p.x, p.y)
      }
    : undefined

  return (
    <div style={{ height: 380 }}>
      <Plot
        ariaLabel={`Heatmap of settled ${metricLabel} across ${xLabel} and ${yLabel}.`}
        data={data}
        onClick={handleClick}
        layout={{
          xaxis: { title: { text: xLabel } },
          yaxis: { title: { text: yLabel } },
        }}
      />
    </div>
  )
}
