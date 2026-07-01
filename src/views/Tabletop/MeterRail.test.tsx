// @vitest-environment jsdom
// src/views/Tabletop/MeterRail.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MeterRail } from './MeterRail'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('MeterRail', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))
  afterEach(() => cleanup())

  it('shows institutional and incident meters and a scoring-logic toggle', () => {
    render(<MeterRail />)
    expect(screen.getByText(/Safe-to-report/i)).toBeTruthy()
    expect(screen.getByText(/signal fidelity/i)).toBeTruthy()
    const toggle = screen.getAllByRole('button', { name: /show scoring logic/i })[0]
    fireEvent.click(toggle)
    expect(screen.getByText(/formula|levers|flags/i)).toBeTruthy()
  })

  it('surfaces the short-term perceived legal shield with its trap caveat, beside litigation pressure', () => {
    render(<MeterRail />)
    expect(screen.getByText(/perceived legal shield/i)).toBeTruthy()
    expect(screen.getByText(/litigation pressure/i)).toBeTruthy()
    // The shield is labelled short-term/perceived and paired with the fragility caveat.
    // Target the caveat by a substring unique to it — institutional meter "why" notes are
    // now rendered at rest too (e.g. safe-to-report's note contains "feels"), so a broader
    // regex would match multiple elements. This still asserts the real shield caveat.
    expect(screen.getByText(/not a durable/i)).toBeTruthy()
  })
})
