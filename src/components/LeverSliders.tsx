/**
 * The six policy levers (spec §2.4, §5.1) — live, debounced-free (the single run is
 * instant), with reset-to-preset. The signature interaction: drag a lever to tip.
 */
import { LEVER_KEYS, PARAM_SPEC_BY_ID } from '../engine'
import { useStore } from '../state/store'
import { ParamSlider } from './ParamSlider'

const FAMILY_ORDER = [
  { id: 'legal', label: 'Legal scaffold' },
  { id: 'governance', label: 'Governance line' },
  { id: 'learning', label: 'Learning infrastructure' },
] as const

export function LeverSliders() {
  const params = useStore((s) => s.params)
  const setParam = useStore((s) => s.setParam)
  const activePresetId = useStore((s) => s.activePresetId)
  const resetToPreset = useStore((s) => s.resetToPreset)

  return (
    <section aria-labelledby="levers-h" className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 id="levers-h" className="m-0 text-[15px] font-semibold text-ink">
          Policy levers
        </h2>
        {activePresetId && (
          <button
            type="button"
            onClick={resetToPreset}
            className="rounded border border-line px-2 py-0.5 text-[11px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            Reset to preset
          </button>
        )}
      </div>
      <p className="mb-3 text-[12px] text-muted">
        Each lever maps to a real regime mechanism. Drag <strong>Just culture</strong> or{' '}
        <strong>Safe harbor</strong> and watch the system tip between equilibria.
      </p>
      <div className="space-y-3">
        {FAMILY_ORDER.map((family) => {
          const keys = LEVER_KEYS.filter((key) => PARAM_SPEC_BY_ID[key].leverFamily === family.id)
          return (
            <div key={family.id}>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{family.label}</div>
              <div className="divide-y divide-line/70 rounded-md border border-line/70 px-2">
                {keys.map((key) => (
                  <ParamSlider key={key} spec={PARAM_SPEC_BY_ID[key]} value={params[key]} onChange={(v) => setParam(key, v)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
