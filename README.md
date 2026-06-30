# DocFlow

[![CI](https://github.com/Bekhzod-Alikhanov/DocFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Bekhzod-Alikhanov/DocFlow/actions)

**DocFlow is a browser-based system-dynamics workbench for AI incident-documentation institutions.**

Live app: [https://doc-flow-ten-pi.vercel.app](https://doc-flow-ten-pi.vercel.app)

DocFlow asks a practical governance question: when an AI system fails, what
institutional design makes people write down what happened, learn from it, and
fix the system without turning every useful record into a litigation trap?

The tool models how an AI organization can tip between two self-reinforcing
regimes:

- **Chilling equilibrium:** legal fear and discoverability pressure suppress
  written incident analysis. Incidents remain undocumented, technical debt rises,
  learning slows, and exposure accumulates.
- **Learning / translation-layer equilibrium:** factual records, protected
  analysis, safe-to-report rules, independent review, near-miss reporting, and
  analytic intermediaries convert incident information into safety improvements.

DocFlow v0.2 is built as a Chapter 3 / policy workbench. It is meant for research
associates, AI labs, in-house legal teams, safety teams, think tanks, and policy
staff who need to reason about incident-reporting architecture before proposing
law, internal controls, or lab governance systems.

> **Epistemic status:** DocFlow is decision-support and structured reasoning, not
> forecasting. The coefficients are illustrative assumptions unless separately
> validated. The cyber "~95% no written forensic report" figure is treated as an
> estimate and a calibration target, not as a measured statistic. Nothing in this
> tool is legal advice.

## What Is On The Website

The deployed website has three presentation modes:

### Tabletop Mode

Tabletop is an interactive incident-response simulation. A player runs a
single AI incident through all four playbook lenses at once, making choices
about capture, framing, routing, remediation, and disclosure. Each choice
nudges institutional levers and incident meters, and the engine recomputes
live. At the end, the real system-dynamics engine runs forward on the
configuration the player produced and shows the long-run consequence.

The central lesson: the "protect ourselves / keep it oral / counsel owns the
record" path wins a perceived short-term legal shield and loses on learning,
recurrence, regulatory standing, and eventual exposure. No path maxes every
meter — this is property-tested.

### Executive Mode

Executive mode is the fast demonstration surface. It shows:

- Sector/institutional presets with citations and caveats.
- Grouped policy levers.
- A headline regime readout: chilling, learning, or contested.
- Key final metrics: documentation fraction, technical debt, learning, exposure,
  culture, safe-to-report score, and private-ordering gap.
- A single chart showing documentation fraction, culture, and technical debt.
- A persistent no-forecast banner.

This mode is useful for live demos and quick conversations with people who do not
need to inspect the full model.

### Scientific Mode

Scientific mode keeps the same live scenario but adds deeper analytical tabs:

| Tab | What it does |
|---|---|
| **Workbench** | Shows all six stocks, documentation fraction, Monte Carlo bands, and the full assumptions/methods table. |
| **Institutional design** | Chapter 3 workbench: two-track architecture diagram, guided demos, audience modes, institutional scorecard, analog-regime matrix, design principles, and caveats. |
| **Causal loops** | Displays the feedback structure and current loop dominance: suppression spiral, learning flywheel, or remediation loop. |
| **Tipping** | Shows 1-lever bifurcation, hysteresis, and 2-lever tipping maps. Clicking a chart point loads those lever values into the live scenario. |
| **Sensitivity** | Runs tornado, Sobol, and PRCC sensitivity analyses over selected levers. |
| **Compare** | Captures the current scenario as A or B, then compares regimes, metrics, and trajectories. |

Scientific mode also exposes a **Monte Carlo** toggle in the header. Heavy
analyses run in a Web Worker so the interface stays responsive.

## Who This Is For

### Research Associates

Use DocFlow to turn analog-regime research into chapter-ready tables, demo
scripts, and caveated claims. The Institutional Design view surfaces source
caveats, transferability limits, and unresolved pin-cite risks.

### AI Labs

Use DocFlow to stress-test internal incident architecture:

- Which improvements can be built through private ordering?
- Where does the lab need statute, regulator action, or external safe harbor?
- Does the design separate factual safety records from counsel-directed legal
  analysis?
- Does independent review have authority to force engineering change?

### Think Tanks And Policy Teams

Use DocFlow to compare policy packages:

- Mandatory reporting alone.
- Mandatory reporting plus non-admission / safe harbor.
- Confidential near-miss channels.
- Public accountability floors plus confidential learning channels.
- SR 11-7-style effective challenge.
- PSQIA-style workflow protection.

## Core Model

DocFlow keeps a six-stock system-dynamics model:

| Stock | Meaning |
|---|---|
| `U` | Undocumented incidents |
| `D` | Documented and analyzed incidents |
| `TD` | Latent technical debt |
| `L` | Organizational learning / safety capability |
| `E` | Litigation and regulatory exposure |
| `C` | Documentation culture / psychological safety |

The central nonlinear variable is `f_doc`, the fraction of new incidents that
get documented and analyzed. `f_doc` rises with culture, just culture, and
well-designed reporting incentives; it falls when perceived discoverability and
backfire risk dominate.

The model is designed to demonstrate path dependence. In some configurations the
same institution can settle into a chilling basin or a learning basin depending
on starting culture and lever values.

## Twelve Institutional Levers

All primary levers are normalized from 0 to 1 and grouped in the UI.

| Lever | What it represents |
|---|---|
| `privilege_strength` | Strength of legal protection for internal analysis. |
| `just_culture` | Clear protection for honest error with misconduct carve-outs. |
| `mandatory_reporting` | Duty or pressure to report serious incidents. |
| `pld_penalty` | Disclosure / adverse-inference pressure. |
| `recipient_enforcer_separation` | Whether the report recipient is separated from the enforcer. |
| `translation_layer` | Ability to convert incident reports into safety requirements. |
| `workflow_protection` | PSQIA-style protection for a defined safety workflow rather than a single document. |
| `original_records_boundary` | Separation between discoverable factual records and protected analysis. |
| `safe_harbor_non_admission` | Rule that reporting is not an admission of fault or causation. |
| `effective_challenge` | SR 11-7-style independent review with authority to force change. |
| `near_miss_tier` | Voluntary weak-signal reporting alongside mandatory serious-incident reporting. |
| `intermediary_capacity` | NASA/PSO/INPO-style body that converts reports into shared learning. |

## Institutional Scorecard

The Institutional Design view adds readouts that are more useful for policy and
lab governance than raw ODE variables:

| Readout | Meaning |
|---|---|
| **Safe-to-report score** | How safe candid reporting feels after privilege, workflow protection, separation, safe harbor, and culture are considered. |
| **Accountability legitimacy** | Whether protection is bounded by facts, just-culture rules, reporting duties, and independent review. |
| **Learning yield** | Durable learning produced per incident signal. |
| **Litigation pressure** | Discoverability and adverse-inference pressure that pushes teams away from writing things down. |
| **Private-ordering gap** | How much the desired design depends on public-law scaffolding a lab cannot create alone. |
| **Policy-scaffold dependency** | Reliance on statute-like protection such as workflow privilege, safe harbor, or regulator-held privilege. |

## Presets

DocFlow ships with eight cited presets:

| Preset | Teaching point |
|---|---|
| **Cyber privilege-first anti-pattern** | Fragile privilege and discoverability pressure chill documentation. |
| **Aviation ASRS + ASAP** | Neutral intake, just culture, near-miss reporting, and feedback loops can normalize reporting before catastrophe. |
| **PSQIA-style workflow protection** | Protect the analytic workflow while preserving a discoverable factual core. |
| **Pharma mandatory-safe-to-report** | Mandatory adverse-event reporting works better when reports are treated as signals, not admissions. |
| **SR 11-7 effective challenge** | Documentation becomes a control when independent validators can force change. |
| **Nuclear dual-channel** | Public mandatory reporting and confidential peer learning can operate in parallel. |
| **EU AI Act + PLD trap** | Duty plus disclosure/adverse inference without analytic protection can reproduce chilling. |
| **Contested baseline** | A bistable middle case that demonstrates path dependence and tipping. |

Each preset includes basis/caveat text in the UI. The cyber preset explicitly
labels the 95% suppression figure as an estimate. The EU AI Act + PLD preset
flags pin-cite verification risks.

## Analog Regime Matrix

The Institutional Design view contains a static matrix summarizing transfer
lessons from:

- Aviation: ASRS / ASAP / VDRP.
- Healthcare: PSQIA / PSO / PSES.
- Pharma and devices: FAERS / MAUDE / pharmacovigilance.
- Financial services: SR 11-7 model risk management.
- Nuclear: NRC public reporting plus INPO peer learning.
- Cybersecurity: privilege-first incident response.
- AI current law: EU AI Act + Product Liability Directive.

For each regime, the matrix records the mechanism, protected thing, source of
protection, transferable principle, transferability to AI, and caveat.

## Guided Demos

The website includes one-click guided demos:

- Why cyber chills documentation.
- Why aviation reports before catastrophe.
- Why PSQIA protects workflow, not facts.
- Why mandatory reporting needs safe-to-report.
- Why SR 11-7 makes documentation a control.
- Why nuclear runs two channels.

Each guided demo loads a preset and suggests the lever move to make the mechanism
visible.

## Scenario Workflows

The header toolbar works in both modes:

- Rename the current scenario.
- Save scenarios to browser `localStorage`.
- Load saved scenarios.
- Duplicate scenarios.
- Share a complete scenario through a compressed URL hash.
- Import/export scenario JSON.
- Export CSV time series.
- Export PNG/PDF of the currently mounted chart.
- Export a Markdown **Playbook brief** with scenario summary, scorecard, regime
  matches, matrix, caveats, and the no-forecast line.

Old v0.1 share URLs are preserved through a migration path in the share codec.

## Suggested Live Demo

1. Open [https://doc-flow-ten-pi.vercel.app](https://doc-flow-ten-pi.vercel.app).
2. Start in **Executive** mode.
3. Load **Cyber privilege-first anti-pattern** and show the chilling readout.
4. Load **Aviation ASRS + ASAP** and show the learning readout.
5. Load **EU AI Act + PLD trap** and point out high litigation pressure.
6. Switch to **Scientific -> Institutional design**.
7. Click **Why mandatory reporting needs safe-to-report**.
8. Lower `safe_harbor_non_admission` and watch safe-to-report and litigation
   pressure move.
9. Switch to **Tipping** and show how a lever can move the system across a
   threshold.
10. Use **Export -> Playbook brief** to create a Chapter 3-ready Markdown artifact.

## Suggested Tabletop Demo

1. Switch to the **Tabletop** surface.
2. Start the **Production Incident: High-Severity Model Output** scenario.
3. In Phase 2 (Evidence Capture), choose **"Capture only a minimal oral
   summary; avoid creating discoverable artifacts"** — watch `record_capturability`
   fall. Note that this choice is cheap now and irreversible later.
4. In Phase 3 (Framing), choose **"Keep analysis oral; counsel owns the record;
   no written safety workflow"** — watch `signal_fidelity` drop via the Ch.2
   transfer function and the perceived legal shield (`legalSafety`) rise, while
   `litigation_pressure` does NOT improve durably.
5. Continue through Phases 4–7, choosing the containment / minimal-notice path.
6. Reach **Aftermath** — the real engine runs forward. Observe high `recurrenceRisk`
   and a chilling or contested regime.
7. Click **"See this as a system"** — the lever configuration is loaded into
   scenario A and the Tipping tab opens, showing the decade-long consequence of
   the institutional design the player expressed.

**Authoring new scenarios:** create a `.ts` file in
`src/lib/tabletop/scenarios/`, export a `TabletopScenario` following the types
in `src/engine/tabletop/types.ts`, then run:

```bash
npm run validate:scenarios
```

The validator checks lever keys, incident-meter keys, node reachability, and
citation requirements. See `docs/TABLETOP.md` for the full authoring guide.

## Technical Architecture

DocFlow is static/browser-only:

- **Frontend:** React 19, Vite 8, TypeScript, Tailwind v4, Zustand.
- **Charts:** Plotly loaded lazily through a thin local wrapper.
- **Exports:** Markdown, CSV, PNG, PDF, and JSON.
- **Persistence:** browser `localStorage`.
- **Sharing:** lz-string URL hash.
- **Heavy computation:** typed Web Worker for Monte Carlo, Sobol, PRCC, sweeps,
  and hysteresis.
- **Deployment:** Vercel static hosting with SPA rewrite.

The simulation engine in `src/engine` is pure and framework-agnostic. It imports
no React, DOM, storage, or network code. This makes it portable to a worker, CLI,
or future Python implementation.

## Local Development

Prerequisite: Node 24.x.

```bash
git clone https://github.com/Bekhzod-Alikhanov/DocFlow.git
cd DocFlow
npm install
npm run dev
```

Open `http://localhost:5173`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and build the static site to `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm test` | Run Vitest in watch mode. |
| `npm run test:run` | Run the test suite once. |
| `npm run coverage` | Run tests with coverage. |
| `npm run typecheck` | Run `tsc -b`. |
| `npm run lint` | Run ESLint. |

## Validation And Tests

The current test suite verifies:

- Parameter registry completeness and range enforcement.
- Model primitives and monotonic institutional behavior.
- Flow accounting and finite derivatives.
- Integration convergence and deterministic repeatability.
- Equilibria, stability classification, bifurcation, and hysteresis.
- Monte Carlo reproducibility.
- Sobol / PRCC / tornado sensitivity routines.
- Scenario presets and institutional analog regressions.
- Share URL round-trips and v0.1 migration.
- Export builders, including the Playbook brief.
- React integration paths for mode switching, lever updates, saves, and the
  Institutional Design tab.

Current verification: **205 tests pass**, plus typecheck, lint, scenario
validation, and production build.

## Repository Map

```text
src/
  engine/      Pure model, registry, simulation, equilibria, bifurcation,
               Monte Carlo, sensitivity, presets, and tests.
  workers/     Typed worker protocol and hook for heavy analyses.
  state/       Zustand store for live scenario A and comparison scenario B.
  lib/         Persistence, share codec, exports, formatting, institutional data,
               loop scoring, chart registry, and Plotly wrapper.
  components/  Reusable UI, charts, sliders, toolbar, assumptions panel, banner.
  views/       Scientific-mode views.
docs/
  MODEL.md         Equation-level model documentation.
  METHODS.md       Numerics, validation, and epistemic limits.
  ARCHITECTURE.md  Stack and data-flow notes.
```

## Important Limits

- DocFlow is not a forecast and not legal advice.
- Coefficients are illustrative unless separately validated.
- The analog-regime matrix is source-backed but still needs jurisdiction-specific
  legal review before external policy use.
- The EU AI Act / PLD entry intentionally carries a pin-cite verification caveat.
- Private ordering can build workflows, culture, factual boundaries, and internal
  review, but cannot by itself bind courts, plaintiffs, or regulators.

## Deployment

The project is deployed on Vercel as a static Vite app:

- Production: [https://doc-flow-ten-pi.vercel.app](https://doc-flow-ten-pi.vercel.app)
- Vercel config: [`vercel.json`](vercel.json)
- Output directory: `dist`
- SPA rewrite: all routes serve `index.html`

Every push to `main` on GitHub can be deployed by Vercel.
