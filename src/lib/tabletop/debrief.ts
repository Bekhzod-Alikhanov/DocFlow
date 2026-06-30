// src/lib/tabletop/debrief.ts
/**
 * After-Action report (Markdown), reusing the export module's epistemic framing.
 * Per-chapter readout, the path taken with chapter attribution, the engine-forward
 * outcome, and a counterfactual best-practice comparison. No clock access — the
 * caller passes `timestamp`.
 */
import { NO_FORECAST_LINE } from '../format'
import { NO_LEGAL_ADVICE_LINE, REGIME_MATRIX } from '../institutional'
import type { PathScore, Choice, TabletopScenario, Chapter } from '../../engine/tabletop'

const CHAPTER_LABEL: Record<Chapter, string> = {
  1: 'Ch.1 — Liability & disclosure',
  2: 'Ch.2 — Organizational signal flow',
  3: 'Ch.3 — Institutional architecture',
  4: 'Ch.4 — Technical failure & evidence',
}

function analogName(id: string): string {
  return REGIME_MATRIX.find((r) => r.id === id)?.name ?? id
}

function pathLines(choices: Choice[]): string {
  return choices
    .map((c, i) => `${i + 1}. **[${CHAPTER_LABEL[c.chapter]}]** ${c.label} — ${c.rationale}` +
      (c.analogRefs.length ? ` _(analog: ${c.analogRefs.map(analogName).join(', ')})_` : ''))
    .join('\n')
}

function perChapterReadout(played: PathScore): string {
  const fidelityLoss = Math.round(100 - played.incident.signal_fidelity)
  return [
    `- ${CHAPTER_LABEL[2]}: signal lost ${fidelityLoss}% fidelity reaching oversight.`,
    `- ${CHAPTER_LABEL[4]}: record capturability ${Math.round(played.incident.record_capturability)} / 100; remediation completeness ${Math.round(played.incident.remediation_completeness)} / 100.`,
    `- ${CHAPTER_LABEL[1]}: evidentiary posture ${Math.round(played.incident.evidentiary_posture)} / 100; litigation pressure ${played.institutional.litigation_pressure.toFixed(2)}.`,
    `- ${CHAPTER_LABEL[3]}: private-ordering gap ${played.institutional.private_ordering_gap.toFixed(2)}; policy-scaffold dependency ${played.institutional.policy_scaffold_dependency.toFixed(2)}.`,
  ].join('\n')
}

export interface DebriefArgs {
  scenario: TabletopScenario
  played: PathScore
  counterfactual: PathScore | null
  timestamp: string
}

export function buildDebriefMarkdown(args: DebriefArgs): string {
  const { scenario, played, counterfactual, timestamp } = args
  const o = played.outcome
  const lines: string[] = [
    `# After-Action Report — ${scenario.name}`,
    '',
    `_Generated: ${timestamp}_`,
    '',
    NO_FORECAST_LINE,
    NO_LEGAL_ADVICE_LINE,
    '',
    '## The path you took',
    pathLines(played.choices),
    '',
    '## Per-chapter readout',
    perChapterReadout(played),
    '',
    '## Engine-forward long-run outcome',
    `- Regime: **${o.regime}**`,
    `- Recurrence risk: **${Math.round(o.recurrenceRisk)} / 100**`,
    `- Cumulative harm (model units): ${o.cumulativeHarm.toFixed(1)}`,
    `- Settled technical debt: ${o.finalDebt.toFixed(1)}; learning capability: ${o.finalLearning.toFixed(0)} / 100`,
  ]
  if (counterfactual) {
    lines.push(
      '',
      '## Counterfactual best-practice path',
      pathLines(counterfactual.choices),
      '',
      `Counterfactual recurrence risk: **${Math.round(counterfactual.outcome.recurrenceRisk)} / 100** ` +
        `(vs your ${Math.round(o.recurrenceRisk)} / 100); counterfactual regime: **${counterfactual.outcome.regime}**.`,
    )
  }
  return lines.join('\n')
}
