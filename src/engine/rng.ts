/**
 * Seeded, reproducible pseudo-random number generation for Monte Carlo and
 * sensitivity sampling (spec §3.5, §3.8). Pure and deterministic: the same seed
 * always yields the same stream, so a run can be re-created exactly from its
 * RunRecord. No use of `Math.random()` anywhere in the engine.
 */

/** A deterministic uniform generator on [0, 1). */
export type Rng = () => number

/**
 * mulberry32 — a small, fast, well-distributed 32-bit PRNG. Good enough for
 * Monte Carlo over a structural model; not cryptographic.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministically derive a 32-bit seed from an arbitrary string. */
export function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Uniform draw on [min, max]. */
export function uniform(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng()
}

/**
 * Triangular draw on [min, max] with mode `mode` (inverse-CDF method).
 * Used as an optional Monte Carlo sampling distribution (spec §3.5).
 */
export function triangular(rng: Rng, min: number, mode: number, max: number): number {
  if (max <= min) return min
  const u = rng()
  const c = (mode - min) / (max - min)
  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min))
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
}

/**
 * Normal draw via the Box–Muller transform, truncated to [min, max] by
 * rejection (bounded retries) so samples respect registry ranges (spec §3.5).
 */
export function normal(rng: Rng, mean: number, sd: number, min: number, max: number): number {
  for (let i = 0; i < 50; i++) {
    const u1 = Math.max(rng(), 1e-12)
    const u2 = rng()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const x = mean + sd * z
    if (x >= min && x <= max) return x
  }
  // Fallback: clamp the last draw so we never loop forever.
  return Math.min(max, Math.max(min, mean))
}
