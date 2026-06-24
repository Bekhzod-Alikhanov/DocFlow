/**
 * Assumptions & Methods panel (spec §4.1, first-class requirement). Lists every
 * parameter with its current value, range, evidence-basis tag, and source.
 * `illustrative-assumption` rows are visually distinct from `empirical-anchor`.
 */
import { Fragment } from 'react'
import { LEVER_KEYS, PARAM_SPECS, PRESET_BY_ID, type LeverKey, type ParamGroup } from '../engine'
import { useStore } from '../state/store'
import { fmt, EVIDENCE_LABEL, NO_FORECAST_LINE } from '../lib/format'

const GROUP_LABEL: Record<ParamGroup, string> = {
  lever: 'Policy levers',
  documentation: 'Documentation fraction (f_doc)',
  incidents: 'Incident generation',
  learning: 'Learning',
  debt: 'Technical debt & remediation',
  exposure: 'Exposure',
  culture: 'Culture',
}
const GROUP_ORDER: ParamGroup[] = ['lever', 'documentation', 'incidents', 'learning', 'debt', 'exposure', 'culture']

const EVIDENCE_BADGE: Record<string, string> = {
  'empirical-anchor': 'bg-learning-soft text-learning ring-learning/30',
  'expert-estimate': 'bg-accent-soft text-accent ring-accent/30',
  'illustrative-assumption': 'bg-estimate-soft text-estimate ring-estimate/40',
}

export function AssumptionsPanel() {
  const params = useStore((s) => s.params)
  const activePresetId = useStore((s) => s.activePresetId)
  const activePreset = activePresetId ? PRESET_BY_ID[activePresetId] : null
  const isLever = (id: string): id is LeverKey => (LEVER_KEYS as readonly string[]).includes(id)

  return (
    <section aria-labelledby="assume-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="assume-h" className="m-0 text-[15px] font-semibold text-ink">
        Assumptions &amp; methods
      </h2>
      <p className="mb-3 mt-1 text-[12px] text-ink-soft">
        Every parameter, its value/range, and its evidence basis. {NO_FORECAST_LINE} No coefficient is an
        empirical anchor; the cyber ~5% documentation figure is an <em>estimate</em>.
      </p>
      <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
        {Object.entries(EVIDENCE_LABEL).map(([k, label]) => (
          <span key={k} className={`rounded-full px-2 py-0.5 ring-1 ${EVIDENCE_BADGE[k]}`}>
            {label}
          </span>
        ))}
      </div>
      <div className="max-h-[60vh] overflow-auto rounded border border-line">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 bg-surface-2 text-left text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-2 py-1.5 font-medium">Parameter</th>
              <th className="px-2 py-1.5 text-right font-medium">Value</th>
              <th className="px-2 py-1.5 text-right font-medium">Range</th>
              <th className="px-2 py-1.5 font-medium">Basis</th>
              <th className="px-2 py-1.5 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {GROUP_ORDER.map((group) => {
              const rows = PARAM_SPECS.filter((p) => p.group === group)
              return (
                <Fragment key={group}>
                  <tr className="bg-surface-2/60">
                    <td colSpan={5} className="px-2 py-1 text-[11px] font-semibold text-ink">
                      {GROUP_LABEL[group]}
                    </td>
                  </tr>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-t border-line align-top">
                      <td className="px-2 py-1.5">
                        <div className="font-medium text-ink">{p.label}</div>
                        <div className="text-[11px] leading-snug text-muted">{p.note}</div>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-ink">{fmt(params[p.id], 3)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-muted">
                        {fmt(p.min, 2)}–{fmt(p.max, 2)}
                        {p.unit ? <div className="text-[10px]">{p.unit}</div> : null}
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] ring-1 ${EVIDENCE_BADGE[p.evidence_basis]}`}>
                          {EVIDENCE_LABEL[p.evidence_basis]}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-[11px] leading-snug text-ink-soft">
                        {p.source}
                        {activePreset && isLever(p.id) && (
                          <div className="mt-1 rounded bg-surface-2 px-1.5 py-1 text-[10px] text-muted">
                            Preset: {activePreset.leverRationales[p.id].confidence} / {activePreset.leverRationales[p.id].caveatLevel}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
