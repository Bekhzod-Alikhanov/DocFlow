/**
 * Firth penalised logistic regression.
 *
 * `CALIBRATION.md` §3.4 is explicit about why ordinary maximum likelihood will not do
 * here. At N ≈ 15–30 with four predictors the events-per-variable ratio is around 2–3
 * against a rule of thumb of 10, and **separation is likely**: if every case with
 * `precommit = 1` had protection upheld — which is close to what the seed cases suggest —
 * the MLE for that coefficient diverges to infinity and the software reports a number
 * anyway, usually something like 18 with a standard error of 4000.
 *
 * Firth (1993) adds a Jeffreys-prior penalty to the log-likelihood:
 *
 *     l*(β) = l(β) + ½ log det I(β)
 *
 * which removes the O(1/n) bias of the MLE and, crucially, **guarantees finite estimates
 * under separation**. It is the standard choice for exactly this situation and it is what
 * the protocol specifies.
 *
 * The modified score equation is
 *
 *     U*(β)_j = Σ_i [ y_i − p_i + h_i(½ − p_i) ] x_ij
 *
 * where h_i is the i-th diagonal of the hat matrix H = W^½X(XᵀWX)⁻¹XᵀW^½ and
 * W = diag(p_i(1 − p_i)). Solved by Newton–Raphson with step halving.
 *
 * Nothing here is DocFlow-specific — it is a small statistical routine with tests
 * against textbook cases, deliberately separable from the model so it can be checked on
 * its own.
 */
import { solveLinear, type Matrix } from '../linalg'

export interface FirthFit {
  /** Coefficients, intercept first if the design includes one. */
  beta: number[]
  /** Standard errors from the inverse information matrix. */
  se: number[]
  /** Penalised log-likelihood at the optimum. */
  logLikelihood: number
  iterations: number
  converged: boolean
  /** True when ordinary ML would have diverged — the reason this routine exists. */
  separationDetected: boolean
}

export interface FirthOptions {
  maxIter?: number
  tol?: number
  /** Prepend a column of ones. Default true. */
  intercept?: boolean
}

function sigmoid(z: number): number {
  if (z >= 0) {
    const e = Math.exp(-z)
    return 1 / (1 + e)
  }
  const e = Math.exp(z)
  return e / (1 + e)
}

/** X with an intercept column prepended when requested. */
function design(X: number[][], intercept: boolean): number[][] {
  return intercept ? X.map((row) => [1, ...row]) : X.map((row) => [...row])
}

/** (XᵀWX) for weights w. */
function infoMatrix(X: number[][], w: number[]): Matrix {
  const k = X[0].length
  const I: Matrix = Array.from({ length: k }, () => new Array<number>(k).fill(0))
  for (let a = 0; a < k; a++) {
    for (let b = a; b < k; b++) {
      let s = 0
      for (let i = 0; i < X.length; i++) s += X[i][a] * w[i] * X[i][b]
      I[a][b] = s
      I[b][a] = s
    }
  }
  return I
}

/** Invert by solving against the identity. Returns null if singular. */
function invert(M: Matrix): Matrix | null {
  const k = M.length
  const inv: Matrix = Array.from({ length: k }, () => new Array<number>(k).fill(0))
  for (let c = 0; c < k; c++) {
    const e = new Array<number>(k).fill(0)
    e[c] = 1
    const col = solveLinear(M, e)
    if (!col) return null
    for (let r = 0; r < k; r++) inv[r][c] = col[r]
  }
  return inv
}

/** Diagonal of the hat matrix H = W^½X(XᵀWX)⁻¹XᵀW^½. */
function hatDiagonal(X: number[][], w: number[], infoInv: Matrix): number[] {
  const n = X.length
  const k = X[0].length
  const h = new Array<number>(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let a = 0; a < k; a++) {
      for (let b = 0; b < k; b++) s += X[i][a] * infoInv[a][b] * X[i][b]
    }
    h[i] = w[i] * s
  }
  return h
}

/**
 * Detect (quasi-)complete separation: some predictor perfectly splits the outcome.
 *
 * Reported rather than repaired. Firth handles it, but a reader is entitled to know
 * that a coefficient's magnitude is being held finite by the penalty rather than by the
 * data — the sign is trustworthy, the size much less so.
 */
export function detectSeparation(X: number[][], y: number[]): boolean {
  const k = X[0].length
  for (let j = 0; j < k; j++) {
    let maxZero = -Infinity
    let minOne = Infinity
    let maxOne = -Infinity
    let minZero = Infinity
    for (let i = 0; i < X.length; i++) {
      const v = X[i][j]
      if (y[i] === 1) {
        minOne = Math.min(minOne, v)
        maxOne = Math.max(maxOne, v)
      } else {
        minZero = Math.min(minZero, v)
        maxZero = Math.max(maxZero, v)
      }
    }
    if (minOne === Infinity || minZero === Infinity) continue
    if (minOne >= maxZero || minZero >= maxOne) return true
  }
  return false
}

export function firthLogistic(
  Xraw: number[][],
  y: number[],
  opts: FirthOptions = {},
): FirthFit {
  const maxIter = opts.maxIter ?? 200
  const tol = opts.tol ?? 1e-9
  const X = design(Xraw, opts.intercept ?? true)
  const n = X.length
  const k = X[0].length

  if (n === 0 || y.length !== n) {
    throw new Error(`firthLogistic: ${n} rows of X against ${y.length} outcomes`)
  }

  let beta = new Array<number>(k).fill(0)
  let converged = false
  let iterations = 0
  let penalised = -Infinity

  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1
    const p = X.map((row) => sigmoid(row.reduce((s, v, j) => s + v * beta[j], 0)))
    const w = p.map((pi) => Math.max(pi * (1 - pi), 1e-12))
    const info = infoMatrix(X, w)
    const infoInv = invert(info)
    if (!infoInv) break
    const h = hatDiagonal(X, w, infoInv)

    // Modified score: U*_j = Σ_i [y_i − p_i + h_i(½ − p_i)] x_ij
    const U = new Array<number>(k).fill(0)
    for (let j = 0; j < k; j++) {
      let s = 0
      for (let i = 0; i < n; i++) s += (y[i] - p[i] + h[i] * (0.5 - p[i])) * X[i][j]
      U[j] = s
    }

    const step = solveLinear(info, U)
    if (!step) break

    // Step halving on the penalised log-likelihood, which keeps the iteration stable
    // when the unpenalised surface is nearly flat — the separated case.
    const current = penalisedLogLik(X, y, beta)
    let lambda = 1
    let accepted = false
    for (let bt = 0; bt < 30; bt++) {
      const candidate = beta.map((b, j) => b + lambda * step[j])
      const value = penalisedLogLik(X, y, candidate)
      if (Number.isFinite(value) && value >= current - 1e-12) {
        beta = candidate
        penalised = value
        accepted = true
        break
      }
      lambda *= 0.5
    }
    if (!accepted) break

    if (Math.max(...step.map((s) => Math.abs(s * lambda))) < tol) {
      converged = true
      break
    }
  }

  // Standard errors from the inverse information at the optimum.
  const pFinal = X.map((row) => sigmoid(row.reduce((s, v, j) => s + v * beta[j], 0)))
  const wFinal = pFinal.map((pi) => Math.max(pi * (1 - pi), 1e-12))
  const infoFinal = invert(infoMatrix(X, wFinal))
  const se = infoFinal
    ? Array.from({ length: k }, (_, j) => Math.sqrt(Math.max(0, infoFinal[j][j])))
    : new Array<number>(k).fill(NaN)

  return {
    beta,
    se,
    logLikelihood: penalised,
    iterations,
    converged,
    separationDetected: detectSeparation(Xraw, y),
  }
}

/** l(β) + ½ log det I(β). */
export function penalisedLogLik(X: number[][], y: number[], beta: number[]): number {
  let ll = 0
  const p: number[] = []
  for (let i = 0; i < X.length; i++) {
    const z = X[i].reduce((s, v, j) => s + v * beta[j], 0)
    const pi = sigmoid(z)
    p.push(pi)
    ll += y[i] === 1 ? Math.log(Math.max(pi, 1e-300)) : Math.log(Math.max(1 - pi, 1e-300))
  }
  const w = p.map((pi) => Math.max(pi * (1 - pi), 1e-12))
  const det = logDet(infoMatrix(X, w))
  return Number.isFinite(det) ? ll + 0.5 * det : -Infinity
}

/** log|M| by Cholesky; -Infinity if not positive definite. */
function logDet(M: Matrix): number {
  const k = M.length
  const L: Matrix = Array.from({ length: k }, () => new Array<number>(k).fill(0))
  for (let i = 0; i < k; i++) {
    for (let j = 0; j <= i; j++) {
      let s = M[i][j]
      for (let m = 0; m < j; m++) s -= L[i][m] * L[j][m]
      if (i === j) {
        if (s <= 0) return -Infinity
        L[i][j] = Math.sqrt(s)
      } else {
        L[i][j] = s / L[j][j]
      }
    }
  }
  let sum = 0
  for (let i = 0; i < k; i++) sum += Math.log(L[i][i])
  return 2 * sum
}
