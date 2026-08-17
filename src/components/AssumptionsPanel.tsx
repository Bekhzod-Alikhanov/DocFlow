/**
 * Assumptions & Methods panel (spec §4.1, first-class requirement). Lists every
 * parameter with its current value, range, evidence-basis tag, and source.
 * `illustrative-assumption` rows are visually distinct from `empirical-anchor`.
 */
import { Fragment } from 'react'
import {
  LEVER_KEYS,
  PARAM_SPECS,
  PRESET_BY_ID,
  READOUT_GROUP_LABEL,
  READOUT_WEIGHTS_BY_GROUP,
  PROVENANCE_TIER_LABEL,
  type LeverKey,
  type ParamGroup,
  type ReadoutGroup,
} from '../engine'
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

/** Tier badge styling. T4 (free) is deliberately the most prominent. */
const TIER_BADGE: Record<string, string> = {
  T1: 'bg-learning-soft text-learning ring-learning/30',
  T2: 'bg-accent-soft text-accent ring-accent/30',
  T3: 'bg-surface-2 text-ink-soft ring-line',
  T4: 'bg-estimate-soft text-estimate ring-estimate/40',
}

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
        Every tunable parameter, its value/range, and its evidence basis — followed by the composite-index
        weights that define the institutional readouts. {NO_FORECAST_LINE} No coefficient is an empirical
        anchor; the cyber ~5% documentation figure is an <em>estimate</em>.
      </p>
      <p className="mb-3 rounded-md border border-estimate/40 bg-estimate-soft px-3 py-2 text-[11px] leading-snug text-estimate">
        <strong>Provenance census: 0 measured, 0 analog-estimated, 8 structural, 54 free.</strong> Not one
        coefficient in this model is measured in its own domain. Hover any tier badge to see what evidence
        would be needed to constrain that parameter.
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
              <th className="px-2 py-1.5 font-medium">Tier</th>
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
                    <td colSpan={6} className="px-2 py-1 text-[11px] font-semibold text-ink">
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
                        <span
                          title={p.whatWouldConstrainIt ? `Would be constrained by: ${p.whatWouldConstrainIt}` : undefined}
                          className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] ring-1 ${TIER_BADGE[p.tier]}`}
                        >
                          {p.tier} {PROVENANCE_TIER_LABEL[p.tier]}
                        </span>
                        {p.citationStatus && p.citationStatus !== 'verified' && (
                          <div className="mt-1 text-[10px] text-estimate">⚠ {p.citationStatus}</div>
                        )}
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

      <ReadoutWeightsTable />
    </section>
  )
}

/**
 * The composite-index weights (AUDIT.md F8). Through v0.2 these ~29 numbers were
 * bare literals inside computeAux — invisible here, despite this panel claiming to
 * list "every parameter", and excluded from every sensitivity analysis. They drive
 * the six institutional readouts a policy audience actually quotes, so they are now
 * rendered with the same provenance discipline as the tunable parameters.
 */
function ReadoutWeightsTable() {
  return (
    <div className="mt-5">
      <h3 className="m-0 text-[13px] font-semibold text-ink">Institutional readout weights</h3>
      <p className="mb-2 mt-1 text-[11px] leading-snug text-ink-soft">
        These define what each composite index <em>means</em> — the blend of levers behind
        <code className="mx-1 rounded bg-surface-2 px-1">safe_to_report_score</code>,
        <code className="mx-1 rounded bg-surface-2 px-1">litigation_pressure</code> and the rest. Each
        blend&rsquo;s positive weights sum to 1.00 by construction, which encodes an untested assumption that
        the mechanisms in a blend are <strong>perfectly substitutable</strong>. They are declared constants
        rather than tunable parameters, so they are <strong>not varied by the sensitivity analyses</strong> —
        a stated limitation, not an oversight.
      </p>
      <div className="max-h-[40vh] overflow-auto rounded border border-line">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 bg-surface-2 text-left text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-2 py-1.5 font-medium">Weight</th>
              <th className="px-2 py-1.5 text-right font-medium">Value</th>
              <th className="px-2 py-1.5 font-medium">Basis</th>
              <th className="px-2 py-1.5 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(READOUT_WEIGHTS_BY_GROUP) as ReadoutGroup[]).map((g) => (
              <Fragment key={g}>
                <tr className="bg-paper">
                  <td colSpan={4} className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {READOUT_GROUP_LABEL[g]}
                  </td>
                </tr>
                {READOUT_WEIGHTS_BY_GROUP[g].map((w) => (
                  <tr key={w.id} className="border-t border-line/60 align-top">
                    <td className="px-2 py-1.5 text-ink">{w.label}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-ink">{fmt(w.value, 2)}</td>
                    <td className="px-2 py-1.5">
                      <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] ring-1 ${EVIDENCE_BADGE[w.evidence_basis]}`}>
                        {EVIDENCE_LABEL[w.evidence_basis]}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[11px] leading-snug text-ink-soft">
                      {w.note}
                      <div className="mt-1 text-[10px] text-muted">{w.source}</div>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
