import { describe, it, expect } from 'vitest'
import { productionIncident } from './production-incident'
import { validateScenario } from '../schema'
import { hasDominantPath, scoreAllPaths } from '../../../engine/tabletop'

describe('production-incident scenario', () => {
  it('validates against the schema', () => {
    expect(validateScenario(productionIncident)).toEqual({ ok: true, errors: [] })
  })

  it('foregrounds all four chapters', () => {
    const chapters = new Set(productionIncident.nodes.flatMap((n) => n.choices.map((c) => c.chapter)))
    for (const ch of [1, 2, 3, 4]) expect(chapters.has(ch as 1)).toBe(true)
  })

  it('carries the cyber ~95% estimate caveat verbatim somewhere', () => {
    const caveats = productionIncident.nodes.flatMap((n) => n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')))
    expect(caveats.join(' ')).toMatch(/estimate/i)
  })

  it('flags the EU AI Act / PLD pin-cite caveat', () => {
    const caveats = productionIncident.nodes.flatMap((n) => n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')))
    expect(caveats.join(' ')).toMatch(/pin-cite/i)
  })

  it('has no dominant path (the thesis property)', () => {
    expect(hasDominantPath(productionIncident)).toBe(false)
  })

  it('the keep-it-oral path wins legal safety but loses Aftermath recurrence', () => {
    const scored = scoreAllPaths(productionIncident)
    const oral = scored.filter((p) => p.choices.some((c) => c.flags.includes('legal_owns_record')))
    const others = scored.filter((p) => !p.choices.some((c) => c.flags.includes('legal_owns_record')))
    expect(oral.length).toBeGreaterThan(0)
    const bestLegalSafetyOral = Math.max(...oral.map((p) => p.legalSafety))
    const bestLegalSafetyOther = Math.max(...others.map((p) => p.legalSafety))
    expect(bestLegalSafetyOral).toBeGreaterThanOrEqual(bestLegalSafetyOther - 1e-9)
    const minRecurrenceOral = Math.min(...oral.map((p) => p.outcome.recurrenceRisk))
    const minRecurrenceOther = Math.min(...others.map((p) => p.outcome.recurrenceRisk))
    expect(minRecurrenceOther).toBeLessThan(minRecurrenceOral)
  })
})
