import { describe, it, expect } from 'vitest'
import { defaultParams, defaultInitState, defaultSettings } from '../registry'
import { simulate } from '../simulate'
import { institutionalScorecard } from '../../lib/institutional'
import { institutionalMeters, runConfig } from './meters'
import { INSTITUTIONAL_METER_KEYS } from './types'

describe('institutional-meter bridge', () => {
  const params = { ...defaultParams(), workflow_protection: 0.7, safe_harbor_non_admission: 0.6 }
  const init = defaultInitState()
  const settings = defaultSettings()
  const { trajectory } = simulate(init, params, settings)

  it('reads all six institutional meters straight from final auxiliaries', () => {
    const m = institutionalMeters(trajectory)
    const aux = trajectory.aux[trajectory.aux.length - 1]
    for (const k of INSTITUTIONAL_METER_KEYS) {
      expect(m[k]).toBe(aux[k])
    }
  })

  it('matches lib institutionalScorecard with no drift (single source of truth)', () => {
    const m = institutionalMeters(trajectory)
    const card = institutionalScorecard(params, trajectory)
    const byId = Object.fromEntries(card.map((c) => [c.id, c.value]))
    // institutionalScorecard displays learning_yield scaled (min(1, raw/2)); all others 1:1.
    expect(byId.safe_to_report_score).toBe(m.safe_to_report_score)
    expect(byId.accountability_legitimacy).toBe(m.accountability_legitimacy)
    expect(byId.litigation_pressure).toBe(m.litigation_pressure)
    expect(byId.private_ordering_gap).toBe(m.private_ordering_gap)
    expect(byId.policy_scaffold_dependency).toBe(m.policy_scaffold_dependency)
    expect(byId.learning_yield).toBe(Math.min(1, m.learning_yield / 2))
  })

  it('runConfig returns traj and institutional that match direct simulation', () => {
    const result = runConfig(params, init, settings)
    expect(result.traj).toBeDefined()
    expect(result.institutional).toBeDefined()
    // Verify institutional meters from runConfig match a direct simulation
    const { trajectory: directTraj } = simulate(init, params, settings)
    const directInstitutional = institutionalMeters(directTraj)
    for (const k of INSTITUTIONAL_METER_KEYS) {
      expect(result.institutional[k]).toBeCloseTo(directInstitutional[k], 10)
    }
  })
})
