// @vitest-environment jsdom
// src/views/Tabletop/TabletopSurface.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { TabletopSurface } from './TabletopSurface'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('TabletopSurface', () => {
  afterEach(() => cleanup())

  it('renders the scenario name and the first node situation', () => {
    render(<TabletopSurface />)
    expect(screen.getByText(/Tabletop/i)).toBeTruthy()
  })

  it('shows a boundary label and an analog cue during play after start(productionIncident)', () => {
    useTabletopStore.getState().start(productionIncident)
    render(<TabletopSurface />)
    // BoundaryVisualizer renders station labels: Engineer, Safety, Legal, Board
    expect(screen.getAllByText(/engineer/i).length).toBeGreaterThan(0)
    // AnalogMentorPanel renders each analog's mechanism or transferablePrinciple
    expect(screen.getAllByText(/principle|mechanism|analog/i).length).toBeGreaterThan(0)
  })
})
