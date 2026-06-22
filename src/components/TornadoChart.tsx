/**
 * Tornado chart (spec §3.6, §5.5): one-at-a-time swings. Each parameter is a
 * horizontal bar spanning the output at its min vs max (others held at base),
 * sorted by swing magnitude. A reference line marks the base-case output.
 */
import { useMemo } from 'react'
import type { Data } from 'plotly.js'
import { Plot } from '../lib/Plot'
import type { TornadoBar } from '../engine'
import { regimeColors } from '../lib/theme'

export function TornadoChart({
  bars,
  labelOf,
  outputLabel,
}: {
  bars: TornadoBar[]
  labelOf: (key: string) => string
  outputLabel: string
}) {
  const { data, baseOut } = useMemo(() => {
    const c = regimeColors()
    // Plotly stacks from the bottom, so reverse to put the biggest swing on top.
    const ordered = [...bars].reverse()
    const y = ordered.map((b) => labelOf(b.key))
    const left = ordered.map((b) => Math.min(b.low, b.high))
    const width = ordered.map((b) => Math.abs(b.high - b.low))
    const base = ordered.length ? ordered[0].base : 0
    const trace: Data = {
      type: 'bar',
      orientation: 'h',
      x: width,
      base: left,
      y,
      marker: { color: c.accent },
      hovertext: ordered.map(
        (b) => `${labelOf(b.key)}<br>low: ${b.low.toFixed(3)}<br>high: ${b.high.toFixed(3)}<br>swing: ${b.swing.toFixed(3)}`,
      ),
      hoverinfo: 'text',
      name: 'swing',
    } as Data
    return { data: [trace], baseOut: base }
  }, [bars, labelOf])

  return (
    <div style={{ height: Math.max(220, bars.length * 34 + 80) }}>
      <Plot
        ariaLabel={`Tornado chart of ${outputLabel}: parameters ranked by how much swinging them min-to-max moves the output.`}
        data={data}
        layout={{
          xaxis: { title: { text: outputLabel } },
          yaxis: { automargin: true },
          shapes: [
            {
              type: 'line',
              x0: baseOut,
              x1: baseOut,
              y0: 0,
              y1: 1,
              yref: 'paper',
              line: { color: regimeColors().muted, width: 1, dash: 'dot' },
            },
          ],
        }}
      />
    </div>
  )
}
