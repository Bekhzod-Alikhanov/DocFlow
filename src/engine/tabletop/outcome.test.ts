// src/engine/tabletop/outcome.test.ts
import { describe, it, expect } from 'vitest'
import { defaultParams, defaultInitState, defaultSettings } from '../registry'
import { simulate } from '../simulate'
import { initialIncidentMeters } from './types'
import { engineForwardOutcome } from './outcome'
import type { RunState } from './applyChoice'

function stateWith(params = defaultParams()): RunState {
  return {
    params, init: defaultInitState(), settings: defaultSettings(),
    flags: [], incident: initialIncidentMeters(), retrainCadence: 0.6,
    failureType: 'malfunction', captureResistance: 'irreproducible',
  }
}

describe('engine-forward Aftermath', () => {
  it('regime equals the real engine summary for the final config (parity)', () => {
    const s = stateWith()
    const expected = simulate(s.init, s.params, s.settings).summary.regime
    expect(engineForwardOutcome(s).regime).toBe(expected)
  })

  it('recurrence risk is 0–100 and higher for a chilling config than a learning one', () => {
    const chilling = stateWith({ ...defaultParams(), privilege_strength: 0.9, pld_penalty: 0.8, workflow_protection: 0.05, safe_harbor_non_admission: 0.05 })
    const learning = stateWith({ ...defaultParams(), workflow_protection: 0.9, safe_harbor_non_admission: 0.9, effective_challenge: 0.9, translation_layer: 0.9, just_culture: 0.9 })
    const rc = engineForwardOutcome(chilling).recurrenceRisk
    const rl = engineForwardOutcome(learning).recurrenceRisk
    expect(rc).toBeGreaterThan(rl)
    expect(rc).toBeLessThanOrEqual(100)
    expect(rl).toBeGreaterThanOrEqual(0)
  })
})
