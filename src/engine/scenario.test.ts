import { describe, it, expect } from 'vitest'
import { PRESETS, PRESET_BY_ID, DEFAULT_PRESET_ID } from './presets'
import { paramsFromPreset, initFromPreset, scenarioFromPreset, defaultScenario } from './scenario'
import { PARAM_SPEC_BY_ID, defaultInitState, ALL_PARAM_KEYS } from './registry'
import { STOCK_KEYS } from './types'

describe('presets (spec §1, §5.6)', () => {
  it('ships the four cited sector presets plus a contested baseline', () => {
    const ids = PRESETS.map((p) => p.id)
    for (const required of ['cybersecurity', 'aviation', 'healthcare', 'eu-trap', 'neutral']) {
      expect(ids).toContain(required)
    }
    expect(PRESET_BY_ID[DEFAULT_PRESET_ID]).toBeDefined()
  })

  it('every preset has a name, blurb, and at least one citation', () => {
    for (const p of PRESETS) {
      expect(p.name.length).toBeGreaterThan(0)
      expect(p.blurb.length).toBeGreaterThan(0)
      expect(p.citations.length).toBeGreaterThanOrEqual(1)
      expect(['chilling', 'learning', 'contested']).toContain(p.expectedRegime)
    }
  })

  it('the cyber preset carries the "95% is an estimate" reliability caveat (spec §4.4)', () => {
    const cyber = PRESET_BY_ID.cybersecurity
    const caveatText = cyber.citations.map((c) => c.caveat ?? '').join(' ')
    expect(caveatText.toLowerCase()).toContain('estimate')
    expect(caveatText).toMatch(/95%|5%/)
  })

  it('the EU-trap preset flags that article numbers need verification', () => {
    const eu = PRESET_BY_ID['eu-trap']
    const caveatText = eu.citations.map((c) => c.caveat ?? '').join(' ')
    expect(caveatText.toLowerCase()).toContain('verif')
  })
})

describe('scenario construction', () => {
  it('paramsFromPreset yields a complete vector within registry ranges', () => {
    for (const preset of PRESETS) {
      const params = paramsFromPreset(preset)
      for (const key of ALL_PARAM_KEYS) {
        const spec = PARAM_SPEC_BY_ID[key]
        expect(params[key]).toBeGreaterThanOrEqual(spec.min)
        expect(params[key]).toBeLessThanOrEqual(spec.max)
      }
    }
  })

  it('preset overrides actually change levers from the defaults', () => {
    const cyber = paramsFromPreset(PRESET_BY_ID.cybersecurity)
    expect(cyber.privilege_strength).toBe(0.05)
  })

  it('initFromPreset merges preset init over the default init', () => {
    const init = initFromPreset(PRESET_BY_ID.cybersecurity)
    expect(init.C).toBeCloseTo(0.35, 6) // cyber override
    // Unspecified stocks fall back to defaults.
    for (const k of STOCK_KEYS) expect(typeof init[k]).toBe('number')
  })

  it('scenarioFromPreset and defaultScenario produce well-formed scenarios', () => {
    const s = scenarioFromPreset(PRESET_BY_ID.aviation, { id: 'abc' })
    expect(s.id).toBe('abc')
    expect(s.presetId).toBe('aviation')
    expect(s.createdAt).toBeNull() // timestamps are set by the (impure) persistence layer
    const d = defaultScenario('xyz')
    expect(d.presetId).toBeNull()
    expect(d.init).toEqual(defaultInitState())
  })
})
