# ADR 0007 — Prior-predictive analysis, not Bayesian calibration

**Status:** Accepted · **Date:** 2026-08-17 · **This ADR argues against part of the brief.**

## Context

The brief (§2.3) says *"Where Bayesian calibration is defensible, specify the approach, the priors, and the
diagnostics,"* while also predicting that *"for most of these the honest conclusion will be that they
support priors rather than likelihoods."*

Having inventoried the anchors (`CALIBRATION.md` §1), the honest conclusion is stronger than "most":
**posterior calibration is defensible for none of them.**

Every candidate anchor is either (a) an estimate without a sampling frame — the Schwarcz <5% figure is one
interviewee's estimate; (b) from an analog domain whose transfer is the very thing in question — ASRS,
PSQIA, FAERS; or (c) a structural observation rather than a measurement — frontier-lab frameworks
demonstrate that pre-commitment exists, not at what level.

None yields `p(data | θ)` for this model's outputs.

## Decision

**No posterior inference.** Instead:

1. **Elicited priors** on every T4 parameter, as distributions with written rationale. This replaces v0.2's
   uniform-over-registry-range default, which silently discards the scenario (`AUDIT.md` F10) and makes
   every preset's Monte Carlo band identical.
2. **Prior-predictive simulation** — sample θ, simulate, compare output *distributions* against qualitative
   anchors. The Schwarcz figure becomes a **coverage check** ("does low-protection place non-trivial mass
   below `f_doc = 0.15`?"), never a fitting target. Point-matching 0.05 is **prohibited**: the figure does
   not carry that precision, and v0.2 tuned toward it and missed by 44% anyway.
3. **Prior sensitivity** — re-run under a deliberately different prior family; conclusions that flip are
   reported as prior-dependent. This is the honest substitute for posterior diagnostics.
4. **"What would move this" table** — per T4 parameter, the observation that would constrain it and its
   realistic obtainability. This is the actionable output.

Diagnostics reported: prior-predictive coverage per anchor; fraction of prior mass producing non-physical
trajectories (a structural check); prior-vs-prior conclusion stability. **No R̂, no ESS, no divergences —
because there is no chain.** Saying so explicitly is part of the deliverable.

## Consequences

- v0.3 cannot claim calibrated parameters. `EPISTEMICS.md` §3.5 states this; the expected T1 census is 0.
- Prior elicitation becomes a real task requiring domain experts (`ROADMAP.md`, 8–12 h, not suppliable by
  the implementer).
- The full Bayesian pipeline is **specified** in `CALIBRATION.md` §2.3 and runnable the day data exists.
- Monte Carlo sampling must be reworked to be scenario-anchored (`ROADMAP.md` M5), which also fixes the
  user-visible defect where the band around aviation and cyber is identical.

## Alternatives rejected

**ABC / synthetic-likelihood on the Schwarcz figure.** Technically possible: treat 0.05 as a summary
statistic with an assumed tolerance. Rejected — it would manufacture a posterior from a single unsourced
point estimate and lend it the authority of Bayesian machinery. This is the most tempting wrong answer and
the one most likely to be suggested.

**Uniform priors everywhere** (v0.2's implicit choice). Rejected: uniform over an arbitrary registry range
is a strong and usually indefensible claim, and it is what makes v0.2's uncertainty bands scenario-independent.
