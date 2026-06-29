import { describe, it, expect } from 'vitest'
import {
  INCIDENT_METER_KEYS,
  initialIncidentMeters,
  INSTITUTIONAL_METER_KEYS,
  ROLE_KEYS,
} from './types'

describe('tabletop types', () => {
  it('initialIncidentMeters has every key, all in [0,100]', () => {
    const m = initialIncidentMeters()
    for (const k of INCIDENT_METER_KEYS) {
      expect(m[k]).toBeGreaterThanOrEqual(0)
      expect(m[k]).toBeLessThanOrEqual(100)
    }
    expect(Object.keys(m).sort()).toEqual([...INCIDENT_METER_KEYS].sort())
  })

  it('exposes the six institutional meter keys and the role set', () => {
    expect(INSTITUTIONAL_METER_KEYS).toContain('safe_to_report_score')
    expect(INSTITUTIONAL_METER_KEYS).toHaveLength(6)
    expect(ROLE_KEYS).toContain('counsel')
  })
})
