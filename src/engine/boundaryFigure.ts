/**
 * The boundary result as a figure.
 *
 * Generated from the engine rather than drawn by hand, for the same reason every other
 * number in this project is generated: a figure in a paper is the artefact readers
 * actually remember, and a hand-drawn one drifts from the model the moment either
 * changes. `boundaryFigure.test.ts` regenerates it and fails if the checked-in SVG no
 * longer matches what the model produces.
 *
 * The plot is the (v_reg, v_fid) plane — the two exposure weights the argument turns on —
 * at a chosen `p_court`. Colour is the exposure penalty for candour: positive (red) means
 * suppression yields lower total exposure, negative (blue) means candour does. The
 * zero contour is the boundary itself.
 *
 * SVG, not a chart library: it goes into a paper, needs no runtime, and stays diffable.
 */
import { evaluateEnvironment, type BoundaryPoint } from './boundary'

export interface FigureOptions {
  /** Grid resolution per axis. */
  steps?: number
  /** Where to slice the p_court axis. The result is near-invariant in it. */
  pCourt?: number
  /** Upper bound of both weight axes. */
  maxWeight?: number
  width?: number
  height?: number
}

/**
 * `maxWeight` defaults to 0.2, not to the full swept range of 3.
 *
 * Over [0,3]^2 exactly ONE cell in 576 favours suppression, so the honest full-range
 * figure is a single red pixel in a corner — true, and useless to a reader. The
 * boundary lives at v_reg* = 0.084, so the plot is drawn where the sign change actually
 * happens. The axis maximum is stated in the caption precisely because zooming in on a
 * small region is the kind of choice that flatters a result if it is not declared:
 * beyond this range candour wins everywhere, which the caption says.
 */
const DEFAULTS = {
  steps: 24,
  pCourt: 0.5,
  maxWeight: 0.2,
  width: 720,
  height: 560,
} satisfies Required<FigureOptions>

export interface FigureData {
  grid: BoundaryPoint[][]
  vRegAxis: number[]
  vFidAxis: number[]
  maxPenalty: number
  minPenalty: number
}

export function computeFigureData(opts: FigureOptions = {}): FigureData {
  const o = { ...DEFAULTS, ...opts }
  const axis = Array.from({ length: o.steps }, (_, i) => (o.maxWeight * i) / (o.steps - 1))
  const grid: BoundaryPoint[][] = []
  let maxPenalty = -Infinity
  let minPenalty = Infinity
  for (const v_fid of axis) {
    const rowPoints: BoundaryPoint[] = []
    for (const v_reg of axis) {
      const pt = evaluateEnvironment({ p_court: o.pCourt, v_pl: 1, v_reg, v_fid })
      maxPenalty = Math.max(maxPenalty, pt.penaltyForCandour)
      minPenalty = Math.min(minPenalty, pt.penaltyForCandour)
      rowPoints.push(pt)
    }
    grid.push(rowPoints)
  }
  return { grid, vRegAxis: axis, vFidAxis: axis, maxPenalty, minPenalty }
}

/**
 * Diverging colour scale centred on zero — the boundary.
 *
 * Centring matters: a sequential scale would put the visually salient extreme at one end
 * of the data range, which for this figure is an arbitrary consequence of how far the
 * sweep happens to extend. What the reader needs to see is the sign change.
 */
function colour(penalty: number, span: number): string {
  const t = Math.max(-1, Math.min(1, penalty / span))
  if (t >= 0) {
    // Suppression favoured — warm.
    const k = Math.sqrt(t)
    return `rgb(${Math.round(255 - 40 * k)},${Math.round(238 - 150 * k)},${Math.round(230 - 190 * k)})`
  }
  // Candour favoured — cool.
  const k = Math.sqrt(-t)
  return `rgb(${Math.round(240 - 175 * k)},${Math.round(246 - 90 * k)},${Math.round(255 - 40 * k)})`
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function renderBoundarySvg(opts: FigureOptions = {}): string {
  const o = { ...DEFAULTS, ...opts }
  const data = computeFigureData(o)
  const { grid, vRegAxis, vFidAxis } = data

  const m = { top: 56, right: 190, bottom: 62, left: 74 }
  const plotW = o.width - m.left - m.right
  const plotH = o.height - m.top - m.bottom
  const cellW = plotW / vRegAxis.length
  const cellH = plotH / vFidAxis.length

  // Symmetric span so the colour scale is honest about the sign change rather than
  // saturating one side.
  const span = Math.max(Math.abs(data.maxPenalty), Math.abs(data.minPenalty)) || 1

  const x = (i: number) => m.left + i * cellW
  const y = (j: number) => m.top + plotH - (j + 1) * cellH

  const cells: string[] = []
  for (let j = 0; j < vFidAxis.length; j++) {
    for (let i = 0; i < vRegAxis.length; i++) {
      const pt = grid[j][i]
      cells.push(
        `<rect x="${x(i).toFixed(2)}" y="${y(j).toFixed(2)}" width="${(cellW + 0.5).toFixed(2)}" ` +
          `height="${(cellH + 0.5).toFixed(2)}" fill="${colour(pt.penaltyForCandour, span)}"/>`,
      )
    }
  }

  // Mark every cell where suppression actually wins. With the region this small, an
  // outline is more honest than relying on colour alone.
  const marks: string[] = []
  for (let j = 0; j < vFidAxis.length; j++) {
    for (let i = 0; i < vRegAxis.length; i++) {
      if (!grid[j][i].suppressionDominates) continue
      marks.push(
        `<rect x="${x(i).toFixed(2)}" y="${y(j).toFixed(2)}" width="${cellW.toFixed(2)}" ` +
          `height="${cellH.toFixed(2)}" fill="none" stroke="#b3261e" stroke-width="1.1"/>`,
      )
    }
  }

  // Ticks must adapt to the axis range: a fixed [0,1,2,3] leaves a 0.2-wide axis
  // labelled only "0".
  const tickStep = o.maxWeight <= 0.25 ? 0.05 : o.maxWeight <= 1 ? 0.2 : 1
  const decimals = tickStep < 0.1 ? 2 : tickStep < 1 ? 1 : 0
  const ticks = Array.from(
    { length: Math.floor(o.maxWeight / tickStep + 1e-9) + 1 },
    (_, i) => i * tickStep,
  )
  const xTicks = ticks
    .map((t) => {
      const px = m.left + (t / o.maxWeight) * plotW
      return (
        `<line x1="${px.toFixed(1)}" y1="${m.top + plotH}" x2="${px.toFixed(1)}" y2="${m.top + plotH + 5}" stroke="#5f6368"/>` +
        `<text x="${px.toFixed(1)}" y="${m.top + plotH + 19}" text-anchor="middle" font-size="12" fill="#3c4043">${t.toFixed(decimals)}</text>`
      )
    })
    .join('')
  const yTicks = ticks
    .map((t) => {
      const py = m.top + plotH - (t / o.maxWeight) * plotH
      return (
        `<line x1="${m.left - 5}" y1="${py.toFixed(1)}" x2="${m.left}" y2="${py.toFixed(1)}" stroke="#5f6368"/>` +
        `<text x="${m.left - 10}" y="${(py + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="#3c4043">${t.toFixed(decimals)}</text>`
      )
    })
    .join('')

  const dominated = grid.flat().filter((p) => p.suppressionDominates).length
  const total = grid.flat().length

  const legendX = m.left + plotW + 26
  const legendItems = [
    ['#e0532e', 'Suppression yields'],
    ['', 'lower total exposure'],
    ['', ''],
    ['#4192cf', 'Candour yields'],
    ['', 'lower total exposure'],
  ]
    .map(([c, label], i) => {
      const ly = m.top + 8 + i * 18
      const swatch = c ? `<rect x="${legendX}" y="${ly - 9}" width="12" height="12" fill="${c}" rx="2"/>` : ''
      const tx = c ? legendX + 18 : legendX
      return label
        ? `${swatch}<text x="${tx}" y="${ly}" font-size="11.5" fill="#3c4043">${esc(label)}</text>`
        : swatch
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}" font-family="Inter, Segoe UI, system-ui, sans-serif">
  <rect width="${o.width}" height="${o.height}" fill="#ffffff"/>
  <text x="${m.left}" y="26" font-size="15.5" font-weight="600" fill="#202124">Where suppression yields lower total exposure than candour</text>
  <text x="${m.left}" y="44" font-size="11.5" fill="#5f6368">${esc(
    `p_court = ${o.pCourt}, v_pl = 1 · suppression wins at ${dominated}/${total} points shown · beyond v_reg ≈ 0.09 candour wins everywhere`,
  )}</text>
  <text x="${m.left}" y="${o.height - 2}" font-size="10" fill="#80868b">${esc(
    'All four swept parameters are T4 — freely chosen, none measured. Conditional on stated assumptions; not a prediction.',
  )}</text>
  <g>${cells.join('')}</g>
  <g>${marks.join('')}</g>
  <rect x="${m.left}" y="${m.top}" width="${plotW}" height="${plotH}" fill="none" stroke="#9aa0a6"/>
  ${xTicks}${yTicks}
  <text x="${(m.left + plotW / 2).toFixed(1)}" y="${o.height - 16}" text-anchor="middle" font-size="12.5" fill="#202124">Regulatory exposure weight  v_reg  (relative to products liability)</text>
  <text x="18" y="${(m.top + plotH / 2).toFixed(1)}" text-anchor="middle" font-size="12.5" fill="#202124" transform="rotate(-90 18 ${(m.top + plotH / 2).toFixed(1)})">Fiduciary exposure weight  v_fid</text>
  ${legendItems}
  <text x="${legendX}" y="${m.top + 128}" font-size="11" fill="#5f6368">Red outline: suppression</text>
  <text x="${legendX}" y="${m.top + 143}" font-size="11" fill="#5f6368">strictly dominant</text>
  <text x="${legendX}" y="${m.top + 175}" font-size="11" fill="#5f6368">Not a prediction.</text>
  <text x="${legendX}" y="${m.top + 190}" font-size="11" fill="#5f6368">Conditional on stated</text>
  <text x="${legendX}" y="${m.top + 205}" font-size="11" fill="#5f6368">assumptions only.</text>
</svg>
`
}
