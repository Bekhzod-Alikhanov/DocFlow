// @vitest-environment jsdom
// src/state/tabletopStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTabletopStore } from './tabletopStore'
import { useStore } from './store'
import { productionIncident } from '../lib/tabletop/scenarios/production-incident'

describe('tabletopStore', () => {
  beforeEach(() => useTabletopStore.getState().reset())

  it('starts at the scenario start node with seeded levers', () => {
    useTabletopStore.getState().start(productionIncident)
    const s = useTabletopStore.getState()
    expect(s.currentNodeId).toBe(productionIncident.startNodeId)
    expect(s.finished).toBe(false)
    expect(s.institutional.litigation_pressure).toBeGreaterThanOrEqual(0)
  })

  it('choosing advances the node and records history', () => {
    useTabletopStore.getState().start(productionIncident)
    const firstChoice = productionIncident.nodes.find((n) => n.id === productionIncident.startNodeId)!.choices[0]
    useTabletopStore.getState().choose(firstChoice)
    expect(useTabletopStore.getState().history).toContainEqual(firstChoice)
  })

  it('handoffToSystem loads scenario A and switches to the Tipping tab', () => {
    useTabletopStore.getState().start(productionIncident)
    // play to the end by repeatedly taking the first choice
    let guard = 0
    while (!useTabletopStore.getState().finished && guard++ < 20) {
      const id = useTabletopStore.getState().currentNodeId
      const node = productionIncident.nodes.find((n) => n.id === id)!
      if (node.choices.length === 0) break
      useTabletopStore.getState().choose(node.choices[0])
    }
    useTabletopStore.getState().handoffToSystem()
    expect(useStore.getState().mode).toBe('scientific')
    expect(useStore.getState().view).toBe('tipping')
    expect(useStore.getState().activePresetId).toBeNull()
  })
})
