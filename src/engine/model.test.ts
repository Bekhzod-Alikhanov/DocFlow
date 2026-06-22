import { describe, it, expect } from 'vitest'
import {
  sigmoid,
  relu,
  perceivedDiscoverability,
  driveToDocument,
  documentationFraction,
  computeAux,
  derivatives,
} from './model'
import { defaultParams } from './registry'
import type { State } from './types'

const baseState: State = { U: 20, D: 5, TD: 10, L: 30, E: 10, C: 0.4 }

describe('model: primitives', () => {
  it('sigmoid is monotonic, bounded (0,1), symmetric at 0', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 10)
    expect(sigmoid(50)).toBeGreaterThan(0.999)
    expect(sigmoid(-50)).toBeLessThan(0.001)
    expect(sigmoid(2)).toBeGreaterThan(sigmoid(1))
    // numerical stability at extremes
    expect(Number.isFinite(sigmoid(1000))).toBe(true)
    expect(Number.isFinite(sigmoid(-1000))).toBe(true)
  })

  it('relu clamps negatives to 0', () => {
    expect(relu(-3)).toBe(0)
    expect(relu(0)).toBe(0)
    expect(relu(2.5)).toBe(2.5)
  })
})

describe('model: perceived discoverability (spec §2.2)', () => {
  it('rises with mandatory reporting & PLD; falls with privilege/separation/translation', () => {
    const p = defaultParams()
    const baseline = perceivedDiscoverability(p)
    expect(perceivedDiscoverability({ ...p, mandatory_reporting: 1 })).toBeGreaterThan(baseline)
    expect(perceivedDiscoverability({ ...p, pld_penalty: 1 })).toBeGreaterThan(baseline)
    expect(perceivedDiscoverability({ ...p, privilege_strength: 1 })).toBeLessThan(baseline)
    expect(perceivedDiscoverability({ ...p, recipient_enforcer_separation: 1 })).toBeLessThan(baseline)
    expect(perceivedDiscoverability({ ...p, translation_layer: 1 })).toBeLessThan(baseline)
  })
})

describe('model: documentation fraction f_doc (spec §2.2)', () => {
  it('is strictly in (0,1) and increases with culture C', () => {
    const p = defaultParams()
    let prev = -1
    for (let C = 0; C <= 1.0001; C += 0.1) {
      const f = documentationFraction(Math.min(1, C), p)
      expect(f).toBeGreaterThan(0)
      expect(f).toBeLessThan(1)
      expect(f).toBeGreaterThanOrEqual(prev)
      prev = f
    }
  })

  it('increases with just culture and decreases with positive perceived discoverability', () => {
    const p = defaultParams()
    const f0 = documentationFraction(0.5, p)
    expect(documentationFraction(0.5, { ...p, just_culture: 1 })).toBeGreaterThan(f0)
    // Drive penalty only applies to the positive part of perceived discoverability.
    const pd = perceivedDiscoverability(p)
    const drive = driveToDocument(0.5, pd, p)
    expect(Number.isFinite(drive)).toBe(true)
  })
})

describe('model: flow accounting & signs (spec §2.3)', () => {
  it('incident inflow splits exactly into to_D + to_U', () => {
    const a = computeAux(baseState, defaultParams())
    expect(a.to_D + a.to_U).toBeCloseTo(a.incident_inflow, 10)
    expect(a.to_D).toBeCloseTo(a.f_doc * a.incident_inflow, 10)
  })

  it('all rate auxiliaries are finite and non-negative where they must be', () => {
    const a = computeAux(baseState, defaultParams())
    for (const v of Object.values(a)) expect(Number.isFinite(v)).toBe(true)
    expect(a.incident_inflow).toBeGreaterThanOrEqual(0)
    expect(a.to_D).toBeGreaterThanOrEqual(0)
    expect(a.to_U).toBeGreaterThanOrEqual(0)
    expect(a.harm_events).toBeGreaterThanOrEqual(0)
    expect(a.remediation).toBeGreaterThanOrEqual(0)
  })

  it('incident inflow rises with technical debt and falls with learning', () => {
    const p = defaultParams()
    const lowDebt = computeAux({ ...baseState, TD: 5 }, p).incident_inflow
    const highDebt = computeAux({ ...baseState, TD: 40 }, p).incident_inflow
    expect(highDebt).toBeGreaterThan(lowDebt)
    const lowL = computeAux({ ...baseState, L: 10 }, p).incident_inflow
    const highL = computeAux({ ...baseState, L: 90 }, p).incident_inflow
    expect(highL).toBeLessThan(lowL)
  })

  it('debt→incident amplification saturates (bounded) — well-posedness refinement', () => {
    const p = defaultParams()
    const a1 = computeAux({ ...baseState, TD: 1e3 }, p).incident_inflow
    const a2 = computeAux({ ...baseState, TD: 1e6 }, p).incident_inflow
    // Inflow must not blow up linearly with debt.
    expect(a2).toBeLessThan(a1 * 1.5)
  })

  it('harm events vanish at full capability and grow with debt', () => {
    const p = defaultParams()
    expect(computeAux({ ...baseState, L: 100 }, p).harm_events).toBe(0)
    const lowTD = computeAux({ ...baseState, TD: 5 }, p).harm_events
    const highTD = computeAux({ ...baseState, TD: 50 }, p).harm_events
    expect(highTD).toBeGreaterThan(lowTD)
  })

  it('derivatives return one rate per stock and are finite', () => {
    const d = derivatives(baseState, defaultParams())
    expect(Object.keys(d).sort()).toEqual(['C', 'D', 'E', 'L', 'TD', 'U'])
    for (const v of Object.values(d)) expect(Number.isFinite(v)).toBe(true)
  })

  it('exposure rises with documenting when privilege is weak, and is protected when strong', () => {
    const p = defaultParams()
    const weak = derivatives(baseState, { ...p, privilege_strength: 0 }).E
    const strong = derivatives(baseState, { ...p, privilege_strength: 1 }).E
    expect(weak).toBeGreaterThan(strong)
  })

  it('culture rate vanishes at the boundaries C=0 and C=1 (logistic form)', () => {
    const p = defaultParams()
    expect(derivatives({ ...baseState, C: 0 }, p).C).toBeCloseTo(0, 12)
    expect(derivatives({ ...baseState, C: 1 }, p).C).toBeCloseTo(0, 12)
  })
})
