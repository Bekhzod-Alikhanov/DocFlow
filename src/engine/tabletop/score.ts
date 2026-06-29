/**
 * Score every terminal path of a scenario and test the central thesis property:
 * NO path is best on every meter. "Good" meters (higher is better) include the
 * five positive institutional meters, the six positive incident meters, the durable
 * exposure axis (1 − litigation_pressure), and the short-term PERCEIVED legal shield
 * (`legalSafety`); recurrence_risk is folded in inverted. A path "dominates" if it is
 * ≥ all others on every good meter and > on at least one.
 *
 * `legalSafety` is deliberately decoupled from litigation_pressure. The playbook's
 * lesson (cyber privilege-first analog) is that asserting privilege and keeping
 * analysis off the record FEELS protective now, yet is fragile and degrades the safety
 * architecture — so the durable litigation_pressure can move the opposite way. The
 * "keep-it-oral" path wins the perceived shield and loses the durable axis: that split
 * is the trap, and it is why no path dominates.
 */
import type { LeverKey } from '../types'
import { defaultParams, defaultInitState, defaultSettings } from '../registry'
import {
  type TabletopScenario, type Choice, type IncidentMeters,
  type InstitutionalMeterKey, initialIncidentMeters,
} from './types'
import { applyChoice, type RunState } from './applyChoice'
import { engineForwardOutcome, type AftermathOutcome } from './outcome'
import { institutionalMeters } from './meters'
import { simulate } from '../simulate'
import { enumeratePaths } from './resolver'

export interface PathScore {
  choices: Choice[]
  institutional: Record<InstitutionalMeterKey, number>
  incident: IncidentMeters
  outcome: AftermathOutcome
  /** Short-term *perceived* legal shield (0–1) — felt safety of asserting privilege
   *  and keeping analysis off the record. NOT the durable litigation_pressure. */
  legalSafety: number
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/**
 * The short-term *perceived* legal shield: privilege asserted, the record kept off
 * the books, fewer discoverable factual records. This is what makes the "keep-it-oral"
 * path feel safe in the moment. Computed purely from levers + flags so the UI can show
 * exactly why it moved — and pair it with the litigation_pressure caveat. 0–1.
 */
function perceivedLegalShield(state: RunState): number {
  const privilegedSingleTrack =
    state.flags.includes('legal_owns_record') || state.flags.includes('privileged_single_track')
  return clamp01(
    0.55 * state.params.privilege_strength +
      0.30 * (privilegedSingleTrack ? 1 : 0) +
      0.15 * (1 - state.params.original_records_boundary),
  )
}

export function initialRunState(scenario: TabletopScenario): RunState {
  const params = { ...defaultParams() }
  for (const [k, v] of Object.entries(scenario.startLevers) as [LeverKey, number][]) params[k] = v
  return {
    params, init: defaultInitState(), settings: defaultSettings(),
    flags: [], incident: initialIncidentMeters(), retrainCadence: scenario.retrainCadence,
    failureType: scenario.failureType, captureResistance: scenario.captureResistance,
  }
}

export function playPath(scenario: TabletopScenario, choices: Choice[]): RunState {
  return choices.reduce((s, c) => applyChoice(s, c), initialRunState(scenario))
}

export function scorePath(scenario: TabletopScenario, choices: Choice[]): PathScore {
  const state = playPath(scenario, choices)
  const { trajectory } = simulate(state.init, state.params, state.settings)
  const institutional = institutionalMeters(trajectory)
  return {
    choices,
    institutional,
    incident: state.incident,
    outcome: engineForwardOutcome(state),
    legalSafety: perceivedLegalShield(state),
  }
}

export function scoreAllPaths(scenario: TabletopScenario): PathScore[] {
  return enumeratePaths(scenario).map((p) => scorePath(scenario, p))
}

/** The vector of "higher is better" meters used for domination testing. */
function goodVector(p: PathScore): number[] {
  return [
    p.institutional.safe_to_report_score,
    p.institutional.accountability_legitimacy,
    p.institutional.learning_yield,
    1 - p.institutional.private_ordering_gap,
    1 - p.institutional.policy_scaffold_dependency,
    1 - p.institutional.litigation_pressure, // durable exposure axis (two-track path tends to win this)
    p.legalSafety, // short-term perceived shield (oral path wins this) — decoupled on purpose
    p.incident.signal_fidelity,
    p.incident.record_capturability,
    p.incident.regulatory_timeliness,
    p.incident.board_oversight_visibility,
    p.incident.evidentiary_posture,
    p.incident.remediation_completeness,
    // Engine-forward recurrence is the meaningful per-path signal; the incident meter
    // `recurrence_risk` stays a static placeholder until Aftermath, so using it here
    // would make this axis inert. Use the outcome value.
    100 - p.outcome.recurrenceRisk,
  ]
}

function dominates(a: number[], b: number[]): boolean {
  let strictly = false
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i] - 1e-9) return false
    if (a[i] > b[i] + 1e-9) strictly = true
  }
  return strictly
}

export function hasDominantPath(scenario: TabletopScenario): boolean {
  const scored = scoreAllPaths(scenario)
  const vectors = scored.map(goodVector)
  return vectors.some((v, i) => vectors.every((w, j) => i === j || dominates(v, w)))
}
