# ADR 0004 — Channel Three is a learning conduit, not a shield

**Status:** Accepted · **Date:** 2026-08-17 · **This ADR argues against part of the brief.**

## Context

The brief (§1.1) requires Channel Three to *"carry the paper's hedge on Federal Rule of Evidence 407"* and
instructs: *"Do not model Channel Three as a strong safe harbour."*

I agree with the instruction and want to go further: **in this model, Rule 407 should carry almost no
exposure-reducing weight at all.**

The paper is precise about why:

> *"The rule **limits admissibility at trial rather than discovery** and applies to measures that would
> have made an earlier injury or harm less likely to occur. Rule 407 therefore supports, but does not
> supply the foundation for, the documentation discipline described here."*

DocFlow's outcome variable is **discovery-driven exposure**. Rule 407 does not act on discovery. Giving
`R3` even a moderate shield term would model a protection that does not operate on the quantity being
measured — and would overstate the architecture's benefit in exactly the direction the boundary-mapping
stance (`ADR/0001`) is meant to guard against.

## Decision

Model Channel Three primarily as the **learning conduit**:

```
dK/dt   = eta_K·R3·test_yield·(1 − K) − churn·K       # the compounding loop
dTD/dt −= rho·R3·(L/100)·(TD/(TD+td_k))               # remediation
```

Rule 407 enters **only** as a small admissibility discount ⟦`q_407`⟧ applied at the settlement/judgment
stage, not at discovery, and it enters `pd_rem` rather than reducing `E_pl` directly.

The **independent-admission** term is retained and is the more important 407-adjacent mechanism: leakage of
causal language into `R3` creates statements that *"may remain admissible even when the remedial measure
itself is excluded."* So `R3` written badly is a **liability**, not a shield — see `ADR/0005`'s valve cliff.

## Consequences

- The architecture's benefit in the model comes from **learning and detection compounding**, and from
  reduced `E_reg`/`E_fid` — not from 407. This is a stronger and more defensible position: it does not rest
  on a rule that does not reach discovery.
- ⟦`q_407`⟧ is T4 and small; `VALIDATION.md` V9 reports sensitivity to it.
- If litigation counsel establishes a real **settlement-value** channel (anticipated inadmissibility
  lowering expected cost even when material is produced), ⟦`q_407`⟧ should be larger and should enter a
  settlement term. `OPEN_QUESTIONS.md` Q4 asks exactly this.

## Alternatives rejected

**Model 407 as a discovery-stage shield on `R3`.** Doctrinally wrong; would inflate the architecture's
measured benefit.

**Omit 407 entirely.** Tempting for parsimony, and defensible. Rejected because the *asymmetry* it creates
is real and worth representing: a remediation record written in operational language is treated
differently from one carrying causal conclusions, and that asymmetry is the paper's actual documentation
discipline. Setting ⟦`q_407`⟧ = 0 remains inside the swept range, so the "407 does nothing" case is
testable rather than assumed away.
