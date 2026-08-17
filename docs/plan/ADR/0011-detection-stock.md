# ADR 0011 — Detection stage, capability stock, and closing the culture loop

**Status:** Accepted · **Date:** 2026-08-17

## Context

Two separate findings converge on one decision.

**(a) v0.2 has no detection.** It asks whether *known* incidents get documented. The paper (§3.1.2)
establishes a prior problem: failures are semantically silent (no exception fires), reproduction is
system-state dependent, the relevant unit of evidence is distributional, and deployment context is itself
causal. §3.1.3 then draws the consequence — *"a decision not to investigate may appear technically
defensible… The Documentation Paradox can therefore operate without falsification or concealment."*

v0.2's Tabletop layer *does* encode the four capture-resistance properties, but only as a **static lookup**
(`RESISTANCE_BASE + boosts − erosion`) with **no accumulation and no memory**. The compounding the paper
describes — *"the calibration improves with use"* — is absent from the model entirely.

**(b) v0.2's culture loop does not exist.** `AUDIT.md` F1: `dC/dt` depends only on `C` and parameters.
The advertised R1 (debt → harm → exposure → culture) is not implemented; the Jacobian's culture row is
`[0,0,0,0,0,∂C]`. The change that produced bistability is precisely what severed the loop.

## Decision

**1. Detection stage.** Add `H` (latent hazards), `A` (detected anomalies), `N` (non-investigated), with

```
detect_rate    = K·H·rho_scan·(1 + a_tier·near_miss_tier)
capture_factor = CAPTURE_BASE[resistance] + a_snap·K
```

**2. Detection-capability stock.**

```
dK/dt = eta_K·R3·test_yield·(1 − K) − churn·K
```

Each remediation work order yields regression tests and synthetic evaluation data that sharpen monitoring;
`(1 − K)` gives diminishing returns; `churn` is model/pipeline turnover.

**3. Split the two decisions** (`p_look` vs `f_doc`). Declining to investigate produces **no record and no
trace of its own absence** — it cannot be inferred from the record, which is what makes it more insidious
than suppression. `N` accrues debt at ⟦`sigma_N`⟧ ≥ ⟦`sigma`⟧.

**4. Close the culture loop.** Add to `cultureTarget`:

```
− psi_E·(E_pl/(E_pl + E_k))     # realised PL exposure chills culture
− psi_H·(harm/(harm + h_k))     # realised harm chills culture
```

and gate `safety_wins` by `K`. Now `dC/dt` depends on `E_pl`, `TD`, and `L`. **V1.3 is the regression
test** that this stays true.

**5. Replace the logistic kernel** with `(eps_C + (1−eps_C)·4C(1−C))` so `C ∈ {0,1}` are no longer absorbing
(`AUDIT.md` F9), and `clamp01(target)` so "target" means what it says.

## Consequences

- **Suppression acquires a second-order cost the model previously could not express**: suppressing today
  starves `R3`, which starves `K`, which reduces tomorrow's detection — and undetected hazards accrue debt
  at the higher `sigma_N`. This is the strongest single addition in v0.3 and the mechanism most likely to
  produce non-obvious results.
- The tabletop's static `capturability.ts` is **unified into the continuous core** rather than duplicated;
  the tabletop reads `K` from the engine (`ROADMAP.md` M4 acceptance).
- **Cost:** the closed-form fold criterion no longer holds globally (`ADR/0005`), surviving only as the
  fast-culture benchmark. Accepted — a correct model with a limited benchmark beats an incorrect model with
  a global one.
- **Cost:** four stocks added (`H`, `A`, `N`, `K`). Each is justified in `MODEL_v3_SPEC` §2 against Rule 1;
  `N` in particular earns its place because it is *behaviourally distinct* from `U` (no belated-documentation
  path exists from it) and because it is the paper's specific mechanism.
- Bistability may disappear or relocate. Per `ADR/0001` that is a finding, not a regression.

## Alternatives rejected

**Detection as a multiplier on incident inflow.** One line, no new stocks. Rejected: without a `K` stock
there is no accumulation, hence no compounding loop — which is the entire point. It would reproduce v0.2's
static capturability with extra steps.

**Merge `N` into `U`.** Saves a stock. Rejected: `U` has a belated-documentation outflow (`mu·U·f_doc`);
non-investigated anomalies have no such path because nobody looked, and the distinction between "we know
and didn't write it down" and "we chose not to find out" is the paper's §3.1.3 argument.
