/**
 * Ch.4 record-capturability: ML failures resist faithful recording. Capturability
 * starts from a resistance-dependent base, decays with retrain cadence when no
 * snapshot was taken, and is restored by capturing state/pipeline before the next
 * training run. 0-100, directional.
 *
 * Coefficients are named in `coefficients.ts`. The RESISTANCE_BASE ordering is a
 * falsifiable structural claim about ML failure modes; its magnitudes are not.
 */
import type { CaptureResistance } from './types'
import { RESISTANCE_BASE, CAPTURABILITY } from './coefficients'

export interface CapturabilityOpts {
  resistance: CaptureResistance
  retrainCadence: number
  stateSnapshotted: boolean
  pipelineCaptured: boolean
}

export function recordCapturability(opts: CapturabilityOpts): number {
  const base = RESISTANCE_BASE[opts.resistance] ?? CAPTURABILITY.unknown_resistance_base
  const captureBoost =
    (opts.stateSnapshotted ? CAPTURABILITY.state_snapshot_boost : 0) +
    (opts.pipelineCaptured ? CAPTURABILITY.pipeline_capture_boost : 0)
  // Without a snapshot, retraining overwrites the evidence; with one, the snapshot holds.
  const cadence = Math.min(1, Math.max(0, opts.retrainCadence))
  const erosion = opts.stateSnapshotted ? 0 : CAPTURABILITY.retrain_erosion * cadence
  return Math.max(0, Math.min(100, base + captureBoost - erosion))
}
