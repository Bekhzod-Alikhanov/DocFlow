// @vitest-environment jsdom
// src/views/Tabletop/MeterRail.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MeterRail, INSTITUTIONAL_LOGIC, INCIDENT_LOGIC, SHIELD_LOGIC } from './MeterRail'
import type { ScoringLogicEntry } from './ScoringLogicPanel'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'
import { LEVER_KEYS, PARAM_SPEC_BY_ID } from '../../engine'

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

/**
 * V11.3 (label coherence), extended to the Tabletop scoring-logic panel.
 *
 * This panel shipped to production in v0.3.0 still naming `privilege_strength` as a
 * driver of five meters, three commits after M3b retired that lever. It compiled and
 * every test passed because `levers` was typed `string[]` and the ids are only ever
 * joined into display text — nothing could fail. `levers` is now `LeverKey[]`, which
 * catches the id list at build time; these tests catch the free-form formula prose,
 * which no type can police.
 */
describe('scoring-logic metadata names only levers that exist', () => {
  const ALL_ENTRIES: [string, ScoringLogicEntry][] = [
    ...Object.entries(INSTITUTIONAL_LOGIC),
    ...Object.entries(INCIDENT_LOGIC),
    ['perceived_legal_shield', SHIELD_LOGIC],
  ]

  it('every declared lever id resolves in the parameter registry', () => {
    for (const [meter, logic] of ALL_ENTRIES) {
      for (const lever of logic.levers) {
        expect(PARAM_SPEC_BY_ID[lever], `${meter} names unknown lever ${lever}`).toBeTruthy()
        expect((LEVER_KEYS as readonly string[]).includes(lever), `${meter}: ${lever} is not a lever`).toBe(true)
      }
    }
  })

  it('no formula string mentions a lever retired in v0.3.0', () => {
    // `privilege_strength` became the computed auxiliary `privilege_survival` (pi) in
    // M3b. Any prose still calling it a lever is telling the user something false.
    const RETIRED = ['privilege_strength']
    for (const [meter, logic] of ALL_ENTRIES) {
      for (const dead of RETIRED) {
        expect(logic.formula, `${meter} formula still cites retired lever ${dead}`).not.toContain(dead)
      }
    }
  })

  it('a formula that cites a lever by name declares it in `levers`', () => {
    // Guards the reverse drift: prose gains a term, the lever list does not.
    for (const [meter, logic] of ALL_ENTRIES) {
      for (const key of LEVER_KEYS) {
        if (!logic.formula.includes(key)) continue
        expect(
          logic.levers.includes(key),
          `${meter} formula cites ${key} but omits it from levers`,
        ).toBe(true)
      }
    }
  })
})
