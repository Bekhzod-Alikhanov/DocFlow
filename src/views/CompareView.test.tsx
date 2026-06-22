// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { useStore } from '../state/store'
import { CompareView } from './CompareView'

// Stub the (lazy, plotly-backed) chart so the test avoids loading plotly in jsdom.
vi.mock('../components/TimeSeriesChart', () => ({ TimeSeriesChart: () => null }))

afterEach(cleanup)

describe('CompareView', () => {
  it('prompts to capture B when none is set', () => {
    useStore.getState().loadPreset('neutral')
    useStore.getState().clearScenarioB()
    render(<CompareView />)
    expect(screen.getByText(/Capture the current scenario/i)).toBeInTheDocument()
  })

  it('renders a delta table comparing A and B', () => {
    useStore.getState().loadPreset('aviation')
    useStore.getState().clearScenarioB()
    useStore.getState().captureBFromA() // B = aviation snapshot
    useStore.getState().loadPreset('cybersecurity') // A diverges to cyber
    render(<CompareView />)

    expect(screen.getByText('Delta table')).toBeInTheDocument()
    expect(screen.getByText('Documentation fraction')).toBeInTheDocument()
    // A and B settle in different regimes → the regime row reads "changed".
    expect(screen.getByText('changed')).toBeInTheDocument()
    // At least one %Δ cell is rendered.
    expect(screen.getAllByText(/%$/).length).toBeGreaterThan(0)
  })
})
