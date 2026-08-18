# MODEL.md - DocFlow system-dynamics model

> **Source of truth for the math.** This file tracks the implementation in
> [`src/engine`](../src/engine). DocFlow is a structural model for
> decision-support and structured reasoning, not a calibrated forecast. All
> coefficients are illustrative assumptions unless separately validated.

Model version: **0.3.0** (see [`src/engine/version.ts`](../src/engine/version.ts)).

## 1. Stocks

| Symbol | Meaning | Unit | Bounds | Default init |
|---|---|---|---|---|
| `U` | Undocumented incidents | incidents | >= 0 | 20 |
| `D` | Documented and analyzed incidents | incidents | >= 0 | 5 |
| `TD` | Latent technical debt | debt index | >= 0 | 10 |
| `L` | Organizational learning / safety capability | 0-100 | [0,100] | 30 |
| `E` | Litigation + regulatory exposure | exposure index | >= 0 | 10 |
| `C` | Documentation culture / psychological safety | 0-1 | [0,1] | 0.4 |

Through v0.2, `E` was a pure observable that fed nothing. **As of v0.3.0 it closes
the R1 loop**: realised exposure and realised harm both subtract from the culture
target, so `dC/dt` now depends on `E`, `TD` and `L`. See §5 and §9.

## 2. Levers

DocFlow v0.2 keeps the six-stock core and adds institutional design levers:

| Lever | Institutional meaning |
|---|---|
| `precommit` | Was channel entry fixed before the incident, or arranged afterwards? |
| `significant_purpose` | Was legal advice *a* significant purpose (*Kellogg*)? |
| `valve_discipline` | How strictly conclusions stay out of operational records |
| `kovel_evaluator` | Outside technical expert retained through counsel (*Kovel*) |
| `just_culture` | Clear protection for honest error, with misconduct carve-outs |
| `mandatory_reporting` | Duty or pressure to report serious incidents |
| `pld_penalty` | Disclosure / adverse-inference pressure |
| `recipient_enforcer_separation` | Whether the listener is separated from the enforcer |
| `translation_layer` | Ability to convert reports into safety requirements |
| `workflow_protection` | PSQIA-style protection of a process, not one document |
| `original_records_boundary` | Discoverable factual core separated from protected analysis |
| `safe_harbor_non_admission` | Rule that reporting is not an admission of fault |
| `effective_challenge` | SR 11-7-style independent review with authority |
| `near_miss_tier` | Voluntary weak-signal channel alongside mandatory serious reports |
| `intermediary_capacity` | NASA/PSO/INPO-style body that turns reports into shared learning |

## 3. Documentation Fraction

```
# v0.3.0 M3c: three channel signals, not one lumped scalar.
# pi and lambda come from privilegeSurvival(p) -- privilege is an OUTCOME.

pd_fact = w_m * mandatory_reporting + w_p * pld_penalty
        - w_records * original_records_boundary

pd_anal = w_priv * (1 - pi)
        + w_sep * (1 - recipient_enforcer_separation)

pd_rem  = w_407 * (1 - q_407 * safe_harbor_non_admission)
        + w_leak * lambda

perceived_discoverability = (pd_fact + pd_anal + pd_rem) / 3   # channel MEAN

# f_doc responds to pd_fact ALONE: privilege does not protect facts, so the
# willingness to write down what happened cannot depend on how well the
# analysis is shielded (MODEL_v3_SPEC 3.3).
#
# w_tl, w_workflow and w_safe were RETIRED. Those levers still act, through the
# mechanisms that carry them: workflow_protection is the separation factor in
# privilegeSurvival, and safe_harbor_non_admission discounts Channel Three via
# q_407, which is Rule 407's own domain.

drive_to_document =
      a_c * C + a_jc * just_culture + a_m * mandatory_reporting
    - a_disc * softplus(perceived_discoverability, pd_sharpness)

f_doc = sigmoid(gain * (drive_to_document - threshold))
```

Mandatory reporting can raise the direct drive to document, but if it arrives
with PLD pressure and no protective scaffold, positive perceived discoverability
can still suppress documentation.

## 4. Flows

```
capability_factor = max(0, 1 - beta_L * L/100)
debt_ratio = TD / TD_ref
debt_amplification = 1 + alpha_td * td_sat * (1 - exp(-debt_ratio / td_sat))
debt_availability  = TD / (TD + td_k)
incident_inflow = max(0, base_incident_rate * debt_amplification * capability_factor)

to_D = f_doc * incident_inflow
to_U = (1 - f_doc) * incident_inflow

translation_layer_efficiency =
    base_eff + tl_boost * translation_layer
             + intermediary_efficiency_boost * intermediary_capacity

near_miss_signal =
    near_miss_tier * incident_inflow * (0.35 + 0.65 * recipient_enforcer_separation)

challenge_multiplier = 1 + challenge_learning_boost * effective_challenge

learning_gain =
    eta_learn * to_D * translation_layer_efficiency * challenge_multiplier
  + near_miss_learning_boost * near_miss_signal * translation_layer_efficiency

# v0.3.0 M3: the three channels. R1 is written regardless of legal posture; R2 is
# entered through the pre-committed tripwire; R3 flows from both and is the
# learning conduit (ADR/0002, ADR/0004).
to_R1 = to_D + belated_doc
to_R2 = trip * to_D * kappa_2
to_R3 = R2 * rate_23 * pi_eff + R1 * rate_13

# Remediation is driven by Channel Three, not by the retired lumped D stock, and is
# gated by debt_availability so that TD = 0 is an invariant of the equations (F2).
remediation =
    rho * R3 * (L/100) * (1 + challenge_remediation_boost * effective_challenge)
        * debt_availability

belated_doc = mu * U * f_doc

# Two DIFFERENT quantities, related by an explicit conversion (V3.3).
u_outflow = sigma * U                  # incident/month, leaves U
u_to_debt = c_inc_debt * u_outflow     # debt/month, enters TD

# harm_events is a LEVEL. Only the derived RATE may enter a d/dt (V3.4).
harm_events = gamma * TD * max(0, 1 - L/100)
harm_rate   = harm_events * rate_harm
```

## 5. Culture and Exposure

```
safety_wins = omega * f_doc * translation_layer_efficiency

protection_bundle = clamp01(
    0.36 * privilege_survival        # = privilegeSurvival(p).pi, computed
  + 0.22 * workflow_protection
  + 0.18 * safe_harbor_non_admission
  + 0.14 * original_records_boundary
  + 0.10 * recipient_enforcer_separation
)

backfire = psi * f_doc * (1 - protection_bundle)

exposure_chill = psi_E * (E / (E + E_k))
harm_chill     = psi_H * (harm_events / (harm_events + h_k))
```

`phi_doc` was removed from `backfire` in v0.3.0: it is declared `exposure/incident`
and was acting as a dimensionless culture gain, which was both a unit error and a
hard parameter alias (it could not be varied in `dE/dt` without moving the culture
loop). `psi`'s default absorbs the old product.

Stock equations:

```
# v0.3.0: ten stocks. The single record stock D became three channels with
# distinct evidentiary status (ADR/0002), and the single exposure stock E became
# three gradients that OPPOSE each other (ADR/0003).

dU/dt    = to_U - belated_doc - u_outflow
dR1/dt   = to_R1 - delta_R1 * R1          # factual record
dR2/dt   = to_R2 - delta_R2 * R2          # privileged analysis
dR3/dt   = to_R3 - delta_R3 * R3          # remediation
dTD/dt   = u_to_debt + td_baseline - remediation - delta_TD * TD
dL/dt    = learning_gain - delta_L * L

# RISES WITH CANDOUR
dE_pl/dt = pl_from_records + pl_from_analysis + pl_from_remediation
         + pl_from_admissions + pl_from_harm - theta_E * E_pl
# RISE WITH SUPPRESSION
dE_reg/dt = reg_from_duty + reg_from_pld - theta_E * E_reg
dE_fid/dt = fid_from_blindness - theta_E * E_fid

E_tot = v_pl * E_pl + v_reg * E_reg + v_fid * E_fid

# u_outflow (incident/month) and u_to_debt (debt/month) are DIFFERENT quantities
# related by c_inc_debt. Before v0.3.0 one number was subtracted from a stock of
# incidents and added to a stock of debt (VALIDATION.md V3.3).

culture_target = smoothClamp01(a_jc_c * just_culture
       + a_sep * recipient_enforcer_separation
       + safety_wins - backfire
       - exposure_chill - harm_chill)

# smoothClamp01, not clamp01: this sits inside the RHS of an ODE and the chilling
# presets cross the [0,1] boundary during integration. A hard corner there cost RK4
# two orders of accuracy (V5.1).

kernel = eps_C + (1 - eps_C) * 4 * C * (1 - C)

dC/dt  = lambda_C * (culture_target - C) * kernel
```

Two v0.3.0 changes are load-bearing here. The `exposure_chill` and `harm_chill`
terms are what make `dC/dt` depend on the physical stocks — before them the culture
equation was autonomous and the R1 loop did not exist in the code. The `eps_C`
kernel floor removes the absorbing states at `C = 0` and `C = 1`: with the pure
logistic kernel, culture that reached a boundary could never be moved again by any
policy change.

## 6. Derived Institutional Readouts

The v0.2 readouts are displayed in the Institutional Design view and playbook
export:

- `safe_to_report_score`: protection bundle, separation, just culture, and
  intermediary capacity, net of positive discoverability.
- `accountability_legitimacy`: factual-record boundary, just culture, mandatory
  reporting, effective challenge, and near-miss tier.
- `learning_yield`: learning produced per incident signal.
- `litigation_pressure`: discoverability, PLD pressure, mandatory reporting, and
  weak safety-to-report conditions.
- `policy_scaffold_dependency`: reliance on statute-like protection, safe harbor,
  and privilege.
- `private_ordering_gap`: how much the desired package depends on public-law
  scaffolding beyond what a lab can create internally.

### 6.1 The weights behind these readouts (v0.3.0)

Each readout is a weighted linear blend of levers, and until v0.3.0 those ~29
weights existed only as **bare literals inside `computeAux`** — absent from the
parameter registry, absent from these equations, and absent from the Assumptions
panel even though that panel claimed to list "every parameter"
(`docs/plan/AUDIT.md` F8). They are the numbers a policy audience actually quotes,
so they were the least visible and most consequential coefficients in the model.

They now live in [`src/engine/readouts.ts`](../src/engine/readouts.ts) with the
same metadata discipline as the registry (label, value, evidence basis, source,
note), are rendered in the Assumptions panel under **Institutional readout
weights**, and are guarded by a test that fails if a bare decimal literal
reappears in a blend expression.

Three properties of these weights are load-bearing and worth stating plainly:

1. **Each blend's positive weights sum to 1.00** by construction, which is what
   makes each readout a 0–1 index. That normalisation is a structural choice.
2. **Linear blending asserts perfect substitutability.** A privilege score of 1.0
   counts the same as an equivalent-weight workflow-protection score. This is the
   single strongest untested assumption in the readout layer.
3. **They are declared constants, not tunable `Params`**, so the sensitivity
   analyses do **not** vary them. Moving them into the swept space is roadmap item
   M1/M5. This is a stated limitation, not an oversight.

Two of them also carry a dimensional defect inherited from v0.2 and not yet fixed:
`safe_to_report.discoverability_penalty` and `litigation_pressure.discoverability`
multiply `relu(perceived_discoverability)`, which is in synthetic PD units (range
to +4), and the product is combined with a dimensionless 0–1 index before
clamping. The clamp hides the incoherence. Flagged in `AUDIT.md` §4.

These readouts are not legal conclusions. They are structured comparisons among
institutional design packages.

## 7. Feedback Loops

- **R1 chilling:** weak protection -> high perceived discoverability/backfire ->
  low culture -> low documentation -> lower learning and higher debt -> more
  incidents, harm and exposure -> **realised exposure and harm chill culture
  further** (the `psi_E` and `psi_H` terms in `cultureTarget`).
- **R2 learning:** protected workflow + just culture + separation + translation
  layer + intermediary capacity -> reports become safe and useful -> learning
  and remediation improve -> culture rises.

The slow culture stock `C`, coupled to sigmoidal `f_doc(C)`, creates the model's
path dependence and tipping behavior.

> **Correction, v0.3.0.** Through v0.2 the closing arrow of R1 **did not exist in
> the code**. `dC/dt` depended only on `C` and parameters — `backfire` was a
> function of `f_doc` and the protection levers alone, with no dependence on `TD`,
> `E`, `harm_events` or `L`. The culture equation was therefore an *autonomous
> scalar ODE* driving a one-way cascade, and this section described a loop the
> equations did not contain. See `docs/plan/AUDIT.md` F1.
>
> v0.3.0 closes it: `cultureTarget` now subtracts saturating terms in realised
> exposure and realised harm, so the culture row of the Jacobian is no longer
> `[0,0,0,0,0,∂C]`. This is asserted by `src/engine/diagnostics.test.ts` (V1.3) so
> it cannot silently regress. The coefficients (`psi_E`, `E_k`, `psi_H`, `h_k`)
> are **free parameters** — the direction is argued from the literature, the
> magnitudes are not measured.

## 8. Preset Regression Targets

The test suite verifies these qualitative targets:

| Preset | Expected behavior |
|---|---|
| Cyber privilege-first anti-pattern | chilling |
| Aviation ASRS + ASAP | learning |
| PSQIA-style workflow protection | learning |
| Pharma mandatory-safe-to-report | safer than mandatory-only |
| SR 11-7 effective challenge | learning with stronger remediation |
| Nuclear dual-channel | beats public-only and private-only variants |
| EU AI Act + PLD trap | high litigation pressure unless protection is added |
| Contested baseline | path-dependent bistable demo |

## 9. Refinement Log

| Date | Version | Change |
|---|---|---|
| 2026-06-21 | 0.1.0 | Initial model. Added saturating debt-to-incident amplification, natural debt retirement, and fraction-driven culture reinforcement to make the system well-posed and bistable. |
| 2026-06-22 | 0.2.0 | Added institutional design levers and derived readouts while keeping the six-stock core. Added workflow protection, original-records boundary, safe harbor / non-admission, effective challenge, near-miss tier, and intermediary capacity. Updated presets for aviation, PSQIA, pharma, SR 11-7, nuclear, cyber, and EU AI Act + PLD. |
| 2026-08-17 | 0.3.0 | **Correctness release following the Phase 0 audit (`docs/plan/AUDIT.md`).** (F1) **Closed the R1 loop** — `cultureTarget` now subtracts saturating terms in realised exposure and harm (`psi_E`, `E_k`, `psi_H`, `h_k`), so `dC/dt` depends on the physical stocks; through v0.2 it was an autonomous scalar equation and the documented loop did not exist. (F2) **`dTD/dt` reformulated** — remediation is gated by `TD/(TD+td_k)`, making `TD = 0` an invariant of the equations; clamp events across all presets went from 680+ to **zero**, and RK4 recovered 4th-order convergence on the affected presets. (F9) **Culture is no longer absorbing** — the logistic kernel is blended with a floor `eps_C`, so culture can recover from either boundary; `cultureTarget` is also clamped to [0,1]. (F12) **Pole removed** — Michaelis–Menten debt amplification replaced by a bounded exponential with the same low-debt slope and ceiling. (F7) **`phi_doc` removed from `backfire`** — it is an exposure/incident conversion and was acting as a dimensionless culture gain, which was both a unit error and a hard parameter alias; `psi`'s default absorbs the old product. (F13) `fastEquilibriumAt` no longer clamps inside its iteration and reports convergence; `findAllEquilibria` now deduplicates equilibria that polish to the same fixed point. (F16) `expectedRegime` corrected on `eu-trap` and `neutral`, which declared `contested` while simulating `chilling`. Added `src/engine/diagnostics.test.ts` as a permanent gate suite. **Behavioural consequence, accepted rather than tuned around: only the contested baseline remains bistable.** Follow-ups in the same release: (F15) `relu` → `softplus` on perceived discoverability, which removes a C⁰ corner from lever sweeps and sensitivity — note the audit overstated this, since PD is state-independent and the kink never affected integration order; (F14) `hysteresis` now measures a per-step equilibrium residual and refuses to report path dependence when the ramp has not relaxed, with the UI withholding the overlay and saying why; a 5×5 Newton solve for the fast subsystem (`findAllEquilibria` 139 ms → 11 ms) after the slow-manifold rewrite pushed CI past its test timeout; and wall-clock perf guards so a future slowdown fails loudly instead of as an opaque timeout. **M1/M2 completion:** a provenance tier system (T1 measured / T2 analog-estimated / T3 structural / T4 free) across all parameters with a CI-pinned census (101 parameters as of the M3 completion: T1=0, T2=0, T3=14, T4=87), each free parameter naming the observation that would constrain it; per-file coverage across engine, lib and workers replacing an aggregate threshold that let weak files pass by subsidy; an **adaptive Dormand-Prince RK45** solver with error control and substep diagnostics (fixed-step RK4 gave no error estimate at all, which is why the order collapse went unnoticed); a distinct **`saturated`** flag so a clamp-held trajectory cannot report as healthy; and **`converged` gating** on equilibria, so a point Newton never reached is no longer eigen-classified and counted as an attractor. |
