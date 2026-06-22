import { describe, it, expect } from 'vitest'
import {
  sobolIndicesUnit,
  sobolAnalysis,
  prccAnalysis,
  tornado,
  latinHypercube,
  modelOutput,
} from './sensitivity'
import { mulberry32 } from './rng'
import { defaultParams } from './registry'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'
import { LEVER_KEYS } from './types'

describe('sensitivity: Latin Hypercube', () => {
  it('returns N points in [0,1]^k, one per stratum per dimension', () => {
    const pts = latinHypercube(3, 50, mulberry32(1))
    expect(pts.length).toBe(50)
    expect(pts[0].length).toBe(3)
    for (const p of pts) for (const v of p) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
    // Each dimension should cover [0,1] roughly uniformly (min in first decile, max in last).
    const col0 = pts.map((p) => p[0])
    expect(Math.min(...col0)).toBeLessThan(0.1)
    expect(Math.max(...col0)).toBeGreaterThan(0.9)
  })
})

describe('sensitivity: Sobol validated on the Ishigami function (spec §3.6)', () => {
  // f(x) = sin(x1) + a·sin²(x2) + b·x3⁴·sin(x1),  x_i ~ U(−π,π), a=7, b=0.1
  // Analytic: S1 ≈ [0.314, 0.442, 0], ST ≈ [0.557, 0.442, 0.244]
  const a = 7
  const b = 0.1
  const ishigami = (u: number[]) => {
    const x = u.map((v) => -Math.PI + v * 2 * Math.PI)
    return Math.sin(x[0]) + a * Math.sin(x[1]) ** 2 + b * x[2] ** 4 * Math.sin(x[0])
  }

  it('recovers the analytic first-order and total indices', () => {
    const { S1, ST } = sobolIndicesUnit(ishigami, 3, 8000, mulberry32(2024))
    expect(S1[0]).toBeCloseTo(0.314, 1)
    expect(S1[1]).toBeCloseTo(0.442, 1)
    expect(Math.abs(S1[2])).toBeLessThan(0.08) // x3 has no first-order effect
    expect(ST[2]).toBeGreaterThan(0.1) // ...but a real total (interaction) effect
    expect(ST[2]).toBeLessThan(0.4)
    // Interactions ⇒ ST1 > S1; x2 is additive ⇒ ST2 ≈ S2.
    expect(ST[0]).toBeGreaterThan(S1[0])
    expect(ST[1]).toBeCloseTo(S1[1], 1)
  })
})

describe('sensitivity: model Sobol / PRCC / tornado', () => {
  const base = paramsFromPreset(PRESET_BY_ID.neutral)
  const init = initFromPreset(PRESET_BY_ID.neutral)
  const settings = { horizon: 120, dt: 1, solver: 'rk4' as const }

  it('Sobol on final TD returns indices in [~0,1] for each lever', () => {
    const out = modelOutput('finalTD', init, settings)
    const r = sobolAnalysis(base, [...LEVER_KEYS], out, { n: 64, seed: 7 })
    expect(r.keys.length).toBe(LEVER_KEYS.length)
    expect(r.S1.length).toBe(LEVER_KEYS.length)
    expect(r.evaluations).toBe(64 * (LEVER_KEYS.length + 2))
    r.ST.forEach((v) => {
      expect(v).toBeGreaterThan(-0.1)
      expect(v).toBeLessThan(1.3)
    })
  })

  it('PRCC recovers a near-perfect monotone dependence', () => {
    // Output = privilege_strength itself ⇒ PRCC for privilege ≈ 1, others ≈ 0.
    const out = (p: typeof base) => p.privilege_strength
    const r = prccAnalysis(base, [...LEVER_KEYS], out, { n: 200, seed: 3 })
    const idx = r.keys.indexOf('privilege_strength')
    expect(Math.abs(r.prcc[idx])).toBeGreaterThan(0.95)
    r.keys.forEach((k, i) => {
      if (k !== 'privilege_strength') expect(Math.abs(r.prcc[i])).toBeLessThan(0.3)
    })
  })

  it('tornado returns swings sorted descending and non-negative', () => {
    const out = modelOutput('finalTD', init, settings)
    const bars = tornado(base, [...LEVER_KEYS], out)
    expect(bars.length).toBe(LEVER_KEYS.length)
    for (let i = 1; i < bars.length; i++) expect(bars[i - 1].swing).toBeGreaterThanOrEqual(bars[i].swing)
    bars.forEach((bar) => expect(bar.swing).toBeGreaterThanOrEqual(0))
  })

  it('Sobol is reproducible for a fixed seed', () => {
    const out = modelOutput('finalC', init, settings)
    const a = sobolAnalysis(base, [...LEVER_KEYS], out, { n: 32, seed: 5 })
    const b = sobolAnalysis(base, [...LEVER_KEYS], out, { n: 32, seed: 5 })
    expect(a.S1).toEqual(b.S1)
    void defaultParams
  })

  it('modelOutput returns a finite scalar for every output name', () => {
    for (const name of ['finalTD', 'finalL', 'finalC', 'finalFdoc', 'cumulativeExposure', 'timeToTip'] as const) {
      const v = modelOutput(name, init, settings)(base)
      expect(Number.isFinite(v)).toBe(true)
    }
    // A run that never tips maps time-to-tip to the horizon.
    const cyber = paramsFromPreset(PRESET_BY_ID.cybersecurity)
    expect(modelOutput('timeToTip', initFromPreset(PRESET_BY_ID.cybersecurity), settings)(cyber)).toBeLessThanOrEqual(settings.horizon)
  })

  it('Sobol of a constant function is zero (degenerate-variance guard)', () => {
    const { S1, ST } = sobolIndicesUnit(() => 3.14, 3, 64, mulberry32(1))
    S1.forEach((v) => expect(v).toBe(0))
    ST.forEach((v) => expect(v).toBe(0))
  })
})
