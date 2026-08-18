/**
 * Dimensional analysis for the continuous core — VALIDATION.md V3.1–V3.4.
 *
 * The point of this module is narrow and worth stating, because a dimensional
 * checker is easy to build in a way that proves nothing. v0.2 had no units at all,
 * and `AUDIT.md` found real consequences: quantities that were levels being used as
 * flows, and one quantity (`u_to_debt`) that was subtracted from a stock of incidents
 * and added to a stock of technical debt — the same number, two different physical
 * meanings, no stated conversion.
 *
 * The obvious way to check units is to write down a table of what each term ought to
 * be. That is worthless: the table drifts from the code and then reassures you about a
 * model you no longer have. `AUDIT.md` F1 is exactly that failure — documentation that
 * described a feedback loop the code did not contain, for three versions.
 *
 * So this checker reads `derivativesFromAux`'s ACTUAL SOURCE at test time, extracts the
 * additive terms of each `d·/dt`, and requires every term it finds to carry a declared
 * unit. A term added to the code with no declaration fails the gate. A declaration for
 * a term no longer in the code fails the gate. The table cannot silently drift, because
 * the code is the input to the check rather than a parallel description of it.
 */

import type { ParamKey } from './types'

// ---------------------------------------------------------------------------
// V3.1 — the closed set of base dimensions
// ---------------------------------------------------------------------------

/**
 * Base dimensions. Deliberately a closed union: adding a dimension should be a
 * decision someone makes on purpose, not something a new term does by accident.
 *
 * `culture` is absent because culture is a dimensionless index on [0,1]. That is a
 * modelling claim, not an oversight — see `CULTURE_WAIVER`.
 */
export type BaseDimension =
  | 'incident'
  | 'record'
  | 'debt'
  | 'learning'
  | 'exposure'
  | 'harm'
  | 'month'

/** A unit as a map of base dimension to exponent. Absent key means exponent 0. */
export type Unit = Partial<Record<BaseDimension, number>>

export const DIMENSIONLESS: Unit = {}

export function unit(...pairs: [BaseDimension, number][]): Unit {
  const u: Unit = {}
  for (const [d, e] of pairs) if (e !== 0) u[d] = (u[d] ?? 0) + e
  return u
}

/** `x` per month — the unit every term in a `d·/dt` must have. */
export function perMonth(u: Unit): Unit {
  return { ...u, month: (u.month ?? 0) - 1 }
}

export function unitsEqual(a: Unit, b: Unit): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as BaseDimension[])
  for (const k of keys) if ((a[k] ?? 0) !== (b[k] ?? 0)) return false
  return true
}

export function formatUnit(u: Unit): string {
  const entries = Object.entries(u).filter(([, e]) => e !== 0)
  if (entries.length === 0) return 'dimensionless'
  const num = entries.filter(([, e]) => e > 0).map(([d, e]) => (e === 1 ? d : `${d}^${e}`))
  const den = entries.filter(([, e]) => e < 0).map(([d, e]) => (e === -1 ? d : `${d}^${-e}`))
  const n = num.length > 0 ? num.join('·') : '1'
  return den.length > 0 ? `${n}/${den.join('·')}` : n
}

// ---------------------------------------------------------------------------
// V3.1 — stock units
// ---------------------------------------------------------------------------

export const STOCK_UNITS = {
  U: unit(['incident', 1]),
  R1: unit(['record', 1]),
  R2: unit(['record', 1]),
  R3: unit(['record', 1]),
  TD: unit(['debt', 1]),
  L: unit(['learning', 1]),
  E_pl: unit(['exposure', 1]),
  E_reg: unit(['exposure', 1]),
  E_fid: unit(['exposure', 1]),
  C: DIMENSIONLESS,
} as const satisfies Record<string, Unit>

export type StockName = keyof typeof STOCK_UNITS

/**
 * R1, R2 and R3 share the dimension `record` even though their evidentiary status is
 * the whole point of splitting them (ADR/0002). That is correct: evidentiary status is
 * not a physical dimension, and giving each channel its own dimension would make the
 * `rate_13` and `rate_23` transfers between them look like unit violations when they
 * are ordinary flows.
 */
export const CHANNEL_DIMENSION_NOTE = 'record' satisfies BaseDimension

// ---------------------------------------------------------------------------
// V3.2 — the unit of every additive term in every d·/dt
// ---------------------------------------------------------------------------

const INCIDENT_RATE = perMonth(STOCK_UNITS.U)
const RECORD_RATE = perMonth(STOCK_UNITS.R1)
const DEBT_RATE = perMonth(STOCK_UNITS.TD)
const LEARNING_RATE = perMonth(STOCK_UNITS.L)
const EXPOSURE_RATE = perMonth(STOCK_UNITS.E_pl)

/**
 * Declared unit for each additive term, keyed by the term's source text with the
 * leading sign stripped and whitespace normalised.
 *
 * A decay term such as `p.delta_R1 * s.R1` is `record/month` because `delta_R1` is a
 * first-order rate constant with unit `1/month`. Those parameter units live in the
 * registry's `unit` field; this table records the unit of the PRODUCT, which is what
 * V3.2 actually constrains.
 */
export const TERM_UNITS: Record<string, Unit> = {
  // dU — undocumented incidents
  'a.to_U': INCIDENT_RATE,
  'a.belated_doc': INCIDENT_RATE,
  'a.u_outflow': INCIDENT_RATE,

  // dR1 / dR2 / dR3 — the three channels
  'a.to_R1': RECORD_RATE,
  'a.to_R2': RECORD_RATE,
  'a.to_R3': RECORD_RATE,
  'p.delta_R1 * s.R1': RECORD_RATE,
  'p.delta_R2 * s.R2': RECORD_RATE,
  'p.delta_R3 * s.R3': RECORD_RATE,

  // dTD — technical debt
  'a.u_to_debt': DEBT_RATE,
  'p.td_baseline': DEBT_RATE,
  'a.remediation': DEBT_RATE,
  'p.delta_TD * s.TD': DEBT_RATE,

  // dL — durable learning
  'a.learning_gain': LEARNING_RATE,
  'p.delta_L * s.L': LEARNING_RATE,

  // dE_pl / dE_reg / dE_fid — the three exposure gradients
  'a.pl_from_records': EXPOSURE_RATE,
  'a.pl_from_analysis': EXPOSURE_RATE,
  'a.pl_from_admissions': EXPOSURE_RATE,
  'a.pl_from_remediation': EXPOSURE_RATE,
  'a.pl_from_harm': EXPOSURE_RATE,
  'a.reg_from_duty': EXPOSURE_RATE,
  'a.reg_from_pld': EXPOSURE_RATE,
  'a.fid_from_blindness': EXPOSURE_RATE,
  'p.theta_E * s.E_pl': EXPOSURE_RATE,
  'p.theta_E * s.E_reg': EXPOSURE_RATE,
  'p.theta_E * s.E_fid': EXPOSURE_RATE,
}

// ---------------------------------------------------------------------------
// V3.3 — declared conversions between unit spaces
// ---------------------------------------------------------------------------

export interface Conversion {
  /**
   * Registry id of the parameter that carries the conversion. Typed as `ParamKey`, not
   * `string`, so a conversion cannot name a parameter that does not exist.
   */
  param: ParamKey
  from: BaseDimension
  to: BaseDimension
  /** The aux term whose unit the conversion establishes. */
  term: string
}

/**
 * Every term that crosses a unit boundary must name the parameter that carries the
 * conversion, and that parameter must exist in the registry. Without this rule a
 * modeller can silently equate an incident with a unit of debt, which is precisely
 * what v0.2 did.
 */
export const DECLARED_CONVERSIONS: Conversion[] = [
  { param: 'c_inc_debt', from: 'incident', to: 'debt', term: 'a.u_to_debt' },
  { param: 'c_rec_exp', from: 'record', to: 'exposure', term: 'a.pl_from_records' },
  { param: 'c_harm_exp', from: 'harm', to: 'exposure', term: 'a.pl_from_harm' },
]

// ---------------------------------------------------------------------------
// V3.4 — levels versus rates
// ---------------------------------------------------------------------------

/**
 * Auxiliaries that are LEVELS, not rates. A level may not appear as a term in a
 * `d·/dt` without first being multiplied by a rate constant.
 *
 * `harm_events` is the case that motivated the rule: it is a level (harm present at
 * time t, `gamma·TD·(1 − L/100)`), and v0.2 both used it as a flow and integrated it
 * over time with the trapezoid rule, which is a category error twice over. The model
 * now derives `harm_rate = harm_events · rate_harm` and only the rate reaches an
 * equation.
 */
export const LEVEL_AUXILIARIES = [
  'harm_events',
  'f_doc',
  'perceived_discoverability',
  'privilege_survival',
  'privilege_survival_eff',
  'valve_leakage',
  'waiver_probability',
  // `protection_bundle` is deliberately absent: it is a local in `computeAux`, never
  // exposed on Auxiliaries, so it cannot reach an equation and there is nothing to gate.
  'safe_to_report_score',
  'accountability_legitimacy',
  'litigation_pressure',
  'private_ordering_gap',
  'policy_scaffold_dependency',
  'learning_yield',
] as const

// ---------------------------------------------------------------------------
// Waivers — violations accepted with a written reason (M1 acceptance clause)
// ---------------------------------------------------------------------------

export interface DimensionalWaiver {
  id: string
  what: string
  why: string
  cost: string
}

/**
 * M1's acceptance criterion is "V3 passes **or** every dimensional violation is
 * explicitly waived with a written justification". These are the waivers. Each states
 * what is not checked and what that costs, so a reader can decide whether to believe
 * the affected output rather than having to discover the gap.
 */
export const DIMENSIONAL_WAIVERS: DimensionalWaiver[] = [
  {
    id: 'culture-equation',
    what: '`dC/dt = lambda_C · (cultureTarget − C) · kernel` is not checked term-by-term.',
    why:
      'It is not a sum of flows. It is a relaxation toward a target, and its terms ' +
      '(safety_wins, backfire, exposure_chill, harm_chill) are dimensionless ' +
      'contributions to a target LEVEL on [0,1], not rates. The rate comes from ' +
      'lambda_C (1/month) alone. Forcing this into the additive-flow check would ' +
      'require declaring a fictitious "culture" dimension to make the arithmetic ' +
      'close, which would make the checker agree with itself and prove nothing.',
    cost:
      'The dimensional consistency of the culture equation rests on inspection, not on ' +
      'a machine check. The specific risk is that a future contributor adds a term to ' +
      'cultureTarget that is a rate rather than a level, and nothing catches it.',
  },
  {
    id: 'index-valued-exposure',
    what: '`exposure` is an index, not a measured quantity with a natural unit.',
    why:
      'There is no observable "unit of products-liability exposure". The dimension is ' +
      'internally consistent — c_rec_exp and c_harm_exp define it in terms of records ' +
      'and harm — but its scale is arbitrary.',
    cost:
      'Exposure magnitudes are meaningful only in comparison across runs, never in ' +
      'absolute terms. Any readout that quotes an exposure number as if it meant ' +
      'something on its own is overclaiming.',
  },
]

// ---------------------------------------------------------------------------
// The parser: extract additive terms from the real source
// ---------------------------------------------------------------------------

/** Strip line and block comments so commented-out arithmetic is not parsed as code. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/**
 * Split an expression on `+` and `-` at paren depth zero, returning terms with their
 * sign stripped and whitespace normalised.
 */
export function splitTerms(expr: string): string[] {
  const terms: string[] = []
  let depth = 0
  let current = ''
  for (const ch of expr) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if ((ch === '+' || ch === '-') && depth === 0) {
      if (current.trim()) terms.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) terms.push(current.trim())
  // esbuild re-emits the function with statement semicolons, so strip trailing
  // punctuation before matching. The parser reads the TRANSFORMED source at test
  // time, not the file on disk, so it must tolerate the transform's formatting.
  return terms.map((t) => t.replace(/\s+/g, ' ').replace(/[;,]+$/, '').trim()).filter(Boolean)
}

/**
 * Pull the right-hand side of `const d<stock> = …` out of a function source, stopping
 * at the next statement. Returns null when the stock has no such assignment, which is
 * itself a finding rather than something to shrug at.
 */
export function equationSource(src: string, stock: string): string | null {
  const clean = stripComments(src)
  const re = new RegExp(`const d${stock}\\s*=\\s*([\\s\\S]*?)(?=\\n\\s*(?:const |return |\\n))`)
  const m = clean.match(re)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}
