# TABLETOP.md — DocFlow Tabletop Surface

> **Source of truth** for the Tabletop surface (Milestone 1 / Foundation Slice).
> All coefficients, function names, and meter semantics are read directly from
> the shipped code. Where the design spec records a decision, this document
> records it verbatim.

---

## 1. Mission

The Tabletop surface adds a third top-level mode to DocFlow (beside Executive
and Scientific). It runs a single AI incident through all four playbook lenses
at once:

- **Ch.4** — Technical reality of the failure (capture-resistance, evidence
  decay, remediation completeness).
- **Ch.2** — The signal's journey across organizational boundaries (translation
  loss, tie strength, normalization of deviance).
- **Ch.1** — Documentation, routing, and disclosure choices and their legal
  consequences.
- **Ch.3** — The institutional architecture those choices express.

At the end, the run hands the lever configuration the player produced to the
existing system-dynamics model in scenario A, then opens the Tipping tab to show
the decade-long consequence.

**The thesis the surface makes a player feel:** suppression is usually not even a
decision. Each property of ML failure supplies a true-on-its-face reason there is
no record (Ch.4); the signal dies at the weakest handoff (Ch.2); the legal
function, owning exposure, rationally chooses fewer records (Ch.1); and the fix
is a different institutional design, not "write more" (Ch.3). The naive
"protect ourselves / route through counsel / keep it oral" path wins short-term
perceived legal safety and loses on learning, recurrence, regulatory standing,
and eventual exposure. **No path may max every meter** — this is property-tested
in `src/engine/tabletop/score.ts` via `hasDominantPath`.

---

## 2. Four-Lens Incident Model

An incident unfolds in **phases (turns)**. Each choice does three things:

1. Nudges **levers** (via clamped deltas folded into the working `Params`).
2. Sets incident-state **flags** (e.g. `state_snapshotted`, `legal_owns_record`).
3. Produces a plain-language **"why each meter moved"** panel.

The engine recomputes after each choice.

### Phase Spine (production-incident scenario)

| Phase | Chapter | Title |
|-------|---------|-------|
| 1 | Ch.1 | Manifestation & detection |
| 2 | Ch.2/4 | Evidence capture |
| 3 | Ch.3 | Framing (two-track vs. oral-only) |
| 4 | Ch.2 | Boundary crossing & escalation |
| 5 | Ch.3 | Regulatory routing & protection |
| 6 | Ch.4 | Technical remediation |
| 7 | Ch.1/3 | External disclosure |
| 8 | Ch.4 | Aftermath — engine-forward verdict (terminal) |

---

## 3. The Seven Incident Meters

These are **new**, clearly-separated indices (0–100, directional). They are never
a substitute for the six institutional meters (which remain the engine's source
of truth; see Section 5). Each meter has a chapter tag and a plain "why"
explanation shown after every choice.

Defined in `src/engine/tabletop/types.ts`:

```ts
export const INCIDENT_METER_KEYS = [
  'signal_fidelity',           // Ch.2
  'record_capturability',      // Ch.4
  'regulatory_timeliness',     // Ch.1/3
  'board_oversight_visibility',// Ch.2
  'evidentiary_posture',       // Ch.1
  'remediation_completeness',  // Ch.4
  'recurrence_risk',           // Ch.4 (hidden until Aftermath)
] as const
```

### Baseline (scenario start)

```ts
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
```

### Semantics and bounds

| Meter | Chapter | Direction | Meaning |
|-------|---------|-----------|---------|
| `signal_fidelity` | Ch.2 | Higher = better | Original detail surviving at the current organizational boundary. Decays with each handoff via the Ch.2 transfer function. Starts at 100 (fully intact at first detection). |
| `record_capturability` | Ch.4 | Higher = better | Recoverability of evidence given failure type, retrain cadence, and capture choices. Starts at 50; rises if state is snapshotted before retraining overwrites evidence. |
| `regulatory_timeliness` | Ch.1/3 | Higher = better | Mandatory reporting windows and voluntary-disclosure duties met. Starts at 50 (neutral). |
| `board_oversight_visibility` | Ch.2 | Higher = better | Whether the incident signal reached oversight intact. Starts at 0 (oversight not yet briefed). Tracks `signal_fidelity` after Ch.2 handoffs. |
| `evidentiary_posture` | Ch.1 | Higher = better | Normative-admission load vs. objective record. Higher = more defensible objective record. Starts at 50. |
| `remediation_completeness` | Ch.4 | Higher = better | Whether findings translated into durable engineering action (regression suite, monitoring, feedback loops). Starts at 0 (nothing done yet). |
| `recurrence_risk` | Ch.4 | Lower = better | Revealed only in Aftermath. Derived from the engine-forward `finalDebt` and learning shortfall. The incident-meter placeholder stays at its last value until the terminal node. |

**Meters are directional 0–100 indices, not predictions.** Every movement
shows a plain "why" and a **"show scoring logic"** panel exposing the formula,
levers, and flags that drove it. These are calibration targets, not forecasts.

---

## 4. Ch.2 Boundary Transfer Function

**Source:** `src/engine/tabletop/boundary.ts`

When a signal crosses a professional boundary (e.g. engineer → safety lead →
legal → executive), fidelity decays through three components:

### Tie Strength Factor

Coefficients from `boundary.ts`:

```
tie = clamp01(
  0.45
  + 0.18 · recipient_enforcer_separation
  + 0.14 · near_miss_tier
  + 0.13 · effective_challenge
  + 0.10 · intermediary_capacity
  + (hasIndependentChannel ? 0.15 : 0)
)
```

Tie strength is in (0, 1]. Weak ties cannot carry tacit or complex knowledge.
The independent-review-channel flag (`independent_review_channel`) adds 0.15.

### Translation Loss

```
reducers = 0.22 · translation_layer + 0.12 · original_records_boundary
loss = clamp01(0.30 − reducers + (legalOwnsRecord ? 0.25 : 0))
```

Detail omitted in transit. Legal-as-bottleneck (`legal_owns_record` flag)
inflates loss by 0.25. With a well-tuned translation layer and strong
original-records boundary, loss approaches 0; under the oral-only path with
legal owning the record, it saturates near 0.55.

### Normalization-of-Deviance Probability

```
norm = clamp01(0.15 + 0.55 · retrainCadence − 0.35 · just_culture − 0.15 · near_miss_tier)
```

Probability that a true warning is classified as routine noise. Rises with
retrain cadence (the organization is already accustomed to retraining runs
without incident). Reduced by just-culture and near-miss reporting disciplines.

### Transfer Equation

```
transferred     = signal_fidelity · tie · (1 − loss)
signal_next     = max(0, min(signal_fidelity, transferred · (1 − 0.5 · norm)))
```

The normalization haircut applies a 50% weight to the normalization probability
(some warnings are partially heard). The result is monotone (signal can only
decrease or hold, never exceed the incoming value) and bounded in [0, 100].
This property is tested in `src/engine/tabletop/boundary.test.ts`.

**Applied in `applyChoice`:** Ch.2 choices call `crossBoundary` with the
accumulated flags, then set `board_oversight_visibility = signal_fidelity`
(board visibility tracks the actual fidelity of the signal that reached leadership).

---

## 5. Ch.4 Record-Capturability Function

**Source:** `src/engine/tabletop/capturability.ts`

ML failures resist faithful recording. Capturability depends on failure type,
retrain cadence, and whether the player captured state before the next training
run.

### Resistance Base

```ts
const RESISTANCE_BASE: Record<CaptureResistance, number> = {
  silent: 30,
  irreproducible: 35,
  environment_dependent: 45,
  distributional: 55,
}
```

The production-incident scenario uses `irreproducible` (base 35) with
`retrainCadence = 0.55`.

### `recordCapturability` Function

```
base          = RESISTANCE_BASE[resistance]           // 30–55
captureBoost  = (stateSnapshotted ? 30 : 0)
              + (pipelineCaptured ? 15 : 0)
erosion       = stateSnapshotted ? 0 : 40 · clamp(retrainCadence)
result        = clamp(0, 100, base + captureBoost − erosion)
```

Without a state snapshot, each retraining run overwrites evidence. At maximum
retrain cadence (1.0), erosion is 40 points. With both snapshot and pipeline
captured, the boost is 45 points. Skipping capture tanks `record_capturability`
and later `remediation_completeness` — the choice is cheap now and irreversible
later.

Tested in `src/engine/tabletop/capturability.test.ts`.

---

## 6. Engine Integration — Institutional Meters

**No parallel scoring system.** The six institutional meters are engine
auxiliaries, computed in `src/engine/model.ts` and surfaced via
`institutionalScorecard(params, traj)` in `src/lib/institutional.ts`. The
tabletop reads them from the final step of the trajectory:

```ts
// src/engine/tabletop/meters.ts
export function institutionalMeters(traj: Trajectory): Record<InstitutionalMeterKey, number> {
  const aux = traj.aux[traj.aux.length - 1]
  const out = {} as Record<InstitutionalMeterKey, number>
  for (const k of INSTITUTIONAL_METER_KEYS) out[k] = aux[k]
  return out
}
```

A parity test in `meters.test.ts` proves the tabletop institutional meters equal
`institutionalScorecard` for the same config (with the `learning_yield` display
scaling aside — `institutionalScorecard` shows `min(1, raw/2)`; the tabletop
reads the raw auxiliary). There is one source of truth.

| Institutional Meter | Meaning |
|---------------------|---------|
| `safe_to_report_score` | How safe candid reporting feels. |
| `accountability_legitimacy` | Whether protection is bounded by facts and independent review. |
| `learning_yield` | Durable learning per incident signal. |
| `litigation_pressure` | Discoverability and adverse-inference pressure. |
| `private_ordering_gap` | How much the design depends on public-law scaffolding. |
| `policy_scaffold_dependency` | Reliance on statute-like protection. |

---

## 7. Engine-Forward Aftermath

**Source:** `src/engine/tabletop/outcome.ts`

The Aftermath verdict is not a heuristic — it is the real DocFlow system-dynamics
engine running forward on the lever configuration the player produced. This is
DocFlow judging the institution the player operated.

```ts
export function engineForwardOutcome(state: RunState): AftermathOutcome {
  const { summary } = simulate(state.init, state.params, state.settings)
  const finalDebt = summary.finalState.TD
  const finalLearning = summary.finalState.L     // 0–100
  const debtPressure = finalDebt / (finalDebt + 20)   // saturating 0–1
  const learningShortfall = 1 - finalLearning / 100
  const raw = 100 * (0.6 * debtPressure + 0.4 * learningShortfall)
  return {
    regime: summary.regime,
    recurrenceRisk: clamp(0, 100, raw),
    cumulativeHarm: summary.cumulativeHarm,
    finalDebt,
    finalLearning,
  }
}
```

`recurrence_risk` is hidden during play (its incident-meter placeholder stays at
its last value); it is revealed as `AftermathOutcome.recurrenceRisk` only after
the terminal node fires. The Aftermath screen shows the regime, the recurrence
risk, cumulative harm, settled technical debt, and learning capability — all
derived from the same engine that powers the Tipping and Workbench tabs.

---

## 8. The Decoupling Decision: `legalSafety` vs. `litigation_pressure`

**This is a first-class design decision, recorded verbatim from the design spec
(2026-06-29).**

The SD model encodes the playbook's own thesis: privilege-first / keep-it-oral
is a trap. Gutting the protective workflow raises real discoverability more than
asserting privilege lowers it, so the engine's durable `litigation_pressure`
does **not** drop for the oral path.

The tabletop therefore represents the oral path's lure as a distinct, transparent
**perceived legal shield** (`legalSafety`), shown beside the durable
`litigation_pressure`. The oral path wins the perceived shield (the seductive
short-term beat) and loses the durable exposure axis — which is exactly the trap,
and is why no path dominates.

**Source:** `src/engine/tabletop/score.ts`, `perceivedLegalShield`:

```ts
export function perceivedLegalShield(state: RunState): number {
  const privilegedSingleTrack =
    state.flags.includes('legal_owns_record') ||
    state.flags.includes('privileged_single_track')
  return clamp01(
    0.55 * state.params.privilege_strength +
    0.30 * (privilegedSingleTrack ? 1 : 0) +
    0.15 * (1 - state.params.original_records_boundary),
  )
}
```

The UI **must** label `legalSafety` as "short-term / perceived" and pair it with
the `litigation_pressure` (durable) caveat. These are two different things.

---

## 9. No-Dominant-Path Property

**Source:** `src/engine/tabletop/score.ts`, `hasDominantPath`

The "higher is better" vector used for domination testing:

```
good = [
  safe_to_report_score,
  accountability_legitimacy,
  learning_yield,
  1 − private_ordering_gap,
  1 − policy_scaffold_dependency,
  1 − litigation_pressure,    // durable exposure axis — two-track path tends to win
  legalSafety,                // short-term perceived shield — oral path wins — decoupled on purpose
  signal_fidelity,
  record_capturability,
  regulatory_timeliness,
  board_oversight_visibility,
  evidentiary_posture,
  remediation_completeness,
  100 − outcome.recurrenceRisk,  // engine-forward; incident meter is static until Aftermath
]
```

A path "dominates" if it is ≥ all others on every good meter and strictly > on at
least one. The property test asserts `hasDominantPath(scenario) === false`. This
is tested for the production-incident scenario and is a gate in `score.test.ts`.

---

## 10. Scenario JSON Schema and `recordCapturability` Authoring Guide

### Schema

Scenarios are authored as TypeScript files exporting a `TabletopScenario` object.
The full type is in `src/engine/tabletop/types.ts`. Key fields:

```ts
interface TabletopScenario {
  id: string
  name: string
  blurb: string
  failureType: 'security' | 'misuse' | 'malfunction'
  captureResistance: 'silent' | 'irreproducible' | 'distributional' | 'environment_dependent'
  retrainCadence: number          // 0–1
  startLevers: Partial<Record<LeverKey, number>>
  startNodeId: NodeId
  nodes: ScenarioNode[]
  chapters: Chapter[]
}

interface ScenarioNode {
  id: NodeId
  phase: number
  chapter: 1 | 2 | 3 | 4
  title: string
  situation: string
  choices: Choice[]
  terminal?: boolean              // true only for the Aftermath node
}

interface Choice {
  id: string
  label: string
  role: 'safety_eng' | 'counsel' | 'policy' | 'exec' | 'board' | 'regulator'
  chapter: 1 | 2 | 3 | 4
  rationale: string
  leverDeltas: Partial<Record<LeverKey, number>>
  incidentEffects: Partial<IncidentMeters>
  flags: string[]                 // e.g. 'state_snapshotted', 'legal_owns_record'
  analogRefs: AnalogId[]
  citations: SourceRef[]          // non-terminal choices must carry ≥ 1 citation
  next: NodeId | ConditionalNext
}

interface ConditionalNext {
  ifFlag: string
  then: NodeId
  else: NodeId
}
```

### Authoring by File

1. Create a new `.ts` file in `src/lib/tabletop/scenarios/`.
2. Export a `TabletopScenario` object following the types above.
3. Add it to the `TABLETOP_SCENARIOS` registry in `src/lib/tabletop/scenarios/index.ts` (create your scenario in its own file under `scenarios/`, then import and append it there).
4. Run `npm run validate:scenarios` to check structural integrity:
   - All `leverDelta` keys are valid `LeverKey` values.
   - All `incidentEffects` keys are valid `IncidentMeterKey` values.
   - All `next` targets resolve to real node ids.
   - No node is unreachable from `startNodeId`.
   - No duplicate node ids.
   - Every non-terminal choice carries at least one citation.

```bash
npm run validate:scenarios
```

The validator (`src/lib/tabletop/schema.ts`) calls `validateScenario(data)` and
exits non-zero if any error is found. This step runs explicitly in CI after tests.

---

## 11. Debrief / After-Action Report

**Source:** `src/lib/tabletop/debrief.ts`

The Markdown after-action report includes:

- The path the player took (chapter-tagged, rationale shown, analog refs).
- Per-chapter readout:
  - Ch.2: signal fidelity lost (%).
  - Ch.4: record capturability / 100; remediation completeness / 100.
  - Ch.1: evidentiary posture / 100; litigation pressure (float).
  - Ch.3: private-ordering gap; policy-scaffold dependency.
- Engine-forward long-run outcome: regime, recurrence risk, cumulative harm,
  final debt, final learning.
- Counterfactual best-practice path (the path with lowest engine-forward
  recurrence risk across all enumerated paths).
- `NO_FORECAST_LINE` and `NO_LEGAL_ADVICE_LINE` — pinned at the top.

---

## 12. State and Handoff

**Source:** `src/state/tabletopStore.ts`

`useTabletopStore` is **independent** of the main Zustand store on the per-turn
hot path. It holds: active scenario, current node id, history of choices, working
`Params`, and derived institutional + incident meters.

It writes to the main store **only** on the explicit **"See this as a system"**
handoff:

```ts
handoffToSystem: () => {
  useStore.getState().loadScenario({
    params: runState.params, init: runState.init, settings: runState.settings,
    presetId: null, name: `Tabletop — ${scenario.name}`,
    annotations: 'Loaded from a Tabletop playthrough. Levers reflect the institutional configuration the player produced.',
  })
  useStore.getState().setMode('scientific')
  useStore.getState().setView('tipping')
}
```

Scenario A is recomputed synchronously on every main-store lever change, as
always. The tabletop does not interfere with that.

---

## 13. Epistemic Limits

These caveats are carried verbatim through the codebase and must appear in-app:

1. **Directional, not quantitative.** Meters are 0–100 indices, not probability
   estimates or forecasts. Every meter screen says so. The EpistemicBanner is
   pinned in all modes.

2. **Inspectable scoring.** The "show scoring logic" panel reveals which
   levers/flags moved each meter, including the Ch.2 transfer function
   coefficients and normalization probability.

3. **Real citations only.** Every legal/policy claim is traced to the attached
   source materials. Where the law is moving, nodes say so in-node.

4. **Caveats verbatim:**
   - The cyber **~95% no-written-report figure is an estimate** (Schwarcz, Wolff
     & Woods, 36 Harv. J.L. & Tech. 421 (2023)), not a measured statistic.
   - **EU AI Act / PLD** article numbers (Art. 73, Reg. (EU) 2024/1689; Arts.
     9-10, Dir. (EU) 2024/2853) carry a **pin-cite verification caveat** and
     should be verified before external circulation.
   - The AI Incident Database (~1,400 entries) is media-derived; numbers may
     not reflect true incidence.

5. **Honest endings.** Engine-forward outcomes are shown with the SD model's
   uncertainty framing; "contested" stays "contested."

6. **Not legal advice.** `NO_LEGAL_ADVICE_LINE` is pinned in the debrief.

---

## 14. Milestone 2 — Deferred Items

The following are explicitly deferred and not built in the Foundation Slice:

1. **Remaining nine scenarios** (chapter-tagged, cited): role-specific variants,
   misuse / security / distributional-shift / regulatory-first scenarios.
2. **Role mode + facilitator console** — cross-role Ch.2 handoff simulation,
   inject-events, turn timer, pause/resume, multi-player session.
3. **In-app authoring editor** — a GUI for the scenario JSON schema. The schema
   + `npm run validate:scenarios` ship in this slice, so authoring-by-file already
   works.
4. **Elicitation capture** — playtester disagreement flagging; surfacing contested
   nodes for iterative authoring.
5. **Full After-Action PDF** with the principles-honored/violated radar chart
   (the Markdown debrief with per-chapter readout + counterfactual ships in this
   slice).
6. **URL share of a played path** — sharing a completed run's configuration via
   the URL hash (the system-handoff to scenario A uses `loadScenario` already;
   path-level sharing is Milestone 2).

---

## 15. Files Reference

| Path | Role |
|------|------|
| `src/engine/tabletop/types.ts` | `TabletopScenario`, `ScenarioNode`, `Choice`, `IncidentMeters`, roles, flags |
| `src/engine/tabletop/boundary.ts` | Ch.2 transfer function, normalization probability |
| `src/engine/tabletop/capturability.ts` | Ch.4 record-capturability function |
| `src/engine/tabletop/meters.ts` | Institutional-meter bridge (reads engine auxiliaries) |
| `src/engine/tabletop/applyChoice.ts` | Pure reducer: lever deltas, flags, incident effects |
| `src/engine/tabletop/outcome.ts` | Engine-forward Aftermath verdict |
| `src/engine/tabletop/resolver.ts` | Node-graph traversal, reachability, path enumeration |
| `src/engine/tabletop/score.ts` | Path scoring, `perceivedLegalShield`, `hasDominantPath` |
| `src/engine/tabletop/index.ts` | Barrel export |
| `src/lib/tabletop/scenarios/production-incident.ts` | The one launch scenario |
| `src/lib/tabletop/schema.ts` | `validateScenario` — structural validator |
| `src/lib/tabletop/debrief.ts` | Markdown after-action report builder |
| `src/state/tabletopStore.ts` | Run state; drives scenario A only on explicit handoff |
| `src/views/Tabletop/` | Surface, phase view, choice cards, meter rail, boundary visualizer, analog mentor, debrief |
| `docs/TABLETOP.md` | This file — source of truth |
