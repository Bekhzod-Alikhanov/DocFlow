import { describe, it, expect } from 'vitest'
import { eigenvalues, maxRealPart, isStable, solveLinear } from './linalg'

function sortedRe(eigs: { re: number; im: number }[]): number[] {
  return eigs.map((e) => e.re).sort((a, b) => a - b)
}

describe('linalg: eigenvalues', () => {
  it('diagonal matrix → diagonal entries', () => {
    const eigs = eigenvalues([
      [-1, 0, 0],
      [0, -2, 0],
      [0, 0, -3],
    ])
    expect(sortedRe(eigs)).toEqual([-3, -2, -1].sort((a, b) => a - b))
    eigs.forEach((e) => expect(e.im).toBeCloseTo(0, 8))
  })

  it('upper-triangular matrix → diagonal entries', () => {
    const eigs = eigenvalues([
      [2, 5, 7],
      [0, -1, 3],
      [0, 0, 4],
    ])
    expect(sortedRe(eigs).map((x) => Math.round(x))).toEqual([-1, 2, 4])
  })

  it('rotation block [[0,-1],[1,0]] → pure imaginary ±i', () => {
    const eigs = eigenvalues([
      [0, -1],
      [1, 0],
    ])
    eigs.forEach((e) => expect(e.re).toBeCloseTo(0, 6))
    const ims = eigs.map((e) => e.im).sort((a, b) => a - b)
    expect(ims[0]).toBeCloseTo(-1, 6)
    expect(ims[1]).toBeCloseTo(1, 6)
  })

  it('known 2×2 with real eigenvalues 1 and 3', () => {
    // [[2,1],[1,2]] has eigenvalues 1 and 3.
    const eigs = eigenvalues([
      [2, 1],
      [1, 2],
    ])
    expect(sortedRe(eigs).map((x) => Math.round(x))).toEqual([1, 3])
  })

  it('damped oscillator → complex conjugate pair with negative real part', () => {
    // x'' + x' + x = 0  →  [[0,1],[-1,-1]], eigenvalues -0.5 ± i√3/2
    const eigs = eigenvalues([
      [0, 1],
      [-1, -1],
    ])
    eigs.forEach((e) => expect(e.re).toBeCloseTo(-0.5, 6))
    expect(isStable(eigs)).toBe(true)
    expect(maxRealPart(eigs)).toBeCloseTo(-0.5, 6)
  })

  it('maxRealPart and isStable agree on a stable matrix', () => {
    const eigs = eigenvalues([
      [-3, 0],
      [0, -0.2],
    ])
    expect(maxRealPart(eigs)).toBeCloseTo(-0.2, 6)
    expect(isStable(eigs)).toBe(true)
    expect(isStable(eigenvalues([[1, 0], [0, -1]]))).toBe(false)
  })

  it('handles 1×1 and empty matrices', () => {
    expect(eigenvalues([[5]])[0].re).toBe(5)
    expect(eigenvalues([])).toEqual([])
  })
})

describe('linalg: solveLinear', () => {
  it('solves a well-conditioned system', () => {
    const x = solveLinear(
      [
        [2, 1],
        [1, 3],
      ],
      [3, 5],
    )
    expect(x).not.toBeNull()
    expect(x![0]).toBeCloseTo(0.8, 6)
    expect(x![1]).toBeCloseTo(1.4, 6)
  })

  it('returns null for a singular matrix', () => {
    expect(
      solveLinear(
        [
          [1, 2],
          [2, 4],
        ],
        [1, 2],
      ),
    ).toBeNull()
  })

  it('solves with partial pivoting (zero leading pivot)', () => {
    const x = solveLinear(
      [
        [0, 1],
        [1, 0],
      ],
      [2, 3],
    )
    expect(x![0]).toBeCloseTo(3, 6)
    expect(x![1]).toBeCloseTo(2, 6)
  })
})
