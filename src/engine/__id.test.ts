import { it, expect } from 'vitest'
import { simulate } from './simulate'
import { computeAux, privilegeSurvival, discoverability } from './model'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESETS } from './presets'

it('V6.2 with v0.3 channel outputs', () => {
  const rows = PRESETS.map((preset) => {
    const p = paramsFromPreset(preset)
    const r = simulate(initFromPreset(preset), p, { horizon: 120, dt: 0.5, solver: 'rk4' })
    const s = r.summary.finalState
    const a = computeAux(s, p)
    const d = discoverability(p)
    return { id: preset.id, v: [
      r.summary.finalFdoc, s.C, s.L, s.TD, s.E_pl, s.E_reg, s.E_fid,
      s.R1, s.R2, s.R3, privilegeSurvival(p).pi, d.fact, d.anal, d.rem, a.learning_yield,
    ] }
  })
  const NAMES = ['f_doc','C','L','TD','E_pl','E_reg','E_fid','R1','R2','R3','pi','pd_fact','pd_anal','pd_rem','learn_yield']
  const ranges = NAMES.map((_, i) => { const c = rows.map(r => r.v[i]); return Math.max(...c) - Math.min(...c) })
  let worst = Infinity, wp = '', wk = ''
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    let best = 0, bk = ''
    NAMES.forEach((n, i) => { if (ranges[i] > 0) { const v = Math.abs(rows[a].v[i] - rows[b].v[i]) / ranges[i]; if (v > best) { best = v; bk = n } } })
    if (best < worst) { worst = best; wp = `${rows[a].id} ~ ${rows[b].id}`; wk = bk }
  }
  console.log(`RPT full v0.3 set: worst pair ${wp} = ${(worst*100).toFixed(2)}% of range (on ${wk})`)
  console.log('RPT aviation vs nuclear per-output:')
  const av = rows.find(r => r.id === 'aviation')!, nu = rows.find(r => r.id === 'nuclear-dual-channel')!
  NAMES.forEach((n, i) => { if (ranges[i] > 0) console.log(`RPT    ${n.padEnd(12)} ${(Math.abs(av.v[i]-nu.v[i])/ranges[i]*100).toFixed(2)}%`) })
  expect(true).toBe(true)
}, 120_000)
