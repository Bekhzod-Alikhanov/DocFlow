/**
 * Bridge to the institutional meters. These are engine auxiliaries — we read them
 * from the final step of a trajectory and never re-score them here. The UI formats
 * them via lib/institutional `institutionalScorecard`; meters.test.ts proves the two
 * agree (the learning_yield display scaling aside), so there is no second scoring system.
 */
import type { Params, State, SimSettings, Trajectory } from '../types'
import { simulate } from '../simulate'
import { INSTITUTIONAL_METER_KEYS, type InstitutionalMeterKey } from './types'

export function institutionalMeters(traj: Trajectory): Record<InstitutionalMeterKey, number> {
  const aux = traj.aux[traj.aux.length - 1]
  const out = {} as Record<InstitutionalMeterKey, number>
  for (const k of INSTITUTIONAL_METER_KEYS) out[k] = aux[k]
  return out
}

export function runConfig(params: Params, init: State, settings: SimSettings) {
  const { trajectory } = simulate(init, params, settings)
  return { traj: trajectory, institutional: institutionalMeters(trajectory) }
}
