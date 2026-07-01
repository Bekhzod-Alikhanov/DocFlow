import { describe, it, expect } from 'vitest'
import { malfunctionNearMiss } from './malfunction-near-miss'
import { validateScenario } from '../schema'
import { hasDominantPath, scoreAllPaths } from '../../../engine/tabletop'

describe('malfunction-near-miss scenario', () => {
  it('validates against the schema', () => {
    expect(validateScenario(malfunctionNearMiss)).toEqual({ ok: true, errors: [] })
  })

  it('foregrounds chapters 4 and 2', () => {
    const chapters = new Set(malfunctionNearMiss.nodes.flatMap((n) => n.choices.map((c) => c.chapter)))
    expect(chapters.has(4)).toBe(true)
    expect(chapters.has(2)).toBe(true)
  })

  it('carries the cyber ~95% estimate caveat verbatim somewhere', () => {
    const caveats = malfunctionNearMiss.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/estimate/i)
  })

  it('has no dominant path (the thesis property)', () => {
    expect(hasDominantPath(malfunctionNearMiss)).toBe(false)
  })

  it('the keep-it-oral / counsel-gate path wins legal safety but loses recurrence risk vs the two-track path', () => {
    const scored = scoreAllPaths(malfunctionNearMiss)
    // Oral paths: took a privileged-single-track/legal_owns_record choice AND never took the two-track framing
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

    // Two-track path wins learning: lower recurrence risk
    const minRecurrenceOral = Math.min(...oralPaths.map((p) => p.outcome.recurrenceRisk))
    const minRecurrenceTwoTrack = Math.min(...twoTrackPaths.map((p) => p.outcome.recurrenceRisk))
    expect(minRecurrenceTwoTrack).toBeLessThan(minRecurrenceOral)

    // Two-track path wins remediation completeness
    const maxRemediationOral = Math.max(...oralPaths.map((p) => p.incident.remediation_completeness))
    const maxRemediationTwoTrack = Math.max(...twoTrackPaths.map((p) => p.incident.remediation_completeness))
    expect(maxRemediationTwoTrack).toBeGreaterThan(maxRemediationOral)
  })
})
