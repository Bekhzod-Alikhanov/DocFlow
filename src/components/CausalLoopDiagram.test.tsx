// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CausalLoopDiagram } from './CausalLoopDiagram'

afterEach(cleanup)

describe('CausalLoopDiagram', () => {
  it('renders an accessible image naming the dominant loop', () => {
    render(<CausalLoopDiagram activity={{ r1: 0.1, r2: 0.8, balancing: 0.1 }} regime="learning" />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('aria-label')).toMatch(/Learning flywheel/)
    expect(img.getAttribute('aria-label')).toMatch(/learning/)
  })

  it('reflects a chilling-dominant state', () => {
    render(<CausalLoopDiagram activity={{ r1: 0.9, r2: 0.05, balancing: 0.05 }} regime="chilling" />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/Suppression spiral/)
  })
})
