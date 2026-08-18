/**
 * The M3 decision gate, finally evaluated.
 *
 * `ROADMAP.md` M3 carried a gate written to be used: *"If V7.1 shows v0.3 is LESS
 * identifiable than v0.2 on shared outputs, cut stocks here. This gate exists to be
 * used, not admired."* It went unevaluated because the comparison needs the v0.2 engine,
 * and v0.2 had no identifiability module to run.
 *
 * It has now been run. The v0.2 engine was extracted from commit `ae7475f` (the last
 * commit before v0.3 work began), the v0.3 identifiability module was ported onto it
 * unchanged except for its output vector — v0.2 has six stocks (`U, D, TD, L, E, C`)
 * against v0.3's ten — and both versions were analysed over the **eleven levers present
 * in both**. `privilege_strength` is excluded: it was retired in M3b when privilege
 * became a computed outcome, so it has no v0.3 counterpart and including it would
 * compare different things.
 *
 * MEASURED:
 *
 *   preset          v0.2 rank    v0.3 rank    v0.2 cond    v0.3 cond    deficient dirs
 *   neutral            7/11        10/11       1.59e+3      3.35e+5         4 -> 1
 *   cybersecurity      7/11        10/11       4.64e+3      3.68e+4         4 -> 1
 *   aviation           5/11         8/11       3.40e+5      5.79e+5         6 -> 3
 *
 * THE GATE DOES NOT FIRE. v0.3 resolves three more independent parameter directions than
 * v0.2 at every preset tested, so the structure added in M1-M3 did not cost
 * identifiability on shared ground. No stocks are cut.
 *
 * THE LESS FLATTERING HALF, which belongs in the same breath: the condition number rose
 * everywhere, by two orders of magnitude at the contested baseline. Part of that is
 * mechanical — retaining more singular values means retaining smaller ones, so the ratio
 * to the largest necessarily grows — but the practical reading stands: v0.3 can
 * distinguish more directions, and the newly distinguishable ones are weakly informative.
 * Reporting the rank improvement without the conditioning would be choosing the
 * favourable statistic.
 */
import { describe, it, expect } from 'vitest'
import { analyseIdentifiability, headlineOutputs } from './identifiability'
import { paramsFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'
import { LEVER_KEYS, type ParamKey } from './types'

/** The eleven levers common to v0.2 and v0.3. */
const SHARED: ParamKey[] = [
  'just_culture',
  'mandatory_reporting',
  'pld_penalty',
  'recipient_enforcer_separation',
  'translation_layer',
  'workflow_protection',
  'original_records_boundary',
  'safe_harbor_non_admission',
  'effective_challenge',
  'near_miss_tier',
  'intermediary_capacity',
]

/**
 * v0.2 figures, recorded from a one-off run against the extracted engine.
 *
 * These are checked-in constants rather than a live computation, because running a
 * second copy of the engine in CI would mean vendoring v0.2 permanently. That is a real
 * limitation and it is the reason the method is documented above in enough detail to
 * reproduce: extract `src/engine` from `ae7475f`, port `symmetricEigen` and
 * `singularValues` into its `linalg.ts`, point `STATE_OUTPUTS` at the v0.2 stocks.
 */
const V02_BASELINE = {
  neutral: { rank: 7, deficient: 4 },
  cybersecurity: { rank: 7, deficient: 4 },
  aviation: { rank: 5, deficient: 6 },
} as const

describe('M3 decision gate — is v0.3 less identifiable than v0.2?', () => {
  for (const [presetId, v02] of Object.entries(V02_BASELINE)) {
    it(`${presetId}: v0.3 resolves at least as many directions as v0.2`, () => {
      const a = analyseIdentifiability(
        paramsFromPreset(PRESET_BY_ID[presetId]),
        SHARED,
        headlineOutputs,
      )
      console.log(
        `    ${presetId.padEnd(14)} v0.2 rank ${v02.rank}/${SHARED.length} -> ` +
          `v0.3 rank ${a.rank}/${SHARED.length}  (cond ${a.conditionNumber.toExponential(2)}, ` +
          `${a.deficient.length} deficient directions, was ${v02.deficient})`,
      )
      // THE GATE. If this ever fails, the roadmap's instruction is to cut stocks, not to
      // relax the assertion.
      expect(
        a.rank,
        `v0.3 resolves FEWER directions than v0.2 at ${presetId} (${a.rank} < ${v02.rank}).\n` +
          `ROADMAP.md M3 says to cut stocks when this happens. Do that, do not edit this test.`,
      ).toBeGreaterThanOrEqual(v02.rank)
    })
  }

  it('reports the conditioning honestly, not only the rank', () => {
    // Rank went up and conditioning got worse. Both are true and the second one is the
    // one a hostile reader will find if it is not stated first.
    const a = analyseIdentifiability(
      paramsFromPreset(PRESET_BY_ID.neutral),
      SHARED,
      headlineOutputs,
    )
    expect(a.rank).toBeGreaterThan(V02_BASELINE.neutral.rank)
    // Worse conditioning than v0.2's 1.59e3 — recorded, not hidden.
    expect(a.conditionNumber).toBeGreaterThan(1.59e3)
  })

  it('names the pair neither version can separate', () => {
    // intermediary_capacity ~ translation_layer is deficient at every preset in BOTH
    // versions. That is a durable property of the model, not an artefact of v0.3.
    for (const presetId of Object.keys(V02_BASELINE)) {
      const a = analyseIdentifiability(
        paramsFromPreset(PRESET_BY_ID[presetId]),
        SHARED,
        headlineOutputs,
      )
      const named = new Set(a.deficient.flatMap((d) => d.members.map((m) => m.key)))
      expect(named.has('intermediary_capacity') && named.has('translation_layer'), presetId).toBe(true)
    }
  })

  it('compares only levers that exist in both versions', () => {
    // Guards the comparison itself. If a v0.3-only lever crept into SHARED the
    // improvement would be partly an artefact of comparing different parameter sets.
    for (const key of SHARED) {
      expect((LEVER_KEYS as readonly string[]).includes(key), `${key} is not a lever`).toBe(true)
    }
    expect(SHARED).not.toContain('precommit')
    expect(SHARED).not.toContain('significant_purpose')
    expect(SHARED).not.toContain('valve_discipline')
    expect(SHARED).not.toContain('kovel_evaluator')
    expect(SHARED.length).toBe(11)
  })
})
