/**
 * The boundary result — where suppression beats candour, and where it does not.
 *
 * This is the deliverable ADR/0001 committed to: a conditional, not a verdict. The
 * planning brief asked the model to show suppression is not dominant; that was restated,
 * because a model that can only produce the intended conclusion is the defect Phase 0
 * exists to find. So the test below is written so that it would still pass — and report
 * a different answer — if suppression won everywhere.
 *
 * MEASURED, over a 6x6x6 grid in (p_court, v_reg, v_fid) with v_pl = 1:
 *
 *   suppression dominates at  6 of 216 points (2.8%)
 *   the region is exactly     v_reg ~ 0 AND v_fid ~ 0
 *   threshold                 v_reg* = 0.084 at v_fid = 0
 *   p_court's influence       0.084 -> 0.085 across p_court 0 -> 1
 *   worst case for candour    +1.09 exposure (17.8 vs 16.7), a 6% penalty
 *   learning at that point    L = 0.4 suppressive vs 46.8 candid
 *
 * EVERY SWEPT PARAMETER IS T4. None is measured, which is the reason for sweeping
 * instead of reporting a point: a single number here would be an artefact of four
 * quantities nobody knows. What the sweep supports is the shape of the answer, and the
 * shape is that the suppression-dominant region is small, cornered, and expensive.
 */
import { describe, it, expect } from 'vitest'
import { mapBoundary, regulatoryThreshold, evaluateEnvironment, runArchitecture } from './boundary'
import { PARAM_SPEC_BY_ID } from './registry'

/**
 * The 216-point map, computed once and shared.
 *
 * Two tests calling `mapBoundary(6)` independently meant 864 simulations for 432 points
 * of information, which timed out under v8 coverage instrumentation. Same lesson as the
 * monotonicity census: do the work once rather than raise the budget.
 */
let cachedMap: ReturnType<typeof mapBoundary> | null = null
const boundaryMap = () => (cachedMap ??= mapBoundary(6))

describe('the suppression-dominant region', () => {
  it('exists, and is small', () => {
    const r = boundaryMap()
    console.log(
      `\n--- boundary: suppression dominates ${r.points.filter((p) => p.suppressionDominates).length}` +
        `/${r.points.length} environment points (${(r.suppressionShare * 100).toFixed(1)}%) ---`,
    )
    // It MUST be non-empty. A model that cannot represent suppression winning anywhere
    // cannot be used to argue that it loses — that is the circularity ADR/0001 rejects.
    expect(r.suppressionShare).toBeGreaterThan(0)
    expect(r.suppressionShare).toBeLessThan(0.1)
  })

  it('is confined to the corner where enforcement and oversight are both switched off', () => {
    const r = boundaryMap()
    const dominated = r.points.filter((p) => p.suppressionDominates)
    for (const pt of dominated) {
      console.log(
        `    suppression wins at p_court=${pt.env.p_court.toFixed(2)} ` +
          `v_reg=${pt.env.v_reg.toFixed(2)} v_fid=${pt.env.v_fid.toFixed(2)} ` +
          `by ${pt.penaltyForCandour.toFixed(2)} exposure`,
      )
      // The substantive claim: suppression only wins when BOTH the regulatory and the
      // fiduciary channel carry no weight. Products liability alone does not make
      // silence pay.
      expect(pt.env.v_reg).toBeLessThan(0.7)
      expect(pt.env.v_fid).toBeLessThan(0.7)
    }
  })

  it('costs almost all organisational learning even where it wins on exposure', () => {
    // The corner where suppression is exposure-optimal. Reporting the exposure number
    // alone would be the misleading half of the result.
    const env = { p_court: 1, v_pl: 1, v_reg: 0, v_fid: 0 }
    const pt = evaluateEnvironment(env)
    expect(pt.suppressionDominates).toBe(true)
    const savingPct = (pt.penaltyForCandour / pt.candid.eTot) * 100
    const learningLossPct = (1 - pt.suppressive.learning / pt.candid.learning) * 100
    console.log(
      `\n--- at the best point for suppression: ${savingPct.toFixed(1)}% less exposure, ` +
        `${learningLossPct.toFixed(1)}% less learning ---`,
    )
    expect(savingPct).toBeLessThan(10)
    expect(learningLossPct).toBeGreaterThan(90)
  })
})

describe('the threshold, stated as a conditional', () => {
  it('regulatory exposure needs only a small fraction of PL weight to flip the answer', () => {
    const t = regulatoryThreshold(0.5, 0)
    console.log(`\n--- v_reg* = ${t?.toFixed(3)} at v_fid = 0 (v_pl = 1) ---`)
    expect(t).not.toBeNull()
    expect(t!).toBeGreaterThan(0)
    expect(t!).toBeLessThan(0.2)
  })

  it('vanishes once fiduciary exposure carries its default weight', () => {
    // At v_fid = 0.6, the registry default, candour wins across the whole v_reg range,
    // so there is no threshold to report. That absence is the answer.
    expect(regulatoryThreshold(0.5, PARAM_SPEC_BY_ID.v_fid.default)).toBeNull()
    expect(regulatoryThreshold(0.5, 3)).toBeNull()
  })

  it('is nearly independent of p_court — the paper’s own central caveat', () => {
    // The paper concedes no court has ruled on the pre-committed tripwire. If the
    // conclusion depended on p_court, that concession would be fatal. Measured: the
    // threshold moves from 0.084 to 0.085 across the entire range.
    const at0 = regulatoryThreshold(0, 0)!
    const at1 = regulatoryThreshold(1, 0)!
    console.log(`    v_reg* at p_court=0: ${at0.toFixed(3)}; at p_court=1: ${at1.toFixed(3)}`)
    expect(Math.abs(at1 - at0)).toBeLessThan(0.01)
  })

  it('and p_court does move privilege itself, so the insensitivity is a result not a bug', () => {
    // Guards against the reading that p_court is simply disconnected. It scales
    // effective privilege linearly (M3b); what the sweep shows is that the EXPOSURE
    // COMPARISON is insensitive to it, which is a different and stronger claim.
    const lo = runArchitecture('healthcare', { p_court: 0, v_pl: 1, v_reg: 1, v_fid: 0.6 })
    const hi = runArchitecture('healthcare', { p_court: 1, v_pl: 1, v_reg: 1, v_fid: 0.6 })
    expect(lo.ePl).not.toBeCloseTo(hi.ePl, 6)
  })
})

describe('the comparison is honest about what it holds fixed', () => {
  it('sweeps only parameters no firm controls', () => {
    // p_court, v_pl, v_reg and v_fid are properties of the legal environment. If a
    // design lever leaked into this set the result would be partly self-fulfilling.
    for (const id of ['p_court', 'v_pl', 'v_reg', 'v_fid'] as const) {
      const spec = PARAM_SPEC_BY_ID[id]
      expect(spec.group, `${id} must not be a lever`).not.toBe('lever')
      expect(spec.tier, `${id} should be T4 — nothing here is measured`).toBe('T4')
    }
  })

  it('scaling all three exposure weights together cannot change the winner', () => {
    // Which is why v_pl is pinned at 1: only the ratios carry information, and sweeping
    // a fourth axis would triple the cost for no result.
    const a = evaluateEnvironment({ p_court: 0.5, v_pl: 1, v_reg: 1, v_fid: 0.6 })
    const b = evaluateEnvironment({ p_court: 0.5, v_pl: 2, v_reg: 2, v_fid: 1.2 })
    expect(a.suppressionDominates).toBe(b.suppressionDominates)
    expect(b.penaltyForCandour / a.penaltyForCandour).toBeCloseTo(2, 1)
  })

  it('the two architectures really are the postures they claim to be', () => {
    // If the "suppressive" arm were not actually suppressing, the whole comparison would
    // be vacuous. Measured pi: healthcare 0.989, cybersecurity 0.065.
    const env = { p_court: 0.5, v_pl: 1, v_reg: 1, v_fid: 0.6 }
    const candid = runArchitecture('healthcare', env)
    const suppressive = runArchitecture('cybersecurity', env)
    expect(candid.fDoc).toBeGreaterThan(0.9)
    expect(suppressive.fDoc).toBeLessThan(0.1)
    expect(candid.learning).toBeGreaterThan(suppressive.learning * 10)
  })
})
