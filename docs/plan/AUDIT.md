# AUDIT — DocFlow v0.2, Phase 0 Critique

**Model version audited:** `0.2.0` · **Scope:** `src/engine` (incl. `tabletop/`), `src/lib`, `src/workers`, `docs/`, the 271-test suite, CI.
**Method:** two independent full code reads plus executed numerical diagnostics (temporary probes, run and removed; recipes in §11).

This document is deliberately unflattering. It is the evidentiary basis for the v0.3 design. v0.2 is a
well-engineered, well-tested, unusually candid implementation — `MODEL.md` opens by disclaiming
forecasting, and `equilibria.ts` states the decoupling fact plainly. The criticism is not that defects
were concealed. It is that **the narrative layer describes a causal architecture the equations do not
have**, and that the instrument cannot bear the weight the v0.3 brief wants to put on it until that is
fixed.

---

## 0. Findings, ranked

**Status column added 2026-08-17 after the v0.3.0 correctness release.** ✅ = fixed with an
executable gate · 🟡 = materially improved, not closed · ⬜ = open. Everything below still describes
**v0.2 as audited**; the status records what changed since.

> **Status column currency.** Every row below was re-verified against the code on 2026-08-18,
> after M1-M3 completed. Rows have been wrong before — F8 read ✅ while
> twenty constants were still unregistered, and F6, F15 and F18 described fixes as
> pending after they had landed. That is the F1 defect class in the document whose job is
> to be trustworthy, so `auditCurrency.test.ts` now machine-checks the claims that can be
> machine-checked, and F19-F21 below are findings against the v0.3 repair work itself.

| # | Finding | Severity | Status |
|---|---|---|---|
| **F1** | **The advertised R1 chilling loop is not implemented.** `dC/dt` depends only on `C` and parameters — not on `TD`, `E`, `harm_events`, or `L`. The 6-D "system dynamics" model is a **1-D autonomous culture equation driving a 5-D slave cascade**. | **Critical** | ✅ v0.3.0 — `psi_E`/`psi_H` chill terms; gate V1.3 |
| **F2** | **The "learning attractor" is a clamp artifact.** `TD` is pinned at its lower bound on >83% of steps in all five learning presets, while `diverged` reports `false`. | **Critical** | ✅ v0.3.0 — `dTD/dt` gated by `TD/(TD+td_k)`; clamps 680+ → **0**; gates V4.2, V5.3. Also a distinct **`saturated`** flag with `saturatedFraction`, surfaced in the headline readout, so boundary residence can never again read as healthy. |
| **F3** | **Zero of 55 registered parameters is empirically anchored.** All 55 are `illustrative-assumption`. The one named calibration target (`f_doc ≈ 0.05`) is **missed by ~45%** (actual 0.0721). | **Critical** | ⬜ Open — and inherent. See `CALIBRATION.md`; expected T1 census remains 0 |
| **F4** | **Five presets are dynamically indistinguishable** — aviation, healthcare, pharma, SR 11-7, nuclear all reach exactly `C = 1.0000`, `f_doc = 1.0000`. Zero discriminative power among institutional designs. | **Critical** | 🟡 v0.3.0 M3 — no longer bit-identical, and gated: they differ across `R1`, `R3`, `TD`, `L` and all three exposure channels. But V6.2 asks for **> 5% of range** and the worst pair (aviation ~ nuclear) reaches only **4.27%**, so the acceptance criterion is NOT met — see **F20**. `f_doc` still saturates at 1.0. |
| **F5** | **Bistability is a tuned target, not a finding**, and holds in only 2 of 8 presets (not at registry defaults). Six coefficients carry registry notes saying so. | **High** | 🟡 v0.3.0 — tuning language removed from the registry; `METHODS.md` now says "Observed," not "Demonstrated." Defaults still carry the history |
| **F6** | **Five levers enter the documentation pathway through one scalar** → exact structural non-identifiability. Three levers have *identically zero* effect on `f_doc` at baseline. | **High** | 🟡 v0.3.0 M3c — dead levers 3 → **0**; pairs at \|r\|>0.999 went 7/36 → 3/42. The single scalar is gone: discoverability is now three channel signals. Measured rank is nonetheless **3 of 8** for those weights and **10 of 15** for the levers — improved, not resolved. See **F21**. |
| **F7** | **At least five dimensional inconsistencies**, worst: `phi_doc` (`exposure/incident`) reused as a gain in the culture equation; `harm_events` (a level) used as a flow. | **High** | ✅ v0.3.0 M3 — `phi_doc` alias removed; `rate_harm` now converts the harm LEVEL to a rate before it enters `dE/dt`; `c_rec_exp` and `c_harm_exp` name the conversions that were previously folded invisibly into `phi_doc`/`phi_harm`. |
| **F8** | **~34 unregistered magic coefficients** drive the six headline institutional readouts. True parameter count ≈ **89**, not 55. | **High** | ✅ v0.3.0 — the 29 in `computeAux` are in `src/engine/readouts.ts`; the remaining 29 tabletop constants are now in `src/engine/tabletop/coefficients.ts`, all tiered T4 with `whatWouldConstrainIt`. The V2.1 gate SCANS THE SOURCE rather than checking a known list, and self-tests against a planted literal so an empty result cannot mean a broken scanner. *This row once claimed closure wrongly, when only the `computeAux` half was done; the source scan is what makes the claim checkable this time.* Registered coefficients remain outside the swept space — that is M5. |
| **F9** | **`C = 0` and `C = 1` are absorbing states.** Culture becomes permanently irreversible; five presets terminate exactly there. Advertised hysteresis is one-way. | **High** | ✅ v0.3.0 — `eps_C` kernel floor; gate V4.4 |
| **F10** | **Monte Carlo `uniform` (the app default) discards the scenario.** The band drawn around every preset is the `[0,1]¹²` hypercube band. | **High** — user-visible | ✅ v0.3.0 — new `scenario` distribution is the UI default; band labelled in the Workbench |
| **F11** | **Clamping degrades RK4 from 4th order to ~1st order**; in clamped presets RK4 is 4–5 orders *worse* than Euler. | **High** | ✅ v0.3.0 — follows from F2. Aviation observed order 1.07 → **4.06**, error 1.8e-1 → 1.2e-9 |
| **F12** | **`debtAmplification` has a pole** at `TD = −TD_ref·td_sat`, reachable by unclamped RK4 intermediate stages at registry minima. | **Medium-High** | ✅ v0.3.0 — bounded exponential, same low-debt slope and ceiling |
| **F13** | **`findAllEquilibria` can return non-converged, domain-clamped points** that are then classified stable and counted as attractors; `converged` is never read by any caller. | **Medium-High** | ✅ v0.3.0 — `isReliableEquilibrium` gates on convergence, residual (< 1e-6) **and** physical domain; `stableAttractors`/`isBistable` filter on it, and `unreliableEquilibria` exposes rejects rather than dropping them silently. `fastEquilibriumAt` no longer clamps internally; duplicates deduplicated. |
| **F14** | **`hysteresis` cannot distinguish bistability from incomplete relaxation**; documented as "numerical continuation," is transient ramping. | **Medium-High** | ✅ v0.3.0 — per-step equilibrium residual; `hasHysteresis` now requires `relaxed`. The UI withholds the overlay and explains why when the ramp has not settled. (It is still ramping, not continuation — that remains M5.) |
| **F15** | **ReLU switches the entire discoverability channel off in 6 of 8 presets** — nine parameters have exactly zero influence there. Also breaks C¹ smoothness. | **Medium-High** | ✅ v0.3.0 M3c — two separate defects, both now closed. The kink: `relu` → `softplus`. *The audit's stated benefit was wrong and was corrected* — PD reads parameters only, so it is constant along a trajectory and the kink never touched integration order (measured unchanged). The inertness: the lumped PD was ≈ −3 at six of eight presets, where softplus′ underflows to ~1e-23, so all the weights had no effect exactly where the model was most used. Disaggregating by channel put **every preset at pd ≥ 0.18** (aviation 0.185 is the floor, eu-trap 1.078 the ceiling), gated. |
| **F16** | **Two presets contradict their own labels**; the UI displays "Contested" and "Chilling" for the same scenario simultaneously. | **Medium** | ✅ v0.3.0 — `expectedRegime` corrected; gate V11.3 asserts label = simulated regime |
| **F17** | **~45 of 271 tests are circular or tautological**; the headline claims are guarded mostly by such tests. | **Medium** | 🟡 v0.3.0 — the worst offenders (preset monostability, culture-boundary) rewritten to assert real properties; the tabletop's structurally-guaranteed "no dominant path" remains |
| **F18** | **Version-contract violation**: trajectory-changing commits both stamp `0.2.0`. Saved scenarios are not reproducible from their recorded version. | **Medium** | ✅ v0.3.0 — version bumped, change log complete, `package.json` brought to 0.3.0 (it sat at 0.2.0 for the whole of v0.3), and **V12.5 is wired**: a hash over the equations plus every parameter default and bound must change iff `MODEL_VERSION` does. The guard self-tests, and covers every registered parameter rather than a subset. |
| — | **Not stiff.** Worst ratio 87.6; `dt·max|Re| ≤ 0.385` vs RK4 limit ≈ 2.79. | *No defect — recorded because checked* | — |

### Behavioural consequences of the v0.3.0 fixes, recorded rather than tuned around

**M3b (endogenous privilege + the one-way valve):**

- **`privilege_strength` is gone as a lever.** Privilege is now computed from four
  factors the paper's cases actually turn on — pre-commitment, separation from the
  ordinary course, significant legal purpose, valve integrity — and it can fail.
  Measured `π`: cyber **0.065**, eu-trap **0.147**, contested **0.647**, aviation
  **0.966**, healthcare **0.989**. The ordering follows *Capital One* / *Rutter's*
  (post-hoc engagement pierced) versus PSQIA workflow protection.
- **The valve behaves as a cliff, as intended.** Valve discipline 0.3 → 0.5 moves `π`
  from 0.41 to 0.91, against a nearly flat response in the well-disciplined tail.
- **`p_court` is swept, never estimated.** Effective privilege scales linearly from 0
  to `π`; no point value is reported anywhere.
- **A misuse of the model was caught and fixed mid-milestone.** Wiring real `π` into
  `perceivedLegalShield` broke two tabletop tests — correctly, because that function
  is documented as modelling the *illusion* that makes the keep-it-oral move feel
  safe, and real `π` is not an illusion. It is now split into `perceivedLegalShield`
  (naive belief: counsel involved, nothing written down), `actualLegalShield` (the
  doctrinal reality) and `legalShieldIllusion` (the gap). **The gap is the more
  interesting quantity and is the cybersecurity failure mode the paper is written
  against** — measured >0.5 for the naive posture, shrinking as discipline rises.

**M3 (three channels + exposure decomposition):**

- **The opposing gradients are now visible and behave as the paper claims.** Chilling
  presets carry `E_reg` 12.8–43.5 and `E_fid` 18.9–23.7; the five learning presets carry
  **exactly 0.0 on both**. `eu-trap` loads the most regulatory exposure of any preset
  (43.5), which is precisely its teaching point — maximum duty and PLD pressure with no
  protective scaffold.
- **`E_pl` does *not* discriminate well** (14–17 across every preset). Chilling reaches it
  through realised harm, learning through discovery of a large factual record. Two
  different routes to a similar level. Recorded as a limitation, not smoothed away.
- **A spurious negative-debt equilibrium was found and fixed.** The learning attractor was
  resolving at `TD = −7.4`, because `debtAvailability = TD/(TD+td_k)` returns **1.37** for
  `TD < −td_k` — scaling remediation *up* where there is no debt to remediate. The M2
  reliability gate caught it; `debtAvailability` is now `0` for `TD ≤ 0`. Worth noting
  that a defect introduced in M3 was caught by a guard added in M2.
- **`R2` is small in every preset** (0.02–0.17), for defensible reasons: in the chilling
  regime almost nothing is documented so almost nothing reaches the privileged channel,
  and in the learning regime harm is low so the tripwire rarely fires.
- **The hysteresis horizon had to rise 200 → 900 months**, because `R1` has a ~50-month
  time constant. The F14 guard reported the ramp as unrelaxed rather than reporting
  transient lag as path dependence.


- **Only the contested baseline remains bistable.** `cybersecurity` and `eu-trap` previously reported
  two attractors; those were **duplicate roots** from the enumeration bug, not second attractors.
- **The fold along `just_culture` moved from ≈ 0.25 to ≈ 0.617.** The v0.2 figure was in any case a
  grid-resolution artifact (§8.3); the new one comes from a slow-manifold scan.
- **The fold reads ≈ 0.633 after the Newton fast-solve** replaced the loose-tolerance relaxation used
  during the sign scan; the Newton value is the more accurate one.
- **A scaling bug surfaced in the causal-loop view**: loop shares mixed culture pressures (order 1)
  with `harm_events` (order 100), so the diagram reported "100% balancing" at the chilling attractor —
  precisely where the suppression spiral is strongest. Each loop is now reduced to a bounded 0–1
  intensity before shares are taken.

---

## 1. F1 — The advertised feedback topology does not exist

This is the most consequential finding, and it invalidates the model's central narrative claim.

`model.ts`'s own header, `MODEL.md` §7, and the README all describe **R1** as:
> low culture → low documentation → less learning, rising debt → more harm/exposure → (via backfire) still lower culture.

**The final arrow is not in the code.** Tracing `dC/dt`:

```
dC/dt        = lambda_C · (cultureTarget − C) · C · (1 − C)
cultureTarget = a_jc_c·JC + a_sep·SEP + safety_wins − backfire
safety_wins   = omega · f_doc · tle                      // f_doc and params only
backfire      = psi · phi_doc · f_doc · (1 − PB)          // f_doc and params only
f_doc         = sigmoid(gain·(a_c·C + B − threshold))     // B is parameter-only
```

So the whole culture equation reduces to

> **`dC/dt = λ_C · (A + κ·f_doc(C) − C) · C · (1 − C)`**, with `A = a_jc_c·JC + a_sep·SEP` and
> `κ = ω·tle − ψ·φ_doc·(1 − PB)` **both constants**.

**Nothing in `dC/dt` depends on `U`, `D`, `TD`, `L`, or `E`.** The Jacobian's culture row is
`[0,0,0,0,0,∂C]`. The system is a strictly one-way cascade `C → (U,D,TD,L) → E`. `E` is additionally a
pure observable that feeds nothing (disclosed in `METHODS.md`).

The engine states this itself, in `equilibria.ts`:
> *"the culture stock C is dynamically decoupled (its rate depends only on f_doc(C), not on the fast stocks)"*

And `model.ts` explains why the change was made:
> *"The spec tied these to remediation/to_D **volume**, but volume collapses in the learning regime …
> making the model **monostable**. We instead drive them by the documentation **fraction** f_doc"*

**The fix that produced bistability is precisely the change that severed both feedback loops from the
physical stocks.** What remains is a scalar self-reinforcement `C → f_doc(C) → C`.

### Two correct readings, both of which matter

1. **As a defect:** every claim in the narrative layer about debt, harm, or exposure driving culture is
   unsupported by the implementation. The causal-loop diagram in the UI shows arrows the equations
   do not contain.
2. **As an opportunity:** because culture decouples *exactly*, the equilibria are roots of a scalar
   equation and the fold is available **in closed form**. Setting `T(C*) = C*` and `T′(C*) = 1`, and
   using `max σ′ = ¼`, the bistability criterion is approximately

   > **`gain · a_c · (ω·tle − ψ·φ_doc·(1 − PB)) / 4 > 1`**

   One inequality replaces a 1000-point grid search plus a 6×6 eigensolver, gives the fold to machine
   precision, and turns the flagship claim from "demonstrated numerically at a tuned point" into a
   theorem with an explicit parameter region. **This is the single highest-value item in Phase 2.1.**

Measured `κ` and root structure per preset:

| Preset | PD | κ | A | Culture roots | Bistable |
|---|---|---|---|---|---|
| *registry defaults* | −0.600 | 0.818 | 0.178 | 0.9963 | **no** |
| cybersecurity | **+0.158** | 0.135 | 0.171 | 0.1807 | no |
| aviation | −2.670 | 2.938 | 0.440 | 1.0000 | no |
| healthcare | −2.970 | 3.200 | 0.364 | 1.0000 | no |
| pharma-safe-report | −1.725 | 2.681 | 0.307 | 1.0000 | no |
| sr11-effective-challenge | −2.044 | 2.281 | 0.292 | 1.0000 | no |
| nuclear-dual-channel | −2.333 | 3.119 | 0.380 | 1.0000 | no |
| **eu-trap** | **+0.523** | 0.620 | 0.153 | 0.156 / 0.548 / 0.758 | **yes** |
| **neutral** | −1.025 | 1.157 | 0.077 | 0.083 / 0.360 / 1.000 | **yes** |

Note the cyber preset's near-cancellation: `ω·tle = 1.134` vs `ψ·φ_doc·(1−PB) = 0.999`. **The entire
chilling regime rests on a 12% residual between two illustrative coefficients.**

---

## 2. F2/F4 — The learning attractor is a clamp artifact

Measured at `horizon 120, dt 0.5, rk4` (240 steps):

| Preset | final `C` | final `f_doc` | final `TD` | clamp events |
|---|---|---|---|---|
| cybersecurity | 0.1819 | 0.0734 | 163.0 | 0 |
| eu-trap | 0.1573 | 0.0050 | 183.9 | 0 |
| neutral | 0.0902 | 0.0056 | 182.6 | 0 |
| aviation | **1.0000** | **1.0000** | 0.000 | **`TD:min` × 202** |
| healthcare | **1.0000** | **1.0000** | 0.000 | **× 200** |
| pharma-safe-report | **1.0000** | **1.0000** | 0.000 | **× 204** |
| sr11-effective-challenge | **1.0000** | **1.0000** | 0.000 | **× 204** |
| nuclear-dual-channel | **1.0000** | **1.0000** | 0.000 | **× 209** |

For all five learning presets `dTD/dt < 0` at `TD = 0` (aviation: `0 + 0.5 − 0.825 = −0.325`), so the
true ODE solution goes negative and the clamp pins it. **The learning trajectory is not a solution of
the differential equation.** `clampState` sets `diverged` only for non-finite/runaway values, never for
min/max saturation — so `diverged` stays `false` and the test asserting it passes vacuously.

**F4 follows:** five institutional designs that the paper treats as materially different — ASRS, PSQIA,
pharma safe-reporting, SR 11-7, nuclear dual-channel — produce **bit-identical headline outputs**
(`C = 1.0000`, `f_doc = 1.0000`). The model has zero power to discriminate among them. This is the
saturation problem in its most damaging form: the comparative-institutional argument that motivates the
whole exercise cannot be expressed.

> **v0.3 requirement.** Reformulate `dTD/dt` so `TD = 0` is invariant, and give the learning regime
> interior resolution (see §9). If a clamp is still needed, treat the crossing as an event and restart
> the integrator; set `diverged` (or a distinct `saturated` flag) on persistent boundary residence.

---

## 3. F3 — Empirical anchoring

| `evidence_basis` | Count |
|---|---|
| `empirical-anchor` | **0** |
| `expert-estimate` | **0** |
| `illustrative-assumption` | **55 (all)** |

The registry docstring is candid: the one empirical anchor is *a calibration target, not a coefficient* —
the cyber preset tuned toward `f_doc ≈ 0.05` (Schwarcz, Wolff & Woods 2023).

**That target is not met.** Measured: analytic root **0.0721**, RK4 **0.0734** — **+44% to +47% above
target**. The guarding tests assert only `< 0.1`, a one-sided, factor-of-two-loose bound.

The `registry.test.ts` "honesty rule" — *no coefficient claims `empirical-anchor` without a real
citation* — is **vacuous**: the loop body never executes because nothing is so tagged. It would also
pass if someone tagged a coefficient `empirical-anchor` with `source: 'made up'`, since the regex only
requires a 4-digit number.

Additionally, **89 of 96 preset lever rationales are template-generated** by `makeLeverRationales` from
a value-binning function, yet default to `caveatLevel: 'source-backed'`. `'source-backed'` is the
default, not an assertion. (The `neutral` preset is the honourable exception — all 12 overridden to
`low`/`illustrative`.)

---

## 4. F7 — Dimensional consistency

**There is no dimensional test in the repository.** The word "dimensional" appears once, attached to a
*flow-conservation identity* (`incident_inflow = to_D + to_U`), which is an accounting check.

Three mutually inconvertible unit spaces are declared (`incidents`, `debt index`, `exposure index`) plus
two normalized indices. Every flow crossing between them is an unconverted 1:1 identification.

| Equation | Defect |
|---|---|
| `dTD/dt = u_to_debt + td_baseline − remediation − delta_TD·TD` | ❌ Two terms in `incidents/month`, two in `debt/month`. **Undeclared implicit conversion of 1 debt unit per incident.** `sigma`/`rho` are declared `1/month` but must be `debt·incident⁻¹·month⁻¹`. |
| `dE/dt = … + phi_harm·harm_events + …` | ❌ `harm_events = gamma·TD·(1−L/100)` is a **level** (no `/month`), used as a flow, *and* trapezoid-integrated in `cumulativeHarm` (yielding harm·months). It cannot be all three. |
| `backfire = psi·phi_doc·f_doc·(1−PB)` | ❌❌ **`phi_doc` is declared `exposure/incident` and reused as a dimensionless gain in the culture equation** ⇒ `culture·exposure/incident`. Also a **hard parameter alias**: `phi_doc` appears in both `dE/dt` and the culture loop and cannot be identified independently. |
| `safe_to_report_score = clamp01(Σ wᵢ·leverᵢ − 0.16·relu(PD))` | ❌ A quantity in the synthetic `PD` unit (range to +4) subtracted from a dimensionless 0–1 index, then clamped. **The clamp hides the incoherence.** Same defect in `litigation_pressure`. |
| `learning_yield = learning_gain / incident_inflow` | ❌ Units `L per incident`, **not a 0–1 index** — yet shipped as one of six "institutional meters." Measured range 0.022–2.109; the UI applies an undocumented `min(1, y/2)` "scaled for display," at which aviation/pharma/nuclear all clamp to ~1.0 and become indistinguishable. |
| `f_doc = sigmoid(gain·(drive − threshold))` | ⚠️ `gain` declared `dimensionless` but must be `1/drive`. Declared-unit error. Same class: `alpha_td` (`per TD_ref`), `beta_L` (`per 100 L`) — both actually dimensionless. |

`cultureTarget` is also **unbounded**: theoretical range to ~7.4 against a stock capped at 1. The
`C·(1−C)` factor is the only thing keeping `C` in range, so "target" is a misnomer above 1 — it is a
saturation switch.

---

## 5. F6/F15 — Identifiability and dead levers

### 5.1 Measured effect sizes (`f_doc`, contested baseline, 9-point sweep)

| Lever | Span | |
|---|---|---|
| `mandatory_reporting`, `just_culture`, `recipient_enforcer_separation`, `translation_layer`, `intermediary_capacity` | ≈ 9.9 × 10⁻¹ | live |
| `privilege_strength` / `workflow_protection` / `safe_harbor_non_admission` / `original_records_boundary` | 2.7 / 1.7 / 1.4 / 1.1 × 10⁻⁴ | **~4 orders down** |
| `pld_penalty`, `effective_challenge`, `near_miss_tier` | **0.000** | **dead** |

**Three levers have identically zero effect on the documentation fraction at the default baseline, and
four more are four orders of magnitude below the live five.** The near-inert four are exactly the levers
encoding the paper's §4.2.2 statutory recommendations — so the model as shipped cannot express the
policy argument it exists to illustrate.

### 5.2 Mechanism (a): a single scalar aggregate

Finite-difference `∂aux/∂lever` at `t = 0` shows five levers reaching `f_doc` through **one channel**:

| Lever | `∂(perceived_discoverability)` |
|---|---|
| `privilege_strength` | −1.00 |
| `workflow_protection` | −0.70 |
| `safe_harbor_non_admission` | −0.65 |
| `original_records_boundary` | −0.35 |
| `pld_penalty` | +0.70 |

PD → `drive` → `f_doc`. On this pathway the five span a **one-dimensional subspace with fixed ratios**.
No observation of `f_doc`, of any length or precision, can distinguish them. This is *structural*
non-identifiability, provable from the equations. Measured pairwise response correlation confirms it:
7 of 36 live pairs exceed `|r| > 0.999`, including `workflow_protection ~ safe_harbor_non_admission`
at **r = 0.99999**.

The same collapse afflicts the structural coefficients: `(a_c, a_jc, a_m, a_disc, threshold)` are jointly
unidentifiable up to a shift, and the eight `w_*` weights enter only via one scalar scaled by `a_disc`.

### 5.3 Mechanism (b): the ReLU switch

`relu(PD)` is zero unless `PD > 0`. Computed PD by preset: **positive in only 2 of 8** (cyber +0.158,
eu-trap +0.523); negative at registry defaults (−0.600) and in the other six.

**So in 6 of 8 presets, nine parameters (`w_m, w_p, w_priv, w_sep, w_tl, w_workflow, w_records, w_safe,
a_disc`) have exactly zero influence** — on `f_doc`, on `safe_to_report_score`, and on
`litigation_pressure`. Any Sobol/PRCC run over that region reports them as near-zero-influence; that is
an artifact of the kink, not a result. The ReLU also makes the RHS only C⁰ at the `PD = 0` hyperplane,
which degrades RK4 locally and makes the central-difference Jacobian wrong on that surface.

### 5.4 Mechanism (c): saturation

`f_doc` is a logistic saturated at both attractors (`≈0.005` / `≈1.000`), where `σ′ ≈ 0`. Aviation lever
spans are `10⁻⁶`–`10⁻¹¹`. **The "sensitivity" the app reports is almost entirely about which basin the
system falls into, not graded lever response.**

---

## 6. F5/F16/F17 — Circularity

### 6.1 Tuned coefficients

Six parameters carry registry notes explicitly stating they were set to produce the headline result:
`gain`, `threshold`, `omega`, `psi`, `a_jc_c` ("Calibrated for bistability" / "Tunable so the bistable
window sits at sensible lever values"), plus `td_sat`, `delta_TD` ("Well-posedness refinement… not in
BUILD_SPEC"). Meanwhile `METHODS.md` §2 presents bistability as **"Demonstrated."**

Also: `source: 'DocFlow BUILD_SPEC §2'` appears on **31 of 43** structural parameters. That is a
self-citation to an internal document, not evidence.

### 6.2 Preset labels contradict behaviour

| Preset | Declared | Actual | `f_doc` | Match |
|---|---|---|---|---|
| eu-trap | **contested** | **chilling** | 0.0050 | ❌ |
| neutral | **contested** | **chilling** | 0.0056 | ❌ |

`expectedRegime` uses the same vocabulary as `classifyRegime` but means something different ("sits in the
bistable window" vs "settles in the 0.2–0.5 band"). `PresetGallery` renders the declared label while
`HeadlineReadout` renders the computed one, so **the app currently displays "Contested" and "Chilling"
for the same scenario simultaneously.** No test asserts the correspondence.

### 6.3 Circular tests (~45 of 271)

- 5 preset→regime tests, 3 bistability/monostability tests, 3 fold/hysteresis tests.
- 4 institutional-analog regressions — **three of which reduce to arithmetic on static weighted sums of
  levers** (`safe_to_report_score`, `litigation_pressure`, `accountability_legitimacy` contain no
  dynamics), dressed as simulation results by running a 120-month integration first and then reading a
  quantity that depends only on the parameter vector.
- **10 × "no dominant path (the thesis property)".** `perceivedLegalShield` awards a flat `+0.30` for a
  *choice flag* (`legal_owns_record`), so any scenario pairing one counsel-owns-the-record branch with
  one that does not is **structurally guaranteed** to have no dominant path. All ten scenarios are
  authored with exactly that pairing. Compounding it, `goodVector` is a 14-axis Pareto test mixing
  `[0,1]`, `[0,100]`, and one unbounded quantity — non-domination on 14 heterogeneous axes is close to a
  mathematical tautology. The docstring concedes the key axis pair is *"decoupled on purpose."*

**Genuinely validating (~45–50 tests):** `linalg.test.ts` golden spectra (10), the Ishigami test (1, with
caveats), resolver cycle guards (2), tabletop schema validation (9), the v0.1 share-hash back-compat test
(1), persistence migration (2), worker staleness suppression (1), `score.test.ts` positive controls (4),
`meters.ts` no-drift (1), model debt-saturation / `dC/dt = 0` at boundaries / flow-partition identity (4),
genuine-fixed-point residual check (2), determinism (1), clamp/divergence (4), registry schema (4).

---

## 7. Integration

### 7.1 Not stiff — checked and closed

| Metric | Worst observed |
|---|---|
| Stiffness ratio `max|Re|/min|Re|` | **87.6** (eu-trap, t=0) |
| `dt·max|Re|` at `dt = 0.5` | **0.385** (healthcare) |

RK4's real-axis stability limit ≈ 2.79. `dt = 0.5` is stable everywhere sampled. Stiffness is **not** the
problem.

### 7.2 F11 — Clamping destroys order of accuracy

Richardson against a `dt = 0.03125` reference, final-state L2:

| Preset | RK4 @ dt=0.5 | Euler @ dt=0.5 | clamps |
|---|---|---|---|
| cybersecurity | **3.7 × 10⁻⁸** | 1.7 × 10⁻¹ | 0 |
| neutral | **6.0 × 10⁻⁸** | 1.0 × 10⁻¹ | 0 |
| aviation | 1.8 × 10⁻¹ | **8.7 × 10⁻⁶** | 682 |
| healthcare | 1.6 × 10⁻¹ | **1.1 × 10⁻⁵** | 680 |
| nuclear-dual-channel | 2.5 × 10⁻¹ | **5.1 × 10⁻⁶** | 689 |

**In clamped presets RK4 is 4–5 orders of magnitude *worse* than Euler.** Observed RK4 convergence there
is `1.84e-1 → 8.66e-2 → 3.73e-2` (ratio ≈ 2.1) — **first order**, not fourth. RK4's four stages straddle a
non-smooth constraint boundary. The existing test asserts only `d2 ≤ d1 + 1e-9` (any decrease) and is run
on the *aviation* preset, so it cannot detect this.

### 7.3 F12 — Pole in `debtAmplification`

`1 + α·(dr/(1 + dr/td_sat))` has a **pole at `TD = −TD_ref·td_sat`**. At registry minima
(`TD_ref = 1`, `td_sat = 0.5`) the pole sits at `TD = −0.5` — reachable in one RK4 half-stage from
`TD ≈ 0`. RK4 intermediate stages are **unclamped**, so the RHS *is* evaluated at negative `TD`
(`TD = −0.49 → amplification −13.7`; `−0.51 → +16.3`). The `max(0, ·)` guard on `incident_inflow` catches
the negative branch but not the large-positive near-pole branch. A `tanh` or exponential saturation has
the same low-debt slope, is globally bounded, and is pole-free — **strictly better**.

### 7.4 F9 — Absorbing culture states

`dC/dt ∝ C·(1−C)`, so `C = 0` and `C = 1` are exact fixed points, and `clampState` sets `C` to exactly 1
on any overshoot. Verified: at `lambda_C = 1.0` (registry max) the neutral preset reaches exactly
`C = 1.000000` at every `dt` tested down to 0.01. **Once there, no subsequent policy change can move it.**
The advertised hysteresis is therefore one-way at the top boundary: recovery from the learning attractor
is structurally impossible — not because of dynamics, but because of representation. Five of eight
presets terminate exactly there.

### 7.5 Other integration defects

- **Non-finite recovery fabricates state.** On `nonfinite`, `v = spec.default` — a diverged `TD` is reset
  to **10** (the initial default) and integration continues. Everything after is fiction, flagged only by
  a boolean.
- **Silent horizon truncation.** `stepCount` caps at `MAX_STEPS = 200_000` but `integrate` still writes
  `t[i] = i·dt`, so `horizon 120, dt 0.0001` silently simulates **20 months** while
  `Trajectory.settings.horizon` still reads 120. A `dt`-halving convergence study past the cap compares
  different time spans.
- **Clamp destroys quantity with no bookkeeping.** Incidents flow `U → TD` at `σU`; `TD` floors at 0; the
  accumulated deficit vanishes unaudited.

---

## 8. F8/F10 and the analysis machinery

### 8.1 ~34 unregistered coefficients

`model.ts` (≈ lines 104–173) and the tabletop layer contain roughly 34 hard-coded weights across
`protectionBundle` (5), `privateOrderableCapacity` (÷7), `policy_scaffold_dependency` (3),
`private_ordering_gap` (0.65), `accountability_legitimacy` (5), `safe_to_report_score` (7 + 0.16),
`litigation_pressure` (5), `near_miss_signal` (0.35/0.65), plus `boundary.ts`/`capturability.ts`/
`outcome.ts` (~17 more).

These drive the six institutional readouts — **the numbers a policy audience will quote** — and they are
absent from the registry, absent from `MODEL.md`'s equations, absent from the Assumptions panel (whose
copy claims to list "every parameter"), un-tunable, un-sanitized, and excluded from every sensitivity
analysis. **True parameter count ≈ 89, not 55.**

They also encode a strong untested assumption: linear blending asserts **perfect substitutability** among
institutional mechanisms (privilege 1.0 ≈ workflow protection 1.0, up to weight).

### 8.2 F10 — Monte Carlo discards the scenario

`sampleParam` accepts `base` and, under `'uniform'`, ignores it. The app runs
`{ distribution: 'uniform', vary: [...LEVER_KEYS], n: 120 }`. **So the 10–90% band drawn around *any*
preset is the band of the entire `[0,1]¹²` lever hypercube — identical for aviation and cyber.** Nothing
in the UI says so. Bands are also *pointwise*, not simultaneous, so in a bistable system the median curve
passes through the separatrix where no run ever goes. Diverged runs are counted and then included in the
bands anyway.

### 8.3 Equilibria and bifurcation

- **F13:** `converged` and `residualNorm` are computed and **never read by any caller**.
  `fastEquilibriumAt` clamps `L` to `[0,100]` *inside* its iteration, so a true equilibrium with
  `L* > 100` yields a parked non-fixed-point that is then eigen-classified "stable" and counted by
  `isBistable`. `residualNorm` is also reported one iteration stale on the non-converged path.
- **Incompleteness:** repelling `C = 0`/`C = 1` fixed points are dropped, so every bifurcation diagram's
  unstable branch is incomplete. Even-multiplicity roots — the tangency *at* the fold — are invisible to
  sign-change bracketing, so the fold itself is never located.
- **F14:** `hysteresis` integrates a finite horizon at each ramp step with **no check that the state has
  relaxed**; `hasHysteresis` is a bare 10%-of-range gap. Near the fold, critical slowing down guarantees
  incomplete relaxation. It is documented as "numerical continuation" in two places; it is transient
  parameter ramping. It also silently ignores the user's solver/`dt`/`horizon` (unlike `sweep2D`).
- **`tippingValues`** is a grid count-change detector at resolution 1/60, compounded by the 1/1000 culture
  grid. The quoted "fold at jc ≈ 0.25" is a resolution artifact quoted to two significant figures; no
  test asserts its location.
- **`classifyStability`** uses an absolute `1e-7` tolerance, unscaled to the Jacobian norm — near the fold
  the true eigenvalue sits inside that window over a nontrivial interval, producing `marginal`
  classifications and spurious `tippingValues`.

### 8.4 Sensitivity

- Saltelli/Jansen estimators are **correct**, but the base sample is **LHS, not a low-discrepancy Sobol′
  sequence**, so convergence is plain `O(N^{-1/2})`.
- **Validated only outside its operating regime:** Ishigami at `N = 8000, k = 3` (40 000 evaluations);
  the app runs `N = 200, k = 12`. No bootstrap CIs, no `S1 ≤ ST` check, no `ΣS1 ≤ 1` check; the suite
  explicitly tolerates indices outside `[0,1]`. **The lower half of every tornado is noise, unlabelled.**
- **PRCC** solves raw normal equations with condition number ~10⁷ and **silently substitutes `β = 0`** on
  singularity, degrading PRCC to plain Spearman with no warning. No significance testing. PRCC is only
  interpretable under monotone relationships; the model is manifestly non-monotone near the fold, which
  is exactly where users look.
- **All three methods explore the full registry `[min,max]` uniformly and independently**, discarding the
  operating point and assuming zero correlation among institutionally co-occurring levers.

### 8.5 Infrastructure

- **Coverage is gated backwards.** Only `src/engine/**` has a threshold. `src/lib/institutional.ts` (the
  recommendation engine users act on) and `src/lib/export.ts` (the playbook/PDF output) have none. The
  85% branch bar is *aggregate*, not per-file, so `sensitivity.ts` (75%) and `monteCarlo.ts` (80%) pass by
  subsidy from 100%-covered tabletop files. **The two weakest-covered files are precisely the two whose
  defaults are most defective.**
- **`engine.worker.ts` has zero coverage**; its `monteCarlo` branch is dead code — Monte Carlo actually
  runs synchronously on the main thread inside a `useMemo`, contradicting both `ARCHITECTURE.md` and the
  README.
- **F18 — version-contract violation.** `MODEL_VERSION` stayed `0.2.0` across a commit that changed preset
  lever values by +351/−115 lines. `version.ts` requires a bump "whenever … default parameter … changes in
  a way that alters trajectories." Two different trajectory-producing configurations both stamp `0.2.0`
  into `RunRecord.modelVersion`; **saved scenarios are not reproducible from their recorded version.**
- **Doc drift:** ARCHITECTURE/README claim MC runs in the worker (it does not); ARCHITECTURE says 205 tests
  (271); METHODS §8 cites MODEL.md §6 for the refinement log (it is §9); METHODS §8 claims a
  "residual/output interface … could fit parameters" that does not exist; MODEL.md's change log stops at
  2026-06-22 though the tabletop landed later.

---

## 9. Does every lever improve outcomes monotonically?

**Substantially yes — and, as the brief anticipated, that is the diagnostic.**

Of 180 measured (lever × outcome × preset) cells: **134 monotone (74%), 37 identically flat (21%), 9
non-monotone (5%).** Within the monotone set the sign is almost always "more lever → better outcome."

Stated plainly: **v0.2 encodes a thesis rather than testing one.**

The nine exceptions are the most scientifically interesting content in v0.2 and deserve promotion, not
burial. At the **cyber** baseline, `pld_penalty` and `mandatory_reporting` both **reduce `f_doc` and raise
`TD` and `E`** — duty and exposure without protection make things worse. That is a genuine,
counterintuitive, paper-consistent result the model *produces* rather than assumes.

Crucially, **it arises in the one place v0.2 encodes genuinely opposed forces**: duty and exposure enter
`perceived_discoverability` with positive sign, protection with negative sign. This is direct evidence for
the v0.3 exposure decomposition — opposed gradients are what generate non-trivial results.

---

## 10. Boundary adequacy

| Excluded | Why it matters | v0.3 |
|---|---|---|
| **Detection** | Model asks whether *known* incidents get documented. Paper §3.1.2: semantically silent failures generate no native indication. Undetected incidents are outside the boundary entirely. | **Add** (§1.5) |
| **Opposed exposure gradients** | Single lumped `E` that feeds nothing. The paper's core claim is that PL / regulatory / fiduciary exposure move in *opposite* directions with candour. | **Add** (§1.2) |
| **Any feedback into culture** | **F1** — the loop the narrative advertises is absent. | **Add** (§1.2/1.5) |
| **Endogenous privilege** | Privilege is an input slider; in the case law it is an *outcome* that can be lost. | **Add** (§1.3) |
| **Discrete legal events** | Litigation pressure is continuous; a disclosure order or PLD Art. 9(1) presumption is a jump. | **Add** (§2.5) |
| **Non-investigation** | Only "not writing" is modelled; "not looking" is invisible and, per the paper, more insidious. | **Add** (§1.6) |
| **Multiple firms** | No agent abstraction. The §4.2.2 commons claim is multi-agent. | **Add** (§3.1) |
| **Strategic interaction** | Tabletop `Role` has no state, objectives, or payoffs; `crossBoundary` is a scalar haircut. The trap thesis is an incentive story. | **Partial** — commons game only; `ADR/0012` rejects a full agent model |
| **Individual heterogeneity** | One representative firm, one culture scalar. | **Reject** — no data could constrain it (`ADR/0012`) |

---

## 11. Reproducing the numerical figures

Add a throwaway `src/engine/_audit_diag.test.ts` using only public engine exports:

1. **Monotonicity** — `LEVER_KEYS` × {`f_doc`,`TD`,`L`,`E`,`cumExposure`} × {neutral, cyber, aviation};
   11-point sweep over `[min,max]`; classify increasing / decreasing / non-monotone / flat (`span < 1e-9`).
2. **Integration error** — `integrate` at `dt ∈ {0.5, 0.25, 0.125}` vs a `dt = 0.03125` reference; report
   final-state L2 for both solvers; log `clampEvents` grouped by stock and kind.
3. **Stiffness** — `numericalJacobian` at `t ∈ {0,30,60,120}` → `eigenvalues`; report `max|Re|/min|Re|`
   and `dt·max|Re|`.
4. **Collinearity** — **per outcome, never interleaved** (interleaving two differently-scaled outcomes
   into one vector produces spurious `r = 1.000`); 9-point response curves per lever; drop
   `span < 1e-9`; Pearson-correlate survivors.
5. **Aggregation probe** — finite-difference `computeAux` w.r.t. each lever at `h = 0.01`; list which
   auxiliaries change. This exposes the single-scalar collapse in §5.2.
6. **Closed-form check** — compute `κ = ω·tle − ψ·φ_doc·(1−PB)` and `A = a_jc_c·JC + a_sep·SEP` per preset;
   solve `A + κ·f_doc(C) = C` on `[0,1]`; compare roots against `cultureEquilibria`.

---

## 11b. F19 — The culture loop is closed, and inert (found in M2, v0.3.0)

**This is a finding against my own repair work, not against v0.2.**

F1 was that `dC/dt` was autonomous: the debt → harm → exposure → culture loop described
in `MODEL.md` did not exist in the code. M2 added the two return arrows and V1.3 gates
the fix by checking the Jacobian's culture row is no longer zero. That gate passes.

It is also too weak. Measuring the loop's INFLUENCE rather than its presence shows it
does nothing at any shipped operating point:

| preset | Δ final culture when `psi_E`, `psi_H` are scaled ×10 |
|---|---|
| aviation, healthcare, pharma, sr11, nuclear | **exactly 0.00e+0** |
| cybersecurity, eu-trap, neutral | ~1e-6 |

The cause is saturation, measured not inferred. The raw culture target sits at **3.1–3.6**
in the five learning presets and **−0.18 to −0.25** in the three chilling ones, against a
valid range of [0,1]. Every shipped preset is pinned against a bound, so the clamp
absorbs the entire change. The chill terms themselves respond correctly — 0.073 → 0.727
under the ×10 scaling — and the clamp then discards it.

**The wiring is not broken.** Pushing further, aviation leaves the learning attractor
between **×33 and ×36** (C: 0.99991 → 0.826 → 0.534 at ×40 → 0.0005 at ×50). So the
mechanism is real and reachable; it is simply ~35× away from every operating point the
model ships with.

**Not fixed, deliberately.** The fix would mean rescaling coefficients until the loop
became visible — setting a free parameter to produce a qualitative behaviour, which is
exactly what V11.1 forbids and what `RISKS.md` R4 anticipates in saying that whatever
the corrected model does is the finding. Gated instead by `cultureLoopInfluence.test.ts`,
which asserts the defect: if a future change makes the loop live at a shipped preset the
gate fails, and that failure is good news.

**What it costs.** No DocFlow output currently demonstrates exposure feeding back into
documentation culture. The structure is present; the behaviour is not observable at any
shipped preset, and any claim resting on that feedback must say so.

**Read the other way, it is a boundary-mapping result** — the deliverable form the
epistemic stance calls for (ADR/0001). Stated as a conditional: *the learning equilibrium
in these five regimes is robust to exposure chill up to roughly 35× the assumed
coefficient, and tips beyond it.* That is a falsifiable claim about how much fear an
architecture can absorb, and it is more useful than the loop being visibly active would
have been.

---

## 11c. F20 — V6.2 is NOT met: two institutions remain unresolved

M3's acceptance criterion V6.2 requires every preset pair to differ by **more than 5% of
range** on at least one headline output. Measured worst pair:

**aviation ~ nuclear-dual-channel: 4.27%**, on `L`. The criterion is not met.

Per-output, on dynamic outcomes:

| output | separation |
|---|---|
| `f_doc`, `C`, `E_reg` | **0.00%** |
| `TD` | 0.01% |
| `E_pl`, `R1`, `R3` | ~1.2% |
| `R2` | 1.68% |
| `L` | 4.27% |

Their input postures are not similar — they differ by **26.3%** on `pd_fact` and 10.8% on
`pd_rem`. The dynamics wash that difference out.

**F4 is closed; F20 is what remains of it.** Those five learning presets were once
bit-identical (`C = 1.0000, f_doc = 1.0000`). They are now distinct, and the gate proves
it. But "distinct" is a much weaker property than "distinguishable at 5% of range", and
the honest statement is that DocFlow can currently tell the aviation and nuclear
architectures apart only through a 4.27% difference in accumulated learning.

**One fix was available and was rejected.** Counting `pd_fact`, `pd_anal`, `pd_rem` and π
as headline outputs lifts the worst pair from 4.27% to **13.85%** and V6.2 passes. Those
four are functions of the parameters ALONE, so two presets with different levers differ on
them by construction — it would be passing an interior-resolution test on a definitional
choice rather than on model behaviour. `identifiability.test.ts` excludes them and says
why, and the 4.27% figure is ratcheted so it cannot quietly degrade.

**What would fix it properly:** the detection stage and capability stock (M4). Aviation
and nuclear differ mainly in *what they can detect and how the signal travels*, and the
model has no detection stage — so the one dimension on which these two regimes most
differ is currently absent from the state vector.

---

## 11d. F21 — The M3c identifiability claim was overstated

The M3c commit said disaggregating discoverability by channel delivered an
"identifiability gain". V7.1, run afterwards, measured what it actually delivered.

**Discoverability weights: rank 3 of 8.** Named deficient directions at the contested
preset:

```
sigma=2.8e-11   w_p(0.90) + w_m(-0.41)
sigma=4.2e-14   w_leak(0.92) + w_407(-0.39)
sigma=1.8e-14   w_priv(0.89) + w_sep(-0.45)
sigma=7.2e-15   q_407(1.00)
sigma=0.0e+0    w_records(0.70) + w_m(0.69)
```

Disaggregation moved this from rank 1 to rank 3. That is a real improvement — under the
lumped scalar all eight weights fed one sum and were unidentifiable by construction — but
it is not separability, and "identifiability gain" implied more than rank 3/8 supports.

**Two defects were found and fixed in the process, both of the F1 class.** First, M3c
wired only `pd_fact` into anything: `w_priv`, `w_sep`, `w_407`, `q_407` and `w_leak` sat
at **sigma = 0 exactly** — five registered parameters with no effect on any reported
output. Second, Channel Three generated **no exposure at all**, so remediation throughput
was consequence-free; `ADR/0004` argues C3's shield should be *weak*, and a channel with
zero exposure asserted the opposite far more strongly than FRE 407 supports. Both are now
wired (`pl_from_analysis` via `pd_anal`, new `pl_from_remediation` via `pd_rem` and
`xi_3`), which is what moved the rank from 1 to 3.

**Lever block: rank 10 of 15** at the contested presets, 8 of 15 at the learning ones.
Deficient directions are named, per V7.1:

```
sigma=6.4e-10   precommit(0.75) + significant_purpose(0.51) + workflow_protection(-0.26)
sigma=2.7e-12   kovel_evaluator(0.98)
sigma=2.4e-14   significant_purpose(0.83) + precommit(-0.56)
```

`precommit` and `significant_purpose` trade off almost exactly, and `kovel_evaluator` is
its own null direction — it moves no reported output measurably. Both are M3b levers, so
the privilege model buys doctrinal fidelity at a real cost in identifiability.

**A methodological error of mine, worth recording.** The first implementation sampled only
the FINAL STATE — ten outputs against fifteen levers — so the matrix could not reach full
column rank no matter how separable the parameters were. V7.1 specifies sensitivity *over
a reference trajectory*. Sampling eight times through the transient recovers 2-3 ranks
(8 to 10 at contested, 5 to 8 at learning). A rank measured against too few outputs is
bounded by the measurement, not by the model.

**The decision gate cannot be evaluated as written.** `ROADMAP.md` says: if V7.1 shows
v0.3 is *less* identifiable than v0.2 on shared outputs, cut stocks. There is no v0.2 rank
baseline — the metric did not exist then — so the comparison the gate calls for is
unavailable. What is comparable is V7.2, the collinearity proxy, which improved from
**7/36 to 3/42 lever pairs above |r| > 0.999**. On that measure v0.3 is better. Anyone
wanting the gate honoured as specified would need to run this analysis against the v0.2
tag, which is a half-day of work and is recorded in `OPEN_QUESTIONS.md` rather than
claimed as done.

---

## 12. Verdict, and what it constrains in v0.3

> v0.2 is a **well-engineered implementation of a set of assumptions with no empirical content**, whose
> headline qualitative claim is **not what the code implements**, and whose comparative-institutional
> outputs are **bit-identical across five of the designs it exists to compare**.

Three constraints on v0.3 follow, beyond what the brief specified:

1. **Restore the feedback before adding structure.** F1 means v0.2 is not, in the operative sense, a
   feedback model. v0.3's first job is a culture equation that actually depends on the stocks — otherwise
   every new stock is added to a cascade, not a loop, and the added structure buys nothing.
2. **Fix identifiability before adding parameters.** v0.2 already has provable non-identifiability at its
   core (§5.2) and ~34 invisible coefficients (§8.1). Adding parameters atop an unidentifiable base makes
   the instrument *less* defensible. `MODEL_v3_SPEC.md` therefore breaks the PD aggregate by giving the
   protection levers **distinct pathways with distinct observable consequences** — which the three-channel
   structure supplies naturally — rather than adding weights to the existing scalar.
3. **Interior resolution is a hard requirement, not a nicety.** F4 (five presets bit-identical) and §5.4
   (saturation) mean the current model cannot discriminate institutional designs at all. Any v0.3
   sensitivity or scenario-discovery result must be reported separately for interior vs saturated regions,
   or it repeats v0.2's error of presenting basin membership as graded response.

The analytic route (§1) is open, underused, and should be exploited before spending compute on
continuation.
