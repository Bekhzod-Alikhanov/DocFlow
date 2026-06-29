import { describe, it, expect } from 'vitest'
import type { TabletopScenario } from './types'
import { scoreAllPaths, hasDominantPath, initialRunState } from './score'

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
