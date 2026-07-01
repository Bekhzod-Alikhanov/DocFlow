import { describe, it, expect } from 'vitest'
import { gpaiSystemicRisk } from './gpai-systemic-risk'
import { validateScenario } from '../schema'
import { hasDominantPath, scoreAllPaths } from '../../../engine/tabletop'

describe('gpai-systemic-risk scenario', () => {
  it('validates against the schema', () => {
    expect(validateScenario(gpaiSystemicRisk)).toEqual({ ok: true, errors: [] })
  })

  it('foregrounds chapters 3, 1, and 4', () => {
    const chapters = new Set(
      gpaiSystemicRisk.nodes.flatMap((n) => n.choices.map((c) => c.chapter)),
    )
    expect(chapters.has(3)).toBe(true)
    expect(chapters.has(1)).toBe(true)
    expect(chapters.has(4)).toBe(true)
  })

  it('carries the cyber ~95% estimate caveat verbatim somewhere', () => {
    const caveats = gpaiSystemicRisk.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/estimate/i)
  })

  it('has no dominant path (the thesis property)', () => {
    expect(hasDominantPath(gpaiSystemicRisk)).toBe(false)
  })

  it('the keep-proprietary / oral path wins perceived legal safety but loses remediation and recurrence vs the intermediary / two-track path', () => {
    const scored = scoreAllPaths(gpaiSystemicRisk)

    // Oral paths: took a legal_owns_record or privileged_single_track choice AND never took two_track
    const oralPaths = scored.filter(
      (p) =>
        p.choices.some(
          (c) => c.flags.includes('legal_owns_record') || c.flags.includes('privileged_single_track'),
        ) && !p.choices.some((c) => c.flags.includes('two_track')),
    )
    // Two-track / intermediary paths: took the intermediary routing choice
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
    const maxRemediationTwoTrack = Math.max(
      ...twoTrackPaths.map((p) => p.incident.remediation_completeness),
    )
    expect(maxRemediationTwoTrack).toBeGreaterThan(maxRemediationOral)
  })
})
