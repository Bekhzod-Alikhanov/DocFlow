// src/engine/tabletop/applyChoice.test.ts
import { describe, it, expect } from 'vitest'
import { defaultParams, defaultInitState, defaultSettings } from '../registry'
import { initialIncidentMeters, type Choice } from './types'
import { applyChoice, type RunState } from './applyChoice'

function baseState(): RunState {
  return {
    params: defaultParams(),
    init: defaultInitState(),
    settings: defaultSettings(),
    flags: [],
    incident: initialIncidentMeters(),
    retrainCadence: 0.6,
    failureType: 'malfunction',
    captureResistance: 'irreproducible',
  }
}

const captureChoice: Choice = {
  id: 'snapshot', label: 'Snapshot model state', role: 'safety_eng', chapter: 4,
  rationale: 'Preserve weights and feature distributions before the next training run.',
  leverDeltas: { original_records_boundary: 0.2 },
  incidentEffects: {}, flags: ['state_snapshotted'], analogRefs: [], citations: [], next: 'n2',
}

const boundaryBottleneck: Choice = {
  id: 'legal-owns', label: 'Route everything through counsel', role: 'counsel', chapter: 2,
  rationale: 'Counsel owns the record; fewer records get written.',
  leverDeltas: { privilege_strength: 0.2 },
  incidentEffects: {}, flags: ['legal_owns_record'], analogRefs: ['cyber'], citations: [], next: 'n3',
}

describe('applyChoice', () => {
  it('is pure: does not mutate the input state', () => {
    const s = baseState()
    const before = JSON.stringify(s)
    applyChoice(s, captureChoice)
    expect(JSON.stringify(s)).toBe(before)
  })

  it('folds clamped lever deltas and records flags', () => {
    const next = applyChoice(baseState(), captureChoice)
    expect(next.params.original_records_boundary).toBeCloseTo(defaultParams().original_records_boundary + 0.2)
    expect(next.flags).toContain('state_snapshotted')
  })

  it('clamps levers into [0,1]', () => {
    const s = baseState()
    s.params = { ...s.params, privilege_strength: 0.95 }
    const next = applyChoice(s, { ...boundaryBottleneck, leverDeltas: { privilege_strength: 0.5 } })
    expect(next.params.privilege_strength).toBe(1)
  })

  it('recomputes record_capturability from capture flags', () => {
    const next = applyChoice(baseState(), captureChoice)
    expect(next.incident.record_capturability).toBeGreaterThan(initialIncidentMeters().record_capturability - 1)
  })

  it('drops signal fidelity through a Ch.2 boundary handoff', () => {
    const next = applyChoice(baseState(), boundaryBottleneck)
    expect(next.incident.signal_fidelity).toBeLessThan(100)
  })

  it('applies explicit incidentEffects deltas, clamped to 0–100', () => {
    const choice: Choice = { ...captureChoice, incidentEffects: { evidentiary_posture: 30, regulatory_timeliness: -200 } }
    const next = applyChoice(baseState(), choice)
    expect(next.incident.evidentiary_posture).toBe(80)
    expect(next.incident.regulatory_timeliness).toBe(0)
  })

  it('folds the authored board_oversight_visibility delta into the Ch.2 fidelity baseline', () => {
    // Same starting state, same Ch.2 transfer-function inputs — only the authored
    // board-routing delta differs. The +25 (structured channel) must end up strictly
    // higher than the -15 (informal brief), proving the authored delta survives the
    // fidelity-derived recompute (it used to be overwritten and collapse to equal).
    const structured: Choice = {
      ...boundaryBottleneck,
      flags: [],
      leverDeltas: {},
      incidentEffects: { board_oversight_visibility: 25 },
    }
    const informal: Choice = {
      ...boundaryBottleneck,
      flags: [],
      leverDeltas: {},
      incidentEffects: { board_oversight_visibility: -15 },
    }
    const a = applyChoice(baseState(), structured)
    const b = applyChoice(baseState(), informal)
    expect(a.incident.board_oversight_visibility).toBeGreaterThan(b.incident.board_oversight_visibility)
  })
})
