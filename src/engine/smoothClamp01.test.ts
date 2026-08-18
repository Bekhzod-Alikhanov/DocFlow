/**
 * V5.1 — observed RK4 order ≥ 3.8 on every shipped preset, and the smoothness repair
 * that made it achievable (M2 acceptance).
 *
 * Until this landed, the integration order was MEASURED AND LOGGED but never asserted:
 * `diagnostics.test.ts` printed `observedOrder=…` and then ran `expect(true).toBe(true)`.
 * A number in CI output that nothing checks is not a gate, and the numbers it was
 * printing were bad — 1.4 and 1.6 on two presets and a meaningless −3.9 on a third,
 * against RK4's theoretical 4.
 *
 * The cause was `clamp01` on `cultureTarget`. The five learning presets sit at a raw
 * target near 3.4 and clamp high on every step, so they never see the corner and scored
 * a clean 4.1. The three chilling presets hover in [−0.27, 0.31] and cross it
 * constantly. That is not an edge case — it is the regime the model exists to reason
 * about, so the two presets integrating worst were the two that matter most.
 */
import { describe, it, expect } from 'vitest'
import { integrate } from './simulate'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESETS } from './presets'
import { STOCK_KEYS } from './types'
import { smoothClamp01, softplus } from './model'

const hardClamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Richardson: order = log2(err(2h) / err(h)) against a much finer reference. */
function observedOrder(presetId: string): { order: number; err: number } {
  const preset = PRESETS.find((p) => p.id === presetId)!
  const p = paramsFromPreset(preset)
  const i = initFromPreset(preset)
  const ref = integrate(i, p, { horizon: 120, dt: 0.015625, solver: 'rk4' })
  const err = (dt: number) => {
    const t = integrate(i, p, { horizon: 120, dt, solver: 'rk4' })
    const a = t.states[t.states.length - 1]
    const b = ref.states[ref.states.length - 1]
    return Math.sqrt(STOCK_KEYS.reduce((acc, k) => acc + (a[k] - b[k]) ** 2, 0))
  }
  const coarse = err(0.25)
  const fine = err(0.125)
  return { order: Math.log2(coarse / fine), err: coarse }
}

describe('V5.1 — RK4 achieves its theoretical order on every shipped preset', () => {
  for (const preset of PRESETS) {
    it(`${preset.id}: observed order ≥ 3.8`, () => {
      const { order, err } = observedOrder(preset.id)
      // An order computed from errors at the round-off floor is meaningless. None of
      // the presets is anywhere near it (smallest coarse error ~7e-7), but assert it
      // so a future change that quietly converges to nothing cannot pass this gate.
      expect(err, `${preset.id}: error is at the noise floor; the order is not measurable`)
        .toBeGreaterThan(1e-12)
      expect(order, `${preset.id}: observed RK4 order ${order.toFixed(2)}, want ≥ 3.8`)
        .toBeGreaterThanOrEqual(3.8)
    })
  }
})

describe('smoothClamp01 — the repair that made V5.1 reachable', () => {
  it('matches clamp01 wherever clamp01 is smooth', () => {
    for (const x of [-2, -0.5, 0.25, 0.5, 0.75, 1.5, 3.57]) {
      expect(smoothClamp01(x)).toBeCloseTo(hardClamp01(x), 3)
    }
  })

  it('stays inside [0,1] like the function it replaces', () => {
    for (let x = -5; x <= 5; x += 0.01) {
      const y = smoothClamp01(x)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(1)
    }
  })

  it('is monotone non-decreasing', () => {
    let prev = -Infinity
    for (let x = -5; x <= 5; x += 0.01) {
      const y = smoothClamp01(x)
      expect(y).toBeGreaterThanOrEqual(prev - 1e-12)
      prev = y
    }
  })

  it('deviates from clamp01 by at most ln2/β, and only near the corners', () => {
    // The deviation is LARGEST at the corners, which is where the chilling presets
    // sit. That is why β was measured rather than guessed.
    const beta = 200
    let worst = 0
    for (let x = -1; x <= 2; x += 0.0005) {
      worst = Math.max(worst, Math.abs(smoothClamp01(x) - hardClamp01(x)))
    }
    expect(worst).toBeLessThan(0.005)
    expect(worst).toBeCloseTo(Math.LN2 / beta, 4)
  })

  it('has no corner: the derivative is Lipschitz where clamp01 jumps', () => {
    // The property that matters to RK4 is not "the one-sided slopes are close" — at
    // β = 200 the transition is only ~0.005 wide, so slopes sampled 0.02 apart
    // legitimately differ. It is that the derivative CHANGES CONTINUOUSLY: the step in
    // slope must shrink with the sampling interval. For softplus(x) − softplus(x−1)
    // the second derivative is bounded by β/4, so |Δslope| ≤ (β/4)·δ.
    const beta = 200
    const h = 1e-6
    const slope = (f: (x: number) => number) => (x: number) => (f(x + h) - f(x - h)) / (2 * h)
    const smoothSlope = slope(smoothClamp01)

    for (const delta of [1e-3, 1e-4]) {
      let worst = 0
      for (let x = -0.5; x <= 1.5; x += delta) {
        worst = Math.max(worst, Math.abs(smoothSlope(x + delta) - smoothSlope(x)))
      }
      expect(worst, `slope step ${worst} exceeds the (β/4)·δ bound at δ=${delta}`)
        .toBeLessThanOrEqual((beta / 4) * delta * 1.2)
    }

    // The hard clamp fails the same test at every δ: its slope step stays at 1 no
    // matter how finely you sample, which is what "corner" means. Without this the
    // check above could pass for a function with no corner to remove.
    const hardSlope = slope(hardClamp01)
    const hardWorst = [1e-3, 1e-4].map((delta) => {
      let worst = 0
      for (let x = -0.5; x <= 1.5; x += delta) {
        worst = Math.max(worst, Math.abs(hardSlope(x + delta) - hardSlope(x)))
      }
      return worst
    })
    // The diagnostic property is that refining δ tenfold does NOT shrink the step —
    // that is what distinguishes a corner from a steep smooth transition. (The value
    // is ~0.5 rather than 1 because a central difference reads half-slope exactly at
    // the corner, so the jump is split across two samples.)
    expect(hardWorst[0]).toBeGreaterThan(0.4)
    expect(hardWorst[1]).toBeCloseTo(hardWorst[0], 6)
  })

  it('degenerates to the hard clamp as β grows, as the theory says', () => {
    // Guards the docblock's claim about why β cannot simply be made huge.
    for (const x of [-0.2, 0.05, 0.95, 1.2]) {
      const far = softplus(x, 100000) - softplus(x - 1, 100000)
      expect(far).toBeCloseTo(hardClamp01(x), 4)
    }
  })
})
