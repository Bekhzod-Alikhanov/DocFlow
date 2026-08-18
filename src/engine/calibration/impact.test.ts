/**
 * The payoff path: coded data in, a recomputed headline result out.
 *
 * Tested with SYNTHETIC codings, because no real ones exist yet. What is being verified
 * is that the machinery works and refuses to overstate itself — so that when real data
 * arrives the only remaining question is what the answer is.
 */
import { describe, it, expect } from 'vitest'
import { fitPrivilegeCoefficients, type CaseCoding } from './coding'
import { calibrationImpact } from './impact'

function synth(id: string, f: [number, number, number, number], outcome: 0 | 2): CaseCoding {
  return {
    id, citation: id, year: 2020, jurisdiction: 'test', doctrine: 'both',
    factors: { precommit: f[0], separation: f[1], significant_purpose: f[2], valve: f[3] },
    outcome, quotes: {}, coder: 'A',
  }
}

// A plausible-shaped synthetic corpus: pre-commitment dominant, as the registry assumes.
const codings = Array.from({ length: 24 }, (_, i) => {
  const pre = i % 2
  const sep = i % 3
  const z = -1.2 + 2.4 * pre + 1.0 * (sep / 2)
  return synth(`s${i}`, [pre, sep, (i + 1) % 3, (i + 2) % 3], 1 / (1 + Math.exp(-z)) > 0.5 ? 2 : 0)
})

describe('calibrationImpact', () => {
  const result = fitPrivilegeCoefficients({ codings })
  const impact = calibrationImpact(result, { steps: 4 })

  it('reports privilege before and after at each posture', () => {
    expect(impact.privilege.length).toBeGreaterThan(0)
    for (const row of impact.privilege) {
      expect(Number.isFinite(row.before)).toBe(true)
      expect(Number.isFinite(row.after)).toBe(true)
    }
    console.log('\n--- privilege under synthetic calibration ---')
    for (const r of impact.privilege) {
      console.log(`    ${r.preset.padEnd(16)} pi ${r.before.toFixed(3)} -> ${r.after.toFixed(3)}`)
    }
  })

  it('recomputes the suppression share on both arms', () => {
    console.log(`    suppression share ${(impact.suppressionShareBefore * 100).toFixed(1)}% -> ${(impact.suppressionShareAfter * 100).toFixed(1)}%`)
    expect(impact.suppressionShareBefore).toBeGreaterThanOrEqual(0)
    expect(impact.suppressionShareAfter).toBeGreaterThanOrEqual(0)
  })

  it('stamps every exploratory run with the reason it is exploratory', () => {
    // The single most important behaviour here. These numbers must never be quotable as
    // calibrated while the gate is unmet.
    expect(impact.caveats[0]).toMatch(/EXPLORATORY ONLY/)
    expect(impact.caveats.join(' ')).toMatch(/two independent coders/)
  })

  it('always carries the analog caveat, even for a clean fit', () => {
    expect(impact.caveats.join(' ')).toMatch(/ANALOG for AI incident forensics/)
  })

  it('says plainly whether the conclusion survived', () => {
    expect(typeof impact.conclusionHolds).toBe('boolean')
    console.log(`    conclusion holds: ${impact.conclusionHolds}`)
  })
}, 300_000)
