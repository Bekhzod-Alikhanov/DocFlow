/**
 * Hand-rolled validator for tabletop scenarios (matches the repo's `sanitizeParams`
 * style — no schema dependency). Confirms structural integrity, that every
 * leverDelta/incidentEffect key is real, that every `next` resolves, and that no
 * node is unreachable. `npm run validate:scenarios` (Task 11) calls this.
 */
import { LEVER_KEYS } from '../../engine'
import {
  INCIDENT_METER_KEYS, ROLE_KEYS, findUnreachable, nodeById,
  type TabletopScenario, type ScenarioNode, type Choice,
} from '../../engine/tabletop'

const LEVER_SET = new Set<string>(LEVER_KEYS)
const METER_SET = new Set<string>(INCIDENT_METER_KEYS)
const ROLE_SET = new Set<string>(ROLE_KEYS)

export function validateScenario(data: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  const s = data as TabletopScenario
  if (!s || typeof s !== 'object') return { ok: false, errors: ['scenario is not an object'] }
  if (!s.id || !s.name) errors.push('scenario missing id/name')
  if (!Array.isArray(s.nodes) || s.nodes.length === 0) {
    return { ok: false, errors: [...errors, 'scenario has no nodes'] }
  }

  const ids = new Set(s.nodes.map((n) => n.id))
  if (!ids.has(s.startNodeId)) errors.push(`startNodeId "${s.startNodeId}" is not a node`)

  for (const k of Object.keys(s.startLevers ?? {})) {
    if (!LEVER_SET.has(k)) errors.push(`startLevers has unknown lever "${k}"`)
  }

  const checkTarget = (t: string, where: string) => {
    if (!ids.has(t)) errors.push(`${where}: next target "${t}" does not exist`)
  }

  for (const node of s.nodes as ScenarioNode[]) {
    if (typeof node.phase !== 'number') errors.push(`node ${node.id}: phase must be a number`)
    for (const c of node.choices as Choice[]) {
      if (!ROLE_SET.has(c.role)) errors.push(`choice ${c.id}: unknown role "${c.role}"`)
      for (const k of Object.keys(c.leverDeltas)) {
        if (!LEVER_SET.has(k)) errors.push(`choice ${c.id}: leverDeltas has unknown lever "${k}"`)
      }
      for (const k of Object.keys(c.incidentEffects)) {
        if (!METER_SET.has(k)) errors.push(`choice ${c.id}: incidentEffects has unknown meter "${k}"`)
      }
      if (typeof c.next === 'string') checkTarget(c.next, `choice ${c.id}`)
      else { checkTarget(c.next.then, `choice ${c.id}.then`); checkTarget(c.next.else, `choice ${c.id}.else`) }
      if (!node.terminal && c.citations.length === 0) {
        errors.push(`node ${node.id} choice ${c.id}: non-terminal choices must carry at least one citation`)
      }
    }
  }

  for (const orphan of findUnreachable(s)) errors.push(`node "${orphan}" is unreachable`)
  // touch nodeById to keep the import meaningful and catch duplicate ids
  if (nodeById(s).size !== s.nodes.length) errors.push('duplicate node ids present')

  return { ok: errors.length === 0, errors }
}
