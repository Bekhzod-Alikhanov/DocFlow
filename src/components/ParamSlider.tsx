/**
 * A single parameter control: label, live slider, numeric entry, and an
 * evidence-basis indicator (illustrative-assumption is rendered visually distinct
 * from empirical-anchor — spec §4.1). Keyboard-accessible via the native range/number
 * inputs.
 */
import type { ParamSpec } from '../engine'
import { fmt, EVIDENCE_LABEL } from '../lib/format'

const EVIDENCE_DOT: Record<string, string> = {
  'empirical-anchor': 'bg-learning',
  'expert-estimate': 'bg-accent',
  'illustrative-assumption': 'bg-estimate',
}

export function ParamSlider({
  spec,
  value,
  onChange,
}: {
  spec: ParamSpec
  value: number
  onChange: (v: number) => void
}) {
  const step = spec.max - spec.min <= 1.0001 ? 0.01 : (spec.max - spec.min) / 200
  const id = `p-${spec.id}`
  return (
    <div className="group py-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
          <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full ${EVIDENCE_DOT[spec.evidence_basis]}`}
            title={EVIDENCE_LABEL[spec.evidence_basis]}
            aria-hidden
          />
          {spec.label}
        </label>
        <input
          type="number"
          aria-label={`${spec.label} value`}
          className="w-16 rounded border border-line bg-surface px-1.5 py-0.5 text-right text-[12px] tabular-nums text-ink focus:border-accent"
          value={Number(value.toFixed(4))}
          min={spec.min}
          max={spec.max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (Number.isFinite(v)) onChange(v)
          }}
        />
      </div>
      <input
        id={id}
        type="range"
        className="docflow-range mt-1.5 w-full accent-[var(--color-accent)]"
        min={spec.min}
        max={spec.max}
        step={step}
        value={value}
        aria-valuetext={fmt(value, 3)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <p className="mt-0.5 text-[11px] leading-snug text-muted">{spec.note}</p>
    </div>
  )
}
