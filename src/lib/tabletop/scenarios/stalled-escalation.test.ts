import { describe, it, expect } from 'vitest'
import { stalledEscalation } from './stalled-escalation'
import { validateScenario } from '../schema'
import { hasDominantPath, scoreAllPaths } from '../../../engine/tabletop'

describe('stalled-escalation scenario', () => {
  it('validates against the schema', () => {
    expect(validateScenario(stalledEscalation)).toEqual({ ok: true, errors: [] })
  })

  it('foregrounds chapter 2 (pure Ch.2 scenario)', () => {
    const chapters = new Set(
      stalledEscalation.nodes.flatMap((n) => n.choices.map((c) => c.chapter)),
    )
    expect(chapters.has(2)).toBe(true)
    // All choices should be chapter 2 (pure Ch.2 spine)
    const allChoices = stalledEscalation.nodes.flatMap((n) => n.choices)
    expect(allChoices.every((c) => c.chapter === 2)).toBe(true)
  })

  it('carries the cyber ~95% estimate caveat verbatim somewhere', () => {
    const caveats = stalledEscalation.nodes.flatMap((n) =>
      n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')),
    )
    expect(caveats.join(' ')).toMatch(/estimate/i)
  })

  it('has no dominant path (the thesis property)', () => {
    expect(hasDominantPath(stalledEscalation)).toBe(false)
  })

  it('board_oversight_visibility visibly differs between independent-channel and informal-normalize paths', () => {
    const scored = scoreAllPaths(stalledEscalation)

    // Independent-channel paths: took independent_review_channel / two_track
    const channelPaths = scored.filter((p) =>
      p.choices.some((c) => c.flags.includes('independent_review_channel') || c.flags.includes('two_track')),
    )
    // Informal/normalize paths: took legal_owns_record and never took independent_review_channel
    const normalizePaths = scored.filter(
      (p) =>
        p.choices.some((c) => c.flags.includes('legal_owns_record')) &&
        !p.choices.some((c) => c.flags.includes('independent_review_channel') || c.flags.includes('two_track')),
    )

    expect(channelPaths.length).toBeGreaterThan(0)
    expect(normalizePaths.length).toBeGreaterThan(0)

    // Independent-channel paths produce higher board oversight visibility
    const maxBoardChannel = Math.max(...channelPaths.map((p) => p.incident.board_oversight_visibility))
    const maxBoardNormalize = Math.max(...normalizePaths.map((p) => p.incident.board_oversight_visibility))
    expect(maxBoardChannel).toBeGreaterThan(maxBoardNormalize)
  })

  it('signal_fidelity is lower on the normalize/legal-owns-record path (multi-hop degradation)', () => {
    const scored = scoreAllPaths(stalledEscalation)

    const channelPaths = scored.filter((p) =>
      p.choices.some((c) => c.flags.includes('independent_review_channel') || c.flags.includes('two_track')),
    )
    const normalizePaths = scored.filter(
      (p) =>
        p.choices.some((c) => c.flags.includes('legal_owns_record')) &&
        !p.choices.some((c) => c.flags.includes('independent_review_channel') || c.flags.includes('two_track')),
    )

    const maxSignalChannel = Math.max(...channelPaths.map((p) => p.incident.signal_fidelity))
    const maxSignalNormalize = Math.max(...normalizePaths.map((p) => p.incident.signal_fidelity))
    expect(maxSignalChannel).toBeGreaterThan(maxSignalNormalize)
  })

  it('the informal/normalize path wins perceived legal safety but loses remediation and recurrence vs the formal-channel path', () => {
    const scored = scoreAllPaths(stalledEscalation)

    const oralPaths = scored.filter(
      (p) =>
        p.choices.some(
          (c) => c.flags.includes('legal_owns_record') || c.flags.includes('privileged_single_track'),
        ) && !p.choices.some((c) => c.flags.includes('two_track')),
    )
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
