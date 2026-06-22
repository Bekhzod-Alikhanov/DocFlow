// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { encodeScenarioToHash, decodeScenarioFromHash } from './share'
import { defaultScenario, PRESET_BY_ID, paramsFromPreset, PARAM_SPEC_BY_ID } from '../engine'
import type { Scenario } from '../engine'

function scenario(): Scenario {
  const base = defaultScenario('test')
  return { ...base, name: 'My scenario', params: paramsFromPreset(PRESET_BY_ID['aviation']), presetId: 'aviation' }
}

describe('share codec', () => {
  it('round-trips a scenario through the URL hash', () => {
    const sc = scenario()
    const hash = encodeScenarioToHash(sc)
    expect(hash.startsWith('#s=')).toBe(true)

    const back = decodeScenarioFromHash(hash)
    expect(back).not.toBeNull()
    expect(back!.name).toBe('My scenario')
    expect(back!.presetId).toBe('aviation')
    expect(back!.params).toEqual(sc.params)
    expect(back!.init).toEqual(sc.init)
    expect(back!.settings).toEqual(sc.settings)
  })

  it('returns null for malformed hashes', () => {
    expect(decodeScenarioFromHash('')).toBeNull()
    expect(decodeScenarioFromHash('#')).toBeNull()
    expect(decodeScenarioFromHash('#nope')).toBeNull()
    expect(decodeScenarioFromHash('#s=not-valid-lz')).toBeNull()
  })

  it('clamps an out-of-range injected param via sanitizeParams', () => {
    const sc = scenario()
    const max = PARAM_SPEC_BY_ID['just_culture'].max
    sc.params = { ...sc.params, just_culture: max + 5 } // injected out-of-range value
    const back = decodeScenarioFromHash(encodeScenarioToHash(sc))
    expect(back).not.toBeNull()
    expect(back!.params.just_culture).toBeLessThanOrEqual(max)
  })
})
