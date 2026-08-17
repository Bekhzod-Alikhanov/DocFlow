/**
 * V12 — provenance integrity (docs/plan/VALIDATION.md).
 *
 * This file replaces v0.2's honesty rule, which was VACUOUS: it checked that a
 * parameter tagged `empirical-anchor` carried a citation, but nothing was so
 * tagged, so the loop body never executed and the test passed unconditionally.
 * It would also have passed for `source: 'made up in 2026'`, since the regex only
 * required a 4-digit number.
 *
 * The census below is the real guard. It pins the exact number of parameters in
 * each provenance tier, so promoting anything toward "measured" fails CI until the
 * expected census is updated in the same commit — which forces the promotion to be
 * argued in a diff rather than slipped in.
 */
import { describe, it, expect } from 'vitest'
import { PARAM_SPECS, ALL_PARAM_KEYS } from './registry'
import { PROVENANCE_TIER_LABEL, type ProvenanceTier } from './types'

/**
 * EXPECTED CENSUS — update deliberately, never to make a failing test pass.
 *
 * T1 = 0 is the important number. Nothing in this model is measured in its own
 * domain, and the registry says so rather than implying otherwise.
 */
const EXPECTED: Record<ProvenanceTier, number> = {
  T1: 0,
  T2: 0,
  T3: 13,
  T4: 86,
}

function census(): Record<ProvenanceTier, number> {
  const c: Record<ProvenanceTier, number> = { T1: 0, T2: 0, T3: 0, T4: 0 }
  for (const p of PARAM_SPECS) c[p.tier]++
  return c
}

describe('V12.1 — tier census', () => {
  it('matches the checked-in expected census exactly', () => {
    expect(census()).toEqual(EXPECTED)
  })

  it('covers every parameter', () => {
    const total = Object.values(EXPECTED).reduce((a, b) => a + b, 0)
    expect(total).toBe(ALL_PARAM_KEYS.length)
    expect(PARAM_SPECS.length).toBe(ALL_PARAM_KEYS.length)
  })

  it('reports the census for the record', () => {
    const c = census()
    console.log('\n--- provenance census ---')
    for (const t of ['T1', 'T2', 'T3', 'T4'] as ProvenanceTier[]) {
      console.log(`  ${t} ${PROVENANCE_TIER_LABEL[t].padEnd(18)} ${c[t]}`)
    }
    expect(c.T1).toBe(0)
  })
})

describe('V12.2 — a measured tier requires real backing', () => {
  it('any T1 must carry a citation with a year and a data location', () => {
    // Currently vacuous by census (T1 = 0) — but unlike the v0.2 version, the
    // census test above makes that emptiness itself an asserted fact, so this
    // cannot quietly become the only guard.
    for (const p of PARAM_SPECS.filter((x) => x.tier === 'T1')) {
      expect(p.source).toMatch(/\d{4}/)
      expect(p.source.length).toBeGreaterThan(30)
    }
  })

  it('any T2 must write out the transfer argument', () => {
    for (const p of PARAM_SPECS.filter((x) => x.tier === 'T2')) {
      expect(p.note.length).toBeGreaterThan(60)
      expect(p.source).toMatch(/\d{4}|U\.S\.C|C\.F\.R|Reg\.|Dir\./)
    }
  })
})

describe('V2.3 — every free parameter says what would constrain it', () => {
  it('all T4 parameters carry a non-trivial whatWouldConstrainIt', () => {
    const offenders = PARAM_SPECS.filter(
      (p) => p.tier === 'T4' && (p.whatWouldConstrainIt ?? '').trim().length < 25,
    ).map((p) => p.id)
    expect(offenders).toEqual([])
  })

  it('T3 parameters explain the structural commitment they encode', () => {
    const offenders = PARAM_SPECS.filter(
      (p) => p.tier === 'T3' && (p.whatWouldConstrainIt ?? '').trim().length < 25,
    ).map((p) => p.id)
    expect(offenders).toEqual([])
  })
})

describe('V2.2 / V2.5 — schema completeness', () => {
  it('every parameter has exactly one valid tier', () => {
    for (const p of PARAM_SPECS) {
      expect(['T1', 'T2', 'T3', 'T4']).toContain(p.tier)
    }
  })

  it('citation status, where present, is a known value', () => {
    for (const p of PARAM_SPECS) {
      if (p.citationStatus !== undefined) {
        expect(['verified', 'unverified', 'pin-cite-pending']).toContain(p.citationStatus)
      }
    }
  })

  it('the two known pin-cite gaps are flagged rather than silently trusted', () => {
    // AUDIT.md: the EU AI Act Art. 73 and PLD Arts. 9-10 sources carry inline
    // "[pin-cite to verify]" notes. That flag is now machine-readable.
    for (const id of ['mandatory_reporting', 'pld_penalty'] as const) {
      const p = PARAM_SPECS.find((x) => x.id === id)!
      expect(p.citationStatus).toBe('pin-cite-pending')
    }
  })

  it('no parameter claims empirical-anchor while sitting in a non-measured tier', () => {
    // Catches the specific inconsistency of a strong evidence_basis paired with a
    // weak tier, which would let a number look better than its provenance.
    for (const p of PARAM_SPECS) {
      if (p.evidence_basis === 'empirical-anchor') {
        expect(['T1', 'T2']).toContain(p.tier)
      }
    }
  })
})
