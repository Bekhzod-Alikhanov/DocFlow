/**
 * Pure reducer: apply one player choice to the run state. Lever deltas fold into
 * the working Params (clamped via the engine registry); explicit incidentEffects
 * adjust incident meters; flags accumulate. Ch.2 boundary choices recompute
 * signal_fidelity via the transfer fn; capture flags recompute record_capturability.
 */
import { clampParam } from '../registry'
import type { Params, State, SimSettings, LeverKey } from '../types'
import { type Choice, type IncidentMeters, type FailureType, type CaptureResistance, INCIDENT_METER_KEYS } from './types'
import { crossBoundary } from './boundary'
import { recordCapturability } from './capturability'

export interface RunState {
  params: Params
  init: State
  settings: SimSettings
  flags: string[]
  incident: IncidentMeters
  retrainCadence: number
  failureType: FailureType
  captureResistance: CaptureResistance
}

function clampMeter(x: number): number {
  return Math.max(0, Math.min(100, x))
}

export function applyChoice(state: RunState, choice: Choice): RunState {
  // Fold clamped lever deltas.
  const params = { ...state.params }
  for (const [k, delta] of Object.entries(choice.leverDeltas) as [LeverKey, number][]) {
    params[k] = clampParam(k, params[k] + delta)
  }

  const flags = choice.flags.length ? Array.from(new Set([...state.flags, ...choice.flags])) : state.flags.slice()

  // Apply explicit incident effects.
  const incident = { ...state.incident }
  for (const key of INCIDENT_METER_KEYS) {
    const d = choice.incidentEffects[key]
    if (typeof d === 'number') incident[key] = clampMeter(incident[key] + d)
  }

  // Ch.2 handoff: degrade signal fidelity.
  if (choice.chapter === 2) {
    incident.signal_fidelity = clampMeter(
      crossBoundary(incident.signal_fidelity, params, {
        hasIndependentChannel: flags.includes('independent_review_channel'),
        legalOwnsRecord: flags.includes('legal_owns_record'),
        retrainCadence: state.retrainCadence,
      }),
    )
    // Board visibility tracks the fidelity that actually reached leadership, plus the
    // explicit board-routing delta the choice authored (structured channel vs. informal
    // brief). Folding the delta in keeps the authored ±deltas live instead of discarding them.
    const boardDelta = choice.incidentEffects.board_oversight_visibility ?? 0
    incident.board_oversight_visibility = clampMeter(incident.signal_fidelity + boardDelta)
  }

  // Ch.4 capture: recompute capturability from accumulated capture flags.
  if (flags.includes('state_snapshotted') || flags.includes('pipeline_captured')) {
    incident.record_capturability = recordCapturability({
      resistance: state.captureResistance,
      retrainCadence: state.retrainCadence,
      stateSnapshotted: flags.includes('state_snapshotted'),
      pipelineCaptured: flags.includes('pipeline_captured'),
    })
  }

  return { ...state, params, flags, incident }
}
