/**
 * Export module (spec §4.3, §5.6). CSV / PNG / PDF, each carrying the persistent
 * no-forecast line, the model version, and full run provenance (`buildRunRecord`) —
 * an exported artifact must never lose its epistemic framing. Plotly and jsPDF are
 * dynamically imported so neither anchors the initial bundle.
 */
import { buildRunRecord, MODEL_VERSION, STOCK_KEYS } from '../engine'
import type { Params, State, SimSettings, Trajectory, SummaryMetrics } from '../engine'
import { NO_FORECAST_LINE, fmt } from './format'
import { slug, triggerDownload } from './persistence'

export interface ExportContext {
  params: Params
  init: State
  settings: SimSettings
  trajectory: Trajectory
  summary: SummaryMetrics
  scenarioName: string
  /** ISO timestamp; caller supplies it (keeps this module clock-agnostic in tests). */
  timestamp?: string
}

/** Human-readable provenance lines shared by every export format. */
export function provenanceHeader(ctx: ExportContext): string[] {
  const ts = ctx.timestamp ?? new Date().toISOString()
  const record = buildRunRecord(ctx.params, ctx.init, ctx.settings, { timestamp: ts })
  return [
    NO_FORECAST_LINE,
    `Model version: ${MODEL_VERSION}`,
    `Scenario: ${ctx.scenarioName}`,
    `Generated: ${ts}`,
    `Regime: ${ctx.summary.regime}`,
    `Provenance: ${JSON.stringify(record)}`,
  ]
}

const CSV_AUX = ['f_doc', 'harm_events'] as const

/** Pure CSV builder (tested directly). Comment header + wide series table. */
export function buildCSV(ctx: ExportContext): string {
  const lines: string[] = provenanceHeader(ctx).map((l) => `# ${l}`)
  const cols = ['t', ...STOCK_KEYS, ...CSV_AUX]
  lines.push(cols.join(','))
  const { t, states, aux } = ctx.trajectory
  for (let i = 0; i < t.length; i++) {
    const row: number[] = [t[i]]
    for (const k of STOCK_KEYS) row.push(states[i][k])
    const a = aux[i] as unknown as Record<string, number>
    for (const k of CSV_AUX) row.push(a[k])
    lines.push(row.join(','))
  }
  return lines.join('\n')
}

export function exportCSV(ctx: ExportContext): void {
  const blob = new Blob([buildCSV(ctx)], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, `${slug(ctx.scenarioName)}.csv`)
}

/** Render the Plotly graph div to a PNG data URL (dynamic plotly import). */
async function plotDataUrl(gd: HTMLElement, scale = 2): Promise<{ url: string; w: number; h: number }> {
  const Plotly = (await import('plotly.js-dist-min')).default
  const w = gd.offsetWidth || 900
  const h = gd.offsetHeight || 460
  const url = await Plotly.toImage(gd as Parameters<typeof Plotly.toImage>[0], {
    format: 'png',
    width: w,
    height: h,
    scale,
  })
  return { url, w, h }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * PNG export: composite the chart image onto a canvas with a provenance footer, so
 * the no-forecast line travels with the image rather than disturbing the live chart.
 */
export async function exportPNG(gd: HTMLElement, ctx: ExportContext): Promise<void> {
  const { url } = await plotDataUrl(gd, 2)
  const img = await loadImage(url)
  const footerLines = [NO_FORECAST_LINE, `Model ${MODEL_VERSION} · ${ctx.scenarioName} · ${ctx.timestamp ?? new Date().toISOString()}`]
  const pad = 16
  const lineH = 16
  const footerH = pad + footerLines.length * lineH + pad
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height + footerH
  const cx = canvas.getContext('2d')!
  cx.fillStyle = '#ffffff'
  cx.fillRect(0, 0, canvas.width, canvas.height)
  cx.drawImage(img, 0, 0)
  cx.fillStyle = '#4d473f'
  cx.font = '12px Inter, system-ui, sans-serif'
  footerLines.forEach((l, i) => cx.fillText(l, pad, img.height + pad + (i + 1) * lineH - 4))
  await new Promise<void>((resolve) =>
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, `${slug(ctx.scenarioName)}.png`)
      resolve()
    }, 'image/png'),
  )
}

/** PDF export: title, chart image, summary metrics, and the provenance footer. */
export async function exportPDF(gd: HTMLElement, ctx: ExportContext): Promise<void> {
  const [{ jsPDF }, { url, w, h }] = await Promise.all([import('jspdf'), plotDataUrl(gd, 2)])
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 36
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('DocFlow — scenario projection', margin, y)
  y += 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(ctx.scenarioName, margin, y)
  y += 16

  // Chart image, scaled to fit page width.
  const imgW = pageW - margin * 2
  const imgH = (h / w) * imgW
  doc.addImage(url, 'PNG', margin, y, imgW, imgH)
  y += imgH + 18

  // Summary metrics.
  const s = ctx.summary
  const metrics: [string, string][] = [
    ['Regime', s.regime],
    ['Final documentation fraction', fmt(s.finalFdoc, 3)],
    ['Final tech debt', fmt(s.finalState.TD)],
    ['Final learning', fmt(s.finalState.L, 3)],
    ['Cumulative exposure', fmt(s.cumulativeExposure)],
    ['Time to tip (months)', s.timeToTip == null ? 'did not tip' : fmt(s.timeToTip)],
  ]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Summary', margin, y)
  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const [k, v] of metrics) {
    doc.text(`${k}: ${v}`, margin, y)
    y += 13
  }

  // Provenance footer.
  doc.setFontSize(8)
  doc.setTextColor(120)
  const footerY = doc.internal.pageSize.getHeight() - margin
  doc.text(NO_FORECAST_LINE, margin, footerY - 12)
  doc.text(`Model version ${MODEL_VERSION} · Generated ${ctx.timestamp ?? new Date().toISOString()}`, margin, footerY)

  doc.save(`${slug(ctx.scenarioName)}.pdf`)
}
