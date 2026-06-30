// @vitest-environment jsdom
// src/views/Tabletop/PhaseView.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { PhaseView } from './PhaseView'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('PhaseView', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))
  afterEach(() => cleanup())

  it('shows the current node situation and a button per choice', () => {
    render(<PhaseView />)
    const node = productionIncident.nodes.find((n) => n.id === productionIncident.startNodeId)!
    expect(screen.getByText(new RegExp(node.title))).toBeTruthy()
    for (const c of node.choices) expect(screen.getByRole('button', { name: new RegExp(c.label.slice(0, 12)) })).toBeTruthy()
  })

  it('advances when a choice is clicked', () => {
    render(<PhaseView />)
    const node = productionIncident.nodes.find((n) => n.id === productionIncident.startNodeId)!
    const before = useTabletopStore.getState().history.length
    fireEvent.click(screen.getByRole('button', { name: new RegExp(node.choices[0].label.slice(0, 12)) }))
    expect(useTabletopStore.getState().history.length).toBe(before + 1)
  })
})
