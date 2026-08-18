/**
 * The case-law coding harness — everything `CALIBRATION.md` §3 needs except the reading.
 *
 * §3 is the only route off `T1 = 0, T2 = 0`, and it is the one task in this project that
 * cannot be done from inside the repository: it needs someone with citator access to read
 * decisions and code them. This module is the other half — the schema they code into, the
 * estimator, the reliability statistics, and a promotion gate that decides whether the
 * result has earned a tier above T4.
 *
 * The gate is the part worth building carefully. The temptation once data exists is to
 * declare the coefficients "calibrated" and move on; the protocol says a factor whose
 * inter-coder κ falls below 0.6 must have its rubric rewritten and be recoded, **not
 * silently retained**. That instruction is enforced here rather than left to discipline.
 */
import type { ProvenanceTier } from '../types'
import { firthLogistic, type FirthFit } from './firth'

// ---------------------------------------------------------------------------
// Schema — the shape a coder fills in
// ---------------------------------------------------------------------------

/** The four factors, matching MODEL_v3_SPEC §5.1 and the registry coefficients. */
export const CODED_FACTORS = ['precommit', 'separation', 'significant_purpose', 'valve'] as const
export type CodedFactor = (typeof CODED_FACTORS)[number]

/** Registry coefficient each factor estimates. */
export const FACTOR_TO_PARAM: Record<CodedFactor, string> = {
  precommit: 'b_pre',
  separation: 'b_sep',
  significant_purpose: 'b_purp',
  valve: 'b_valve',
}

/** Maximum ordinal value per factor — `precommit` is binary, the rest are 0–2. */
export const FACTOR_MAX: Record<CodedFactor, number> = {
  precommit: 1,
  separation: 2,
  significant_purpose: 2,
  valve: 2,
}

export type Outcome = 0 | 1 | 2 // denied · partial · upheld

export interface CaseCoding {
  /** Short slug, e.g. `capital-one-2020`. */
  id: string
  citation: string
  year: number
  jurisdiction: string
  doctrine: 'attorney-client' | 'work-product' | 'both'
  factors: Record<CodedFactor, number>
  outcome: Outcome
  /** Supporting quotation per factor — §3.2 requires one, and it is what makes a coding auditable. */
  quotes: Partial<Record<CodedFactor, string>>
  /** Who coded it. Two independent coders are required for reliability. */
  coder: string
}

export interface ReliabilityEntry {
  factor: CodedFactor
  kappa: number
  /** Number of cases coded by both coders. */
  n: number
}

export interface CodedDataset {
  codings: CaseCoding[]
  /** Per-factor Cohen's κ. Absent means the second coder has not run. */
  reliability?: ReliabilityEntry[]
  notes?: string
}

// ---------------------------------------------------------------------------
// Reliability
// ---------------------------------------------------------------------------

/**
 * Cohen's κ for two coders on one ordinal factor.
 *
 * Unweighted, treating each level as a distinct category — deliberately the strict
 * version. Weighted κ would give partial credit for adjacent levels and report a higher
 * number for the same disagreement, which is the wrong direction for a threshold whose
 * purpose is to catch a rubric that does not replicate.
 */
export function cohensKappa(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new Error(`cohensKappa: ${a.length} vs ${b.length} codings`)
  }
  const levels = [...new Set([...a, ...b])].sort((x, y) => x - y)
  const n = a.length
  let observed = 0
  for (let i = 0; i < n; i++) if (a[i] === b[i]) observed++
  const po = observed / n

  let pe = 0
  for (const lv of levels) {
    const pa = a.filter((x) => x === lv).length / n
    const pb = b.filter((x) => x === lv).length / n
    pe += pa * pb
  }
  // Perfect agreement with only one level used: κ is undefined (0/0). Report 1, since
  // the coders did in fact agree on everything, but the caller should note n and levels.
  if (pe === 1) return po === 1 ? 1 : 0
  return (po - pe) / (1 - pe)
}

/** κ per factor from two coders' parallel codings of the same cases. */
export function reliabilityReport(coderA: CaseCoding[], coderB: CaseCoding[]): ReliabilityEntry[] {
  const byId = new Map(coderB.map((c) => [c.id, c]))
  const shared = coderA.filter((c) => byId.has(c.id))
  return CODED_FACTORS.map((factor) => ({
    factor,
    n: shared.length,
    kappa:
      shared.length === 0
        ? NaN
        : cohensKappa(
            shared.map((c) => c.factors[factor]),
            shared.map((c) => byId.get(c.id)!.factors[factor]),
          ),
  }))
}

// ---------------------------------------------------------------------------
// Estimation
// ---------------------------------------------------------------------------

export interface CalibrationResult {
  n: number
  /** Estimated registry coefficients, keyed by parameter id. */
  coefficients: Record<string, number>
  /** Standard errors, same keys. */
  standardErrors: Record<string, number>
  intercept: number
  fit: FirthFit
  /** Ordering of factors by estimated magnitude, strongest first. */
  ranking: { param: string; factor: CodedFactor; beta: number }[]
  /** Every reason this result is not yet fit to promote off T4. */
  blockers: string[]
  /** Tier the evidence supports. T4 unless every blocker clears. */
  supportedTier: ProvenanceTier
}

/** Minimum N below which the protocol's own analysis says nothing is estimable. */
export const MIN_CASES = 10
/** Per-factor κ floor from §3.3. */
export const MIN_KAPPA = 0.6

/**
 * Fit the four coefficients from coded decisions.
 *
 * The outcome is BINARISED — upheld against everything else — rather than modelled as
 * the three-level ordinal it is coded as. That loses information and it is the right
 * trade at this N: an ordinal model needs proportional-odds assumptions nobody can test
 * with twenty cases. The `partial` level is retained in the data so a larger sample can
 * use it later.
 *
 * Factors are scaled to [0,1] so the estimated coefficients are directly comparable to
 * one another and to the registry's `b_*` scale, which is per-unit-of-factor.
 */
export function fitPrivilegeCoefficients(dataset: CodedDataset): CalibrationResult {
  const { codings } = dataset
  const X = codings.map((c) => CODED_FACTORS.map((f) => c.factors[f] / FACTOR_MAX[f]))
  const y = codings.map((c) => (c.outcome === 2 ? 1 : 0))

  const fit = codings.length > 0
    ? firthLogistic(X, y)
    : ({ beta: [0, 0, 0, 0, 0], se: [NaN, NaN, NaN, NaN, NaN], logLikelihood: NaN, iterations: 0, converged: false, separationDetected: false } satisfies FirthFit)

  const coefficients: Record<string, number> = {}
  const standardErrors: Record<string, number> = {}
  CODED_FACTORS.forEach((f, i) => {
    coefficients[FACTOR_TO_PARAM[f]] = fit.beta[i + 1] ?? NaN
    standardErrors[FACTOR_TO_PARAM[f]] = fit.se[i + 1] ?? NaN
  })

  const ranking = CODED_FACTORS.map((f) => ({
    param: FACTOR_TO_PARAM[f],
    factor: f,
    beta: coefficients[FACTOR_TO_PARAM[f]],
  })).sort((a, b) => b.beta - a.beta)

  const blockers: string[] = []
  if (codings.length < MIN_CASES) {
    blockers.push(`only ${codings.length} coded decisions; CALIBRATION.md §3.1 targets N ≈ 15–30 and nothing is estimable below ${MIN_CASES}`)
  }
  if (!dataset.reliability || dataset.reliability.length === 0) {
    blockers.push('no inter-coder reliability: §3.3 requires two independent coders and per-factor Cohen\'s κ')
  } else {
    for (const r of dataset.reliability) {
      if (!Number.isFinite(r.kappa)) {
        blockers.push(`κ for ${r.factor} is not computable (n = ${r.n})`)
      } else if (r.kappa < MIN_KAPPA) {
        blockers.push(`κ = ${r.kappa.toFixed(2)} for ${r.factor} is below ${MIN_KAPPA}; §3.3 requires the rubric be rewritten and the factor recoded, not retained`)
      }
    }
  }
  if (!fit.converged && codings.length > 0) blockers.push('the fit did not converge')
  if (fit.separationDetected) {
    blockers.push('separation detected: the penalty is holding the estimates finite, so directions are usable but magnitudes are not')
  }

  return {
    n: codings.length,
    coefficients,
    standardErrors,
    intercept: fit.beta[0] ?? NaN,
    fit,
    ranking,
    blockers,
    // T2 — "estimated from an analogous domain" — is the ceiling this protocol can reach.
    // Decided case law about breach forensics is an analog for AI incident forensics, not
    // a measurement of it, so T1 is not available by this route however clean the coding.
    supportedTier: blockers.length === 0 ? 'T2' : 'T4',
  }
}

/**
 * Whether the registry may adopt these coefficients.
 *
 * Separate from the fit so that the answer is a decision with reasons attached, not a
 * property of a number.
 */
export function canPromote(result: CalibrationResult): { promote: boolean; reasons: string[] } {
  return { promote: result.blockers.length === 0, reasons: result.blockers }
}

/**
 * Apply calibrated coefficients to a parameter set.
 *
 * Refuses when the gate has not cleared. A caller that wants to *explore* uncalibrated
 * estimates can pass `force: true`, which is honest as an experiment and is why the flag
 * is named what it is — but the returned params must never be presented as calibrated.
 */
export function applyCalibration<T extends Record<string, number>>(
  params: T,
  result: CalibrationResult,
  opts: { force?: boolean } = {},
): T {
  if (!opts.force && result.blockers.length > 0) {
    throw new Error(
      `applyCalibration refused: the calibration has not cleared its gate.\n  - ${result.blockers.join('\n  - ')}\n` +
        `Pass { force: true } only to explore, never to publish.`,
    )
  }
  const next = { ...params }
  for (const [param, value] of Object.entries(result.coefficients)) {
    if (param in next && Number.isFinite(value)) {
      ;(next as Record<string, number>)[param] = value
    }
  }
  return next
}
