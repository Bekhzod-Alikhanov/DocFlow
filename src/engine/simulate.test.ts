import { describe, it, expect } from 'vitest'
import { integrate, simulate, summarize, classifyRegime, buildRunRecord, stepCount } from './simulate'
import { paramsFromPreset, initFromPreset } from './scenario'
import { defaultInitState, defaultSettings } from './registry'
import { PRESET_BY_ID } from './presets'
import { MODEL_VERSION } from './version'
import type { SimSettings } from './types'

const LONG: SimSettings = { horizon: 600, dt: 0.5, solver: 'rk4' }

describe('simulate: integration bookkeeping', () => {
  it('produces n+1 samples with t starting at 0 and increasing', () => {
    const settings: SimSettings = { horizon: 60, dt: 0.5, solver: 'rk4' }
    const traj = integrate(defaultInitState(), paramsFromPreset(PRESET_BY_ID.neutral), settings)
    expect(traj.t.length).toBe(stepCount(settings) + 1)
    expect(traj.states.length).toBe(traj.t.length)
    expect(traj.aux.length).toBe(traj.t.length)
    expect(traj.t[0]).toBe(0)
    for (let i = 1; i < traj.t.length; i++) expect(traj.t[i]).toBeGreaterThan(traj.t[i - 1])
  })

  it('clamps an out-of-bounds initial state and records the event', () => {
    const traj = integrate({ ...defaultInitState(), C: 2, U: -3 }, paramsFromPreset(PRESET_BY_ID.neutral), defaultSettings())
    expect(traj.states[0].C).toBeLessThanOrEqual(1)
    expect(traj.states[0].U).toBeGreaterThanOrEqual(0)
    expect(traj.clampEvents.length).toBeGreaterThan(0)
  })
})

describe('simulate: behavior reproduction — R1 and R2 are both reachable (spec §7.1)', () => {
  it('cybersecurity preset settles into the chilling attractor (≈5%, an estimate)', () => {
    const { trajectory, summary } = simulate(initFromPreset(PRESET_BY_ID.cybersecurity), paramsFromPreset(PRESET_BY_ID.cybersecurity), LONG)
    expect(trajectory.diverged).toBe(false)
    expect(summary.regime).toBe('chilling')
    expect(summary.finalFdoc).toBeLessThan(0.1)
    expect(summary.finalState.TD).toBeGreaterThan(50) // high technical debt
  })

  it('aviation and healthcare presets settle into the learning attractor', () => {
    for (const id of ['aviation', 'healthcare'] as const) {
      const { trajectory, summary } = simulate(initFromPreset(PRESET_BY_ID[id]), paramsFromPreset(PRESET_BY_ID[id]), LONG)
      expect(trajectory.diverged).toBe(false)
      expect(summary.regime).toBe('learning')
      expect(summary.finalFdoc).toBeGreaterThan(0.7)
      expect(summary.finalState.TD).toBeLessThan(20) // low technical debt
    }
  })

  it('the EU AI Act + PLD trap does NOT reach the learning attractor, with high exposure', () => {
    const { summary } = simulate(initFromPreset(PRESET_BY_ID['eu-trap']), paramsFromPreset(PRESET_BY_ID['eu-trap']), LONG)
    expect(summary.regime).not.toBe('learning')
    expect(summary.finalState.E).toBeGreaterThan(50) // duty+exposure without privilege ⇒ exposure piles up
  })

  it('the Contested baseline is path-dependent: low initial culture → chilling, high → learning', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const init = initFromPreset(PRESET_BY_ID.neutral)
    const lowStart = summarize(integrate({ ...init, C: 0.05 }, p, LONG))
    const highStart = summarize(integrate({ ...init, C: 0.95 }, p, LONG))
    expect(lowStart.regime).toBe('chilling')
    expect(highStart.regime).toBe('learning')
    expect(highStart.finalState.TD).toBeLessThan(lowStart.finalState.TD)
  })

  it('no preset diverges over a long horizon', () => {
    for (const id of ['cybersecurity', 'aviation', 'healthcare', 'neutral', 'eu-trap'] as const) {
      expect(integrate(initFromPreset(PRESET_BY_ID[id]), paramsFromPreset(PRESET_BY_ID[id]), LONG).diverged).toBe(false)
    }
  })
})

describe('simulate: summary metrics & determinism', () => {
  it('classifyRegime thresholds', () => {
    expect(classifyRegime(0.9)).toBe('learning')
    expect(classifyRegime(0.05)).toBe('chilling')
    expect(classifyRegime(0.35)).toBe('contested')
  })

  it('cumulative exposure/harm are non-negative and time-to-tip is null or within horizon', () => {
    const { summary } = simulate(defaultInitState(), paramsFromPreset(PRESET_BY_ID.neutral), { horizon: 120, dt: 0.5, solver: 'rk4' })
    expect(summary.cumulativeExposure).toBeGreaterThanOrEqual(0)
    expect(summary.cumulativeHarm).toBeGreaterThanOrEqual(0)
    if (summary.timeToTip !== null) {
      expect(summary.timeToTip).toBeGreaterThanOrEqual(0)
      expect(summary.timeToTip).toBeLessThanOrEqual(120)
    }
  })

  it('is fully deterministic: identical inputs → identical trajectory', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const a = integrate(defaultInitState(), p, LONG)
    const b = integrate(defaultInitState(), p, LONG)
    expect(a.states[a.states.length - 1]).toEqual(b.states[b.states.length - 1])
  })

  it('buildRunRecord captures complete, re-runnable provenance (spec §3.8)', () => {
    const p = paramsFromPreset(PRESET_BY_ID.aviation)
    const rec = buildRunRecord(p, defaultInitState(), defaultSettings(), { seed: 7, timestamp: '2026-01-01T00:00:00Z' })
    expect(rec.modelVersion).toBe(MODEL_VERSION)
    expect(rec.seed).toBe(7)
    expect(rec.timestamp).toBe('2026-01-01T00:00:00Z')
    expect(rec.params).toEqual(p)
    // The record is a copy, not a reference (mutating the source must not change it).
    expect(rec.params).not.toBe(p)
  })
})
