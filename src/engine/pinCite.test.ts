/**
 * The pin-cite worklist must be complete and current.
 *
 * A verification worklist that silently omits a claim is worse than none: the reader
 * believes the list is the set of things to check. This caught a real gap when first
 * run — ten parameters cited live authority (`Caremark`, AI Act Art. 73, PLD Art. 9(1),
 * `Kovel`, `Capital One`) while carrying no `citationStatus`, so they would never have
 * appeared on anyone's list.
 */
import { describe, it, expect } from 'vitest'
import worklist from '../../docs/plan/PIN_CITE_WORKLIST.md?raw'
import { PARAM_SPECS } from './registry'

/** Does this source text cite an external legal or academic authority? */
const CITES_AUTHORITY =
  /\b(19|20)\d{2}\b|Art\.|§|U\.S\.C|C\.F\.R|F\.\dd|F\.R\.D|Dir\.|Reg\.|Fed\. R\.|Fed\. Reg\./

describe('every externally-cited parameter is on the worklist', () => {
  it('no parameter cites legal authority without a citationStatus', () => {
    // The gap this test was written for. Academic direction-only references are exempt:
    // they are named in the "not on this list" section with a reason.
    const ACADEMIC = /Sculley|Vaughan|Schwarcz|Shapira|Hansen|R.vik|BUILD_SPEC/
    const missing = PARAM_SPECS.filter(
      (p) => !p.citationStatus && CITES_AUTHORITY.test(p.source) && !ACADEMIC.test(p.source),
    )
    expect(
      missing.map((p) => `${p.id}: ${p.source}`),
      'these cite authority but carry no citationStatus, so they never reach the worklist',
    ).toEqual([])
  })

  it('every flagged parameter appears in the generated document', () => {
    const flagged = PARAM_SPECS.filter((p) => p.citationStatus && p.citationStatus !== 'verified')
    expect(flagged.length).toBeGreaterThan(0)
    for (const p of flagged) {
      expect(worklist, `${p.id} is flagged but missing from the worklist`).toContain(`\`${p.id}\``)
    }
  })

  it('the count in the document matches the registry', () => {
    const flagged = PARAM_SPECS.filter((p) => p.citationStatus && p.citationStatus !== 'verified')
    expect(worklist).toContain(`${flagged.length} of ${PARAM_SPECS.length} parameters`)
  })

  it('the two provision-number citations are prioritised', () => {
    // AI Act Art. 73 and PLD Art. 9(1) are where an error is both most likely and most
    // embarrassing, so they must be in the priority section, not buried.
    const priority = worklist.slice(
      worklist.indexOf('## Priority'),
      worklist.indexOf('## Remaining'),
    )
    expect(priority).toContain('mandatory_reporting')
    expect(priority).toContain('pld_penalty')
  })
})

describe('the worklist is honest about what verification buys', () => {
  it('says a verified citation does not promote a parameter to measured', () => {
    // \s+ not a literal space: the generated markdown wraps, and a regex that assumes
    // one line fails on formatting rather than on substance.
    expect(worklist).toMatch(/does\s+not\s+promote\s+anything\s+to\s+"measured"/)
  })

  it('says why academic references are excluded', () => {
    expect(worklist).toMatch(/support\s+a\s+DIRECTION,\s+never\s+a\s+magnitude/)
  })

  it('asks the reader to check the claim, not just the number', () => {
    // The subtler failure: a citation that resolves but supports something adjacent.
    expect(worklist).toMatch(/says\s+what\s+the\s+model\s+assumes\s+it\s+says/)
  })
})
