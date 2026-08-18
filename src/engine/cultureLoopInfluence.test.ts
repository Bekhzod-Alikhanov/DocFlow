/**
 * V1.3b — the culture loop is not just present, it is measured for INFLUENCE.
 *
 * AUDIT.md F1 found that `dC/dt` was autonomous: the debt → harm → exposure → culture
 * loop described in MODEL.md did not exist in the code. M2 closed it, and V1.3 gates
 * the fix by checking that the Jacobian's culture row is no longer zero.
 *
 * That gate is too weak, and this file exists because measuring the loop rather than
 * asserting it turned up the fact that it is INERT AT EVERY SHIPPED PRESET.
 *
 * The mechanism works. Scaling `psi_E` and `psi_H` does move the raw culture target,
 * and past roughly 35× it flips the aviation preset out of the learning attractor
 * entirely. But at 1× the raw target sits at 3.4 against a valid range of [0,1] in the
 * five learning presets, and at −0.2 in the three chilling ones. Every preset is
 * saturated against a bound, so a 10× change in exposure chill moves the final culture
 * by exactly zero in five of eight presets and by ~1e-6 in the rest.
 *
 * This is the same defect class as F1 one level up: F1 was a loop that did not exist,
 * this is a loop that exists and does nothing. It is recorded as AUDIT.md F19 rather
 * than fixed, because the fix would mean re-scaling coefficients until the loop became
 * visible — tuning a free parameter to produce a qualitative behaviour, which is the
 * thing `V11.1` exists to forbid. RISKS.md R4 is explicit that whatever the corrected
 * model does is the finding.
 *
 * WHAT IT COSTS: no DocFlow output currently demonstrates exposure feeding back into
 * documentation culture. Any such claim rests on the structure being present, not on
 * observed behaviour at any shipped operating point.
 */
import { describe, it, expect } from 'vitest'
import { integrate } from './simulate'
import { computeAux } from './model'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESETS, PRESET_BY_ID } from './presets'
import type { Params } from './types'

const SETTINGS = { horizon: 240, dt: 0.25, solver: 'rk4' } as const

function finalCulture(p: Params, presetId: string): number {
  const init = initFromPreset(PRESET_BY_ID[presetId])
  const states = integrate(init, p, SETTINGS).states
  return states[states.length - 1].C
}

function chillScaled(presetId: string, mult: number): Params {
  const base = paramsFromPreset(PRESET_BY_ID[presetId])
  return { ...base, psi_E: base.psi_E * mult, psi_H: base.psi_H * mult }
}

describe('the culture loop is wired correctly and CAN change the outcome', () => {
  it('a large enough exposure chill flips aviation out of the learning attractor', () => {
    // Proves the mechanism is real. Without this, the inertness measured below could
    // equally be a dead wire, and the two have completely different remedies.
    const at1 = finalCulture(chillScaled('aviation', 1), 'aviation')
    const at80 = finalCulture(chillScaled('aviation', 80), 'aviation')
    expect(at1).toBeGreaterThan(0.9)
    expect(at80).toBeLessThan(0.1)
  })

  it('the tipping point sits between 30x and 50x the shipped chill', () => {
    // Measured: x33 -> 0.99991, x36 -> 0.8258, x40 -> 0.5342, x50 -> 0.00053.
    expect(finalCulture(chillScaled('aviation', 30), 'aviation')).toBeGreaterThan(0.9)
    expect(finalCulture(chillScaled('aviation', 50), 'aviation')).toBeLessThan(0.1)
  })
})

describe('V1.3b — but the loop has no influence at any shipped preset (AUDIT.md F19)', () => {
  it('scaling the chill tenfold barely moves the outcome anywhere', () => {
    const report: string[] = []
    let worstSensitivity = 0
    for (const preset of PRESETS) {
      const c1 = finalCulture(chillScaled(preset.id, 1), preset.id)
      const c10 = finalCulture(chillScaled(preset.id, 10), preset.id)
      const sensitivity = Math.abs(c10 - c1)
      worstSensitivity = Math.max(worstSensitivity, sensitivity)
      report.push(`${preset.id}: ${sensitivity.toExponential(2)}`)
    }
    // This asserts the DEFECT, deliberately. If a future change makes the loop live at
    // a shipped preset this test fails, and that failure is good news — it means F19
    // is fixed and both this gate and the AUDIT entry must be rewritten.
    expect(
      worstSensitivity,
      `The culture loop has become live at a shipped preset (max |ΔC| = ${worstSensitivity.toExponential(2)}).\n` +
        `That is an improvement, not a regression: update AUDIT.md F19 and this gate.\n  ${report.join('\n  ')}`,
    ).toBeLessThan(1e-4)
  })

  it('because every preset saturates the culture target against a bound', () => {
    // The cause, measured rather than inferred: the raw target is far outside [0,1].
    for (const preset of PRESETS) {
      const p = paramsFromPreset(preset)
      const init = initFromPreset(preset)
      const s = integrate(init, p, SETTINGS).states.slice(-1)[0]
      const a = computeAux(s, p)
      const raw =
        p.a_jc_c * p.just_culture +
        p.a_sep * p.recipient_enforcer_separation +
        a.safety_wins -
        a.backfire -
        a.exposure_chill -
        a.harm_chill
      const insideInterior = raw > 0.05 && raw < 0.95
      expect(insideInterior, `${preset.id}: raw culture target ${raw.toFixed(3)} is now in the responsive interior — F19 may be fixed`).toBe(false)
    }
  })

  it('the chill terms themselves do respond — the inertness is saturation, not a dead wire', () => {
    const p1 = paramsFromPreset(PRESET_BY_ID.aviation)
    const init = initFromPreset(PRESET_BY_ID.aviation)
    const chillAt = (mult: number) => {
      const p = chillScaled('aviation', mult)
      const s = integrate(init, p, SETTINGS).states.slice(-1)[0]
      const a = computeAux(s, p)
      return a.exposure_chill + a.harm_chill
    }
    // Measured: 0.0727 at 1x, 0.7266 at 10x — a clean tenfold response that the clamp
    // then discards entirely.
    expect(chillAt(10) / chillAt(1)).toBeGreaterThan(9)
    expect(p1.psi_E).toBeGreaterThan(0)
  })
})
