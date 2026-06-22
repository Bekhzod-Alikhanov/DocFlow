import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'
import { defaultParams, defaultInitState, defaultSettings } from '../engine'

const s = () => useStore.getState()

beforeEach(() => {
  s().loadPreset('neutral')
  s().clearScenarioB()
  s().setView('workbench')
})

describe('store: view', () => {
  it('switches the scientific view', () => {
    expect(s().view).toBe('workbench')
    s().setView('tipping')
    expect(s().view).toBe('tipping')
  })
})

describe('store: scenarioB', () => {
  it('captureBFromA snapshots A independently (editing A does not mutate B)', () => {
    const jc0 = s().params.just_culture
    s().captureBFromA()
    const b = s().scenarioB
    expect(b).not.toBeNull()
    expect(b!.params.just_culture).toBe(jc0)

    // Mutate A on the hot path.
    s().setParam('just_culture', 0.92)
    expect(s().params.just_culture).toBe(0.92)

    // B must be untouched...
    expect(s().scenarioB!.params.just_culture).toBe(jc0)
    // ...and never recomputed: it is the very same object/summary reference.
    expect(s().scenarioB).toBe(b)
    expect(s().scenarioB!.summary).toBe(b!.summary)
  })

  it('setScenarioB runs one simulate and labels it', () => {
    s().setScenarioB({
      params: defaultParams(),
      init: defaultInitState(),
      settings: defaultSettings(),
      name: 'Defaults',
    })
    const b = s().scenarioB
    expect(b).not.toBeNull()
    expect(b!.scenarioName).toBe('Defaults')
    expect(b!.trajectory.t.length).toBeGreaterThan(0)
    expect(Number.isFinite(b!.summary.finalFdoc)).toBe(true)
  })

  it('clearScenarioB resets to null', () => {
    s().captureBFromA()
    expect(s().scenarioB).not.toBeNull()
    s().clearScenarioB()
    expect(s().scenarioB).toBeNull()
  })
})
