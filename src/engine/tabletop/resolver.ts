/**
 * Node-graph traversal for a tabletop scenario. Pure. Resolves a choice's `next`
 * (plain or flag-conditional), computes reachability, and enumerates every
 * root→terminal choice path (used by the no-dominant-path property test). The
 * enumeration is cycle-guarded: a node already on the current path is not re-entered.
 */
import type { TabletopScenario, ScenarioNode, Choice, NodeId } from './types'

export function nodeById(scenario: TabletopScenario): Map<NodeId, ScenarioNode> {
  return new Map(scenario.nodes.map((n) => [n.id, n]))
}

export function resolveNext(choice: Choice, flags: string[]): NodeId {
  const n = choice.next
  if (typeof n === 'string') return n
  return flags.includes(n.ifFlag) ? n.then : n.else
}

/** All node ids reachable from the start, following both branches of conditionals. */
export function reachableNodeIds(scenario: TabletopScenario): Set<NodeId> {
  const seen = new Set<NodeId>()
  const stack: NodeId[] = [scenario.startNodeId]
  const byId = nodeById(scenario)
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    const node = byId.get(id)
    if (!node) continue
    for (const c of node.choices) {
      const targets = typeof c.next === 'string' ? [c.next] : [c.next.then, c.next.else]
      for (const t of targets) if (!seen.has(t)) stack.push(t)
    }
  }
  return seen
}

export function findUnreachable(scenario: TabletopScenario): NodeId[] {
  const reachable = reachableNodeIds(scenario)
  return scenario.nodes.map((n) => n.id).filter((id) => !reachable.has(id))
}

/** Every root→terminal path as a list of choices. Cycle-guarded by path membership. */
export function enumeratePaths(scenario: TabletopScenario): Choice[][] {
  const byId = nodeById(scenario)
  const out: Choice[][] = []

  function walk(nodeId: NodeId, acc: Choice[], visited: Set<NodeId>) {
    const node = byId.get(nodeId)
    if (!node || node.terminal || node.choices.length === 0) {
      if (acc.length) out.push(acc)
      return
    }
    for (const choice of node.choices) {
      const accumulatedFlags = acc.flatMap((c) => c.flags).concat(choice.flags)
      const nextId = resolveNext(choice, accumulatedFlags)
      if (visited.has(nextId)) {
        out.push([...acc, choice])
        continue
      }
      walk(nextId, [...acc, choice], new Set([...visited, nodeId]))
    }
  }

  walk(scenario.startNodeId, [], new Set())
  return out
}
