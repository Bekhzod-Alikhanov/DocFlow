/**
 * Sector preset cards. One-click load; each shows expected regime, blurb,
 * citations/caveats, and lever-level rationale metadata.
 */
import { useState } from 'react'
import { LEVER_KEYS, PARAM_SPEC_BY_ID, PRESETS } from '../engine'
import { useStore } from '../state/store'
import { REGIME_CLASS, REGIME_LABEL } from '../lib/format'

export function PresetGallery() {
  const loadPreset = useStore((s) => s.loadPreset)
  const activePresetId = useStore((s) => s.activePresetId)
  const [openCite, setOpenCite] = useState<string | null>(null)

  return (
    <section aria-labelledby="presets-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="presets-h" className="m-0 mb-1 text-[15px] font-semibold text-ink">
        Sector presets
      </h2>
      <p className="mb-3 text-[12px] text-muted">
        Each preset encodes a real regime's structural posture, with its basis cited.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PRESETS.map((p) => {
          const cls = REGIME_CLASS[p.expectedRegime]
          const active = activePresetId === p.id
          const showCite = openCite === p.id
          return (
            <div
              key={p.id}
              className={`rounded-md border p-3 transition-colors ${active ? 'border-accent ring-1 ring-accent/30' : 'border-line hover:border-line-strong'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset(p.id)}
                  className="text-left text-[13px] font-semibold text-ink hover:text-accent"
                >
                  {p.name}
                </button>
                <span className={`shrink-0 rounded-full ${cls.bg} px-2 py-0.5 text-[10px] font-medium ${cls.text}`}>
                  {REGIME_LABEL[p.expectedRegime]}
                </span>
              </div>
              <p className="mb-2 mt-1 text-[11.5px] leading-snug text-ink-soft">{p.blurb}</p>
              <button
                type="button"
                onClick={() => setOpenCite(showCite ? null : p.id)}
                aria-expanded={showCite}
                className="text-[11px] text-accent hover:underline"
              >
                {showCite ? 'Hide basis' : 'Basis & caveats'}
              </button>
              {showCite && (
                <div className="mt-1.5 space-y-2 border-t border-line pt-1.5">
                  <ul className="space-y-1.5">
                    {p.citations.map((c, i) => (
                      <li key={i} className="text-[11px] leading-snug text-ink-soft">
                        {c.text}
                        {c.caveat && (
                          <span className="mt-0.5 block rounded bg-estimate-soft px-1.5 py-1 text-estimate">
                            {c.caveat}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="max-h-44 overflow-auto rounded border border-line">
                    <table className="w-full border-collapse text-[10.5px]">
                      <thead className="sticky top-0 bg-surface-2 text-left text-muted">
                        <tr>
                          <th className="px-1.5 py-1 font-medium">Lever</th>
                          <th className="px-1.5 py-1 font-medium">Confidence</th>
                          <th className="px-1.5 py-1 font-medium">Why this value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {LEVER_KEYS.map((key) => {
                          const r = p.leverRationales[key]
                          return (
                            <tr key={key} className="border-t border-line align-top">
                              <td className="px-1.5 py-1 font-medium text-ink">{PARAM_SPEC_BY_ID[key].label}</td>
                              <td className="px-1.5 py-1 text-muted">
                                {r.confidence} / {r.caveatLevel}
                              </td>
                              <td className="px-1.5 py-1 text-ink-soft">{r.basis}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
