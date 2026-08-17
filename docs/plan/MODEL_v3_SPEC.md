# MODEL_v3_SPEC — DocFlow v0.3 Formal Specification

**Status:** specification only. No implementation code. **Target model version:** `0.3.0`.
**Prerequisite reading:** [`AUDIT.md`](./AUDIT.md) — several design choices here exist specifically to
repair defects catalogued there.

---

## 0. Design rules

Three rules govern every decision below. They are enforceable, and `VALIDATION.md` wires each into CI.

1. **No new state variable unless it changes a qualitative conclusion that is itself reportable.**
   Each stock in §2 carries an explicit justification against this test.
2. **Parameter budget: ≤ 1.4 × the v0.2 *honest* count.** v0.2's honest count is **89** (55 registered +
   ~34 unregistered magic constants — `AUDIT.md` §8.1), so the v0.3 ceiling is **125 registered
   parameters, with zero unregistered constants.** Every numeric literal in the model layer must resolve
   to a registry entry. If the structure cannot fit the budget, cut a stock, not the provenance discipline.
3. **Every parameter carries a provenance tier** (§8). A parameter with no tier cannot be merged.

### Notation

`σ(x)` logistic; `softplus_β(x) = β⁻¹ln(1+e^{βx})`; `⟦·⟧` marks a **free parameter** (no empirical basis;
see `CALIBRATION.md`). Time `t` in **months** throughout.

---

## 1. What changes and why

| v0.2 defect (AUDIT) | v0.3 response |
|---|---|
| **F1** culture decoupled; advertised R1 loop absent | Culture depends on realised harm and exposure through explicit terms (§4.6). The loop is *closed*. |
| **F2/F4** learning attractor is a clamp artifact; 5 presets bit-identical | `dTD/dt` reformulated so `TD = 0` is invariant (§4.3); detection stage and channel stocks give interior resolution (§4.1–4.2). |
| **F6** five levers collapse to one scalar | Protection levers get **distinct pathways with distinct observable consequences** via the three channels and endogenous privilege (§3, §5). |
| **F7** dimensional incoherence | Explicit unit system (§2), named conversion parameters, `phi_doc` alias broken (§4.5). |
| **F8** ~34 invisible coefficients | All registered. Rule 2 above. |
| **F9** absorbing culture states | Logistic kernel replaced (§4.6). |
| **F12** pole in debt amplification | Michaelis–Menten → bounded exponential saturation (§4.3). |
| **F15** ReLU kink | `relu` → `softplus` (§3.2). |

---

## 2. State variables

Twelve stocks. Units are declared and **checked by an executable test** (`VALIDATION.md` V3).

| Symbol | Meaning | Unit | Bounds | Justification against Rule 1 |
|---|---|---|---|---|
| `H` | **Latent hazards** — real failure modes present in the deployed system, detected or not | hazards | ≥ 0 | *New.* Required by §1.5: v0.2 cannot express undetected incidents at all. Enables the paper's §3.1.2 argument. |
| `A` | **Detected anomalies** awaiting an investigate/decline decision | anomalies | ≥ 0 | *New.* Separates detection from documentation; the branch point for §1.6. |
| `N` | **Non-investigated anomalies** — declined, invisible | anomalies | ≥ 0 | *New.* §1.6: the decision *not to look*. Distinct from `U` because it leaves no trace and no record to belatedly recover. |
| `U` | Investigated but **undocumented** | incidents | ≥ 0 | Retained. |
| `R1` | **Channel One** factual-record completeness | records | ≥ 0 | *New.* §1.1. Discoverable by design; drives both `E_pl` and `E_reg` with **opposite signs** — the crux of §1.2. |
| `R2` | **Channel Two** privileged analysis volume | analyses | ≥ 0 | *New.* §1.1. Carries privilege survival `π`; the only stock whose evidentiary value is contingent. |
| `R3` | **Channel Three** remediation throughput | work orders | ≥ 0 | *New.* §1.1. The learning conduit (see `ADR/0004` — *not* a shield). |
| `TD` | Latent technical debt | debt index | ≥ 0 | Retained, reformulated (§4.3). |
| `K` | **Detection capability** | 0–1 | [0, 1] | *New.* §1.5. The compounding loop; gives suppression a second-order cost. Replaces the static `capturability.ts` lookup. |
| `L` | Learning / safety capability | 0–100 index | [0, 100] | Retained. |
| `C` | Documentation culture | 0–1 | [0, 1] | Retained, kernel changed (§4.6). |
| `E_pl`, `E_reg`, `E_fid` | Products-liability / regulatory / fiduciary exposure | exposure index | ≥ 0 | *New, replacing `E`.* §1.2. **Without these the paper's central claim is inexpressible** — see §6. |

Net: 12 stocks (from 6). `E` splits 1→3; the detection chain adds `H, A, N, K`; the channels add
`R1, R2, R3`. Each passes Rule 1.

**Retired:** `D` (documented incidents) — subsumed by `R1`/`R2`, which distinguish the evidentiary status
that `D` conflated.

### 2.1 Unit conversions, now explicit

v0.2 silently identified incidents with debt units and harm with exposure. v0.3 names them:

| Parameter | Meaning | Unit | Tier |
|---|---|---|---|
| ⟦`c_inc_debt`⟧ | debt accrued per unresolved incident | debt · incident⁻¹ | structural |
| ⟦`c_harm_exp`⟧ | exposure per realised harm event | exposure · harm⁻¹ | structural |
| ⟦`c_rec_exp`⟧ | discovery exposure per factual record | exposure · record⁻¹ | structural |

These were previously folded invisibly into `sigma`, `rho`, `phi_harm`, `phi_doc`.

---

## 3. Auxiliaries

### 3.1 Detection

```
detect_rate    = K · H · ⟦rho_scan⟧ · (1 + ⟦a_tier⟧ · near_miss_tier)
capture_factor = CAPTURE_BASE[resistance] + ⟦a_snap⟧ · K
```

`CAPTURE_BASE` is a registered 4-vector over the paper's §3.1.2 taxonomy
(`silent | irreproducible | distributional | environment_dependent`), reusing the existing tabletop
categories. `capture_factor` is the probability that a detected anomaly yields a *reconstructable* record.

> **Why a detection stage.** The paper establishes a problem prior to documentation: semantically silent
> failures generate no native indication, reproduction is system-state dependent, and the relevant unit of
> evidence is distributional. v0.2 assumes every incident is known. That assumption deletes the paper's
> §3.1.2 argument entirely.

### 3.2 Perceived discoverability — smoothed and **disaggregated**

v0.2's single scalar is the root of the identifiability failure (`AUDIT.md` §5.2). v0.3 splits it by
**which channel the exposure attaches to**, because that is a real distinction with distinct observable
consequences:

```
pd_fact  = ⟦w_m⟧·mandatory_reporting + ⟦w_p⟧·pld_penalty − ⟦w_orb⟧·original_records_boundary
pd_anal  = ⟦w_priv0⟧·(1 − π) + ⟦w_sep⟧·(1 − recipient_enforcer_separation)
pd_rem   = ⟦w_407⟧·(1 − ⟦q_407⟧) + ⟦w_leak⟧·λ
```

- `pd_fact` — discoverability of the **factual** record. Channel One is *discoverable by design*, so
  this is largely irreducible: `original_records_boundary` shapes what is in it, not whether it is
  reachable.
- `pd_anal` — discoverability of the **analysis**, governed by privilege survival `π` (§5).
- `pd_rem` — discoverability of the **remediation** record, governed by the Rule 407 admissibility
  discount `q_407` and valve leakage `λ` (§5.3).

**Identifiability gain:** the protection levers now act on *different* channels with *different*
downstream exposure consequences, so they are separable in principle from observations of channel-level
outcomes. `ADR/0003` records the argument; `VALIDATION.md` V7 tests that the rank of the
output-sensitivity matrix actually increased.

`relu` → `softplus_β` everywhere (`ADR/0002`), restoring C¹ smoothness and RK4's order (`AUDIT.md` §5.3,
§7.2).

### 3.3 Decision fractions

```
p_look  = σ(⟦g_look⟧ · (⟦a_lookC⟧·C + ⟦a_lookJC⟧·just_culture
                        − ⟦a_lookCost⟧·investigation_cost
                        − ⟦a_lookHaz⟧·softplus(pd_fact) − ⟦th_look⟧))

f_doc   = σ(⟦gain⟧ · (⟦a_c⟧·C + ⟦a_jc⟧·just_culture + ⟦a_m⟧·mandatory_reporting
                       − ⟦a_disc⟧·softplus(pd_fact) − ⟦threshold⟧))
```

Two decisions, not one (§1.6). `p_look` is the decision to investigate; `f_doc` the decision to record.
**Declining to look is invisible**: it produces no record *and no trace of its own absence*, so it cannot
be inferred from the record. `investigation_cost` is registered and rises with `capture_factor⁻¹` — the
paper's point that the evidence is "expensive to develop and hazardous to hold."

### 3.4 Tripwire

```
trip = σ(⟦g_trip⟧ · (severity_signal − τ_review))
```
with a **tiered band** (`τ_log < τ_review`) per §3.2.2 — the logging tier below the review tier, because
near misses are the highest-value, lowest-liability class and a fear-designed regime discards them first.
`τ_review` is a **decision variable** in the red-team module (§7): raising it is the "nominally compliant,
practically inert" gaming strategy.

---

## 4. State equations

### 4.1 Hazard, detection, and the non-investigation split

```
dH/dt = hazard_gen(TD, L) − detect_rate − ⟦delta_H⟧·H
dA/dt = detect_rate − A·(p_look + (1 − p_look)·⟦rate_decline⟧)
dN/dt = A·(1 − p_look)·⟦rate_decline⟧ − ⟦delta_N⟧·N
dU/dt = A·p_look·(1 − f_doc) − ⟦mu⟧·U·f_doc − ⟦sigma⟧·U
```

`hazard_gen = ⟦base_hazard⟧ · amp(TD) · max(0, 1 − ⟦beta_L⟧·L/100)`.

### 4.2 The three channels

```
dR1/dt = A·p_look·f_doc·capture_factor + ⟦mu⟧·U·f_doc·capture_factor − ⟦delta_R1⟧·R1
dR2/dt = trip · A · p_look · ⟦kappa_2⟧                              − ⟦delta_R2⟧·R2
dR3/dt = R2·⟦rate_23⟧·π_eff + R1·⟦rate_13⟧·⟦direct_fix⟧             − ⟦delta_R3⟧·R3
```

- **`R1` is written regardless** of legal posture — the paper's "discoverable by design."
- **`R2` exists only because of its protection** — the one channel whose existence is contingent, gated by
  the tripwire.
- **`R3` receives from `R2`** scaled by `π_eff` (leakage reduces what can safely be transmitted) and, for
  routine fixes, directly from `R1`.

### 4.3 Debt — reformulated so `TD = 0` is invariant

```
amp(TD) = 1 + ⟦alpha_td⟧ · (1 − exp(−TD / (⟦TD_ref⟧·⟦td_sat⟧)))          # bounded, pole-free
dTD/dt  = c_inc_debt·(⟦sigma⟧·U + ⟦sigma_N⟧·N) + ⟦td_base⟧·(TD/(TD+⟦td_k⟧))
          − ⟦rho⟧·R3·(L/100)·(TD/(TD+⟦td_k⟧)) − ⟦delta_TD⟧·TD
```

Both outflows and the baseline accrual carry the factor `TD/(TD + td_k)`, which **vanishes at `TD = 0`**.
Therefore `dTD/dt ≥ 0` at `TD = 0` and the non-negativity constraint is a property of the *equations*, not
of a clamp. This directly repairs **F2** — and note `N` (non-investigated) contributes debt at
⟦`sigma_N`⟧ ≥ ⟦`sigma`⟧, which is the second-order cost of declining to look.

The exponential saturation replaces Michaelis–Menten, removing the pole (**F12**) with the same low-debt
slope.

### 4.4 Detection capability — the compounding loop

```
dK/dt = ⟦eta_K⟧·R3·⟦test_yield⟧·(1 − K) − ⟦churn⟧·K
```

Each remediation work order yields regression tests and synthetic evaluation data that sharpen monitoring;
`(1 − K)` gives diminishing returns; `churn` is model/pipeline turnover. **This is the paper's
"calibration improves with use," and it is the single strongest addition**: it makes suppression costly in
a way v0.2 cannot express, because suppressing today degrades your ability to *detect* tomorrow.

### 4.5 Exposure — three opposing gradients

```
dE_pl /dt = c_rec_exp·R1·⟦disc_prob⟧ + (1 − π)·⟦xi_2⟧·R2 + c_harm_exp·harm − ⟦theta⟧·E_pl
dE_reg/dt = ⟦xi_duty⟧·mandatory_reporting·(A − A·p_look·f_doc)
            + ⟦xi_pld⟧·pld_penalty·N + ⟦xi_pres⟧·spoliation_risk − ⟦theta⟧·E_reg
dE_fid/dt = ⟦xi_board⟧·(1 − board_visibility)·harm − ⟦theta⟧·E_fid
```

with `board_visibility = σ(⟦g_bv⟧·(R1/(R1+⟦bv_k⟧) − ⟦th_bv⟧))` and
`harm = ⟦gamma⟧·TD·(1 − L/100)·⟦rate_harm⟧` — note ⟦`rate_harm`⟧ is the **named `month⁻¹` conversion** that
v0.2 omitted (**F7**).

**The sign structure is the whole point:**

| | more candour (`R1`, `f_doc` ↑) | more suppression |
|---|---|---|
| `E_pl` | **↑** (discovery) | ↓ |
| `E_reg` | ↓ | **↑** (unmet Art. 73 duties; PLD Art. 9(1) presumption on `N`) |
| `E_fid` | ↓ (board sees) | **↑** (*Caremark* — board deprived) |

`phi_doc`'s dual role is gone: exposure conversion is `c_rec_exp`/`xi_2`; the culture coupling is
separate (§4.6). The **hard parameter alias is broken** (`AUDIT.md` §4).

### 4.6 Culture — the loop is closed

```
E_tot  = ⟦v_pl⟧·E_pl + ⟦v_reg⟧·E_reg + ⟦v_fid⟧·E_fid          # weights are free; see §6

target = ⟦a_jc_c⟧·just_culture + ⟦a_sep⟧·recipient_enforcer_separation
         + ⟦omega⟧·f_doc·tle·(K)                                # safety wins, now gated by detection
         − ⟦psi⟧·f_doc·(1 − protection)                         # backfire (no phi_doc)
         − ⟦psi_E⟧·(E_pl/(E_pl + ⟦E_k⟧))                        # ← realised PL exposure chills culture
         − ⟦psi_H⟧·(harm/(harm + ⟦h_k⟧))                        # ← realised harm chills culture

dC/dt  = ⟦lambda_C⟧·(clamp01(target) − C)·(⟦eps_C⟧ + (1 − ⟦eps_C⟧)·4·C·(1 − C))
```

Two changes, both load-bearing:

1. **The last two terms close R1.** `dC/dt` now depends on `E_pl` and on `harm` (hence on `TD` and `L`).
   The Jacobian's culture row is no longer `[0,0,0,0,0,∂C]`. **This repairs F1** — the advertised
   feedback topology now exists. Consequence: the closed-form fold of `AUDIT.md` §1 no longer applies
   globally; it survives as the **fast-culture limit** and is retained as an analytic benchmark
   (`VALIDATION.md` V8, `ADR/0005`).
2. **`eps_C > 0` removes the absorbing states.** The kernel is a convex blend of a constant and the
   logistic bump, so `dC/dt ≠ 0` at `C ∈ {0,1}` unless `target` says so. `clamp01(target)` also makes
   "target" mean what it says. **This repairs F9**; culture becomes recoverable, and hysteresis becomes a
   dynamical property rather than a representational artifact.

---

## 5. Endogenous privilege

### 5.1 Survival probability

`privilege_strength` is **removed as a lever** and replaced by a computed outcome:

```
z = ⟦b0⟧ + ⟦b_pre⟧·precommit + ⟦b_sep⟧·separation_from_ordinary_course
        + ⟦b_purp⟧·significant_purpose + ⟦b_valve⟧·(1 − λ)
π = σ(z)
```

Four factors, each traceable to the doctrine the paper relies on:

| Factor | Doctrinal source |
|---|---|
| `precommit` — entry pre-committed vs post-hoc | *In re Target* (protection survived) vs *In re Capital One*, *Rutter's*, *Guo Wengui* (failed) |
| `separation_from_ordinary_course` | The "would have been done anyway" test |
| `significant_purpose` | *In re Kellogg Brown & Root* — protection survives a parallel regulatory purpose if legal advice was *a* significant purpose |
| `1 − λ` (valve integrity) | Waiver on leakage of conclusions outward |

`π_eff = π · p_court`, where ⟦`p_court`⟧ is §3.3's **untested-device probability**: the chance a court
credits a pre-committed telemetry tripwire as genuine anticipation of litigation. The paper concedes *"no
court has yet passed on its central device."* This converts that caveat into an analysable quantity, swept
across `[0,1]` with outcomes reported across the whole range — never at a point estimate.

**The `b·` coefficients are uncalibrated structural parameters with stated bounds.** Per the session
decision, `CALIBRATION.md` specifies the case-law coding protocol that *would* estimate them; it is
**not executed**, and nothing here claims otherwise.

### 5.2 Kovel agents

An outside evaluator entering as counsel's agent raises `significant_purpose` but also raises leakage
hazard: `λ_base += ⟦l_kovel⟧·kovel_engaged`. Privilege "does not protect an auditor's work merely because
counsel arranged the engagement."

### 5.3 The one-way valve — cliff, not slope

```
λ         = leak_pressure · (1 − ⟦valve_discipline⟧)
waiver    = σ(⟦g_valve⟧ · (λ − ⟦lambda_crit⟧))            # ⟦g_valve⟧ ≫ 1
π         = σ(z) · (1 − ⟦w_max⟧ · waiver)
admission = ⟦adm⟧ · λ · R2                                # survives Rule 407 exclusion
dE_pl/dt += ⟦xi_adm⟧ · admission
```

**Why steep is right, not a modelling convenience.** Waiver is adjudicated: a court finds the privilege
waived or not. Subject-matter waiver can extend beyond the leaked document. The transition is genuinely
discontinuous in a way that, say, culture erosion is not. A smooth form would misrepresent the legal
mechanism. ⟦`g_valve`⟧ is nonetheless **free**, and `VALIDATION.md` V9 requires reporting how conclusions
change across `g_valve ∈ [5, 100]` — if the qualitative result depends on the steepness, that dependence
is a finding, not a nuisance.

The second term matters independently: leakage creates **independent admissions that may remain admissible
even when the remedial measure itself is excluded under Rule 407.** Leakage therefore costs twice.

---

## 6. What the model can and cannot conclude about dominance

Per the session decision (**boundary-mapping**), v0.3 does **not** assert that suppression is dominated.
It computes the boundary.

Define the firm's objective `J = E_tot + ⟦c_debt⟧·TD − ⟦c_learn⟧·L` and compare two strategies at matched
parameters: **Architecture** (tripwire on, valve disciplined, `R1` complete) vs **Opacity**
(`p_look`, `f_doc` suppressed, no `R2`).

> **The reportable result is the sign of `ΔJ = J_arch − J_opacity` over parameter space**, together with
> the boundary `ΔJ = 0`. Regions where opacity wins are reported as first-class findings.

Structurally, opacity is expected to win where: `v_reg ≈ v_fid ≈ 0` (no enforcement, no derivative-suit
risk), `disc_prob` is high, `π_eff` is low (the untested device fails), and `churn` is high enough that
detection capability cannot compound. **Whether those conditions are plausible is an empirical question
the model cannot answer** — `⟦v_pl⟧, ⟦v_reg⟧, ⟦v_fid⟧` are free parameters, and the answer depends
entirely on them. `EPISTEMICS.md` states this as a hard limit; `OPEN_QUESTIONS.md` Q3 asks what evidence
could bound them.

---

## 7. Red-team module (§3.2)

Four attacks on the architecture, each a search over the region where it underperforms:

| Attack | Mechanism | Reported as |
|---|---|---|
| **Inert tripwire** | Raise `τ_review` until `trip ≈ 0` while remaining nominally compliant | Threshold beyond which `R2` never opens |
| **Candour penalty** | High `disc_prob`, low `v_reg`/`v_fid` | Region where `E_pl` from `R1` exceeds the regulatory+fiduciary saving |
| **Valve failure** | `λ > lambda_crit` | Joint waiver + admission cost vs the no-`R2` baseline |
| **Threshold gaming** | Revise `τ` after signals arrive | Loss of `precommit` → collapse in `π` |

The failure boundary is a **first-class deliverable**, not a robustness footnote.

---

## 8. Provenance tiers

Every parameter carries exactly one, surfaced wherever the number appears:

| Tier | Meaning | UI treatment |
|---|---|---|
| **T1 measured** | Direct measurement in the modelled domain, with citation | green |
| **T2 analog-estimated** | Measured in an analog domain (aviation, healthcare, cyber); transfer argued | blue + transfer note |
| **T3 structural** | Fixed by a modelling commitment (conservation, normalization, sign) — not free, but not measured | grey |
| **T4 free** | No empirical basis. **Must** state what would constrain it | amber + "free parameter" |

**Expected v0.3 census: T1 = 0.** No parameter in this model is measured, and the registry must say so
rather than implying otherwise. The `empirical-anchor` honesty test is rewritten to be non-vacuous
(`VALIDATION.md` V12): it asserts the census matches a checked-in expected count, so silently promoting a
parameter fails CI.

---

## 9. Numerics

- **Solver:** adaptive RK45 (Dormand–Prince) with error control, replacing fixed-step RK4. Constraint
  crossings become **events** with integrator restart, not post-hoc clamps.
- **Clamping becomes a last-resort guard**, and persistent boundary residence sets a distinct
  `saturated` flag (v0.2 left `diverged` false through 200+ clamps — **F2**).
- **Order verification in CI:** observed order `log₂(d₁/d₂) ≥ 3.8` for RK4 on a smooth preset; the
  softplus and the `TD` reformulation are what make this attainable.
- **Equilibria:** callers **must** read `converged` and `residualNorm`; a non-converged point is never
  classified (**F13**). `classifyStability` tolerance scales with `‖J‖`.
- **Bifurcation:** true pseudo-arclength continuation with a fold test function, replacing grid
  count-change detection. The scalar fast-culture reduction is retained as an analytic cross-check.
- **Version contract:** `MODEL_VERSION` bumps on any trajectory-altering change, enforced by a CI hash of
  the registry + equations (**F18**).

---

## 10. Open specification gaps

Recorded rather than papered over; carried into `OPEN_QUESTIONS.md`.

1. **`⟦v_pl⟧, ⟦v_reg⟧, ⟦v_fid⟧` determine the headline result and are entirely free.** §6's boundary is a
   function of a ratio nobody has measured. This is the model's single largest epistemic dependency.
2. **`CAPTURE_BASE` has no empirical basis** — four numbers over a taxonomy that is itself qualitative.
3. **`⟦p_court⟧` is unknowable by construction** (no court has ruled). It is swept, never estimated.
4. **`hazard_gen`'s dependence on `TD`** inherits v0.2's assumption that debt breeds hazards; the
   *direction* is supported by Sculley et al. 2015, the *magnitude* is free.
