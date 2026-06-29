/**
 * The Aftermath verdict — computed by running the REAL engine forward on the final
 * lever configuration the player produced. recurrence_risk (hidden until now) is
 * derived from settled technical debt and the learning shortfall, then normalized
 * to 0–100. This is DocFlow judging the institution the player operated.
 */
import { simulate } from '../simulate'
import type { Regime } from '../simulate'
import type { RunState } from './applyChoice'

export interface AftermathOutcome {
  regime: Regime
  recurrenceRisk: number
  cumulativeHarm: number
  finalDebt: number
  finalLearning: number
}

export function engineForwardOutcome(state: RunState): AftermathOutcome {
  const { summary } = simulate(state.init, state.params, state.settings)
  const finalDebt = summary.finalState.TD
  const finalLearning = summary.finalState.L // 0–100
  // Recurrence rises with latent debt and falls with learned safety capability.
  const debtPressure = finalDebt / (finalDebt + 20) // saturating 0–1
  const learningShortfall = 1 - finalLearning / 100
  const raw = 100 * (0.6 * debtPressure + 0.4 * learningShortfall)
  return {
    regime: summary.regime,
    recurrenceRisk: Math.max(0, Math.min(100, raw)),
    cumulativeHarm: summary.cumulativeHarm,
    finalDebt,
    finalLearning,
  }
}
