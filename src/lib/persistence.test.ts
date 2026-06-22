// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveScenario,
  loadScenario,
  loadScenarioRecord,
  listScenarios,
  duplicateScenario,
  deleteScenario,
  migrate,
  isModelVersionStale,
  type SaveInput,
} from './persistence'
import { defaultParams, defaultInitState, defaultSettings, MODEL_VERSION } from '../engine'

function input(name: string): SaveInput {
  return {
    name,
    params: defaultParams(),
    init: defaultInitState(),
    settings: defaultSettings(),
    presetId: null,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('persistence CRUD', () => {
  it('saves, lists, and loads a scenario', () => {
    const saved = saveScenario(input('Alpha'))
    expect(saved.id).toBeTruthy()
    expect(saved.createdAt).toBeTruthy()

    const list = listScenarios()
    expect(list.map((s) => s.name)).toContain('Alpha')

    const loaded = loadScenario(saved.id)
    expect(loaded?.name).toBe('Alpha')
    expect(loaded?.params.just_culture).toBe(defaultParams().just_culture)
  })

  it('updates in place when saving with an existing id (preserves createdAt)', () => {
    const a = saveScenario(input('Beta'))
    const b = saveScenario({ ...input('Beta renamed'), id: a.id })
    expect(b.id).toBe(a.id)
    expect(b.createdAt).toBe(a.createdAt)
    expect(listScenarios().filter((s) => s.id === a.id)).toHaveLength(1)
    expect(loadScenario(a.id)?.name).toBe('Beta renamed')
  })

  it('duplicates a scenario with a new id and (copy) suffix', () => {
    const a = saveScenario(input('Gamma'))
    const dup = duplicateScenario(a.id)
    expect(dup).not.toBeNull()
    expect(dup!.id).not.toBe(a.id)
    expect(dup!.name).toBe('Gamma (copy)')
    expect(listScenarios()).toHaveLength(2)
  })

  it('deletes a scenario', () => {
    const a = saveScenario(input('Delta'))
    deleteScenario(a.id)
    expect(loadScenario(a.id)).toBeNull()
    expect(listScenarios()).toHaveLength(0)
  })
})

describe('migration & versioning', () => {
  it('migrates a legacy bare-scenario blob (no wrapper)', () => {
    const bare = {
      id: 'legacy',
      name: 'Legacy',
      description: '',
      presetId: null,
      params: defaultParams(),
      init: defaultInitState(),
      settings: defaultSettings(),
      annotations: '',
      createdAt: null,
      updatedAt: null,
    }
    const rec = migrate(bare)
    expect(rec.storageVersion).toBe(1)
    expect(rec.modelVersion).toBe('unknown')
    expect(rec.scenario.name).toBe('Legacy')
  })

  it('throws on a blob with no params', () => {
    expect(() => migrate({ foo: 1 })).toThrow()
  })

  it('flags a model-version mismatch', () => {
    const a = saveScenario(input('Epsilon'))
    const rec = loadScenarioRecord(a.id)!
    expect(rec.modelVersion).toBe(MODEL_VERSION)
    expect(isModelVersionStale(rec)).toBe(false)
    expect(isModelVersionStale({ ...rec, modelVersion: '0.0.1-old' })).toBe(true)
  })
})
