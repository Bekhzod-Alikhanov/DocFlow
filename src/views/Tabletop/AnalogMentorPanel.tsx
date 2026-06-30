// src/views/Tabletop/AnalogMentorPanel.tsx
/**
 * AnalogMentorPanel — for the current node, collects all analogRefs across
 * the node's choices, deduplicates them, looks each up in REGIME_MATRIX, and
 * renders a small read-only card per analog.
 *
 * Displays: name, mechanism, transferablePrinciple, sources (with caveat).
 * Reads useTabletopStore (scenario, currentNodeId). No logic beyond lookup/format.
 */
import { useTabletopStore } from '../../state/tabletopStore'
import { REGIME_MATRIX } from '../../lib/institutional'

export function AnalogMentorPanel() {
  const scenario = useTabletopStore((s) => s.scenario)
  const currentNodeId = useTabletopStore((s) => s.currentNodeId)

  const node = scenario.nodes.find((n) => n.id === currentNodeId)

  // Gather analogRefs across all choices for this node, dedup
  const analogIds = node
    ? Array.from(new Set(node.choices.flatMap((c) => c.analogRefs)))
    : []

  // Look up each analog in REGIME_MATRIX
  const analogs = analogIds
    .map((id) => REGIME_MATRIX.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => r !== undefined)

  if (analogs.length === 0) return null

  return (
    <section
      aria-label="Sector analogs"
      className="space-y-3"
    >
      <h3 className="text-[13px] font-semibold text-ink">Sector Analogs</h3>
      <ul className="space-y-3 list-none p-0 m-0" role="list">
        {analogs.map((analog) => (
          <li
            key={analog.id}
            className="rounded border border-line bg-surface p-3 text-[12px] leading-relaxed"
          >
            {/* Name + sector */}
            <p className="font-semibold text-ink mb-1">
              {analog.name}
              <span className="ml-2 font-normal text-muted">({analog.sector})</span>
            </p>

            {/* Mechanism */}
            <p className="text-ink-soft mb-1">
              <span className="font-medium text-ink">Mechanism: </span>
              {analog.mechanism}
            </p>

            {/* Transferable principle */}
            <p className="text-ink-soft mb-1">
              <span className="font-medium text-ink">Transferable principle: </span>
              {analog.transferablePrinciple}
            </p>

            {/* Sources */}
            {analog.sources.length > 0 && (
              <ul className="mt-1 space-y-0.5 list-none p-0 m-0" aria-label="Sources">
                {analog.sources.map((src) => (
                  <li key={src} className="text-muted text-[11px]">
                    {src}
                  </li>
                ))}
              </ul>
            )}

            {/* Caveat */}
            {analog.caveat && (
              <p className="mt-1 text-muted text-[11px] italic border-t border-line pt-1">
                {analog.caveat}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
