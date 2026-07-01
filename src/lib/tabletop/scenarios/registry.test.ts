import { describe, it, expect } from 'vitest'
import { TABLETOP_SCENARIOS } from './index'
import { validateScenario } from '../schema'

// `npm run validate:scenarios` runs this file: it makes the docs' promise true by
// validating EVERY scenario registered in TABLETOP_SCENARIOS, so any future scenario
// added to the registry is covered by the command (not just production-incident).
describe('scenario registry', () => {
  it('is non-empty', () => {
    expect(TABLETOP_SCENARIOS.length).toBeGreaterThan(0)
  })

  it('every registered scenario validates against the schema', () => {
    for (const s of TABLETOP_SCENARIOS) {
      expect(validateScenario(s)).toEqual({ ok: true, errors: [] })
    }
  })
})
