/**
 * Thin React wrapper around plotly.js (dist-min build). Avoids react-plotly.js to
 * sidestep React-19 peer-dependency friction. Themed from the CSS design tokens so
 * charts follow light/dark; responsive via Plotly's own resize handling.
 */
import Plotly from 'plotly.js-dist-min'
import type { Data, Layout, Config } from 'plotly.js'
import { useEffect, useRef } from 'react'
import { regimeColors } from './theme'

export interface PlotProps {
  data: Data[]
  layout?: Partial<Layout>
  config?: Partial<Config>
  className?: string
  style?: React.CSSProperties
  /** Accessible description of the chart (spec §5.10). */
  ariaLabel: string
}

function baseLayout(): Partial<Layout> {
  const c = regimeColors()
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter var, system-ui, sans-serif', size: 12, color: c.inkSoft },
    margin: { l: 52, r: 16, t: 28, b: 44 },
    xaxis: { gridcolor: c.line, zerolinecolor: c.line, linecolor: c.line, tickcolor: c.line },
    yaxis: { gridcolor: c.line, zerolinecolor: c.line, linecolor: c.line, tickcolor: c.line },
    legend: { orientation: 'h', y: -0.2, font: { size: 11 } },
    hovermode: 'x unified',
    colorway: [c.accent, c.learning, c.chilling, c.estimate, '#7a4fb0', '#0e7490'],
  }
}

const baseConfig: Partial<Config> = {
  responsive: true,
  displayModeBar: false,
  displaylogo: false,
}

export function Plot({ data, layout, config, className, style, ariaLabel }: PlotProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const merged: Partial<Layout> = { ...baseLayout(), ...layout }
    // Merge nested axis objects so callers can override partially.
    merged.xaxis = { ...baseLayout().xaxis, ...layout?.xaxis }
    merged.yaxis = { ...baseLayout().yaxis, ...layout?.yaxis }
    void Plotly.react(el, data, merged, { ...baseConfig, ...config })
  }, [data, layout, config])

  useEffect(() => {
    const el = ref.current
    return () => {
      if (el) Plotly.purge(el)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
      role="img"
      aria-label={ariaLabel}
    />
  )
}
