import { describe, it, expect } from 'vitest'
import { buildCSV, buildLabChecklist, buildPlaybookBrief, buildPresetComparison, provenanceHeader, type ExportContext } from './export'
import { simulate, defaultParams, defaultInitState, defaultSettings, MODEL_VERSION } from '../engine'
import { NO_FORECAST_LINE } from './format'

function ctx(): ExportContext {
  const params = defaultParams()
  const init = defaultInitState()
  const settings = defaultSettings()
  const { trajectory, summary } = simulate(init, params, settings)
  return {
    params,
    init,
    settings,
    trajectory,
    summary,
    scenarioName: 'CSV Test',
    presetId: 'cybersecurity',
    timestamp: '2026-01-01T00:00:00.000Z',
  }
}

describe('export', () => {
  it('provenance header carries the no-forecast line and model version', () => {
    const lines = provenanceHeader(ctx())
    expect(lines[0]).toBe(NO_FORECAST_LINE)
    expect(lines.some((l) => l.includes(MODEL_VERSION))).toBe(true)
  })

  it('buildCSV emits commented provenance + a wide series table', () => {
    const c = ctx()
    const csv = buildCSV(c)
    const lines = csv.split('\n')
    expect(lines[0]).toBe(`# ${NO_FORECAST_LINE}`)
    const header = lines.find((l) => l.startsWith('t,'))!
    expect(header).toBe('t,U,D,TD,L,E,C,f_doc,harm_events')
    // One data row per timestep.
    const dataRows = lines.filter((l) => /^[0-9]/.test(l))
    expect(dataRows.length).toBe(c.trajectory.t.length)
  })

  it('buildPlaybookBrief emits scenario, recommendations, packages, source notes, and caveats', () => {
    const brief = buildPlaybookBrief(ctx())
    expect(brief).toContain(NO_FORECAST_LINE)
    expect(brief).toContain('not legal advice')
    expect(brief).toContain('This export is decision-support')
    expect(brief).toContain('## Institutional Scorecard')
    expect(brief).toContain('## Recommendations')
    expect(brief).toContain('## Policy Package Suggestions')
    expect(brief).toContain('## Private Ordering vs Law / Regulator')
    expect(brief).toContain('## Closest Regime Matches')
    expect(brief).toContain('## Regime Comparison Matrix')
    expect(brief).toContain('## Source Caveats')
    expect(brief).toContain('## Active Preset Lever Source Notes')
    expect(brief).toContain('95%')
  })

  it('buildPresetComparison includes all presets and legal/source caveats', () => {
    const comparison = buildPresetComparison(ctx())
    expect(comparison).toContain(NO_FORECAST_LINE)
    expect(comparison).toContain('not legal advice')
    expect(comparison).toContain('| Preset | Expected | Simulated |')
    expect(comparison).toContain('Cyber privilege-first anti-pattern')
    expect(comparison).toContain('EU AI Act + PLD (the structural trap)')
    expect(comparison).toContain('## Source Caveats')
  })

  it('buildLabChecklist emits the internal architecture checklist and current recommendations', () => {
    const checklist = buildLabChecklist(ctx())
    expect(checklist).toContain(NO_FORECAST_LINE)
    expect(checklist).toContain('not legal advice')
    expect(checklist).toContain('## Factual record checklist')
    expect(checklist).toContain('## Protected analysis checklist')
    expect(checklist).toContain('## Reporting channel checklist')
    expect(checklist).toContain('## Independent review checklist')
    expect(checklist).toContain('## Statutory asks checklist')
    expect(checklist).toContain('## Current Scenario Recommendations')
  })
})
