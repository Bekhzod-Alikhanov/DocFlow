/**
 * Scenario persistence (spec §5.6). Scenarios are tiny JSON records, so we use
 * localStorage with versioned, namespaced keys rather than IndexedDB — synchronous,
 * trivially testable, far below the storage cap. All access degrades to an in-memory
 * map if localStorage throws (Safari private mode, quota): persistence is a
 * convenience, never a correctness requirement.
 *
 * Every record stamps `modelVersion` (the engine math version at save time) so a
 * scenario saved under an older model can be surfaced with a non-blocking badge
 * rather than silently misinterpreted. Loaded params always pass `sanitizeParams`,
 * so an out-of-range or renamed key can never poison a simulation.
 */
import { MODEL_VERSION, sanitizeParams, defaultInitState, defaultSettings } from '../engine'
import type { Scenario, Params, State, SimSettings } from '../engine'

export const STORAGE_VERSION = 1
const NS = 'docflow:scenario:'
const INDEX_KEY = 'docflow:scenarios'

export interface StoredScenario {
  storageVersion: number
  /** MODEL_VERSION at save time — engine-math provenance for migration/badging. */
  modelVersion: string
  scenario: Scenario
}

// --- storage shim (localStorage with in-memory fallback) ---

const mem = new Map<string, string>()
function getItem(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return mem.get(k) ?? null
  }
}
function setItem(k: string, v: string): void {
  try {
    localStorage.setItem(k, v)
  } catch {
    mem.set(k, v)
  }
}
function removeItem(k: string): void {
  try {
    localStorage.removeItem(k)
  } catch {
    mem.delete(k)
  }
}

// --- id / time helpers (impure — fine outside the engine) ---

export function newScenarioId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    /* fall through */
  }
  return `s-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

// --- index (ordered list of ids) ---

function readIndex(): string[] {
  const raw = getItem(INDEX_KEY)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}
function writeIndex(ids: string[]): void {
  setItem(INDEX_KEY, JSON.stringify(ids))
}

// --- migration ---

/** Coerce a raw stored blob to the current StoredScenario shape, or throw. */
export function migrate(raw: unknown): StoredScenario {
  if (!raw || typeof raw !== 'object') throw new Error('not a scenario record')
  const rec = raw as Partial<StoredScenario> & { scenario?: unknown }
  // storageVersion 0/undefined → treat the blob itself as the scenario (legacy shape).
  const scenario = (rec.scenario ?? raw) as Scenario
  if (!scenario || typeof scenario !== 'object' || !scenario.params) throw new Error('missing params')
  return {
    storageVersion: STORAGE_VERSION,
    modelVersion: typeof rec.modelVersion === 'string' ? rec.modelVersion : 'unknown',
    scenario: normalizeScenario(scenario),
  }
}

function normalizeScenario(sc: Scenario): Scenario {
  const params: Params = sanitizeParams(sc.params)
  const init: State = { ...defaultInitState(), ...(sc.init ?? {}) }
  const settings: SimSettings = { ...defaultSettings(), ...(sc.settings ?? {}) }
  return {
    id: sc.id ?? newScenarioId(),
    name: sc.name ?? 'Untitled scenario',
    description: sc.description ?? '',
    presetId: sc.presetId ?? null,
    params,
    init,
    settings,
    annotations: sc.annotations ?? '',
    createdAt: sc.createdAt ?? null,
    updatedAt: sc.updatedAt ?? null,
  }
}

// --- CRUD ---

export interface SaveInput {
  id?: string
  name: string
  params: Params
  init: State
  settings: SimSettings
  presetId: string | null
  annotations?: string
  description?: string
}

export function saveScenario(input: SaveInput): Scenario {
  const id = input.id ?? newScenarioId()
  const existing = input.id ? loadScenario(input.id) : null
  const scenario: Scenario = {
    id,
    name: input.name,
    description: input.description ?? existing?.description ?? '',
    presetId: input.presetId,
    params: sanitizeParams(input.params),
    init: { ...input.init },
    settings: { ...input.settings },
    annotations: input.annotations ?? existing?.annotations ?? '',
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  }
  const record: StoredScenario = { storageVersion: STORAGE_VERSION, modelVersion: MODEL_VERSION, scenario }
  setItem(NS + id, JSON.stringify(record))
  const ids = readIndex()
  if (!ids.includes(id)) writeIndex([id, ...ids])
  return scenario
}

/** Full stored record (incl. modelVersion) — use when the UI needs to flag a mismatch. */
export function loadScenarioRecord(id: string): StoredScenario | null {
  const raw = getItem(NS + id)
  if (!raw) return null
  try {
    return migrate(JSON.parse(raw))
  } catch {
    return null
  }
}

export function loadScenario(id: string): Scenario | null {
  return loadScenarioRecord(id)?.scenario ?? null
}

export function listScenarios(): Scenario[] {
  return readIndex()
    .map((id) => loadScenario(id))
    .filter((s): s is Scenario => s !== null)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
}

export function duplicateScenario(id: string): Scenario | null {
  const src = loadScenario(id)
  if (!src) return null
  return saveScenario({
    name: `${src.name} (copy)`,
    params: src.params,
    init: src.init,
    settings: src.settings,
    presetId: src.presetId,
    annotations: src.annotations,
    description: src.description,
  })
}

export function deleteScenario(id: string): void {
  removeItem(NS + id)
  writeIndex(readIndex().filter((x) => x !== id))
}

/** True if a stored scenario was saved under a different engine-math version. */
export function isModelVersionStale(rec: StoredScenario): boolean {
  return rec.modelVersion !== MODEL_VERSION
}

// --- JSON file export / import ---

export function exportScenarioFile(sc: Scenario): void {
  const record: StoredScenario = { storageVersion: STORAGE_VERSION, modelVersion: MODEL_VERSION, scenario: sc }
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `${slug(sc.name)}.docflow.json`)
}

export async function importScenarioFile(file: File): Promise<Scenario> {
  const text = await file.text()
  return migrate(JSON.parse(text)).scenario
}

// --- small DOM helpers (shared by export.ts via re-export) ---

export function slug(name: string): string {
  return (name || 'scenario').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'scenario'
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
