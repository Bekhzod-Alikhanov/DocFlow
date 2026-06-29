/**
 * Ch.2 organizational-boundary mechanics (Røvik translation loss; Hansen tie
 * strength; Vaughan/Perrow normalization of deviance). A signal crossing a
 * professional handoff loses fidelity; a true warning can be read as routine noise.
 * Pure: same inputs → same outputs. Coefficients are illustrative (see TABLETOP.md).
 */
import type { Params } from '../types'

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/** Tie strength in (0,1]: weak ties cannot carry tacit/complex knowledge. */
export function tieStrengthFactor(p: Params, hasIndependentChannel: boolean): number {
  const base =
    0.45 +
    0.18 * p.recipient_enforcer_separation +
    0.14 * p.near_miss_tier +
    0.13 * p.effective_challenge +
    0.10 * p.intermediary_capacity
  return clamp01(base + (hasIndependentChannel ? 0.15 : 0))
}

/** Detail omitted in transit, in [0,1]; legal-as-bottleneck inflates it. */
export function translationLoss(p: Params, legalOwnsRecord: boolean): number {
  const reducers = 0.22 * p.translation_layer + 0.12 * p.original_records_boundary
  const base = 0.30 - reducers
  return clamp01(base + (legalOwnsRecord ? 0.25 : 0))
}

/** Probability a true warning is classified as noise, in [0,1]. */
export function normalizationProbability(p: Params, retrainCadence: number): number {
  const raw = 0.15 + 0.55 * clamp01(retrainCadence) - 0.35 * p.just_culture - 0.15 * p.near_miss_tier
  return clamp01(raw)
}

export interface CrossOpts {
  hasIndependentChannel: boolean
  legalOwnsRecord: boolean
  retrainCadence: number
}

/**
 * Transfer one boundary: fidelity_next = fidelity · tie · (1 − loss), then a
 * normalization haircut (the warning partly read as noise). Monotone & bounded.
 */
export function crossBoundary(fidelity: number, p: Params, opts: CrossOpts): number {
  const tie = tieStrengthFactor(p, opts.hasIndependentChannel)
  const loss = translationLoss(p, opts.legalOwnsRecord)
  const norm = normalizationProbability(p, opts.retrainCadence)
  const transferred = fidelity * tie * (1 - loss)
  const afterNorm = transferred * (1 - 0.5 * norm)
  return Math.max(0, Math.min(fidelity, afterNorm))
}
