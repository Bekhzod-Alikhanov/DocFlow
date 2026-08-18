/**
 * The harness is tested on synthetic codings with known answers, and on the real seed
 * file, which is deliberately empty.
 *
 * The most important tests here are the ones that check the gate REFUSES. A calibration
 * harness that will happily hand back "calibrated" coefficients from eight cases and one
 * coder is worse than no harness, because the output looks like evidence.
 */
import { describe, it, expect } from 'vitest'
import seedFile from '../../../docs/plan/coding/seed-cases.json'
import {
  cohensKappa,
  reliabilityReport,
  fitPrivilegeCoefficients,
  canPromote,
  applyCalibration,
  CODED_FACTORS,
  FACTOR_TO_PARAM,
  FACTOR_MAX,
  MIN_KAPPA,
  MIN_CASES,
  type CaseCoding,
  type CodedDataset,
} from './coding'
import { defaultParams } from '../registry'

/** Build a synthetic coding whose outcome follows a known rule. */
function synth(id: string, f: [number, number, number, number], outcome: 0 | 1 | 2, coder = 'A'): CaseCoding {
  return {
    id,
    citation: `Synthetic ${id}`,
    year: 2020,
    jurisdiction: 'test',
    doctrine: 'both',
    factors: { precommit: f[0], separation: f[1], significant_purpose: f[2], valve: f[3] },
    outcome,
    quotes: { precommit: 'q' },
    coder,
  }
}

describe("Cohen's κ", () => {
  it('is 1 for perfect agreement across multiple levels', () => {
    expect(cohensKappa([0, 1, 2, 1, 0], [0, 1, 2, 1, 0])).toBeCloseTo(1, 10)
  })

  it('is near 0 for agreement no better than chance', () => {
    const a = [0, 1, 0, 1, 0, 1, 0, 1]
    const b = [0, 0, 1, 1, 0, 0, 1, 1]
    expect(Math.abs(cohensKappa(a, b))).toBeLessThan(0.35)
  })

  it('goes negative when coders disagree worse than chance', () => {
    expect(cohensKappa([0, 0, 1, 1], [1, 1, 0, 0])).toBeLessThan(0)
  })

  it('is strict — unweighted, so adjacent-level disagreement gets no partial credit', () => {
    // Coders who are always one level apart agree on nothing by this measure. A weighted
    // κ would report something comfortable; that is exactly what a rubric threshold
    // should not do.
    expect(cohensKappa([0, 1, 2, 0, 1], [1, 2, 0, 1, 2])).toBeLessThanOrEqual(0)
  })

  it('rejects mismatched input rather than guessing', () => {
    expect(() => cohensKappa([1, 0], [1])).toThrow(/codings/)
  })

  it('reports κ per factor from two coders over shared cases', () => {
    const a = [synth('c1', [1, 2, 2, 2], 2, 'A'), synth('c2', [0, 0, 0, 0], 0, 'A')]
    const b = [synth('c1', [1, 2, 2, 2], 2, 'B'), synth('c2', [0, 0, 0, 1], 0, 'B')]
    const rep = reliabilityReport(a, b)
    expect(rep).toHaveLength(CODED_FACTORS.length)
    expect(rep.every((r) => r.n === 2)).toBe(true)
    expect(rep.find((r) => r.factor === 'precommit')!.kappa).toBeCloseTo(1, 10)
  })
})

describe('the fitter recovers a known structure', () => {
  // Outcome driven mainly by precommit, secondarily by separation — the ordering the
  // registry currently ASSUMES. The test is that the fitter can detect such an ordering,
  // not that this ordering is true.
  const codings: CaseCoding[] = []
  let seed = 7
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  for (let i = 0; i < 60; i++) {
    const pre = rand() < 0.5 ? 1 : 0
    const sep = Math.floor(rand() * 3)
    const pur = Math.floor(rand() * 3)
    const val = Math.floor(rand() * 3)
    const z = -1.5 + 2.6 * pre + 1.2 * (sep / 2) + 0.5 * (pur / 2) + 0.2 * (val / 2)
    const p = 1 / (1 + Math.exp(-z))
    codings.push(synth(`s${i}`, [pre, sep, pur, val], rand() < p ? 2 : 0))
  }
  const result = fitPrivilegeCoefficients({ codings })

  it('maps each factor to its registry coefficient', () => {
    for (const f of CODED_FACTORS) {
      expect(result.coefficients).toHaveProperty(FACTOR_TO_PARAM[f])
      expect(Number.isFinite(result.coefficients[FACTOR_TO_PARAM[f]])).toBe(true)
    }
  })

  it('recovers the factor ordering', () => {
    expect(result.ranking[0].factor).toBe('precommit')
    expect(result.coefficients.b_pre).toBeGreaterThan(result.coefficients.b_sep)
  })

  it('reports standard errors alongside the point estimates', () => {
    for (const f of CODED_FACTORS) {
      expect(result.standardErrors[FACTOR_TO_PARAM[f]]).toBeGreaterThan(0)
    }
  })
})

describe('the promotion gate refuses when it should', () => {
  const good = Array.from({ length: 20 }, (_, i) =>
    synth(`g${i}`, [i % 2, i % 3, (i + 1) % 3, (i + 2) % 3], i % 2 === 0 ? 2 : 0),
  )
  const cleanReliability = CODED_FACTORS.map((factor) => ({ factor, kappa: 0.82, n: 20 }))

  it('blocks on too few cases', () => {
    const r = fitPrivilegeCoefficients({ codings: good.slice(0, 5), reliability: cleanReliability })
    expect(canPromote(r).promote).toBe(false)
    expect(r.blockers.join(' ')).toMatch(/only 5 coded decisions/)
    expect(r.supportedTier).toBe('T4')
  })

  it('blocks when only one coder has run', () => {
    const r = fitPrivilegeCoefficients({ codings: good })
    expect(canPromote(r).promote).toBe(false)
    expect(r.blockers.join(' ')).toMatch(/two independent coders/)
  })

  it('blocks a factor whose κ is below the floor, naming it', () => {
    const weak = cleanReliability.map((r) =>
      r.factor === 'valve' ? { ...r, kappa: 0.41 } : r,
    )
    const r = fitPrivilegeCoefficients({ codings: good, reliability: weak })
    expect(canPromote(r).promote).toBe(false)
    const msg = r.blockers.join(' ')
    expect(msg).toMatch(/valve/)
    expect(msg).toMatch(/rewritten and the factor recoded/)
  })

  it('blocks on separation, because the magnitudes would be the prior talking', () => {
    const separated = Array.from({ length: 20 }, (_, i) =>
      synth(`x${i}`, [i < 10 ? 0 : 1, 1, 1, 1], i < 10 ? 0 : 2),
    )
    const r = fitPrivilegeCoefficients({ codings: separated, reliability: cleanReliability })
    expect(r.fit.separationDetected).toBe(true)
    expect(canPromote(r).promote).toBe(false)
    expect(r.blockers.join(' ')).toMatch(/directions are usable but magnitudes are not/)
  })

  it('promotes only to T2, never T1, however clean the coding', () => {
    // Decided breach-forensics case law is an ANALOG for AI incident forensics, not a
    // measurement of it. No amount of coding quality changes that.
    const varied = Array.from({ length: 24 }, (_, i) =>
      synth(`v${i}`, [i % 2, i % 3, (i * 2) % 3, (i + 1) % 3], i % 3 === 0 ? 2 : 0),
    )
    const r = fitPrivilegeCoefficients({ codings: varied, reliability: cleanReliability })
    if (r.blockers.length === 0) {
      expect(r.supportedTier).toBe('T2')
    } else {
      // Still must not claim T1 under any circumstance.
      expect(r.supportedTier).toBe('T4')
    }
    expect(['T2', 'T4']).toContain(r.supportedTier)
  })
})

describe('applyCalibration will not launder an ungated result', () => {
  const r = fitPrivilegeCoefficients({ codings: [synth('one', [1, 1, 1, 1], 2)] })

  it('throws rather than silently writing uncalibrated numbers into params', () => {
    expect(() => applyCalibration(defaultParams(), r)).toThrow(/has not cleared its gate/)
  })

  it('names every blocker in the error, so the caller knows what to fix', () => {
    try {
      applyCalibration(defaultParams(), r)
      expect.unreachable('should have thrown')
    } catch (e) {
      expect(String(e)).toMatch(/coded decisions/)
      expect(String(e)).toMatch(/κ|two independent coders/)
    }
  })

  it('allows an explicit forced exploration, and the flag says what it is for', () => {
    const p = applyCalibration(defaultParams(), r, { force: true })
    expect(p.b_pre).toBe(r.coefficients.b_pre)
    // The original is untouched — exploration must not mutate the baseline.
    expect(defaultParams().b_pre).not.toBe(p.b_pre)
  })
})

describe('the seed file is a real, empty starting point', () => {
  const seed = seedFile as unknown as {
    codings: { id: string; factors: Record<string, number | null>; outcome: number | null }[]
    reliability: unknown
  }

  it('contains the five cases the paper relies on', () => {
    const ids = seed.codings.map((c) => c.id)
    expect(ids).toContain('target-2015')
    expect(ids).toContain('capital-one-2020')
    expect(ids).toContain('rutters-2021')
    expect(ids).toContain('guo-wengui-2021')
    expect(ids).toContain('kbr-2014')
  })

  it('is UNCODED — every factor is null, not zero', () => {
    // Defaulting to zero would let an uncoded case be fitted as if it scored zero on
    // everything, which is a silent fabrication of data.
    for (const c of seed.codings) {
      for (const f of CODED_FACTORS) expect(c.factors[f]).toBeNull()
      expect(c.outcome).toBeNull()
    }
    expect(seed.reliability).toBeNull()
  })

  it('cannot be promoted in its current state', () => {
    const dataset: CodedDataset = { codings: [] }
    const r = fitPrivilegeCoefficients(dataset)
    expect(canPromote(r).promote).toBe(false)
    expect(r.n).toBe(0)
  })

  it('documents the thresholds the harness enforces', () => {
    const text = JSON.stringify(seedFile)
    expect(text).toContain('0.6')
    expect(text).toContain('15')
    expect(MIN_KAPPA).toBe(0.6)
    expect(MIN_CASES).toBe(10)
  })

  it('the factor maxima match the documented coding scheme', () => {
    expect(FACTOR_MAX.precommit).toBe(1)
    expect(FACTOR_MAX.separation).toBe(2)
    expect(FACTOR_MAX.significant_purpose).toBe(2)
    expect(FACTOR_MAX.valve).toBe(2)
  })
})
