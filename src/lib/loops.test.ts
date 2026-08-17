import { describe, it, expect } from 'vitest'
import { loopActivity, dominantLoop } from './loops'
import type { Auxiliaries } from '../engine'

function aux(over: Partial<Auxiliaries>): Auxiliaries {
  const zero: Auxiliaries = {
    perceived_discoverability: 0,
    drive_to_document: 0,
    f_doc: 0,
    incident_inflow: 0,
    to_D: 0,
    to_U: 0,
    translation_layer_efficiency: 0,
    learning_gain: 0,
    remediation: 0,
    d_closeout: 0,
    belated_doc: 0,
    u_to_debt: 0,
    harm_events: 0,
    safety_wins: 0,
    backfire: 0,
    exposure_chill: 0,
    harm_chill: 0,
    near_miss_signal: 0,
    private_ordering_gap: 0,
    accountability_legitimacy: 0,
    safe_to_report_score: 0,
    learning_yield: 0,
    litigation_pressure: 0,
    policy_scaffold_dependency: 0,
  }
  return { ...zero, ...over }
}

describe('loopActivity', () => {
  it('shares sum to ~1 when any loop is active', () => {
    const a = loopActivity(aux({ backfire: 1, safety_wins: 2, harm_events: 1 }))
    expect(a.r1 + a.r2 + a.balancing).toBeCloseTo(1, 6)
  })

  it('is all-zero for a quiescent system', () => {
    const a = loopActivity(aux({}))
    expect(a).toEqual({ r1: 0, r2: 0, balancing: 0 })
  })

  it('picks the dominant loop from the largest flow', () => {
    expect(dominantLoop(loopActivity(aux({ backfire: 5, safety_wins: 1 })))).toBe('r1')
    expect(dominantLoop(loopActivity(aux({ safety_wins: 5, backfire: 1 })))).toBe('r2')
    // v0.3.0: the balancing loop is scored from the share of debt inflow that
    // remediation offsets, not from `harm_events`. harm_events is an unbounded level
    // (~100 in the chilling regime) and using it made B swamp the other two loops
    // exactly where the suppression spiral is strongest.
    expect(dominantLoop(loopActivity(aux({ remediation: 9, u_to_debt: 1, safety_wins: 0.1 })))).toBe('balancing')
  })

  it('a large harm level no longer swamps the reinforcing loops', () => {
    // Chilling attractor shape: huge harm, real suppression pressure, no remediation.
    const a = loopActivity(aux({ harm_events: 100, backfire: 0.2, exposure_chill: 0.25, harm_chill: 0.2 }))
    expect(dominantLoop(a)).toBe('r1')
    expect(a.balancing).toBeLessThan(0.5)
  })

  it('R1 aggregates backfire and both v0.3.0 chill terms', () => {
    // Hold a competing loop fixed so the SHARE can move; with R1 alone active its
    // share is 1.0 regardless of magnitude.
    const only = loopActivity(aux({ backfire: 0.3, safety_wins: 1 }))
    const all = loopActivity(aux({ backfire: 0.3, exposure_chill: 0.3, harm_chill: 0.3, safety_wins: 1 }))
    expect(all.r1).toBeGreaterThan(only.r1)
  })

  it('treats negative flows as zero', () => {
    const a = loopActivity(aux({ backfire: -3, safety_wins: 2 }))
    expect(a.r1).toBe(0)
    expect(a.r2).toBeCloseTo(1, 6)
  })
})
