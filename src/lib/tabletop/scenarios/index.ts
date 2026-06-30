/**
 * Registry of all tabletop scenarios. To add a scenario: create it in its own
 * file in this directory, then import and append it to TABLETOP_SCENARIOS here.
 */
import type { TabletopScenario } from '../../../engine/tabletop'
import { productionIncident } from './production-incident'

export { productionIncident }
export const TABLETOP_SCENARIOS: TabletopScenario[] = [productionIncident]
