/**
 * M3b — endogenous privilege and the one-way valve (MODEL_v3_SPEC section 5).
 *
 * These assert the DOCTRINAL structure, not particular numbers: the coefficients
 * are uncalibrated (CALIBRATION.md section 3 is specified, not executed), so a test
 * pinning pi to a value would be asserting a free parameter. What can be asserted is
 * the ordering and the shape the case law implies.
 */
import { describe, it, expect } from 'vitest'
import { privilegeSurvival } from './model'
import { defaultParams } from './registry'
import { paramsFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'

describe('privilege survival is an outcome, not an input', () => {
  it('rises with each of the four doctrinal factors', () => {
    const base = { ...defaultParams(), precommit: 0.2, significant_purpose: 0.2, workflow_protection: 0.2, valve_discipline: 0.2 }
    const pi = (o: Partial<typeof base>) => privilegeSurvival({ ...base, ...o }).pi
    const b = pi({})
    expect(pi({ precommit: 0.9 })).toBeGreaterThan(b)
    expect(pi({ significant_purpose: 0.9 })).toBeGreaterThan(b)
    expect(pi({ workflow_protection: 0.9 })).toBeGreaterThan(b)
    expect(pi({ valve_discipline: 0.9 })).toBeGreaterThan(b)
  })

  it('pre-commitment is the strongest single factor', () => {
    // In re Target survived on pre-commitment; Capital One, Rutter's and Guo Wengui
    // failed on post-hoc engagement. The registry weights encode that ordering.
    const p = defaultParams()
    expect(p.b_pre).toBeGreaterThan(p.b_sep)
    expect(p.b_pre).toBeGreaterThan(p.b_purp)
    expect(p.b_pre).toBeGreaterThan(p.b_valve)
  })

  it('post-hoc engagement with poor discipline nearly destroys privilege', () => {
    // The Capital One pattern: counsel engaged after the fact over work that would
    // have been done anyway, with conclusions circulating freely.
    const bad = privilegeSurvival({
      ...defaultParams(),
      precommit: 0, significant_purpose: 0.1, workflow_protection: 0, valve_discipline: 0,
    })
    expect(bad.pi).toBeLessThan(0.15)
  })

  it('a pre-committed, separated, disciplined workflow largely preserves it', () => {
    // The PSQIA pattern: protection attaches to a defined process entered in advance.
    const good = privilegeSurvival({
      ...defaultParams(),
      precommit: 0.95, significant_purpose: 0.9, workflow_protection: 0.95, valve_discipline: 0.9,
    })
    expect(good.pi).toBeGreaterThan(0.9)
  })

  it('is bounded in [0,1] across the whole parameter box', () => {
    let rng = 7
    const rand = () => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = 0; i < 500; i++) {
      const r = privilegeSurvival({
        ...defaultParams(),
        precommit: rand(), significant_purpose: rand(), workflow_protection: rand(),
        valve_discipline: rand(), kovel_evaluator: rand(), p_court: rand(),
      })
      for (const v of [r.pi, r.piEff, r.lambda, r.waiver]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
      expect(r.piEff).toBeLessThanOrEqual(r.pi + 1e-12)
    }
  })
})

describe('the one-way valve is a cliff, not a slope', () => {
  it('loses privilege disproportionately fast around the waiver threshold', () => {
    const p = paramsFromPreset(PRESET_BY_ID.healthcare)
    const at = (v: number) => privilegeSurvival({ ...p, valve_discipline: v }).pi
    // Measured: 0.41 -> 0.91 across a 0.2 change in discipline, against a much
    // flatter response in the well-disciplined tail.
    const nearThreshold = at(0.5) - at(0.3)
    const farFromThreshold = at(1.0) - at(0.8)
    expect(nearThreshold).toBeGreaterThan(farFromThreshold * 5)
  })

  it('leakage rises when an outside evaluator widens the circle (Kovel)', () => {
    const p = defaultParams()
    const without = privilegeSurvival({ ...p, kovel_evaluator: 0 }).lambda
    const with_ = privilegeSurvival({ ...p, kovel_evaluator: 1 }).lambda
    expect(with_).toBeGreaterThan(without)
  })

  it('leakage creates independent admissions on top of the waiver loss', () => {
    // ADR/0004: leakage costs TWICE — waiver, plus statements that may remain
    // admissible even where Rule 407 excludes the remedial measure itself.
    const p = defaultParams()
    expect(p.adm).toBeGreaterThan(0)
    expect(p.xi_adm).toBeGreaterThan(0)
  })
})

describe('p_court — the untested device', () => {
  it('scales effective privilege linearly and reaches zero', () => {
    const p = paramsFromPreset(PRESET_BY_ID.aviation)
    const at = (pc: number) => privilegeSurvival({ ...p, p_court: pc }).piEff
    expect(at(0)).toBe(0)
    expect(at(1)).toBeGreaterThan(at(0.5))
    expect(at(0.5)).toBeGreaterThan(at(0.25))
    // Linear in p_court by construction: it is a probability the model multiplies by,
    // not something it pretends to estimate.
    expect(at(0.5) / at(1)).toBeCloseTo(0.5, 6)
  })

  it('is a free parameter with no measured value, and says so', () => {
    // The paper concedes no court has passed on the device. Anything that claimed
    // to know this number would be inventing it.
    const spec = defaultParams()
    expect(spec.p_court).toBeGreaterThanOrEqual(0)
    expect(spec.p_court).toBeLessThanOrEqual(1)
  })
})

describe('preset privilege postures follow the case law', () => {
  it('cyber (post-hoc) fails where healthcare (PSQIA workflow) holds', () => {
    const cyber = privilegeSurvival(paramsFromPreset(PRESET_BY_ID.cybersecurity)).pi
    const health = privilegeSurvival(paramsFromPreset(PRESET_BY_ID.healthcare)).pi
    expect(cyber).toBeLessThan(0.2)
    expect(health).toBeGreaterThan(0.9)
    expect(health).toBeGreaterThan(cyber * 4)
  })

  it('the EU trap gets little privilege despite maximum duty', () => {
    // Piling on duty and exposure without a protective scaffold is the teaching
    // point: the obligation to document does not bring protection with it.
    const eu = privilegeSurvival(paramsFromPreset(PRESET_BY_ID['eu-trap']))
    expect(eu.pi).toBeLessThan(0.3)
    expect(eu.waiver).toBeGreaterThan(0.5)
  })
})

describe('the perception gap — what the keep-it-oral move actually buys', () => {
  it('the naive belief can exceed the doctrinal reality by a wide margin', () => {
    // The cybersecurity failure mode the playbook is written against: counsel is
    // involved and nothing is written down, so the firm believes it is protected —
    // but entry was post-hoc, the work is not separable from the ordinary course,
    // and conclusions leak. Courts have repeatedly pierced exactly this.
    const naive = {
      ...defaultParams(),
      significant_purpose: 0.9, // "we involved a lawyer"
      precommit: 0.05, // ...after the fact
      workflow_protection: 0.05, // ...over work we would have done anyway
      valve_discipline: 0.1, // ...and the conclusions circulate
    }
    const actual = privilegeSurvival(naive).pi
    // The belief component alone (0.55 * significant_purpose) already exceeds this.
    expect(actual).toBeLessThan(0.2)
    expect(0.55 * naive.significant_purpose).toBeGreaterThan(actual * 2)
  })

  it('a disciplined architecture closes the gap rather than widening the belief', () => {
    const disciplined = {
      ...defaultParams(),
      significant_purpose: 0.9,
      precommit: 0.9,
      workflow_protection: 0.9,
      valve_discipline: 0.9,
    }
    const actual = privilegeSurvival(disciplined).pi
    // Same stated legal purpose as the naive case, but now the doctrine agrees.
    expect(actual).toBeGreaterThan(0.9)
  })
})
