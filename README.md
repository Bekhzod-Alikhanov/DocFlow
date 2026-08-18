# DocFlow

[![CI](https://github.com/Bekhzod-Alikhanov/DocFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Bekhzod-Alikhanov/DocFlow/actions)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind 4](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-271%20passing-brightgreen)
![Engine coverage](https://img.shields.io/badge/engine%20coverage-98%25-brightgreen)

**DocFlow is a browser-based system-dynamics workbench for AI incident-documentation institutions.**

Live app: **[https://doc-flow-ten-pi.vercel.app](https://doc-flow-ten-pi.vercel.app)**

DocFlow asks a practical governance question: when an AI system fails, what
institutional design makes people write down what happened, learn from it, and
fix the system without turning every useful record into a litigation trap?

The tool models how an AI organization tips between two self-reinforcing regimes:

- **Chilling equilibrium** — legal fear and discoverability pressure suppress
  written incident analysis. Incidents stay undocumented, technical debt rises,
  learning slows, and exposure accumulates.
- **Learning / translation-layer equilibrium** — factual records, protected
  analysis, safe-to-report rules, independent review, near-miss reporting, and
  analytic intermediaries convert incident information into safety improvements.

It is built for research associates, AI labs, in-house legal teams, safety teams,
think tanks, and policy staff who need to reason about incident-reporting
architecture *before* proposing law, internal controls, or lab governance.

> **Epistemic status.** DocFlow is decision-support and structured reasoning, not
> forecasting. Coefficients are illustrative assumptions unless separately
> validated. The cyber "~95% no written forensic report" figure is treated as an
> *estimate* and calibration target, not a measured statistic. Nothing here is
> legal advice. Every analog/legal claim in the app carries an inline source and
> caveat; EU AI Act / PLD entries carry a pin-cite verification flag.

---

## By the numbers

| | |
|---|---|
| **Source** | ~16,000 lines of TypeScript across **92** modules (strict mode) |
| **Tests** | **501** Vitest specs across 70 files (~6,700 LOC); deterministic, mock-free |
| **Pure simulation core** | ~6,070 LOC (`engine/` + `engine/tabletop/`) with **zero** React/DOM/IO imports |
| **Engine coverage** | `engine` 96.6% stmts · `engine/tabletop` **100%** stmts / 98.2% branch |
| **Domain model** | **10** stocks · **15** levers · **101** registered parameters · 6 institutional meters · 7 incident meters |
| **Provenance** | T1 measured **0** · T2 analog **0** · T3 structural 14 · T4 free 87 |
| **Content** | **10** cited incident scenarios · 8 cited presets · 7 analog regimes · 15 design principles |
| **Surfaces** | 3 top-level modes · 6 scientific analysis tabs · 4 playbook lenses |
| **Initial load** | **~111 KB gzip** (app shell + CSS); Plotly, the scenario bundle, and PDF libs are code-split and lazy |
| **Docs** | ~1,400 lines of model docs plus ~3,100 lines of `docs/plan/` (audit, spec, calibration, validation, 12 ADRs) |

The structural counts — stocks, levers, parameters and the provenance census — are
asserted by `src/engine/readmeCurrency.test.ts` and fail CI if this table drifts from the
code. The line-count and bundle figures are as of v0.3.0 and are not machine-checked.

**This table was wrong for the whole of v0.3 until 2026-08-18**, claiming 6 stocks and 12
levers when the model had 10 and 15, and it said "every one of those numbers is produced
by the checked-in code" while saying so. That is the same defect the audit's F1 records,
in the first thing a reader sees — hence the test.

---

## What is on the website

The deployed app has three presentation modes over one shared, live model.

### Tabletop mode

An interactive, first-person incident-response simulation. It ships **10 cited
scenarios** — production incidents, near-misses, red-team findings, misuse,
prompt injection, cross-firm systemic risk, legal bottleneck design, weak-tie
signal decay, discovery/litigation pressure, and cross-border disclosure —
selectable through a **scenario picker**. A player runs a scenario through the
relevant playbook lenses, choosing how to capture, frame, route, remediate, and
disclose. Each choice nudges institutional levers and incident meters and the
engine recomputes live. At the end, the **real** system-dynamics engine runs
forward on the configuration the player produced and shows the decade-long
consequence — then offers *"See this as a system"* to load that configuration
into the analytical surface.

The central, property-tested lesson: the *"protect ourselves / keep it oral /
counsel owns the record"* path wins a **perceived short-term legal shield** and
loses on learning, recurrence, regulatory standing, and eventual exposure.
**No path maxes every meter.**

### Executive mode

The fast demonstration surface: sector/institutional presets with citations and
caveats, grouped policy levers, a headline regime readout (chilling / learning /
contested), key final metrics, a single documentation-fraction/culture/debt
chart, and a persistent no-forecast banner.

### Scientific mode

The same live scenario plus deeper analytical tabs:

| Tab | What it does |
|---|---|
| **Workbench** | All six stocks, `f_doc`, Monte Carlo bands, and the full assumptions/methods table. |
| **Institutional design** | Two-track architecture diagram, guided demos, audience modes, institutional scorecard, analog-regime matrix, design principles, caveats. |
| **Causal loops** | Feedback structure and current loop dominance: suppression spiral, learning flywheel, or remediation loop. |
| **Tipping** | 1-lever bifurcation, hysteresis, and 2-lever tipping maps. Clicking a point loads those lever values into the live scenario. |
| **Sensitivity** | Tornado, Sobol, and PRCC sensitivity over selected levers. |
| **Compare** | Capture the current scenario as A or B, then diff regimes, metrics, and trajectories. |

A **Monte Carlo** toggle lives in the header; heavy analyses run in a Web Worker
so the UI never blocks.

---

## The model

DocFlow keeps a six-stock, continuous-time system-dynamics model integrated with
a selectable solver (Euler / RK4).

| Stock | Meaning |
|---|---|
| `U` | Undocumented incidents |
| `D` | Documented and analyzed incidents |
| `TD` | Latent technical debt |
| `L` | Organizational learning / safety capability |
| `E` | Litigation and regulatory exposure |
| `C` | Documentation culture / psychological safety |

Two reinforcing loops compete: **R1 (chilling)** — low culture → low
documentation → less learning → rising debt/harm → (via backfire) still lower
culture; and **R2 (translation layer)** — privilege + just culture + separation +
translation → safe documenting → learning → remediation wins → higher culture.
A logistic culture stock coupled to a sigmoidal documentation fraction `f_doc(C)`
is what makes the system **bistable** — the same institution can settle into a
chilling basin or a learning basin depending on starting culture and levers.

The heart of the model is *perceived discoverability* — the signed pressure that,
in its positive part, chills the drive to document. It is a direct, inspectable
function of the levers:

```ts
// src/engine/model.ts — pure, no framework imports
export function discoverability(p: Params): DiscoverabilitySignals {
  const priv = privilegeSurvival(p)          // privilege is an OUTCOME, not a lever

  // Channel One is discoverable BY DESIGN — duties raise it, and the
  // original-records boundary shapes the record without hiding it.
  const fact = p.w_m * p.mandatory_reporting + p.w_p * p.pld_penalty
             - p.w_records * p.original_records_boundary

  // Channel Two is discoverable to the extent privilege FAILS.
  const anal = p.w_priv * (1 - priv.pi)
             + p.w_sep * (1 - p.recipient_enforcer_separation)

  // Channel Three turns on admissibility (Rule 407), not discovery — and leakage
  // of causal language defeats the work-order framing.
  const rem = p.w_407 * (1 - p.q_407 * p.safe_harbor_non_admission)
            + p.w_leak * priv.lambda

  return { fact, anal, rem, total: (fact + anal + rem) / 3 }
}
```

v0.2 lumped all of this into one scalar built from eight lever weights. That made the
weights jointly unidentifiable by construction — only their sum was ever observable — and
it sat at ≈ −3 in six of eight presets, where the one-sided penalty's gradient underflows,
so every weight was numerically inert exactly where the model was most used. The split by
channel is what fixed both (`AUDIT.md` F6, F15).

Full equations, coefficients, and their evidence basis live in
[`docs/MODEL.md`](docs/MODEL.md); numerics, validation, and epistemic limits in
[`docs/METHODS.md`](docs/METHODS.md).

## Twelve institutional levers

All primary levers are normalized to `[0, 1]` and grouped in the UI.

| Lever | What it represents |
|---|---|
| `precommit` | Was entry to the protected channel fixed **before** any incident, or arranged after the fact? *In re Target* survived on this; *Capital One* and *Rutter's* failed on it. |
| `significant_purpose` | Was legal advice *a* significant purpose of the work (*In re Kellogg Brown & Root*)? |
| `valve_discipline` | How strictly causal conclusions are kept out of operational records. |
| `kovel_evaluator` | An outside technical expert retained to assist counsel (*United States v. Kovel*). |
| `just_culture` | Protection for honest error with misconduct carve-outs. |
| `mandatory_reporting` | Duty or pressure to report serious incidents. |
| `pld_penalty` | Disclosure / adverse-inference pressure. |
| `recipient_enforcer_separation` | Whether the report recipient is separated from the enforcer. |
| `translation_layer` | Ability to convert incident reports into safety requirements. |
| `workflow_protection` | PSQIA-style protection for a defined safety *workflow*, not a single document. |
| `original_records_boundary` | Separation between discoverable factual records and protected analysis. |
| `safe_harbor_non_admission` | Rule that reporting is not an admission of fault or causation. |
| `effective_challenge` | SR 11-7-style independent review with authority to force change. |
| `near_miss_tier` | Voluntary weak-signal reporting alongside mandatory serious-incident reporting. |
| `intermediary_capacity` | NASA/PSO/INPO-style body that converts reports into shared learning. |

## Institutional scorecard

The Institutional Design view surfaces readouts more useful to policy and lab
governance than raw ODE variables. **These are engine auxiliaries — the Tabletop
surface reuses them verbatim, never re-scoring** (a parity test enforces this).

| Readout | Meaning |
|---|---|
| **Safe-to-report score** | How safe candid reporting feels after privilege, workflow protection, separation, safe harbor, and culture. |
| **Accountability legitimacy** | Whether protection is bounded by facts, just-culture rules, reporting duties, and independent review. |
| **Learning yield** | Durable learning produced per incident signal. |
| **Litigation pressure** | Discoverability and adverse-inference pressure pushing teams away from writing things down. |
| **Private-ordering gap** | How much the design depends on public-law scaffolding a lab cannot create alone. |
| **Policy-scaffold dependency** | Reliance on statute-like protection: workflow privilege, safe harbor, regulator-held privilege. |

---

## The Tabletop four-lens engine

Tabletop runs a single incident through all four lenses of the AI Incident
Litigation Playbook at once — the technical reality of the failure (Ch.4), its
journey across professional boundaries (Ch.2), the documentation/routing/
disclosure choices and their legal consequences (Ch.1), and the institutional
architecture those choices express (Ch.3).

Scenarios are **validated data**, not code. Every choice is a typed, cited node
that nudges levers, moves incident meters, and sets flags:

```ts
// src/engine/tabletop/types.ts
export interface Choice {
  id: string
  label: string
  role: Role                                    // safety_eng | counsel | policy | exec | board | regulator
  chapter: Chapter                              // 1 | 2 | 3 | 4  — which playbook lens this exercises
  rationale: string
  leverDeltas: Partial<Record<LeverKey, number>>   // nudge the 12 institutional levers
  incidentEffects: Partial<IncidentMeters>          // move the 7 incident meters (0–100)
  flags: string[]                               // 'state_snapshotted' | 'legal_owns_record' | 'two_track' | ...
  analogRefs: AnalogId[]                         // sector analogs surfaced by the mentor
  citations: SourceRef[]                         // real, caveated sources
  next: NodeId | ConditionalNext
}
```

Two mechanics make the thesis *felt*:

**Ch.2 — a signal that can die in transit.** At each professional handoff, a
signal loses fidelity through tie strength, translation loss, and normalization
of deviance. The transfer function never amplifies a signal:

```ts
// src/engine/tabletop/boundary.ts
export function crossBoundary(fidelity: number, p: Params, opts: CrossOpts): number {
  const tie  = tieStrengthFactor(p, opts.hasIndependentChannel)
  const loss = translationLoss(p, opts.legalOwnsRecord)
  const norm = normalizationProbability(p, opts.retrainCadence)
  const transferred = fidelity * tie * (1 - loss)
  return Math.max(0, Math.min(fidelity, transferred * (1 - 0.5 * norm)))
}
```

**Ch.1 — the seductive trap, decoupled honestly.** The "keep it oral" path *feels*
protective. DocFlow models that feeling as a distinct **perceived legal shield**,
kept separate from the model's durable `litigation_pressure` (which the same
choice actually *worsens*, because gutting the protective workflow raises real
discoverability more than asserting privilege lowers it):

```ts
// src/engine/tabletop/score.ts — the BELIEF, deliberately not the doctrine
function perceivedLegalShield(state: RunState): number {
  const privileged =
    state.flags.includes('legal_owns_record') ||
    state.flags.includes('privileged_single_track')
  return clamp01(
    // "We involved a lawyer."
    PERCEIVED_SHIELD.significant_purpose * state.params.significant_purpose +
    // "...and we kept it off the books."
    PERCEIVED_SHIELD.single_track_flag * (privileged ? 1 : 0) +
    PERCEIVED_SHIELD.no_records_boundary * (1 - state.params.original_records_boundary),
  )
}

// ...and what the doctrine actually delivers, which can be far lower.
const actual = privilegeSurvival(state.params).pi
const illusion = perceivedLegalShield(state) - actual
```

The gap is the point. This function is **not** the privilege model — it ignores
pre-commitment and valve integrity, which is exactly why it can exceed real privilege
survival. Measured >0.5 for the naive "counsel involved, nothing written down" posture,
and that gap is the cybersecurity failure mode the playbook is written against.

That split is exactly why **no path dominates**: the oral path wins the perceived
shield and self-sufficiency; the two-track path wins learning, remediation, and
lower recurrence. `hasDominantPath(scenario)` is asserted `false` for all 10
scenarios — with a positive control proving the detector actually fires — and the
**Aftermath verdict is computed by running the real SD engine forward** on the
final lever configuration. See [`docs/TABLETOP.md`](docs/TABLETOP.md) for the
full four-lens mapping, meter semantics, transfer-function coefficients, and
scenario catalog.

## Presets, analog matrix, guided demos

**Eight cited presets** each teach one mechanism: Cyber privilege-first
anti-pattern, Aviation ASRS + ASAP, PSQIA workflow protection, Pharma
mandatory-safe-to-report, SR 11-7 effective challenge, Nuclear dual-channel, EU
AI Act + PLD trap, and a Contested bistable baseline. The cyber preset labels the
95% figure an estimate; the EU preset flags pin-cite risk.

The **analog-regime matrix** records, for each of seven regimes (Aviation, PSQIA,
Pharma/devices, SR 11-7, Nuclear/INPO, Cyber, EU AI Act + PLD), the mechanism,
protected thing, source of protection, transferable principle, transferability to
AI, and caveat. **One-click guided demos** load a preset and suggest the lever
move that makes each mechanism visible.

## Scenario library (10)

| # | Scenario | Type | Lenses |
|---|---|---|---|
| 1 | Production incident: high-severity model output | malfunction | 1·2·3·4 |
| 2 | Malfunction near-miss (caught internally) | malfunction | 4·2 |
| 3 | Red-team discovery of a latent capability | security/misuse | 4·1 |
| 4 | GPAI / frontier systemic-risk signal | malfunction | 3·1·4 |
| 5 | Misuse — model turned into a weapon | misuse | 4·2·1 |
| 6 | Security — prompt injection / exfiltration | security | 4·2·1 |
| 7 | Stalled escalation — weak-tie signal death | malfunction (org) | 2 |
| 8 | Legal bottleneck vs. translator | malfunction | 2·1 |
| 9 | Discovery request / regulator inquiry | malfunction + legal | 1·3 |
| 10 | Cross-border incident (EU Art. 73 vs. US posture) | malfunction | 1·3 |

Every non-terminal choice carries ≥1 real citation; the schema validator and a
registry test enforce this across the whole library (part of `npm test`; the separate
`validate:scenarios` script was removed in v0.3.0 because it only re-ran tests the main
suite already covers).

---

## Technical architecture

DocFlow is a **static, browser-only** single-page app.

### Stack (checked-in versions)

| Layer | Choice |
|---|---|
| **Language** | TypeScript `~6.0` (strict) |
| **UI** | React `19.2`, Zustand `5.0` |
| **Build** | Vite `8`, `@vitejs/plugin-react` 6 |
| **Styling** | Tailwind CSS `4.3` (`@tailwindcss/vite`) |
| **Charts** | `plotly.js-dist-min` `3.6`, lazy-loaded via a thin local wrapper |
| **Exports** | `jspdf` `4.2` (PDF), native CSV/PNG/JSON/Markdown |
| **Sharing** | `lz-string` `1.5` URL-hash codec |
| **Tests** | Vitest `4.1`, `@testing-library/react`, `@vitest/coverage-v8` |
| **Lint** | ESLint `10` + `typescript-eslint` |
| **Runtime** | Node `24.x`; deploys as static assets on Vercel |

### The pure-engine boundary

The simulation in `src/engine/` (and `src/engine/tabletop/`) is **pure and
framework-agnostic** — it imports no React, DOM, storage, network, or clock. This
is enforced by review and coverage, and it is what lets the same code run on the
main thread, inside a Web Worker, or in a future CLI / Python port.

```
UI (React) ──▶ Zustand store ──▶ pure engine ──▶ trajectory + auxiliaries
   ▲                                   │
   └────────── selectors / lazy views ─┘        heavy analyses ──▶ typed Web Worker
```

- **State:** a Zustand store holds live scenario A + a frozen comparison B; a
  separate Tabletop store drives the incident run and pushes its final config into
  scenario A only on the explicit *"See this as a system"* handoff.
- **Heavy computation:** Monte Carlo, Sobol, PRCC, sweeps, and hysteresis run in a
  typed Web Worker (`engine.worker`, ~45 KB) so the interface stays at 60fps.
- **Persistence:** browser `localStorage`, versioned with a migration path.
- **Sharing:** the full scenario compresses into a URL hash; v0.1 links still
  decode through a legacy migration in the share codec.

### Bundle & performance

Aggressive code-splitting keeps the executive shell tiny; the expensive
dependencies load only when a surface needs them.

| Chunk | Raw | Gzip | Loaded |
|---|---|---|---|
| App shell (`index`) + CSS | 318 KB | **~98 KB** | on first paint |
| `InstitutionalView` | 18 KB | 4 KB | Scientific → Institutional |
| `TabletopSurface` (+ 10 scenarios) | 176 KB | 45 KB | Tabletop mode |
| Plotly | 4.6 MB | 1.38 MB | first chart render |
| jsPDF + html2canvas | ~600 KB | ~177 KB | on PDF/PNG export |
| `engine.worker` | 45 KB | — | first heavy analysis |

A full deterministic simulation runs in well under a millisecond, so the per-turn
Tabletop loop and every lever drag recompute synchronously and feel instant.

---

## Testing & quality

- **271 tests**, deterministic and **mock-free** — they run the real pure engine
  end to end (no simulation is stubbed).
- **Property tests** guard the theses: institutional-meter parity (no second
  scoring system), Ch.2 transfer-function monotonicity/bounds, Ch.4 capturability
  behavior, engine-forward parity, and **no-dominant-path** with a positive
  control that proves the detector can actually detect a dominant path.
- **Coverage:** `engine/tabletop` 100% statements / 98.2% branch; `engine` 97.6% /
  98.2% lines.
- **Isolation:** stores and `localStorage` reset between tests; the suite is
  verified deterministic across repeated full runs.
- **CI gate** (`.github/workflows/ci.yml`) runs on every push: `eslint` →
  `tsc -b` → `vitest --coverage` (per-file thresholds enforced across engine, lib and workers) →
  `vite build`. All green.

What the suite verifies, in brief: parameter-registry completeness and range
enforcement; model primitives and monotonic institutional behavior; flow
accounting and finite derivatives; integration convergence and deterministic
repeatability; equilibria, stability classification, bifurcation, hysteresis;
Monte Carlo reproducibility; Sobol / PRCC / tornado routines; preset and analog
regressions; share round-trips + v0.1 migration; export builders including the
Playbook brief; React integration paths (mode switch, lever updates, saves,
Institutional tab, the Tabletop playthrough + handoff); the Tabletop engine
primitives; and structural validation of all 10 scenarios (reachability,
citations, lever/meter key integrity, correct effective dates).

---

## Local development

Prerequisite: **Node 24.x**.

```bash
git clone https://github.com/Bekhzod-Alikhanov/DocFlow.git
cd DocFlow
npm install
npm run dev            # http://localhost:5173
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and build the static site to `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm test` | Run Vitest in watch mode. |
| `npm run test:run` | Run the suite once. |
| `npm run coverage` | Run tests with V8 coverage. |
| `npm run typecheck` | `tsc -b`. |
| `npm run lint` | ESLint. |

### Authoring a scenario

Create a `.ts` file in `src/lib/tabletop/scenarios/`, export a `TabletopScenario`
(types in `src/engine/tabletop/types.ts`), register it in `scenarios/index.ts`,
then run `npm test`. The schema validator checks lever/meter keys, node
reachability, dangling `next` targets, duplicate ids, and the ≥1-citation rule.
Full authoring guide in [`docs/TABLETOP.md`](docs/TABLETOP.md).

## Repository map

```text
src/
  engine/            Pure model, registry, simulation, equilibria, bifurcation,
                     Monte Carlo, sensitivity, presets  (2.8k LOC, framework-free)
    tabletop/        Pure incident engine: boundary transfer, capturability,
                     choice applier, engine-forward outcome, resolver, scoring
  lib/
    tabletop/        10 validated scenarios, schema validator, debrief builder
    ...              Persistence, share codec, exports, formatting, institutional data
  state/             Zustand stores (live scenario A/B + Tabletop run)
  workers/           Typed worker protocol + hook for heavy analyses
  components/        Reusable UI, charts, sliders, toolbar, banner
  views/             Executive/Scientific views + Tabletop surface
docs/
  MODEL.md           Equation-level model documentation
  METHODS.md         Numerics, validation, epistemic limits
  ARCHITECTURE.md    Stack and data-flow notes
  TABLETOP.md        Four-lens mapping, meter semantics, transfer fns, scenario catalog
```

## Suggested live demo (Executive → Scientific)

1. Open the [live app](https://doc-flow-ten-pi.vercel.app) in **Executive** mode.
2. Load **Cyber privilege-first anti-pattern** → chilling readout.
3. Load **Aviation ASRS + ASAP** → learning readout.
4. Load **EU AI Act + PLD trap** → high litigation pressure.
5. Switch to **Scientific → Institutional design**; click **Why mandatory
   reporting needs safe-to-report**.
6. Lower `safe_harbor_non_admission` and watch safe-to-report and litigation
   pressure move.
7. Open **Tipping** to see a lever push the system across a threshold.
8. **Export → Playbook brief** for a Chapter 3-ready Markdown artifact.

## Suggested Tabletop demo

1. Switch to **Tabletop** and use the **scenario picker** to select **Production
   Incident** (the flagship 8-phase scenario). Picking another card resets the run.
2. In **Evidence Capture**, choose *"capture only a minimal oral summary"* — watch
   `record_capturability` fall (cheap now, irreversible later).
3. In **Framing**, choose *"keep analysis oral; counsel owns the record"* — the
   **perceived legal shield** rises while `litigation_pressure` does **not**
   durably improve.
4. Continue the containment / minimal-notice path to **Aftermath** — the real
   engine runs forward; observe high `recurrenceRisk` and a chilling regime.
5. Click **"See this as a system"** to load the configuration into the Tipping tab
   and see the decade-long consequence.
6. Return to the picker and try **Stalled Escalation** (pure Ch.2 weak-tie decay)
   or **Cross-Border** (EU Art. 73 / SEC / California clocks) for a different
   failure type and lens.

## Important limits

- DocFlow is **not a forecast** and **not legal advice**.
- Coefficients are illustrative unless separately validated.
- The analog-regime matrix is source-backed but still needs jurisdiction-specific
  legal review before external policy use; the EU AI Act / PLD entry carries a
  pin-cite verification caveat by design.
- Private ordering can build workflows, culture, factual boundaries, and internal
  review — but cannot by itself bind courts, plaintiffs, or regulators.

## Deployment

Static Vite build on Vercel:

- Production: **[https://doc-flow-ten-pi.vercel.app](https://doc-flow-ten-pi.vercel.app)**
- Config: [`vercel.json`](vercel.json) · output `dist/` · SPA rewrite (all routes → `index.html`)
- Every push to `main` triggers CI and a Vercel deploy.
