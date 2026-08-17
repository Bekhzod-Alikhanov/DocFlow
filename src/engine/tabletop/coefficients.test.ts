/**
 * V2.1 for the tabletop engine — zero unregistered constants (AUDIT.md F8).
 *
 * F8 was marked closed once the composite-index weights came out of `computeAux`, and
 * that was wrong: twenty-odd bare literals were still sitting in the tabletop engine,
 * driving the layer a reader touches first. This gate exists so the claim cannot be
 * made again without being true.
 *
 * It scans the SOURCE of the tabletop mechanics for numeric literals rather than
 * checking a list of known ones. A list would need updating by the same person who
 * just added the constant, which is the failure mode it is supposed to prevent.
 */
import { describe, it, expect } from 'vitest'
import * as boundary from './boundary'
import * as capturability from './capturability'
import { TABLETOP_COEFFICIENT_SPECS, TABLETOP_COEFFICIENT_BY_ID } from './coefficients'
import { recordCapturability } from './capturability'
import { tieStrengthFactor, translationLoss, normalizationProbability } from './boundary'
import { defaultParams } from '../registry'

/**
 * Literals that are structural rather than coefficients: array indices, the 0/1 of a
 * probability bound, the 100 of a percentage scale, the 2 of a midpoint. Registering
 * these would bury the real coefficients in noise.
 */
const STRUCTURAL_LITERALS = new Set(['0', '1', '2', '100', '1000'])

function bareLiterals(src: string): string[] {
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  const found = stripped.match(/(?<![\w.])\d+(?:\.\d+)?/g) ?? []
  return found.filter((n) => !STRUCTURAL_LITERALS.has(n))
}

describe('V2.1 — the tabletop mechanics carry no unregistered constants', () => {
  const MODULES: [string, Record<string, unknown>][] = [
    ['boundary', boundary],
    ['capturability', capturability],
  ]

  it('no mechanics function contains a bare numeric coefficient', () => {
    const offenders: string[] = []
    for (const [name, mod] of MODULES) {
      for (const [fnName, fn] of Object.entries(mod)) {
        if (typeof fn !== 'function') continue
        const nums = bareLiterals(fn.toString())
        if (nums.length > 0) offenders.push(`${name}.${fnName}: ${nums.join(', ')}`)
      }
    }
    expect(
      offenders,
      `Unregistered constants found in the tabletop mechanics:\n  ${offenders.join('\n  ')}\n` +
        `Move them to coefficients.ts with a tier and a whatWouldConstrainIt.`,
    ).toEqual([])
  })

  it('the scanner actually detects a bare coefficient (it is not passing vacuously)', () => {
    // Without this, an empty result could mean "clean" or could mean the scanner is
    // broken and reading nothing. The previous F8 closure failed for want of exactly
    // this check.
    const planted = `function bad(p) { return 0.45 + 0.18 * p.x }`
    expect(bareLiterals(planted).sort()).toEqual(['0.18', '0.45'])

    // And it must see through the real toString() of a rewired function.
    expect(tieStrengthFactor.toString().length).toBeGreaterThan(50)
    expect(bareLiterals(tieStrengthFactor.toString())).toEqual([])

    // Structural literals and comments are correctly ignored.
    expect(bareLiterals('const x = arr[0]; const y = 1 - z; // 0.99 in a comment')).toEqual([])
  })

  it('registers a coefficient for every mechanism the engine uses', () => {
    const groups = new Set(TABLETOP_COEFFICIENT_SPECS.map((c) => c.group))
    for (const required of [
      'tie_strength',
      'translation_loss',
      'normalization',
      'boundary_transfer',
      'capturability',
      'perceived_shield',
      'recurrence',
    ]) {
      expect(groups.has(required as never), `no coefficients registered for ${required}`).toBe(true)
    }
  })
})

describe('the register is honest about what these numbers are', () => {
  it('every coefficient carries a tier', () => {
    for (const c of TABLETOP_COEFFICIENT_SPECS) {
      expect(['T1', 'T2', 'T3', 'T4']).toContain(c.tier)
    }
  })

  it('none is tier T1 or T2 — nothing here is measured or analog-estimated', () => {
    // The whole tabletop layer is illustrative. If this ever changes it should be a
    // deliberate act with a citation, not a drift.
    const measured = TABLETOP_COEFFICIENT_SPECS.filter((c) => c.tier === 'T1' || c.tier === 'T2')
    expect(measured.map((c) => c.id)).toEqual([])
  })

  it('every coefficient says what would constrain it', () => {
    for (const c of TABLETOP_COEFFICIENT_SPECS) {
      expect(c.whatWouldConstrainIt.trim().length, `${c.id} needs a real answer`).toBeGreaterThan(30)
    }
  })

  it('ids are unique', () => {
    const ids = TABLETOP_COEFFICIENT_SPECS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(TABLETOP_COEFFICIENT_BY_ID).length).toBe(ids.length)
  })

  it('the recurrence shares sum to one, as the note claims', () => {
    const debt = TABLETOP_COEFFICIENT_BY_ID['recurrence.debt_pressure'].value
    const learn = TABLETOP_COEFFICIENT_BY_ID['recurrence.learning_shortfall'].value
    expect(debt + learn).toBeCloseTo(1, 10)
  })
})

describe('extraction changed no behaviour', () => {
  // Naming a constant must not move a number. These pin the mechanics at values
  // measured from the code BEFORE the extraction.
  const p = defaultParams()

  it('tie strength, translation loss and normalization are unchanged', () => {
    expect(tieStrengthFactor(p, false)).toBeCloseTo(
      0.45 +
        0.18 * p.recipient_enforcer_separation +
        0.14 * p.near_miss_tier +
        0.13 * p.effective_challenge +
        0.1 * p.intermediary_capacity,
      12,
    )
    expect(translationLoss(p, false)).toBeCloseTo(
      0.3 - (0.22 * p.translation_layer + 0.12 * p.original_records_boundary),
      12,
    )
    expect(normalizationProbability(p, 0.5)).toBeCloseTo(
      Math.max(0, 0.15 + 0.55 * 0.5 - 0.35 * p.just_culture - 0.15 * p.near_miss_tier),
      12,
    )
  })

  it('capturability is unchanged across the resistance classes', () => {
    const base = { retrainCadence: 0.5, stateSnapshotted: false, pipelineCaptured: false } as const
    expect(recordCapturability({ ...base, resistance: 'silent' })).toBeCloseTo(30 - 40 * 0.5, 12)
    expect(recordCapturability({ ...base, resistance: 'distributional' })).toBeCloseTo(55 - 40 * 0.5, 12)
    expect(
      recordCapturability({ ...base, resistance: 'silent', stateSnapshotted: true, pipelineCaptured: true }),
    ).toBeCloseTo(30 + 30 + 15, 12)
  })

  it('the resistance ordering — the falsifiable part — holds', () => {
    const at = (resistance: 'silent' | 'irreproducible' | 'environment_dependent' | 'distributional') =>
      recordCapturability({ resistance, retrainCadence: 0, stateSnapshotted: false, pipelineCaptured: false })
    expect(at('silent')).toBeLessThan(at('irreproducible'))
    expect(at('irreproducible')).toBeLessThan(at('environment_dependent'))
    expect(at('environment_dependent')).toBeLessThan(at('distributional'))
  })
})
