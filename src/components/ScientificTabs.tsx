/** Secondary tab strip for the analytical views inside Scientific mode. */
import { useStore } from '../state/store'
import type { ScientificView } from '../state/store'

const TABS: { id: ScientificView; label: string }[] = [
  { id: 'workbench', label: 'Workbench' },
  { id: 'institutional', label: 'Institutional design' },
  { id: 'cld', label: 'Causal loops' },
  { id: 'tipping', label: 'Tipping' },
  { id: 'sensitivity', label: 'Sensitivity' },
  { id: 'compare', label: 'Compare' },
]

export function ScientificTabs() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  return (
    <div role="tablist" aria-label="Analytical view" className="flex flex-wrap gap-1 border-b border-line">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={view === t.id}
          onClick={() => setView(t.id)}
          className={`-mb-px rounded-t-md border-b-2 px-3 py-1.5 text-[12px] font-medium transition-colors ${
            view === t.id
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
