/**
 * Tiny registry holding the most-recently-rendered "primary" chart's Plotly graph
 * div, so the header export menu (which is far from any chart in the tree) can grab
 * a handle for PNG/PDF export without prop-drilling. The visible main chart wins;
 * if nothing is mounted, getPrimaryGd() returns null and image export is skipped.
 */
let primaryGd: HTMLDivElement | null = null

export function setPrimaryGd(gd: HTMLDivElement): void {
  primaryGd = gd
}

export function getPrimaryGd(): HTMLDivElement | null {
  return primaryGd
}
