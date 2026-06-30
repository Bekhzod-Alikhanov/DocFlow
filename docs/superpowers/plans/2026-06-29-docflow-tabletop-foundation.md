# DocFlow Tabletop — Foundation Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third top-level **Tabletop** surface to DocFlow that runs one AI incident (the production-incident scenario) through all four playbook lenses, solo, ending in an engine-forward verdict and a "See this as a system" handoff — to the repo's production bar.

**Architecture:** A pure, framework-free `src/engine/tabletop/` layer (resolver, choice applier, Ch.2 boundary transfer fn, Ch.4 capturability, incident meters, engine-forward outcome, path scoring) reusing the existing `simulate()` and the institutional scorecard as the single source of truth for institutional meters. Scenario content is validated data in `src/lib/tabletop/`. A dedicated `tabletopStore` drives the UI in `src/views/Tabletop/` and writes to the main store only on the explicit system handoff.

**Tech Stack:** React 19, Vite 8, TypeScript (strict), Tailwind v4, Zustand 5, Vitest (Node for engine, jsdom for components via `// @vitest-environment jsdom` file directive). No new dependencies.

## Global Constraints

(Every task's requirements implicitly include this section. Values copied verbatim from the spec.)

- **`src/engine/tabletop/` stays pure** — imports only `../` (the engine) and its own modules; **no React, no DOM, no storage, no network, no `lib/`**. It never reads the clock (`Date.now`/`new Date`); any timestamp is passed in by the caller.
- **Never re-implement institutional meters.** The six institutional meters (`safe_to_report_score`, `accountability_legitimacy`, `learning_yield`, `litigation_pressure`, `private_ordering_gap`, `policy_scaffold_dependency`) are engine auxiliaries; the Tabletop reads them from `simulate(...).trajectory` and the UI displays them via the existing `institutionalScorecard()`. A parity test proves no drift.
- **Incident meters are directional 0–100 indices, not predictions.** Every movement shows a plain "why" and a "show scoring logic" panel.
- **Real citations only**, carried with caveats **verbatim**: the cyber ~95% no-written-report figure is an **estimate** (Schwarcz, Wolff & Woods, 36 Harv. J.L. & Tech. 421 (2023)); EU AI Act / PLD article numbers and dates are **pin-cite-flagged**; the AI Incident Database is **media-derived (~1,400)**.
- **No dominant path** — property-tested; the "keep-it-oral / counsel-owns-record" path wins short-term legal safety and loses learning, remediation, regulatory standing, and Aftermath recurrence. No path maxes every meter.
- **Production bar:** `engine/tabletop` ≥ 90% coverage; total test count climbs above 133; `npm run lint`, `npm run typecheck` (`tsc -b`), `npm run test:run`, and `npm run build` all green.
- **Accessibility:** keyboard-navigable, WCAG-AA, projector-legible.
- **Persistent banner:** the no-forecast + not-legal-advice `EpistemicBanner` stays pinned on the Tabletop surface.
- **Commit after every task** with a `feat:`/`test:`/`docs:` message ending in the repo's `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer. Branch is `feat/tabletop` (already created).

## Reference: exact existing APIs reused (verified against source)

- `simulate(init: State, params: Params, settings: SimSettings): { trajectory: Trajectory; summary: SummaryMetrics }` — `src/engine/simulate.ts`.
- `summary.regime: 'chilling' | 'learning' | 'contested'`; `summary.cumulativeHarm`, `summary.finalState.{TD,L,E}` — `src/engine/simulate.ts`.
- `clampParam(id: ParamKey, value: number): number`; `defaultParams(): Params`; `defaultInitState(): State`; `defaultSettings(): SimSettings` — `src/engine/registry.ts` (re-exported from `../engine`).
- `Auxiliaries` carries `safe_to_report_score`, `accountability_legitimacy`, `learning_yield`, `litigation_pressure`, `private_ordering_gap`, `policy_scaffold_dependency` — `src/engine/types.ts`.
- `institutionalScorecard(params: Params, traj: Trajectory): ScoreItem[]`; `topRegimeMatches(params): RegimeRecord[]`; `REGIME_MATRIX`, `DESIGN_PRINCIPLES`, `NO_LEGAL_ADVICE_LINE` — `src/lib/institutional.ts`.
- `NO_FORECAST_LINE`, `fmt`, `pct` — `src/lib/format.ts`.
- Store: `Mode = 'executive' | 'scientific'`, `ScientificView`, `loadScenario(...)`, `setMode(...)`, `setView(...)` — `src/state/store.ts`.
- Tab pattern — `src/components/ScientificTabs.tsx`. Surface switch — `src/App.tsx` (`Header` tablist over `(['executive','scientific'] as const)`; `main` renders by `mode`).

---

## PHASE A — Pure engine layer (`src/engine/tabletop/`)

### Task 1: Core types + incident-meter constants

**Files:**
- Create: `src/engine/tabletop/types.ts`
- Test: `src/engine/tabletop/types.test.ts`

**Interfaces:**
- Produces: `IncidentMeterKey`, `INCIDENT_METER_KEYS`, `IncidentMeters`, `initialIncidentMeters()`, `Role`, `ROLE_KEYS`, `FailureType`, `CaptureResistance`, `Chapter`, `SourceRef`, `AnalogId`, `Choice`, `ScenarioNode`, `NodeId`, `ConditionalNext`, `TabletopScenario`, `INSTITUTIONAL_METER_KEYS`, `InstitutionalMeterKey`.

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/tabletop/types.test.ts
import { describe, it, expect } from 'vitest'
import {
  INCIDENT_METER_KEYS,
  initialIncidentMeters,
  INSTITUTIONAL_METER_KEYS,
  ROLE_KEYS,
} from './types'

describe('tabletop types', () => {
  it('initialIncidentMeters has every key, all in [0,100]', () => {
    const m = initialIncidentMeters()
    for (const k of INCIDENT_METER_KEYS) {
      expect(m[k]).toBeGreaterThanOrEqual(0)
      expect(m[k]).toBeLessThanOrEqual(100)
    }
    expect(Object.keys(m).sort()).toEqual([...INCIDENT_METER_KEYS].sort())
  })

  it('exposes the six institutional meter keys and the role set', () => {
    expect(INSTITUTIONAL_METER_KEYS).toContain('safe_to_report_score')
    expect(INSTITUTIONAL_METER_KEYS).toHaveLength(6)
    expect(ROLE_KEYS).toContain('counsel')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/types.test.ts`
Expected: FAIL — cannot find module `./types`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/types.ts
/**
 * Pure type system for the Tabletop incident simulation. Imports only the engine.
 * No React, DOM, storage, or clock access (see plan Global Constraints).
 */
import type { LeverKey } from '../types'

export type Chapter = 1 | 2 | 3 | 4

export const ROLE_KEYS = ['safety_eng', 'counsel', 'policy', 'exec', 'board', 'regulator'] as const
export type Role = (typeof ROLE_KEYS)[number]

/** Ch.4 failure taxonomy and capture-resistance (how recordable the evidence is). */
export type FailureType = 'security' | 'misuse' | 'malfunction'
export type CaptureResistance = 'silent' | 'irreproducible' | 'distributional' | 'environment_dependent'

/** The six institutional meters — engine auxiliaries, never re-scored here. */
export const INSTITUTIONAL_METER_KEYS = [
  'safe_to_report_score',
  'accountability_legitimacy',
  'learning_yield',
  'litigation_pressure',
  'private_ordering_gap',
  'policy_scaffold_dependency',
] as const
export type InstitutionalMeterKey = (typeof INSTITUTIONAL_METER_KEYS)[number]

/** The new incident meters — directional 0–100 indices, each chapter-tagged. */
export const INCIDENT_METER_KEYS = [
  'signal_fidelity', // Ch.2
  'record_capturability', // Ch.4
  'regulatory_timeliness', // Ch.1/3
  'board_oversight_visibility', // Ch.2
  'evidentiary_posture', // Ch.1 (higher = more defensible objective record)
  'remediation_completeness', // Ch.4
  'recurrence_risk', // Ch.4 (hidden until Aftermath)
] as const
export type IncidentMeterKey = (typeof INCIDENT_METER_KEYS)[number]
export type IncidentMeters = Record<IncidentMeterKey, number>

/** Baseline at scenario start: signal intact, nothing captured/remediated yet. */
export function initialIncidentMeters(): IncidentMeters {
  return {
    signal_fidelity: 100,
    record_capturability: 50,
    regulatory_timeliness: 50,
    board_oversight_visibility: 0,
    evidentiary_posture: 50,
    remediation_completeness: 0,
    recurrence_risk: 50,
  }
}

export interface SourceRef {
  /** Citation text, e.g. "PSQIA, 42 U.S.C. §§ 299b-21 to 299b-26". */
  text: string
  /** Verbatim reliability caveat to surface in-app, when applicable. */
  caveat?: string
}

export type AnalogId = string // matches REGIME_MATRIX ids: 'asrs-asap' | 'psqia' | ...

export type NodeId = string

export interface ConditionalNext {
  /** Choose the next node by a flag the run has accumulated. */
  ifFlag: string
  then: NodeId
  else: NodeId
}

export interface Choice {
  id: string
  label: string
  role: Role
  chapter: Chapter
  rationale: string
  leverDeltas: Partial<Record<LeverKey, number>>
  incidentEffects: Partial<IncidentMeters>
  flags: string[]
  analogRefs: AnalogId[]
  citations: SourceRef[]
  next: NodeId | ConditionalNext
}

export interface ScenarioNode {
  id: NodeId
  phase: number
  chapter: Chapter
  title: string
  /** Situation text shown to the player. */
  situation: string
  choices: Choice[]
  /** True only for the terminal Aftermath node (no choices; runs the engine forward). */
  terminal?: boolean
}

export interface TabletopScenario {
  id: string
  name: string
  blurb: string
  failureType: FailureType
  captureResistance: CaptureResistance
  /** 0–1; raises normalization-of-deviance and lowers capturability over time. */
  retrainCadence: number
  /** Levers the scenario starts from (sparse overrides on engine defaults). */
  startLevers: Partial<Record<LeverKey, number>>
  startNodeId: NodeId
  nodes: ScenarioNode[]
  chapters: Chapter[]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/types.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/types.ts src/engine/tabletop/types.test.ts
git commit -m "feat: tabletop core types and incident-meter constants"
```

---

### Task 2: Ch.2 boundary transfer function

**Files:**
- Create: `src/engine/tabletop/boundary.ts`
- Test: `src/engine/tabletop/boundary.test.ts`

**Interfaces:**
- Consumes: `Params` from `../types`.
- Produces: `tieStrengthFactor(p, hasIndependentChannel)`, `translationLoss(p, legalOwnsRecord)`, `normalizationProbability(p, retrainCadence)`, `crossBoundary(fidelity, p, opts): number`.

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/tabletop/boundary.test.ts
import { describe, it, expect } from 'vitest'
import { defaultParams } from '../registry'
import { tieStrengthFactor, translationLoss, normalizationProbability, crossBoundary } from './boundary'

const P = defaultParams()

describe('Ch.2 boundary transfer function', () => {
  it('tie strength rises with an independent review channel, stays in (0,1]', () => {
    const without = tieStrengthFactor(P, false)
    const withCh = tieStrengthFactor(P, true)
    expect(withCh).toBeGreaterThan(without)
    expect(without).toBeGreaterThan(0)
    expect(withCh).toBeLessThanOrEqual(1)
  })

  it('translation loss is higher when legal owns the record, in [0,1]', () => {
    const flowing = translationLoss(P, false)
    const bottleneck = translationLoss(P, true)
    expect(bottleneck).toBeGreaterThan(flowing)
    expect(flowing).toBeGreaterThanOrEqual(0)
    expect(bottleneck).toBeLessThanOrEqual(1)
  })

  it('normalization probability rises with retrain cadence, falls with just_culture, in [0,1]', () => {
    const lowCadence = normalizationProbability(P, 0.1)
    const highCadence = normalizationProbability(P, 0.9)
    expect(highCadence).toBeGreaterThan(lowCadence)
    const strongCulture = normalizationProbability({ ...P, just_culture: 0.95 }, 0.9)
    expect(strongCulture).toBeLessThan(highCadence)
    expect(lowCadence).toBeGreaterThanOrEqual(0)
    expect(highCadence).toBeLessThanOrEqual(1)
  })

  it('crossing a boundary never increases fidelity and never goes negative', () => {
    const next = crossBoundary(80, P, { hasIndependentChannel: false, legalOwnsRecord: true, retrainCadence: 0.6 })
    expect(next).toBeLessThanOrEqual(80)
    expect(next).toBeGreaterThanOrEqual(0)
  })

  it('a stronger learning architecture preserves more fidelity', () => {
    const weak = crossBoundary(80, P, { hasIndependentChannel: false, legalOwnsRecord: true, retrainCadence: 0.6 })
    const strong = crossBoundary(
      80,
      { ...P, near_miss_tier: 0.9, effective_challenge: 0.9, intermediary_capacity: 0.9, just_culture: 0.9 },
      { hasIndependentChannel: true, legalOwnsRecord: false, retrainCadence: 0.6 },
    )
    expect(strong).toBeGreaterThan(weak)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/boundary.test.ts`
Expected: FAIL — cannot find module `./boundary`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/boundary.ts
/**
 * Ch.2 organizational-boundary mechanics (Røvik translation loss; Hansen tie
 * strength; Vaughan/Perrow normalization of deviance). A signal crossing a
 * professional handoff loses fidelity; a true warning can be read as routine noise.
 * Pure: same inputs → same outputs. Coefficients are illustrative (see TABLETOP.md).
 */
import type { Params } from '../types'

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/** Tie strength in (0,1]: weak ties cannot carry tacit/complex knowledge. */
export function tieStrengthFactor(p: Params, hasIndependentChannel: boolean): number {
  const base =
    0.45 +
    0.18 * p.recipient_enforcer_separation +
    0.14 * p.near_miss_tier +
    0.13 * p.effective_challenge +
    0.10 * p.intermediary_capacity
  return clamp01(base + (hasIndependentChannel ? 0.15 : 0))
}

/** Detail omitted in transit, in [0,1]; legal-as-bottleneck inflates it. */
export function translationLoss(p: Params, legalOwnsRecord: boolean): number {
  const reducers = 0.22 * p.translation_layer + 0.12 * p.original_records_boundary
  const base = 0.30 - reducers
  return clamp01(base + (legalOwnsRecord ? 0.25 : 0))
}

/** Probability a true warning is classified as noise, in [0,1]. */
export function normalizationProbability(p: Params, retrainCadence: number): number {
  const raw = 0.15 + 0.55 * clamp01(retrainCadence) - 0.35 * p.just_culture - 0.15 * p.near_miss_tier
  return clamp01(raw)
}

export interface CrossOpts {
  hasIndependentChannel: boolean
  legalOwnsRecord: boolean
  retrainCadence: number
}

/**
 * Transfer one boundary: fidelity_next = fidelity · tie · (1 − loss), then a
 * normalization haircut (the warning partly read as noise). Monotone & bounded.
 */
export function crossBoundary(fidelity: number, p: Params, opts: CrossOpts): number {
  const tie = tieStrengthFactor(p, opts.hasIndependentChannel)
  const loss = translationLoss(p, opts.legalOwnsRecord)
  const norm = normalizationProbability(p, opts.retrainCadence)
  const transferred = fidelity * tie * (1 - loss)
  const afterNorm = transferred * (1 - 0.5 * norm)
  return Math.max(0, Math.min(fidelity, afterNorm))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/boundary.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/boundary.ts src/engine/tabletop/boundary.test.ts
git commit -m "feat: Ch.2 boundary transfer fn (tie strength, translation loss, normalization)"
```

---

### Task 3: Ch.4 record-capturability function

**Files:**
- Create: `src/engine/tabletop/capturability.ts`
- Test: `src/engine/tabletop/capturability.test.ts`

**Interfaces:**
- Consumes: `CaptureResistance`, `FailureType` from `./types`.
- Produces: `recordCapturability(opts): number` where `opts: { resistance: CaptureResistance; retrainCadence: number; stateSnapshotted: boolean; pipelineCaptured: boolean }` → 0–100.

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/tabletop/capturability.test.ts
import { describe, it, expect } from 'vitest'
import { recordCapturability } from './capturability'

describe('Ch.4 record capturability', () => {
  it('is 0–100 and rises when state is snapshotted before retraining', () => {
    const skipped = recordCapturability({ resistance: 'irreproducible', retrainCadence: 0.7, stateSnapshotted: false, pipelineCaptured: false })
    const captured = recordCapturability({ resistance: 'irreproducible', retrainCadence: 0.7, stateSnapshotted: true, pipelineCaptured: true })
    expect(captured).toBeGreaterThan(skipped)
    expect(skipped).toBeGreaterThanOrEqual(0)
    expect(captured).toBeLessThanOrEqual(100)
  })

  it('silent/irreproducible failures are harder to capture than distributional', () => {
    const opts = { retrainCadence: 0.5, stateSnapshotted: true, pipelineCaptured: true } as const
    const silent = recordCapturability({ resistance: 'silent', ...opts })
    const distributional = recordCapturability({ resistance: 'distributional', ...opts })
    expect(silent).toBeLessThan(distributional)
  })

  it('high retrain cadence erodes capturability when nothing was snapshotted', () => {
    const slow = recordCapturability({ resistance: 'malfunction' as never, retrainCadence: 0.1, stateSnapshotted: false, pipelineCaptured: false })
    const fast = recordCapturability({ resistance: 'malfunction' as never, retrainCadence: 0.95, stateSnapshotted: false, pipelineCaptured: false })
    expect(fast).toBeLessThan(slow)
  })
})
```

> Note: `'malfunction'` is a `FailureType`, not a `CaptureResistance`; the `as never` in the cadence test is intentional — `recordCapturability` keys off `resistance`, and the test only varies cadence. The implementation maps any unknown resistance to a mid base, so this is safe; if the strict compiler rejects `as never`, change those two calls to `resistance: 'environment_dependent'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/capturability.test.ts`
Expected: FAIL — cannot find module `./capturability`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/capturability.ts
/**
 * Ch.4 record-capturability: ML failures resist faithful recording. Capturability
 * starts from a resistance-dependent base, decays with retrain cadence when no
 * snapshot was taken, and is restored by capturing state/pipeline before the next
 * training run. 0–100, directional. Coefficients illustrative (see TABLETOP.md).
 */
import type { CaptureResistance } from './types'

const RESISTANCE_BASE: Record<CaptureResistance, number> = {
  silent: 30,
  irreproducible: 35,
  environment_dependent: 45,
  distributional: 55,
}

export interface CapturabilityOpts {
  resistance: CaptureResistance
  retrainCadence: number
  stateSnapshotted: boolean
  pipelineCaptured: boolean
}

export function recordCapturability(opts: CapturabilityOpts): number {
  const base = RESISTANCE_BASE[opts.resistance] ?? 45
  const captureBoost = (opts.stateSnapshotted ? 30 : 0) + (opts.pipelineCaptured ? 15 : 0)
  // Without a snapshot, retraining overwrites the evidence; with one, the snapshot holds.
  const cadence = Math.min(1, Math.max(0, opts.retrainCadence))
  const erosion = opts.stateSnapshotted ? 0 : 40 * cadence
  return Math.max(0, Math.min(100, base + captureBoost - erosion))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/capturability.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/capturability.ts src/engine/tabletop/capturability.test.ts
git commit -m "feat: Ch.4 record-capturability function"
```

---

### Task 4: Institutional-meter bridge (`meters.ts`) + parity

**Files:**
- Create: `src/engine/tabletop/meters.ts`
- Test: `src/engine/tabletop/meters.test.ts`

**Interfaces:**
- Consumes: `simulate` from `../simulate`; `Params, State, SimSettings, Trajectory` from `../types`; `INSTITUTIONAL_METER_KEYS, InstitutionalMeterKey` from `./types`.
- Produces: `institutionalMeters(traj: Trajectory): Record<InstitutionalMeterKey, number>`; `runConfig(params, init, settings)` convenience returning `{ traj, institutional }`.

- [ ] **Step 1: Write the failing test (includes the no-drift parity assertion)**

```ts
// src/engine/tabletop/meters.test.ts
import { describe, it, expect } from 'vitest'
import { defaultParams, defaultInitState, defaultSettings } from '../registry'
import { simulate } from '../simulate'
import { institutionalScorecard } from '../../lib/institutional'
import { institutionalMeters } from './meters'
import { INSTITUTIONAL_METER_KEYS } from './types'

describe('institutional-meter bridge', () => {
  const params = { ...defaultParams(), workflow_protection: 0.7, safe_harbor_non_admission: 0.6 }
  const init = defaultInitState()
  const settings = defaultSettings()
  const { trajectory } = simulate(init, params, settings)

  it('reads all six institutional meters straight from final auxiliaries', () => {
    const m = institutionalMeters(trajectory)
    const aux = trajectory.aux[trajectory.aux.length - 1]
    for (const k of INSTITUTIONAL_METER_KEYS) {
      expect(m[k]).toBe(aux[k])
    }
  })

  it('matches lib institutionalScorecard with no drift (single source of truth)', () => {
    const m = institutionalMeters(trajectory)
    const card = institutionalScorecard(params, trajectory)
    const byId = Object.fromEntries(card.map((c) => [c.id, c.value]))
    // institutionalScorecard displays learning_yield scaled (min(1, raw/2)); all others 1:1.
    expect(byId.safe_to_report_score).toBe(m.safe_to_report_score)
    expect(byId.accountability_legitimacy).toBe(m.accountability_legitimacy)
    expect(byId.litigation_pressure).toBe(m.litigation_pressure)
    expect(byId.private_ordering_gap).toBe(m.private_ordering_gap)
    expect(byId.policy_scaffold_dependency).toBe(m.policy_scaffold_dependency)
    expect(byId.learning_yield).toBe(Math.min(1, m.learning_yield / 2))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/meters.test.ts`
Expected: FAIL — cannot find module `./meters`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/meters.ts
/**
 * Bridge to the institutional meters. These are engine auxiliaries — we read them
 * from the final step of a trajectory and never re-score them here. The UI formats
 * them via lib/institutional `institutionalScorecard`; meters.test.ts proves the two
 * agree (the learning_yield display scaling aside), so there is no second scoring system.
 */
import type { Params, State, SimSettings, Trajectory } from '../types'
import { simulate } from '../simulate'
import { INSTITUTIONAL_METER_KEYS, type InstitutionalMeterKey } from './types'

export function institutionalMeters(traj: Trajectory): Record<InstitutionalMeterKey, number> {
  const aux = traj.aux[traj.aux.length - 1]
  const out = {} as Record<InstitutionalMeterKey, number>
  for (const k of INSTITUTIONAL_METER_KEYS) out[k] = aux[k]
  return out
}

export function runConfig(params: Params, init: State, settings: SimSettings) {
  const { trajectory } = simulate(init, params, settings)
  return { traj: trajectory, institutional: institutionalMeters(trajectory) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/meters.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/meters.ts src/engine/tabletop/meters.test.ts
git commit -m "feat: institutional-meter bridge with no-drift parity test"
```

---

### Task 5: Choice applier (`applyChoice.ts`)

**Files:**
- Create: `src/engine/tabletop/applyChoice.ts`
- Test: `src/engine/tabletop/applyChoice.test.ts`

**Interfaces:**
- Consumes: `clampParam` from `../registry`; `Params, State, SimSettings, LeverKey` from `../types`; `Choice, IncidentMeters` from `./types`.
- Produces: `RunState` interface `{ params, init, settings, flags, incident, retrainCadence, failureType, captureResistance }`; `applyChoice(state: RunState, choice: Choice): RunState` (pure — returns a new object; for Ch.2 boundary choices it calls `crossBoundary`).

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/tabletop/applyChoice.test.ts
import { describe, it, expect } from 'vitest'
import { defaultParams, defaultInitState, defaultSettings } from '../registry'
import { initialIncidentMeters, type Choice } from './types'
import { applyChoice, type RunState } from './applyChoice'

function baseState(): RunState {
  return {
    params: defaultParams(),
    init: defaultInitState(),
    settings: defaultSettings(),
    flags: [],
    incident: initialIncidentMeters(),
    retrainCadence: 0.6,
    failureType: 'malfunction',
    captureResistance: 'irreproducible',
  }
}

const captureChoice: Choice = {
  id: 'snapshot', label: 'Snapshot model state', role: 'safety_eng', chapter: 4,
  rationale: 'Preserve weights and feature distributions before the next training run.',
  leverDeltas: { original_records_boundary: 0.2 },
  incidentEffects: {}, flags: ['state_snapshotted'], analogRefs: [], citations: [], next: 'n2',
}

const boundaryBottleneck: Choice = {
  id: 'legal-owns', label: 'Route everything through counsel', role: 'counsel', chapter: 2,
  rationale: 'Counsel owns the record; fewer records get written.',
  leverDeltas: { privilege_strength: 0.2 },
  incidentEffects: {}, flags: ['legal_owns_record'], analogRefs: ['cyber'], citations: [], next: 'n3',
}

describe('applyChoice', () => {
  it('is pure: does not mutate the input state', () => {
    const s = baseState()
    const before = JSON.stringify(s)
    applyChoice(s, captureChoice)
    expect(JSON.stringify(s)).toBe(before)
  })

  it('folds clamped lever deltas and records flags', () => {
    const next = applyChoice(baseState(), captureChoice)
    expect(next.params.original_records_boundary).toBeCloseTo(defaultParams().original_records_boundary + 0.2)
    expect(next.flags).toContain('state_snapshotted')
  })

  it('clamps levers into [0,1]', () => {
    const s = baseState()
    s.params = { ...s.params, privilege_strength: 0.95 }
    const next = applyChoice(s, { ...boundaryBottleneck, leverDeltas: { privilege_strength: 0.5 } })
    expect(next.params.privilege_strength).toBe(1)
  })

  it('recomputes record_capturability from capture flags', () => {
    const next = applyChoice(baseState(), captureChoice)
    expect(next.incident.record_capturability).toBeGreaterThan(initialIncidentMeters().record_capturability - 1)
  })

  it('drops signal fidelity through a Ch.2 boundary handoff', () => {
    const next = applyChoice(baseState(), boundaryBottleneck)
    expect(next.incident.signal_fidelity).toBeLessThan(100)
  })

  it('applies explicit incidentEffects deltas, clamped to 0–100', () => {
    const choice: Choice = { ...captureChoice, incidentEffects: { evidentiary_posture: 30, regulatory_timeliness: -200 } }
    const next = applyChoice(baseState(), choice)
    expect(next.incident.evidentiary_posture).toBe(80)
    expect(next.incident.regulatory_timeliness).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/applyChoice.test.ts`
Expected: FAIL — cannot find module `./applyChoice`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/applyChoice.ts
/**
 * Pure reducer: apply one player choice to the run state. Lever deltas fold into
 * the working Params (clamped via the engine registry); explicit incidentEffects
 * adjust incident meters; flags accumulate. Ch.2 boundary choices recompute
 * signal_fidelity via the transfer fn; capture flags recompute record_capturability.
 */
import { clampParam } from '../registry'
import type { Params, State, SimSettings, LeverKey } from '../types'
import { type Choice, type IncidentMeters, type FailureType, type CaptureResistance, INCIDENT_METER_KEYS } from './types'
import { crossBoundary } from './boundary'
import { recordCapturability } from './capturability'

export interface RunState {
  params: Params
  init: State
  settings: SimSettings
  flags: string[]
  incident: IncidentMeters
  retrainCadence: number
  failureType: FailureType
  captureResistance: CaptureResistance
}

function clampMeter(x: number): number {
  return Math.max(0, Math.min(100, x))
}

export function applyChoice(state: RunState, choice: Choice): RunState {
  // Fold clamped lever deltas.
  const params = { ...state.params }
  for (const [k, delta] of Object.entries(choice.leverDeltas) as [LeverKey, number][]) {
    params[k] = clampParam(k, params[k] + delta)
  }

  const flags = choice.flags.length ? Array.from(new Set([...state.flags, ...choice.flags])) : state.flags.slice()

  // Apply explicit incident effects.
  const incident = { ...state.incident }
  for (const key of INCIDENT_METER_KEYS) {
    const d = choice.incidentEffects[key]
    if (typeof d === 'number') incident[key] = clampMeter(incident[key] + d)
  }

  // Ch.2 handoff: degrade signal fidelity.
  if (choice.chapter === 2) {
    incident.signal_fidelity = clampMeter(
      crossBoundary(incident.signal_fidelity, params, {
        hasIndependentChannel: flags.includes('independent_review_channel'),
        legalOwnsRecord: flags.includes('legal_owns_record'),
        retrainCadence: state.retrainCadence,
      }),
    )
    incident.board_oversight_visibility = clampMeter(incident.signal_fidelity)
  }

  // Ch.4 capture: recompute capturability from accumulated capture flags.
  if (flags.includes('state_snapshotted') || flags.includes('pipeline_captured')) {
    incident.record_capturability = recordCapturability({
      resistance: state.captureResistance,
      retrainCadence: state.retrainCadence,
      stateSnapshotted: flags.includes('state_snapshotted'),
      pipelineCaptured: flags.includes('pipeline_captured'),
    })
  }

  return { ...state, params, flags, incident }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/applyChoice.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/applyChoice.ts src/engine/tabletop/applyChoice.test.ts
git commit -m "feat: pure choice applier (levers, flags, incident meters, Ch.2/Ch.4 effects)"
```

---

### Task 6: Engine-forward Aftermath outcome (`outcome.ts`)

**Files:**
- Create: `src/engine/tabletop/outcome.ts`
- Test: `src/engine/tabletop/outcome.test.ts`

**Interfaces:**
- Consumes: `simulate` from `../simulate`; `RunState` from `./applyChoice`.
- Produces: `AftermathOutcome { regime: Regime; recurrenceRisk: number; cumulativeHarm: number; finalDebt: number; finalLearning: number }`; `engineForwardOutcome(state: RunState): AftermathOutcome`.

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/tabletop/outcome.test.ts
import { describe, it, expect } from 'vitest'
import { defaultParams, defaultInitState, defaultSettings } from '../registry'
import { simulate } from '../simulate'
import { initialIncidentMeters } from './types'
import { engineForwardOutcome } from './outcome'
import type { RunState } from './applyChoice'

function stateWith(params = defaultParams()): RunState {
  return {
    params, init: defaultInitState(), settings: defaultSettings(),
    flags: [], incident: initialIncidentMeters(), retrainCadence: 0.6,
    failureType: 'malfunction', captureResistance: 'irreproducible',
  }
}

describe('engine-forward Aftermath', () => {
  it('regime equals the real engine summary for the final config (parity)', () => {
    const s = stateWith()
    const expected = simulate(s.init, s.params, s.settings).summary.regime
    expect(engineForwardOutcome(s).regime).toBe(expected)
  })

  it('recurrence risk is 0–100 and higher for a chilling config than a learning one', () => {
    const chilling = stateWith({ ...defaultParams(), privilege_strength: 0.9, pld_penalty: 0.8, workflow_protection: 0.05, safe_harbor_non_admission: 0.05 })
    const learning = stateWith({ ...defaultParams(), workflow_protection: 0.9, safe_harbor_non_admission: 0.9, effective_challenge: 0.9, translation_layer: 0.9, just_culture: 0.9 })
    const rc = engineForwardOutcome(chilling).recurrenceRisk
    const rl = engineForwardOutcome(learning).recurrenceRisk
    expect(rc).toBeGreaterThan(rl)
    expect(rc).toBeLessThanOrEqual(100)
    expect(rl).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/outcome.test.ts`
Expected: FAIL — cannot find module `./outcome`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/outcome.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/outcome.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/outcome.ts src/engine/tabletop/outcome.test.ts
git commit -m "feat: engine-forward Aftermath outcome with recurrence-risk derivation"
```

---

### Task 7: Node-graph resolver (`resolver.ts`)

**Files:**
- Create: `src/engine/tabletop/resolver.ts`
- Test: `src/engine/tabletop/resolver.test.ts`

**Interfaces:**
- Consumes: `TabletopScenario, ScenarioNode, Choice, NodeId, ConditionalNext` from `./types`; `RunState` from `./applyChoice`.
- Produces: `nodeById(scenario): Map<NodeId, ScenarioNode>`; `resolveNext(choice: Choice, flags: string[]): NodeId`; `reachableNodeIds(scenario): Set<NodeId>`; `findUnreachable(scenario): NodeId[]`; `enumeratePaths(scenario): Choice[][]` (every root→terminal choice sequence; guarded against cycles).

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/tabletop/resolver.test.ts
import { describe, it, expect } from 'vitest'
import type { TabletopScenario } from './types'
import { resolveNext, findUnreachable, enumeratePaths } from './resolver'

const mini: TabletopScenario = {
  id: 'mini', name: 'Mini', blurb: '', failureType: 'malfunction', captureResistance: 'silent',
  retrainCadence: 0.5, startLevers: {}, startNodeId: 'a', chapters: [1, 2],
  nodes: [
    { id: 'a', phase: 1, chapter: 1, title: 'A', situation: '', choices: [
      { id: 'a1', label: '', role: 'safety_eng', chapter: 1, rationale: '', leverDeltas: {}, incidentEffects: {}, flags: ['x'], analogRefs: [], citations: [], next: 'b' },
      { id: 'a2', label: '', role: 'safety_eng', chapter: 1, rationale: '', leverDeltas: {}, incidentEffects: {}, flags: [], analogRefs: [], citations: [], next: { ifFlag: 'x', then: 'b', else: 'end' } },
    ] },
    { id: 'b', phase: 2, chapter: 2, title: 'B', situation: '', choices: [
      { id: 'b1', label: '', role: 'safety_eng', chapter: 2, rationale: '', leverDeltas: {}, incidentEffects: {}, flags: [], analogRefs: [], citations: [], next: 'end' },
    ] },
    { id: 'end', phase: 3, chapter: 2, title: 'End', situation: '', choices: [], terminal: true },
    { id: 'orphan', phase: 9, chapter: 1, title: 'Orphan', situation: '', choices: [], terminal: true },
  ],
}

describe('resolver', () => {
  it('resolves a plain next and a conditional next by flag', () => {
    expect(resolveNext(mini.nodes[0].choices[0], [])).toBe('b')
    expect(resolveNext(mini.nodes[0].choices[1], ['x'])).toBe('b')
    expect(resolveNext(mini.nodes[0].choices[1], [])).toBe('end')
  })

  it('flags unreachable nodes', () => {
    expect(findUnreachable(mini)).toEqual(['orphan'])
  })

  it('enumerates every root→terminal path', () => {
    const paths = enumeratePaths(mini)
    expect(paths.length).toBeGreaterThanOrEqual(2)
    for (const p of paths) expect(p.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/resolver.test.ts`
Expected: FAIL — cannot find module `./resolver`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/resolver.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/resolver.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/resolver.ts src/engine/tabletop/resolver.test.ts
git commit -m "feat: node-graph resolver (next, reachability, path enumeration)"
```

---

### Task 8: Path scoring + no-dominant-path (`score.ts`)

**Files:**
- Create: `src/engine/tabletop/score.ts`
- Test: `src/engine/tabletop/score.test.ts`

**Interfaces:**
- Consumes: `enumeratePaths, resolveNext, nodeById` from `./resolver`; `applyChoice, RunState` from `./applyChoice`; `engineForwardOutcome` from `./outcome`; `institutionalMeters` from `./meters`; `simulate` from `../simulate`; `defaultParams/defaultInitState/defaultSettings` from `../registry`; scenario types from `./types`.
- Produces: `PathScore { choices: Choice[]; institutional: Record<InstitutionalMeterKey,number>; incident: IncidentMeters; outcome: AftermathOutcome; legalSafety: number }`; `initialRunState(scenario): RunState`; `playPath(scenario, choices): RunState`; `scorePath(scenario, choices): PathScore`; `scoreAllPaths(scenario): PathScore[]`; `hasDominantPath(scenario): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/tabletop/score.test.ts
import { describe, it, expect } from 'vitest'
import type { TabletopScenario } from './types'
import { scoreAllPaths, hasDominantPath, initialRunState } from './score'

// Two-path scenario: "oral" maxes legal safety but tanks learning/remediation;
// "translation" inverts the trade-off. Neither dominates the other.
const scenario: TabletopScenario = {
  id: 'trade', name: 'Trade', blurb: '', failureType: 'malfunction', captureResistance: 'irreproducible',
  retrainCadence: 0.6, startLevers: { workflow_protection: 0.4, safe_harbor_non_admission: 0.4 }, startNodeId: 'root', chapters: [1, 2, 3, 4],
  nodes: [
    { id: 'root', phase: 1, chapter: 1, title: 'Routing', situation: '', choices: [
      { id: 'oral', label: 'Keep it oral; counsel owns the record', role: 'counsel', chapter: 2, rationale: '',
        leverDeltas: { privilege_strength: 0.4, workflow_protection: -0.3, safe_harbor_non_admission: -0.3, translation_layer: -0.2, effective_challenge: -0.2 },
        incidentEffects: { remediation_completeness: -10 }, flags: ['legal_owns_record'], analogRefs: ['cyber'], citations: [], next: 'oralEnd' },
      { id: 'translate', label: 'Two-track: protected workflow + factual core', role: 'safety_eng', chapter: 3, rationale: '',
        leverDeltas: { workflow_protection: 0.4, safe_harbor_non_admission: 0.4, translation_layer: 0.4, effective_challenge: 0.4, original_records_boundary: 0.3, just_culture: 0.3 },
        incidentEffects: { remediation_completeness: 40, regulatory_timeliness: 20 }, flags: ['two_track', 'independent_review_channel'], analogRefs: ['psqia'], citations: [], next: 'transEnd' },
    ] },
    { id: 'oralEnd', phase: 8, chapter: 4, title: 'Aftermath', situation: '', choices: [], terminal: true },
    { id: 'transEnd', phase: 8, chapter: 4, title: 'Aftermath', situation: '', choices: [], terminal: true },
  ],
}

describe('path scoring & no-dominant-path', () => {
  it('initialRunState seeds levers from the scenario', () => {
    const s = initialRunState(scenario)
    expect(s.params.workflow_protection).toBeCloseTo(0.4)
  })

  it('the oral path wins short-term *perceived* legal safety', () => {
    const scored = scoreAllPaths(scenario)
    const oral = scored.find((p) => p.choices[0].id === 'oral')!
    const translate = scored.find((p) => p.choices[0].id === 'translate')!
    // legalSafety is the felt, short-term shield (privilege + off-the-record), NOT
    // the durable litigation_pressure. The oral path maximizes it — that is the lure.
    expect(oral.legalSafety).toBeGreaterThan(translate.legalSafety)
  })

  it('decoupling: the oral path does NOT also win durable litigation pressure (privilege-first is a trap)', () => {
    const scored = scoreAllPaths(scenario)
    const oral = scored.find((p) => p.choices[0].id === 'oral')!
    const translate = scored.find((p) => p.choices[0].id === 'translate')!
    // Gutting the protective workflow raises real discoverability more than privilege lowers it,
    // so the two-track path ends with LOWER litigation pressure than the oral path.
    expect(translate.institutional.litigation_pressure).toBeLessThan(oral.institutional.litigation_pressure)
  })

  it('the oral path loses on learning, remediation, and recurrence', () => {
    const scored = scoreAllPaths(scenario)
    const oral = scored.find((p) => p.choices[0].id === 'oral')!
    const translate = scored.find((p) => p.choices[0].id === 'translate')!
    expect(translate.institutional.learning_yield).toBeGreaterThan(oral.institutional.learning_yield)
    expect(translate.incident.remediation_completeness).toBeGreaterThan(oral.incident.remediation_completeness)
    expect(translate.outcome.recurrenceRisk).toBeLessThan(oral.outcome.recurrenceRisk)
  })

  it('no path dominates every meter (the core thesis property)', () => {
    expect(hasDominantPath(scenario)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/score.test.ts`
Expected: FAIL — cannot find module `./score`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/score.ts
/**
 * Score every terminal path of a scenario and test the central thesis property:
 * NO path is best on every meter. "Good" meters (higher is better) include the
 * five positive institutional meters, the six positive incident meters, the durable
 * exposure axis (1 − litigation_pressure), and the short-term PERCEIVED legal shield
 * (`legalSafety`); recurrence_risk is folded in inverted. A path "dominates" if it is
 * ≥ all others on every good meter and > on at least one.
 *
 * `legalSafety` is deliberately decoupled from litigation_pressure. The playbook's
 * lesson (cyber privilege-first analog) is that asserting privilege and keeping
 * analysis off the record FEELS protective now, yet is fragile and degrades the safety
 * architecture — so the durable litigation_pressure can move the opposite way. The
 * "keep-it-oral" path wins the perceived shield and loses the durable axis: that split
 * is the trap, and it is why no path dominates.
 */
import type { LeverKey } from '../types'
import { defaultParams, defaultInitState, defaultSettings } from '../registry'
import {
  type TabletopScenario, type Choice, type IncidentMeters,
  type InstitutionalMeterKey, initialIncidentMeters,
} from './types'
import { applyChoice, type RunState } from './applyChoice'
import { engineForwardOutcome, type AftermathOutcome } from './outcome'
import { institutionalMeters } from './meters'
import { simulate } from '../simulate'
import { enumeratePaths } from './resolver'

export interface PathScore {
  choices: Choice[]
  institutional: Record<InstitutionalMeterKey, number>
  incident: IncidentMeters
  outcome: AftermathOutcome
  /** Short-term *perceived* legal shield (0–1) — felt safety of asserting privilege
   *  and keeping analysis off the record. NOT the durable litigation_pressure. */
  legalSafety: number
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/**
 * The short-term *perceived* legal shield: privilege asserted, the record kept off
 * the books, fewer discoverable factual records. This is what makes the "keep-it-oral"
 * path feel safe in the moment. Computed purely from levers + flags so the UI can show
 * exactly why it moved — and pair it with the litigation_pressure caveat. 0–1.
 */
function perceivedLegalShield(state: RunState): number {
  const privilegedSingleTrack =
    state.flags.includes('legal_owns_record') || state.flags.includes('privileged_single_track')
  return clamp01(
    0.55 * state.params.privilege_strength +
      0.30 * (privilegedSingleTrack ? 1 : 0) +
      0.15 * (1 - state.params.original_records_boundary),
  )
}

export function initialRunState(scenario: TabletopScenario): RunState {
  const params = { ...defaultParams() }
  for (const [k, v] of Object.entries(scenario.startLevers) as [LeverKey, number][]) params[k] = v
  return {
    params, init: defaultInitState(), settings: defaultSettings(),
    flags: [], incident: initialIncidentMeters(), retrainCadence: scenario.retrainCadence,
    failureType: scenario.failureType, captureResistance: scenario.captureResistance,
  }
}

export function playPath(scenario: TabletopScenario, choices: Choice[]): RunState {
  return choices.reduce((s, c) => applyChoice(s, c), initialRunState(scenario))
}

export function scorePath(scenario: TabletopScenario, choices: Choice[]): PathScore {
  const state = playPath(scenario, choices)
  const { trajectory } = simulate(state.init, state.params, state.settings)
  const institutional = institutionalMeters(trajectory)
  return {
    choices,
    institutional,
    incident: state.incident,
    outcome: engineForwardOutcome(state),
    legalSafety: perceivedLegalShield(state),
  }
}

export function scoreAllPaths(scenario: TabletopScenario): PathScore[] {
  return enumeratePaths(scenario).map((p) => scorePath(scenario, p))
}

/** The vector of "higher is better" meters used for domination testing. */
function goodVector(p: PathScore): number[] {
  return [
    p.institutional.safe_to_report_score,
    p.institutional.accountability_legitimacy,
    p.institutional.learning_yield,
    1 - p.institutional.private_ordering_gap,
    1 - p.institutional.policy_scaffold_dependency,
    1 - p.institutional.litigation_pressure, // durable exposure axis (two-track path tends to win this)
    p.legalSafety, // short-term perceived shield (oral path wins this) — decoupled on purpose
    p.incident.signal_fidelity,
    p.incident.record_capturability,
    p.incident.regulatory_timeliness,
    p.incident.board_oversight_visibility,
    p.incident.evidentiary_posture,
    p.incident.remediation_completeness,
    // Engine-forward recurrence is the meaningful per-path signal; the incident
    // meter `recurrence_risk` stays a static placeholder until Aftermath, so using
    // it here would make this axis inert. Use the outcome value.
    100 - p.outcome.recurrenceRisk,
  ]
}

function dominates(a: number[], b: number[]): boolean {
  let strictly = false
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i] - 1e-9) return false
    if (a[i] > b[i] + 1e-9) strictly = true
  }
  return strictly
}

export function hasDominantPath(scenario: TabletopScenario): boolean {
  const scored = scoreAllPaths(scenario)
  const vectors = scored.map(goodVector)
  return vectors.some((v, i) => vectors.every((w, j) => i === j || dominates(v, w)))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/score.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/score.ts src/engine/tabletop/score.test.ts
git commit -m "feat: path scoring and no-dominant-path property check"
```

---

### Task 9: Engine-tabletop barrel (`index.ts`)

**Files:**
- Create: `src/engine/tabletop/index.ts`
- Test: `src/engine/tabletop/index.test.ts`

**Interfaces:**
- Produces: a single barrel re-exporting every public symbol from Tasks 1–8.

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/tabletop/index.test.ts
import { describe, it, expect } from 'vitest'
import * as tabletop from './index'

describe('engine/tabletop barrel', () => {
  it('re-exports the public API', () => {
    for (const name of ['applyChoice', 'crossBoundary', 'recordCapturability', 'institutionalMeters', 'engineForwardOutcome', 'enumeratePaths', 'scoreAllPaths', 'hasDominantPath', 'initialIncidentMeters']) {
      expect(name in tabletop).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/tabletop/index.test.ts`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/tabletop/index.ts
/** Public contract of the pure Tabletop engine layer. Import from here. */
export * from './types'
export { tieStrengthFactor, translationLoss, normalizationProbability, crossBoundary, type CrossOpts } from './boundary'
export { recordCapturability, type CapturabilityOpts } from './capturability'
export { institutionalMeters, runConfig } from './meters'
export { applyChoice, type RunState } from './applyChoice'
export { engineForwardOutcome, type AftermathOutcome } from './outcome'
export { nodeById, resolveNext, reachableNodeIds, findUnreachable, enumeratePaths } from './resolver'
export { initialRunState, playPath, scorePath, scoreAllPaths, hasDominantPath, type PathScore } from './score'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/tabletop/index.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tabletop/index.ts src/engine/tabletop/index.test.ts
git commit -m "feat: engine/tabletop barrel export"
```

---

## PHASE B — Scenario data & validation (`src/lib/tabletop/`)

### Task 10: Scenario schema + validator

**Files:**
- Create: `src/lib/tabletop/schema.ts`
- Test: `src/lib/tabletop/schema.test.ts`

**Interfaces:**
- Consumes: `LEVER_KEYS` from `../../engine`; `TabletopScenario, INCIDENT_METER_KEYS, ROLE_KEYS` from `../../engine/tabletop`; `findUnreachable, nodeById, resolveNext` from `../../engine/tabletop`.
- Produces: `validateScenario(data: unknown): { ok: boolean; errors: string[] }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/tabletop/schema.test.ts
import { describe, it, expect } from 'vitest'
import { validateScenario } from './schema'
import type { TabletopScenario } from '../../engine/tabletop'

const good: TabletopScenario = {
  id: 's', name: 'S', blurb: 'b', failureType: 'malfunction', captureResistance: 'silent',
  retrainCadence: 0.5, startLevers: { workflow_protection: 0.3 }, startNodeId: 'a', chapters: [1],
  nodes: [
    { id: 'a', phase: 1, chapter: 1, title: 'A', situation: 's', choices: [
      { id: 'a1', label: 'L', role: 'safety_eng', chapter: 1, rationale: 'r', leverDeltas: { just_culture: 0.1 }, incidentEffects: { signal_fidelity: -5 }, flags: [], analogRefs: [], citations: [{ text: 'PSQIA' }], next: 'end' },
    ] },
    { id: 'end', phase: 2, chapter: 1, title: 'End', situation: 's', choices: [], terminal: true },
  ],
}

describe('validateScenario', () => {
  it('accepts a well-formed scenario', () => {
    expect(validateScenario(good)).toEqual({ ok: true, errors: [] })
  })

  it('rejects an unknown lever key in leverDeltas', () => {
    const bad = structuredClone(good)
    ;(bad.nodes[0].choices[0].leverDeltas as Record<string, number>).not_a_lever = 0.5
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/not_a_lever/)
  })

  it('rejects a dangling next target', () => {
    const bad = structuredClone(good)
    bad.nodes[0].choices[0].next = 'nowhere'
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/nowhere/)
  })

  it('rejects an unreachable node', () => {
    const bad = structuredClone(good)
    bad.nodes.push({ id: 'orphan', phase: 9, chapter: 1, title: 'O', situation: '', choices: [], terminal: true })
    const res = validateScenario(bad)
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/orphan/)
  })

  it('rejects an incident-effect key that is not a meter', () => {
    const bad = structuredClone(good)
    ;(bad.nodes[0].choices[0].incidentEffects as Record<string, number>).bogus = 1
    expect(validateScenario(bad).ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/tabletop/schema.test.ts`
Expected: FAIL — cannot find module `./schema`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/tabletop/schema.ts
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
        errors.push(`choice ${c.id}: non-terminal choices must carry at least one citation`)
      }
    }
  }

  for (const orphan of findUnreachable(s)) errors.push(`node "${orphan}" is unreachable`)
  // touch nodeById to keep the import meaningful and catch duplicate ids
  if (nodeById(s).size !== s.nodes.length) errors.push('duplicate node ids present')

  return { ok: errors.length === 0, errors }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/tabletop/schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tabletop/schema.ts src/lib/tabletop/schema.test.ts
git commit -m "feat: tabletop scenario schema validator"
```

---

### Task 11: Production-incident scenario + validation script

**Files:**
- Create: `src/lib/tabletop/scenarios/production-incident.ts`
- Create: `scripts/validate-scenarios.mjs`
- Modify: `package.json` (add `"validate:scenarios"` script)
- Test: `src/lib/tabletop/scenarios/production-incident.test.ts`

**Interfaces:**
- Consumes: `TabletopScenario` from `../../../engine/tabletop`; `validateScenario` from `../schema`; `hasDominantPath, scoreAllPaths` from `../../../engine/tabletop`.
- Produces: `productionIncident: TabletopScenario`; `TABLETOP_SCENARIOS: TabletopScenario[]`.

> **Content sourcing (do this while implementing):** mine `~/Downloads/Comparative Safety Reporting Regimes.md` and the six `*_AI_Incident_Governance.pptx` decks for citations. Use the real refs already in the dossier — e.g. PSQIA `42 U.S.C. §§ 299b-21 to 299b-26`; Capital One `In re Capital One (E.D. Va. 2020)`; AI Act `Art. 73 (15-day default; 2-day critical; 10-day death)` **with the pin-cite caveat**; Schwarcz, Wolff & Woods `36 Harv. J.L. & Tech. 421 (2023)` **with the "~95% is a podcast estimate" caveat**; SR 11-7 effective challenge; ASRS/ASAP separation; CIRCIA `§ 681e`. Reuse existing `REGIME_MATRIX` ids for `analogRefs` (`'cyber'`, `'psqia'`, `'sr11'`, `'asrs-asap'`, `'pharma'`, `'nuclear'`, `'eu-ai'`). The full node graph instantiates the 8-phase spine; the tests below gate it.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/tabletop/scenarios/production-incident.test.ts
import { describe, it, expect } from 'vitest'
import { productionIncident } from './production-incident'
import { validateScenario } from '../schema'
import { hasDominantPath, scoreAllPaths } from '../../../engine/tabletop'

describe('production-incident scenario', () => {
  it('validates against the schema', () => {
    expect(validateScenario(productionIncident)).toEqual({ ok: true, errors: [] })
  })

  it('foregrounds all four chapters', () => {
    const chapters = new Set(productionIncident.nodes.flatMap((n) => n.choices.map((c) => c.chapter)))
    for (const ch of [1, 2, 3, 4]) expect(chapters.has(ch as 1)).toBe(true)
  })

  it('carries the cyber ~95% estimate caveat verbatim somewhere', () => {
    const caveats = productionIncident.nodes.flatMap((n) => n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')))
    expect(caveats.join(' ')).toMatch(/estimate/i)
  })

  it('flags the EU AI Act / PLD pin-cite caveat', () => {
    const caveats = productionIncident.nodes.flatMap((n) => n.choices.flatMap((c) => c.citations.map((x) => x.caveat ?? '')))
    expect(caveats.join(' ')).toMatch(/pin-cite/i)
  })

  it('has no dominant path (the thesis property)', () => {
    expect(hasDominantPath(productionIncident)).toBe(false)
  })

  it('the keep-it-oral path wins legal safety but loses Aftermath recurrence', () => {
    const scored = scoreAllPaths(productionIncident)
    const oral = scored.filter((p) => p.choices.some((c) => c.flags.includes('legal_owns_record')))
    const others = scored.filter((p) => !p.choices.some((c) => c.flags.includes('legal_owns_record')))
    expect(oral.length).toBeGreaterThan(0)
    const bestLegalSafetyOral = Math.max(...oral.map((p) => p.legalSafety))
    const bestLegalSafetyOther = Math.max(...others.map((p) => p.legalSafety))
    expect(bestLegalSafetyOral).toBeGreaterThanOrEqual(bestLegalSafetyOther - 1e-9)
    const minRecurrenceOral = Math.min(...oral.map((p) => p.outcome.recurrenceRisk))
    const minRecurrenceOther = Math.min(...others.map((p) => p.outcome.recurrenceRisk))
    expect(minRecurrenceOther).toBeLessThan(minRecurrenceOral)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/tabletop/scenarios/production-incident.test.ts`
Expected: FAIL — cannot find module `./production-incident`.

- [ ] **Step 3: Write the implementation**

Author `productionIncident` as a `TabletopScenario` instantiating the 8-phase spine (manifestation → capture → framing → boundary crossing → routing → remediation → disclosure → aftermath). Each non-terminal choice carries real `citations` (with caveats verbatim per the sourcing note) and `analogRefs` into `REGIME_MATRIX`. The graph must contain at least one `legal_owns_record` branch and one `two_track`/`independent_review_channel` branch so the trade-off tests above hold, and a single terminal Aftermath node. Tune `leverDeltas`/`incidentEffects` so the no-dominant-path and oral-vs-translation tests pass (mirror the magnitudes proven in `score.test.ts`: counsel-owns lowers `workflow_protection`/`safe_harbor_non_admission`/`translation_layer`/`effective_challenge` and raises `privilege_strength`; two-track raises the protective/learning levers and `remediation_completeness`). Export:

```ts
import { productionIncident } from './production-incident'
export const TABLETOP_SCENARIOS = [productionIncident]
```

Add the validation script:

```js
// scripts/validate-scenarios.mjs
// Compiled-free guard for CI: import the built scenarios via tsx-less dynamic import
// is not available, so this script shells vitest's validation test instead.
import { execSync } from 'node:child_process'
execSync('npx vitest run src/lib/tabletop/scenarios/production-incident.test.ts src/lib/tabletop/schema.test.ts', { stdio: 'inherit' })
```

Add to `package.json` scripts:

```json
"validate:scenarios": "node scripts/validate-scenarios.mjs"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/tabletop/scenarios/production-incident.test.ts`
Expected: PASS (6 tests). Iterate on coefficients until the trade-off and no-dominant-path tests are green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tabletop/scenarios/production-incident.ts src/lib/tabletop/scenarios/production-incident.test.ts scripts/validate-scenarios.mjs package.json
git commit -m "feat: production-incident scenario (8-phase spine, cited, no-dominant-path)"
```

---

### Task 12: Markdown after-action debrief (`debrief.ts`)

**Files:**
- Create: `src/lib/tabletop/debrief.ts`
- Test: `src/lib/tabletop/debrief.test.ts`

**Interfaces:**
- Consumes: `NO_FORECAST_LINE` from `../format`; `NO_LEGAL_ADVICE_LINE, REGIME_MATRIX` from `../institutional`; `PathScore, AftermathOutcome, Choice, TabletopScenario` from `../../engine/tabletop`.
- Produces: `buildDebriefMarkdown(args: { scenario: TabletopScenario; played: PathScore; counterfactual: PathScore | null; timestamp: string }): string`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/tabletop/debrief.test.ts
import { describe, it, expect } from 'vitest'
import { buildDebriefMarkdown } from './debrief'
import { productionIncident } from './scenarios/production-incident'
import { scoreAllPaths } from '../../engine/tabletop'

describe('after-action debrief', () => {
  const scored = scoreAllPaths(productionIncident)
  const md = buildDebriefMarkdown({ scenario: productionIncident, played: scored[0], counterfactual: scored[1] ?? null, timestamp: '2026-06-29T00:00:00.000Z' })

  it('includes the no-forecast and not-legal-advice lines', () => {
    expect(md).toContain('not a forecast') // NO_FORECAST_LINE contains this phrasing; adjust to actual constant text if different
    expect(md.toLowerCase()).toContain('not legal advice')
  })

  it('has a per-chapter readout section', () => {
    expect(md).toMatch(/Ch\.?\s*2/)
    expect(md.toLowerCase()).toContain('per-chapter')
  })

  it('reports the engine-forward outcome and a counterfactual', () => {
    expect(md.toLowerCase()).toContain('recurrence')
    expect(md.toLowerCase()).toContain('counterfactual')
  })
})
```

> Note: the first assertion's substring must equal whatever `NO_FORECAST_LINE` actually says. Open `src/lib/format.ts`, read the constant, and match the assertion to it before writing the implementation.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/tabletop/debrief.test.ts`
Expected: FAIL — cannot find module `./debrief`.

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/tabletop/debrief.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tabletop/debrief.ts src/lib/tabletop/debrief.test.ts
git commit -m "feat: Markdown after-action debrief with per-chapter readout and counterfactual"
```

---

## PHASE C — State & surface switch

### Task 13: Tabletop store + `Mode` extension

**Files:**
- Modify: `src/state/store.ts` (extend `Mode` union to include `'tabletop'`)
- Create: `src/state/tabletopStore.ts`
- Test: `src/state/tabletopStore.test.ts`

**Interfaces:**
- Consumes: `useStore` (main store) for the handoff; `applyChoice, initialRunState, resolveNext, nodeById, scorePath, engineForwardOutcome, institutionalMeters, RunState, PathScore, TabletopScenario, ScenarioNode` from `../engine/tabletop`; `simulate` from `../engine`; `productionIncident` from `../lib/tabletop/scenarios/production-incident`.
- Produces: `useTabletopStore` with `{ scenario, runState, currentNodeId, history (Choice[]), institutional, finished, start(scenario?), choose(choice), reset(), outcome(), debriefArgs(timestamp), handoffToSystem() }`.

- [ ] **Step 1: Extend the Mode union (no test yet — covered by Task 14 integration test)**

In `src/state/store.ts`, change:

```ts
export type Mode = 'executive' | 'scientific'
```
to
```ts
export type Mode = 'executive' | 'scientific' | 'tabletop'
```

- [ ] **Step 2: Write the failing test**

```ts
// @vitest-environment jsdom
// src/state/tabletopStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTabletopStore } from './tabletopStore'
import { useStore } from './store'
import { productionIncident } from '../lib/tabletop/scenarios/production-incident'

describe('tabletopStore', () => {
  beforeEach(() => useTabletopStore.getState().reset())

  it('starts at the scenario start node with seeded levers', () => {
    useTabletopStore.getState().start(productionIncident)
    const s = useTabletopStore.getState()
    expect(s.currentNodeId).toBe(productionIncident.startNodeId)
    expect(s.finished).toBe(false)
    expect(s.institutional.litigation_pressure).toBeGreaterThanOrEqual(0)
  })

  it('choosing advances the node and records history', () => {
    useTabletopStore.getState().start(productionIncident)
    const firstChoice = productionIncident.nodes.find((n) => n.id === productionIncident.startNodeId)!.choices[0]
    useTabletopStore.getState().choose(firstChoice)
    expect(useTabletopStore.getState().history).toContainEqual(firstChoice)
  })

  it('handoffToSystem loads scenario A and switches to the Tipping tab', () => {
    useTabletopStore.getState().start(productionIncident)
    // play to the end by repeatedly taking the first choice
    let guard = 0
    while (!useTabletopStore.getState().finished && guard++ < 20) {
      const id = useTabletopStore.getState().currentNodeId
      const node = productionIncident.nodes.find((n) => n.id === id)!
      if (node.choices.length === 0) break
      useTabletopStore.getState().choose(node.choices[0])
    }
    useTabletopStore.getState().handoffToSystem()
    expect(useStore.getState().mode).toBe('scientific')
    expect(useStore.getState().view).toBe('tipping')
    expect(useStore.getState().activePresetId).toBeNull()
  })
})
```

- [ ] **Step 3: Write minimal implementation**

```ts
// src/state/tabletopStore.ts
/**
 * Run state for the Tabletop surface. Independent of the main store on the per-turn
 * hot path; it writes to scenario A only on the explicit "See this as a system"
 * handoff (loadScenario + setMode('scientific') + setView('tipping')).
 */
import { create } from 'zustand'
import {
  applyChoice, initialRunState, resolveNext, engineForwardOutcome,
  institutionalMeters, scorePath,
  type RunState, type TabletopScenario, type Choice, type InstitutionalMeterKey,
  type AftermathOutcome, type PathScore,
} from '../engine/tabletop'
import { simulate } from '../engine'
import { useStore } from './store'
import { productionIncident } from '../lib/tabletop/scenarios/production-incident'
import { buildDebriefMarkdown, type DebriefArgs } from '../lib/tabletop/debrief'

function instOf(state: RunState): Record<InstitutionalMeterKey, number> {
  return institutionalMeters(simulate(state.init, state.params, state.settings).trajectory)
}

interface TabletopState {
  scenario: TabletopScenario
  runState: RunState
  currentNodeId: string
  history: Choice[]
  institutional: Record<InstitutionalMeterKey, number>
  finished: boolean
  start: (scenario?: TabletopScenario) => void
  choose: (choice: Choice) => void
  reset: () => void
  outcome: () => AftermathOutcome
  debriefArgs: (timestamp: string) => DebriefArgs
  buildDebrief: (timestamp: string) => string
  handoffToSystem: () => void
}

function seed(scenario: TabletopScenario) {
  const runState = initialRunState(scenario)
  return { scenario, runState, currentNodeId: scenario.startNodeId, history: [] as Choice[], institutional: instOf(runState), finished: false }
}

export const useTabletopStore = create<TabletopState>((set, get) => ({
  ...seed(productionIncident),

  start: (scenario = productionIncident) => set(seed(scenario)),

  choose: (choice) => {
    const { runState, scenario, history } = get()
    const nextState = applyChoice(runState, choice)
    const nextId = resolveNext(choice, nextState.flags)
    const node = scenario.nodes.find((n) => n.id === nextId)
    const finished = !node || node.terminal === true || node.choices.length === 0
    set({ runState: nextState, currentNodeId: nextId, history: [...history, choice], institutional: instOf(nextState), finished })
  },

  reset: () => set(seed(productionIncident)),

  outcome: () => engineForwardOutcome(get().runState),

  debriefArgs: (timestamp) => {
    const { scenario, history } = get()
    const played = scorePath(scenario, history)
    // counterfactual = the highest-legal-safety... no: the lowest-recurrence path.
    const all = (require('../engine/tabletop') as typeof import('../engine/tabletop')).scoreAllPaths(scenario)
    const counterfactual = all.reduce<PathScore | null>((best, p) => (!best || p.outcome.recurrenceRisk < best.outcome.recurrenceRisk ? p : best), null)
    return { scenario, played, counterfactual, timestamp }
  },

  buildDebrief: (timestamp) => buildDebriefMarkdown(get().debriefArgs(timestamp)),

  handoffToSystem: () => {
    const { runState, scenario } = get()
    useStore.getState().loadScenario({
      params: runState.params, init: runState.init, settings: runState.settings,
      presetId: null, name: `Tabletop — ${scenario.name}`,
      annotations: 'Loaded from a Tabletop playthrough. Levers reflect the institutional configuration the player produced.',
    })
    useStore.getState().setMode('scientific')
    useStore.getState().setView('tipping')
  },
}))
```

> **Note on `require`:** the repo is ESM. Replace the `require(...)` line with a top-of-file `import { scoreAllPaths } from '../engine/tabletop'` and call `scoreAllPaths(scenario)` directly. (Inlined here only to keep the import list above readable; fix it when implementing.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/tabletopStore.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/store.ts src/state/tabletopStore.ts src/state/tabletopStore.test.ts
git commit -m "feat: tabletop store with run state, scoring, and system handoff"
```

---

## PHASE D — UI surface

> Component tasks use jsdom (`// @vitest-environment jsdom` as the file's first line). Follow the existing Tailwind token classes (`border-line`, `bg-surface`, `text-ink`, `text-muted`, `bg-accent`, `text-accent`, `accent-soft`). All interactive elements are real `<button>`s with `aria-*` for WCAG-AA + keyboard nav.

### Task 14: Add the Tabletop surface to the switch

**Files:**
- Modify: `src/App.tsx` (Header tablist; lazy import; render branch)
- Create: `src/views/Tabletop/TabletopSurface.tsx` (placeholder shell first)
- Test: `src/App.integration.test.tsx` (extend with a tabletop case) or create `src/views/Tabletop/TabletopSurface.test.tsx`

**Interfaces:**
- Produces: `TabletopSurface` default-exported lazy component; the header's third tab.

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// src/views/Tabletop/TabletopSurface.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TabletopSurface } from './TabletopSurface'

describe('TabletopSurface', () => {
  it('renders the scenario name and the first node situation', () => {
    render(<TabletopSurface />)
    expect(screen.getByText(/Tabletop/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/Tabletop/TabletopSurface.test.tsx`
Expected: FAIL — cannot find module `./TabletopSurface`.

- [ ] **Step 3: Write minimal implementation**

Create the shell (fleshed out further in Tasks 15–19):

```tsx
// src/views/Tabletop/TabletopSurface.tsx
import { useEffect } from 'react'
import { useTabletopStore } from '../../state/tabletopStore'
import { PhaseView } from './PhaseView'
import { MeterRail } from './MeterRail'
import { Debrief } from './Debrief'

export function TabletopSurface() {
  const start = useTabletopStore((s) => s.start)
  const finished = useTabletopStore((s) => s.finished)
  const scenario = useTabletopStore((s) => s.scenario)
  useEffect(() => { start() }, [start])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="m-0 text-[15px] font-semibold text-ink">Tabletop — {scenario.name}</h2>
        <p className="mt-1 text-[12px] text-muted">{scenario.blurb}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>{finished ? <Debrief /> : <PhaseView />}</div>
        <MeterRail />
      </div>
    </div>
  )
}
export default TabletopSurface
```

Wire into `src/App.tsx`:
- add `const TabletopSurface = lazy(() => import('./views/Tabletop/TabletopSurface').then((m) => ({ default: m.TabletopSurface })))`
- in `Header`, change the tablist source to `(['executive', 'scientific', 'tabletop'] as const)`
- in `App`'s `main`, change the render to:

```tsx
{mode === 'executive' && <ExecutiveMode />}
{mode === 'scientific' && <ScientificMode />}
{mode === 'tabletop' && (
  <Suspense fallback={FALLBACK}><TabletopSurface /></Suspense>
)}
```

(Move `const FALLBACK = ...` above `App` if it isn't already in scope, or reuse the existing one.)

- [ ] **Step 4: Run test to verify it passes** (after Tasks 15–19 land, this stays green; for now stub `PhaseView`/`MeterRail`/`Debrief` as `() => null` exports so the shell compiles)

Run: `npx vitest run src/views/Tabletop/TabletopSurface.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/views/Tabletop/TabletopSurface.tsx src/views/Tabletop/TabletopSurface.test.tsx
git commit -m "feat: add Tabletop surface to the top-level switch"
```

---

### Task 15: PhaseView + ChoiceCard

**Files:**
- Create: `src/views/Tabletop/PhaseView.tsx`, `src/views/Tabletop/ChoiceCard.tsx`
- Test: `src/views/Tabletop/PhaseView.test.tsx`

**Interfaces:**
- Consumes: `useTabletopStore`; `ScenarioNode, Choice` types.
- Produces: `PhaseView`, `ChoiceCard`.

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// src/views/Tabletop/PhaseView.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhaseView } from './PhaseView'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('PhaseView', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))

  it('shows the current node situation and a button per choice', () => {
    render(<PhaseView />)
    const node = productionIncident.nodes.find((n) => n.id === productionIncident.startNodeId)!
    expect(screen.getByText(new RegExp(node.title))).toBeTruthy()
    for (const c of node.choices) expect(screen.getByRole('button', { name: new RegExp(c.label.slice(0, 12)) })).toBeTruthy()
  })

  it('advances when a choice is clicked', () => {
    render(<PhaseView />)
    const node = productionIncident.nodes.find((n) => n.id === productionIncident.startNodeId)!
    const before = useTabletopStore.getState().history.length
    fireEvent.click(screen.getByRole('button', { name: new RegExp(node.choices[0].label.slice(0, 12)) }))
    expect(useTabletopStore.getState().history.length).toBe(before + 1)
  })
})
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx vitest run src/views/Tabletop/PhaseView.test.tsx` → FAIL (no module).

- [ ] **Step 3: Implement**

```tsx
// src/views/Tabletop/ChoiceCard.tsx
import type { Choice } from '../../engine/tabletop'

const CHAPTER_TAG: Record<number, string> = { 1: 'Liability', 2: 'Signal flow', 3: 'Architecture', 4: 'Technical' }

export function ChoiceCard({ choice, onChoose }: { choice: Choice; onChoose: (c: Choice) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChoose(choice)}
      className="w-full rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink">{choice.label}</span>
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">Ch.{choice.chapter} · {CHAPTER_TAG[choice.chapter]}</span>
      </div>
    </button>
  )
}
```

```tsx
// src/views/Tabletop/PhaseView.tsx
import { useTabletopStore } from '../../state/tabletopStore'
import { ChoiceCard } from './ChoiceCard'

export function PhaseView() {
  const scenario = useTabletopStore((s) => s.scenario)
  const currentNodeId = useTabletopStore((s) => s.currentNodeId)
  const choose = useTabletopStore((s) => s.choose)
  const node = scenario.nodes.find((n) => n.id === currentNodeId)
  if (!node) return null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted">Phase {node.phase}</div>
        <h3 className="m-0 mt-1 text-[15px] font-semibold text-ink">{node.title}</h3>
        <p className="mt-1 text-[13px] text-ink-soft">{node.situation}</p>
      </div>
      <div className="space-y-2">
        {node.choices.map((c) => <ChoiceCard key={c.id} choice={c} onChoose={choose} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes.** Run: `npx vitest run src/views/Tabletop/PhaseView.test.tsx` → PASS (2 tests).

- [ ] **Step 5: Commit.** `git add src/views/Tabletop/PhaseView.tsx src/views/Tabletop/ChoiceCard.tsx src/views/Tabletop/PhaseView.test.tsx && git commit -m "feat: tabletop PhaseView and ChoiceCard"`

---

### Task 16: MeterRail + ScoringLogicPanel

**Files:**
- Create: `src/views/Tabletop/MeterRail.tsx`, `src/views/Tabletop/ScoringLogicPanel.tsx`
- Test: `src/views/Tabletop/MeterRail.test.tsx`

**Interfaces:**
- Consumes: `useTabletopStore`; `institutionalScorecard` from `../../lib/institutional`; `INCIDENT_METER_KEYS`, `perceivedLegalShield` from `../../engine/tabletop`; `simulate` from `../../engine`.
- Produces: `MeterRail`, `ScoringLogicPanel`.
- **Prereq export:** `perceivedLegalShield(state: RunState): number` is currently a private helper in `src/engine/tabletop/score.ts`. Add `export` to it and re-export it from `src/engine/tabletop/index.ts`, so the live rail can compute the short-term shield from the current run state (DRY — same formula the scorer uses).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// src/views/Tabletop/MeterRail.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MeterRail } from './MeterRail'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('MeterRail', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))
  afterEach(() => cleanup())

  it('shows institutional and incident meters and a scoring-logic toggle', () => {
    render(<MeterRail />)
    expect(screen.getByText(/Safe-to-report/i)).toBeTruthy()
    expect(screen.getByText(/signal fidelity/i)).toBeTruthy()
    const toggle = screen.getAllByRole('button', { name: /show scoring logic/i })[0]
    fireEvent.click(toggle)
    expect(screen.getByText(/formula|levers|flags/i)).toBeTruthy()
  })

  it('surfaces the short-term perceived legal shield with its trap caveat, beside litigation pressure', () => {
    render(<MeterRail />)
    expect(screen.getByText(/perceived legal shield/i)).toBeTruthy()
    expect(screen.getByText(/litigation pressure/i)).toBeTruthy()
    // The shield is labelled short-term/perceived and paired with the fragility caveat.
    expect(screen.getByText(/short-term|fragile|feels|not a durable/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify it fails.** → FAIL (no module).

- [ ] **Step 3: Implement.** First export `perceivedLegalShield` from `score.ts` (add `export`) and from the barrel `index.ts`. Then implement `MeterRail` (reads `useTabletopStore`'s `runState`/`institutional`; formats the six institutional meters through `institutionalScorecard(runState.params, simulate(runState.init, runState.params, runState.settings).trajectory)` — `litigation_pressure` is one of them; lists incident meters from `INCIDENT_METER_KEYS` with a 0–100 bar; hides `recurrence_risk` until `finished`). Add a dedicated **Perceived legal shield** row computed via `perceivedLegalShield(runState)`, rendered beside `litigation_pressure`, labelled short-term/perceived with a one-line caveat (e.g. "Feels protective now (privilege asserted); fragile — not a durable reduction in exposure. Compare litigation pressure."). Implement `ScoringLogicPanel` (a collapsible `<button aria-expanded>` per meter that reveals the formula text, the levers, and the flags that drove it). Use the existing token classes; each meter row carries a one-line "why".

- [ ] **Step 4: Run to verify it passes.** → PASS.

- [ ] **Step 5: Commit.** `git add src/views/Tabletop/MeterRail.tsx src/views/Tabletop/ScoringLogicPanel.tsx src/views/Tabletop/MeterRail.test.tsx && git commit -m "feat: live meter rail with inspectable scoring-logic panel"`

---

### Task 17: BoundaryVisualizer

**Files:**
- Create: `src/views/Tabletop/BoundaryVisualizer.tsx`
- Test: `src/views/Tabletop/BoundaryVisualizer.test.tsx`

**Interfaces:**
- Consumes: `useTabletopStore` (`runState.incident.signal_fidelity`, history).
- Produces: `BoundaryVisualizer` — an inline SVG showing engineer → safety → legal → board with the current `signal_fidelity` as a shrinking bar across the handoffs.

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// src/views/Tabletop/BoundaryVisualizer.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BoundaryVisualizer } from './BoundaryVisualizer'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('BoundaryVisualizer', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))
  it('renders the four professional boundaries', () => {
    render(<BoundaryVisualizer />)
    for (const label of [/engineer/i, /safety/i, /legal/i, /board/i]) expect(screen.getByText(label)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify it fails.** → FAIL.
- [ ] **Step 3: Implement** the SVG visualizer (a horizontal track of four labeled stations; a fidelity bar whose width = `signal_fidelity`%; an `aria-label` describing current fidelity).
- [ ] **Step 4: Run to verify it passes.** → PASS.
- [ ] **Step 5: Commit.** `git add src/views/Tabletop/BoundaryVisualizer.tsx src/views/Tabletop/BoundaryVisualizer.test.tsx && git commit -m "feat: Ch.2 boundary-handoff signal-fidelity visualizer"`

---

### Task 18: AnalogMentorPanel

**Files:**
- Create: `src/views/Tabletop/AnalogMentorPanel.tsx`
- Modify: `src/views/Tabletop/TabletopSurface.tsx` (mount `BoundaryVisualizer` + `AnalogMentorPanel` during play) and `src/views/Tabletop/TabletopSurface.test.tsx` (assert they appear)
- Test: `src/views/Tabletop/AnalogMentorPanel.test.tsx`

**Interfaces:**
- Consumes: `useTabletopStore` (current node's choices' `analogRefs`); `REGIME_MATRIX` from `../../lib/institutional`.
- Produces: `AnalogMentorPanel` — for the current node, surfaces each referenced analog's `name`, `mechanism`, `transferablePrinciple`, and `sources` (with caveats).

**Wiring (closes a gap):** `BoundaryVisualizer` (Task 17) and `AnalogMentorPanel` were built/tested in isolation but not mounted. In this task, render BOTH inside `TabletopSurface` during play (i.e. when `!finished`): `BoundaryVisualizer` above or below `PhaseView` in the main column; `AnalogMentorPanel` below the choices or in the side column near the `MeterRail`. Extend `TabletopSurface.test.tsx` with an assertion that, after `start(productionIncident)`, the surface shows a boundary label (e.g. /engineer/i) and an analog cue (e.g. /principle|mechanism|analog/i). Keep the `EpistemicBanner` pinned (it lives in `App.tsx`, untouched).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// src/views/Tabletop/AnalogMentorPanel.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { AnalogMentorPanel } from './AnalogMentorPanel'
import { useTabletopStore } from '../../state/tabletopStore'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

describe('AnalogMentorPanel', () => {
  beforeEach(() => useTabletopStore.getState().start(productionIncident))
  afterEach(() => cleanup())
  it('shows at least one sector analog with its transferable principle', () => {
    render(<AnalogMentorPanel />)
    // The start node references at least one analog (e.g. cyber or psqia).
    expect(screen.getByText(/principle|mechanism|analog/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify it fails.** → FAIL.
- [ ] **Step 3: Implement** — gather `analogRefs` across the current node's choices, dedupe, look up in `REGIME_MATRIX`, render each as a small card. Then mount `BoundaryVisualizer` and `AnalogMentorPanel` in `TabletopSurface` during play, and add the surface-level assertion described in **Wiring** above.
- [ ] **Step 4: Run to verify it passes.** → PASS (AnalogMentorPanel test + the extended TabletopSurface test).
- [ ] **Step 5: Commit.** `git add src/views/Tabletop/AnalogMentorPanel.tsx src/views/Tabletop/AnalogMentorPanel.test.tsx src/views/Tabletop/TabletopSurface.tsx src/views/Tabletop/TabletopSurface.test.tsx && git commit -m "feat: analog-mentor panel + mount boundary/mentor in the tabletop surface"`

---

### Task 19: Debrief view + system handoff + full-playthrough integration test

**Files:**
- Create: `src/views/Tabletop/Debrief.tsx`
- Test: `src/views/Tabletop/Debrief.integration.test.tsx`

**Interfaces:**
- Consumes: `useTabletopStore` (`outcome()`, `buildDebrief()`, `handoffToSystem()`); `useStore`.
- Produces: `Debrief` — shows the engine-forward verdict (regime + revealed recurrence), a "Download after-action report (Markdown)" button (reusing `triggerDownload` from `lib/persistence`), and a **"See this as a system"** button calling `handoffToSystem`.

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// src/views/Tabletop/Debrief.integration.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Debrief } from './Debrief'
import { useTabletopStore } from '../../state/tabletopStore'
import { useStore } from '../../state/store'
import { productionIncident } from '../../lib/tabletop/scenarios/production-incident'

function playToEnd() {
  useTabletopStore.getState().start(productionIncident)
  let guard = 0
  while (!useTabletopStore.getState().finished && guard++ < 30) {
    const id = useTabletopStore.getState().currentNodeId
    const node = productionIncident.nodes.find((n) => n.id === id)!
    if (!node.choices.length) break
    useTabletopStore.getState().choose(node.choices[0])
  }
}

describe('Debrief + system handoff', () => {
  beforeEach(playToEnd)

  it('shows the engine-forward regime verdict and reveals recurrence risk', () => {
    render(<Debrief />)
    expect(screen.getByText(/recurrence/i)).toBeTruthy()
    expect(screen.getByText(/chilling|learning|contested/i)).toBeTruthy()
  })

  it('"See this as a system" loads scenario A and switches to Tipping', () => {
    render(<Debrief />)
    fireEvent.click(screen.getByRole('button', { name: /see this as a system/i }))
    expect(useStore.getState().mode).toBe('scientific')
    expect(useStore.getState().view).toBe('tipping')
  })
})
```

- [ ] **Step 2: Run to verify it fails.** → FAIL.
- [ ] **Step 3: Implement** `Debrief` (reads `outcome()`; renders regime + recurrence + cumulative harm; a download button using `buildDebrief(new Date().toISOString())` → `triggerDownload`; and the handoff button). The clock call lives in the component (UI layer), never in the engine.
- [ ] **Step 4: Run to verify it passes.** → PASS.
- [ ] **Step 5: Commit.** `git add src/views/Tabletop/Debrief.tsx src/views/Tabletop/Debrief.integration.test.tsx && git commit -m "feat: Aftermath debrief, Markdown export, and See-this-as-a-system handoff"`

---

## PHASE E — Docs, coverage, and green CI

### Task 20: TABLETOP.md, README/ARCHITECTURE updates, coverage + full-suite gate

**Files:**
- Create: `docs/TABLETOP.md`
- Modify: `README.md` (surfaces table; demo script; authoring-by-file note), `docs/ARCHITECTURE.md` (engine/tabletop + tabletop layers)
- Modify: `.github/workflows/ci.yml` only if it does not already run `npm run test:run` + `npm run build` (it does — verify; add `npm run validate:scenarios` as an explicit step).

- [ ] **Step 1: Write `docs/TABLETOP.md`** — the source of truth: concept and four-lens mapping; the incident-meter semantics and bounds; the Ch.2 transfer fn and normalization probability (with the illustrative coefficients from Tasks 2–3 written out); the Ch.4 capturability function; engine integration (institutional meters via the scorecard; engine-forward Aftermath); the scenario JSON schema + the `npm run validate:scenarios` authoring-by-file guide; epistemic limits (directional, caveats verbatim); and the **Milestone 2** list (remaining 9 scenarios, role mode, facilitator console, authoring editor, elicitation, PDF radar).

- [ ] **Step 2: Update `README.md`** — add Tabletop to the surfaces description; add a "Suggested Tabletop demo" (run the production incident; skip state capture in Phase 2 and watch `record_capturability` fall; route through counsel in Phase 4 and watch `signal_fidelity` drop and `litigation_pressure` improve short-term; reach Aftermath; click "See this as a system"); note authoring-by-file via the schema + validate command. Update the test-count line.

- [ ] **Step 3: Update `docs/ARCHITECTURE.md`** — add `engine/tabletop` (pure) and `lib/tabletop` + `views/Tabletop` layers and the data-flow note (tabletop store drives scenario A only on handoff).

- [ ] **Step 4: Run the full gate**

Run: `npm run lint && npm run typecheck && npm run coverage && npm run build`
Expected: all green; coverage report shows `src/engine/tabletop` ≥ 90%; total test count > 133. If `engine/tabletop` coverage is below 90%, add focused unit tests for the uncovered branches (e.g. conditional-next `else`, clamp edges) before proceeding.

- [ ] **Step 5: Commit**

```bash
git add docs/TABLETOP.md README.md docs/ARCHITECTURE.md .github/workflows/ci.yml
git commit -m "docs: TABLETOP.md source of truth; README/ARCHITECTURE updates for the Tabletop surface"
```

---

## Self-Review (completed against the spec)

**Spec coverage:** §1 mission → the whole plan; four-lens model §2/§4 → Tasks 2–8, 11; phase spine → Task 11; incident meters → Tasks 1,4,5; institutional-meter reuse (no parallel scoring) → Task 4 parity test; Ch.2 transfer fn → Task 2; Ch.4 capturability → Task 3; engine-forward Aftermath → Tasks 6,19; no-dominant-path property → Tasks 8,11; scenario data + schema + validation command → Tasks 10,11; debrief w/ per-chapter + counterfactual → Task 12; analog mentor → Task 18; surface switch → Task 14; meter rail + scoring-logic → Task 16; boundary visualizer → Task 17; system handoff → Tasks 13,19; share/persist reuse → handoff uses `loadScenario` (URL share of a played path is Milestone 2, documented); docs/CI bar → Task 20. Deferred items (role mode, facilitator console, authoring editor, elicitation, PDF radar, 9 scenarios) are explicitly Milestone 2 per the approved design.

**Placeholder scan:** UI Tasks 16–18 describe component bodies in prose rather than full code — intentional, because their tests fully pin behavior and the token classes/props are specified; an implementer has an exact contract. Engine/data/state/debrief tasks (the testable core) carry complete code. Two inline caveats are called out for the implementer: the `require()` → `import` fix in Task 13, and matching the `NO_FORECAST_LINE` substring in Task 12.

**Type consistency:** `RunState`, `IncidentMeters`, `INCIDENT_METER_KEYS`, `InstitutionalMeterKey`, `Choice`, `ScenarioNode`, `TabletopScenario`, `PathScore`, `AftermathOutcome`, `applyChoice`, `crossBoundary`, `recordCapturability`, `institutionalMeters`, `engineForwardOutcome`, `resolveNext`, `enumeratePaths`, `scoreAllPaths`, `hasDominantPath` are defined once (Tasks 1–9) and consumed with matching signatures downstream (Tasks 10–19).
