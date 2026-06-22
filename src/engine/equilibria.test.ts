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
  it('numericalJacobian is 6×6 and finite', () => {
    const J = numericalJacobian({ U: 20, D: 5, TD: 10, L: 30, E: 10, C: 0.4 }, defaultParams())
    expect(J.length).toBe(6)
    J.forEach((row) => {
      expect(row.length).toBe(6)
      row.forEach((v) => expect(Number.isFinite(v)).toBe(true))
    })
  })

  it('Newton converges to a fixed point (residual → 0)', () => {
    const p = paramsFromPreset(PRESET_BY_ID.aviation)
    const eq = findEquilibrium(p, { U: 1, D: 10, TD: 3, L: 25, E: 3, C: 0.95 })
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
    eqs.forEach((e) => expect(e.eigenvalues.length).toBe(6))
  })

  it('cultureEquilibria finds three roots for the bistable baseline', () => {
    expect(cultureEquilibria(paramsFromPreset(PRESET_BY_ID.neutral)).length).toBeGreaterThanOrEqual(3)
  })

  it('the sector presets are MONOSTABLE in their regimes', () => {
    // Cyber → single chilling attractor near the ~5% (an estimate) documentation level.
    const cyber = paramsFromPreset(PRESET_BY_ID.cybersecurity)
    const cyberStable = stableAttractors(cyber)
    expect(cyberStable.length).toBe(1)
    expect(cyberStable[0].C).toBeLessThan(0.3)
    expect(cyberStable[0].fdoc).toBeLessThan(0.1)
    expect(isBistable(cyber)).toBe(false)

    // Aviation & healthcare → single learning attractor.
    for (const id of ['aviation', 'healthcare'] as const) {
      const s = stableAttractors(paramsFromPreset(PRESET_BY_ID[id]))
      expect(s.length).toBe(1)
      expect(s[0].fdoc).toBeGreaterThan(0.7)
    }
  })
})

describe('equilibria: extreme-conditions tests (Sterman, spec §7.1)', () => {
  it('privilege=1, just_culture=1 ⇒ the learning attractor', () => {
    const p = { ...defaultParams(), privilege_strength: 1, just_culture: 1 }
    const s = stableAttractors(p)
    expect(s.length).toBe(1)
    expect(s[0].C).toBeGreaterThan(0.8)
    expect(s[0].fdoc).toBeGreaterThan(0.7)
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
