// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import App from './App'
import { useStore } from './state/store'
import { PARAM_SPEC_BY_ID } from './engine'

/**
 * How long to wait for a lazily-imported view to resolve.
 *
 * This is a module-load wait, not a compute budget, and it was the inner waits rather
 * than the test's own 30s limit that expired on CI: at 5s each they were tighter than
 * the test containing them. vitest runs files across all cores with no worker cap, so
 * this jsdom test shares a 2-4 core runner with the engine's numerical suites and its
 * dynamic imports resolve whenever the event loop gets a turn. A slowdown in the
 * ENGINE is caught by the perf guards in diagnostics.test.ts, which assert wall-clock
 * budgets directly; making a lazy-import wait double as a performance gate only
 * produces flakes that say nothing about the model.
 */
const LAZY_CHUNK_TIMEOUT = 20_000

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
  // Heavy end-to-end: renders the whole shell, resolves several lazy views, and
  // runs the engine repeatedly. The default 5s limit is too tight on CI runners,
  // especially under v8 coverage instrumentation.
  it('renders, switches to Scientific, reacts to a lever, and saves a scenario', async () => {
    render(<App />)
    expect(screen.getByText('DocFlow')).toBeInTheDocument()

    // Switch to Scientific → Workbench (lazy) loads and shows the headline.
    fireEvent.click(screen.getByRole('tab', { name: 'scientific' }))
    // Lazy chunk: allow generous time for the Scientific view to import under parallel workers.
    await screen.findByText('Documented', undefined, { timeout: LAZY_CHUNK_TIMEOUT })

    // Moving a lever flows through to the store (UI → store → recomputed run).
    const privLabel = PARAM_SPEC_BY_ID['precommit'].label
    fireEvent.change(screen.getByLabelText(`${privLabel} value`), { target: { value: '1' } })
    expect(useStore.getState().params.precommit).toBe(1)
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
    await screen.findByText('What should a lab do now?', undefined, { timeout: LAZY_CHUNK_TIMEOUT })
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
  }, 30_000)
})
