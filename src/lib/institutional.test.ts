import { describe, expect, it } from 'vitest'
import { PRESET_BY_ID, defaultInitState, defaultParams, defaultSettings, initFromPreset, paramsFromPreset, simulate } from '../engine'
import {
  POLICY_COMPONENT_BY_ID,
  POLICY_PACKAGE_TEMPLATES,
  applyPolicyComponents,
  decisionRecommendations,
  dependencyCounts,
} from './institutional'

function run(params = defaultParams()) {
  return simulate(defaultInitState(), params, defaultSettings()).trajectory
}

function runPreset(id: string) {
  const preset = PRESET_BY_ID[id]
  const params = paramsFromPreset(preset)
  return { params, trajectory: simulate(initFromPreset(preset), params, defaultSettings()).trajectory }
}

describe('institutional decision recommendations', () => {
  it('recommends safe-harbor and factual-boundary work under high litigation pressure', () => {
    const { params, trajectory } = runPreset('eu-trap')
    const ids = decisionRecommendations(params, trajectory).map((r) => r.id)
    expect(ids).toContain('lower-litigation-pressure')
  })

  it('recommends safe-to-report architecture when reporting is chilled', () => {
    const { params, trajectory } = runPreset('cybersecurity')
    const ids = decisionRecommendations(params, trajectory).map((r) => r.id)
    expect(ids).toContain('raise-safe-to-report')
  })

  it('recommends translation-layer capacity when learning yield is low', () => {
    const params = {
      ...defaultParams(),
      translation_layer: 0,
      intermediary_capacity: 0,
      near_miss_tier: 0,
      effective_challenge: 0,
    }
    const ids = decisionRecommendations(params, run(params)).map((r) => r.id)
    expect(ids).toContain('increase-learning-yield')
  })

  it('separates private controls from statutory asks when private-ordering gap is high', () => {
    const params = {
      ...defaultParams(),
      privilege_strength: 1,
      workflow_protection: 1,
      safe_harbor_non_admission: 1,
      original_records_boundary: 0,
      effective_challenge: 0,
      near_miss_tier: 0,
      intermediary_capacity: 0,
      translation_layer: 0,
      just_culture: 0,
      recipient_enforcer_separation: 0,
    }
    const ids = decisionRecommendations(params, run(params)).map((r) => r.id)
    expect(ids).toContain('close-private-ordering-gap')
  })
})

describe('policy package builder logic', () => {
  it('maps package components to the intended lever targets', () => {
    expect(POLICY_COMPONENT_BY_ID['factual-record-boundary'].targetLevers.original_records_boundary).toBe(0.8)
    expect(POLICY_COMPONENT_BY_ID['safe-harbor-non-admission'].targetLevers.safe_harbor_non_admission).toBe(0.85)
    expect(POLICY_COMPONENT_BY_ID['effective-challenge'].targetLevers.effective_challenge).toBe(0.85)
  })

  it('projects selected components without mutating the current scenario', () => {
    const base = defaultParams()
    const projected = applyPolicyComponents(base, ['factual-record-boundary', 'safe-harbor-non-admission'])

    expect(projected).not.toBe(base)
    expect(base.original_records_boundary).toBe(defaultParams().original_records_boundary)
    expect(base.safe_harbor_non_admission).toBe(defaultParams().safe_harbor_non_admission)
    expect(projected.original_records_boundary).toBeGreaterThanOrEqual(0.8)
    expect(projected.safe_harbor_non_admission).toBeGreaterThanOrEqual(0.85)
  })

  it('counts private-ordering and statute-dependent package pieces', () => {
    const template = POLICY_PACKAGE_TEMPLATES.find((p) => p.id === 'eu-trap-mitigation')!
    const counts = dependencyCounts(template.componentIds)

    expect(counts.statute).toBeGreaterThan(0)
    expect(counts['private-ordering']).toBeGreaterThan(0)
  })
})
