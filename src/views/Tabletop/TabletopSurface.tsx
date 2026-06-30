// src/views/Tabletop/TabletopSurface.tsx
import { useEffect } from 'react'
import { useTabletopStore } from '../../state/tabletopStore'
import { PhaseView } from './PhaseView'
import { MeterRail } from './MeterRail'
import { Debrief } from './Debrief'

export function TabletopSurface() {
  const start = useTabletopStore((s) => s.start)
  const finished = useTabletopStore((s) => s.finished)
  const scenario = useTabletopStore((s) => s.scenario)
  useEffect(() => { start() }, [start])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="m-0 text-[15px] font-semibold text-ink">Tabletop — {scenario.name}</h2>
        <p className="mt-1 text-[12px] text-muted">{scenario.blurb}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>{finished ? <Debrief /> : <PhaseView />}</div>
        <MeterRail />
      </div>
    </div>
  )
}
export default TabletopSurface
