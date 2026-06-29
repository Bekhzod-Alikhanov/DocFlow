/**
 * Ch.4 record-capturability: ML failures resist faithful recording. Capturability
 * starts from a resistance-dependent base, decays with retrain cadence when no
 * snapshot was taken, and is restored by capturing state/pipeline before the next
 * training run. 0–100, directional. Coefficients illustrative (see TABLETOP.md).
 */
import type { CaptureResistance } from './types'

const RESISTANCE_BASE: Record<CaptureResistance, number> = {
  silent: 30,
  irreproducible: 35,
  environment_dependent: 45,
  distributional: 55,
}

export interface CapturabilityOpts {
  resistance: CaptureResistance
  retrainCadence: number
  stateSnapshotted: boolean
  pipelineCaptured: boolean
}

export function recordCapturability(opts: CapturabilityOpts): number {
  const base = RESISTANCE_BASE[opts.resistance] ?? 45
  const captureBoost = (opts.stateSnapshotted ? 30 : 0) + (opts.pipelineCaptured ? 15 : 0)
  // Without a snapshot, retraining overwrites the evidence; with one, the snapshot holds.
  const cadence = Math.min(1, Math.max(0, opts.retrainCadence))
  const erosion = opts.stateSnapshotted ? 0 : 40 * cadence
  return Math.max(0, Math.min(100, base + captureBoost - erosion))
}
