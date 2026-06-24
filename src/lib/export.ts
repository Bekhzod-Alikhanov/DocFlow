/**
 * Export module (spec §4.3, §5.6). CSV / PNG / PDF, each carrying the persistent
 * no-forecast line, the model version, and full run provenance (`buildRunRecord`) —
 * an exported artifact must never lose its epistemic framing. Plotly and jsPDF are
 * dynamically imported so neither anchors the initial bundle.
 */
import {
  PRESETS,
  buildRunRecord,
  defaultSettings,
  initFromPreset,
  paramsFromPreset,
  simulate,
  MODEL_VERSION,
  STOCK_KEYS,
} from '../engine'
import type { Params, State, SimSettings, Trajectory, SummaryMetrics } from '../engine'
import {
  LAB_CHECKLIST_SECTIONS,
  NO_LEGAL_ADVICE_LINE,
  POLICY_COMPONENT_BY_ID,
  POLICY_PACKAGE_TEMPLATES,
  REGIME_MATRIX,
  SOURCE_CAVEATS,
  decisionRecommendations,
  groupedRecommendations,
  institutionalScorecard,
  presetMainCaveat,
  presetSourceNotes,
  topRegimeMatches,
} from './institutional'
import { NO_FORECAST_LINE, fmt, pct } from './format'
import { slug, triggerDownload } from './persistence'

export interface ExportContext {
  params: Params
  init: State
  settings: SimSettings
  trajectory: Trajectory
  summary: SummaryMetrics
  scenarioName: string
  presetId?: string | null
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

function mdCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
}

function scoreValue(item: ReturnType<typeof institutionalScorecard>[number]): string {
  return item.id === 'learning_yield' ? fmt(item.value * 2, 2) : pct(item.value)
}

export function buildPlaybookBrief(ctx: ExportContext): string {
  const ts = ctx.timestamp ?? new Date().toISOString()
  const score = institutionalScorecard(ctx.params, ctx.trajectory)
  const matches = topRegimeMatches(ctx.params)
  const recs = decisionRecommendations(ctx.params, ctx.trajectory)
  const grouped = groupedRecommendations(recs)
  const sourceNotes = presetSourceNotes(ctx.presetId)
  const s = ctx.summary
  const lines = [
    '# DocFlow playbook brief',
    '',
    NO_FORECAST_LINE,
    NO_LEGAL_ADVICE_LINE,
    'This export is decision-support for institutional design.',
    '',
    '## Scenario',
    '',
    `- Scenario: ${ctx.scenarioName}`,
    `- Generated: ${ts}`,
    `- Model version: ${MODEL_VERSION}`,
    `- Regime readout: ${s.regime}`,
    `- Final documented fraction: ${pct(s.finalFdoc)}`,
    `- Final learning capability: ${fmt(s.finalState.L, 1)}`,
    `- Final technical debt: ${fmt(s.finalState.TD, 1)}`,
    `- Cumulative exposure: ${fmt(s.cumulativeExposure, 1)}`,
    `- Time to tip: ${s.timeToTip == null ? 'did not tip' : `${fmt(s.timeToTip, 1)} months`}`,
    '',
    '## Institutional Scorecard',
    '',
    '| Metric | Readout | Interpretation |',
    '| --- | ---: | --- |',
    ...score.map((item) => `| ${mdCell(item.label)} | ${scoreValue(item)} | ${mdCell(item.note)} |`),
    '',
    '## Recommendations',
    '',
    '### Build Internally Now',
    '',
    ...(grouped['build-now'].length ? grouped['build-now'].map((r) => `- **${r.title}:** ${r.doNow} _(${r.confidence}; ${r.caveat})_`) : ['- No private-ordering recommendation triggered.']),
    '',
    '### Needs Regulator / Statute',
    '',
    ...(grouped['needs-law'].length ? grouped['needs-law'].map((r) => `- **${r.title}:** ${r.doNow} _(${r.confidence}; ${r.caveat})_`) : ['- No statutory/regulatory recommendation triggered.']),
    '',
    '### Watch / Caveat',
    '',
    ...(grouped.watch.length ? grouped.watch.map((r) => `- **${r.title}:** ${r.doNow} _(${r.confidence}; ${r.caveat})_`) : ['- No low-confidence caveat recommendation triggered.']),
    '',
    '## Policy Package Suggestions',
    '',
    ...POLICY_PACKAGE_TEMPLATES.map(
      (p) =>
        `- **${p.title}:** ${p.description} Components: ${p.componentIds.map((id) => POLICY_COMPONENT_BY_ID[id].title).join('; ')}.`,
    ),
    '',
    '## Private Ordering vs Law / Regulator',
    '',
    '- Private ordering can create factual-record boundaries, internal effective challenge, near-miss workflows, translation layers, and lab-funded analytic capacity.',
    '- Statute or regulator action is needed for robust safe harbor, non-admission treatment, admissibility limits, and externally binding confidentiality.',
    '',
    '## Closest Regime Matches',
    '',
    '| Regime | Sector | Transferable principle | Transferability | Caveat |',
    '| --- | --- | --- | --- | --- |',
    ...matches.map(
      (r) =>
        `| ${mdCell(r.name)} | ${mdCell(r.sector)} | ${mdCell(r.transferablePrinciple)} | ${mdCell(r.transferability)} | ${mdCell(r.caveat)} |`,
    ),
    '',
    '## Regime Comparison Matrix',
    '',
    '| Regime | Mechanism | Protected thing | Source of protection | Transferability |',
    '| --- | --- | --- | --- | --- |',
    ...REGIME_MATRIX.map(
      (r) =>
        `| ${mdCell(r.name)} | ${mdCell(r.mechanism)} | ${mdCell(r.protectedThing)} | ${mdCell(r.sourceOfProtection)} | ${mdCell(r.transferability)} |`,
    ),
    '',
    '## Source Caveats',
    '',
    ...SOURCE_CAVEATS.map((c) => `- ${c}`),
    `- ${NO_LEGAL_ADVICE_LINE}`,
    ...(sourceNotes.length ? ['', '## Active Preset Lever Source Notes', '', ...sourceNotes.map((n) => `- ${n}`)] : []),
    '',
  ]
  return lines.join('\n')
}

export function exportPlaybookBrief(ctx: ExportContext): void {
  const blob = new Blob([buildPlaybookBrief(ctx)], { type: 'text/markdown;charset=utf-8' })
  triggerDownload(blob, `${slug(ctx.scenarioName)}-playbook.md`)
}

export function buildPresetComparison(ctx: ExportContext): string {
  const ts = ctx.timestamp ?? new Date().toISOString()
  const settings = ctx.settings ?? defaultSettings()
  const lines = [
    '# DocFlow preset comparison',
    '',
    NO_FORECAST_LINE,
    NO_LEGAL_ADVICE_LINE,
    `Generated: ${ts}`,
    `Model version: ${MODEL_VERSION}`,
    '',
    '| Preset | Expected | Simulated | Safe-to-report | Private gap | Closest analog | Teaching point | Main caveat |',
    '| --- | --- | --- | ---: | ---: | --- | --- | --- |',
    ...PRESETS.map((preset) => {
      const params = paramsFromPreset(preset)
      const run = simulate(initFromPreset(preset), params, settings)
      const aux = run.trajectory.aux[run.trajectory.aux.length - 1]
      const analog = topRegimeMatches(params)[0]?.name ?? 'n/a'
      return `| ${mdCell(preset.name)} | ${preset.expectedRegime} | ${run.summary.regime} | ${pct(aux.safe_to_report_score)} | ${pct(aux.private_ordering_gap)} | ${mdCell(analog)} | ${mdCell(preset.blurb)} | ${mdCell(presetMainCaveat(preset))} |`
    }),
    '',
    '## Source Caveats',
    '',
    ...SOURCE_CAVEATS.map((c) => `- ${c}`),
    `- ${NO_LEGAL_ADVICE_LINE}`,
    '',
  ]
  return lines.join('\n')
}

export function exportPresetComparison(ctx: ExportContext): void {
  const blob = new Blob([buildPresetComparison(ctx)], { type: 'text/markdown;charset=utf-8' })
  triggerDownload(blob, 'docflow-preset-comparison.md')
}

export function buildLabChecklist(ctx: ExportContext): string {
  const recs = decisionRecommendations(ctx.params, ctx.trajectory)
  const lines = [
    '# DocFlow lab architecture checklist',
    '',
    NO_FORECAST_LINE,
    NO_LEGAL_ADVICE_LINE,
    `Scenario: ${ctx.scenarioName}`,
    `Model version: ${MODEL_VERSION}`,
    '',
    ...LAB_CHECKLIST_SECTIONS.flatMap((section) => [
      `## ${section.title}`,
      '',
      ...section.items.map((item) => `- [ ] ${item}`),
      '',
    ]),
    '## Current Scenario Recommendations',
    '',
    ...(recs.length ? recs.map((r) => `- [ ] ${r.title}: ${r.doNow}`) : ['- [ ] No triggered recommendation; preserve current safeguards and review source caveats.']),
    '',
    '## Source Caveats',
    '',
    ...SOURCE_CAVEATS.map((c) => `- ${c}`),
    '',
  ]
  return lines.join('\n')
}

export function exportLabChecklist(ctx: ExportContext): void {
  const blob = new Blob([buildLabChecklist(ctx)], { type: 'text/markdown;charset=utf-8' })
  triggerDownload(blob, `${slug(ctx.scenarioName)}-lab-checklist.md`)
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
