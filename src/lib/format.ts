/** Small formatting & labeling helpers shared across the UI. */
import type { Regime } from '../engine'

export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function pct(frac: number, digits = 0): string {
  return `${(frac * 100).toFixed(digits)}%`
}

export const REGIME_LABEL: Record<Regime, string> = {
  chilling: 'Chilling',
  learning: 'Learning',
  contested: 'Contested',
}

export const REGIME_BLURB: Record<Regime, string> = {
  chilling: 'Legal fear suppresses written analysis; learning stalls and technical debt compounds.',
  learning: 'Documenting feels safe; learning compounds and failures recur less.',
  contested: 'On the knife-edge between the two attractors — path-dependent.',
}

/** Tailwind text/background utility groups keyed by regime (used for chips/cards). */
export const REGIME_CLASS: Record<Regime, { text: string; bg: string; ring: string; dot: string }> = {
  chilling: { text: 'text-chilling', bg: 'bg-chilling-soft', ring: 'ring-chilling/30', dot: 'bg-chilling' },
  learning: { text: 'text-learning', bg: 'bg-learning-soft', ring: 'ring-learning/30', dot: 'bg-learning' },
  contested: { text: 'text-estimate', bg: 'bg-estimate-soft', ring: 'ring-estimate/30', dot: 'bg-estimate' },
}

export const EVIDENCE_LABEL: Record<string, string> = {
  'empirical-anchor': 'Empirical anchor',
  'expert-estimate': 'Expert estimate',
  'illustrative-assumption': 'Illustrative assumption',
}

/** The persistent no-forecast line (spec §4.3) — reused in-app and on every export. */
export const NO_FORECAST_LINE =
  'Scenario projection under stated assumptions. Structural/relational model, not a calibrated forecast.'
