// @vitest-environment jsdom
/**
 * The chart registry is small but load-bearing: PNG and PDF export both depend on
 * it to reach the visible Plotly graph div. It sat at 33% coverage with 0% of its
 * functions exercised — invisible under the pre-v0.3.0 aggregate threshold.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setPrimaryGd, getPrimaryGd } from './chartRegistry'

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('chartRegistry', () => {
  it('hands back the element that was registered', () => {
    const el = document.createElement('div')
    el.id = 'gd-a'
    setPrimaryGd(el)
    expect(getPrimaryGd()).toBe(el)
  })

  it('last registration wins, so the visible chart is the export target', () => {
    const first = document.createElement('div')
    const second = document.createElement('div')
    setPrimaryGd(first)
    setPrimaryGd(second)
    expect(getPrimaryGd()).toBe(second)
    expect(getPrimaryGd()).not.toBe(first)
  })

  it('returns whatever is current without throwing when nothing new is set', () => {
    const el = document.createElement('div')
    setPrimaryGd(el)
    expect(() => getPrimaryGd()).not.toThrow()
    expect(getPrimaryGd()).toBe(el)
  })
})
