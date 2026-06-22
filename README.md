# DocFlow

**A system-dynamics model of AI incident-documentation suppression.**

DocFlow models how an AI company's incident-*documentation behavior* tips between
two self-reinforcing regimes — a **chilling** equilibrium (legal fear suppresses
written incident analysis; the organization stops learning; technical debt and
harm compound) and a **learning / translation-layer** equilibrium (a privilege
architecture, just-culture signaling, and recipient–enforcer separation make
documenting feel safe; learning compounds; failures recur less).

It lets a mixed audience — research scientists, in-house lawyers, policy staff,
and executives — run scenarios, adjust policy levers, watch the system tip
between equilibria, quantify uncertainty, and compare sectors.

> **This is decision-support and structured reasoning, not forecasting.** Every
> result carries a persistent no-forecast label. All coefficients are
> illustrative assumptions; the widely-cited ~95% cyber-suppression figure is an
> *estimate*, not a measurement, and is labeled as such throughout.

## Quickstart

```bash
cd docflow
npm install
npm run dev      # open http://localhost:5173
```

No backend, no database, no Docker required — the app is a static, TypeScript-only
site and the simulation engine runs in the browser.

Try this (the signature demo):

1. Click the **Cybersecurity** preset → the headline shows the **chilling**
   attractor (~4% documented, high technical debt).
2. Click **Aviation** or **Healthcare (PSQIA)** → the **learning** attractor.
3. Load the **Contested baseline** and drag **Just culture** up: the system
   **tips** from chilling to learning at a threshold (a saddle-node bifurcation).
4. Switch to **Scientific** mode and explore the tabs:
   - **Causal loops** — the live feedback structure; the dominant loop (R1
     suppression spiral vs. R2 learning flywheel) lights up as you drag levers.
   - **Tipping** — a 1-lever bifurcation diagram (with a hysteresis overlay) and a
     2-lever tipping heatmap. Click any point to load those lever values.
   - **Sensitivity** — tornado, Sobol (S1/ST), and PRCC for any model output.
   - **Compare** — snapshot scenario **A**, then diff it against **B** in a delta
     table and an overlaid time series.
5. Toggle **Monte Carlo** in the header for 10–90% bands, then **Save**, **Share**
   (a self-contained URL), or **Export** the scenario to CSV / PNG / PDF.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build the static site to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the test suite (watch) |
| `npm run test:run` | Run the test suite once |
| `npm run coverage` | Run tests with coverage (engine held to ≥90%) |
| `npm run typecheck` | `tsc -b` (strict) |
| `npm run lint` | ESLint |

## What's inside

- **A pure, framework-agnostic simulation engine** (`src/engine`) — stocks,
  flows, RK4/Euler integrators, a typed parameter registry, equilibrium &
  Jacobian-eigenvalue stability analysis, bifurcation/hysteresis sweeps, seeded
  Monte Carlo with percentile bands, and Sobol / LHS-PRCC / tornado sensitivity.
  It imports no React or DOM and is ~97% test-covered — the portable scientific
  core (it could be compiled to a worker or ported to Python).
- **The model is demonstrably bistable**: two stable attractors plus an unstable
  separatrix, a saddle-node fold along a lever, and a hysteresis loop — all
  verified in the test suite.
- **A React UI** with Executive and Scientific modes, live lever sliders, time-
  series charts (Plotly), the four cited sector presets, an always-reachable
  Assumptions & Methods panel, and a persistent no-forecast banner.
- **Analytical views** built on the engine: an interactive causal-loop diagram
  with live loop-dominance, a 1-/2-lever tipping explorer, Sobol/PRCC/tornado
  sensitivity charts, and A/B scenario compare.
- **Scenario management**: save/load/duplicate to `localStorage`, JSON
  import/export, and a shareable URL that encodes the whole scenario into the hash
  (lz-string) — no backend. CSV/PNG/PDF export carries the no-forecast line and
  full run provenance.
- **A typed-RPC Web Worker** (`src/workers`) runs the heavy analyses (Monte Carlo,
  sweeps, Sobol, PRCC) off the main thread, with stale-response suppression so
  dragging a selector never blocks the UI. Plotly, jsPDF, and each analytics view
  are code-split into lazy chunks, keeping the initial bundle ~77 kB gzipped.

## Documentation

- [`docs/MODEL.md`](docs/MODEL.md) — the equations, the parameter registry, the
  bistability result, and a log of every refinement (the source of truth for the
  math; it matches the code).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack choice & data flow.
- [`docs/METHODS.md`](docs/METHODS.md) — solver, Monte Carlo, sensitivity,
  validation tests, and a candid statement of the model's epistemic limits.

## Status

Complete and tested: the simulation engine, all analytical views (causal-loop
diagram, tipping explorer, sensitivity, A/B compare), scenario management
(save/load/duplicate/share/import-export), CSV/PNG/PDF export, the off-main-thread
Web Worker, the epistemic layer, and the CI pipeline. 123 tests pass; the engine
is held to ≥90% coverage (currently ~97%). Deployed as a static site on Vercel.
