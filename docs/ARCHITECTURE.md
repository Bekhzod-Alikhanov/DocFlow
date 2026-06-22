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
  workers/       Web Worker wrapper that runs the heavy analyses (MC, Sobol, sweeps)
                 off the main thread so the UI stays responsive.
  state/         Zustand store: scenarios, levers, mode, analysis caches.
  lib/           Persistence (IndexedDB), URL scenario codec (lz-string), CSV/PNG/PDF export.
  components/    Sliders, charts (Plotly wrapper), CLD/stock-flow diagram, compare,
                 tipping explorer, assumptions panel, epistemic banner.
  modes/         Executive vs Scientific presentation modes (progressive disclosure).
```

## Data flow

1. The store holds the active `Scenario` (params + init + settings).
2. Lever changes debounce → a deterministic `simulate()` call (instant, main
   thread) → trajectory + summary → charts.
3. Heavy analyses (Monte Carlo bands, Sobol sensitivity, 1-/2-lever sweeps) are
   dispatched to the Web Worker, which imports the same pure engine, so results
   are identical to a main-thread run and reproducible from the `RunRecord`.
4. Scenarios persist to IndexedDB and serialize to a complete, re-runnable JSON
   spec; a compressed form rides in the URL hash for sharing.

## Tech

- **Build:** Vite 8, React 19, TypeScript (strict), Tailwind v4.
- **Charts:** Plotly.js (bands, phase portraits, bifurcation heatmaps) via a thin
  React wrapper (avoids `react-plotly.js` React-19 peer-dep friction).
- **State:** Zustand. **Persistence:** IndexedDB. **Exports:** jsPDF + canvas.
- **Tests:** Vitest (Node env for the engine, jsdom for components); coverage via
  `@vitest/coverage-v8`, engine held to ≥90%.
- **CI:** GitHub Actions — typecheck (`tsc --strict`), lint, tests + coverage.

## Deploy

`npm run build` emits a static bundle (relative asset paths via `base: './'`) that
can be served by any static host or opened locally. A single-command Docker
option (nginx serving the build) is provided for parity with the spec's
"one command up" goal, but is optional — the app needs no backend.
