/**
 * Public chart entry point. Lazily loads the Plotly implementation (`PlotImpl`)
 * so plotly.js-dist-min is code-split into its own chunk and kept out of the
 * initial bundle — the app shell paints before the ~1.4 MB plotting library
 * arrives. The public name (`Plot`) and `PlotProps` are unchanged, so no call
 * site needs to know this is lazy.
 */
import { lazy, Suspense } from 'react'
import { ChartSkeleton } from '../components/ChartSkeleton'
import type { PlotProps } from './PlotImpl'

const PlotImpl = lazy(() => import('./PlotImpl'))

export type { PlotProps, PlotClickEvent } from './PlotImpl'

export function Plot(props: PlotProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <PlotImpl {...props} />
    </Suspense>
  )
}
