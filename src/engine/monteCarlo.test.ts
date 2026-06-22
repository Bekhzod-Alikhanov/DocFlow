import { describe, it, expect } from 'vitest'
import { monteCarlo, sampleParam, percentile, MC_SERIES } from './monteCarlo'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'
import { mulberry32 } from './rng'
import type { MonteCarloConfig } from './monteCarlo'
import { LEVER_KEYS } from './types'

const cfg: MonteCarloConfig = {
  n: 80,
  seed: 123,
  distribution: 'uniform',
  vary: [...LEVER_KEYS],
  percentiles: [10, 50, 90],
  settings: { horizon: 60, dt: 0.5, solver: 'rk4' },
}

describe('Monte Carlo (spec §3.5)', () => {
  it('percentile interpolates correctly', () => {
    const a = [1, 2, 3, 4, 5]
    expect(percentile(a, 0)).toBe(1)
    expect(percentile(a, 100)).toBe(5)
    expect(percentile(a, 50)).toBe(3)
    expect(percentile(a, 25)).toBe(2)
  })

  it('sampleParam stays within the registry range', () => {
    const rng = mulberry32(1)
    for (let i = 0; i < 1000; i++) {
      const v = sampleParam('privilege_strength', 0.3, 'uniform', rng)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('produces ordered percentile bands for every series', () => {
    const base = paramsFromPreset(PRESET_BY_ID.neutral)
    const r = monteCarlo(base, initFromPreset(PRESET_BY_ID.neutral), cfg)
    for (const key of MC_SERIES) {
      const T = r.t.length
      expect(r.bands[key][10].length).toBe(T)
      for (let ti = 0; ti < T; ti++) {
        expect(r.bands[key][10][ti]).toBeLessThanOrEqual(r.bands[key][50][ti] + 1e-9)
        expect(r.bands[key][50][ti]).toBeLessThanOrEqual(r.bands[key][90][ti] + 1e-9)
      }
    }
  })

  it('regime fractions sum to 1 and diverged fraction is in [0,1]', () => {
    const base = paramsFromPreset(PRESET_BY_ID.neutral)
    const r = monteCarlo(base, initFromPreset(PRESET_BY_ID.neutral), cfg)
    const sum = r.regimeFractions.chilling + r.regimeFractions.learning + r.regimeFractions.contested
    expect(sum).toBeCloseTo(1, 6)
    expect(r.divergedFraction).toBeGreaterThanOrEqual(0)
    expect(r.divergedFraction).toBeLessThanOrEqual(1)
  })

  it('is reproducible: same seed → identical bands', () => {
    const base = paramsFromPreset(PRESET_BY_ID.neutral)
    const init = initFromPreset(PRESET_BY_ID.neutral)
    const a = monteCarlo(base, init, cfg)
    const b = monteCarlo(base, init, cfg)
    expect(a.bands.TD[50]).toEqual(b.bands.TD[50])
    expect(a.finalFdoc).toEqual(b.finalFdoc)
  })

  it('different seeds generally differ', () => {
    const base = paramsFromPreset(PRESET_BY_ID.neutral)
    const init = initFromPreset(PRESET_BY_ID.neutral)
    const a = monteCarlo(base, init, cfg)
    const b = monteCarlo(base, init, { ...cfg, seed: 999 })
    expect(a.finalFdoc).not.toEqual(b.finalFdoc)
  })

  it('supports triangular and normal sampling distributions within range', () => {
    const rng = mulberry32(5)
    for (let i = 0; i < 500; i++) {
      const t = sampleParam('just_culture', 0.4, 'triangular', rng)
      const nrm = sampleParam('just_culture', 0.4, 'normal', rng)
      expect(t).toBeGreaterThanOrEqual(0)
      expect(t).toBeLessThanOrEqual(1)
      expect(nrm).toBeGreaterThanOrEqual(0)
      expect(nrm).toBeLessThanOrEqual(1)
    }
    const base = paramsFromPreset(PRESET_BY_ID.neutral)
    const init = initFromPreset(PRESET_BY_ID.neutral)
    expect(monteCarlo(base, init, { ...cfg, n: 20, distribution: 'triangular' }).t.length).toBeGreaterThan(0)
    expect(monteCarlo(base, init, { ...cfg, n: 20, distribution: 'normal' }).t.length).toBeGreaterThan(0)
  })

  it('a wide MC over the contested baseline lands in both regimes', () => {
    const base = paramsFromPreset(PRESET_BY_ID.neutral)
    const r = monteCarlo(base, initFromPreset(PRESET_BY_ID.neutral), { ...cfg, n: 150, settings: { horizon: 400, dt: 0.5, solver: 'rk4' } })
    // Sampling all six levers across their ranges should reach both attractors.
    expect(r.regimeFractions.learning).toBeGreaterThan(0)
    expect(r.regimeFractions.chilling + r.regimeFractions.contested).toBeGreaterThan(0)
  })
})
