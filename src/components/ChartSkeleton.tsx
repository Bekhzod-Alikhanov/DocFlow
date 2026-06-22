/** Lightweight placeholder shown while the Plotly chunk (or a chart's data) loads. */
export function ChartSkeleton({ label = 'Loading chart…' }: { label?: string }) {
  return (
    <div
      className="flex h-full min-h-[120px] w-full items-center justify-center rounded-md border border-dashed border-line bg-surface/50"
      role="status"
      aria-live="polite"
    >
      <span className="animate-pulse text-[12px] text-muted">{label}</span>
    </div>
  )
}
