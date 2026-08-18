/**
 * The fitter is checked against cases with known answers, because a statistical routine
 * that has only ever been run on the data it was written for is not evidence of anything.
 */
import { describe, it, expect } from 'vitest'
import { firthLogistic, detectSeparation, penalisedLogLik } from './firth'

describe('firthLogistic on well-behaved data', () => {
  it('recovers a known coefficient from a large clean sample', () => {
    // y ~ Bernoulli(sigmoid(-0.5 + 1.5x)) on a deterministic grid: with n large and no
    // separation, Firth and ML nearly coincide, so the true values should come back.
    const X: number[][] = []
    const y: number[] = []
    let seed = 42
    const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = 0; i < 600; i++) {
      const x = (i % 21) / 10 - 1 // -1 .. 1
      const p = 1 / (1 + Math.exp(-(-0.5 + 1.5 * x)))
      X.push([x])
      y.push(rand() < p ? 1 : 0)
    }
    const fit = firthLogistic(X, y)
    expect(fit.converged).toBe(true)
    expect(fit.beta[0]).toBeCloseTo(-0.5, 0)
    expect(fit.beta[1]).toBeCloseTo(1.5, 0)
    expect(fit.separationDetected).toBe(false)
  })

  it('produces finite standard errors', () => {
    const X = [[0], [0], [1], [1], [0], [1], [0], [1]]
    const y = [0, 1, 1, 1, 0, 0, 0, 1]
    const fit = firthLogistic(X, y)
    for (const s of fit.se) {
      expect(Number.isFinite(s)).toBe(true)
      expect(s).toBeGreaterThan(0)
    }
  })

  it('gives a positive coefficient to a predictor that raises the outcome', () => {
    const X = [[0], [0], [0], [0], [1], [1], [1], [1]]
    const y = [0, 0, 0, 1, 1, 1, 1, 0]
    expect(firthLogistic(X, y).beta[1]).toBeGreaterThan(0)
  })
})

describe('firthLogistic under separation — the reason it is used', () => {
  // The case CALIBRATION.md §3.4 predicts: every case with the factor present was
  // upheld. Ordinary ML diverges here; Firth must not.
  const X = [[0], [0], [0], [0], [1], [1], [1], [1]]
  const y = [0, 0, 0, 0, 1, 1, 1, 1]

  it('detects the separation and says so', () => {
    expect(detectSeparation(X, y)).toBe(true)
    expect(firthLogistic(X, y).separationDetected).toBe(true)
  })

  it('returns a FINITE estimate where maximum likelihood would diverge', () => {
    const fit = firthLogistic(X, y)
    expect(Number.isFinite(fit.beta[1])).toBe(true)
    // Firth's shrinkage lands this in single digits rather than at infinity.
    expect(Math.abs(fit.beta[1])).toBeLessThan(12)
    // Direction is still recovered: the factor raises the odds.
    expect(fit.beta[1]).toBeGreaterThan(0)
  })

  it('the estimate is held finite by the penalty, not by the data', () => {
    // Stated as a test because it is the caveat that must travel with the number: with
    // separation, the SIGN is trustworthy and the MAGNITUDE is an artefact of the prior.
    // Doubling the sample with the same perfect split barely moves the estimate, which
    // is what "not driven by the data" looks like.
    const fit1 = firthLogistic(X, y)
    const fit2 = firthLogistic([...X, ...X], [...y, ...y])
    expect(fit2.beta[1]).toBeGreaterThan(fit1.beta[1])
    // ...but nothing like the divergence ML would show.
    expect(fit2.beta[1] / fit1.beta[1]).toBeLessThan(2.5)
  })
})

describe('the penalised likelihood behaves like a likelihood', () => {
  it('is maximised at the fitted coefficients', () => {
    const X = [[0], [1], [0], [1], [1], [0], [1], [0]]
    const y = [0, 1, 0, 1, 1, 0, 1, 1]
    const fit = firthLogistic(X, y)
    const design = X.map((r) => [1, ...r])
    const at = penalisedLogLik(design, y, fit.beta)
    for (const d of [
      [0.5, 0],
      [-0.5, 0],
      [0, 0.5],
      [0, -0.5],
    ]) {
      const perturbed = fit.beta.map((b, j) => b + d[j])
      expect(penalisedLogLik(design, y, perturbed)).toBeLessThanOrEqual(at + 1e-9)
    }
  })

  it('handles multiple predictors', () => {
    const X = [
      [0, 0], [1, 0], [0, 1], [1, 1],
      [0, 0], [1, 0], [0, 1], [1, 1],
      [1, 1], [0, 0], [1, 0], [0, 1],
    ]
    const y = [0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0]
    const fit = firthLogistic(X, y)
    expect(fit.beta).toHaveLength(3)
    expect(fit.beta.every(Number.isFinite)).toBe(true)
  })

  it('rejects mismatched inputs rather than fitting nonsense', () => {
    expect(() => firthLogistic([[1], [0]], [1])).toThrow(/rows of X/)
  })
})
