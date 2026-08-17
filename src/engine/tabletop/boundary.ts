/**
 * Ch.2 organizational-boundary mechanics (Røvik translation loss; Hansen tie
 * strength; Vaughan/Perrow normalization of deviance). A signal crossing a
 * professional handoff loses fidelity; a true warning can be read as routine noise.
 * Pure: same inputs → same outputs.
 *
 * Every coefficient is named in `coefficients.ts` with its tier and what would
 * constrain it. All are T4 — freely chosen. The named constants also make the
 * MONOTONICITY of this module visible: every lever here improves every outcome, which
 * AUDIT.md flagged as a model encoding a thesis rather than testing one.
 */
import type { Params } from '../types'
import { TIE_STRENGTH, TRANSLATION_LOSS, NORMALIZATION, BOUNDARY_TRANSFER } from './coefficients'

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/** Tie strength in (0,1]: weak ties cannot carry tacit/complex knowledge. */
export function tieStrengthFactor(p: Params, hasIndependentChannel: boolean): number {
  const base =
    TIE_STRENGTH.base +
    TIE_STRENGTH.recipient_enforcer_separation * p.recipient_enforcer_separation +
    TIE_STRENGTH.near_miss_tier * p.near_miss_tier +
    TIE_STRENGTH.effective_challenge * p.effective_challenge +
    TIE_STRENGTH.intermediary_capacity * p.intermediary_capacity
  return clamp01(base + (hasIndependentChannel ? TIE_STRENGTH.independent_channel_bonus : 0))
}

/** Detail omitted in transit, in [0,1]; legal-as-bottleneck inflates it. */
export function translationLoss(p: Params, legalOwnsRecord: boolean): number {
  const reducers =
    TRANSLATION_LOSS.translation_layer * p.translation_layer +
    TRANSLATION_LOSS.original_records_boundary * p.original_records_boundary
  const base = TRANSLATION_LOSS.base - reducers
  return clamp01(base + (legalOwnsRecord ? TRANSLATION_LOSS.legal_bottleneck_surcharge : 0))
}

/** Probability a true warning is classified as noise, in [0,1]. */
export function normalizationProbability(p: Params, retrainCadence: number): number {
  const raw =
    NORMALIZATION.base +
    NORMALIZATION.retrain_cadence * clamp01(retrainCadence) -
    NORMALIZATION.just_culture * p.just_culture -
    NORMALIZATION.near_miss_tier * p.near_miss_tier
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
  const afterNorm = transferred * (1 - BOUNDARY_TRANSFER.normalization_haircut * norm)
  return Math.max(0, Math.min(fidelity, afterNorm))
}
