# ADR 0008 — Morris screening before Sobol; bootstrap CIs mandatory

**Status:** Accepted · **Date:** 2026-08-17

## Context

v0.2 runs Sobol at `N = 200` over `k = 12` levers (2,800 integrations) and plots bare bars. Problems
established in `AUDIT.md` §8.4:

- The base sample is **LHS, not a low-discrepancy Sobol′ sequence**, so convergence is plain `O(N^{-1/2})`
  and the Saltelli design's advantage is lost.
- **No uncertainty quantification at all** — no bootstrap CIs, no `S1 ≤ ST` check, no `ΣS1 ≤ 1` check. The
  suite explicitly tolerates indices outside `[0,1]`.
- The only validation (Ishigami) runs at `N = 8000, k = 3` — **40× the production budget**. The method is
  validated in a regime the app never operates in.
- Net effect: **the lower half of every tornado is noise, and nothing says so.**

v0.3 will have ~125 parameters. Full Sobol at `N(k+2)` is prohibitive and would make the noise problem
worse, not better.

## Decision

**Three-stage pipeline.**

1. **Morris elementary effects** over all ~125 parameters. `r = 20` trajectories ⇒ `r(k+1) ≈ 2,520`
   evaluations. Report `μ*` and `σ`. Cheap, and it is a *screening* method — its job is to rule parameters
   out, which it can do reliably at this cost.
2. **Sobol on survivors** (target: top 15–20 by `μ*`). At `k = 20`, `N = 1024` ⇒ ~22,500 evaluations —
   tractable in the Python layer (`ADR/0010`), and at a per-parameter budget ~5× v0.2's.
3. **Bootstrap CIs mandatory.** No index is reported without one. Indices whose CI spans zero are rendered
   greyed and labelled *not resolved at this budget*.

Additional requirements:

- Replace the LHS base sample with a **scrambled Sobol′ sequence**, recovering the intended convergence.
- Add consistency checks as tests: `S1 ≤ ST` per parameter, `ΣS1 ≤ 1`.
- **Validate at production budget**, not only at Ishigami's generous one: run Ishigami at the same `N` and
  `k` the app uses and report the observed error. That number becomes the honest resolution limit.
- Report sensitivity **separately for interior and saturated regions** (`AUDIT.md` §5.4). v0.2's indices
  largely measure basin membership, not graded response, and pooling the two is what hides it.

## Consequences

- Total sensitivity cost ~25k evaluations, dominated by stage 2 — comparable to today's for far more
  parameters and far better error control.
- Morris `σ` (interaction/non-linearity indicator) is useful in its own right: high `σ` with low `μ*` flags
  parameters that matter only in combination.
- PRCC is retained but demoted: it requires monotonicity, and the model is manifestly non-monotone near the
  fold — exactly where users look. It must ship with a **monotonicity pre-check** per parameter and be
  suppressed where the check fails. The silent `β = 0` fallback on singular normal equations
  (`AUDIT.md` §8.4) must become an explicit error, and the solve must use QR with centering, not raw
  normal equations at condition number ~10⁷.

## Alternatives rejected

**Sobol on everything.** ~125 params × `N = 512` ⇒ ~65k evaluations for indices that are mostly zero.
Wasteful and it dilutes the CIs.

**Morris only.** Cheap, but elementary effects give no variance decomposition, so the `ST − S1` interaction
gap — which is what reveals lever complementarity, a substantive question here — is unavailable.
