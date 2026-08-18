/**
 * `docs/FINDINGS.md` is the only document an external reader is likely to read, so every
 * number in it is checked here against the engine that produced it.
 *
 * This is the same discipline as `auditCurrency.test.ts` and for a stronger reason. The
 * internal planning documents are read by people who can check the code; FINDINGS.md is
 * read by people who cannot, and who have no way to notice if a figure went stale. A
 * reader-facing claim that nothing verifies is the highest-consequence version of the F1
 * defect this project spent v0.3 removing.
 */
import { describe, it, expect } from 'vitest'
// Vite `?raw` import — keeps this test free of Node type dependencies, preserving the
// engine's no-Node-API invariant (ADR/0010).
import findingsDoc from '../../docs/FINDINGS.md?raw'
import { PARAM_SPECS, ALL_PARAM_KEYS, PARAM_SPEC_BY_ID } from './registry'
import { MODEL_VERSION } from './version'
import { privilegeSurvival } from './model'
import { paramsFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'
import { mapBoundary, regulatoryThreshold, evaluateEnvironment } from './boundary'
import { analyseIdentifiability, headlineOutputs } from './identifiability'
import { LEVER_KEYS, type ParamKey } from './types'

const DOC = findingsDoc

describe('FINDINGS.md — the provenance table is the real census', () => {
  it('states the version it was written against', () => {
    expect(DOC).toContain(MODEL_VERSION)
  })

  it('the parameter count and tier counts are the actual ones', () => {
    const counts = { T1: 0, T2: 0, T3: 0, T4: 0 }
    for (const p of PARAM_SPECS) counts[p.tier]++
    expect(DOC).toContain(`${ALL_PARAM_KEYS.length} registered parameters`)
    // The two that matter: a reader must be told nothing is measured.
    expect(counts.T1).toBe(0)
    expect(counts.T2).toBe(0)
    expect(DOC).toContain(`| ${counts.T3} |`)
    expect(DOC).toContain(`| ${counts.T4} |`)
  })

  it('does not claim any parameter is measured', () => {
    // The one sentence that would be fatal if it drifted.
    expect(DOC).toContain('Nothing in this model is measured')
    expect(PARAM_SPECS.filter((p) => p.tier === 'T1' || p.tier === 'T2')).toEqual([])
  })
})

describe('FINDINGS.md — the boundary result', () => {
  const map = mapBoundary(6)

  it('reports the measured suppression share and grid size', () => {
    const dominated = map.points.filter((p) => p.suppressionDominates).length
    expect(DOC).toContain(`${dominated} of ${map.points.length} points`)
    expect(DOC).toContain(`${(map.suppressionShare * 100).toFixed(1)}%`)
  })

  it('reports the regulatory threshold as measured', () => {
    const t = regulatoryThreshold(0.5, 0)!
    // Stated in the document as a percentage of PL weight.
    expect(DOC).toContain(`${(t * 100).toFixed(1)}%`)
  })

  it('reports the p_court insensitivity with both endpoints', () => {
    const at0 = regulatoryThreshold(0, 0)!
    const at1 = regulatoryThreshold(1, 0)!
    expect(DOC).toContain(`${at0.toFixed(3)} to ${at1.toFixed(3)}`)
  })

  it('reports the exposure saving and learning cost at the best point for suppression', () => {
    const pt = evaluateEnvironment({ p_court: 1, v_pl: 1, v_reg: 0, v_fid: 0 })
    const saving = (pt.penaltyForCandour / pt.candid.eTot) * 100
    const loss = (1 - pt.suppressive.learning / pt.candid.learning) * 100
    expect(DOC).toContain(`${saving.toFixed(1)}%`)
    expect(DOC).toContain(`${loss.toFixed(1)}%`)
    expect(DOC).toContain(`L = ${pt.suppressive.learning.toFixed(1)}`)
  })

  it('names the two architectures with their measured privilege survival', () => {
    const candid = privilegeSurvival(paramsFromPreset(PRESET_BY_ID.healthcare)).pi
    const suppressive = privilegeSurvival(paramsFromPreset(PRESET_BY_ID.cybersecurity)).pi
    expect(DOC).toContain(`π = ${candid.toFixed(3)}`)
    expect(DOC).toContain(`π = ${suppressive.toFixed(3)}`)
  })

  it('says v_fid is permitted to be zero, which the registry must actually allow', () => {
    // The document rests a falsification condition on this.
    expect(PARAM_SPEC_BY_ID.v_fid.min).toBe(0)
    expect(DOC).toContain('permitted to be zero')
  })
})

describe('FINDINGS.md — the identifiability numbers', () => {
  it('reports the lever rank at the contested preset', () => {
    const a = analyseIdentifiability(
      paramsFromPreset(PRESET_BY_ID.neutral),
      [...LEVER_KEYS] as ParamKey[],
      headlineOutputs,
    )
    expect(DOC).toContain(`rank ${a.rank} of ${LEVER_KEYS.length}`)
  })

  it('reports the discoverability-weight rank', () => {
    const pd: ParamKey[] = ['w_m', 'w_p', 'w_records', 'w_priv', 'w_sep', 'w_407', 'q_407', 'w_leak']
    const a = analyseIdentifiability(paramsFromPreset(PRESET_BY_ID.neutral), pd, headlineOutputs)
    expect(DOC).toContain(`rank ${a.rank} of ${pd.length}`)
  })

  it('names the two deficient directions it singles out', () => {
    // If these stopped being deficient, the document would be overstating a limitation —
    // which is the rarer but still real failure mode.
    const a = analyseIdentifiability(
      paramsFromPreset(PRESET_BY_ID.neutral),
      [...LEVER_KEYS] as ParamKey[],
      headlineOutputs,
    )
    const named = a.deficient.flatMap((d) => d.members.map((m) => m.key))
    expect(named).toContain('precommit')
    expect(named).toContain('significant_purpose')
    expect(named).toContain('kovel_evaluator')
    expect(DOC).toContain('kovel_evaluator')
  })
})

describe('FINDINGS.md — states its limits, not only its results', () => {
  it('says what it cannot support, at length', () => {
    const cannot = DOC.slice(DOC.indexOf('**It cannot support:**'))
    expect(cannot.length).toBeGreaterThan(600)
    for (const required of [/point prediction/, /none is measured/, /F19/, /F20/]) {
      expect(cannot, `the limits section should mention ${required}`).toMatch(required)
    }
  })

  it('keeps F3 listed as open', () => {
    expect(DOC).toContain('the one that stays open')
  })

  it('lists the known gaps rather than leaving them to be discovered', () => {
    const gaps = DOC.slice(DOC.indexOf('Known gaps'))
    for (const required of ['No detection stage', 'continuation', 'circular']) {
      expect(gaps, `known gaps should mention ${required}`).toContain(required)
    }
  })

  it('tells the reader where every claim is checked', () => {
    // The table of test files must name files that exist and actually run.
    for (const file of [
      'boundary.test.ts',
      'identifiability.test.ts',
      'cultureLoopInfluence.test.ts',
      'provenance.test.ts',
      'tuningLanguage.test.ts',
      'dimensional.test.ts',
      'versionContract.test.ts',
      'auditCurrency.test.ts',
    ]) {
      expect(DOC).toContain(file)
    }
  })

  it('says it is not legal advice and not a forecast', () => {
    expect(DOC).toMatch(/not legal advice/i)
    expect(DOC).toMatch(/not a (forecast|prediction)/i)
  })
})

/**
 * The adversarial pass, kept as gates.
 *
 * `ROADMAP.md`'s verification section specified reading these documents hostilely and
 * checking that every numeric claim's tier is identifiable quickly. Running it found one
 * real defect — "measured" carrying two incompatible senses in the same document, where
 * the provenance table means "observed in the world" (count zero) and the results text
 * means "obtained by running the model". A reviewer would read that as self-contradiction
 * at best. These pin the fix.
 */
describe('FINDINGS.md survives a hostile read', () => {
  it('separates the two senses of "measured" explicitly', () => {
    expect(DOC).toMatch(/A note on the word "measured"/)
    expect(DOC).toMatch(/Measured against the world/)
    expect(DOC).toMatch(/Measured from the model/)
  })

  it('does not use a strong verb to describe an unmeasured result', () => {
    // "proves", "demonstrates" and "establishes" are defensible only about things the
    // code actually settles. In this document nothing does.
    const overclaim = DOC.match(/\b(proves|establishes|confirms that)\b[^.]{0,80}/gi) ?? []
    expect(overclaim).toEqual([])
  })

  it('states the decision-gate result, including the unflattering half', () => {
    expect(DOC).toMatch(/gate does not fire/i)
    // Rank improved AND conditioning worsened. Reporting only the first would be
    // choosing the favourable statistic.
    expect(DOC).toMatch(/condition number rose/i)
  })

  it('declares the figure’s axis truncation where the figure is shown', () => {
    // Zooming to [0,0.2] is what makes the region visible; undeclared, it flatters.
    const caption = DOC.slice(DOC.indexOf('Figure 1'))
    expect(caption).toMatch(/truncated at 0\.2/)
    expect(caption).toMatch(/one cell in 576/)
  })

  it('says the calibration ceiling is T2, not T1', () => {
    expect(DOC).toMatch(/ceiling is \*\*T2\*\*, not T1/)
  })

  it('reports that building the worklist found missing flags', () => {
    // An honest process note: the tooling found a gap in my own bookkeeping.
    expect(DOC).toMatch(/would never have\s+reached anyone/)
    expect(DOC).toMatch(/15 to 27/)
  })
})
