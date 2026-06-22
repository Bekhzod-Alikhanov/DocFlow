/**
 * Hand-drawn causal-loop diagram (spec §5.3). No graph library: a small fixed
 * topology of six constructs and three loops (R1 suppression spiral, R2 learning
 * flywheel, B harm-driven remediation). Each edge's opacity and width are driven by
 * the live `LoopActivity` shares, so the dominant loop visibly "lights up" and the
 * picture updates on every slider drag. Motion is CSS-transitioned and therefore
 * auto-disabled under `prefers-reduced-motion` (see index.css).
 */
import type { LoopActivity, LoopId } from '../lib/loops'
import { dominantLoop, LOOP_LABEL } from '../lib/loops'
import type { Regime } from '../engine'

interface Node {
  id: string
  x: number
  y: number
  label: string
  sub?: string
}

interface Edge {
  from: string
  to: string
  loop: LoopId
  sign: '+' | '−'
  /** Perpendicular curvature offset (px); sign picks the bow direction. */
  curve: number
}

const NODES: Node[] = [
  { id: 'FEAR', x: 120, y: 160, label: 'Legal / PR', sub: 'fear' },
  { id: 'DOC', x: 380, y: 86, label: 'Documentation', sub: 'f_doc' },
  { id: 'CULTURE', x: 645, y: 150, label: 'Safety', sub: 'culture' },
  { id: 'LEARN', x: 648, y: 300, label: 'Learning' },
  { id: 'DEBT', x: 120, y: 322, label: 'Undocumented', sub: 'debt' },
  { id: 'HARM', x: 380, y: 392, label: 'Harm events' },
]

const EDGES: Edge[] = [
  // R1 — suppression spiral (reinforcing): (−)(−)(+) = +
  { from: 'FEAR', to: 'DOC', loop: 'r1', sign: '−', curve: 26 },
  { from: 'DOC', to: 'DEBT', loop: 'r1', sign: '−', curve: 70 },
  { from: 'DEBT', to: 'FEAR', loop: 'r1', sign: '+', curve: 24 },
  // R2 — learning flywheel (reinforcing): (+)(+)(+) = +
  { from: 'DOC', to: 'CULTURE', loop: 'r2', sign: '+', curve: 26 },
  { from: 'CULTURE', to: 'LEARN', loop: 'r2', sign: '+', curve: 24 },
  { from: 'LEARN', to: 'DOC', loop: 'r2', sign: '+', curve: 78 },
  // B — harm-driven remediation (balancing): (+)(−) = −
  { from: 'HARM', to: 'DOC', loop: 'balancing', sign: '+', curve: 60 },
  { from: 'DOC', to: 'HARM', loop: 'balancing', sign: '−', curve: 60 },
]

const LOOP_COLOR: Record<LoopId, string> = {
  r1: 'var(--color-chilling, #b3402e)',
  r2: 'var(--color-learning, #1f7a5a)',
  balancing: 'var(--color-estimate, #9a6b13)',
}

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>

interface Pt {
  x: number
  y: number
}

function unit(dx: number, dy: number): Pt {
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

/** Quadratic curve between two node centers, trimmed off each node box. */
function geom(a: Node, b: Node, curve: number) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const d = unit(b.x - a.x, b.y - a.y)
  const n = { x: -d.y, y: d.x } // perpendicular
  const ctrl = { x: mx + n.x * curve, y: my + n.y * curve }

  const inset = 46
  const sa = unit(ctrl.x - a.x, ctrl.y - a.y)
  const start = { x: a.x + sa.x * inset, y: a.y + sa.y * inset }
  const eb = unit(ctrl.x - b.x, ctrl.y - b.y)
  const end = { x: b.x + eb.x * inset, y: b.y + eb.y * inset }

  // Arrowhead pointing from control toward the (trimmed) end.
  const ad = unit(end.x - ctrl.x, end.y - ctrl.y)
  const size = 9
  const left = { x: end.x - ad.x * size - ad.y * (size * 0.6), y: end.y - ad.y * size + ad.x * (size * 0.6) }
  const right = { x: end.x - ad.x * size + ad.y * (size * 0.6), y: end.y - ad.y * size - ad.x * (size * 0.6) }
  // Sign badge placed a little before the arrowhead.
  const badge = { x: end.x - ad.x * 22, y: end.y - ad.y * 22 }

  return {
    d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
    head: `${end.x},${end.y} ${left.x},${left.y} ${right.x},${right.y}`,
    badge,
  }
}

export interface CausalLoopDiagramProps {
  activity: LoopActivity
  regime: Regime
}

export function CausalLoopDiagram({ activity, regime }: CausalLoopDiagramProps) {
  const dom = dominantLoop(activity)
  const share: Record<LoopId, number> = { r1: activity.r1, r2: activity.r2, balancing: activity.balancing }
  const ariaLabel = `Causal-loop diagram. Currently dominant: ${LOOP_LABEL[dom]} (regime: ${regime}).`

  return (
    <svg
      viewBox="0 0 768 448"
      width="100%"
      role="img"
      aria-label={ariaLabel}
      style={{ maxHeight: 460 }}
    >
      {/* edges */}
      {EDGES.map((e, i) => {
        const a = NODE_BY_ID[e.from]
        const b = NODE_BY_ID[e.to]
        const g = geom(a, b, e.curve)
        const s = share[e.loop]
        const opacity = 0.18 + 0.8 * s
        const width = e.loop === dom ? 3 : 1.6
        const color = LOOP_COLOR[e.loop]
        return (
          <g key={i} style={{ transition: 'opacity .4s ease, stroke-width .4s ease', opacity }}>
            <path d={g.d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
            <polygon points={g.head} fill={color} />
            <circle cx={g.badge.x} cy={g.badge.y} r={7} fill="var(--color-surface, #fff)" stroke={color} strokeWidth={1} />
            <text
              x={g.badge.x}
              y={g.badge.y + 3.2}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={color}
            >
              {e.sign}
            </text>
          </g>
        )
      })}

      {/* loop labels at rough centroids */}
      {(
        [
          { id: 'r1' as LoopId, x: 210, y: 250 },
          { id: 'r2' as LoopId, x: 556, y: 244 },
          { id: 'balancing' as LoopId, x: 470, y: 250 },
        ]
      ).map((l) => (
        <text
          key={l.id}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fontSize={11}
          fontWeight={l.id === dom ? 700 : 500}
          fill={LOOP_COLOR[l.id]}
          style={{ transition: 'opacity .4s ease', opacity: 0.4 + 0.6 * share[l.id] }}
        >
          {l.id === 'balancing' ? 'B' : l.id.toUpperCase()}
        </text>
      ))}

      {/* nodes */}
      {NODES.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x - 66}
            y={n.y - 23}
            width={132}
            height={46}
            rx={10}
            fill="var(--color-surface, #fff)"
            stroke="var(--color-line, #e7e2d9)"
            strokeWidth={1.5}
          />
          <text x={n.x} y={n.sub ? n.y - 2 : n.y + 4} textAnchor="middle" fontSize={12.5} fontWeight={600} fill="var(--color-ink, #1a1714)">
            {n.label}
          </text>
          {n.sub && (
            <text x={n.x} y={n.y + 14} textAnchor="middle" fontSize={11} fill="var(--color-muted, #8a8178)">
              {n.sub}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
