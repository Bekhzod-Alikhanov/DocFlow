// src/views/Tabletop/ChoiceCard.tsx
import type { Choice } from '../../engine/tabletop'

const CHAPTER_TAG: Record<number, string> = { 1: 'Liability', 2: 'Signal flow', 3: 'Architecture', 4: 'Technical' }

export function ChoiceCard({ choice, onChoose }: { choice: Choice; onChoose: (c: Choice) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChoose(choice)}
      className="w-full rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink">{choice.label}</span>
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">Ch.{choice.chapter} · {CHAPTER_TAG[choice.chapter]}</span>
      </div>
    </button>
  )
}
