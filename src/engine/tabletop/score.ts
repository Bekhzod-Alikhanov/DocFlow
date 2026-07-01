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
import { defaultParams, defaultInitState, defaultSettings, clampParam } from '../registry'
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
export function perceivedLegalShield(state: RunState): number {
  // `privileged_single_track` (like `legal_owns_record`) is a choice flag: it is set by
  // the oral-only / counsel-owns-the-record choices as they accumulate onto state.flags,
  // NOT a lever. Either flag lifts the perceived shield by the 0.30 weight below.
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
  // Route each authored start-lever through clampParam so an out-of-range scenario
  // value cannot seed a param outside its registry range and poison downstream meters.
  for (const [k, v] of Object.entries(scenario.startLevers) as [LeverKey, number][]) params[k] = clampParam(k, v)
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

/**
 * The vector of "higher is better" meters used for domination testing. 14 dimensions:
 *   • 5 institutional positives: safe_to_report_score, accountability_legitimacy,
 *     learning_yield, (1 − private_ordering_gap), (1 − policy_scaffold_dependency)
 *   • 1 durable exposure axis: (1 − litigation_pressure) — two-track path tends to win
 *   • 1 short-term perceived shield: legalSafety — oral path wins (decoupled on purpose)
 *   • 6 incident positives: signal_fidelity, record_capturability, regulatory_timeliness,
 *     board_oversight_visibility, evidentiary_posture, remediation_completeness
 *   • 1 inverted engine-forward recurrence: (100 − outcome.recurrenceRisk)
 * All are oriented so higher = better before domination is tested.
 */
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
    // Engine-forward recurrence is the meaningful per-path signal. The incident meter
    // `recurrence_risk` may be nudged by choices (e.g. full remediation −20, minimal
    // patch +15) but is only revealed at Aftermath; the domination test uses the
    // engine-forward `outcome.recurrenceRisk` instead, which reruns the SD model on the
    // final lever configuration. Use the outcome value.
    100 - p.outcome.recurrenceRisk,
  ]
}

/**
 * `a` dominates `b` iff it is ≥ `b` on every dimension and strictly > on at least one.
 * Equal vectors do NOT dominate. Exported for direct unit testing (a positive control
 * for `hasDominantPath`, which is otherwise only ever asserted false).
 */
export function dominates(a: number[], b: number[]): boolean {
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
