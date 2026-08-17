# ADR 0012 — Rejected: agent-based model of individual engineers and counsel

**Status:** **Rejected** · **Date:** 2026-08-17

Recorded because the argument for it is genuinely strong and will be raised again. This ADR exists so the
answer does not have to be re-derived.

## The case for

The Documentation Paradox is, at bottom, an **incentive and coordination story**, and the paper says so
repeatedly:

- §2.1.3 — the decision to record is made by an individual weighing personal risk (Edmondson;
  Skerlavaj et al.'s finding that perceived threat produces *active withholding*).
- §2.2.2 — *"a function accountable for both the initial assessment and the later remediation faces a
  structural incentive to optimize the system against its own assessment"* — an explicit principal-agent
  problem.
- §2.2.2 — *"Where the function accountable for litigation exposure controls documentation, writing less
  becomes that function's rational strategy."* Counsel and safety engineering have **divergent objective
  functions**. That is the mechanism.
- §2.1.1 — Carlile's syntactic/semantic/pragmatic boundaries; Røvik's translation-as-omission;
  Hansen's tie strength. All are about *actors*, not aggregates.

A representative-firm ODE cannot express divergent objectives. v0.2's tabletop gestures at it — there is a
`Role` type (`safety_eng`, `counsel`, `policy`, `exec`, `board`, `regulator`) — but roles have **no state,
no objectives, and no payoffs**, and `crossBoundary` is a scalar multiplicative haircut, not an agent
model.

## The decision

**Rejected for v0.3.** Not on effort, but on identifiability.

An agent-based model of this system requires, at minimum: a utility function per role (career risk,
schedule pressure, legal exposure, professional norms); a network topology of who talks to whom; a
learning/adaptation rule; and a decision rule under uncertainty. **Every one of those is a free
parameter, and none is measurable in this domain.**

`CALIBRATION.md` already concludes that the *twelve-lever aggregate* model cannot be calibrated. An ABM
would add on the order of 20–40 further free parameters to a model that cannot constrain the ones it has.
Per `RISKS.md` R1, added structure without data **reduces** identifiability and buys unearned authority —
and an ABM is the most authority-conferring structure available. It would look the most like science and
be the least constrained by evidence.

There is also a concrete precedent in this very codebase. The tabletop's flagship "no dominant path"
property is **structurally guaranteed** by a flat `+0.30` term in `perceivedLegalShield` awarded for a
choice flag, combined with a 14-axis Pareto test mixing incommensurate scales. Ten tests assert "the
thesis property"; they verify an authoring convention. **That is what happens when agent-like structure is
added without the data to discipline it**, and an ABM would multiply that failure mode.

## What is done instead

1. **The commons game** (`ADR/0009`) captures the strategic content that matters most — the free-rider
   structure underlying the paper's legislative recommendation — in a form where the result is
   **derived**, not simulated, and rests on sign and curvature assumptions rather than invented payoffs.
2. **`p_look` vs `f_doc`** (`ADR/0011`) captures the divergent-objective content at aggregate level: the
   decision not to look and the decision not to write respond to different pressures and have different
   observable signatures.
3. **Endogenous privilege** (`MODEL_v3_SPEC` §5) captures counsel's decision problem through its
   *consequences* (`π` as a function of design choices) rather than through a utility function.
4. **The tabletop retains roles as a pedagogical device**, explicitly labelled as such — not as an agent
   model. `ROADMAP.md` M8 also removes the `goodVector` term that makes non-domination automatic.

## Revisit if

- Firm-level data on documentation decisions by role becomes available (interviews with a sampling frame,
  or instrumented ticket data), **or**
- a specific question arises that the aggregate model provably cannot answer and an ABM provably can —
  stated in advance, not discovered after building it.

Absent one of those, an ABM here would be an elaborate way to formalise assumptions and then read them
back out.
