// @vitest-environment jsdom
// src/views/Tabletop/AnalogMentorPanel.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { AnalogMentorPanel } from './AnalogMentorPanel'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('AnalogMentorPanel', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))
  afterEach(() => cleanup())
  it('shows at least one sector analog with its transferable principle', () => {
    render(<AnalogMentorPanel />)
    // The start node references at least one analog (e.g. cyber or psqia).
    expect(screen.getAllByText(/principle|mechanism|analog/i).length).toBeGreaterThan(0)
  })
})
