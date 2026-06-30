// src/views/Tabletop/BoundaryVisualizer.tsx
/**
 * BoundaryVisualizer — inline SVG showing the Ch.2 professional boundary handoff chain:
 *   Engineer → Safety → Legal → Board
 * A fidelity bar whose width = signal_fidelity% tracks how much signal survives the chain.
 */
import { useTabletopStore } from '../../state/tabletopStore'

const STATIONS = ['Engineer', 'Safety', 'Legal', 'Board'] as const

const TRACK_W = 480
const TRACK_H = 56
const BAR_Y = 28
const BAR_H = 14
const LABEL_Y = 16
const SVG_W = TRACK_W + 40 // 20px padding each side
const SVG_H = TRACK_H + 24

export function BoundaryVisualizer() {
  const fidelity = useTabletopStore((s) => s.runState.incident.signal_fidelity)
  const pct = Math.max(0, Math.min(100, fidelity))
  const barWidth = (pct / 100) * TRACK_W
  const ariaLabel = `Signal fidelity ${Math.round(pct)} of 100 across four professional boundaries`

  // Station X positions spread evenly across the track
  const stationXs = STATIONS.map((_, i) => 20 + (i / (STATIONS.length - 1)) * TRACK_W)

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      aria-label={ariaLabel}
      role="img"
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {/* Track background */}
      <rect
        x={20}
        y={BAR_Y}
        width={TRACK_W}
        height={BAR_H}
        rx={7}
        fill="currentColor"
        opacity={0.12}
      />

      {/* Fidelity bar */}
      <rect
        x={20}
        y={BAR_Y}
        width={barWidth}
        height={BAR_H}
        rx={7}
        fill="currentColor"
        opacity={0.7}
      />

      {/* Station markers and labels */}
      {STATIONS.map((name, i) => (
        <g key={name} transform={`translate(${stationXs[i]}, 0)`}>
          {/* Tick mark */}
          <line
            x1={0}
            y1={BAR_Y - 2}
            x2={0}
            y2={BAR_Y + BAR_H + 2}
            stroke="currentColor"
            strokeWidth={1.5}
            opacity={0.5}
          />
          {/* Station label — real text node for a11y and test assertions */}
          <text
            x={0}
            y={LABEL_Y}
            textAnchor="middle"
            fontSize={12}
            fontFamily="inherit"
            fill="currentColor"
          >
            {name}
          </text>
          {/* Percentage label below bar for last station (fidelity endpoint) */}
          {i === STATIONS.length - 1 && (
            <text
              x={0}
              y={BAR_Y + BAR_H + 16}
              textAnchor="end"
              fontSize={11}
              fontFamily="inherit"
              fill="currentColor"
              opacity={0.75}
            >
              {Math.round(pct)}%
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
