/**
 * Loop-dominance scoring for the causal-loop diagram. Maps the live auxiliary
 * flows to a normalized share for each of the three loops, so the diagram can
 * "light up" whichever loop currently dominates the dynamics. Pure and
 * unit-tested — the diagram component stays presentational.
 *
 *  - R1 (suppression spiral, reinforcing → chilling): documenting without protection
 *    backfires, and realised harm and exposure chill culture further.
 *  - R2 (learning flywheel, reinforcing → learning): documenting builds learning and
 *    safety culture, which makes documenting safer.
 *  - B  (balancing): harm and debt create remediation pressure that damps the system.
 *
 * COMMENSURABILITY. Shares are only meaningful if the three raw quantities live on
 * the same scale. Through v0.2 they did not: R1 and R2 were culture-target pressures
 * of order 1, while B was `harm_events`, an unbounded level that reaches ~100 in the
 * chilling regime. B therefore swamped the other two whenever harm was non-trivial —
 * the diagram reported "100% balancing" at the chilling attractor, which is exactly
 * backwards, since that is where the suppression spiral is strongest. Each loop is
 * now reduced to a bounded 0–1 intensity before shares are taken.
 */
import type { Auxiliaries } from '../engine'

export interface LoopActivity {
  r1: number
  r2: number
  balancing: number
}

export type LoopId = 'r1' | 'r2' | 'balancing'

/** Saturating map from a non-negative magnitude to a bounded 0–1 intensity. */
function intensity(x: number, halfSaturation: number): number {
  const v = Math.max(0, x)
  return v / (v + halfSaturation)
}

/**
 * Normalized 0..1 dominance shares (sum to 1 unless the system is fully quiescent).
 *
 * v0.3.0: R1 includes the two return arrows that close the suppression spiral —
 * realised exposure and realised harm chilling culture. Before v0.3.0 those terms
 * did not exist in the model at all, so the diagram drew an arrow the equations did
 * not contain (AUDIT.md F1) and R1 was scored from `backfire` alone.
 */
export function loopActivity(aux: Auxiliaries): LoopActivity {
  // Culture-target pressures: order 1 by construction (psi, psi_E, psi_H, omega are
  // all bounded by their registry maxima of a few units).
  const r1raw = Math.max(0, aux.backfire) + Math.max(0, aux.exposure_chill) + Math.max(0, aux.harm_chill)
  const r2raw = Math.max(0, aux.safety_wins)
  // The balancing loop is a debt-damping flow, not a culture pressure. Express it as
  // the share of debt inflow that remediation is actually offsetting — inherently
  // 0–1, and comparable in meaning to "how strongly is this loop operating".
  const debtInflow = Math.max(0, aux.u_to_debt)
  const remediating = Math.max(0, aux.remediation)
  const bRaw = remediating + debtInflow > 1e-12 ? remediating / (remediating + debtInflow) : 0

  const HALF = 1 // culture pressure at which a reinforcing loop is "half lit"
  const r1 = intensity(r1raw, HALF)
  const r2 = intensity(r2raw, HALF)
  const balancing = bRaw

  const total = r1 + r2 + balancing
  if (total <= 1e-12) return { r1: 0, r2: 0, balancing: 0 }
  return { r1: r1 / total, r2: r2 / total, balancing: balancing / total }
}

export function dominantLoop(a: LoopActivity): LoopId {
  if (a.r1 >= a.r2 && a.r1 >= a.balancing) return 'r1'
  if (a.r2 >= a.balancing) return 'r2'
  return 'balancing'
}

export const LOOP_LABEL: Record<LoopId, string> = {
  r1: 'R1 · Suppression spiral',
  r2: 'R2 · Learning flywheel',
  balancing: 'B · Harm-driven remediation',
}
