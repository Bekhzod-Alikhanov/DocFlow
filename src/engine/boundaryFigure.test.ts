/**
 * The checked-in figure must still be the one the model produces.
 *
 * A figure is the artefact a reader remembers, and it is the easiest thing in a project
 * to leave stale: nothing breaks when the model moves and the SVG does not. This
 * regenerates it and compares against `docs/figures/boundary.svg`.
 */
import { describe, it, expect } from 'vitest'
import checkedIn from '../../docs/figures/boundary.svg?raw'
import { renderBoundarySvg, computeFigureData } from './boundaryFigure'

/**
 * Rendered once. Each call runs 576 simulations, so a test that calls it twice spends
 * 6s and trips the default timeout — which is how these two first failed. Third time
 * this pattern has appeared in this suite; the fix is always to stop repeating the work.
 */
let cachedSvg: string | null = null
let cachedData: ReturnType<typeof computeFigureData> | null = null
const svgOnce = () => (cachedSvg ??= renderBoundarySvg())
const dataOnce = () => (cachedData ??= computeFigureData())

/**
 * Explicit, generous timeouts. Rendering is 576 simulations and v8 coverage
 * instrumentation makes that comfortably exceed the 5s default — which is how these
 * tests first failed, in CI only, after passing locally. The work is genuinely needed,
 * so the honest fix is to state the cost rather than to shrink the grid until the
 * figure stops being the figure.
 */
const HEAVY = 60_000

describe('the boundary figure is current', () => {
  it('matches what the engine renders today', () => {
    expect(
      svgOnce().trim(),
      'docs/figures/boundary.svg is stale. Run `npm run figures` and commit the result.',
    ).toBe(checkedIn.trim())
  }, HEAVY)
})

describe('the figure does not flatter the result', () => {
  it('declares the axis maximum it zoomed to', () => {
    // Zooming to [0, 0.2] is what makes the boundary visible at all, and it is exactly
    // the kind of choice that misleads if undeclared. The caption must say what happens
    // outside the frame.
    const svg = svgOnce()
    expect(svg).toContain('candour wins everywhere')
  }, HEAVY)

  it('states that nothing swept is measured', () => {
    const svg = svgOnce()
    expect(svg).toContain('T4')
    expect(svg).toContain('not a prediction')
  }, HEAVY)

  it('marks the dominant region explicitly rather than relying on colour', () => {
    // Colour alone fails for a reader with a colour-vision deficiency, and it fails in
    // greyscale print — which is where a paper figure often ends up.
    const svg = svgOnce()
    expect(svg).toContain('stroke="#b3261e"')
    const dominated = dataOnce().grid.flat().filter((p) => p.suppressionDominates).length
    expect(dominated).toBeGreaterThan(0)
    // Every dominated cell gets an outline.
    const outlines = (svg.match(/stroke="#b3261e"/g) ?? []).length
    expect(outlines).toBe(dominated)
  }, HEAVY)

  it('the full-range view is also generated, so the zoom can be checked', () => {
    // Over the whole swept box the region is a single cell. Shipping only the zoomed
    // figure would let a reader assume the region is as prominent as it looks.
    const full = computeFigureData({ maxWeight: 3, steps: 20 })
    const dominated = full.grid.flat().filter((p) => p.suppressionDominates).length
    expect(dominated).toBeGreaterThan(0)
    expect(dominated).toBeLessThan(5)
  }, HEAVY)

  it('is valid standalone SVG', () => {
    const svg = svgOnce()
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
    // No unescaped angle brackets from interpolated text.
    const body = svg.replace(/<[^>]+>/g, '')
    expect(body).not.toContain('<')
  }, HEAVY)
})
