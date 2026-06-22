/**
 * The headline "which equilibrium are we heading toward" readout (spec §5,
 * Executive mode). A regime chip plus the metrics that matter: documentation
 * fraction, technical debt, learning, time-to-tip, cumulative exposure.
 */
import { useStore } from '../state/store'
import { fmt, pct, REGIME_LABEL, REGIME_BLURB, REGIME_CLASS } from '../lib/format'

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-[18px] font-semibold tabular-nums text-ink">{value}</div>
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </div>
  )
}

export function HeadlineReadout() {
  const summary = useStore((s) => s.summary)
  const diverged = useStore((s) => s.trajectory.diverged)
  const r = summary.regime
  const cls = REGIME_CLASS[r]

  return (
    <section aria-labelledby="headline-h" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="headline-h" className="sr-only">
        Headline readout
      </h2>
      <div className={`mb-3 flex items-center gap-3 rounded-md ${cls.bg} px-3 py-2 ring-1 ${cls.ring}`}>
        <span className={`inline-block h-3 w-3 rounded-full ${cls.dot}`} aria-hidden />
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">Heading toward</div>
          <div className={`text-[20px] font-bold ${cls.text}`}>{REGIME_LABEL[r]} equilibrium</div>
        </div>
      </div>
      <p className="mb-3 text-[13px] text-ink-soft">{REGIME_BLURB[r]}</p>

      {diverged && (
        <p className="mb-3 rounded border border-chilling/40 bg-chilling-soft px-2 py-1 text-[12px] text-chilling">
          ⚠ The simulation hit a numerical guard (divergence). Treat this run as unreliable.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Documented" value={pct(summary.finalFdoc)} hint="of new incidents" />
        <Metric label="Technical debt" value={fmt(summary.finalState.TD, 1)} hint="debt index" />
        <Metric label="Learning" value={fmt(summary.finalState.L, 0)} hint="0–100 capability" />
        <Metric
          label="Time to tip"
          value={summary.timeToTip === null ? 'no tip' : `${fmt(summary.timeToTip, 0)} mo`}
          hint="f_doc crosses 50%"
        />
        <Metric label="Cumulative exposure" value={fmt(summary.cumulativeExposure, 0)} hint="∫ E dt" />
        <Metric label="Culture" value={fmt(summary.finalState.C, 2)} hint="0–1 psych. safety" />
      </div>
    </section>
  )
}
