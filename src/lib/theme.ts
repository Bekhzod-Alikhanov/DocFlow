/**
 * Bridge between the CSS design tokens and JS consumers (Plotly needs concrete
 * colors). Reads the resolved CSS custom properties so charts track light/dark.
 */
export function cssVar(name: string, fallback = '#000'): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export interface RegimeColors {
  chilling: string
  learning: string
  contested: string
  accent: string
  ink: string
  inkSoft: string
  muted: string
  line: string
  paper: string
  surface: string
  estimate: string
}

export function regimeColors(): RegimeColors {
  return {
    chilling: cssVar('--color-chilling', '#b3402e'),
    learning: cssVar('--color-learning', '#1f7a5a'),
    contested: cssVar('--color-estimate', '#9a6b13'),
    accent: cssVar('--color-accent', '#3a4fb0'),
    ink: cssVar('--color-ink', '#1a1714'),
    inkSoft: cssVar('--color-ink-soft', '#4d473f'),
    muted: cssVar('--color-muted', '#8a8178'),
    line: cssVar('--color-line', '#e7e2d9'),
    paper: cssVar('--color-paper', '#faf8f4'),
    surface: cssVar('--color-surface', '#ffffff'),
    estimate: cssVar('--color-estimate', '#9a6b13'),
  }
}

/** Per-stock chart colors (stable, colorblind-conscious palette). */
export const STOCK_COLORS: Record<string, string> = {
  U: '#b3402e', // undocumented — warm (chilling-adjacent)
  D: '#1f7a5a', // documented — teal (learning-adjacent)
  TD: '#9a6b13', // technical debt — amber
  L: '#3a4fb0', // learning — indigo
  E: '#7a4fb0', // exposure — violet
  C: '#0e7490', // culture — cyan
  f_doc: '#1f7a5a',
  harm_events: '#b3402e',
  perceived_discoverability: '#9a6b13',
}
