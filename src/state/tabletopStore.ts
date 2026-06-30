// src/state/tabletopStore.ts
/**
 * Run state for the Tabletop surface. Independent of the main store on the per-turn
 * hot path; it writes to scenario A only on the explicit "See this as a system"
 * handoff (loadScenario + setMode('scientific') + setView('tipping')).
 */
import { create } from 'zustand'
import {
  applyChoice, initialRunState, resolveNext, engineForwardOutcome,
  institutionalMeters, scorePath, scoreAllPaths,
  type RunState, type TabletopScenario, type Choice, type InstitutionalMeterKey,
  type AftermathOutcome, type PathScore,
} from '../engine/tabletop'
import { simulate } from '../engine'
import { useStore } from './store'
import { productionIncident } from '../lib/tabletop/scenarios/production-incident'
import { buildDebriefMarkdown, type DebriefArgs } from '../lib/tabletop/debrief'

function instOf(state: RunState): Record<InstitutionalMeterKey, number> {
  return institutionalMeters(simulate(state.init, state.params, state.settings).trajectory)
}

interface TabletopState {
  scenario: TabletopScenario
  runState: RunState
  currentNodeId: string
  history: Choice[]
  institutional: Record<InstitutionalMeterKey, number>
  finished: boolean
  start: (scenario?: TabletopScenario) => void
  choose: (choice: Choice) => void
  reset: () => void
  outcome: () => AftermathOutcome
  debriefArgs: (timestamp: string) => DebriefArgs
  buildDebrief: (timestamp: string) => string
  handoffToSystem: () => void
}

function seed(scenario: TabletopScenario) {
  const runState = initialRunState(scenario)
  return { scenario, runState, currentNodeId: scenario.startNodeId, history: [] as Choice[], institutional: instOf(runState), finished: false }
}

export const useTabletopStore = create<TabletopState>((set, get) => ({
  ...seed(productionIncident),

  start: (scenario = productionIncident) => set(seed(scenario)),

  choose: (choice) => {
    const { runState, scenario, history } = get()
    const nextState = applyChoice(runState, choice)
    const nextId = resolveNext(choice, nextState.flags)
    const node = scenario.nodes.find((n) => n.id === nextId)
    const finished = !node || node.terminal === true || node.choices.length === 0
    set({ runState: nextState, currentNodeId: nextId, history: [...history, choice], institutional: instOf(nextState), finished })
  },

  reset: () => set(seed(productionIncident)),

  outcome: () => engineForwardOutcome(get().runState),

  debriefArgs: (timestamp) => {
    const { scenario, history } = get()
    const played = scorePath(scenario, history)
    // counterfactual = the lowest-recurrence path
    const all = scoreAllPaths(scenario)
    const counterfactual = all.reduce<PathScore | null>((best, p) => (!best || p.outcome.recurrenceRisk < best.outcome.recurrenceRisk ? p : best), null)
    return { scenario, played, counterfactual, timestamp }
  },

  buildDebrief: (timestamp) => buildDebriefMarkdown(get().debriefArgs(timestamp)),

  handoffToSystem: () => {
    const { runState, scenario } = get()
    useStore.getState().loadScenario({
      params: runState.params, init: runState.init, settings: runState.settings,
      presetId: null, name: `Tabletop — ${scenario.name}`,
      annotations: 'Loaded from a Tabletop playthrough. Levers reflect the institutional configuration the player produced.',
    })
    useStore.getState().setMode('scientific')
    useStore.getState().setView('tipping')
  },
}))
