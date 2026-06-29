/**
 * Pure type system for the Tabletop incident simulation. Imports only the engine.
 * No React, DOM, storage, or clock access (see plan Global Constraints).
 */
import type { LeverKey } from '../types'

export type Chapter = 1 | 2 | 3 | 4

export const ROLE_KEYS = ['safety_eng', 'counsel', 'policy', 'exec', 'board', 'regulator'] as const
export type Role = (typeof ROLE_KEYS)[number]

/** Ch.4 failure taxonomy and capture-resistance (how recordable the evidence is). */
export type FailureType = 'security' | 'misuse' | 'malfunction'
export type CaptureResistance = 'silent' | 'irreproducible' | 'distributional' | 'environment_dependent'

/** The six institutional meters — engine auxiliaries, never re-scored here. */
export const INSTITUTIONAL_METER_KEYS = [
  'safe_to_report_score',
  'accountability_legitimacy',
  'learning_yield',
  'litigation_pressure',
  'private_ordering_gap',
  'policy_scaffold_dependency',
] as const
export type InstitutionalMeterKey = (typeof INSTITUTIONAL_METER_KEYS)[number]

/** The new incident meters — directional 0–100 indices, each chapter-tagged. */
export const INCIDENT_METER_KEYS = [
  'signal_fidelity', // Ch.2
  'record_capturability', // Ch.4
  'regulatory_timeliness', // Ch.1/3
  'board_oversight_visibility', // Ch.2
  'evidentiary_posture', // Ch.1 (higher = more defensible objective record)
  'remediation_completeness', // Ch.4
  'recurrence_risk', // Ch.4 (hidden until Aftermath)
] as const
export type IncidentMeterKey = (typeof INCIDENT_METER_KEYS)[number]
export type IncidentMeters = Record<IncidentMeterKey, number>

/** Baseline at scenario start: signal intact, nothing captured/remediated yet. */
export function initialIncidentMeters(): IncidentMeters {
  return {
    signal_fidelity: 100,
    record_capturability: 50,
    regulatory_timeliness: 50,
    board_oversight_visibility: 0,
    evidentiary_posture: 50,
    remediation_completeness: 0,
    recurrence_risk: 50,
  }
}

export interface SourceRef {
  /** Citation text, e.g. "PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26". */
  text: string
  /** Verbatim reliability caveat to surface in-app, when applicable. */
  caveat?: string
}

export type AnalogId = string // matches REGIME_MATRIX ids: 'asrs-asap' | 'psqia' | ...

export type NodeId = string

export interface ConditionalNext {
  /** Choose the next node by a flag the run has accumulated. */
  ifFlag: string
  then: NodeId
  else: NodeId
}

export interface Choice {
  id: string
  label: string
  role: Role
  chapter: Chapter
  rationale: string
  leverDeltas: Partial<Record<LeverKey, number>>
  incidentEffects: Partial<IncidentMeters>
  flags: string[]
  analogRefs: AnalogId[]
  citations: SourceRef[]
  next: NodeId | ConditionalNext
}

export interface ScenarioNode {
  id: NodeId
  phase: number
  chapter: Chapter
  title: string
  /** Situation text shown to the player. */
  situation: string
  choices: Choice[]
  /** True only for the terminal Aftermath node (no choices; runs the engine forward). */
  terminal?: boolean
}

export interface TabletopScenario {
  id: string
  name: string
  blurb: string
  failureType: FailureType
  captureResistance: CaptureResistance
  /** 0–1; raises normalization-of-deviance and lowers capturability over time. */
  retrainCadence: number
  /** Levers the scenario starts from (sparse overrides on engine defaults). */
  startLevers: Partial<Record<LeverKey, number>>
  startNodeId: NodeId
  nodes: ScenarioNode[]
  chapters: Chapter[]
}
