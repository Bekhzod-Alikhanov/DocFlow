// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import LZString from 'lz-string'
import { encodeScenarioToHash, decodeScenarioFromHash } from './share'
import { defaultScenario, PRESET_BY_ID, paramsFromPreset, PARAM_SPEC_BY_ID } from '../engine'
import type { Scenario, ParamKey } from '../engine'

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

  it('decodes v0.1 positional hashes without shifting newly added levers', () => {
    const legacyOrder: ParamKey[] = [
      'privilege_strength',
      'just_culture',
      'mandatory_reporting',
      'pld_penalty',
      'recipient_enforcer_separation',
      'translation_layer',
      'gain',
      'threshold',
      'a_c',
      'a_jc',
      'a_m',
      'a_disc',
      'w_m',
      'w_p',
      'w_priv',
      'w_sep',
      'w_tl',
      'base_incident_rate',
      'alpha_td',
      'TD_ref',
      'td_sat',
      'beta_L',
      'eta_learn',
      'base_eff',
      'tl_boost',
      'delta_L',
      'rho',
      'kappa_D',
      'mu',
      'sigma',
      'td_baseline',
      'delta_TD',
      'gamma',
      'phi_doc',
      'phi_harm',
      'phi_pld',
      'theta_E',
      'omega',
      'psi',
      'lambda_C',
      'a_sep',
      'a_jc_c',
    ]
    const sc = scenario()
    sc.name = 'Legacy URL'
    sc.params = { ...sc.params, gain: 7.5, threshold: 0.25 }
    const payload = {
      v: 1,
      mv: '0.1.0',
      n: sc.name,
      p: legacyOrder.map((k) => sc.params[k]),
      i: sc.init,
      s: sc.settings,
      pid: sc.presetId,
    }
    const hash = `#s=${LZString.compressToEncodedURIComponent(JSON.stringify(payload))}`
    const back = decodeScenarioFromHash(hash)
    expect(back).not.toBeNull()
    expect(back!.params.gain).toBe(7.5)
    expect(back!.params.threshold).toBe(0.25)
    expect(back!.params.workflow_protection).toBe(PARAM_SPEC_BY_ID.workflow_protection.default)
    expect(back!.params.safe_harbor_non_admission).toBe(PARAM_SPEC_BY_ID.safe_harbor_non_admission.default)
  })
})
