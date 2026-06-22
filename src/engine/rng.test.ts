import { describe, it, expect } from 'vitest'
import { mulberry32, hashStringToSeed, uniform, triangular, normal } from './rng'

describe('rng', () => {
  it('mulberry32 is deterministic and in [0,1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 100; i++) {
      const x = a()
      expect(x).toBe(b())
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('different seeds give different streams', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })

  it('hashStringToSeed is stable and 32-bit', () => {
    const s = hashStringToSeed('docflow')
    expect(s).toBe(hashStringToSeed('docflow'))
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThan(2 ** 32)
    expect(hashStringToSeed('a')).not.toBe(hashStringToSeed('b'))
  })

  it('uniform stays within bounds and averages near the midpoint', () => {
    const rng = mulberry32(7)
    let sum = 0
    const n = 20000
    for (let i = 0; i < n; i++) {
      const x = uniform(rng, 2, 6)
      expect(x).toBeGreaterThanOrEqual(2)
      expect(x).toBeLessThanOrEqual(6)
      sum += x
    }
    expect(sum / n).toBeCloseTo(4, 1)
  })

  it('triangular respects bounds and is biased toward the mode', () => {
    const rng = mulberry32(11)
    let below = 0
    const n = 20000
    for (let i = 0; i < n; i++) {
      const x = triangular(rng, 0, 0.2, 1)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1)
      if (x < 0.2) below++
    }
    // Mode at 0.2 ⇒ a meaningful fraction of mass below the mode.
    expect(below / n).toBeGreaterThan(0.02)
    expect(triangular(rng, 5, 5, 5)).toBe(5) // degenerate range
  })

  it('normal stays within the truncation bounds', () => {
    const rng = mulberry32(13)
    for (let i = 0; i < 5000; i++) {
      const x = normal(rng, 0.5, 0.3, 0, 1)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1)
    }
  })
})
