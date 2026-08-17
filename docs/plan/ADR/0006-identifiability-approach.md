# ADR 0006 — Structural identifiability now; profile likelihood deferred

**Status:** Accepted · **Date:** 2026-08-17 · **This ADR argues against part of the brief.**

## Context

The brief (§2.2) asks for identifiability analysis *"using Fisher information and profile-likelihood
approaches."*

**Both require a likelihood, and a likelihood requires data.** There is no observational dataset: no
`f_doc(t)` at any firm, no incident counts by documentation status, no privilege outcomes by firm. The
paper's background interviews are explicitly *"not treated as primary empirical evidence."*

The Fisher information matrix for the calibration problem is therefore **undefined**, not merely hard to
compute. Reporting an FIM here would be a category error, and it is exactly the kind of methodological
over-claim a hostile reviewer looks for — the same failure pattern as v0.2's `METHODS.md`, which claims a
*"residual/output interface so a future user could fit parameters"* that does not exist.

## Decision

Run the analyses that are **well-posed without data**:

1. **Structural identifiability.** Compute the output-sensitivity matrix `S = ∂y/∂θ` along a reference
   trajectory; take its SVD. Rank deficiency proves that distinct parameter vectors produce **identical**
   output. Report the deficient directions **by name** — not just a rank number.
2. **Practical non-identifiability.** `cond(SᵀS)`; above 10⁸, label results practically non-identifiable.
3. **Equifinality search.** For each headline conclusion, actively search for a distinct parameter vector
   producing indistinguishable output, and **publish the set**.
4. **Pairwise collinearity guard.** No two levers may exceed `|r| = 0.999` in response curves at any
   shipped preset (`VALIDATION.md` V7.2).

**Profile likelihood and FIM are specified and deferred** until a likelihood exists. The pipeline is
written down in `CALIBRATION.md` §2.3 so it can be run the day data arrives.

## Consequences

- v0.3 can state, provably, which parameters are indistinguishable — a stronger and more honest result than
  a data-free FIM.
- The analysis **already has a known answer for v0.2**: five levers enter `f_doc` through a single scalar,
  giving exact rank deficiency and measured `r = 0.99999` (`AUDIT.md` §5.2). V7 is therefore a
  regression test with a known failing baseline, which is the best kind.
- If V7.1 shows v0.3 is *less* identifiable than v0.2 on shared outputs, `ROADMAP.md` M3's decision gate
  requires **cutting stocks**. This ADR is what makes that gate meaningful.
- Reported honestly: identifiability results depend on the assumed observation set. v0.3 must state which
  outputs it assumes observable (channel-level counts, `f_doc`, exposure realisations) and acknowledge that
  **none is currently observed at any firm**.

## Alternatives rejected

**Run FIM with an assumed noise model.** Would produce numbers. Those numbers would describe the assumed
noise model, not the data, and would be quoted as if they described the latter.

**Skip identifiability.** Rejected outright: the audit shows it is the single most important defect after
the missing feedback loop, and it is the one analysis that requires no data at all.
