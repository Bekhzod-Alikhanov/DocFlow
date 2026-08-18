/**
 * Structural identifiability of the output-sensitivity matrix — VALIDATION.md V7.1.
 *
 * The question this answers is narrow and easy to get wrong: given the outputs the model
 * actually reports, can the parameters be told apart AT ALL? Not "are they estimated
 * well" — there is no data, so nothing is estimated — but the prior question of whether
 * distinct parameter vectors produce distinguishable output. If two parameters move every
 * output in exactly the same proportion, no observation of those outputs could ever
 * separate them, and any claim about one of them individually is empty.
 *
 * ADR/0006 records why this and not Fisher information: FIM requires a likelihood, a
 * likelihood requires data, and asserting one here would be the kind of borrowed rigour
 * a hostile reviewer is right to punish. Rank and conditioning of `S = ∂y/∂θ` are
 * well-posed with no data at all.
 *
 * V7.1's real requirement is the last clause: rank deficiency is REPORTED, NOT HIDDEN,
 * and the deficient directions are NAMED. A rank number alone is not actionable. What
 * a modeller needs is "these three weights only ever appear in this one combination",
 * which is what `deficientDirections` returns.
 */
import type { Params, ParamKey } from './types'
import { simulate } from './simulate'
import { defaultInitState } from './registry'
import { singularValues, symmetricEigen, type Matrix } from './linalg'

export interface SensitivityAnalysis {
  paramKeys: ParamKey[]
  outputNames: string[]
  /** S[i][j] = ∂(output i) / ∂(param j), scaled — see `outputSensitivityMatrix`. */
  S: Matrix
  singular: number[]
  /** Number of singular values above `relTol · σ_max`. */
  rank: number
  /** σ_max / σ_min over the retained directions. */
  conditionNumber: number
  deficient: DeficientDirection[]
}

export interface DeficientDirection {
  singularValue: number
  /** Parameters with meaningful weight in this direction, largest first. */
  members: { key: ParamKey; weight: number }[]
}

/** The reported outputs. A parameter invisible in all of these is unidentifiable. */
export interface OutputVector {
  names: string[]
  values: number[]
}

/**
 * Times at which the trajectory is sampled, in months.
 *
 * V7.1 specifies sensitivity OVER A REFERENCE TRAJECTORY, and the first version of this
 * module sampled only the final state — ten numbers, against fifteen levers. A matrix
 * with fewer informative rows than columns cannot have full column rank no matter how
 * separable the parameters really are, so that measurement was bounded by its own design
 * rather than by the model. Sampling through the transient is where the information is:
 * two parameters that reach the same endpoint by visibly different routes are
 * distinguishable, and only a time series can see it.
 */
export const SAMPLE_TIMES = [3, 6, 12, 24, 48, 72, 96, 120] as const

const STATE_OUTPUTS = ['R1', 'R2', 'R3', 'TD', 'L', 'E_pl', 'E_reg', 'E_fid', 'C'] as const

export function headlineOutputs(p: Params): OutputVector {
  const settings = { horizon: 120, dt: 0.5, solver: 'rk4' as const }
  const r = simulate(defaultInitState(), p, settings)
  const names: string[] = []
  const values: number[] = []

  for (const t of SAMPLE_TIMES) {
    const idx = Math.min(r.trajectory.states.length - 1, Math.round(t / settings.dt))
    const st = r.trajectory.states[idx]
    for (const k of STATE_OUTPUTS) {
      names.push(`${k}@${t}`)
      values.push(st[k])
    }
    names.push(`f_doc@${t}`)
    values.push(r.trajectory.aux[idx].f_doc)
  }
  return { names, values }
}

/** Final-state-only outputs, retained to show what the trajectory sampling buys. */
export function finalStateOutputs(p: Params): OutputVector {
  const r = simulate(defaultInitState(), p, { horizon: 120, dt: 0.5, solver: 'rk4' })
  const s = r.summary.finalState
  return {
    names: ['f_doc', ...STATE_OUTPUTS],
    values: [r.summary.finalFdoc, ...STATE_OUTPUTS.map((k) => s[k])],
  }
}

/**
 * Central-difference sensitivity matrix, with both axes scaled.
 *
 * Scaling is not a detail. Raw ∂y/∂θ mixes units — `TD` runs to ~210 while `C` is
 * bounded by 1 — so an unscaled matrix reports "rank" dominated by whichever output
 * happens to have the largest numbers. Each row is divided by the output's own
 * magnitude and each column multiplied by the parameter's step, making S a matrix of
 * relative sensitivities: dimensionless, and comparable across rows.
 */
export function outputSensitivityMatrix(
  base: Params,
  paramKeys: ParamKey[],
  outputs: (p: Params) => OutputVector = headlineOutputs,
  relStep = 1e-4,
): { S: Matrix; outputNames: string[] } {
  const y0 = outputs(base)
  const nOut = y0.values.length
  const S: Matrix = Array.from({ length: nOut }, () => new Array<number>(paramKeys.length).fill(0))

  for (let j = 0; j < paramKeys.length; j++) {
    const key = paramKeys[j]
    const theta = base[key]
    // Step relative to the parameter's own size, with an absolute floor so a parameter
    // whose default is 0 still gets perturbed rather than silently reading as inert.
    const h = relStep * Math.max(Math.abs(theta), 1)
    const yPlus = outputs({ ...base, [key]: theta + h })
    const yMinus = outputs({ ...base, [key]: theta - h })
    for (let i = 0; i < nOut; i++) {
      const scale = Math.max(Math.abs(y0.values[i]), 1e-8)
      S[i][j] = ((yPlus.values[i] - yMinus.values[i]) / (2 * h)) * (h / scale)
    }
  }
  return { S, outputNames: y0.names }
}

/**
 * Parameter combinations that the outputs cannot separate.
 *
 * A near-null eigenvector of SᵗS is a direction in parameter space along which the
 * outputs barely move. Its large-magnitude components are the parameters that trade off
 * against each other, which is the actionable form of the finding.
 */
export function deficientDirections(
  S: Matrix,
  paramKeys: ParamKey[],
  relTol = 1e-6,
  memberTol = 0.2,
): DeficientDirection[] {
  const cols = paramKeys.length
  const ata: Matrix = Array.from({ length: cols }, () => new Array<number>(cols).fill(0))
  for (let i = 0; i < cols; i++) {
    for (let j = i; j < cols; j++) {
      let sum = 0
      for (let k = 0; k < S.length; k++) sum += S[k][i] * S[k][j]
      ata[i][j] = sum
      ata[j][i] = sum
    }
  }
  const { values, vectors } = symmetricEigen(ata)
  const sigmaMax = Math.sqrt(Math.max(0, values[0] ?? 0))
  if (sigmaMax === 0) return []

  const out: DeficientDirection[] = []
  for (let i = 0; i < values.length; i++) {
    const sigma = Math.sqrt(Math.max(0, values[i]))
    if (sigma > relTol * sigmaMax) continue
    const members = vectors[i]
      .map((weight, j) => ({ key: paramKeys[j], weight }))
      .filter((m) => Math.abs(m.weight) >= memberTol)
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    out.push({ singularValue: sigma, members })
  }
  return out
}

export function analyseIdentifiability(
  base: Params,
  paramKeys: ParamKey[],
  outputs: (p: Params) => OutputVector = headlineOutputs,
  relTol = 1e-6,
): SensitivityAnalysis {
  const { S, outputNames } = outputSensitivityMatrix(base, paramKeys, outputs)
  const singular = singularValues(S)
  const sigmaMax = singular[0] ?? 0
  const retained = singular.filter((s) => s > relTol * sigmaMax && s > 0)
  return {
    paramKeys,
    outputNames,
    S,
    singular,
    rank: retained.length,
    conditionNumber: retained.length > 0 ? sigmaMax / retained[retained.length - 1] : Infinity,
    deficient: deficientDirections(S, paramKeys, relTol),
  }
}
