# DocFlow

**A system-dynamics instrument for the AI incident-documentation paradox.**

[![CI](https://github.com/Bekhzod-Alikhanov/DocFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Bekhzod-Alikhanov/DocFlow/actions)
![Tests](https://img.shields.io/badge/tests-568%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-91.8%25-brightgreen)
![Version](https://img.shields.io/badge/model-v0.3.0-blue)
![Measured parameters](https://img.shields.io/badge/measured%20parameters-0%20of%20101-orange)

**[Live app](https://doc-flow-ten-pi.vercel.app/)** · **[What it found](docs/FINDINGS.md)** · **[Audit](docs/plan/AUDIT.md)** · **[Model spec](docs/plan/MODEL_v3_SPEC.md)**

---

## The problem

A firm that documents an AI incident candidly creates discoverable evidence against
itself. A firm that documents nothing avoids that, and loses the institutional memory a
safety programme runs on — while accruing regulatory and oversight exposure it cannot see.

DocFlow models that tension as a dynamical system with two self-reinforcing equilibria: a
**chilling** regime where not writing things down is individually rational, and a
**learning** regime where candour compounds. It is built alongside *"Architecting Candor:
Products Liability and AI Incident Knowledge Governance"* (Arcadia Impact AI Governance
Taskforce), as an **independent instrument** — where it contradicts the paper, the
contradiction is the finding.

## Read this before any number

**Nothing in this model is measured against the world.** Of 101 registered parameters:

| Tier | Meaning | Count |
|---|---|---|
| T1 | Measured in the AI-firm domain | **0** |
| T2 | Estimated from an analogous domain | **0** |
| T3 | Structural — a definition, not a claim | 14 |
| T4 | Freely chosen, with stated bounds | 87 |

Inline for the impatient: **T1 measured **0**, T2 analog **0**, T3 structural 14, T4 free 87**.

A test asserts that census; promoting anything toward "measured" fails CI until the
expected counts are edited in the same commit, so a promotion has to be argued in a diff.

So no output here is a prediction. What the model can do is say **which conclusions follow
from which assumptions**, and locate the boundaries between them. Read every figure as
"under these stated assumptions", never as "in reality". Not legal advice; not a forecast.

## The headline result

Two architectures run through the same swept legal environment — a pre-committed protected
workflow (computed privilege survival π = 0.989) against post-hoc counsel engagement
(π = 0.065) — over 216 environment points:

**Suppression yields lower total exposure at 6 of 216 points — 2.8%**, and that region is
exactly the corner where *both* regulatory and fiduciary exposure carry zero weight.

- Regulatory exposure needs only **8.4%** of products-liability weight before candour
  becomes the lower-exposure choice. Products liability alone never makes silence pay.
- **The paper's central caveat turns out not to matter.** No court has ruled on its
  pre-committed telemetry tripwire; the threshold moves from **0.084 to 0.085** across the
  entire range of that probability.
- Where suppression wins, it saves **6.1%** exposure and destroys **99.2%** of
  organisational learning.

![Where suppression yields lower total exposure](docs/figures/boundary.svg)

Full statement, caveats and what would overturn it: **[docs/FINDINGS.md](docs/FINDINGS.md)**.

## By the numbers

| | |
|---|---|
| **Production code** | **17,024** lines of TypeScript/TSX (strict mode) |
| **Tests** | **7,410** lines — 568 specs across 76 files; deterministic, no mocks |
| **Total code** | **24,434** lines across 172 modules |
| **Pure simulation engine** | **6,955** lines with zero React, DOM, storage, network or clock imports |
| **Documentation** | **7,831** lines across 30 markdown files, including 12 decision records |
| **Tooling** | 106 lines (figure and worklist generators) |
| **Repository total** | **32,371** lines |
| **Domain model** | **10** stocks · **15** levers · **101** registered parameters · 28 tabletop coefficients + 29 readout weights |
| **Coverage** | 91.8% statements, 82.7% branches, per-file thresholds enforced |
| **Runtime dependencies** | 6 (React, React DOM, Zustand, Plotly, jsPDF, lz-string) |

Structural counts — stocks, levers, parameters, the provenance census, and every figure in
`docs/FINDINGS.md` — are **asserted by tests** and cannot drift from the code. Line counts
were measured on 2026-08-18 with `git ls-files` and are not machine-checked.

> This table was wrong for the whole of v0.3 until 2026-08-18 — it claimed 6 stocks and 12
> levers after the model had 10 and 15. That is the same defect class the audit's worst finding describes, so the
> counts that *can* be gated now are.

## What the app does

Three modes over one engine.

**Executive** — a decision-support surface: institutional scorecard, recommendation
buckets split by whether a lab can act alone or needs statute, and a headline regime
readout with its caveats attached.

**Scientific** — the workbench. All ten stocks, phase portraits, equilibria and stability
classification, bifurcation sweeps, hysteresis (which *refuses to report* when the ramp has
not relaxed), Monte Carlo bands, Sobol/PRCC sensitivity, and an assumptions panel that
renders all 101 parameters with their provenance tier.

**Tabletop** — a branching incident scenario. Four analytical lenses (organisational
boundary transfer, record capturability, institutional meters, doctrinal posture) applied
to choices a team actually faces, with a *perceived* legal shield shown beside the
*actual* one — the gap between them is the failure mode the playbook is written against.

Heavy numerics run in a Web Worker; the UI never blocks.

## The model

Ten stocks, integrated with RK4 or adaptive Dormand–Prince 5(4):

| Stock | What it holds |
|---|---|
| `U` | Undocumented incidents |
| `R1` `R2` `R3` | Three record channels: factual, privileged analysis, remediation |
| `TD` | Latent technical debt |
| `L` | Organisational learning |
| `E_pl` `E_reg` `E_fid` | Products-liability, regulatory and fiduciary exposure |
| `C` | Documentation culture |

The three exposure channels are the point: `E_pl` rises with candour through discovery,
while `E_reg` and `E_fid` rise with **suppression** — unmet reporting duties and a board
deprived of the data its oversight duties require. A single lumped exposure stock cannot
represent opposing gradients, which is why v0.2 could not state the question properly.

**Discoverability is three signals, not one scalar.** `pd_fact`, `pd_anal` and `pd_rem`
carry the factual record, the analysis and the remediation record separately
(`DiscoverabilitySignals`). The v0.2 lumped scalar put eight weights into one sum, which
made them unidentifiable by construction and — because the sum sat far negative at six of
eight presets — numerically inert exactly where the model was most used.

**Privilege is computed, not set** — privilege is an OUTCOME, not a lever. Through v0.2 it was a slider. It is now an outcome of
four design choices the case law actually turns on — pre-commitment, separation from the
ordinary course, significant legal purpose, valve integrity — and it can fail. Computed
survival: cyber **0.065**, EU trap **0.147**, aviation **0.966**, healthcare **0.989**.
That ordering comes out of the doctrine, not out of tuning.

Fifteen levers span legal architecture (pre-commitment, significant purpose, valve
discipline, *Kovel* evaluator, workflow protection, original-records boundary, safe
harbour), reporting design (mandatory floor, near-miss tier, recipient–enforcer
separation), and learning capacity (translation layer, intermediary capacity, effective
challenge, just culture, PLD penalty).

Eight presets encode institutional analogs: ASRS/ASAP aviation, PSQIA healthcare,
pharmacovigilance, SR 11-7 model risk, NRC/INPO nuclear dual-channel, the cyber
privilege-first anti-pattern, the EU AI Act + PLD trap, and a contested baseline.

Full equations, units and provenance: **[MODEL_v3_SPEC.md](docs/plan/MODEL_v3_SPEC.md)**.

## How this repository is checked

The unusual thing here is not the test count; it is what the tests assert. Alongside
ordinary unit tests, gates enforce claims *about the project*:

| Gate | What it prevents |
|---|---|
| **Provenance census** | Silently promoting a parameter toward "measured" |
| **Tuning-language lint** | A registry note claiming a value was set to produce a behaviour |
| **Dimensional analysis** | Unit-inconsistent equations — parses the *real* `derivatives` source, not a table describing it |
| **Version contract** | Maths changing while `MODEL_VERSION` stays put, which makes saved scenarios irreproducible |
| **Audit currency** | The audit's status column describing a codebase that no longer exists |
| **Findings currency** | Any number in the reader-facing document drifting from the engine |
| **Figure currency** | A committed figure that the model no longer produces |
| **Pin-cite completeness** | A parameter citing legal authority that never reaches the verification worklist |
| **Integration order** | Silent loss of RK4 accuracy (asserted ≥ 3.8, not merely logged) |
| **Perf budgets** | Numerical slowdowns surfacing as opaque CI timeouts |

Several assert **defects on purpose** — if the culture loop ever becomes influential at a
shipped preset, that test fails, and the failure is good news.

```bash
npm run coverage   # 568 tests, per-file thresholds
npm run typecheck  # tsc -b, strict
npm run lint       # eslint
npm run build      # production bundle
npm run figures    # regenerate docs/figures from the engine
npm run worklist   # regenerate the pin-cite worklist from the registry
```

## Architecture

React 19 · TypeScript 6 strict · Vite 8 · Tailwind 4 · Zustand 5 · Plotly (lazy) ·
Vitest 4 · Web Worker with a typed RPC bridge.

**The engine boundary is enforced, not aspirational.** `src/engine/` imports no React, no
DOM, no storage, no network and no clock. Same inputs, same outputs, always. That is what
makes the model testable, worker-portable and reproducible from a saved scenario.

```
src/engine/          pure simulation core
  model.ts             equations, privilege, discoverability
  registry.ts          101 parameters with tier + provenance
  units.ts             dimensional system (V3)
  integrators.ts       RK4, Euler, adaptive RK45
  equilibria.ts        Newton solve, stability, bifurcation
  identifiability.ts   sensitivity matrix, rank, deficient directions
  boundary.ts          the suppression-vs-candour sweep
  calibration/         Firth logistic, coding schema, promotion gate
  tabletop/            four-lens scenario engine
src/views/ components/ state/ lib/ workers/
docs/                README-adjacent model docs
docs/plan/           audit, spec, calibration, validation, risks, 12 ADRs
tools/               figure and worklist generators
```

Bundle: 327 KB main chunk; Plotly (4.5 MB) is lazy-loaded and never blocks first paint.

## Getting started

```bash
npm install
npm run dev
```

Requires Node 24 (see `engines`). No environment variables, no backend, no accounts — the whole model
runs client-side, and scenarios share via a compressed URL hash.

## What is ready for evidence that does not exist yet

The binding constraint is that nothing is measured, and more modelling will not change it.
Two things are built so the next step is cheap:

- **`src/engine/calibration/`** — a case-law coding harness: typed schema, Firth penalised
  logistic regression (because separation is likely at N ≈ 20 and ordinary maximum
  likelihood diverges there), Cohen's κ, and a promotion gate that **refuses** to move a
  coefficient off T4 without two coders and κ ≥ 0.6. Its ceiling is T2, never T1.
- **[`docs/plan/PIN_CITE_WORKLIST.md`](docs/plan/PIN_CITE_WORKLIST.md)** — 27 citations
  needing human verification, generated from the registry so it cannot omit one.

## Limits, stated rather than discovered

- No detection stage: every incident is assumed known. This deletes the argument about
  semantically silent failures, and is why two institutional presets remain hard to tell
  apart.
- Hysteresis is ramping with a relaxation guard, not true numerical continuation.
- The exposure→culture feedback exists in the equations but is **saturated out of
  relevance** at every shipped preset; it becomes live at roughly 35× the assumed
  coefficient.
- Registered readout and tabletop coefficients are named and tiered but not yet swept.
- One tabletop test remains structurally circular.

All of these are recorded in **[AUDIT.md](docs/plan/AUDIT.md)**, including three findings
against v0.3's own repair work.

## Documentation

| Document | What it is for |
|---|---|
| [FINDINGS.md](docs/FINDINGS.md) | Start here. What the model found and what it cannot support |
| [AUDIT.md](docs/plan/AUDIT.md) | Every defect found, its status, and what closed it |
| [MODEL_v3_SPEC.md](docs/plan/MODEL_v3_SPEC.md) | Equations, units, provenance per parameter |
| [CALIBRATION.md](docs/plan/CALIBRATION.md) | What evidence would constrain what; the unexecuted coding protocol |
| [EPISTEMICS.md](docs/plan/EPISTEMICS.md) | What the instrument may and may not claim |
| [VALIDATION.md](docs/plan/VALIDATION.md) | The validation battery and its pass criteria |
| [RISKS.md](docs/plan/RISKS.md) · [OPEN_QUESTIONS.md](docs/plan/OPEN_QUESTIONS.md) | Known risks; what needs outside input |
| [ADR/](docs/plan/ADR/) | 12 decision records, including what was rejected and why |

---

*DocFlow is structured decision-support, not a forecast and not legal advice. Deployed at
[doc-flow-ten-pi.vercel.app](https://doc-flow-ten-pi.vercel.app/).*
