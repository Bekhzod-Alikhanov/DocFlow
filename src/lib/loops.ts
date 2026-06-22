/**
 * Loop-dominance scoring for the causal-loop diagram. Maps the live auxiliary
 * flows to a normalized share for each of the three loops, so the diagram can
 * "light up" whichever loop currently dominates the dynamics. Pure and
 * unit-tested — the diagram component stays presentational.
 *
 *  - R1 (suppression spiral, reinforcing → chilling): legal/PR fear suppresses
 *    documentation, debt accumulates, exposure feeds more fear. Tracked by `backfire`.
 *  - R2 (learning flywheel, reinforcing → learning): documenting builds learning and
 *    safety culture, which makes documenting safer. Tracked by `safety_wins`.
 *  - B  (balancing): harm events create remediation pressure that damps the system.
 *    Tracked by `harm_events`.
 */
import type { Auxiliaries } from '../engine'

export interface LoopActivity {
  r1: number
  r2: number
  balancing: number
}

export type LoopId = 'r1' | 'r2' | 'balancing'

/** Normalized 0..1 dominance shares (sum to 1 unless the system is fully quiescent). */
export function loopActivity(aux: Auxiliaries): LoopActivity {
  const r1 = Math.max(0, aux.backfire)
  const r2 = Math.max(0, aux.safety_wins)
  const balancing = Math.max(0, aux.harm_events)
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
