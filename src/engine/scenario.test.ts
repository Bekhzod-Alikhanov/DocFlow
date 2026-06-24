import { describe, it, expect } from 'vitest'
import { PRESETS, PRESET_BY_ID, DEFAULT_PRESET_ID } from './presets'
import { paramsFromPreset, initFromPreset, scenarioFromPreset, defaultScenario } from './scenario'
import { PARAM_SPEC_BY_ID, defaultInitState, defaultSettings, ALL_PARAM_KEYS } from './registry'
import { simulate } from './simulate'
import { LEVER_KEYS, STOCK_KEYS } from './types'

describe('presets (spec §1, §5.6)', () => {
  it('ships the cited sector and institutional-design presets', () => {
    const ids = PRESETS.map((p) => p.id)
    for (const required of [
      'cybersecurity',
      'aviation',
      'healthcare',
      'pharma-safe-report',
      'sr11-effective-challenge',
      'nuclear-dual-channel',
      'eu-trap',
      'neutral',
    ]) {
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

  it('every preset explains every lever value with confidence and caveat metadata', () => {
    for (const preset of PRESETS) {
      for (const key of LEVER_KEYS) {
        const rationale = preset.leverRationales[key]
        expect(rationale, `${preset.id}.${key}`).toBeDefined()
        expect(rationale.basis.length).toBeGreaterThan(0)
        expect(rationale.sourceNote.length).toBeGreaterThan(0)
        expect(['low', 'medium', 'high']).toContain(rationale.confidence)
        expect(['illustrative', 'source-backed', 'needs-verification']).toContain(rationale.caveatLevel)
      }
    }
  })
})

describe('scenario regressions: institutional analogs', () => {
  function runPreset(id: string) {
    const preset = PRESET_BY_ID[id]
    return simulate(initFromPreset(preset), paramsFromPreset(preset), defaultSettings())
  }

  function lastAux(id: string) {
    const { trajectory } = runPreset(id)
    return trajectory.aux[trajectory.aux.length - 1]
  }

  it('keeps cyber chilling while aviation and PSQIA remain learning regimes', () => {
    expect(runPreset('cybersecurity').summary.regime).toBe('chilling')
    expect(runPreset('aviation').summary.regime).toBe('learning')
    expect(runPreset('healthcare').summary.regime).toBe('learning')
  })

  it('keeps the EU trap high-exposure unless protective scaffolding is added', () => {
    const eu = paramsFromPreset(PRESET_BY_ID['eu-trap'])
    const base = simulate(initFromPreset(PRESET_BY_ID['eu-trap']), eu, defaultSettings())
    const protectedRun = simulate(
      initFromPreset(PRESET_BY_ID['eu-trap']),
      {
        ...eu,
        privilege_strength: 0.7,
        workflow_protection: 0.9,
        original_records_boundary: 0.9,
        safe_harbor_non_admission: 0.9,
      },
      defaultSettings(),
    )
    const baseAux = base.trajectory.aux[base.trajectory.aux.length - 1]
    const protectedAux = protectedRun.trajectory.aux[protectedRun.trajectory.aux.length - 1]
    expect(baseAux.litigation_pressure).toBeGreaterThan(protectedAux.litigation_pressure)
    expect(protectedRun.summary.finalFdoc).toBeGreaterThan(base.summary.finalFdoc)
  })

  it('makes pharma-style mandatory reporting safer than mandatory-only reporting', () => {
    const pharma = runPreset('pharma-safe-report')
    const p = paramsFromPreset(PRESET_BY_ID['pharma-safe-report'])
    const mandatoryOnly = simulate(
      initFromPreset(PRESET_BY_ID['pharma-safe-report']),
      {
        ...p,
        privilege_strength: 0.05,
        workflow_protection: 0,
        original_records_boundary: 0.2,
        safe_harbor_non_admission: 0,
        intermediary_capacity: 0.2,
      },
      defaultSettings(),
    )
    const pharmaAux = pharma.trajectory.aux[pharma.trajectory.aux.length - 1]
    const mandatoryAux = mandatoryOnly.trajectory.aux[mandatoryOnly.trajectory.aux.length - 1]
    expect(pharmaAux.safe_to_report_score).toBeGreaterThan(mandatoryAux.safe_to_report_score)
    expect(pharmaAux.litigation_pressure).toBeLessThan(mandatoryAux.litigation_pressure)
  })

  it('keeps nuclear dual-channel stronger than public-only or private-only setups', () => {
    const nuclear = paramsFromPreset(PRESET_BY_ID['nuclear-dual-channel'])
    const init = initFromPreset(PRESET_BY_ID['nuclear-dual-channel'])
    const dual = lastAux('nuclear-dual-channel')
    const publicOnly = simulate(
      init,
      { ...nuclear, near_miss_tier: 0.1, intermediary_capacity: 0, recipient_enforcer_separation: 0.25, translation_layer: 0.35 },
      defaultSettings(),
    ).trajectory
    const privateOnly = simulate(init, { ...nuclear, mandatory_reporting: 0, pld_penalty: 0 }, defaultSettings()).trajectory
    const publicAux = publicOnly.aux[publicOnly.aux.length - 1]
    const privateAux = privateOnly.aux[privateOnly.aux.length - 1]
    expect(dual.learning_yield).toBeGreaterThan(publicAux.learning_yield)
    expect(dual.accountability_legitimacy).toBeGreaterThan(privateAux.accountability_legitimacy)
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
