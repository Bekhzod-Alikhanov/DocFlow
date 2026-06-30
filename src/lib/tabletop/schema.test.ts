import { describe, it, expect } from 'vitest'
import { validateScenario } from './schema'
import type { TabletopScenario } from '../../engine/tabletop'

const good: TabletopScenario = {
  id: 's', name: 'S', blurb: 'b', failureType: 'malfunction', captureResistance: 'silent',
  retrainCadence: 0.5, startLevers: { workflow_protection: 0.3 }, startNodeId: 'a', chapters: [1],
  nodes: [
    { id: 'a', phase: 1, chapter: 1, title: 'A', situation: 's', choices: [
      { id: 'a1', label: 'L', role: 'safety_eng', chapter: 1, rationale: 'r', leverDeltas: { just_culture: 0.1 }, incidentEffects: { signal_fidelity: -5 }, flags: [], analogRefs: [], citations: [{ text: 'PSQIA' }], next: 'end' },
    ] },
    { id: 'end', phase: 2, chapter: 1, title: 'End', situation: 's', choices: [], terminal: true },
  ],
}

describe('validateScenario', () => {
  it('accepts a well-formed scenario', () => {
    expect(validateScenario(good)).toEqual({ ok: true, errors: [] })
  })

  it('rejects an unknown lever key in leverDeltas', () => {
    const bad = structuredClone(good)
    ;(bad.nodes[0].choices[0].leverDeltas as Record<string, number>).not_a_lever = 0.5
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/not_a_lever/)
  })

  it('rejects a dangling next target', () => {
    const bad = structuredClone(good)
    bad.nodes[0].choices[0].next = 'nowhere'
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/nowhere/)
  })

  it('rejects an unreachable node', () => {
    const bad = structuredClone(good)
    bad.nodes.push({ id: 'orphan', phase: 9, chapter: 1, title: 'O', situation: '', choices: [], terminal: true })
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/orphan/)
  })

  it('rejects an incident-effect key that is not a meter', () => {
    const bad = structuredClone(good)
    ;(bad.nodes[0].choices[0].incidentEffects as Record<string, number>).bogus = 1
    expect(validateScenario(bad).ok).toBe(false)
    expect(validateScenario(bad).errors.join(' ')).toMatch(/bogus/)
  })

  it('rejects an unknown lever key in startLevers', () => {
    const bad = structuredClone(good)
    ;(bad.startLevers as Record<string, number>).not_a_lever = 0.5
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/not_a_lever/)
  })

  it('rejects an unknown role', () => {
    const bad = structuredClone(good)
    ;(bad.nodes[0].choices[0] as { role: string }).role = 'mayor'
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/mayor/)
  })

  it('rejects a non-terminal choice with no citations', () => {
    const bad = structuredClone(good)
    bad.nodes[0].choices[0].citations = []
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/citation/i)
  })

  it('rejects duplicate node ids', () => {
    const bad = structuredClone(good)
    bad.nodes.push(structuredClone(bad.nodes[0]))
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/duplicate/i)
  })
})
