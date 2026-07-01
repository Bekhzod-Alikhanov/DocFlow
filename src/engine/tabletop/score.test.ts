import { describe, it, expect } from 'vitest'
import type { TabletopScenario } from './types'
import { scoreAllPaths, hasDominantPath, initialRunState, dominates, perceivedLegalShield } from './score'

// Two-path scenario: "oral" maxes legal safety but tanks learning/remediation;
// "translation" inverts the trade-off. Neither dominates the other.
const scenario: TabletopScenario = {
  id: 'trade', name: 'Trade', blurb: '', failureType: 'malfunction', captureResistance: 'irreproducible',
  retrainCadence: 0.6, startLevers: { workflow_protection: 0.4, safe_harbor_non_admission: 0.4 }, startNodeId: 'root', chapters: [1, 2, 3, 4],
  nodes: [
    { id: 'root', phase: 1, chapter: 1, title: 'Routing', situation: '', choices: [
      { id: 'oral', label: 'Keep it oral; counsel owns the record', role: 'counsel', chapter: 2, rationale: '',
        leverDeltas: { privilege_strength: 0.4, workflow_protection: -0.3, safe_harbor_non_admission: -0.3, translation_layer: -0.2, effective_challenge: -0.2 },
        incidentEffects: { remediation_completeness: -10 }, flags: ['legal_owns_record'], analogRefs: ['cyber'], citations: [], next: 'oralEnd' },
      { id: 'translate', label: 'Two-track: protected workflow + factual core', role: 'safety_eng', chapter: 3, rationale: '',
        leverDeltas: { workflow_protection: 0.4, safe_harbor_non_admission: 0.4, translation_layer: 0.4, effective_challenge: 0.4, original_records_boundary: 0.3, just_culture: 0.3 },
        incidentEffects: { remediation_completeness: 40, regulatory_timeliness: 20 }, flags: ['two_track', 'independent_review_channel'], analogRefs: ['psqia'], citations: [], next: 'transEnd' },
    ] },
    { id: 'oralEnd', phase: 8, chapter: 4, title: 'Aftermath', situation: '', choices: [], terminal: true },
    { id: 'transEnd', phase: 8, chapter: 4, title: 'Aftermath', situation: '', choices: [], terminal: true },
  ],
}

describe('path scoring & no-dominant-path', () => {
  it('initialRunState seeds levers from the scenario', () => {
    const s = initialRunState(scenario)
    expect(s.params.workflow_protection).toBeCloseTo(0.4)
  })

  it('initialRunState clamps out-of-range startLevers to the registry range', () => {
    // Out-of-range startLevers must be routed through clampParam, not assigned raw:
    // 5 clamps down to 1, -3 clamps up to 0. Prevents a bad scenario from seeding
    // a lever outside [0,1] and poisoning every downstream meter.
    const bad: TabletopScenario = {
      ...scenario,
      startLevers: { privilege_strength: 5, original_records_boundary: -3 },
    }
    const s = initialRunState(bad)
    expect(s.params.privilege_strength).toBe(1)
    expect(s.params.original_records_boundary).toBe(0)
  })

  it('perceivedLegalShield stays within [0,1] for low and high privilege configs', () => {
    // Low config: no privilege, full original-records boundary, no single-track flag.
    const low = initialRunState({
      ...scenario,
      startLevers: { privilege_strength: 0, original_records_boundary: 1 },
    })
    const shieldLow = perceivedLegalShield(low)
    expect(shieldLow).toBeGreaterThanOrEqual(0)
    expect(shieldLow).toBeLessThanOrEqual(1)

    // High config: max privilege, no original-records boundary, privileged single track.
    const high = initialRunState({
      ...scenario,
      startLevers: { privilege_strength: 1, original_records_boundary: 0 },
    })
    high.flags = ['privileged_single_track']
    const shieldHigh = perceivedLegalShield(high)
    expect(shieldHigh).toBeGreaterThanOrEqual(0)
    expect(shieldHigh).toBeLessThanOrEqual(1)
    // The high config must read as a stronger perceived shield than the low config.
    expect(shieldHigh).toBeGreaterThan(shieldLow)
  })

  it('the oral path wins short-term *perceived* legal safety', () => {
    const scored = scoreAllPaths(scenario)
    const oral = scored.find((p) => p.choices[0].id === 'oral')!
    const translate = scored.find((p) => p.choices[0].id === 'translate')!
    // legalSafety is the felt, short-term shield (privilege + off-the-record), NOT
    // the durable litigation_pressure. The oral path maximizes it — that is the lure.
    expect(oral.legalSafety).toBeGreaterThan(translate.legalSafety)
  })

  it('decoupling: the oral path does NOT also win durable litigation pressure (privilege-first is a trap)', () => {
    const scored = scoreAllPaths(scenario)
    const oral = scored.find((p) => p.choices[0].id === 'oral')!
    const translate = scored.find((p) => p.choices[0].id === 'translate')!
    // Gutting the protective workflow raises real discoverability more than privilege lowers it,
    // so the two-track path ends with LOWER litigation pressure than the oral path.
    expect(translate.institutional.litigation_pressure).toBeLessThan(oral.institutional.litigation_pressure)
  })

  it('the oral path loses on learning, remediation, and recurrence', () => {
    const scored = scoreAllPaths(scenario)
    const oral = scored.find((p) => p.choices[0].id === 'oral')!
    const translate = scored.find((p) => p.choices[0].id === 'translate')!
    expect(translate.institutional.learning_yield).toBeGreaterThan(oral.institutional.learning_yield)
    expect(translate.incident.remediation_completeness).toBeGreaterThan(oral.incident.remediation_completeness)
    expect(translate.outcome.recurrenceRisk).toBeLessThan(oral.outcome.recurrenceRisk)
  })

  it('no path dominates every meter (the core thesis property)', () => {
    expect(hasDominantPath(scenario)).toBe(false)
  })
})

// Positive controls for the no-dominant-path detector. Without these, an always-false
// `dominates`/`hasDominantPath` would pass every assertion above (they only assert false).
describe('dominates (Pareto strict-domination helper)', () => {
  it('is true when strictly better on every dimension', () => {
    expect(dominates([2, 2, 2], [1, 1, 1])).toBe(true)
  })

  it('is false when better on one dimension but worse on another', () => {
    expect(dominates([2, 1], [1, 2])).toBe(false)
  })

  it('is false for equal vectors (domination must be strict on ≥1 dimension)', () => {
    expect(dominates([1, 1], [1, 1])).toBe(false)
  })
})

// A constructed 2-path scenario where one choice is strictly better on every good-vector
// dimension: it raises the private-orderable / learning levers, carries the perceived-shield
// flag, sets positive incidentEffects, and lowers recurrence — while the other choice is
// strictly worse on all of them. This MUST trip the detector to true, proving it can fire.
const dominatedScenario: TabletopScenario = {
  id: 'dom', name: 'Dominant', blurb: '', failureType: 'malfunction', captureResistance: 'irreproducible',
  retrainCadence: 0.2, startLevers: {}, startNodeId: 'root', chapters: [1, 2, 3, 4],
  nodes: [
    { id: 'root', phase: 1, chapter: 1, title: 'Routing', situation: '', choices: [
      { id: 'strong', label: 'Strictly better on every meter', role: 'safety_eng', chapter: 4, rationale: '',
        // Raise only private-orderable / learning levers — leave privilege, workflow,
        // safe_harbor, original_records at default so policy-scaffold dependency does not
        // rise. The legal_owns_record flag lifts perceived shield with no lever cost.
        leverDeltas: {
          recipient_enforcer_separation: 0.4, effective_challenge: 0.4,
          translation_layer: 0.4, near_miss_tier: 0.4, intermediary_capacity: 0.4, just_culture: 0.4,
        },
        incidentEffects: {
          record_capturability: 40, regulatory_timeliness: 40, board_oversight_visibility: 40,
          evidentiary_posture: 40, remediation_completeness: 40, recurrence_risk: -20,
        },
        flags: ['state_snapshotted', 'pipeline_captured', 'legal_owns_record'], analogRefs: [], citations: [], next: 'aEnd' },
      { id: 'weak', label: 'Strictly worse no-op-ish path', role: 'counsel', chapter: 4, rationale: '',
        leverDeltas: {
          recipient_enforcer_separation: -0.1, effective_challenge: -0.1,
          translation_layer: -0.1, near_miss_tier: -0.1, intermediary_capacity: -0.1, just_culture: -0.1,
        },
        incidentEffects: {
          record_capturability: -10, regulatory_timeliness: -10, board_oversight_visibility: -10,
          evidentiary_posture: -10, remediation_completeness: -10, recurrence_risk: 10,
        },
        flags: [], analogRefs: [], citations: [], next: 'bEnd' },
    ] },
    { id: 'aEnd', phase: 8, chapter: 4, title: 'Aftermath', situation: '', choices: [], terminal: true },
    { id: 'bEnd', phase: 8, chapter: 4, title: 'Aftermath', situation: '', choices: [], terminal: true },
  ],
}

describe('hasDominantPath positive control', () => {
  it('returns true when one path is strictly better on every good-vector dimension', () => {
    expect(hasDominantPath(dominatedScenario)).toBe(true)
  })
})
