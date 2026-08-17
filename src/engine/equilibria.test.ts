import { describe, it, expect } from 'vitest'
import {
  findEquilibrium,
  findAllEquilibria,
  cultureEquilibria,
  numericalJacobian,
  classifyStability,
  isBistable,
  stableAttractors,
} from './equilibria'
import { defaultParams } from './registry'
import { paramsFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'
import { derivatives } from './model'
import type { State } from './types'

describe('equilibria: Jacobian & Newton', () => {
  it('numericalJacobian is 10×10 and finite', () => {
    const J = numericalJacobian({ U: 20, R1: 5, R2: 0, R3: 0, TD: 10, L: 30, E_pl: 10, E_reg: 0, E_fid: 0, C: 0.4 }, defaultParams())
    expect(J.length).toBe(10)
    J.forEach((row) => {
      expect(row.length).toBe(10)
      row.forEach((v) => expect(Number.isFinite(v)).toBe(true))
    })
  })

  it('Newton converges to a fixed point (residual → 0)', () => {
    const p = paramsFromPreset(PRESET_BY_ID.aviation)
    const eq = findEquilibrium(p, { U: 1, R1: 10, R2: 0, R3: 0, TD: 3, L: 25, E_pl: 3, E_reg: 0, E_fid: 0, C: 0.95 })
    expect(eq.converged).toBe(true)
    expect(eq.residualNorm).toBeLessThan(1e-6)
    // The residual at the found point really is (near) zero.
    const d = derivatives(eq.state, p)
    const resid = Math.hypot(...(Object.values(d) as number[]))
    expect(resid).toBeLessThan(1e-5)
  })

  it('classifyStability reads eigenvalue real parts correctly', () => {
    expect(classifyStability([{ re: -1, im: 0 }, { re: -2, im: 0 }])).toBe('stable')
    expect(classifyStability([{ re: 1, im: 0 }, { re: -2, im: 0 }])).toBe('saddle')
    expect(classifyStability([{ re: 1, im: 0 }, { re: 2, im: 0 }])).toBe('unstable')
    expect(classifyStability([{ re: 0, im: 1 }, { re: 0, im: -1 }])).toBe('marginal')
  })
})

describe('equilibria: BISTABILITY (the signature property, spec §3.2, §9)', () => {
  it('the Contested baseline has two stable attractors + an unstable separatrix', () => {
    const p = paramsFromPreset(PRESET_BY_ID.neutral)
    const eqs = findAllEquilibria(p)
    const stable = eqs.filter((e) => e.stability === 'stable')
    const unstable = eqs.filter((e) => e.stability !== 'stable')

    expect(stable.length).toBeGreaterThanOrEqual(2)
    expect(unstable.length).toBeGreaterThanOrEqual(1)
    expect(isBistable(p)).toBe(true)

    const lowest = stable.reduce((a, b) => (a.C < b.C ? a : b))
    const highest = stable.reduce((a, b) => (a.C > b.C ? a : b))
    // One chilling attractor (low culture, low documentation) ...
    expect(lowest.C).toBeLessThan(0.25)
    expect(lowest.fdoc).toBeLessThan(0.2)
    // ... and one learning attractor (high culture, high documentation).
    expect(highest.C).toBeGreaterThan(0.85)
    expect(highest.fdoc).toBeGreaterThan(0.7)
    // The separatrix sits between them.
    const sep = unstable[0]
    expect(sep.C).toBeGreaterThan(lowest.C)
    expect(sep.C).toBeLessThan(highest.C)
    // Every Jacobian eigenvalue set is finite (6 per equilibrium).
    eqs.forEach((e) => expect(e.eigenvalues.length).toBe(10))
  })

  it('cultureEquilibria finds three roots for the bistable baseline', () => {
    expect(cultureEquilibria(paramsFromPreset(PRESET_BY_ID.neutral)).length).toBeGreaterThanOrEqual(3)
  })

  // v0.3.0: this test previously asserted the cyber preset was MONOSTABLE. Closing
  // the R1 loop (AUDIT.md F1) changed that: with realised exposure and harm feeding
  // back into culture, cyber now carries a learning attractor as well, and settles
  // chilling because of where it STARTS, not because no other attractor exists.
  // That is a substantive finding, not a regression — so the test now asserts the
  // claim that actually matters (where each preset settles) rather than a claim
  // about attractor counts that the corrected model does not support.
  it('the sector presets settle in their declared regimes', () => {
    const cyber = paramsFromPreset(PRESET_BY_ID.cybersecurity)
    const cyberStable = stableAttractors(cyber)
    // The lowest attractor is the chilling one, near the ~5% (an estimate) level.
    expect(cyberStable.length).toBeGreaterThanOrEqual(1)
    expect(cyberStable[0].C).toBeLessThan(0.3)
    expect(cyberStable[0].fdoc).toBeLessThan(0.1)

    // Aviation & healthcare → a learning attractor, reached from their own init.
    for (const id of ['aviation', 'healthcare'] as const) {
      const s = stableAttractors(paramsFromPreset(PRESET_BY_ID[id]))
      expect(s.length).toBeGreaterThanOrEqual(1)
      expect(s[s.length - 1].fdoc).toBeGreaterThan(0.7)
    }
  })

  it('bistability is reported, not assumed: record which presets carry two attractors', () => {
    // Deliberately a CENSUS, not a target. v0.2 tuned omega/psi/gain "for
    // bistability" and then presented it as demonstrated (AUDIT.md §6.1). Here we
    // only assert the count is well-defined and log what the model actually does.
    const census = ['cybersecurity', 'aviation', 'healthcare', 'eu-trap', 'neutral'].map((id) => {
      const p = paramsFromPreset(PRESET_BY_ID[id])
      return `${id}=${stableAttractors(p).length}${isBistable(p) ? ' (bistable)' : ''}`
    })
    console.log(`attractor census: ${census.join(', ')}`)
    for (const id of ['cybersecurity', 'aviation', 'healthcare', 'eu-trap', 'neutral'] as const) {
      expect(stableAttractors(paramsFromPreset(PRESET_BY_ID[id])).length).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('equilibria: extreme-conditions tests (Sterman, spec §7.1)', () => {
  it('privilege=1, just_culture=1 ⇒ the learning attractor', () => {
    const p = { ...defaultParams(), privilege_strength: 1, just_culture: 1 }
    const s = stableAttractors(p)
    expect(s.length).toBeGreaterThanOrEqual(1)
    const highest = s[s.length - 1]
    expect(highest.C).toBeGreaterThan(0.8)
    expect(highest.fdoc).toBeGreaterThan(0.7)
  })

  it('zero privilege & separation, weak just culture ⇒ a chilling attractor exists', () => {
    const p = {
      ...defaultParams(),
      privilege_strength: 0,
      recipient_enforcer_separation: 0,
      just_culture: 0.1,
      translation_layer: 0,
    }
    const low = stableAttractors(p).reduce((a, b) => (a.C < b.C ? a : b))
    expect(low.fdoc).toBeLessThan(0.2)
  })

  it('every equilibrium of every preset is a genuine fixed point', () => {
    for (const id of ['cybersecurity', 'aviation', 'healthcare', 'neutral', 'eu-trap'] as const) {
      const p = paramsFromPreset(PRESET_BY_ID[id])
      for (const eq of findAllEquilibria(p)) {
        const d = derivatives(eq.state as State, p)
        const resid = Math.hypot(...(Object.values(d) as number[]))
        expect(resid).toBeLessThan(1e-2)
      }
    }
  })
})
