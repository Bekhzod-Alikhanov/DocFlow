/**
 * Plotly implementation (the heavy half). This module statically imports
 * plotly.js-dist-min (~1.4 MB) and is therefore loaded lazily via `lib/Plot.tsx`
 * so Plotly lands in its own chunk, out of the initial bundle.
 *
 * Thin wrapper around plotly.js: themed from the CSS design tokens so charts track
 * light/dark, responsive via Plotly's own resize handling. `onReady` hands the
 * graph div back to callers that need it for PNG/PDF export (`Plotly.toImage`).
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
  /** Receives the graph div once Plotly has rendered (used for image export). */
  onReady?: (gd: HTMLDivElement) => void
  /** Fired when a data point is clicked (used for click-to-load in the explorer). */
  onClick?: (e: PlotClickEvent) => void
}

/** Minimal shape of a Plotly click event (avoids importing Plotly's event types). */
export interface PlotClickEvent {
  points: Array<{ x: number; y: number; pointIndex?: number; curveNumber?: number }>
}

interface PlotlyEmitter {
  on?: (ev: string, cb: (e: PlotClickEvent) => void) => void
  removeAllListeners?: (ev: string) => void
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

export default function PlotImpl({ data, layout, config, className, style, ariaLabel, onReady, onClick }: PlotProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const merged: Partial<Layout> = { ...baseLayout(), ...layout }
    // Merge nested axis objects so callers can override partially.
    merged.xaxis = { ...baseLayout().xaxis, ...layout?.xaxis }
    merged.yaxis = { ...baseLayout().yaxis, ...layout?.yaxis }
    void Plotly.react(el, data, merged, { ...baseConfig, ...config }).then(() => {
      onReady?.(el)
      if (onClick) {
        const gd = el as unknown as PlotlyEmitter
        gd.removeAllListeners?.('plotly_click')
        gd.on?.('plotly_click', onClick)
      }
    })
  }, [data, layout, config, onReady, onClick])

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
