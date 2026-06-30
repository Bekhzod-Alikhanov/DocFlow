# ARCHITECTURE.md — DocFlow

## Stack choice: TypeScript-only, static-deployable

The spec (§6) offers two architectures: a two-service Python/FastAPI + React
stack, or a TypeScript-only static site with the engine in a typed module. **We
chose the TypeScript-only path.** Reasoning:

1. **Zero-backend sharing for a mixed audience.** The intended users — research
   scientists, in-house lawyers, policy staff, executives — need to *run and see*
   scenarios and share them. A static site deploys anywhere (or opens from a
   file) and shares via a URL that encodes the whole scenario. No server to host,
   secure, or keep running.
2. **Runs on the target machine with zero new installs.** The deployment
   environment has Node + npm but **no Python and no Docker**. The primary stack
   would require installing both; the TS-only stack uses only what's present.
3. **The engine is still a cleanly isolated, pure module.** Per the spec's
   requirement, [`src/engine`](../src/engine) imports no React, no DOM, no I/O.
   It could be compiled to a worker, run from a CLI, or **ported to Python**
   (the equation set in [`MODEL.md`](./MODEL.md) is the port spec). The heavy
   scientific tooling the spec attributes to SciPy/SALib is hand-rolled and unit
   tested: a real-matrix eigenvalue solver (`linalg.ts`), a fixed-point finder
   with numerical Jacobian (`equilibria.ts`), Saltelli/Sobol and LHS sampling
   (`sensitivity.ts`), and vectorized Monte Carlo (`monteCarlo.ts`).

Trade-off accepted: no off-the-shelf SciPy/SALib; we implement and test the
numerics ourselves. Each routine is validated against analytic/known answers
(e.g. eigenvalues of known matrices; Sobol indices of the Ishigami function).

## Layers

```
src/
  engine/        Pure simulation & analysis core (no framework). The contract is index.ts.
                 stocks/flows (model.ts), integrators (RK4/Euler), simulate, registry,
                 presets, equilibria + Jacobian (linalg), bifurcation/hysteresis,
                 monteCarlo, sensitivity (Sobol/LHS), rng.
    tabletop/    Pure tabletop engine (no React/DOM/IO). Imports only engine + types.
                 types.ts          — scenario/node/choice types, IncidentMeters, Role, flags.
                 boundary.ts       — Ch.2 transfer function + normalization-of-deviance probability.
                 capturability.ts  — Ch.4 record-capturability function.
                 meters.ts         — institutional-meter bridge (reads engine auxiliaries directly).
                 applyChoice.ts    — pure reducer: lever deltas, flags, incident effects.
                 outcome.ts        — engine-forward Aftermath verdict + recurrenceRisk derivation.
                 resolver.ts       — node-graph traversal, reachability, path enumeration.
                 score.ts          — path scoring, perceivedLegalShield, hasDominantPath.
                 index.ts          — barrel export.
  workers/       Typed-RPC Web Worker (protocol.ts + engine.worker.ts) and the
                 useWorkerTask hook. Runs the heavy analyses (MC, Sobol, PRCC,
                 sweeps, hysteresis) off the main thread with stale-response
                 suppression so dragging a selector never blocks the UI.
  state/         Zustand store: the live scenario A (recomputed synchronously on
                 every change), the frozen comparison scenario B, presentation
                 mode, and the active analytical view.
    tabletopStore.ts  — run state for the Tabletop surface. Independent of the main
                        store on the per-turn hot path; writes to scenario A only on
                        the explicit "See this as a system" handoff.
  lib/           Persistence (localStorage, versioned + migratable), URL scenario
                 codec (share.ts, lz-string), CSV/PNG/PDF export (export.ts),
                 loop-dominance scoring (loops.ts), the lazy Plotly wrapper
                 (Plot.tsx → PlotImpl.tsx), theme tokens, and the chart registry.
    tabletop/    Scenario data + validation + debrief.
                 scenarios/production-incident.ts — the one launch scenario (8-phase spine).
                 schema.ts         — structural validator (npm run validate:scenarios).
                 debrief.ts        — Markdown after-action report (reuses export epistemic framing).
  components/    Sliders, the Plotly-backed charts (time series, bifurcation,
                 heatmap, sensitivity bars, tornado), the hand-drawn causal-loop
                 diagram, the scenario toolbar, tabs, assumptions panel, banner.
  views/         Scientific-mode views, lazy-loaded: Workbench, CausalLoopView,
                 TippingView, SensitivityView, CompareView.
    Tabletop/    Tabletop surface views, lazy-loaded: TabletopSurface, PhaseView,
                 ChoiceCard, MeterRail, ScoringLogicPanel, BoundaryVisualizer,
                 AnalogMentorPanel, Debrief.
```

## Data flow

1. The store holds the live scenario A (params + init + settings). Scenario B is
   an optional frozen snapshot used only by the compare view.
2. A lever change → a deterministic `simulate()` call (sub-millisecond, main
   thread) → trajectory + summary → charts and the causal-loop diagram (which
   reads the already-computed auxiliaries, so it's free).
3. Heavy analyses (Monte Carlo bands, Sobol/PRCC sensitivity, 1-/2-lever sweeps,
   hysteresis) are dispatched to the Web Worker over a typed discriminated-union
   protocol. The worker imports the same pure engine, so results are identical to
   a main-thread run and reproducible from the `RunRecord`. The `useWorkerTask`
   hook drops stale replies, so a flurry of selector changes only applies the last.
4. Scenarios persist to `localStorage` (versioned records stamped with
   `MODEL_VERSION`) and serialize to a complete, re-runnable JSON spec; a
   compressed positional form rides in the URL hash for sharing, re-validated via
   `sanitizeParams` on decode.
5. **Tabletop surface:** `useTabletopStore` is independent of the main store on
   the per-turn hot path. Each player choice calls `applyChoice` (pure reducer),
   then resolves the next node via `resolveNext`. The tabletop calls `simulate()`
   directly (same pure engine) to update institutional meters after each choice.
   It writes to the main store **only** on the explicit "See this as a system"
   handoff: `loadScenario({ params, init, settings, ... })` then
   `setMode('scientific')` + `setView('tipping')`. There is no shared mutable
   state between the tabletop and the main model while a run is in progress.

## Tech

- **Build:** Vite 8, React 19, TypeScript (strict), Tailwind v4. Plotly, jsPDF,
  and each Scientific view are code-split into lazily-loaded chunks via
  `React.lazy` + dynamic `import()`, keeping the initial bundle ~77 kB gzipped.
- **Charts:** Plotly.js (bands, bifurcation, heatmaps, sensitivity bars) via a thin
  React wrapper (avoids `react-plotly.js` React-19 peer-dep friction), lazily
  loaded so Plotly stays out of the initial bundle.
- **State:** Zustand. **Persistence:** `localStorage` (small JSON; versioned +
  migratable). **Sharing:** lz-string URL-hash codec. **Exports:** jsPDF + canvas.
- **Concurrency:** one hand-rolled typed-RPC Web Worker (no comlink) for the heavy
  analyses; the engine runs unchanged inside it.
- **Tests:** Vitest (Node env for the engine, jsdom for components/hooks via a
  `// @vitest-environment jsdom` file directive); coverage via
  `@vitest/coverage-v8`, engine held to ≥90% (`engine/tabletop` currently ~99%).
  205 tests.
- **CI:** GitHub Actions — typecheck (`tsc --strict`), lint, tests + coverage,
  build.

## Deploy

`npm run build` emits a static bundle (relative asset paths via `base: './'`) that
can be served by any static host or opened locally — no backend. The repo is wired
to **Vercel** (see `vercel.json`: Vite framework, `dist` output, SPA rewrite); every
push to `main` triggers CI and an auto-deploy.
