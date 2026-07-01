// src/views/Tabletop/ScenarioPicker.tsx
/**
 * Scenario picker for the Tabletop surface. One-click switch; each card shows
 * name, failure-type tag, chapter tags, and blurb. Mirrors PresetGallery's
 * card/selection pattern.
 */
import { TABLETOP_SCENARIOS } from '../../lib/tabletop/scenarios'
import { useTabletopStore } from '../../state/tabletopStore'

export function ScenarioPicker() {
  const selectScenario = useTabletopStore((s) => s.selectScenario)
  const activeScenarioId = useTabletopStore((s) => s.scenario.id)

  return (
    <section aria-labelledby="scenarios-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="scenarios-h" className="m-0 mb-1 text-[15px] font-semibold text-ink">
        Scenarios
      </h2>
      <p className="mb-3 text-[12px] text-muted">
        Pick a scenario to play. Switching resets the current run.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TABLETOP_SCENARIOS.map((s) => {
          const active = activeScenarioId === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectScenario(s.id)}
              aria-current={active ? 'true' : undefined}
              className={`rounded-md border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${active ? 'border-accent ring-1 ring-accent/30' : 'border-line hover:border-line-strong'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                  {s.failureType}
                </span>
              </div>
              <p className="mb-2 mt-1 text-[11.5px] leading-snug text-ink-soft">{s.blurb}</p>
              <span className="text-[10px] text-muted">Ch.{s.chapters.join('·')}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
export default ScenarioPicker
