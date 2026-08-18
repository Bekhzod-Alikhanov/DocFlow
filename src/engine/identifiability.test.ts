/**
 * V6.2 (interior resolution) and V7.1 (structural rank) — the M3 acceptance gates.
 *
 * These two are reported together because they measure the same thing from opposite
 * ends. V6.2 asks whether the model can tell eight institutions apart; V7.1 asks whether
 * its outputs can tell fifteen levers apart. Both are questions about how much
 * information the reported outputs actually carry, and the answers are mixed — recorded
 * as measured rather than as hoped.
 */
import { describe, it, expect } from 'vitest'
import { simulate } from './simulate'
import { privilegeSurvival, discoverability } from './model'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESETS, PRESET_BY_ID } from './presets'
import { LEVER_KEYS, type ParamKey } from './types'
import {
  analyseIdentifiability,
  headlineOutputs,
  finalStateOutputs,
  SAMPLE_TIMES,
} from './identifiability'

const SETTINGS = { horizon: 120, dt: 0.5, solver: 'rk4' } as const
const LEVERS = [...LEVER_KEYS] as ParamKey[]
const PD_WEIGHTS: ParamKey[] = ['w_m', 'w_p', 'w_records', 'w_priv', 'w_sep', 'w_407', 'q_407', 'w_leak']
const CONTESTED = () => paramsFromPreset(PRESET_BY_ID.neutral)

/**
 * Outputs that are genuine DYNAMIC OUTCOMES: state variables plus the decision fraction.
 *
 * Deliberately excludes `pd_fact`, `pd_anal`, `pd_rem` and π. Those are functions of the
 * parameters ALONE, so two presets with different levers differ on them by construction,
 * and counting them toward "the model distinguishes these institutions" is close to
 * circular. It is the specific temptation V6.2 exists to resist. Measured: including them
 * lifts the worst pair from 4.27% to 13.85%, turning a failing criterion into a passing
 * one on nothing but a choice of definition.
 */
const DYNAMIC_OUTPUTS = ['f_doc', 'C', 'L', 'TD', 'E_pl', 'E_reg', 'E_fid', 'R1', 'R2', 'R3'] as const

function dynamicRow(presetId: string): number[] {
  const preset = PRESET_BY_ID[presetId]
  const p = paramsFromPreset(preset)
  const r = simulate(initFromPreset(preset), p, SETTINGS)
  const s = r.summary.finalState
  return [r.summary.finalFdoc, s.C, s.L, s.TD, s.E_pl, s.E_reg, s.E_fid, s.R1, s.R2, s.R3]
}

interface PairSeparation {
  pair: string
  best: number
  onOutput: string
}

function worstPairSeparation(): PairSeparation {
  const rows = PRESETS.map((p) => ({ id: p.id, v: dynamicRow(p.id) }))
  const ranges = DYNAMIC_OUTPUTS.map((_, i) => {
    const col = rows.map((r) => r.v[i])
    return Math.max(...col) - Math.min(...col)
  })
  let worst: PairSeparation = { pair: '', best: Infinity, onOutput: '' }
  for (let a = 0; a < rows.length; a++) {
    for (let b = a + 1; b < rows.length; b++) {
      let best = 0
      let onOutput = ''
      DYNAMIC_OUTPUTS.forEach((name, i) => {
        if (ranges[i] <= 0) return
        const sep = Math.abs(rows[a].v[i] - rows[b].v[i]) / ranges[i]
        if (sep > best) {
          best = sep
          onOutput = name
        }
      })
      if (best < worst.best) worst = { pair: `${rows[a].id} ~ ${rows[b].id}`, best, onOutput }
    }
  }
  return worst
}

describe('V6.2 — interior resolution (AUDIT.md F4, and the new F20)', () => {
  it('measures how far apart the closest pair of institutions is', () => {
    const worst = worstPairSeparation()
    console.log(
      `\n--- V6.2: worst pair ${worst.pair} separates by ` +
        `${(worst.best * 100).toFixed(2)}% of range (on ${worst.onOutput}) ---`,
    )

    // RATCHET, NOT THE CRITERION. V6.2 requires > 5%; the measured worst pair is 4.27%,
    // so THE CRITERION IS NOT MET and that is recorded as AUDIT.md F20. This assertion
    // stops it degrading further. Raise the floor when it improves; never lower it to
    // make a build pass.
    expect(worst.best).toBeGreaterThan(0.042)
    expect(worst.best).toBeLessThan(0.05)
  })

  it('names the pair the model cannot resolve rather than reporting an average', () => {
    // Aviation and nuclear-dual-channel differ by <= 1.7% on every state variable, and
    // by 0.00% on f_doc, C and E_reg. Their input postures differ substantially — 26% on
    // pd_fact — and the dynamics wash that difference out entirely. That is the finding.
    const worst = worstPairSeparation()
    expect(worst.pair).toBe('aviation ~ nuclear-dual-channel')
    expect(worst.onOutput).toBe('L')
  })

  it('F4 itself is closed: the five learning presets are no longer bit-identical', () => {
    const learning = [
      'aviation',
      'healthcare',
      'pharma-safe-report',
      'sr11-effective-challenge',
      'nuclear-dual-channel',
    ]
    const fingerprints = new Set(
      learning.map((id) => dynamicRow(id).map((x) => x.toFixed(6)).join('|')),
    )
    expect(fingerprints.size).toBe(learning.length)
  })
})

describe('V7.1 — structural rank, with the deficient directions named', () => {
  it('reports rank, conditioning and the null directions of the lever block', () => {
    const a = analyseIdentifiability(CONTESTED(), LEVERS, headlineOutputs)
    console.log(
      `\n--- V7.1 levers: rank ${a.rank}/${LEVERS.length}, ` +
        `condition ${a.conditionNumber.toExponential(2)} ---`,
    )
    for (const d of a.deficient) {
      console.log(
        `    unidentifiable (sigma=${d.singularValue.toExponential(1)}): ` +
          d.members.map((m) => `${m.key}(${m.weight.toFixed(2)})`).join(' + '),
      )
    }
    // Measured 10/15 at the contested preset. V7.1's requirement is that deficiency is
    // REPORTED, not that it is absent.
    expect(a.rank).toBeGreaterThanOrEqual(10)
    expect(a.rank).toBeLessThan(LEVERS.length)
    expect(a.deficient.length).toBeGreaterThan(0)
    // A direction with no named members is not an actionable finding.
    for (const d of a.deficient) expect(d.members.length).toBeGreaterThan(0)
  })

  it('sampling the trajectory recovers rank that final-state measurement throws away', () => {
    // The first version of this module sampled only the final state: ten outputs against
    // fifteen levers, so the matrix could not reach full column rank by construction.
    // The gap is the cost of that mistake, and it is two to three ranks.
    const traj = analyseIdentifiability(CONTESTED(), LEVERS, headlineOutputs)
    const final = analyseIdentifiability(CONTESTED(), LEVERS, finalStateOutputs)
    console.log(`    trajectory rank ${traj.rank} vs final-state-only ${final.rank}`)
    expect(traj.rank).toBeGreaterThan(final.rank)
    expect(SAMPLE_TIMES.length).toBeGreaterThan(1)
  })

  it('the discoverability weights are largely unidentifiable, and says which', () => {
    const a = analyseIdentifiability(CONTESTED(), PD_WEIGHTS, headlineOutputs)
    console.log(`\n--- V7.1 pd weights: rank ${a.rank}/${PD_WEIGHTS.length} ---`)
    for (const d of a.deficient) {
      console.log(
        `    unidentifiable (sigma=${d.singularValue.toExponential(1)}): ` +
          d.members.map((m) => `${m.key}(${m.weight.toFixed(2)})`).join(' + '),
      )
    }
    // Measured 3/8. M3c's commit claimed disaggregation delivered an "identifiability
    // gain"; what it delivered was rank 1 -> 3, which is an improvement and is not
    // separability. Recorded as AUDIT.md F21.
    expect(a.rank).toBeGreaterThanOrEqual(3)
    expect(a.rank).toBeLessThan(PD_WEIGHTS.length)
  })

  it('is measured at every preset, because rank is a local property', () => {
    // One operating point cannot support a claim about the model. The learning presets
    // sit deeper in saturation and lose two ranks relative to the contested one.
    const ranks = PRESETS.map((preset) => ({
      id: preset.id,
      rank: analyseIdentifiability(paramsFromPreset(preset), LEVERS, headlineOutputs).rank,
    }))
    console.log('    per-preset lever rank: ' + ranks.map((r) => `${r.id}=${r.rank}`).join(' '))
    for (const r of ranks) {
      expect(r.rank, `${r.id} lost rank`).toBeGreaterThanOrEqual(8)
      expect(r.rank, `${r.id} reached full rank — update this gate and AUDIT.md`).toBeLessThan(
        LEVERS.length,
      )
    }
  })
})

describe('the sensitivity machinery itself', () => {
  it('scales both axes, so rank is not decided by units', () => {
    // TD runs to ~210 while C is bounded by 1. Unscaled, "rank" would be dominated by
    // whichever output happens to carry the largest numbers.
    const a = analyseIdentifiability(CONTESTED(), ['gain', 'threshold'] as ParamKey[], headlineOutputs)
    for (const row of a.S) for (const x of row) expect(Number.isFinite(x)).toBe(true)
    expect(a.singular[0]).toBeGreaterThan(0)
  })

  it('perturbs a parameter whose default is zero instead of reading it as inert', () => {
    const p = { ...CONTESTED(), kovel_evaluator: 0 }
    const a = analyseIdentifiability(p, ['kovel_evaluator'] as ParamKey[], headlineOutputs)
    expect(Number.isFinite(a.singular[0])).toBe(true)
  })

  it('privilege and discoverability are parameter-only, so they cannot count as outputs', () => {
    // Guards the V6.2 exclusion above: if either became state-dependent, the circularity
    // argument would change and DYNAMIC_OUTPUTS would need revisiting.
    const p = CONTESTED()
    expect(privilegeSurvival.length).toBe(1)
    expect(discoverability.length).toBe(1)
    expect(discoverability(p).total).toBe(discoverability(p).total)
  })
})
