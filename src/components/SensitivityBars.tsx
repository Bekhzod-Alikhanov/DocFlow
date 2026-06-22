/**
 * Generic grouped/diverging bar chart for sensitivity indices. Used for Sobol
 * (first-order S1 + total-effect ST, two grouped series) and PRCC (one signed
 * series). Presentational — the view computes the numbers.
 */
import { useMemo } from 'react'
import type { Data } from 'plotly.js'
import { Plot } from '../lib/Plot'
import { regimeColors } from '../lib/theme'

export interface BarSeries {
  name: string
  values: number[]
  color?: string
}

export function SensitivityBars({
  labels,
  series,
  yTitle,
  ariaLabel,
  height = 320,
  range,
}: {
  labels: string[]
  series: BarSeries[]
  yTitle: string
  ariaLabel: string
  height?: number
  range?: [number, number]
}) {
  const data = useMemo<Data[]>(
    () =>
      series.map(
        (s) =>
          ({
            x: labels,
            y: s.values,
            type: 'bar',
            name: s.name,
            marker: s.color ? { color: s.color } : undefined,
          }) as Data,
      ),
    [labels, series],
  )

  return (
    <div style={{ height }}>
      <Plot
        ariaLabel={ariaLabel}
        data={data}
        layout={{
          barmode: 'group',
          yaxis: { title: { text: yTitle }, range, zeroline: true, zerolinecolor: regimeColors().line },
          xaxis: { automargin: true },
          legend: { orientation: 'h', y: -0.25 },
        }}
      />
    </div>
  )
}
