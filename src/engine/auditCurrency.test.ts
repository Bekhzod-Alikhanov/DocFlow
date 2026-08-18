/**
 * The audit table must agree with the code.
 *
 * `AUDIT.md`'s status column has been wrong three times. F8 read ✅ while twenty
 * coefficients were still unregistered. F6, F15 and F18 described work as pending after
 * it had landed. Each time the document said something confident and false about the
 * codebase, which is precisely the F1 defect — documentation describing a model that does
 * not exist — sitting in the one artefact whose entire value is that a hostile reader can
 * trust it.
 *
 * Prose cannot be fully verified by a test. But the specific factual claims a status cell
 * makes usually can be, and those are the ones that rot. This file checks the checkable
 * ones against the engine, so the table cannot drift silently again.
 */
import { describe, it, expect } from 'vitest'
// Vite `?raw` import — keeps this test free of Node type dependencies, preserving the
// engine's no-Node-API invariant (ADR/0010).
import auditDoc from '../../docs/plan/AUDIT.md?raw'
import pkgJson from '../../package.json?raw'
import { PARAM_SPECS } from './registry'
import { MODEL_VERSION } from './version'
import { perceivedDiscoverability } from './model'
import { paramsFromPreset } from './scenario'
import { PRESETS } from './presets'
import { TABLETOP_COEFFICIENT_SPECS } from './tabletop/coefficients'
import { READOUT_WEIGHT_SPECS } from './readouts'

const AUDIT = auditDoc

/** Pull one finding's row out of the status table. */
function row(id: string): string {
  const match = AUDIT.match(new RegExp(`^\\| \\*\\*${id}\\*\\* \\|.*$`, 'm'))
  expect(match, `${id} has no row in the AUDIT.md status table`).toBeTruthy()
  return match![0]
}

describe('the audit status table is current', () => {
  it('declares when it was last re-verified', () => {
    // Without a date, a reader cannot tell whether the column describes this commit.
    expect(AUDIT).toMatch(/re-verified against the code on \d{4}-\d{2}-\d{2}/)
  })

  it('F8 claims closure, and no unregistered constants remain', () => {
    expect(row('F8')).toContain('✅')
    // The claim is checkable: the coefficient registers must be non-empty, and the
    // source-scan gate in coefficients.test.ts must exist to enforce it.
    expect(TABLETOP_COEFFICIENT_SPECS.length).toBeGreaterThan(25)
    expect(READOUT_WEIGHT_SPECS.length).toBeGreaterThan(25)
    for (const c of TABLETOP_COEFFICIENT_SPECS) {
      expect(c.tier).toBe('T4')
      expect(c.whatWouldConstrainIt.length).toBeGreaterThan(30)
    }
  })

  it('F15 claims closure, and no preset sits in the softplus dead zone', () => {
    expect(row('F15')).toContain('✅')
    // The specific number the row asserts.
    expect(row('F15')).toContain('pd ≥ 0.18')
    for (const preset of PRESETS) {
      const pd = perceivedDiscoverability(paramsFromPreset(preset))
      // 0.18, not 0.19: the first version of the F15 row said 0.19, carried over from
      // the pre-mean aggregate, and this gate caught it. Aviation is the floor at 0.185.
      expect(pd, `${preset.id}: pd = ${pd.toFixed(3)} contradicts the F15 row`).toBeGreaterThan(0.18)
    }
  })

  it('F18 claims closure, and the version contract is actually wired', () => {
    expect(row('F18')).toContain('✅')
    expect(row('F18')).toContain('V12.5')
    expect(MODEL_VERSION).toBe('0.3.0')
    // package.json must agree — the half of F18 that stayed broken for all of v0.3.
    expect(JSON.parse(pkgJson).version).toBe(MODEL_VERSION)
  })

  it('F3 stays open while the census says nothing is measured', () => {
    // The reverse direction: a row must not claim closure it has not earned. If T1 or T2
    // ever becomes non-zero this test fails and F3's row must be rewritten.
    expect(row('F3')).toContain('⬜')
    const measured = PARAM_SPECS.filter((p) => p.tier === 'T1' || p.tier === 'T2')
    expect(measured.length, 'something is now measured — update F3').toBe(0)
  })

  it('F4 and F6 stay partial, and point at the findings that superseded them', () => {
    // Both were partly resolved by M3 and both have a named successor. A row claiming
    // full closure here would overstate what the measurements support.
    expect(row('F4')).toContain('🟡')
    expect(row('F4')).toContain('F20')
    expect(row('F6')).toContain('🟡')
    expect(row('F6')).toContain('F21')
  })

  it('every row carries exactly one status marker', () => {
    const ids = [...AUDIT.matchAll(/^\| \*\*(F\d+)\*\* \|/gm)].map((m: RegExpMatchArray) => m[1])
    expect(ids.length).toBeGreaterThanOrEqual(18)
    for (const id of ids) {
      const markers = (row(id).match(/✅|🟡|⬜/g) ?? []).length
      expect(markers, `${id} should carry exactly one status marker, found ${markers}`).toBe(1)
    }
  })

  it('the findings against v0.3 itself are recorded, not just the ones against v0.2', () => {
    // F19, F20 and F21 are defects in the repair work. An audit that only ever finds
    // fault with the previous version is not being run honestly.
    for (const id of ['F19', 'F20', 'F21']) {
      expect(AUDIT, `${id} is missing from AUDIT.md`).toContain(id)
    }
    expect(AUDIT).toContain('4.27%')
    expect(AUDIT).toContain('rank 3 of 8')
  })
})
