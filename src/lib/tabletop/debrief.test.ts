// src/lib/tabletop/debrief.test.ts
import { describe, it, expect } from 'vitest'
import { buildDebriefMarkdown } from './debrief'
import { productionIncident } from './scenarios/production-incident'
import { scoreAllPaths } from '../../engine/tabletop'

describe('after-action debrief', () => {
  const scored = scoreAllPaths(productionIncident)
  const md = buildDebriefMarkdown({ scenario: productionIncident, played: scored[0], counterfactual: scored[1] ?? null, timestamp: '2026-06-29T00:00:00.000Z' })

  it('includes the no-forecast and not-legal-advice lines', () => {
    // NO_FORECAST_LINE = 'Scenario projection under stated assumptions. Structural/relational model, not a calibrated forecast.'
    expect(md).toContain('not a calibrated forecast')
    // NO_LEGAL_ADVICE_LINE = 'This output is structured decision-support, not legal advice.'
    expect(md.toLowerCase()).toContain('not legal advice')
  })

  it('has a per-chapter readout section', () => {
    expect(md).toMatch(/Ch\.?\s*2/)
    expect(md.toLowerCase()).toContain('per-chapter')
  })

  it('reports the engine-forward outcome and a counterfactual', () => {
    expect(md.toLowerCase()).toContain('recurrence')
    expect(md.toLowerCase()).toContain('counterfactual')
  })
})
