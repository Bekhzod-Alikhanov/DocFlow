# DocFlow v0.3 — Development Plan

Planning documents for the v0.3 major version. **Specification only — no implementation code.**

v0.3 has two goals: **structural fidelity** to the final argument of *"Architecting Candor: Products
Liability and AI Incident Knowledge Governance,"* and promotion of DocFlow from an illustrative teaching
aid to a **defensible scientific instrument**.

Governing standard: for every number in the model, a reader must be able to tell whether it was
**measured**, **analog-estimated**, **structurally assumed**, or **freely chosen**.

---

## Read in this order

| # | Document | What it settles |
|---|---|---|
| 1 | **[AUDIT.md](./AUDIT.md)** | Phase 0 critique of v0.2. Evidence base for everything else. **Start here.** |
| 2 | **[MODEL_v3_SPEC.md](./MODEL_v3_SPEC.md)** | State variables, units, equations, functional forms, parameter budget. |
| 3 | **[CALIBRATION.md](./CALIBRATION.md)** | Anchor inventory, method, the privilege coding protocol, what stays uncalibrated. |
| 4 | **[EPISTEMICS.md](./EPISTEMICS.md)** | What v0.3 can and cannot support. Rules for reporting results. |
| 5 | **[VALIDATION.md](./VALIDATION.md)** | V1–V13 battery, pass criteria, CI wiring, release gates. |
| 6 | **[RISKS.md](./RISKS.md)** | What could make v0.3 worse than v0.2. Led by over-engineering. |
| 7 | **[ROADMAP.md](./ROADMAP.md)** | M0–M8, acceptance criteria, ~112 engineer-days, cut order. |
| 8 | **[OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md)** | Q1–Q11 needing legal, empirical, or domain input. |
| 9 | **[ADR/](./ADR/)** | Twelve architecture decision records, including the ones decided *against*. |

---

## Three decisions taken with the project owner

| Question | Decision | Consequence |
|---|---|---|
| Epistemic stance | **Boundary-mapping** | The deliverable is a conditional: *"the architecture minimises total exposure **iff** ⟨conditions⟩."* Suppression-dominant regions are first-class results. |
| Privilege calibration | **Protocol only** | The case-law coding protocol is fully specified and **not executed**; privilege coefficients stay uncalibrated with stated bounds. |
| Status of v0.3 | **Independent research instrument** | Free to contradict the paper. Standard is reproducibility, not consistency. |

The brief's Phase 1.2 (*"must be able to show that suppression is not a dominant strategy"*) is therefore
**restated**: the model must be able to represent both outcomes and locate the boundary. See
[ADR/0001](./ADR/0001-epistemic-stance.md).

---

## The audit's seven worst findings, and where each is answered

| Finding | Answered by |
|---|---|
| **F1** The advertised R1 feedback loop is not implemented; `dC/dt` is autonomous | [ADR/0011](./ADR/0011-detection-stock.md) · gate **V1.3** |
| **F2** The "learning attractor" is a clamp artifact (>83% of steps) | `MODEL_v3_SPEC` §4.3 · gate **V4.2** |
| **F3** Zero empirically anchored parameters; the one target missed by 44% | [CALIBRATION.md](./CALIBRATION.md) · gate **V12.1** |
| **F4** Five institutional presets produce bit-identical output | `MODEL_v3_SPEC` §2, §4 · gate **V6.2** |
| **F6** Five levers collapse to one scalar (r = 0.99999) | [ADR/0002](./ADR/0002-three-channel-objects.md), [ADR/0006](./ADR/0006-identifiability-approach.md) · gate **V7.2** |
| **F8** ~34 unregistered coefficients drive the headline readouts | `ROADMAP.md` M1 · gate **V2.1** |
| — | Boundary-mapping stance itself · gate **V11.4** |

---

## Where this plan argues against the brief

A plan that adopts every suggestion uncritically is less useful than one that cuts what cannot be
defended. Five disagreements, each argued in its ADR:

- **Rule 407 should carry almost no weight** — it limits admissibility at trial, not discovery, and
  DocFlow's outcome variable is discovery-driven exposure. [ADR/0004](./ADR/0004-channel-three-rule-407.md)
- **Fisher information and profile likelihood are not available** — both need a likelihood, which needs
  data. Structural identifiability is well-posed and is run instead. [ADR/0006](./ADR/0006-identifiability-approach.md)
- **Bayesian calibration is not defensible for any anchor** — prior-predictive analysis only.
  [ADR/0007](./ADR/0007-no-posterior-bayes.md)
- **Defer analytic codimension-two normal forms** — numerical two-parameter continuation delivers the
  useful content at a fraction of the cost. [ADR/0005](./ADR/0005-continuation-over-normal-forms.md)
- **The commons must be analytic, or cut** — it is the only support for the paper's legislative
  recommendation, so it must not rest on invented payoffs. [ADR/0009](./ADR/0009-minimal-analytic-commons.md)

Plus one capability **rejected outright**: an agent-based model of individual engineers and counsel.
[ADR/0012](./ADR/0012-rejected-agent-based-model.md)

---

## The single most important sequencing constraint

**The provenance and validation machinery (M1) lands before any new model structure (M2+).**

If the project stops after M1, the result is v0.2 with honest provenance — a strict improvement. If it
stops after new structure without M1, the result is **worse than v0.2**: the same over-claiming at twice
the scale. See [RISKS.md](./RISKS.md) R9.
