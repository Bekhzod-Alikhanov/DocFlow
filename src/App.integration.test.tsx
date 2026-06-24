// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import App from './App'
import { useStore } from './state/store'
import { PARAM_SPEC_BY_ID } from './engine'

// Stub the lazy plotly wrapper so jsdom never loads plotly.js.
vi.mock('./lib/Plot', () => ({ Plot: () => null }))

beforeEach(() => {
  localStorage.clear()
  useStore.getState().loadPreset('neutral')
  useStore.getState().setMode('executive')
  useStore.getState().setView('workbench')
})
afterEach(cleanup)

describe('App happy path', () => {
  it('renders, switches to Scientific, reacts to a lever, and saves a scenario', async () => {
    render(<App />)
    expect(screen.getByText('DocFlow')).toBeInTheDocument()

    // Switch to Scientific → Workbench (lazy) loads and shows the headline.
    fireEvent.click(screen.getByRole('tab', { name: 'scientific' }))
    await screen.findByText('Documented')

    // Moving a lever flows through to the store (UI → store → recomputed run).
    const privLabel = PARAM_SPEC_BY_ID['privilege_strength'].label
    fireEvent.change(screen.getByLabelText(`${privLabel} value`), { target: { value: '1' } })
    expect(useStore.getState().params.privilege_strength).toBe(1)
    expect(useStore.getState().activePresetId).toBeNull() // editing detaches from preset

    // Preset basis drawers expose lever-level rationale metadata.
    fireEvent.click(screen.getAllByRole('button', { name: 'Basis & caveats' })[0])
    expect(screen.getByText('Why this value')).toBeInTheDocument()
    expect(screen.getAllByText('Privilege strength').length).toBeGreaterThan(0)

    // Name + save the scenario; it then appears in the Load dropdown.
    fireEvent.change(screen.getByLabelText('Scenario name'), { target: { value: 'Integration Scn' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Integration Scn' })).toBeInTheDocument()
    })

    // Institutional Design view loads and guided demos hydrate scenario presets.
    fireEvent.click(screen.getByRole('tab', { name: 'Institutional design' }))
    await screen.findByText('What should a lab do now?')
    expect(screen.getByText('Policy package builder')).toBeInTheDocument()
    expect(screen.getByText('Chapter 3 narrative')).toBeInTheDocument()
    expect(screen.getByText('Institutional scorecard')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Apply package to scenario' }))
    expect(useStore.getState().params.effective_challenge).toBeGreaterThanOrEqual(0.85)

    fireEvent.click(screen.getByRole('button', { name: /4\. Mandatory reporting needs safe-to-report/i }))
    expect(useStore.getState().activePresetId).toBe('pharma-safe-report')

    fireEvent.click(screen.getByRole('button', { name: /Export/i }))
    expect(screen.getByRole('menuitem', { name: 'Playbook brief' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Preset comparison' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Lab checklist' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Why SR 11-7 makes documentation a control/i }))
    expect(useStore.getState().activePresetId).toBe('sr11-effective-challenge')
  })
})
