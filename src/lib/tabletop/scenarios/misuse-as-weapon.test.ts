import { describe, it, expect } from 'vitest'
import { misuseAsWeapon } from './misuse-as-weapon'
import { validateScenario } from '../schema'
import { hasDominantPath, scoreAllPaths } from '../../../engine/tabletop'

describe('misuse-as-weapon scenario', () => {
  it('validates against the schema', () => {
    expect(validateScenario(misuseAsWeapon)).toEqual({ ok: true, errors: [] })
  })

  it('foregrounds chapters 4, 2, and 1', () => {
    const chapters = new Set(misuseAsWeapon.nodes.flatMap((n) => n.choices.map((c) => c.chapter)))
    expect(chapters.has(4)).toBe(true)
    expect(chapters.has(2)).toBe(true)
    expect(chapters.has(1)).toBe(true)
  })

  it('carries the cyber ~95% estimate caveat verbatim somewhere', () => {
    const caveats = misuseAsWeapon.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/estimate/i)
  })

  it('flags the EU AI Act / PLD pin-cite caveat', () => {
    const caveats = misuseAsWeapon.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/pin-cite/i)
  })

  it('has no dominant path (the thesis property)', () => {
    expect(hasDominantPath(misuseAsWeapon)).toBe(false)
  })

  it('the user-fault / oral path wins legal safety but loses recurrence and remediation vs the two-track path', () => {
    const scored = scoreAllPaths(misuseAsWeapon)
    // Oral paths: took a privileged-single-track choice AND never took the two-track framing
    const oralPaths = scored.filter(
      (p) =>
        p.choices.some((c) => c.flags.includes('legal_owns_record') || c.flags.includes('privileged_single_track')) &&
        !p.choices.some((c) => c.flags.includes('two_track')),
    )
    // Two-track paths: took the two-track framing choice
    const twoTrackPaths = scored.filter((p) =>
      p.choices.some((c) => c.flags.includes('two_track')),
    )
    expect(oralPaths.length).toBeGreaterThan(0)
    expect(twoTrackPaths.length).toBeGreaterThan(0)

    // Oral path wins the perceived legal shield
    const bestLegalSafetyOral = Math.max(...oralPaths.map((p) => p.legalSafety))
    const bestLegalSafetyTwoTrack = Math.max(...twoTrackPaths.map((p) => p.legalSafety))
    expect(bestLegalSafetyOral).toBeGreaterThanOrEqual(bestLegalSafetyTwoTrack - 1e-9)

    // Two-track path wins: lower recurrence risk
    const minRecurrenceOral = Math.min(...oralPaths.map((p) => p.outcome.recurrenceRisk))
    const minRecurrenceTwoTrack = Math.min(...twoTrackPaths.map((p) => p.outcome.recurrenceRisk))
    expect(minRecurrenceTwoTrack).toBeLessThan(minRecurrenceOral)

    // Two-track path wins remediation completeness
    const maxRemediationOral = Math.max(...oralPaths.map((p) => p.incident.remediation_completeness))
    const maxRemediationTwoTrack = Math.max(...twoTrackPaths.map((p) => p.incident.remediation_completeness))
    expect(maxRemediationTwoTrack).toBeGreaterThan(maxRemediationOral)
  })
})
