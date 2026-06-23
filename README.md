# DocFlow

**A system-dynamics workbench for AI incident-documentation institutions.**

DocFlow models how an AI company's incident-documentation behavior can tip
between two self-reinforcing regimes:

- **Chilling equilibrium:** legal fear suppresses written incident analysis, the
  organization learns less, and technical debt plus harm compound.
- **Learning / translation-layer equilibrium:** protected workflow, factual-record
  boundaries, safe-harbor rules, independent challenge, near-miss reporting, and
  analytic intermediaries make documentation useful rather than self-defeating.

The v0.2 direction is a Chapter 3 workbench: research associates, AI labs, think
tanks, lawyers, policy staff, and executives can test institutional design
packages, compare analog reporting regimes, and export scenario briefs.

> **This is decision-support and structured reasoning, not forecasting.** Every
> result carries a persistent no-forecast label. All coefficients are
> illustrative assumptions; the widely cited ~95% cyber-suppression figure is an
> estimate, not a measurement, and is labeled as such throughout.

## Quickstart

```bash
cd docflow
npm install
npm run dev      # open http://localhost:5173
```

No backend, no database, no Docker required. The app is a static TypeScript site
and the simulation engine runs in the browser.

## Signature Demo

1. Click **Cyber privilege-first anti-pattern** to show the chilling attractor.
2. Click **Aviation ASRS + ASAP** or **PSQIA-style workflow protection** to show
   learning regimes.
3. Load **Contested baseline** and drag **Just culture** upward to show tipping
   from chilling to learning.
4. Switch to **Scientific** mode and open:
   - **Institutional design:** Chapter 3 workbench with a two-track incident
     architecture diagram, guided demos, audience modes, regime matrix, scorecard,
     private-ordering gap, and policy-scaffold dependency.
   - **Causal loops:** live feedback structure and dominant-loop readout.
   - **Tipping:** bifurcation diagram, hysteresis overlay, and 2-lever heatmap.
   - **Sensitivity:** tornado, Sobol, and PRCC screening.
   - **Compare:** snapshot scenario A and diff it against scenario B.
5. Use **Export -> Playbook brief** for a Markdown scenario summary with caveats,
   scorecard, regime matches, and the comparison matrix. CSV, PNG, PDF, and JSON
   exports remain available.

## Presets

- Cyber privilege-first anti-pattern
- Aviation ASRS + ASAP
- PSQIA-style workflow protection
- Pharma mandatory-safe-to-report
- SR 11-7 effective challenge
- Nuclear dual-channel
- EU AI Act + PLD trap
- Contested baseline

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build the static site to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the test suite in watch mode |
| `npm run test:run` | Run the test suite once |
| `npm run coverage` | Run tests with coverage |
| `npm run typecheck` | Run `tsc -b` |
| `npm run lint` | Run ESLint |

## What's Inside

- **Pure simulation engine** in `src/engine`: stocks, flows, RK4/Euler
  integrators, typed registry, equilibrium and stability analysis, bifurcation
  sweeps, seeded Monte Carlo, Sobol, PRCC, and tornado sensitivity.
- **Twelve institutional levers:** privilege, just culture, mandatory reporting,
  PLD penalty, recipient-enforcer separation, translation layer, workflow
  protection, original-records boundary, safe harbor / non-admission, effective
  challenge, near-miss tier, and intermediary capacity.
- **Institutional Design view:** static source-backed regime matrix, guided demos,
  audience lenses, architecture diagram, private-ordering vs statute-dependent
  scorecard, and source caveats.
- **Scenario management:** save/load/duplicate to `localStorage`, JSON
  import/export, and shareable URL hashes that preserve old v0.1 links.
- **Exports:** Markdown playbook brief, CSV, PNG, PDF, and JSON with the
  no-forecast line and provenance.
- **Worker-backed analytics:** heavy analyses run off the main thread; Plotly,
  jsPDF, and analytical views are code-split.

## Documentation

- [`docs/MODEL.md`](docs/MODEL.md) documents the equations, parameter registry,
  and refinement log.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) documents stack choice and data
  flow.
- [`docs/METHODS.md`](docs/METHODS.md) documents numerics, validation tests, and
  epistemic limits.

## Status

DocFlow v0.2 is static/browser-only and tested: Institutional Design, causal-loop
diagram, tipping explorer, sensitivity, A/B compare, scenario management,
playbook/CSV/PNG/PDF/JSON export, off-main-thread analytics, epistemic framing,
and CI. Current verification: 133 tests pass, plus typecheck, lint, and build.
