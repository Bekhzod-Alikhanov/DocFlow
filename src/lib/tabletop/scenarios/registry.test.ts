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

  it('every QMSR citation uses the correct 2026 effective date (guards against backdating drift)', () => {
    for (const s of TABLETOP_SCENARIOS) {
      for (const node of s.nodes) {
        for (const choice of node.choices) {
          for (const cit of choice.citations) {
            if (/QMSR/i.test(cit.text)) {
              expect(cit.text, `${s.id}/${choice.id}`).toMatch(/2026/)
              expect(cit.text, `${s.id}/${choice.id}`).not.toMatch(/2024/)
            }
          }
        }
      }
    }
  })
})
