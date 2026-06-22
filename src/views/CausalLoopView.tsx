/**
 * Causal-loop view: the live feedback structure behind the model. Reads the latest
 * auxiliary flows from the store's deterministic trajectory (already computed — so
 * this is free and updates on every slider drag), scores loop dominance, and renders
 * the diagram plus a legend of current loop shares.
 */
import { useStore } from '../state/store'
import { CausalLoopDiagram } from '../components/CausalLoopDiagram'
import { loopActivity, dominantLoop, LOOP_LABEL, type LoopId } from '../lib/loops'
import { pct } from '../lib/format'

const LOOP_DOT: Record<LoopId, string> = {
  r1: 'bg-chilling',
  r2: 'bg-learning',
  balancing: 'bg-estimate',
}

export function CausalLoopView() {
  const trajectory = useStore((s) => s.trajectory)
  const summary = useStore((s) => s.summary)
  const aux = trajectory.aux[trajectory.aux.length - 1] ?? trajectory.aux[0]
  const activity = loopActivity(aux)
  const dom = dominantLoop(activity)
  const share: Record<LoopId, number> = { r1: activity.r1, r2: activity.r2, balancing: activity.balancing }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="m-0 mb-1 text-[15px] font-semibold text-ink">Feedback structure</h2>
        <p className="mb-2 text-[12px] text-muted">
          Two reinforcing loops compete; a balancing loop damps the system. The dominant loop is highlighted —
          adjust the levers and watch which loop takes over.
        </p>
        <CausalLoopDiagram activity={activity} regime={summary.regime} />
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="m-0 mb-2 text-[13px] font-semibold text-ink">Loop dominance (current)</h3>
          <ul className="space-y-2">
            {(['r1', 'r2', 'balancing'] as LoopId[]).map((id) => (
              <li key={id} className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${LOOP_DOT[id]}`} aria-hidden />
                <span className={`flex-1 text-[12px] ${id === dom ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                  {LOOP_LABEL[id]}
                </span>
                <span className="tabular-nums text-[12px] text-muted">{pct(share[id])}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4 text-[12px] leading-relaxed text-ink-soft">
          <p className="m-0">
            <strong className="text-chilling">R1 (suppression spiral)</strong>: legal/PR fear suppresses written
            analysis, undocumented debt accumulates, exposure feeds more fear.
          </p>
          <p className="mb-0 mt-2">
            <strong className="text-learning">R2 (learning flywheel)</strong>: documenting builds learning and a
            just culture, which makes documenting feel safe — and self-reinforces.
          </p>
          <p className="mb-0 mt-2">
            <strong className="text-estimate">B (remediation)</strong>: harm events create pressure to document and
            fix, damping run-away in either direction.
          </p>
        </div>
      </div>
    </div>
  )
}
