/**
 * Global & local sensitivity analysis (spec §3.6).
 *
 *  - Sobol indices via Saltelli sampling (first-order S1 + total-effect ST),
 *    using the Saltelli (2010) / Jansen estimators. Generic over a unit-cube
 *    function so it can be validated against the Ishigami function's analytic
 *    indices (see sensitivity.test.ts).
 *  - Latin-Hypercube sampling + Partial Rank Correlation Coefficients (PRCC).
 *  - One-at-a-time tornado swings.
 */
import type { Params, ParamKey, State, SimSettings } from './types'
import { PARAM_SPEC_BY_ID } from './registry'
import { mulberry32, type Rng } from './rng'
import { solveLinear } from './linalg'
import { simulate } from './simulate'

// --- helpers ---

function mean(a: number[]): number {
  return a.reduce((s, x) => s + x, 0) / a.length
}
function variance(a: number[]): number {
  const m = mean(a)
  return a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length
}
function pearson(a: number[], b: number[]): number {
  const ma = mean(a)
  const mb = mean(b)
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb)
    da += (a[i] - ma) ** 2
    db += (b[i] - mb) ** 2
  }
  const den = Math.sqrt(da * db)
  return den === 0 ? 0 : num / den
}
function ranks(a: number[]): number[] {
  const idx = a.map((v, i) => [v, i] as [number, number]).sort((x, y) => x[0] - y[0])
  const r = new Array<number>(a.length)
  for (let k = 0; k < idx.length; k++) r[idx[k][1]] = k + 1
  return r
}

/** Latin-Hypercube sample: N points in [0,1]^k, stratified per dimension. */
export function latinHypercube(k: number, N: number, rng: Rng): number[][] {
  const cols: number[][] = []
  for (let j = 0; j < k; j++) {
    const perm = Array.from({ length: N }, (_, i) => i)
    for (let i = N - 1; i > 0; i--) {
      const s = Math.floor(rng() * (i + 1))
      ;[perm[i], perm[s]] = [perm[s], perm[i]]
    }
    cols.push(perm.map((p) => (p + rng()) / N))
  }
  const pts: number[][] = []
  for (let i = 0; i < N; i++) pts.push(cols.map((c) => c[i]))
  return pts
}

// --- Sobol (Saltelli) ---

export interface SobolResult {
  keys: ParamKey[]
  S1: number[]
  ST: number[]
  evaluations: number
}

/**
 * Sobol first-order and total indices for a function on the unit cube [0,1]^k.
 * Uses two independent LHS base samples A and B and the k cross-samples AB_i.
 * Total model evaluations: N·(k+2).
 */
export function sobolIndicesUnit(
  f: (x: number[]) => number,
  k: number,
  N: number,
  rng: Rng,
): { S1: number[]; ST: number[]; evaluations: number } {
  const A = latinHypercube(k, N, rng)
  const B = latinHypercube(k, N, rng)
  const yA = A.map(f)
  const yB = B.map(f)

  const all = yA.concat(yB)
  const varY = variance(all)

  const S1: number[] = []
  const ST: number[] = []
  let evals = 2 * N
  for (let i = 0; i < k; i++) {
    const yABi = new Array<number>(N)
    for (let j = 0; j < N; j++) {
      const x = A[j].slice()
      x[i] = B[j][i]
      yABi[j] = f(x)
    }
    evals += N
    if (varY === 0) {
      S1.push(0)
      ST.push(0)
      continue
    }
    // Saltelli (2010): S1 = mean(yB·(yAB − yA)) / Var
    let s1 = 0
    // Jansen: ST = mean((yA − yAB)^2) / (2·Var)
    let st = 0
    for (let j = 0; j < N; j++) {
      s1 += yB[j] * (yABi[j] - yA[j])
      st += (yA[j] - yABi[j]) ** 2
    }
    S1.push(s1 / N / varY)
    ST.push(st / (2 * N) / varY)
  }
  return { S1, ST, evaluations: evals }
}

/** Map a unit point to the param ranges of the varying keys, atop a base vector. */
function unitToParams(base: Params, keys: ParamKey[], x: number[]): Params {
  const p = { ...base }
  keys.forEach((key, i) => {
    const spec = PARAM_SPEC_BY_ID[key]
    p[key] = spec.min + x[i] * (spec.max - spec.min)
  })
  return p
}

/** Sobol analysis of a scalar model output w.r.t. the varying parameters. */
export function sobolAnalysis(
  base: Params,
  keys: ParamKey[],
  output: (p: Params) => number,
  opts: { n?: number; seed?: number } = {},
): SobolResult {
  const N = opts.n ?? 256
  const rng = mulberry32(opts.seed ?? 1)
  const f = (x: number[]) => output(unitToParams(base, keys, x))
  const { S1, ST, evaluations } = sobolIndicesUnit(f, keys.length, N, rng)
  return { keys, S1, ST, evaluations }
}

// --- PRCC (LHS + partial rank correlation) ---

export interface PrccResult {
  keys: ParamKey[]
  prcc: number[]
  n: number
}

/** Residuals of v regressed on the columns of Z (with intercept). */
function regressResiduals(Z: number[][], v: number[]): number[] {
  const N = v.length
  const m = Z[0].length
  // Design with intercept column.
  const X = Z.map((row) => [1, ...row])
  const cols = m + 1
  // Normal equations XᵀX β = Xᵀv
  const XtX: number[][] = Array.from({ length: cols }, () => new Array<number>(cols).fill(0))
  const Xtv = new Array<number>(cols).fill(0)
  for (let i = 0; i < N; i++) {
    for (let a = 0; a < cols; a++) {
      Xtv[a] += X[i][a] * v[i]
      for (let b = 0; b < cols; b++) XtX[a][b] += X[i][a] * X[i][b]
    }
  }
  const beta = solveLinear(XtX, Xtv) ?? new Array<number>(cols).fill(0)
  return v.map((vi, i) => vi - X[i].reduce((s, xij, a) => s + xij * beta[a], 0))
}

/**
 * Partial Rank Correlation Coefficients: LHS-sample inputs, rank-transform, and
 * for each input compute the correlation of its rank-residuals with the output's
 * rank-residuals after regressing out the other inputs.
 */
export function prccAnalysis(
  base: Params,
  keys: ParamKey[],
  output: (p: Params) => number,
  opts: { n?: number; seed?: number } = {},
): PrccResult {
  const N = opts.n ?? 400
  const rng = mulberry32(opts.seed ?? 2)
  const pts = latinHypercube(keys.length, N, rng)
  const y = pts.map((x) => output(unitToParams(base, keys, x)))

  const rankCols = keys.map((_, j) => ranks(pts.map((p) => p[j])))
  const ry = ranks(y)

  const prcc = keys.map((_, i) => {
    const others = keys.map((_, j) => j).filter((j) => j !== i)
    const Z = pts.map((_, row) => others.map((j) => rankCols[j][row]))
    const exi = regressResiduals(Z, rankCols[i])
    const ey = regressResiduals(Z, ry)
    return pearson(exi, ey)
  })

  return { keys, prcc, n: N }
}

// --- Tornado (one-at-a-time) ---

export interface TornadoBar {
  key: ParamKey
  low: number
  high: number
  base: number
  swing: number
}

/** One-at-a-time swings: output at each parameter's min and max, others at base. */
export function tornado(
  base: Params,
  keys: ParamKey[],
  output: (p: Params) => number,
): TornadoBar[] {
  const baseOut = output(base)
  return keys
    .map((key) => {
      const spec = PARAM_SPEC_BY_ID[key]
      const low = output({ ...base, [key]: spec.min })
      const high = output({ ...base, [key]: spec.max })
      return { key, low, high, base: baseOut, swing: Math.abs(high - low) }
    })
    .sort((a, b) => b.swing - a.swing)
}

// --- Convenient model outputs for sensitivity (spec §3.6) ---

export type OutputName = 'finalTD' | 'finalL' | 'finalC' | 'finalFdoc' | 'cumulativeExposure' | 'timeToTip'

export const OUTPUT_LABELS: Record<OutputName, string> = {
  finalTD: 'Final technical debt',
  finalL: 'Final learning capability',
  finalC: 'Final documentation culture',
  finalFdoc: 'Final documentation fraction',
  cumulativeExposure: 'Cumulative exposure',
  timeToTip: 'Time to tip',
}

/**
 * Build a scalar output function output(params) → number for sensitivity/tornado,
 * holding the initial state and integration settings fixed. `timeToTip` maps a
 * non-tipping run to the horizon (so "never tips" reads as the largest value).
 */
export function modelOutput(
  name: OutputName,
  init: State,
  settings: SimSettings,
): (p: Params) => number {
  return (p: Params) => {
    const { summary } = simulate(init, p, settings)
    switch (name) {
      case 'finalTD':
        return summary.finalState.TD
      case 'finalL':
        return summary.finalState.L
      case 'finalC':
        return summary.finalState.C
      case 'finalFdoc':
        return summary.finalFdoc
      case 'cumulativeExposure':
        return summary.cumulativeExposure
      case 'timeToTip':
        return summary.timeToTip ?? settings.horizon
    }
  }
}
