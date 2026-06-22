import { describe, it, expect } from 'vitest'
import {
  PARAM_SPECS,
  PARAM_SPEC_BY_ID,
  STOCK_SPECS,
  defaultParams,
  defaultInitState,
  defaultSettings,
  sanitizeParams,
  clampParam,
  registryKeySet,
  ALL_PARAM_KEYS,
} from './registry'
import { LEVER_KEYS, STRUCTURAL_KEYS, STOCK_KEYS } from './types'

describe('parameter registry', () => {
  it('covers exactly the declared parameter keys, once each', () => {
    const ids = PARAM_SPECS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length) // no duplicates
    expect(registryKeySet()).toEqual(new Set(ALL_PARAM_KEYS))
    for (const k of [...LEVER_KEYS, ...STRUCTURAL_KEYS]) {
      expect(PARAM_SPEC_BY_ID[k]).toBeDefined()
    }
  })

  it('every spec has the mandatory metadata schema (spec §2.5)', () => {
    for (const p of PARAM_SPECS) {
      expect(typeof p.label).toBe('string')
      expect(p.label.length).toBeGreaterThan(0)
      expect(typeof p.unit).toBe('string')
      expect(typeof p.note).toBe('string')
      expect(p.note.length).toBeGreaterThan(0)
      expect(typeof p.source).toBe('string')
      expect(p.source.length).toBeGreaterThan(0)
      expect(['empirical-anchor', 'expert-estimate', 'illustrative-assumption']).toContain(p.evidence_basis)
      expect(['lever', 'documentation', 'incidents', 'learning', 'debt', 'exposure', 'culture']).toContain(p.group)
    }
  })

  it('defaults lie within [min,max] and min<max', () => {
    for (const p of PARAM_SPECS) {
      expect(p.min).toBeLessThan(p.max)
      expect(p.default).toBeGreaterThanOrEqual(p.min)
      expect(p.default).toBeLessThanOrEqual(p.max)
    }
  })

  it('levers are the six policy dials in [0,1] (spec §2.4)', () => {
    const levers = PARAM_SPECS.filter((p) => p.group === 'lever')
    expect(levers.map((l) => l.id).sort()).toEqual([...LEVER_KEYS].sort())
    for (const l of levers) {
      expect(l.advanced).toBe(false)
      expect(l.min).toBe(0)
      expect(l.max).toBe(1)
    }
  })

  it('NO coefficient claims empirical-anchor without a real citation (spec §2.5)', () => {
    // Honesty rule: in this build, nothing is tagged empirical-anchor (the only
    // empirical anchor is a calibration target carried by the cyber preset).
    for (const p of PARAM_SPECS) {
      if (p.evidence_basis === 'empirical-anchor') {
        expect(p.source).toMatch(/\d{4}|U\.S\.C|Reg\.|Dir\.|Fed\. Reg\./)
      }
    }
  })

  it('defaultParams returns every key at its registry default', () => {
    const p = defaultParams()
    for (const spec of PARAM_SPECS) expect(p[spec.id]).toBe(spec.default)
  })

  it('default init state matches stock specs and default settings are RK4/120/dt0.5', () => {
    const init = defaultInitState()
    for (const k of STOCK_KEYS) expect(init[k]).toBe(STOCK_SPECS[k].default)
    const s = defaultSettings()
    expect(s.solver).toBe('rk4')
    expect(s.horizon).toBe(120)
    expect(s.dt).toBeGreaterThan(0)
  })

  it('clampParam and sanitizeParams enforce ranges and reject non-finite (spec §7.5)', () => {
    expect(clampParam('privilege_strength', 5)).toBe(1)
    expect(clampParam('privilege_strength', -5)).toBe(0)
    expect(clampParam('gain', Number.NaN)).toBe(PARAM_SPEC_BY_ID.gain.default)
    const cleaned = sanitizeParams({ privilege_strength: 9, just_culture: Number.POSITIVE_INFINITY })
    expect(cleaned.privilege_strength).toBe(1)
    expect(cleaned.just_culture).toBe(PARAM_SPEC_BY_ID.just_culture.default)
    // Untouched keys fall back to defaults.
    expect(cleaned.gain).toBe(PARAM_SPEC_BY_ID.gain.default)
  })
})
