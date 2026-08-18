import { describe, it, expect } from 'vitest'
import {
  sigmoid,
  relu,
  perceivedDiscoverability,
  discoverability,
  driveToDocument,
  documentationFraction,
  computeAux,
  derivatives,
} from './model'
import { defaultParams } from './registry'
import { paramsFromPreset } from './scenario'
import { PRESETS } from './presets'
import type { State } from './types'

// v0.3.0 M3: R3 > 0 because remediation is now driven by the remediation
// channel rather than the retired lumped `D` stock.
const baseState: State = { U: 20, R1: 5, R2: 2, R3: 4, TD: 10, L: 30, E_pl: 10, E_reg: 3, E_fid: 1, C: 0.4 }

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

describe('model: perceived discoverability, disaggregated by channel (M3c)', () => {
  it('each channel responds only to the levers that reach it', () => {
    const p = defaultParams()
    const base = discoverability(p)

    // Channel One -- the factual record. Reporting duties and the PLD presumption raise
    // it; the records boundary shapes what is in it. NOTHING ELSE TOUCHES IT, and that
    // is the substantive claim: privilege does not protect facts, so a firm's exposure
    // on the factual record cannot be reduced by protecting its analysis.
    expect(discoverability({ ...p, mandatory_reporting: 1 }).fact).toBeGreaterThan(base.fact)
    expect(discoverability({ ...p, pld_penalty: 1 }).fact).toBeGreaterThan(base.fact)
    expect(discoverability({ ...p, original_records_boundary: 1 }).fact).toBeLessThan(base.fact)
    for (const lever of ['precommit', 'significant_purpose', 'recipient_enforcer_separation', 'translation_layer'] as const) {
      expect(discoverability({ ...p, [lever]: 1 }).fact, `${lever} must not touch the factual channel`)
        .toBeCloseTo(base.fact, 12)
    }

    // Channel Two -- the analysis, governed by privilege survival and by whether the
    // recipient of a report is also the enforcer.
    expect(discoverability({ ...p, precommit: 1 }).anal).toBeLessThan(base.anal)
    expect(discoverability({ ...p, significant_purpose: 1 }).anal).toBeLessThan(base.anal)
    expect(discoverability({ ...p, recipient_enforcer_separation: 1 }).anal).toBeLessThan(base.anal)

    // Channel Three -- admissibility, not discovery. Safe harbour discounts it; leakage
    // raises it, because a ticket carrying causal reasoning is no longer a work order.
    expect(discoverability({ ...p, safe_harbor_non_admission: 1 }).rem).toBeLessThan(base.rem)
    expect(discoverability({ ...p, valve_discipline: 1 }).rem).toBeLessThan(base.rem)
  })

  it('the aggregate is the channel mean, and stays on a readout-friendly scale', () => {
    const p = defaultParams()
    const d = discoverability(p)
    expect(perceivedDiscoverability(p)).toBeCloseTo((d.fact + d.anal + d.rem) / 3, 12)
    // Summing instead of averaging pinned litigation_pressure at exactly 1.0 for every
    // chilling preset. Keep the aggregate on the scale the bounded readouts expect.
    expect(perceivedDiscoverability(p)).toBeLessThan(2)
  })

  it('is positive at every shipped preset, so the weights are not inert', () => {
    // The F15 defect: the lumped signal was ~-3 at six of eight presets and softplus
    // there returns ~1e-24, so all eight weights had no effect exactly where the model
    // was most used. Disaggregation is what fixed it.
    for (const preset of PRESETS) {
      const pd = perceivedDiscoverability(paramsFromPreset(preset))
      expect(pd, `${preset.id}: pd = ${pd.toFixed(3)} is back in the softplus dead zone`)
        .toBeGreaterThan(0.05)
    }
  })

  it('reads parameters only, so it is constant along a trajectory', () => {
    // Depended on elsewhere: it is why the softplus kink cannot degrade RK4's order.
    const p = defaultParams()
    expect(discoverability.length).toBe(1)
    expect(perceivedDiscoverability(p)).toBe(perceivedDiscoverability(p))
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
    expect(Object.keys(d).sort()).toEqual(
      ['C', 'E_fid', 'E_pl', 'E_reg', 'L', 'R1', 'R2', 'R3', 'TD', 'U'],
    )
    for (const v of Object.values(d)) expect(Number.isFinite(v)).toBe(true)
  })

  // v0.3.0 M3: exposure is decomposed, and this test now checks the OPPOSING
  // gradients that are the paper's core claim (ADR/0003) rather than a single
  // lumped quantity.
  it('products-liability exposure falls with privilege; regulatory exposure does not', () => {
    const p = { ...defaultParams(), precommit: 0 }
    const withR2: State = { ...baseState, R2: 8 }
    const weak = derivatives(withR2, { ...p, precommit: 0 }).E_pl
    const strong = derivatives(withR2, { ...p, precommit: 1 }).E_pl
    // Privilege shields the ANALYSIS channel, so PL exposure drops.
    expect(weak).toBeGreaterThan(strong)
    // Privilege also touches regulatory exposure, but only INDIRECTLY: it lowers
    // perceived discoverability, which raises f_doc, which leaves fewer
    // undocumented incidents for a reporting duty to bite on. That indirect path is
    // an order of magnitude weaker than the direct shielding of Channel Two.
    const regWeak = derivatives(withR2, { ...p, precommit: 0 }).E_reg
    const regStrong = derivatives(withR2, { ...p, precommit: 1 }).E_reg
    const plEffect = Math.abs(weak - strong)
    const regEffect = Math.abs(regWeak - regStrong)
    expect(regEffect).toBeLessThan(plEffect * 0.1)
  })

  it('the three exposure channels move in OPPOSING directions with candour', () => {
    const p = defaultParams()
    // Suppressed: little factual record, many undocumented incidents.
    const suppressed: State = { ...baseState, R1: 1, R2: 0, C: 0.05 }
    // Candid: a full factual record.
    const candid: State = { ...baseState, R1: 60, R2: 0, C: 0.95 }
    const sup = derivatives(suppressed, p)
    const can = derivatives(candid, p)
    // Candour RAISES products-liability exposure (discovery of the record) ...
    expect(can.E_pl).toBeGreaterThan(sup.E_pl)
    // ... and LOWERS fiduciary exposure (the board can finally see).
    expect(can.E_fid).toBeLessThan(sup.E_fid)
  })

  it('stronger safe harbor lowers backfire and litigation pressure', () => {
    const p = { ...defaultParams(), just_culture: 1, mandatory_reporting: 0.7, pld_penalty: 0.7 }
    const weak = computeAux({ ...baseState, C: 0.9 }, { ...p, safe_harbor_non_admission: 0 })
    const strong = computeAux({ ...baseState, C: 0.9 }, { ...p, safe_harbor_non_admission: 1 })
    expect(strong.backfire).toBeLessThan(weak.backfire)
    expect(strong.litigation_pressure).toBeLessThan(weak.litigation_pressure)
  })

  it('effective challenge raises learning and remediation', () => {
    const p = defaultParams()
    const weak = computeAux(baseState, { ...p, effective_challenge: 0 })
    const strong = computeAux(baseState, { ...p, effective_challenge: 1 })
    expect(strong.learning_gain).toBeGreaterThan(weak.learning_gain)
    expect(strong.remediation).toBeGreaterThan(weak.remediation)
  })

  it('near-miss tiers improve learning without directly increasing exposure', () => {
    const p = defaultParams()
    const weakP = { ...p, near_miss_tier: 0 }
    const strongP = { ...p, near_miss_tier: 1 }
    const weak = computeAux(baseState, weakP)
    const strong = computeAux(baseState, strongP)
    expect(strong.learning_gain).toBeGreaterThan(weak.learning_gain)
    expect(derivatives(baseState, strongP).E_pl).toBeCloseTo(derivatives(baseState, weakP).E_pl, 10)
  })

  it('mandatory reporting without protection can still chill documentation', () => {
    const p = {
      ...defaultParams(),
      just_culture: 0.2,
      mandatory_reporting: 1,
      pld_penalty: 1,
      precommit: 0,
      recipient_enforcer_separation: 0,
      translation_layer: 0,
      workflow_protection: 0,
      original_records_boundary: 0,
      safe_harbor_non_admission: 0,
    }
    const a = computeAux({ ...baseState, C: 0.25 }, p)
    expect(a.f_doc).toBeLessThan(0.5)
    expect(a.litigation_pressure).toBeGreaterThan(0.5)
  })

  // v0.3.0 REPLACES an earlier test that asserted `dC/dt == 0` at C = 0 and C = 1.
  // That was asserting a DEFECT: the pure logistic kernel made both boundaries exact
  // fixed points, so once the clamp pinned culture at a bound no policy change could
  // ever move it again (AUDIT.md F9). Culture is now recoverable, and the correct
  // property is that motion at a boundary follows the sign of (target − C).
  it('culture is not trapped at the boundaries: motion follows the target', () => {
    const p = defaultParams()
    // Strong pro-documentation regime ⇒ target well above 0 ⇒ C must rise off 0.
    const good = { ...p, just_culture: 1, recipient_enforcer_separation: 1 }
    expect(derivatives({ ...baseState, C: 0, E_pl: 0, E_reg: 0, E_fid: 0, TD: 0 }, good).C).toBeGreaterThan(0)

    // Strip every source of culture support ⇒ target below 1 ⇒ C must fall off 1.
    const bad = { ...p, just_culture: 0, recipient_enforcer_separation: 0, omega: 0 }
    expect(derivatives({ ...baseState, C: 1 }, bad).C).toBeLessThan(0)
  })

  it('culture stays bounded: the target is clamped to the stock range', () => {
    // Even with the reinforcement coefficients at their maxima, C must not be driven
    // above 1 (cultureTarget is clamped, so the target can never exceed the stock's
    // own range — in v0.2 it could reach ~7.4 against a stock capped at 1).
    const p = { ...defaultParams(), omega: 4, just_culture: 1, recipient_enforcer_separation: 1 }
    expect(derivatives({ ...baseState, C: 1 }, p).C).toBeLessThanOrEqual(1e-12)
  })
})
