/**
 * Regenerate the figures under docs/figures from the engine.
 *
 * Lives in tools/ rather than src/ because it is the one place a Node API is allowed:
 * the engine itself must stay dependency-free and DOM/Node-free (ADR/0010), and
 * `boundaryFigure.ts` returns an SVG string precisely so that writing it to disk is
 * somebody else's job.
 *
 *   npm run figures
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { renderBoundarySvg } from '../src/engine/boundaryFigure'

mkdirSync('docs/figures', { recursive: true })

const targets = [
  { file: 'docs/figures/boundary.svg', opts: {} },
  { file: 'docs/figures/boundary-full-range.svg', opts: { maxWeight: 3, steps: 20 } },
]

for (const t of targets) {
  const svg = renderBoundarySvg(t.opts)
  writeFileSync(t.file, svg, 'utf8')
  console.log(`wrote ${t.file} (${svg.length} bytes)`)
}
