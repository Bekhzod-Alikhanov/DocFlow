/**
 * What calibration would do to the headline result.
 *
 * The point of executing the coding protocol is not to fill in four numbers. It is to
 * find out whether the boundary result survives contact with evidence — whether
 * "suppression dominates in 2.8% of the environment box" is a fact about the doctrine or
 * a fact about four coefficients I chose.
 *
 * This wires the answer up in advance, so that the moment coded data exists the
 * comparison runs rather than being a further project. It also makes the current claim
 * falsifiable in a specific way: if calibrated coefficients move the suppression share
 * materially, the uncalibrated result was load-bearing on assumptions and must be
 * reported as such.
 */
import { mapBoundary, regulatoryThreshold, runArchitectureWith, type Environment } from '../boundary'
import { privilegeSurvival } from '../model'
import { paramsFromPreset } from '../scenario'
import { PRESET_BY_ID } from '../presets'
import type { Params } from '../types'
import { applyCalibration, type CalibrationResult } from './coding'

export interface CalibrationImpact {
  /** Privilege survival at each posture, before and after. */
  privilege: { preset: string; before: number; after: number }[]
  suppressionShareBefore: number
  suppressionShareAfter: number
  thresholdBefore: number | null
  thresholdAfter: number | null
  /** True when the qualitative conclusion is unchanged. */
  conclusionHolds: boolean
  /** Everything the caller must repeat when quoting these numbers. */
  caveats: string[]
}

const PRESETS_OF_INTEREST = ['healthcare', 'aviation', 'contested', 'cybersecurity', 'eu-trap']

/**
 * Recompute the boundary under calibrated coefficients.
 *
 * `force` is passed through to `applyCalibration` deliberately: the whole value of this
 * function during development is being able to ask "what WOULD calibration do" before
 * the gate clears. Every such run is stamped with a caveat that says so, so that an
 * exploratory number can never be mistaken for a calibrated one.
 */
export function calibrationImpact(
  result: CalibrationResult,
  opts: { steps?: number; force?: boolean } = {},
): CalibrationImpact {
  const steps = opts.steps ?? 5
  const force = opts.force ?? result.blockers.length > 0

  const privilege = PRESETS_OF_INTEREST.filter((id) => PRESET_BY_ID[id]).map((id) => {
    const before = paramsFromPreset(PRESET_BY_ID[id])
    const after = applyCalibration(before as unknown as Record<string, number>, result, {
      force,
    }) as unknown as Params
    return {
      preset: id,
      before: privilegeSurvival(before).pi,
      after: privilegeSurvival(after).pi,
    }
  })

  const before = mapBoundary(steps)
  // The boundary comparison itself must run with calibrated coefficients on BOTH arms,
  // since both architectures are affected by the privilege model.
  const afterShare = mapBoundaryCalibrated(result, steps, force)

  const thresholdBefore = regulatoryThreshold(0.5, 0)
  const thresholdAfter = regulatoryThresholdCalibrated(result, force)

  const caveats: string[] = []
  if (force && result.blockers.length > 0) {
    caveats.push(
      'EXPLORATORY ONLY — the calibration has not cleared its gate. These numbers show what calibration would do, not what it does.',
    )
    caveats.push(...result.blockers)
  }
  if (result.fit.separationDetected) {
    caveats.push('Separation in the coded data: directions are usable, magnitudes are the penalty talking.')
  }
  caveats.push('Coded case law is an ANALOG for AI incident forensics (T2 at best), never a measurement of it.')

  const shareMovedMaterially = Math.abs(afterShare - before.suppressionShare) > 0.05
  return {
    privilege,
    suppressionShareBefore: before.suppressionShare,
    suppressionShareAfter: afterShare,
    thresholdBefore,
    thresholdAfter,
    conclusionHolds: !shareMovedMaterially,
    caveats,
  }
}

function calibrated(result: CalibrationResult, force: boolean) {
  return (p: Params): Params =>
    applyCalibration(p as unknown as Record<string, number>, result, { force }) as unknown as Params
}

/**
 * The boundary sweep with calibrated privilege coefficients applied to both arms.
 *
 * Re-derived here rather than by adding a calibration mode to `mapBoundary`. That
 * function computes the PUBLISHED result and should not grow a switch that changes what
 * it means; the shared simulation settings are reused through `runArchitectureWith`, so
 * the two paths cannot drift on anything that matters.
 */
function mapBoundaryCalibrated(result: CalibrationResult, steps: number, force: boolean): number {
  const apply = calibrated(result, force)
  const axis = (n: number, hi: number) =>
    Array.from({ length: n }, (_, i) => (hi * i) / Math.max(1, n - 1))
  let dominated = 0
  let total = 0
  for (const p_court of axis(steps, 1)) {
    for (const v_reg of axis(steps, 3)) {
      for (const v_fid of axis(steps, 3)) {
        const env = { p_court, v_pl: 1, v_reg, v_fid }
        const candid = evaluateWith(apply, 'healthcare', env)
        const suppressive = evaluateWith(apply, 'cybersecurity', env)
        if (candid - suppressive > 0) dominated++
        total++
      }
    }
  }
  return total === 0 ? 0 : dominated / total
}

function regulatoryThresholdCalibrated(result: CalibrationResult, force: boolean): number | null {
  const apply = calibrated(result, force)
  const grid = Array.from({ length: 40 }, (_, i) => (3 * i) / 39)
  let prev: { v: number; pen: number } | null = null
  for (const v_reg of grid) {
    const env = { p_court: 0.5, v_pl: 1, v_reg, v_fid: 0 }
    const pen = evaluateWith(apply, 'healthcare', env) - evaluateWith(apply, 'cybersecurity', env)
    if (prev && prev.pen > 0 && pen <= 0) {
      const t = prev.pen / (prev.pen - pen)
      return prev.v + t * (v_reg - prev.v)
    }
    prev = { v: v_reg, pen }
  }
  return null
}

function evaluateWith(
  apply: (p: Params) => Params,
  presetId: string,
  env: Environment,
): number {
  return runArchitectureWith(presetId, env, apply).eTot
}
