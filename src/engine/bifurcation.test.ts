import { describe, it, expect } from 'vitest'
import { sweep1D, sweep2D, hysteresis, metricOfEquilibrium } from './bifurcation'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'

const contested = paramsFromPreset(PRESET_BY_ID.neutral)

describe('bifurcation: 1-parameter sweep / fold (spec §3.3)', () => {
  it('sweeping just_culture exposes a tipping threshold (fold)', () => {
    const r = sweep1D(contested, 'just_culture', { steps: 30, metric: 'C' })
    expect(r.points.length).toBe(31)
    // At least one lever value has two stable branches (bistable window) ...
    const bistablePts = r.points.filter((pt) => pt.stable.length >= 2)
    expect(bistablePts.length).toBeGreaterThan(0)
    // ... and at least one has a single branch (monostable) → a fold between them.
    const monoPts = r.points.filter((pt) => pt.stable.length === 1)
    expect(monoPts.length).toBeGreaterThan(0)
    expect(r.tippingValues.length).toBeGreaterThan(0)
  })

  it('low just_culture is bistable; high just_culture is learning-only', () => {
    const r = sweep1D(contested, 'just_culture', { steps: 20, metric: 'f_doc' })
    const low = r.points[0] // jc = 0
    const high = r.points[r.points.length - 1] // jc = 1
    expect(low.stable.length).toBeGreaterThanOrEqual(2)
    expect(high.stable.length).toBe(1)
    expect(Math.max(...high.stable)).toBeGreaterThan(0.7)
  })
})

describe('bifurcation: hysteresis (spec §3.4)', () => {
  it('ramping just_culture up then down traces a hysteresis loop', () => {
    // v0.3.0 M3: horizon raised 200 -> 900 because the factual-record channel has a
    // ~50-month time constant (delta_R1 = 0.02), so 200 months does not relax it.
    // The F14 guard caught this rather than reporting transient lag as hysteresis —
    // which is exactly what it exists to do.
    const h = hysteresis(contested, 'just_culture', { steps: 24, metric: 'f_doc', settings: { horizon: 900, dt: 0.5, solver: 'rk4' } })
    expect(h.hasHysteresis).toBe(true)
    // v0.3.0: the claim is only meaningful if every ramp step actually settled.
    expect(h.relaxed).toBe(true)
    expect(h.maxResidual).toBeLessThan(1e-4)
    // The up branch starts chilling; the down branch returns learning at the same low jc.
    expect(h.up[0].metric).toBeLessThan(0.3)
    expect(h.down[0].metric).toBeGreaterThan(0.7)
  })

  // AUDIT.md F14. The routine previously could not tell genuine bistability from
  // transient lag: it reported hysteresis whenever the two branches differed, with
  // no check that either had relaxed. This is the discriminating case — at a short
  // horizon the BRANCH GAP IS ESSENTIALLY UNCHANGED (~0.998 vs ~0.999), so the gap
  // alone carries no information. Only the residual distinguishes them.
  it('refuses to report hysteresis when the ramp has not relaxed', () => {
    const opts = { steps: 20, metric: 'f_doc' as const, init: initFromPreset(PRESET_BY_ID.neutral) }

    const settled = hysteresis(contested, 'just_culture', {
      ...opts,
      settings: { horizon: 600, dt: 0.5, solver: 'rk4' },
    })
    const starved = hysteresis(contested, 'just_culture', {
      ...opts,
      settings: { horizon: 20, dt: 0.5, solver: 'rk4' },
    })

    const gapOf = (h: typeof settled) =>
      Math.max(...h.up.map((u, k) => Math.abs(u.metric - h.down[k].metric)))

    // Both show a large branch gap...
    expect(gapOf(settled)).toBeGreaterThan(0.9)
    expect(gapOf(starved)).toBeGreaterThan(0.9)

    // ...but only the settled run has actually reached equilibrium.
    expect(settled.relaxed).toBe(true)
    expect(starved.relaxed).toBe(false)
    expect(starved.maxResidual).toBeGreaterThan(settled.maxResidual * 100)

    // So only the settled run may claim path dependence.
    expect(settled.hasHysteresis).toBe(true)
    expect(starved.hasHysteresis).toBe(false)
  })
})

describe('bifurcation: 2-parameter tipping heatmap (spec §3.3, §5.5)', () => {
  it('sweep2D returns a grid with both regimes represented', () => {
    const r = sweep2D(contested, 'precommit', 'just_culture', { nx: 8, ny: 8, metric: 'TD' })
    expect(r.xs.length).toBe(8)
    expect(r.ys.length).toBe(8)
    expect(r.z.length).toBe(8)
    expect(r.z[0].length).toBe(8)
    const regimes = new Set(r.regime.flat())
    // High privilege+just-culture → learning; low → chilling. Both should appear.
    expect(regimes.has('learning')).toBe(true)
    expect(regimes.size).toBeGreaterThanOrEqual(2)
    r.z.flat().forEach((v) => expect(Number.isFinite(v)).toBe(true))
  })

  it('metricOfEquilibrium reads the requested field', () => {
    const eq = { state: { U: 1, D: 2, TD: 3, L: 4, E: 5, C: 0.6 }, fdoc: 0.9 } as never
    expect(metricOfEquilibrium(eq, 'TD')).toBe(3)
    expect(metricOfEquilibrium(eq, 'f_doc')).toBe(0.9)
  })
})
