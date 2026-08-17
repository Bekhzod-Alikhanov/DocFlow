// @vitest-environment jsdom
/**
 * `theme.ts` bridges CSS custom properties to Plotly, which needs concrete colors.
 * It was at 16% coverage before v0.3.0 — invisible under the old aggregate
 * threshold. The fallback path is the one that actually matters: it is what runs
 * in tests, in SSR, and before stylesheets resolve.
 */
import { describe, it, expect } from 'vitest'
import { cssVar, regimeColors, STOCK_COLORS } from './theme'

describe('cssVar', () => {
  it('returns the fallback when the property is unset', () => {
    expect(cssVar('--definitely-not-a-real-token', '#abcdef')).toBe('#abcdef')
  })

  it('returns the resolved value when the property is set', () => {
    document.documentElement.style.setProperty('--test-token', '#123456')
    expect(cssVar('--test-token', '#000')).toBe('#123456')
    document.documentElement.style.removeProperty('--test-token')
  })

  it('uses the documented default fallback', () => {
    expect(cssVar('--another-missing-token')).toBe('#000')
  })
})

describe('regimeColors', () => {
  it('returns a complete palette with every key populated', () => {
    const c = regimeColors()
    const keys = [
      'chilling', 'learning', 'contested', 'accent',
      'ink', 'inkSoft', 'muted', 'line', 'paper', 'surface', 'estimate',
    ] as const
    for (const k of keys) {
      expect(typeof c[k]).toBe('string')
      expect(c[k].length).toBeGreaterThan(0)
    }
  })

  it('falls back to distinct regime colors so charts stay legible untokened', () => {
    const c = regimeColors()
    expect(c.chilling).not.toBe(c.learning)
  })
})

describe('STOCK_COLORS', () => {
  it('covers every charted stock and key auxiliary', () => {
    for (const k of ['U', 'D', 'TD', 'L', 'E', 'C', 'f_doc', 'harm_events']) {
      expect(STOCK_COLORS[k]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
