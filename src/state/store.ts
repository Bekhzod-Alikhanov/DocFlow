/**
 * Global UI state (Zustand). Holds the working scenario (params + init + settings),
 * the presentation mode, and the live deterministic simulation. The single run is
 * recomputed synchronously on every change — it is sub-millisecond, so it "feels
 * instant" (spec §7.4). Heavy analyses (Monte Carlo, sensitivity, sweeps) are kept
 * out of here and computed on demand by their views.
 */
import { create } from 'zustand'
import {
  type Params,
  type State as StockState,
  type SimSettings,
  type ParamKey,
  type StockKey,
  type Trajectory,
  type SummaryMetrics,
  simulate,
  defaultParams,
  defaultInitState,
  defaultSettings,
  clampParam,
  PRESET_BY_ID,
  DEFAULT_PRESET_ID,
  paramsFromPreset,
  initFromPreset,
} from '../engine'

export type Mode = 'executive' | 'scientific'

export interface ScenarioMeta {
  id: string
  name: string
  presetId: string | null
}

interface DocFlowState {
  // --- working scenario ---
  params: Params
  init: StockState
  settings: SimSettings
  activePresetId: string | null
  scenarioName: string
  annotations: string

  // --- presentation ---
  mode: Mode
  showMonteCarlo: boolean

  // --- live deterministic run (derived) ---
  trajectory: Trajectory
  summary: SummaryMetrics

  // --- actions ---
  setLever: (id: ParamKey, value: number) => void
  setParam: (id: ParamKey, value: number) => void
  setInitStock: (stock: StockKey, value: number) => void
  setSettings: (partial: Partial<SimSettings>) => void
  loadPreset: (presetId: string) => void
  resetToPreset: () => void
  setMode: (mode: Mode) => void
  toggleMonteCarlo: () => void
  setScenarioName: (name: string) => void
  setAnnotations: (text: string) => void
  /** Replace the whole working scenario (used by import / URL / scenario load). */
  loadScenario: (s: { params: Params; init: StockState; settings: SimSettings; presetId: string | null; name?: string; annotations?: string }) => void
}

function runOf(params: Params, init: StockState, settings: SimSettings) {
  return simulate(init, params, settings)
}

function initialState() {
  const preset = PRESET_BY_ID[DEFAULT_PRESET_ID]
  const params = paramsFromPreset(preset)
  const init = initFromPreset(preset)
  const settings = defaultSettings()
  const { trajectory, summary } = runOf(params, init, settings)
  return { params, init, settings, trajectory, summary, presetId: preset.id, name: preset.name }
}

const seed = initialState()

export const useStore = create<DocFlowState>((set, get) => ({
  params: seed.params,
  init: seed.init,
  settings: seed.settings,
  activePresetId: seed.presetId,
  scenarioName: seed.name,
  annotations: '',
  mode: 'executive',
  showMonteCarlo: false,
  trajectory: seed.trajectory,
  summary: seed.summary,

  setLever: (id, value) => get().setParam(id, value),

  setParam: (id, value) => {
    const params = { ...get().params, [id]: clampParam(id, value) }
    const { init, settings } = get()
    const { trajectory, summary } = runOf(params, init, settings)
    // Editing a parameter detaches from the preset (it is now a custom scenario).
    set({ params, trajectory, summary, activePresetId: null })
  },

  setInitStock: (stock, value) => {
    const init = { ...get().init, [stock]: value }
    const { params, settings } = get()
    set({ init, ...runOf(params, init, settings) })
  },

  setSettings: (partial) => {
    const settings = { ...get().settings, ...partial }
    const { params, init } = get()
    set({ settings, ...runOf(params, init, settings) })
  },

  loadPreset: (presetId) => {
    const preset = PRESET_BY_ID[presetId]
    if (!preset) return
    const params = paramsFromPreset(preset)
    const init = initFromPreset(preset)
    const settings = get().settings
    set({
      params,
      init,
      activePresetId: preset.id,
      scenarioName: preset.name,
      annotations: '',
      ...runOf(params, init, settings),
    })
  },

  resetToPreset: () => {
    const id = get().activePresetId
    if (id) get().loadPreset(id)
  },

  setMode: (mode) => set({ mode }),
  toggleMonteCarlo: () => set((s) => ({ showMonteCarlo: !s.showMonteCarlo })),
  setScenarioName: (scenarioName) => set({ scenarioName }),
  setAnnotations: (annotations) => set({ annotations }),

  loadScenario: (sc) =>
    set({
      params: sc.params,
      init: sc.init,
      settings: sc.settings,
      activePresetId: sc.presetId,
      scenarioName: sc.name ?? get().scenarioName,
      annotations: sc.annotations ?? '',
      ...runOf(sc.params, sc.init, sc.settings),
    }),
}))

/** Reset everything to registry defaults (used by tests / a hard reset). */
export function defaultWorkingScenario() {
  return { params: defaultParams(), init: defaultInitState(), settings: defaultSettings() }
}
