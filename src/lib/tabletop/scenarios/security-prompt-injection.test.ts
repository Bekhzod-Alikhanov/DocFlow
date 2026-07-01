import { describe, it, expect } from 'vitest'
import { securityPromptInjection } from './security-prompt-injection'
import { validateScenario } from '../schema'
import { hasDominantPath, scoreAllPaths } from '../../../engine/tabletop'

describe('security-prompt-injection scenario', () => {
  it('validates against the schema', () => {
    expect(validateScenario(securityPromptInjection)).toEqual({ ok: true, errors: [] })
  })

  it('foregrounds chapters 4, 2, and 1', () => {
    const chapters = new Set(
      securityPromptInjection.nodes.flatMap((n) => n.choices.map((c) => c.chapter)),
    )
    expect(chapters.has(4)).toBe(true)
    expect(chapters.has(2)).toBe(true)
    expect(chapters.has(1)).toBe(true)
  })

  it('carries the cyber ~95% estimate caveat verbatim somewhere', () => {
    const caveats = securityPromptInjection.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/estimate/i)
  })

  it('flags the CIRCIA final-rule caveat', () => {
    const caveats = securityPromptInjection.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/final rule not yet issued/i)
  })

  it('flags the EU AI Act / PLD pin-cite caveat', () => {
    const caveats = securityPromptInjection.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/pin-cite/i)
  })

  it('has no dominant path (the thesis property)', () => {
    expect(hasDominantPath(securityPromptInjection)).toBe(false)
  })

  it('the oral/counsel-owns-record path wins perceived legal safety but loses remediation and recurrence vs the two-track path', () => {
    const scored = scoreAllPaths(securityPromptInjection)

    // Oral paths: took a legal_owns_record or privileged_single_track choice AND never took two_track
    const oralPaths = scored.filter(
      (p) =>
        p.choices.some(
          (c) => c.flags.includes('legal_owns_record') || c.flags.includes('privileged_single_track'),
        ) && !p.choices.some((c) => c.flags.includes('two_track')),
    )
    // Two-track paths: took the two-track routing choice
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
