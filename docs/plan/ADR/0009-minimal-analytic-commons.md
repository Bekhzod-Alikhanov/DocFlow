# ADR 0009 — Minimal analytic commons; simulation only for comparative statics

**Status:** Accepted, **conditional** · **Date:** 2026-08-17

## Context

The paper's §4.2.2 claims a certified intermediary that de-identifies and aggregates cross-firm reports
*"converts each firm's private learning into the industry-wide safety commons that no market incentive
produces independently."*

That is a **multi-agent claim** and nothing in the playbook demonstrates it. It is also the **sole support
anywhere for the paper's legislative recommendation** — which is precisely why it is the most dangerous
module in the plan. An N-firm simulation with invented payoff coefficients can be made to produce
undersupply trivially, and it would look like evidence (`RISKS.md` R3).

## Decision

**Analytic first, and the analytic result is the deliverable.**

Model firm `i`'s payoff from contributing `s_i` of its incident learning to the pool:

```
π_i = B(s_i, S_{-i}) − c·s_i − κ·Δexposure(s_i)
S   = Σ_j s_j                       # pooled learning, non-excludable to members
```

with `B` increasing and concave in `S`. This is a standard **public-goods game with a positive
externality**. Under contribution costs `c > 0` and residual exposure risk `κ > 0`, the symmetric Nash
equilibrium satisfies `∂B/∂S = c + κ·∂Δexposure/∂s`, while the social optimum satisfies
`N·∂B/∂S = c + κ·∂Δexposure/∂s`. **Undersupply by a factor related to `N` follows from the structure,
not from the numbers.**

The statutory protection of §4.2.2 enters as a reduction in `κ` (non-discoverability, non-admissibility,
non-waiver) and as a subsidy to `B` (the intermediary's analytic capacity, already a v0.2 lever:
`intermediary_capacity`). The comparative static — that lowering `κ` raises equilibrium contribution — is
also derivable.

**Simulation is used only for comparative statics** (heterogeneous firms, varying `N`, partial
participation), never to establish the core result.

## Consequences

- The claim becomes: *"given a public-goods payoff structure, cross-firm safety learning is undersupplied
  in equilibrium, and statutory protection that lowers residual exposure raises equilibrium contribution."*
  That is a theorem about the game. **The applicability of the payoff structure to the AI industry remains
  an assumption and must be labelled as one** in every presentation.
- No invented payoff coefficients carry the result. `B`, `c`, `κ` need only sign and curvature assumptions.
- Couples to the existing engine through `intermediary_capacity` and the exposure decomposition
  (`ADR/0003`) — the per-firm model is reused, not duplicated.

## Condition — and the cut rule

**If the undersupply result cannot be derived cleanly** — e.g. if the exposure term makes contribution a
strategic complement and the sign becomes ambiguous — **this milestone is cut** (`ROADMAP.md` M7 is
explicitly conditional).

An ambiguous analytic result is itself worth reporting; an unfalsifiable simulation is not. A dropped
module beats a fabricated proof of the paper's central policy ask.

## Open

`OPEN_QUESTIONS.md` Q10: should the intermediary be strategic? The paper's ASRS analogy rests on
recipient/enforcer separation being **statutory**, hence credible by construction. v0.3 models the
intermediary as passive and states that as an assumption. If separation must itself be sustained as an
equilibrium, the game needs a third player and becomes substantially harder — probably beyond scope.

## Alternatives rejected

**Agent-based simulation with learning firms.** Rich and superficially impressive. Rejected: every
behavioural rule would be free, the result would be uninterpretable, and it would be the clearest possible
instance of `RISKS.md` R1 — structure the data cannot support, dressed as evidence for a legislative ask.

**Skip the commons entirely.** Defensible on parsimony, and it is the honest fallback. Rejected as the
default only because the analytic version is cheap and is the single strongest available support for the
paper's recommendation.
