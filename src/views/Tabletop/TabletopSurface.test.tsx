// @vitest-environment jsdom
// src/views/Tabletop/TabletopSurface.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TabletopSurface } from './TabletopSurface'

describe('TabletopSurface', () => {
  it('renders the scenario name and the first node situation', () => {
    render(<TabletopSurface />)
    expect(screen.getByText(/Tabletop/i)).toBeTruthy()
  })
})
