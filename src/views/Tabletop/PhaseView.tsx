// src/views/Tabletop/PhaseView.tsx
import { useTabletopStore } from '../../state/tabletopStore'
import { ChoiceCard } from './ChoiceCard'

export function PhaseView() {
  const scenario = useTabletopStore((s) => s.scenario)
  const currentNodeId = useTabletopStore((s) => s.currentNodeId)
  const choose = useTabletopStore((s) => s.choose)
  const node = scenario.nodes.find((n) => n.id === currentNodeId)
  if (!node) return null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted">Phase {node.phase}</div>
        <h3 className="m-0 mt-1 text-[15px] font-semibold text-ink">{node.title}</h3>
        <p className="mt-1 text-[13px] text-ink-soft">{node.situation}</p>
      </div>
      <div className="space-y-2">
        {node.choices.map((c) => <ChoiceCard key={c.id} choice={c} onChoose={choose} />)}
      </div>
    </div>
  )
}
