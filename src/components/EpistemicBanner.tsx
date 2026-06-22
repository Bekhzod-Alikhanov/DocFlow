/**
 * Persistent, non-dismissable no-forecast label (spec §4, first-class requirement).
 * Present on results at all times; the same line rides on every export.
 */
import { NO_FORECAST_LINE } from '../lib/format'

export function EpistemicBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 border-t border-line bg-estimate-soft/60 px-4 py-2 text-[12px] leading-snug text-ink-soft"
    >
      <span aria-hidden className="mt-px text-estimate">⚠</span>
      <p className="m-0">
        <span className="font-semibold text-ink">Not a forecast.</span> {NO_FORECAST_LINE} All
        coefficients are illustrative assumptions; the ~95% cyber-suppression figure is an{' '}
        <em>estimate</em>, not a measurement.
      </p>
    </div>
  )
}
