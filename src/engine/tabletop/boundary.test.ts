import { describe, it, expect } from 'vitest'
import { defaultParams } from '../registry'
import { tieStrengthFactor, translationLoss, normalizationProbability, crossBoundary } from './boundary'

const P = defaultParams()

describe('Ch.2 boundary transfer function', () => {
  it('tie strength rises with an independent review channel, stays in (0,1]', () => {
    const without = tieStrengthFactor(P, false)
    const withCh = tieStrengthFactor(P, true)
    expect(withCh).toBeGreaterThan(without)
    expect(without).toBeGreaterThan(0)
    expect(withCh).toBeLessThanOrEqual(1)
  })

  it('translation loss is higher when legal owns the record, in [0,1]', () => {
    const flowing = translationLoss(P, false)
    const bottleneck = translationLoss(P, true)
    expect(bottleneck).toBeGreaterThan(flowing)
    expect(flowing).toBeGreaterThanOrEqual(0)
    expect(bottleneck).toBeLessThanOrEqual(1)
  })

  it('normalization probability rises with retrain cadence, falls with just_culture, in [0,1]', () => {
    const lowCadence = normalizationProbability(P, 0.1)
    const highCadence = normalizationProbability(P, 0.9)
    expect(highCadence).toBeGreaterThan(lowCadence)
    const strongCulture = normalizationProbability({ ...P, just_culture: 0.95 }, 0.9)
    expect(strongCulture).toBeLessThan(highCadence)
    expect(lowCadence).toBeGreaterThanOrEqual(0)
    expect(highCadence).toBeLessThanOrEqual(1)
  })

  it('crossing a boundary never increases fidelity and never goes negative', () => {
    const next = crossBoundary(80, P, { hasIndependentChannel: false, legalOwnsRecord: true, retrainCadence: 0.6 })
    expect(next).toBeLessThanOrEqual(80)
    expect(next).toBeGreaterThanOrEqual(0)
  })

  it('a stronger learning architecture preserves more fidelity', () => {
    const weak = crossBoundary(80, P, { hasIndependentChannel: false, legalOwnsRecord: true, retrainCadence: 0.6 })
    const strong = crossBoundary(
      80,
      { ...P, near_miss_tier: 0.9, effective_challenge: 0.9, intermediary_capacity: 0.9, just_culture: 0.9 },
      { hasIndependentChannel: true, legalOwnsRecord: false, retrainCadence: 0.6 },
    )
    expect(strong).toBeGreaterThan(weak)
  })
})
