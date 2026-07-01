/**
 * Registry of all tabletop scenarios. To add a scenario: create it in its own
 * file in this directory, then import and append it to TABLETOP_SCENARIOS here.
 */
import type { TabletopScenario } from '../../../engine/tabletop'
import { productionIncident } from './production-incident'
import { malfunctionNearMiss } from './malfunction-near-miss'
import { redteamLatentCapability } from './redteam-latent-capability'
import { misuseAsWeapon } from './misuse-as-weapon'
import { securityPromptInjection } from './security-prompt-injection'
import { gpaiSystemicRisk } from './gpai-systemic-risk'
import { legalBottleneckVsTranslator } from './legal-bottleneck-vs-translator'

export { productionIncident }
export { malfunctionNearMiss }
export { redteamLatentCapability }
export { misuseAsWeapon }
export { securityPromptInjection }
export { gpaiSystemicRisk }
export { legalBottleneckVsTranslator }
export const TABLETOP_SCENARIOS: TabletopScenario[] = [
  productionIncident,
  malfunctionNearMiss,
  redteamLatentCapability,
  misuseAsWeapon,
  securityPromptInjection,
  gpaiSystemicRisk,
  legalBottleneckVsTranslator,
]
