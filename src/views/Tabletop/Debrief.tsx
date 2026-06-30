// src/views/Tabletop/Debrief.tsx
/**
 * Aftermath Debrief view — shown when the Tabletop playthrough is complete.
 * Reads the engine-forward verdict from the tabletop store, offers a Markdown
 * after-action report download, and provides the "See this as a system" handoff
 * that loads the player's institutional configuration into scenario A and
 * switches the main store to scientific/Tipping view.
 *
 * The clock call (`new Date().toISOString()`) lives here — in the UI layer —
 * never in the engine or store builder.
 */
import { useTabletopStore } from '../../state/tabletopStore'
import { triggerDownload } from '../../lib/persistence'

export function Debrief() {
  // Stable slices from the store — functions are stable references in Zustand.
  const buildDebrief = useTabletopStore((s) => s.buildDebrief)
  const handoffToSystem = useTabletopStore((s) => s.handoffToSystem)

  // outcome() derives a fresh object each call, so we call it once via getState()
  // rather than inside a selector (which would fail the "cached snapshot" check).
  const outcome = useTabletopStore.getState().outcome()

  function handleDownload() {
    const timestamp = new Date().toISOString()
    const markdown = buildDebrief(timestamp)
    const blob = new Blob([markdown], { type: 'text/markdown; charset=utf-8' })
    triggerDownload(blob, `after-action-report-${timestamp.slice(0, 10)}.md`)
  }

  return (
    <section aria-label="Aftermath Debrief">
      <h2>Aftermath: Engine-Forward Verdict</h2>

      <dl>
        <div>
          <dt>Regime</dt>
          <dd>{outcome.regime}</dd>
        </div>
        <div>
          <dt>Recurrence risk</dt>
          <dd>{Math.round(outcome.recurrenceRisk)} / 100</dd>
        </div>
        <div>
          <dt>Cumulative harm (model units)</dt>
          <dd>{outcome.cumulativeHarm.toFixed(1)}</dd>
        </div>
        <div>
          <dt>Settled technical debt</dt>
          <dd>{outcome.finalDebt.toFixed(1)}</dd>
        </div>
        <div>
          <dt>Safety capability acquired</dt>
          <dd>{outcome.finalLearning.toFixed(0)} / 100</dd>
        </div>
      </dl>

      <button type="button" onClick={handleDownload}>
        Download after-action report (Markdown)
      </button>

      <button type="button" onClick={handoffToSystem}>
        See this as a system
      </button>
    </section>
  )
}
