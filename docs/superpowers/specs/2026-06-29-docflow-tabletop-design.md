# DocFlow Tabletop — Foundation Slice Design

> **Status:** approved design, pre-implementation.
> **Scope of this document:** the *foundation slice* of the larger "DocFlow
> Tabletop" build spec (`DocFlow_Tabletop_BuildSpec_v2_AllChapters.md`). The full
> spec spans 10 scenarios, role/facilitator modes, an authoring editor, and
> elicitation. This slice builds the pure engine layer plus **one** scenario
> (production-incident) end-to-end, solo, to a production bar — a reviewable
> vertical slice that proves the thesis. Everything else is an explicitly
> documented Milestone 2.
> **Date:** 2026-06-29.

## 1. Mission (slice-scoped)

Add a third top-level surface to DocFlow — **Tabletop** — that runs a single AI
incident through all four playbook lenses at once: the technical reality of the
failure (Ch.4), its journey across the firm's professional boundaries (Ch.2),
the documentation/routing/disclosure choices and their legal consequences
(Ch.1), and the institutional architecture those choices express (Ch.3). At the
end it hands the resulting lever configuration back to the existing SD model to
show the decade-long consequence.

The thesis the slice must make a player *feel*: **suppression is usually not even
a decision.** Each property of ML failure supplies a true-on-its-face reason
there is no record (Ch.4); the signal dies at the weakest handoff (Ch.2); the
legal function, owning exposure, rationally chooses fewer records (Ch.1); and the
fix is a *different institutional design*, not "write more" (Ch.3). The naive
"protect ourselves / route through counsel / keep it oral" path wins short-term
legal safety and loses on learning, recurrence, regulatory standing, and eventual
exposure. **No path may max every meter** (property-tested).

## 2. What we build into (reuse, do not fork)

DocFlow is a static, browser-only React 19 / Vite / TypeScript / Tailwind /
Zustand app. The slice reuses, never re-implements:

- **`src/engine/` pure model.** Six stocks (`U, D, TD, L, E, C`), `f_doc`,
  equilibria/bifurcation/Monte-Carlo/sensitivity, the parameter registry
  (`clampParam`, `defaultParams`), and `simulate()`. Stays pure.
- **Twelve levers** (`LEVER_KEYS`, all 0–1) and the **institutional scorecard**
  — `safe_to_report_score`, `accountability_legitimacy`, `learning_yield`,
  `litigation_pressure`, `private_ordering_gap`, `policy_scaffold_dependency` —
  which are engine *auxiliaries* (`Auxiliaries` in `engine/types.ts`, computed in
  `engine/model.ts`) surfaced via `institutionalScorecard(params, traj)` in
  `lib/institutional.ts`. **This is the source of truth for institutional
  meters.**
- The cited **analog-regime matrix** (`REGIME_MATRIX`), **design principles**
  (`DESIGN_PRINCIPLES`), and **guided demos** in `lib/institutional.ts`.
- The Zustand **store** (`state/store.ts`): live scenario A recomputed
  synchronously via `simulate`; `loadScenario`, `setMode`, `setView`.
- The lz-string **share codec** (`lib/share.ts`), **exports** (`lib/export.ts`),
  the typed **Web Worker**, and the pinned **EpistemicBanner**.

## 3. Source materials (grounding)

All present and confirmed in `~/Downloads`:

- `AI Incident Litigation Playbook -- WORKING VERSION.pdf` — chapter spine.
- `Comparative Safety Reporting Regimes.md` — primary citation backbone
  (chapter-tagged, ranked analogs, 15 design principles, primary
  statutes/cases/academic sources, a verification checklist).
- Six sector decks (`*_AI_Incident_Governance.pptx`: Nuclear/INPO, Pharma/Devices,
  Cyber negative-analog, Aviation ASRS/ASAP/VDRP, SR 11-7, PSQIA) — analog-mentor
  detail.
- `3_1_Institutional_Design_Principles.docx` — principles + public/private tags.
- `High_Risk_Governance_Comparison.xlsx` — debrief-radar regime facts.

Grounding rules carried verbatim: the cyber **~95% no-written-report figure is an
estimate** (podcast figure per Schwarcz, Wolff & Woods 2023), not measured; **EU
AI Act / PLD** article numbers and dates stay **pin-cite-flagged**; the **AI
Incident Database** is media-derived (~1,400 incidents). Do **not** ingest the
AI-drafted planning memos or Russian analyses. Where the existing repo's
`REGIME_MATRIX` already encodes a cited analog, reuse it rather than re-sourcing.

## 4. The four-lens incident model

An incident unfolds in **phases (turns)**. Each choice does three things: nudges
**levers**, sets incident-state **flags**, and produces a plain-language **"why
each meter moved."** The engine recomputes after each choice.

### Phase spine (production-incident scenario)
1. **Manifestation & detection (Ch.4)** — failure surfaces; type (security /
   misuse / malfunction) and capture-resistance set whether a faithful record is
   even possible.
2. **Capture decision (Ch.4)** — what state to snapshot before retraining
   destroys it. Not capturing is cheap now, irreversible later.
3. **Framing (Ch.1 × Ch.4)** — normative ("dangerous") vs. objective ("override
   frequency rose to X"). Objective keeps engineering value without dissolving
   exposure; obscuring euphemism is penalized as a worse record.
4. **Boundary crossing & escalation (Ch.2)** — engineer → safety → legal →
   executive/board. Each handoff applies translation loss, tie strength, and
   normalization of deviance; signal can degrade or die. Player chooses reporting
   lines, whether an independent safety-review channel exists, and whether legal
   is **translator** vs. **bottleneck**.
5. **Routing & protection (Ch.1 × Ch.3)** — privileged single-track (fragile) vs.
   two-track (protected workflow + discoverable factual core, PSQIA-style).
6. **Remediation (Ch.4 × Ch.3)** — convert findings to engineering action, or
   fail to and silently re-ship.
7. **External disclosure (Ch.1 × Ch.3)** — regulators (Art. 73-style windows),
   peers, public; admission vs. non-admission; EU vs. US posture.
8. **Aftermath (all chapters)** — resolved by **running the real engine forward**
   on the final lever configuration.

### Grounding (no parallel scoring)
- **Institutional meters** = existing scorecard, recomputed live from the nudged
  lever state. Source of truth stays in `src/engine` + `lib/institutional.ts`.
- **Short-term legal safety is decoupled from `litigation_pressure`** (decided
  during implementation, 2026-06-29). The SD model encodes the playbook's own
  thesis: privilege-first / keep-it-oral is a *trap* — gutting the protective
  workflow raises real discoverability more than asserting privilege lowers it, so
  the engine's durable `litigation_pressure` does **not** drop for the oral path.
  The tabletop therefore represents the oral path's lure as a distinct, transparent
  **perceived legal shield** (`legalSafety`, derived from privilege + off-the-record
  flags + low original-records boundary), shown beside the durable
  `litigation_pressure`. The oral path wins the perceived shield (the seductive
  short-term beat) and loses the durable exposure axis — which is exactly the trap,
  and is why no path dominates. The UI must label the shield as short-term/perceived
  and pair it with the litigation-pressure caveat.
- **New, clearly-separated incident meters** (the only new indices; 0–100,
  directional, each chapter-tagged, documented in `TABLETOP.md`):
  - `signal_fidelity` (Ch.2) — original detail surviving at the current boundary.
  - `record_capturability` (Ch.4) — recoverability given failure type + retrain
    cadence + capture choices.
  - `regulatory_timeliness` (Ch.1/3) — duties/windows met.
  - `board_oversight_visibility` (Ch.2) — did the signal reach oversight intact.
  - `evidentiary_posture` (Ch.1) — normative-admission load vs. objective record.
  - `remediation_completeness` (Ch.4) — regression-suite / fix durability.
  - hidden `recurrence_risk` (Ch.4) — revealed only in Aftermath via the
    engine-forward run.
- **Aftermath verdict uses the core engine.** The tabletop ending is DocFlow
  judging the institution the player operated, then offering **"See this as a
  system" → load config into scenario A → Tipping tab.**

## 5. Decision → lever → meter mechanics

Typed, test-validated node/choice schema:

```ts
interface Choice {
  id: string
  label: string
  role: Role                      // Safety/Eng, Counsel, Policy, Exec, Board, Regulator
  chapter: 1 | 2 | 3 | 4          // for filtering & debrief attribution
  rationale: string               // shown after selection
  leverDeltas: Partial<Record<LeverKey, number>>
  incidentEffects: Partial<IncidentMeters>
  flags: string[]                 // e.g. "state_snapshotted", "normative_language",
                                  //      "privileged_single_track", "two_track",
                                  //      "art73_filed", "legal_owns_record",
                                  //      "independent_review_channel"
  analogRefs: AnalogId[]
  citations: SourceRef[]          // real sources from the attached materials
  next: NodeId | NodeId[] | ConditionalNext
}
```

- **Choice application** (pure): fold `leverDeltas` into a working `Params`
  (clamped via `clampParam`), apply `incidentEffects` and `flags`, then recompute
  the scorecard (`simulate` → `institutionalScorecard`) and the incident meters.
- **Ch.2 boundary transfer fn:**
  `signal_fidelity_next = signal_fidelity · tie_strength_factor · (1 −
  translation_loss)`. `near_miss_tier`, `effective_challenge`,
  `intermediary_capacity`, and an `independent_review_channel` flag raise tie
  strength / lower loss. **Normalization-of-deviance** is a probability that a
  true warning is read as noise, rising with retrain cadence, falling with
  `just_culture` + weak-signal vigilance. Monotonic and bounded — property-tested.
- **Ch.4 capturability fn:** decays with failure type (silent / irreproducible /
  distributional / environment-dependent) and retrain cadence; raised by capture
  flags. Skipping capture tanks `record_capturability` and later
  `remediation_completeness`.
- **Meters are directional 0–100 indices, not predictions.** Every movement shows
  a plain "why" and a **"show scoring logic"** panel exposing the formula, levers,
  and flags that drove it.
- **Trade-offs are real and chapter-true:** counsel-owns-record raises short-term
  legal safety, lowers `safe_to_report`/`signal_fidelity`/`learning_yield`;
  normative framing raises `evidentiary_posture` risk while objective framing
  preserves engineering value without dissolving exposure; skipping capture is
  cheap now and costly later; timely Art. 73 filing without
  `safe_harbor_non_admission`/privilege raises `regulatory_timeliness` *and*
  `litigation_pressure` (the PLD trap).
- **No dominant path** (property-tested); the translation-layer path costs up
  front and pays off in Aftermath.

## 6. Architecture & placement

```
src/
  engine/
    tabletop/            # PURE. Imports only engine + types; no React/DOM/IO.
      types.ts           #   scenario/node/choice types, IncidentMeters, Role, flags
      resolver.ts        #   node-graph traversal + reachability
      applyChoice.ts     #   choice → working Params (clamped) + flags + incident effects
      boundary.ts        #   Ch.2 transfer fn + normalization-of-deviance probability
      capturability.ts   #   Ch.4 record-capturability fn
      meters.ts          #   incident-meter computation; reads institutional meters
                         #   directly from engine auxiliaries (finalAux), keeping the
                         #   layer pure — the UI formats them via lib/institutional.ts
                         #   and a parity test proves the two agree
      outcome.ts         #   engine-forward Aftermath outcome + recurrence_risk derivation
      score.ts           #   path scoring; no-dominant-path checks
      index.ts           #   barrel
  lib/
    tabletop/
      scenarios/
        production-incident.ts   # the one launch scenario, chapter-tagged, cited
      schema.ts          #   scenario JSON schema + validate() + a validation command
      debrief.ts         #   Markdown after-action report (reuses Playbook-brief infra)
  state/
    tabletopStore.ts     #   run state; drives scenario A only on explicit handoff
  views/
    Tabletop/
      TabletopSurface.tsx · PhaseView.tsx · ChoiceCard.tsx · MeterRail.tsx
      ScoringLogicPanel.tsx · BoundaryVisualizer.tsx · AnalogMentorPanel.tsx · Debrief.tsx
docs/
  TABLETOP.md            #   source of truth: four-lens mapping, meter semantics,
                         #   transfer fns, engine integration, scenario schema,
                         #   authoring-by-file guide, epistemic limits, Milestone-2 list
```

A **Tabletop** entry is added to the top-level surface switch (`Mode` becomes
`'executive' | 'scientific' | 'tabletop'` in `state/store.ts`; the header tablist
in `App.tsx` gains the third tab; `App` renders `<TabletopSurface/>` when active,
lazy-loaded like the Scientific views). Reuse the Plotly wrapper, share codec,
exports, worker, and banner.

## 7. State

`tabletopStore.ts` holds: active scenario, current node/phase index, the chosen
path (list of choices), the working `Params`, and the derived scorecard + incident
meters. It is independent of the main store on the per-turn hot path. It writes to
the main store **only** on the explicit **"See this as a system"** handoff:
`loadScenario({ params: finalParams, init, settings, presetId: null, name })` then
`setMode('scientific')` + `setView('tipping')`.

## 8. UI surface

- **TabletopSurface** — phase progress, the active **PhaseView**.
- **PhaseView / ChoiceCard** — the node's situation text + chapter tag; each
  choice as a card showing its rationale on selection.
- **MeterRail** (live) — institutional meters rendered through the existing
  scorecard widgets + the new incident meters. Each meter shows a plain "why" and
  a **ScoringLogicPanel** ("show scoring logic") exposing formula + levers + flags,
  including the Ch.2 transfer function and normalization probability.
- **BoundaryVisualizer** — animates `signal_fidelity` degrading across a Ch.2
  handoff.
- **AnalogMentorPanel** — at any node and in debrief, the relevant sector analog
  (mechanism + principle + citation) from `REGIME_MATRIX` + decks.
- **Aftermath / Debrief** — the engine-forward verdict (regime + revealed
  `recurrence_risk`), a per-chapter readout, the counterfactual best-practice
  path, and a Markdown export (reusing Playbook-brief infra). A **"See this as a
  system"** button performs the handoff.
- The no-forecast + not-legal-advice **EpistemicBanner** stays pinned.

## 9. Epistemic integrity (first-class)

1. Directional, not quantitative — indices, never estimates; banners pinned.
2. Inspectable scoring — the "show scoring logic" panel reveals which levers/flags
   moved each meter, including the Ch.2 transfer fn and normalization probability.
3. Real citations only, traced to the attached materials; caveats carried verbatim
   (95% = estimate; EU/PLD pin-cite; AI Incident DB media-derived).
4. No fabricated doctrine — legal nodes play the *direction* of the law and cite
   the relevant chapter; where the law is moving, say so in-node.
5. Honest endings — engine-forward outcomes shown with the SD model's uncertainty
   framing; "contested" stays "contested."

## 10. Testing & production bar (this slice)

Vitest, matching the repo's bar:

- Scenario-schema validation; the production-incident scenario validates.
- Node-graph reachability (no orphan/dead nodes; every `next` resolves).
- Deterministic, seeded choice application (same path → same meters).
- **Institutional-meter parity:** tabletop institutional meters equal
  `institutionalScorecard` for the same config — no drift, no second scoring
  system.
- Ch.2 transfer fn + normalization probability: monotonic and within `[0,1]`/bounds.
- Ch.4 capturability responds correctly to failure type + capture flags.
- **No-dominant-path** property test; the "keep-it-oral / counsel-owns-record"
  path wins short-term `litigation_pressure` and loses learning /
  remediation_completeness / regulatory_timeliness / Aftermath recurrence.
- Engine-forward parity (Aftermath outcome reproducible from the final config).
- Debrief / Markdown export builder.
- React integration: surface switch; one full solo playthrough; the system
  handoff loads scenario A and switches to the Tipping tab.
- Coverage: `engine/tabletop` ≥ 90%. Total test count climbs above 133.
- CI: extend the existing workflow; lint + `tsc -b` + tests + build stay green.

## 11. Decisions made (decide-and-proceed; documented, not asked)

Per the build spec's working agreement, these engineering/illustrative choices are
made and recorded in `TABLETOP.md` rather than raised as questions:

- Exact incident-meter coefficients (illustrative; inspectable via the
  scoring-logic panel).
- Precise tie-strength / translation-loss curve shapes for the Ch.2 transfer fn.
- The production-incident node graph's branching structure (subject to the
  reachability + no-dominant-path tests).

Only a source-derived claim that is genuinely doctrinally ambiguous will be raised
as a question.

## 12. Explicitly deferred — Milestone 2 (documented in TABLETOP.md)

- Remaining nine launch scenarios (chapter-tagged, cited).
- Role mode + facilitator console (cross-role Ch.2 handoff, inject-events, turn
  timer, pauses).
- In-app authoring **editor** (the JSON schema + a validation command ship in this
  slice, so authoring-by-file already works).
- Elicitation capture (playtester disagreement flagging).
- Full After-Action **PDF** with the principles-honored/violated radar (the
  Markdown debrief with per-chapter readout + counterfactual ships in this slice).

## 13. Definition of done (this slice)

- A **Tabletop** surface ships beside Executive/Scientific; one-command build
  green; `engine/tabletop` ≥ 90% coverage; total tests > 133.
- A player runs the **production-incident** scenario through all four lenses —
  sees a Ch.4 capture choice constrain later evidence, watches a Ch.2 handoff lose
  signal fidelity, makes a Ch.1 framing/routing choice that moves exposure,
  expresses a Ch.3 architecture — reaches an Aftermath whose long-run verdict is
  computed by the **real engine**, and clicks **"See this as a system."**
- The "protect ourselves / keep it oral / counsel owns the record" path
  demonstrably wins short-term legal safety and loses on learning, recurrence,
  regulatory standing, and eventual exposure; **no path maxes every meter**
  (property-tested).
- The Markdown debrief exports with per-chapter readouts, counterfactual, analog
  comparisons, the engine-forward outcome, and the no-forecast + not-legal-advice
  lines.
- Every analog/legal claim cites the attached materials; the ~95% figure is
  labeled an estimate; EU entries carry the pin-cite caveat; meters are explicitly
  directional. `TABLETOP.md` matches the code and lists Milestone 2.
