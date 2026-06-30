// @vitest-environment jsdom
// src/views/Tabletop/BoundaryVisualizer.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BoundaryVisualizer } from './BoundaryVisualizer'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('BoundaryVisualizer', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))
  afterEach(() => cleanup())

  it('renders the four professional boundaries', () => {
    render(<BoundaryVisualizer />)
    for (const label of [/engineer/i, /safety/i, /legal/i, /board/i]) expect(screen.getByText(label)).toBeTruthy()
  })
})
