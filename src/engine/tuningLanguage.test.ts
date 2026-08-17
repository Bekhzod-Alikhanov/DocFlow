/**
 * V11.1 — no tuning-to-outcome language (VALIDATION.md, M1 acceptance).
 *
 * A registry note may say what a parameter MEANS, what it is worth, and what evidence
 * would pin it down. It may not say that the number was picked to make the model do
 * something. The distinction matters because those are the two things a hostile reader
 * cannot tell apart from the outside, and the whole provenance system exists so that
 * they can: a coefficient set to reproduce a conclusion cannot then be offered as
 * support for that conclusion. That is `VALIDATION.md`'s circularity test stated at the
 * level of a single number.
 *
 * This lint is deliberately dumb. It matches phrases, not intent, so it will sometimes
 * fire on honest prose — see the negation lesson in `MeterRail.test.tsx`. When it does,
 * the fix is to rewrite the note so that a reader could not have read it the wrong way
 * either. There is no waiver list, on purpose: an exemption mechanism would be used.
 */
import { describe, it, expect } from 'vitest'
import { PARAM_SPECS, PARAM_SPEC_BY_ID, defaultParams } from './registry'
import { findAllEquilibria } from './equilibria'
import { READOUT_WEIGHT_SPECS } from './readouts'

/**
 * The pattern from VALIDATION.md §V11.1, widened by the variants actually found in
 * this repo when the gate was first run. Kept as one exported constant so the
 * documentation and the gate cannot drift apart.
 */
export const TUNING_LANGUAGE =
  /calibrated (for|to)|tuned (so|to|for)|chosen so that|chosen to (produce|give|yield|make)|set to (produce|give|yield|make)|picked (so|to)|so that the model|to make the model|in order to (produce|reproduce)|reverse[- ]engineered/i

interface Claim {
  where: string
  field: string
  text: string
}

function allClaims(): Claim[] {
  const out: Claim[] = []
  for (const p of PARAM_SPECS) {
    out.push({ where: `param ${p.id}`, field: 'note', text: p.note })
    out.push({ where: `param ${p.id}`, field: 'source', text: p.source })
    if (p.whatWouldConstrainIt) {
      out.push({ where: `param ${p.id}`, field: 'whatWouldConstrainIt', text: p.whatWouldConstrainIt })
    }
  }
  for (const w of READOUT_WEIGHT_SPECS) {
    out.push({ where: `readout ${w.id}`, field: 'note', text: w.note })
    out.push({ where: `readout ${w.id}`, field: 'source', text: w.source })
  }
  return out
}

describe('V11.1 — no parameter claims it was tuned to an outcome', () => {
  it('no registry or readout prose matches the tuning-language pattern', () => {
    const hits = allClaims()
      .map((c) => ({ ...c, match: c.text.match(TUNING_LANGUAGE)?.[0] }))
      .filter((c) => c.match)

    const report = hits
      .map((h) => `  ${h.where} [${h.field}] — "${h.match}"\n      ${h.text.slice(0, 160)}`)
      .join('\n')

    expect(
      hits.length,
      hits.length === 0
        ? ''
        : `V11.1 FAILED: ${hits.length} claim(s) assert a parameter was set to produce a behaviour.\n` +
          `A number tuned to a conclusion cannot be evidence for it. Rewrite the note to say\n` +
          `what the parameter means and what would constrain it.\n\n${report}\n`,
    ).toBe(0)
  })

  it('the pattern actually catches the phrasings it claims to', () => {
    // A lint nobody has seen fail is a lint nobody knows works.
    for (const bad of [
      'Calibrated for bistability.',
      'tuned so the system tips at month 30',
      'chosen so that the learning attractor dominates',
      'Set to produce the paper’s result.',
      'reverse-engineered from the preset behaviour',
    ]) {
      expect(TUNING_LANGUAGE.test(bad), `should have flagged: ${bad}`).toBe(true)
    }
    for (const ok of [
      'Steepness of the documentation-fraction sigmoid; higher means a sharper threshold.',
      'Observed sharpness of the transition, e.g. from a firm that crossed it.',
      'Largest weight: pre-committed entry is what most distinguishes surviving claims.',
    ]) {
      expect(TUNING_LANGUAGE.test(ok), `false positive on: ${ok}`).toBe(false)
    }
  })
})

/**
 * The companion gate, and the more important one.
 *
 * A lint that only forbids saying "calibrated for bistability" creates an obvious
 * incentive: delete the sentence. That would leave the model in a strictly worse
 * state than the violation it fixed — the dependence would still exist, and the
 * disclosure would be gone. So the two parameters that govern the culture fold are
 * required to keep disclosing it, and the disclosure is checked against MEASUREMENT
 * rather than taken on trust. If a future change makes bistability robust to `gain`,
 * this test fails and the notes must be rewritten to match the new truth.
 */
describe('the fold-controlling parameters disclose what they control', () => {
  const FOLD_PARAMS = ['gain', 'omega'] as const

  it('each says plainly that no evidence fixes its value', () => {
    for (const id of FOLD_PARAMS) {
      expect(PARAM_SPEC_BY_ID[id].note, `${id} must disclose that its value is unevidenced`)
        .toMatch(/NO EVIDENCE FIXES THIS VALUE/)
    }
  })

  it('each says the two-attractor structure follows from it, not the other way round', () => {
    for (const id of FOLD_PARAMS) {
      expect(PARAM_SPEC_BY_ID[id].note, `${id} must disclose the bistability dependence`)
        .toMatch(/attractor|fold/i)
    }
  })

  it('and the disclosure is TRUE: dropping `gain` collapses the fold', () => {
    // The claim in the note is falsifiable, so falsify it here rather than trusting it.
    const base = defaultParams()
    const atDefault = findAllEquilibria(base).length
    const atLowGain = findAllEquilibria({ ...base, gain: 1 }).length

    // Two attractors plus the saddle between them at the default; a single smoothly
    // varying equilibrium once the sigmoid is too shallow to fold.
    expect(atDefault).toBeGreaterThan(1)
    expect(atLowGain).toBeLessThan(atDefault)
  })
})
