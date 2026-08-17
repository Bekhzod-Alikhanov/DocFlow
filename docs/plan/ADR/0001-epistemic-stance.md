# ADR 0001 — Epistemic stance: boundary-mapping, not demonstration

**Status:** Accepted · **Date:** 2026-08-17 · **Decided with:** project owner

## Context

The v0.3 brief contains a direct internal contradiction. Phase 1.2 says the model *"must be able to show
that suppression is not a dominant strategy for the firm, which is the paper's core argument for voluntary
adoption."* Phase 0 asks the auditor to report, as a **defect**, whether *"every lever improves outcomes
monotonically… that is a diagnostic that the model encodes a thesis rather than tests one."*

Both cannot hold. A model built so that it *must* produce the paper's conclusion is exactly the instrument
Phase 0 is designed to detect. The audience includes a reviewer who audits claims aggressively; this would
be the first thing found.

`AUDIT.md` confirms the concern is live, not hypothetical: 74% of measured (lever × outcome × preset) cells
are monotone in the "more lever → better outcome" direction, and six coefficients carry registry notes
stating they were *"Calibrated for bistability"* while `METHODS.md` presents bistability as *"Demonstrated."*

## Decision

**v0.3 is a boundary-mapping instrument.** Phase 1.2 is restated as:

> The model must be able to **represent both outcomes** — suppression dominant and dominated — and
> **locate the boundary between them**.

The deliverable is a conditional: *"the three-channel architecture minimises total exposure **iff**
⟨explicit condition⟩."* Regions where opacity wins are **first-class results**, not failures.

Two further decisions taken with the owner in the same session:

- **Privilege calibration is protocol-only.** The case-law coding protocol is fully specified and marked
  **not executed**; the coefficients stay uncalibrated with stated bounds.
- **v0.3 is an independent research instrument**, free to contradict the paper; its standard is
  reproducibility, not consistency with the playbook.

## Consequences

- `MODEL_v3_SPEC` §6 defines `ΔJ = J_arch − J_opacity` and reports its **sign over parameter space**.
- `VALIDATION.md` **V11.4** requires a passing test asserting a suppression-dominant region exists. If no
  such region can be produced under plausible parameters, that is either a baked-in conclusion (defect) or
  a genuine finding requiring explicit argument — either way it must be confronted.
- **V11.1** lints registry notes for tuning-to-outcome language and fails CI.
- Bistability is **removed as an acceptance criterion** anywhere in the plan (`ROADMAP.md` M2).
- The model may contradict the published paper. `OPEN_QUESTIONS.md` Q11 asks the authors to decide *before*
  M6 how such a finding would be communicated.

## Alternatives rejected

**Demonstration-only** — show the paper's argument is internally coherent, labelled non-independent. Honest
and low-risk, but it cannot be cited as support for the thesis, and it makes scenario discovery (§2.4) and
the red-team module (§3.2) pointless, since both exist to find where the argument fails.

**Adversarial** — build specifically to falsify. Maximum credibility, but it inverts the same bias rather
than removing it: a model built to break a claim is as suspect as one built to confirm it. Boundary-mapping
subsumes the useful part (failure regions are reported) without the framing bias.
