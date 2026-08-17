/**
 * Guards for the composite-index weights (AUDIT.md F8). These weights used to be
 * bare literals inside computeAux; these tests make it impossible to reintroduce
 * an unnamed one or to change a blend without the change being deliberate.
 */
import { describe, it, expect } from 'vitest'
// Vite `?raw` import — keeps this test free of Node type dependencies.
import modelSource from './model.ts?raw'
import modelDoc from '../../docs/MODEL.md?raw'
import { MODEL_VERSION } from './version'
import {
  READOUT_WEIGHT_SPECS,
  READOUT_WEIGHTS_BY_GROUP,
  READOUT_GROUP_LABEL,
  PROTECTION_BUNDLE,
  POLICY_SCAFFOLD,
  ACCOUNTABILITY_LEGITIMACY,
  SAFE_TO_REPORT,
  LITIGATION_PRESSURE,
  PRIVATE_ORDERABLE_LEVERS,
} from './readouts'
import { LEVER_KEYS } from './types'

describe('readout weights: schema', () => {
  it('every weight has complete, non-empty metadata', () => {
    expect(READOUT_WEIGHT_SPECS.length).toBeGreaterThan(25)
    for (const s of READOUT_WEIGHT_SPECS) {
      expect(s.id).toMatch(/^[a-z_]+\.[a-z_]+$/)
      expect(s.label.length).toBeGreaterThan(0)
      expect(s.note.length).toBeGreaterThan(20)
      expect(s.source.length).toBeGreaterThan(0)
      expect(Number.isFinite(s.value)).toBe(true)
      expect(READOUT_GROUP_LABEL[s.group]).toBeDefined()
    }
  })

  it('ids are unique', () => {
    const ids = READOUT_WEIGHT_SPECS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no weight claims an empirical anchor (none is measured)', () => {
    for (const s of READOUT_WEIGHT_SPECS) {
      expect(s.evidence_basis).toBe('illustrative-assumption')
    }
  })

  it('every group is represented in the grouped index', () => {
    for (const s of READOUT_WEIGHT_SPECS) {
      expect(READOUT_WEIGHTS_BY_GROUP[s.group].map((x) => x.id)).toContain(s.id)
    }
  })
})

describe('readout weights: normalisation', () => {
  // The positive weights of each blend sum to 1.00 by construction. That is a
  // structural choice (it makes each readout a 0–1 index), so it is asserted.
  const sum = (o: Record<string, number>, exclude: string[] = []) =>
    Object.entries(o)
      .filter(([k]) => !exclude.includes(k))
      .reduce((a, [, v]) => a + v, 0)

  it('protection bundle sums to 1', () => {
    expect(sum(PROTECTION_BUNDLE)).toBeCloseTo(1, 10)
  })
  it('policy scaffold sums to 1', () => {
    expect(sum(POLICY_SCAFFOLD)).toBeCloseTo(1, 10)
  })
  it('accountability legitimacy sums to 1', () => {
    expect(sum(ACCOUNTABILITY_LEGITIMACY)).toBeCloseTo(1, 10)
  })
  it('safe-to-report positive weights sum to 1 (penalty excluded)', () => {
    expect(sum(SAFE_TO_REPORT, ['discoverability_penalty'])).toBeCloseTo(1, 10)
  })
  it('litigation pressure sums to 1', () => {
    expect(sum(LITIGATION_PRESSURE)).toBeCloseTo(1, 10)
  })

  it('every lever named in a blend is a real lever', () => {
    const levers = new Set<string>(LEVER_KEYS)
    for (const k of PRIVATE_ORDERABLE_LEVERS) expect(levers.has(k)).toBe(true)
    for (const blend of [PROTECTION_BUNDLE, POLICY_SCAFFOLD, ACCOUNTABILITY_LEGITIMACY]) {
      for (const k of Object.keys(blend)) expect(levers.has(k)).toBe(true)
    }
  })
})

describe('doc drift: MODEL.md must track the implementation', () => {
  // MODEL.md calls itself "Source of truth for the math". The audit's central
  // finding (F1) was that the narrative described a causal architecture the
  // equations did not have. These checks make the specific claim of THIS release
  // — that the docs match the code — machine-verifiable rather than aspirational.
  it('documents the v0.3.0 terms that are actually in the model', () => {
    for (const token of [
      'softplus', // relu was replaced
      'exposure_chill', // R1 closure
      'harm_chill',
      'debt_availability', // TD = 0 invariance
      'eps_C', // anti-absorbing kernel
      'culture_target',
    ]) {
      expect(modelDoc, `MODEL.md should document \`${token}\``).toContain(token)
    }
  })

  it('no longer shows equations the code has removed', () => {
    // The old forms, which would now be actively misleading.
    expect(modelDoc).not.toContain('psi * phi_doc * f_doc')
    expect(modelDoc).not.toContain('a_disc * relu(')
    expect(modelDoc).not.toContain('- C) * C * (1 - C)')
  })

  it('states the model version that the engine actually reports', () => {
    expect(modelDoc).toContain(`**${MODEL_VERSION}**`)
  })
})

describe('readout weights: no unnamed constants left behind (V2.1)', () => {
  it('computeAux contains no bare decimal literals in its blend expressions', () => {
    const src: string = modelSource
    const body = src
      .slice(src.indexOf('export function computeAux'), src.indexOf('export function derivativesFromAux'))
      // Strip comments first — spec cross-references like "§2.3" are prose, not weights.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    const literals = body.match(/(?<![\w.])\d+\.\d+(?![\w])/g) ?? []
    expect(literals).toEqual([])
  })
})
