/**
 * V3 — dimensional consistency (VALIDATION.md V3.1–V3.4, M1 acceptance).
 *
 * The checker reads the real source of `derivativesFromAux` rather than a table
 * describing it. See the header of `units.ts` for why that distinction is the whole
 * point: a hand-maintained unit table is the same artefact as the MODEL.md that
 * described a feedback loop the code did not contain for three versions.
 */
import { describe, it, expect } from 'vitest'
import { derivativesFromAux } from './model'
import { PARAM_SPEC_BY_ID } from './registry'
import { STOCK_KEYS, AUX_KEYS } from './types'
import {
  STOCK_UNITS,
  TERM_UNITS,
  DECLARED_CONVERSIONS,
  LEVEL_AUXILIARIES,
  DIMENSIONAL_WAIVERS,
  equationSource,
  splitTerms,
  perMonth,
  unitsEqual,
  formatUnit,
  type StockName,
} from './units'

const SRC = derivativesFromAux.toString()

/** The culture equation is a relaxation, not a sum of flows — see CULTURE_WAIVER. */
const ADDITIVE_STOCKS = STOCK_KEYS.filter((k) => k !== 'C') as StockName[]

describe('V3.1 — every stock declares a unit from the closed set', () => {
  it('declares a unit for each stock in STOCK_KEYS', () => {
    for (const k of STOCK_KEYS) {
      expect(STOCK_UNITS[k as StockName], `stock ${k} has no declared unit`).toBeDefined()
    }
  })

  it('declares no unit for a stock that no longer exists', () => {
    for (const k of Object.keys(STOCK_UNITS)) {
      expect((STOCK_KEYS as readonly string[]).includes(k), `${k} is declared but is not a stock`).toBe(true)
    }
  })

  it('gives the three channels the same dimension', () => {
    // Evidentiary status is not a physical dimension (ADR/0002). If R1/R2/R3 had
    // distinct dimensions the rate_13 and rate_23 transfers would read as violations.
    expect(unitsEqual(STOCK_UNITS.R1, STOCK_UNITS.R2)).toBe(true)
    expect(unitsEqual(STOCK_UNITS.R2, STOCK_UNITS.R3)).toBe(true)
  })

  it('gives the three exposure channels the same dimension', () => {
    expect(unitsEqual(STOCK_UNITS.E_pl, STOCK_UNITS.E_reg)).toBe(true)
    expect(unitsEqual(STOCK_UNITS.E_reg, STOCK_UNITS.E_fid)).toBe(true)
  })
})

describe('V3.2 — every additive term in every d·/dt has the unit of that stock per month', () => {
  it('finds an equation in the source for every additive stock', () => {
    for (const stock of ADDITIVE_STOCKS) {
      expect(equationSource(SRC, stock), `no d${stock} assignment found in derivativesFromAux`).toBeTruthy()
    }
  })

  it('has a declared unit for every term actually present in the code', () => {
    const undeclared: string[] = []
    for (const stock of ADDITIVE_STOCKS) {
      const expr = equationSource(SRC, stock)
      if (!expr) continue
      for (const term of splitTerms(expr)) {
        if (!TERM_UNITS[term]) undeclared.push(`d${stock}: ${term}`)
      }
    }
    expect(
      undeclared,
      `Terms present in derivativesFromAux with no declared unit:\n  ${undeclared.join('\n  ')}\n` +
        `Add them to TERM_UNITS in units.ts, with the unit of the PRODUCT.`,
    ).toEqual([])
  })

  it('declares no unit for a term the code no longer contains', () => {
    // The reverse drift: a table that describes a model that has moved on.
    const present = new Set<string>()
    for (const stock of ADDITIVE_STOCKS) {
      const expr = equationSource(SRC, stock)
      if (expr) for (const t of splitTerms(expr)) present.add(t)
    }
    const stale = Object.keys(TERM_UNITS).filter((t) => !present.has(t))
    expect(stale, `TERM_UNITS declares terms not in the code: ${stale.join(', ')}`).toEqual([])
  })

  it('all terms in one equation share a unit, and it is [stock]/month', () => {
    const violations: string[] = []
    for (const stock of ADDITIVE_STOCKS) {
      const expr = equationSource(SRC, stock)
      if (!expr) continue
      const want = perMonth(STOCK_UNITS[stock])
      for (const term of splitTerms(expr)) {
        const got = TERM_UNITS[term]
        if (!got) continue // reported by the previous test
        if (!unitsEqual(got, want)) {
          violations.push(`d${stock}: "${term}" is ${formatUnit(got)}, expected ${formatUnit(want)}`)
        }
      }
    }
    expect(violations, `Dimensional violations:\n  ${violations.join('\n  ')}`).toEqual([])
  })
})

describe('V3.3 — terms crossing a unit boundary name their conversion parameter', () => {
  it('every declared conversion parameter exists in the registry', () => {
    for (const c of DECLARED_CONVERSIONS) {
      expect(PARAM_SPEC_BY_ID[c.param], `conversion parameter ${c.param} is not registered`).toBeTruthy()
    }
  })

  it('every conversion parameter declares a unit matching the crossing it makes', () => {
    for (const c of DECLARED_CONVERSIONS) {
      const spec = PARAM_SPEC_BY_ID[c.param]
      expect(spec.unit, `${c.param} should carry unit ${c.to}/${c.from}`).toBe(`${c.to}/${c.from}`)
    }
  })

  it('the incident→debt conversion is explicit, not implicit at 1', () => {
    // The v0.2 defect: one number subtracted from a stock of incidents and added to a
    // stock of debt. Numerically harmless at unity, dimensionally meaningless, and
    // invisible — which is what made it worth fixing rather than waiving.
    const spec = PARAM_SPEC_BY_ID.c_inc_debt
    expect(spec).toBeTruthy()
    expect(spec.default).toBe(1)
    expect(spec.tier).toBe('T3')
  })

  it('the model source uses the conversion, not a bare reuse of the outflow', () => {
    expect(SRC).toContain('a.u_outflow')
    expect(SRC).toContain('a.u_to_debt')
    // dU must consume the incident-space quantity, dTD the debt-space one.
    expect(equationSource(SRC, 'U')).toContain('a.u_outflow')
    expect(equationSource(SRC, 'TD')).toContain('a.u_to_debt')
    expect(equationSource(SRC, 'U')).not.toContain('a.u_to_debt')
  })
})

describe('V3.4 — levels are not used as flows', () => {
  it('no auxiliary declared as a LEVEL appears as a term in any d·/dt', () => {
    const violations: string[] = []
    for (const stock of ADDITIVE_STOCKS) {
      const expr = equationSource(SRC, stock)
      if (!expr) continue
      for (const term of splitTerms(expr)) {
        for (const level of LEVEL_AUXILIARIES) {
          // A bare `a.harm_events` is a violation; `p.rate * a.harm_events` would be a
          // rate, but the model derives `harm_rate` explicitly instead.
          if (term === `a.${level}`) violations.push(`d${stock}: level "${level}" used as a flow`)
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('harm reaches the equations only through the derived rate', () => {
    // The case that motivated the rule. v0.2 used harm_events as a flow AND
    // trapezoid-integrated it, which is a category error twice over.
    expect(SRC).not.toContain('a.harm_events')
    expect(TERM_UNITS['a.pl_from_harm']).toBeDefined()
  })

  it('every declared level is a real auxiliary', () => {
    for (const level of LEVEL_AUXILIARIES) {
      expect((AUX_KEYS as readonly string[]).includes(level), `${level} is not an auxiliary`).toBe(true)
    }
  })
})

describe('the waivers are stated, not implied', () => {
  it('M1 accepts V3 violations only when written down', () => {
    expect(DIMENSIONAL_WAIVERS.length).toBeGreaterThan(0)
    for (const w of DIMENSIONAL_WAIVERS) {
      // A waiver that does not say what it costs is a waiver nobody can weigh.
      expect(w.why.length, `${w.id} needs a real justification`).toBeGreaterThan(80)
      expect(w.cost.length, `${w.id} must state what is not checked as a result`).toBeGreaterThan(60)
    }
  })

  it('the culture equation is waived explicitly, since the checker skips it', () => {
    const ids = DIMENSIONAL_WAIVERS.map((w) => w.id)
    expect(ids).toContain('culture-equation')
  })
})
