/**
 * README.md and the model docs must agree with the code.
 *
 * This is the fourth time in this project that a document confidently described a model
 * that did not exist, and it was the worst instance, because README.md is the first thing
 * anyone sees. Through the whole of v0.3 it advertised "6 stocks · 12 levers" for a model
 * with ten and fifteen, showed a `perceivedDiscoverability` snippet built from three
 * parameters that had been retired, and — in the same table — asserted that "every one of
 * those numbers is produced by the checked-in code".
 *
 * `docs/MODEL.md` was worse still: its stock-equation block was pre-M3 entirely, listing a
 * `dD/dt` that no longer exists and a single lumped `dE/dt` in place of the three opposing
 * gradients that are the whole point of the v0.3 exposure decomposition.
 *
 * The audit calls this defect class F1. `auditCurrency.test.ts` and `findings.test.ts`
 * guard the planning documents and the deliverable; this file guards the two documents a
 * newcomer actually reads first. Structural counts are checked; prose is not, and neither
 * are line-count or bundle-size figures, which is stated in the README itself rather than
 * left for a reader to discover.
 */
import { describe, it, expect } from 'vitest'
// Vite `?raw` imports — no Node APIs, preserving the engine's invariant (ADR/0010).
import readme from '../../README.md?raw'
import modelDoc from '../../docs/MODEL.md?raw'
import tabletopDoc from '../../docs/TABLETOP.md?raw'
import { STOCK_KEYS, LEVER_KEYS } from './types'
// ALL_PARAM_KEYS is exported from the registry, not from types — importing it from the
// wrong module yielded `undefined` and silently broke two assertions at once.
import { PARAM_SPECS, ALL_PARAM_KEYS } from './registry'
import findingsDoc from '../../docs/FINDINGS.md?raw'
import pkgRaw from '../../package.json?raw'
import { privilegeSurvival } from './model'
import { paramsFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'

const pkg = JSON.parse(pkgRaw) as { scripts: Record<string, string> }

/** Parameters retired during v0.3 that no document may present as current. */
const RETIRED = ['privilege_strength', 'w_tl', 'w_workflow', 'w_safe'] as const

/** Stocks removed in M3: D (single record stock) and E (single exposure stock). */
const RETIRED_STOCKS = ['dD/dt', 'd_closeout'] as const

describe('README.md structural counts match the engine', () => {
  it('states the real number of stocks', () => {
    expect(readme).toContain(`**${STOCK_KEYS.length}** stocks`)
  })

  it('states the real number of levers', () => {
    expect(readme).toContain(`**${LEVER_KEYS.length}** levers`)
  })

  it('states the real number of registered parameters', () => {
    expect(readme).toContain(`**${ALL_PARAM_KEYS.length}** registered parameters`)
  })

  it('states the real provenance census, including the two zeros', () => {
    const counts = { T1: 0, T2: 0, T3: 0, T4: 0 }
    for (const p of PARAM_SPECS) counts[p.tier]++
    expect(counts.T1).toBe(0)
    expect(counts.T2).toBe(0)
    // The zeros are the load-bearing part: a reader must not have to dig for the fact
    // that nothing in the model is measured.
    expect(readme).toContain('T1 measured **0**')
    expect(readme).toContain('T2 analog **0**')
    expect(readme).toContain(`T3 structural ${counts.T3}`)
    expect(readme).toContain(`T4 free ${counts.T4}`)
  })

  it('says which of its numbers are machine-checked and which are not', () => {
    // The original table claimed all of them were. Half of them could not be.
    expect(readme).toMatch(/are not machine-checked/)
  })

  it('admits the table was wrong, rather than quietly correcting it', () => {
    // A silently fixed number teaches a reader nothing about how much to trust the rest.
    expect(readme).toMatch(/was wrong for the whole of v0\.3/)
  })
})

describe('no document presents a retired parameter as current', () => {
  const docs: [string, string][] = [
    ['README.md', readme],
    ['docs/MODEL.md', modelDoc],
    ['docs/TABLETOP.md', tabletopDoc],
  ]

  it('the retired names really are gone from the registry', () => {
    // Otherwise the checks below would be guarding against nothing.
    for (const dead of RETIRED) {
      expect(
        (ALL_PARAM_KEYS as readonly string[]).includes(dead),
        `${dead} is still a live parameter — this test's premise is wrong`,
      ).toBe(false)
    }
  })

  for (const [name, text] of docs) {
    it(`${name} does not present a retired parameter as live`, () => {
      for (const dead of RETIRED) {
        // A historical mention is fine and sometimes necessary — what must not survive is
        // a retired name inside an equation or a lever table. Those lines carry an
        // assignment, a multiplication, or a table pipe.
        const offending = text
          .split('\n')
          .filter((line) => line.includes(dead))
          .filter((line) => /[*+]|^\||=/.test(line))
          .filter((line) => !/retired|removed|was |v0\.2|before v0\.3|RETIRED/i.test(line))
        expect(offending, `${name} still uses ${dead} as if it were live:\n${offending.join('\n')}`).toEqual([])
      }
    })
  }

  it('docs/MODEL.md shows the current ten-stock system, not the pre-M3 one', () => {
    // The changelog legitimately records what past versions contained, so only the
    // live sections are checked. A history that erased the old equations would be
    // less useful, not more honest.
    const live = modelDoc.split('## Changelog')[0]
    for (const dead of RETIRED_STOCKS) {
      expect(live, `MODEL.md still lists ${dead} outside the changelog`).not.toContain(dead)
    }
    // Every current stock must appear in the equation block.
    for (const stock of STOCK_KEYS) {
      expect(modelDoc, `MODEL.md has no equation for ${stock}`).toContain(`d${stock}/dt`)
    }
  })

  it('docs/MODEL.md shows exposure as three opposing gradients', () => {
    // The single most important structural claim of v0.3. A lumped dE/dt cannot express
    // it, which is why the stale block was worth treating as a defect.
    expect(modelDoc).toContain('RISES WITH CANDOUR')
    expect(modelDoc).toContain('RISE WITH SUPPRESSION')
    expect(modelDoc).toContain('E_tot = v_pl * E_pl + v_reg * E_reg + v_fid * E_fid')
  })

  it('README.md shows the three-channel discoverability, not the lumped scalar', () => {
    expect(readme).toContain('DiscoverabilitySignals')
    expect(readme).toContain('privilege is an OUTCOME, not a lever')
  })

  it('names no npm script that does not exist', () => {
    // `validate:scenarios` was deleted in v0.3.0 but stayed in three README places,
    // including the CI description and the command table.
    const live = readme
      .split('\n')
      .filter((l) => l.includes('validate:scenarios'))
      .filter((l) => !/was removed|only re-ran/.test(l))
    expect(live, `README still advertises validate:scenarios:\n${live.join('\n')}`).toEqual([])
  })
})

/**
 * Added with the v0.3.0 README rewrite.
 *
 * The rewrite briefly shipped alongside a SECOND README test file, because I did not
 * check whether one already existed — duplicating a gate is its own small failure, and
 * these are the assertions worth keeping from it.
 */
describe('README result claims match the engine', () => {
  it('quotes privilege survival correctly for the two named architectures', () => {
    const health = privilegeSurvival(paramsFromPreset(PRESET_BY_ID.healthcare)).pi
    const cyber = privilegeSurvival(paramsFromPreset(PRESET_BY_ID.cybersecurity)).pi
    expect(readme).toContain(`π = ${health.toFixed(3)}`)
    expect(readme).toContain(`π = ${cyber.toFixed(3)}`)
  })

  it('quotes the boundary headline consistently with FINDINGS.md', () => {
    // The README summarises; FINDINGS.md is the source. They must not disagree.
    for (const claim of ['6 of 216 points', '2.8%', '0.084 to 0.085', '99.2%']) {
      expect(readme, `README boundary claim ${claim} missing`).toContain(claim)
      expect(findingsDoc, `FINDINGS.md and README disagree on ${claim}`).toContain(claim)
    }
  })

  it('puts the "nothing is measured" statement in the first screenful', () => {
    // A reader who stops after the badges must still have been told.
    const head = readme.slice(0, 2000)
    expect(head).toMatch(/Nothing in this model is measured/)
    expect(head).toMatch(/measured%20parameters-0/)
  })

  it('promises no prediction, and says it is not legal advice', () => {
    expect(readme).toMatch(/no output here is a prediction/i)
    expect(readme).toMatch(/not legal advice/i)
  })

  it('links only to documents that exist', () => {
    const links = [...readme.matchAll(/\]\((docs\/[^)#]+)/g)].map((m) => m[1])
    expect(links.length).toBeGreaterThan(8)
    const known = new Set(
      Object.keys(import.meta.glob('../../docs/**/*.{md,svg}')).map((k) => k.replace('../../', '')),
    )
    for (const link of links) {
      // A trailing slash is a directory link, which GitHub renders as a listing. Accept
      // it when the directory contains anything.
      const isDir = link.endsWith('/')
      const hit = isDir
        ? [...known].some((k) => k.startsWith(link))
        : known.has(link)
      expect(hit, `README links to ${link}, which does not exist`).toBe(true)
    }
  })

  it('advertises only npm scripts that exist', () => {
    for (const script of ['coverage', 'typecheck', 'lint', 'build', 'figures', 'worklist']) {
      expect(readme, `README should document npm run ${script}`).toContain(`npm run ${script}`)
      expect(pkg.scripts, `package.json has no ${script} script`).toHaveProperty(script)
    }
  })
})
