/**
 * Helpers that turn a (sparse) Preset into a complete, validated Scenario / parameter
 * vector. Kept separate from the registry so the registry stays purely declarative.
 */
import type { Preset, Params, State, Scenario, SimSettings } from './types'
import { defaultParams, defaultInitState, defaultSettings, sanitizeParams } from './registry'

/** Full parameter vector for a preset: defaults overlaid with the preset's overrides. */
export function paramsFromPreset(preset: Preset): Params {
  return sanitizeParams({ ...defaultParams(), ...preset.overrides })
}

/** Full initial state for a preset: default init overlaid with the preset's init. */
export function initFromPreset(preset: Preset): State {
  return { ...defaultInitState(), ...(preset.init ?? {}) }
}

/** Build a complete Scenario object from a preset (timestamps left to the caller). */
export function scenarioFromPreset(
  preset: Preset,
  opts: { id: string; settings?: SimSettings },
): Scenario {
  return {
    id: opts.id,
    name: preset.name,
    description: preset.blurb,
    presetId: preset.id,
    params: paramsFromPreset(preset),
    init: initFromPreset(preset),
    settings: opts.settings ?? defaultSettings(),
    annotations: '',
    createdAt: null,
    updatedAt: null,
  }
}

/** A blank scenario at registry defaults. */
export function defaultScenario(id: string): Scenario {
  return {
    id,
    name: 'Untitled scenario',
    description: '',
    presetId: null,
    params: defaultParams(),
    init: defaultInitState(),
    settings: defaultSettings(),
    annotations: '',
    createdAt: null,
    updatedAt: null,
  }
}
