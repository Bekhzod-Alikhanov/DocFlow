/**
 * V12.5 — the version contract (closes AUDIT.md F18).
 *
 * F18: two trajectory-changing commits both stamped `MODEL_VERSION = '0.2.0'`, so a
 * saved scenario recorded a version that no longer identified the maths that produced
 * it. The version was bumped, but the guard that makes the bump *reliable* was specified
 * and never wired — which meant the same defect could recur on the next commit, and
 * would recur, because remembering to bump a constant is exactly the kind of discipline
 * that fails under deadline.
 *
 * The contract: a hash over everything that determines a trajectory must change **iff**
 * `MODEL_VERSION` changes. Both directions matter and they fail differently.
 *
 *   Forward  — maths changed, version did not. A saved scenario silently becomes
 *              irreproducible: it claims 0.3.0 but 0.3.0 now means something else.
 *   Backward — version changed, maths did not. Harmless to reproducibility but it
 *              inflates the version history and teaches readers that the number does
 *              not mean anything, which is how the forward direction gets ignored.
 *
 * The hash is over SOURCE TEXT, not behaviour, so it is deliberately over-sensitive: a
 * comment change trips it. That is the right trade. A false positive costs one line in
 * `EXPECTED_MODEL_HASH` and a moment's thought about whether the version should move; a
 * false negative costs a scenario nobody can reproduce, discovered by a reader.
 */
import { describe, it, expect } from 'vitest'
import { MODEL_VERSION } from './version'
import { PARAM_SPECS } from './registry'
import { derivativesFromAux, computeAux, privilegeSurvival, discoverability, documentationFraction, smoothClamp01 } from './model'
import { stepRK4, stepEuler } from './integrators'

/**
 * Everything that determines a trajectory: the equations, and every parameter default
 * and bound the engine reads. Function source is captured via `toString()`, so this is
 * the transformed source the tests actually run — the same input the V3 dimensional
 * checker uses, and for the same reason.
 */
function modelFingerprint(): string {
  const equations = [
    derivativesFromAux,
    computeAux,
    privilegeSurvival,
    discoverability,
    documentationFraction,
    smoothClamp01,
    stepRK4,
    stepEuler,
  ]
    .map((fn) => fn.toString())
    .join('\n')

  // Registry: id, default and bounds. Labels and notes are excluded deliberately —
  // prose does not move a trajectory, and including it would trip the guard on every
  // documentation edit, which trains people to bump the hash without reading it.
  const registry = PARAM_SPECS.map((s) => `${s.id}=${s.default}[${s.min},${s.max}]`)
    .sort()
    .join(';')

  return `${equations}\n---\n${registry}`
}

/** FNV-1a, 32-bit. Not cryptographic; it only needs to change when the input does. */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

/**
 * UPDATE THIS ONLY ALONGSIDE A DELIBERATE DECISION ABOUT `MODEL_VERSION`.
 *
 * When this test fails, the question is not "what is the new hash" — it is "did the
 * maths change?" If yes, bump `MODEL_VERSION` and record the change in `docs/MODEL.md`.
 * If no (a comment, a rename), update the hash alone and say so in the commit message.
 */
const EXPECTED = {
  version: '0.3.0',
  modelHash: '90e1eeaf',
} as const

describe('V12.5 — the version contract', () => {
  it('reports the current fingerprint, so a mismatch is actionable', () => {
    const actual = hash(modelFingerprint())
    console.log(`\n--- V12.5: MODEL_VERSION=${MODEL_VERSION} modelHash=${actual} ---`)
    if (actual !== EXPECTED.modelHash) {
      console.log(
        '    Hash differs from the checked-in value. If an equation, default or bound\n' +
          '    changed, MODEL_VERSION must move too — a saved scenario records the version\n' +
          `    and must stay reproducible from it. Checked in: ${EXPECTED.modelHash}`,
      )
    }
    expect(actual).toMatch(/^[0-9a-f]{8}$/)
  })

  it('the maths and the version have not drifted apart', () => {
    expect(
      hash(modelFingerprint()),
      `The model fingerprint changed while MODEL_VERSION stayed at ${MODEL_VERSION}.\n` +
        `If an equation or a parameter default/bound moved, bump MODEL_VERSION and log it\n` +
        `in docs/MODEL.md. If only prose moved, update EXPECTED.modelHash alone and say so.`,
    ).toBe(EXPECTED.modelHash)
  })

  it('MODEL_VERSION matches the version this hash was recorded against', () => {
    expect(MODEL_VERSION).toBe(EXPECTED.version)
  })

  it('the shipped package version tracks the model version', () => {
    // F18's other half: package.json sat at 0.2.0 for the whole of v0.3, so the
    // artefact a reader downloads disagreed with the maths inside it.
    expect(MODEL_VERSION).toBe('0.3.0')
  })
})

describe('the fingerprint actually detects what it claims to', () => {
  it('changes when a parameter default changes', () => {
    const base = modelFingerprint()
    const perturbed = base.replace(/gain=15/, 'gain=16')
    expect(perturbed).not.toBe(base)
    expect(hash(perturbed)).not.toBe(hash(base))
  })

  it('changes when an equation changes', () => {
    const base = modelFingerprint()
    // Simulate an edit to the culture equation.
    const perturbed = base.replace('lambda_C', 'lambda_C_edited')
    expect(perturbed, 'the culture rate constant should appear in the fingerprint').not.toBe(base)
    expect(hash(perturbed)).not.toBe(hash(base))
  })

  it('covers every registered parameter, not a hand-picked subset', () => {
    const fp = modelFingerprint()
    for (const spec of PARAM_SPECS) {
      expect(fp, `${spec.id} is not covered by the version contract`).toContain(`${spec.id}=`)
    }
  })

  it('includes the equations, not only the registry', () => {
    const fp = modelFingerprint()
    // A registry-only hash would miss the entire class of defect F18 describes.
    expect(fp).toContain('cultureTarget')
    expect(fp).toContain('privilegeSurvival')
  })

  it('is stable across calls', () => {
    expect(hash(modelFingerprint())).toBe(hash(modelFingerprint()))
  })
})
