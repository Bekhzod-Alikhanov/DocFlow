# ADR 0005 — Numerical continuation over analytic normal forms; and the valve cliff

**Status:** Accepted · **Date:** 2026-08-17 · **This ADR argues against part of the brief.**

## Context

The brief (§2.1) asks for *"classification of the bistability (saddle-node, cusp, or otherwise) with
codimension-two analysis where warranted."*

Codimension-two classification on a 12-stock system requires centre-manifold reduction plus normal-form
transformation. That is weeks of work whose principal output is a **classification label**. Meanwhile
v0.2's actual bifurcation machinery is a **grid count-change detector** at resolution 1/60, and the
published *"fold at jc ≈ 0.25"* is a resolution artifact quoted to two significant figures with no test
asserting its location (`AUDIT.md` §8.3).

The ordering is wrong: v0.3 should first be able to locate a fold accurately, then worry about naming its
codimension.

## Decision

1. **Pseudo-arclength continuation with a fold test function**, replacing grid count-change detection.
   Locates folds to 1e-6 in the bifurcation parameter and tracks branches through turning points.
2. **Two-parameter continuation** of fold curves; cusp points located **numerically** as the intersection
   of fold curves. This delivers the practically useful content of codimension-two analysis (where the
   bistable wedge opens and closes) without normal-form derivation.
3. **Analytic results only where the structure makes them cheap.** The fast-culture limit is genuinely
   tractable and yields the closed-form criterion `gain·a_c·κ/4 > 1` (`AUDIT.md` §1). It is retained as
   `VALIDATION.md` **V8.1**, a machine-precision cross-check on the continuation code.
4. **Defer** normal-form reduction until a specific question demands it.

## Consequences

- v0.3 can state fold locations to machine precision instead of grid resolution.
- The analytic benchmark catches continuation bugs — a class of error that is otherwise invisible.
- Note the cost of closing the culture loop (`ADR/0011`): the closed form no longer holds globally, only in
  the fast-culture limit. That is the right trade — a correct model with a limited analytic benchmark beats
  an incorrect model with a global one.
- If someone later needs "is this a cusp?", the numerical fold-curve intersection answers it operationally.

## Also decided here: the valve cliff functional form

The brief (§1.7) asks for disproportionate loss on valve leakage and asks the steepness to be justified.

**Decision:** `waiver = σ(g_valve·(λ − λ_crit))` with ⟦`g_valve`⟧ ≫ 1, plus a separate additive
independent-admission term.

**Justification for steepness — legal, not numerical.** Waiver is *adjudicated*: a court finds privilege
waived or not, and subject-matter waiver can extend beyond the leaked document to the whole subject. The
transition is genuinely near-discontinuous, unlike (say) culture erosion. A smooth ramp would misrepresent
the mechanism.

**But the steepness is still a free parameter**, so `VALIDATION.md` **V9.1** requires reporting how
conclusions change across `g_valve ∈ [5, 100]`. If a headline conclusion depends on the steepness, that
dependence is itself a reportable finding rather than a nuisance to be tuned away.

## Alternatives rejected

**Full analytic codimension-two.** High cost, low marginal information, and it would have to be redone
whenever the structure changes.

**Keep grid detection.** Cheap, but it cannot resolve the fold, misses tangencies entirely (even-multiplicity
roots are invisible to sign-change bracketing), and produces spurious tipping events from `marginal`
stability classifications near the fold.
