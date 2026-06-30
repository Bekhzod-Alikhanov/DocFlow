// src/views/Tabletop/ScoringLogicPanel.tsx
import { useState } from 'react'

export interface ScoringLogicEntry {
  formula: string
  levers: string[]
  flags: string[]
}

interface Props {
  meterId: string
  logic: ScoringLogicEntry
}

/**
 * Collapsible scoring-logic panel. Renders a WCAG-AA `<button aria-expanded>` toggle
 * that reveals the formula, the levers that drive it, and any active flags.
 *
 * The panel body is a single plain-text paragraph so assistive technology and test
 * queries find exactly one element containing "formula", "levers", and "flags".
 */
export function ScoringLogicPanel({ meterId, logic }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = `scoring-logic-${meterId}`

  const leversText = logic.levers.length > 0 ? logic.levers.join(', ') : '—'
  const flagsText = logic.flags.length > 0 ? logic.flags.join(', ') : '—'

  // Single text node: "Formula: … — Levers: … — Flags: …"
  const summaryText = `Formula: ${logic.formula} — Levers: ${leversText} — Flags: ${flagsText}`

  return (
    <div className="mt-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="text-xs text-accent underline underline-offset-2 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {open ? 'Hide scoring logic' : 'Show scoring logic'}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={`Scoring logic for ${meterId}`}
          className="mt-2 rounded border border-line bg-surface p-3 text-xs text-ink-soft"
        >
          {/* Plain text paragraph — no child elements — so getByText finds exactly one node. */}
          <p>{summaryText}</p>
        </div>
      )}
    </div>
  )
}
