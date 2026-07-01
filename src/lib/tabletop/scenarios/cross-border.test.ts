import { describe, it, expect } from 'vitest'
import { crossBorder } from './cross-border'
import { validateScenario } from '../schema'
import { hasDominantPath, scoreAllPaths } from '../../../engine/tabletop'

describe('cross-border scenario', () => {
  it('validates against the schema', () => {
    expect(validateScenario(crossBorder)).toEqual({ ok: true, errors: [] })
  })

  it('foregrounds chapters 1 and 3', () => {
    const chapters = new Set(
      crossBorder.nodes.flatMap((n) => n.choices.map((c) => c.chapter)),
    )
    expect(chapters.has(1)).toBe(true)
    expect(chapters.has(3)).toBe(true)
  })

  it('carries the EU AI Act / PLD pin-cite caveat', () => {
    const caveats = crossBorder.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/pin-cite/i)
  })

  it('carries the cyber ~95% estimate caveat verbatim somewhere', () => {
    const caveats = crossBorder.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/estimate/i)
  })

  it('has no dominant path (the thesis property)', () => {
    expect(hasDominantPath(crossBorder)).toBe(false)
  })

  it('the mandatory-bare-file / oral path wins perceived legal safety but loses evidentiary posture and remediation vs two-track + non-admission', () => {
    const scored = scoreAllPaths(crossBorder)

    // Oral/bare-file paths: took legal_owns_record, never two_track
    const oralPaths = scored.filter(
      (p) =>
        p.choices.some(
          (c) => c.flags.includes('legal_owns_record') || c.flags.includes('privileged_single_track'),
        ) && !p.choices.some((c) => c.flags.includes('two_track')),
    )
    // Two-track paths: took two_track non-admission framing
    const twoTrackPaths = scored.filter((p) =>
      p.choices.some((c) => c.flags.includes('two_track')),
    )

    expect(oralPaths.length).toBeGreaterThan(0)
    expect(twoTrackPaths.length).toBeGreaterThan(0)

    // Oral path wins the perceived legal shield
    const bestLegalSafetyOral = Math.max(...oralPaths.map((p) => p.legalSafety))
    const bestLegalSafetyTwoTrack = Math.max(...twoTrackPaths.map((p) => p.legalSafety))
    expect(bestLegalSafetyOral).toBeGreaterThanOrEqual(bestLegalSafetyTwoTrack - 1e-9)

    // Two-track wins: lower recurrence risk
    const minRecurrenceOral = Math.min(...oralPaths.map((p) => p.outcome.recurrenceRisk))
    const minRecurrenceTwoTrack = Math.min(...twoTrackPaths.map((p) => p.outcome.recurrenceRisk))
    expect(minRecurrenceTwoTrack).toBeLessThan(minRecurrenceOral)

    // Two-track wins remediation completeness
    const maxRemediationOral = Math.max(...oralPaths.map((p) => p.incident.remediation_completeness))
    const maxRemediationTwoTrack = Math.max(...twoTrackPaths.map((p) => p.incident.remediation_completeness))
    expect(maxRemediationTwoTrack).toBeGreaterThan(maxRemediationOral)

    // Two-track wins evidentiary posture (cross-border PLD exposure signature)
    const maxEvidOral = Math.max(...oralPaths.map((p) => p.incident.evidentiary_posture))
    const maxEvidTwoTrack = Math.max(...twoTrackPaths.map((p) => p.incident.evidentiary_posture))
    expect(maxEvidTwoTrack).toBeGreaterThan(maxEvidOral)
  })
})
