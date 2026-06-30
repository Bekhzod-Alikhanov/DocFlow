// @vitest-environment jsdom
// src/views/Tabletop/Debrief.integration.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Debrief } from './Debrief'
import { useTabletopStore } from '../../state/tabletopStore'
import { useStore } from '../../state/store'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

function playToEnd() {
  useTabletopStore.getState().start(productionIncident)
  let guard = 0
  while (!useTabletopStore.getState().finished && guard++ < 30) {
    const id = useTabletopStore.getState().currentNodeId
    const node = productionIncident.nodes.find((n) => n.id === id)!
    if (!node.choices.length) break
    useTabletopStore.getState().choose(node.choices[0])
  }
}

describe('Debrief + system handoff', () => {
  beforeEach(playToEnd)
  afterEach(cleanup)

  it('shows the engine-forward regime verdict and reveals recurrence risk', () => {
    render(<Debrief />)
    expect(screen.getByText(/recurrence/i)).toBeTruthy()
    expect(screen.getByText(/chilling|learning|contested/i)).toBeTruthy()
  })

  it('"See this as a system" loads scenario A and switches to Tipping', () => {
    render(<Debrief />)
    fireEvent.click(screen.getByRole('button', { name: /see this as a system/i }))
    expect(useStore.getState().mode).toBe('scientific')
    expect(useStore.getState().view).toBe('tipping')
  })
})
