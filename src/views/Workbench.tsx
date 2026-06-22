/** Default Scientific view: headline readout, all-stocks time series, assumptions. */
import { useState } from 'react'
import { HeadlineReadout } from '../components/HeadlineReadout'
import { TimeSeriesChart } from '../components/TimeSeriesChart'
import { AssumptionsPanel } from '../components/AssumptionsPanel'

export function Workbench() {
  const [showAssumptions, setShowAssumptions] = useState(true)
  return (
    <div className="space-y-4">
      <HeadlineReadout />
      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="m-0 mb-2 text-[15px] font-semibold text-ink">All stocks &amp; documentation fraction</h2>
        <TimeSeriesChart seriesKeys={['f_doc', 'C', 'U', 'D', 'TD', 'L', 'E']} height={380} />
        <p className="mt-1 text-[11px] text-muted">
          0–1 indices (documentation fraction, culture) on the left axis; counts/indices on the right. Toggle Monte
          Carlo in the header for 10–90% bands.
        </p>
      </div>
      <div>
        <button
          type="button"
          onClick={() => setShowAssumptions((v) => !v)}
          className="mb-3 rounded-md border border-line px-3 py-1 text-[12px] text-ink-soft hover:border-accent"
          aria-expanded={showAssumptions}
        >
          {showAssumptions ? 'Hide' : 'Show'} assumptions &amp; methods
        </button>
        {showAssumptions && <AssumptionsPanel />}
      </div>
    </div>
  )
}
