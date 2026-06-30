// src/engine/tabletop/resolver.test.ts
import { describe, it, expect } from 'vitest'
import type { TabletopScenario } from './types'
import { resolveNext, findUnreachable, enumeratePaths } from './resolver'

const mini: TabletopScenario = {
  id: 'mini', name: 'Mini', blurb: '', failureType: 'malfunction', captureResistance: 'silent',
  retrainCadence: 0.5, startLevers: {}, startNodeId: 'a', chapters: [1, 2],
  nodes: [
    { id: 'a', phase: 1, chapter: 1, title: 'A', situation: '', choices: [
      { id: 'a1', label: '', role: 'safety_eng', chapter: 1, rationale: '', leverDeltas: {}, incidentEffects: {}, flags: ['x'], analogRefs: [], citations: [], next: 'b' },
      { id: 'a2', label: '', role: 'safety_eng', chapter: 1, rationale: '', leverDeltas: {}, incidentEffects: {}, flags: [], analogRefs: [], citations: [], next: { ifFlag: 'x', then: 'b', else: 'end' } },
    ] },
    { id: 'b', phase: 2, chapter: 2, title: 'B', situation: '', choices: [
      { id: 'b1', label: '', role: 'safety_eng', chapter: 2, rationale: '', leverDeltas: {}, incidentEffects: {}, flags: [], analogRefs: [], citations: [], next: 'end' },
    ] },
    { id: 'end', phase: 3, chapter: 2, title: 'End', situation: '', choices: [], terminal: true },
    { id: 'orphan', phase: 9, chapter: 1, title: 'Orphan', situation: '', choices: [], terminal: true },
  ],
}

describe('resolver', () => {
  it('resolves a plain next and a conditional next by flag', () => {
    expect(resolveNext(mini.nodes[0].choices[0], [])).toBe('b')
    expect(resolveNext(mini.nodes[0].choices[1], ['x'])).toBe('b')
    expect(resolveNext(mini.nodes[0].choices[1], [])).toBe('end')
  })

  it('flags unreachable nodes', () => {
    expect(findUnreachable(mini)).toEqual(['orphan'])
  })

  it('enumerates every root→terminal path', () => {
    const paths = enumeratePaths(mini)
    expect(paths.length).toBeGreaterThanOrEqual(2)
    for (const p of paths) expect(p.length).toBeGreaterThan(0)
  })

  it('cycle-guards enumeratePaths: a back-edge is treated as a terminal cut-off', () => {
    // Scenario where choice points back to a node already on the path (cycle).
    const cyclic: TabletopScenario = {
      id: 'cyclic', name: 'Cyclic', blurb: '', failureType: 'malfunction', captureResistance: 'silent',
      retrainCadence: 0.3, startLevers: {}, startNodeId: 'x', chapters: [1],
      nodes: [
        { id: 'x', phase: 1, chapter: 1, title: 'X', situation: '', choices: [
          // Back-edge: next points to 'x' itself — the cycle guard should cut it and include the partial path.
          { id: 'x1', label: '', role: 'safety_eng', chapter: 1, rationale: '', leverDeltas: {}, incidentEffects: {}, flags: [], analogRefs: [], citations: [], next: 'x' },
          { id: 'x2', label: '', role: 'safety_eng', chapter: 1, rationale: '', leverDeltas: {}, incidentEffects: {}, flags: [], analogRefs: [], citations: [], next: 'z' },
        ] },
        { id: 'z', phase: 2, chapter: 1, title: 'Z', situation: '', choices: [], terminal: true },
      ],
    }
    const paths = enumeratePaths(cyclic)
    // The cyclic choice (x→x) should produce a 1-choice path (cut by cycle guard);
    // the non-cyclic choice (x→z) should produce a 1-choice path reaching terminal.
    expect(paths.length).toBeGreaterThanOrEqual(1)
    // Every path must be non-empty (the partial cyclic path has at least 1 choice).
    for (const p of paths) expect(p.length).toBeGreaterThan(0)
  })
})
