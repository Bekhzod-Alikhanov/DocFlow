// @vitest-environment jsdom
// src/views/Tabletop/ScenarioPicker.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ScenarioPicker } from './ScenarioPicker'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'
import { malfunctionNearMiss } from '../../lib/tabletop/scenarios/malfunction-near-miss'

describe('ScenarioPicker', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))
  afterEach(() => cleanup())

  it('lists multiple scenario names', () => {
    render(<ScenarioPicker />)
    expect(screen.getByText(productionIncident.name)).toBeTruthy()
    expect(screen.getByText(malfunctionNearMiss.name)).toBeTruthy()
  })

  it('switches the run to a clicked, non-active scenario', () => {
    render(<ScenarioPicker />)
    const card = screen.getByText(malfunctionNearMiss.name)
    fireEvent.click(card)

    const state = useTabletopStore.getState()
    expect(state.scenario.id).toBe(malfunctionNearMiss.id)
    expect(state.currentNodeId).toBe(malfunctionNearMiss.startNodeId)
  })
})
