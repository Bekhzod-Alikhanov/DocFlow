# MODEL.md — DocFlow system-dynamics model

> **Source of truth for the math.** This file must match the code in
> [`frontend/src/engine`](../frontend/src/engine) (note: the engine lives under
> `src/engine`). Every equation change is recorded in the change log at the
> bottom, with the before/after and the reason (spec §7.7, §10).
>
> **Epistemic status:** this is a *structural / relational* model for
> decision-support and structured reasoning — **not a calibrated forecast.** All
> coefficients are `illustrative-assumption`s unless a citation says otherwise.

Model version: **0.1.0** (see [`src/engine/version.ts`](../src/engine/version.ts)).

---

## 1. Stocks (state variables)

| Symbol | Meaning | Unit | Bounds | Default init |
|---|---|---|---|---|
| `U`  | Undocumented incidents | incidents | ≥ 0 | 20 |
| `D`  | Documented & analyzed incidents | incidents | ≥ 0 | 5 |
| `TD` | Latent technical debt | debt index | ≥ 0 | 10 |
| `L`  | Organizational learning / safety capability | 0–100 | [0,100] | 30 |
| `E`  | Litigation + regulatory exposure | exposure index | ≥ 0 | 10 |
| `C`  | Documentation culture / psychological safety | 0–1 | [0,1] | 0.4 |

Stocks are clamped to these bounds each step. Clamping never hides divergence: a
NaN/∞ or a magnitude above `RUNAWAY_BOUND = 1e7` is recorded as a `ClampEvent`
and flips the trajectory's `diverged` flag (spec §2.1, §4.5).

`E` is a pure **observable**: it accumulates discovery/regulatory risk but does
not feed back into any other stock or into `f_doc`. The R1 "exposure lowers
culture" link is carried by the `backfire` term (documenting under weak
privilege), not by `E` directly.

---

## 2. The central nonlinearity — documentation fraction `f_doc`

```
perceived_discoverability (PD) =
      w_m·mandatory_reporting + w_p·pld_penalty
    − w_priv·privilege_strength − w_sep·recipient_enforcer_separation − w_tl·translation_layer

drive_to_document =
      a_c·C + a_jc·just_culture + a_m·mandatory_reporting − a_disc·relu(PD)

f_doc = σ( gain · (drive_to_document − threshold) )      ∈ (0,1)
```

`f_doc` depends on the culture stock `C` and the (constant-during-a-run) levers.
It is strictly increasing in `C`, `just_culture`, `mandatory_reporting`,
`privilege_strength`, `recipient_enforcer_separation`, `translation_layer`, and
decreasing in positive perceived discoverability.

---

## 3. Flows (rates)

```
capability_factor = max(0, 1 − beta_L·L/100)
debt_amplification = 1 + alpha_td · ( (TD/TD_ref) / (1 + (TD/TD_ref)/td_sat) )      # SATURATING — see §6
incident_inflow   = max(0, base_incident_rate · debt_amplification · capability_factor)

to_D = f_doc · incident_inflow
to_U = (1 − f_doc) · incident_inflow

translation_layer_efficiency = base_eff + tl_boost·translation_layer
learning_gain = eta_learn · to_D · translation_layer_efficiency
remediation   = rho · D · (L/100)
d_closeout    = kappa_D · D
belated_doc   = mu · U · f_doc
u_to_debt     = sigma · U
harm_events   = gamma · TD · max(0, 1 − L/100)

safety_wins   = omega · f_doc · translation_layer_efficiency          # REFINED — see §6
backfire      = psi · phi_doc · f_doc · (1 − privilege_strength)      # REFINED — see §6
```

### Stock equations

```
dU/dt  = to_U − belated_doc − u_to_debt
dD/dt  = to_D + belated_doc − d_closeout
dTD/dt = u_to_debt + td_baseline − remediation − delta_TD·TD          # delta_TD ADDED — see §6
dL/dt  = learning_gain − delta_L·L
dE/dt  = phi_doc·to_D·(1 − privilege_strength) + phi_harm·harm_events
         + phi_pld·pld_penalty·to_U − theta_E·E
dC/dt  = lambda_C · ( a_jc_c·just_culture + a_sep·recipient_enforcer_separation
                      + safety_wins − backfire − C ) · C · (1 − C)     # a_jc_c ADDED — see §6
```

---

## 4. The two feedback loops

- **R1 — chilling (vicious):** low `C` → low `f_doc` → little `to_D` → little
  learning, rising `TD` → more `harm_events` and exposure; and documenting under
  weak privilege produces `backfire` that pushes `C` still lower.
- **R2 — translation layer (virtuous):** privilege + just culture + separation +
  translation → `f_doc` rises, documenting is visibly safe & productive
  (`safety_wins`) → `C` rises → `f_doc` rises further; debt falls, harm falls.

The slow culture stock `C` with logistic dynamics `dC/dt ∝ C·(1−C)` coupled to
the sigmoidal `f_doc(C)` is what makes the system **bistable**.

---

## 5. Bistability (verified numerically)

Because `safety_wins` and `backfire` depend only on `f_doc(C)` (not on the fast
stocks), the culture stock is **dynamically decoupled**: its rate is
`λ·g(C)·C·(1−C)` where `g(C) = a_jc_c·jc + a_sep·sep + omega·f_doc(C)·tle −
psi·phi_doc·f_doc(C)·(1−privilege) − C`. The equilibria are therefore the roots
of `g(C)` (plus the logistic boundaries), found exactly by bisection; the full
6-D fixed point at each is classified by the eigenvalues of the numerical
Jacobian (EISPACK `elmhes`/`hqr` port in [`linalg.ts`](../src/engine/linalg.ts)).

**Result with the default parameters (verified in the test suite):**

| Preset | Stable attractors | f_doc | Regime |
|---|---|---|---|
| Cybersecurity | 1 | ≈ 0.04 | chilling (high TD) |
| Aviation | 1 | ≈ 1.0 | learning (low TD) |
| Healthcare (PSQIA) | 1 | ≈ 1.0 | learning (low TD) |
| EU AI Act + PLD trap | 1 | ≈ 0.00 | chilling **with high exposure** |
| Contested baseline | **2 stable + 1 saddle** | 0.005 / 1.0 | **bistable** |

The Contested baseline (`privilege=0.5, just_culture=0.1, separation=0.3,
translation=0.3`) has equilibria at `C≈0.08` (stable, chilling), `C≈0.38`
(saddle / separatrix), `C≈1.0` (stable, learning). Path dependence: starting
culture below the separatrix falls to chilling; above it climbs to learning.

Sweeping `just_culture` produces a **saddle-node (fold) bifurcation** near
`jc ≈ 0.25` and a **hysteresis loop**: ramping just-culture up keeps the system
chilling until ≈0.3, but ramping back down keeps it in the learning regime to
`jc = 0` — the two branches differ across the bistable window.

### The EU AI Act + PLD "trap" (the key teaching case)

Maximal mandatory reporting (0.85) + non-documentation penalty (0.8) with **no
privilege scaffold** (0.1) and weak separation (0.15) does **not** reach the
learning attractor. It falls to the chilling attractor *and* accumulates the
highest exposure `E` of any preset — duty + litigation exposure without
protection is the worst structural posture (spec §1, §9 DoD).

### Calibration

The single empirical anchor is a **calibration target**, not a coefficient: the
cybersecurity preset is tuned so its chilling attractor sits near `f_doc ≈ 0.05`
— the ~95%-suppression figure from Schwarcz, Wolff & Woods (2023), which is an
**estimate**, not a measurement, and is labeled as such everywhere it appears.
The model settles cyber at ≈4% documentation, consistent with that estimate.

---

## 6. Refinements to the BUILD_SPEC reference model

The spec (§2, §10) explicitly invites refining functional forms for dimensional
consistency, dynamical soundness, and bistability, and requires recording each
change. Three were made:

### 6.1 Saturating debt→incident amplification (well-posedness)

- **Before:** `incident_inflow = base·(1 + alpha_td·TD/TD_ref)·(…)` — linear,
  unbounded in `TD`.
- **After:** `incident_inflow = base·(1 + alpha_td·(TD/TD_ref)/(1 + (TD/TD_ref)/td_sat))·(…)`.
- **Why:** the linear form makes the chilling regime *diverge* (`TD → ∞`),
  because `TD → incidents → U → u_to_debt → TD` is a positive feedback whose gain
  exceeds removal when `f_doc` is low. Divergence both contradicts reality (the
  incident rate has a ceiling) and makes fixed-point analysis impossible. The
  saturating (Michaelis–Menten) form has the same sign and low-debt slope but a
  finite ceiling `1 + alpha_td·td_sat`. New parameter: `td_sat` (default 4).

### 6.2 Natural debt retirement `−delta_TD·TD` (well-posedness)

- **Before:** `dTD/dt = u_to_debt + td_baseline − remediation` (no decay).
- **After:** add `− delta_TD·TD`.
- **Why:** without a removal term proportional to `TD`, the chilling regime has
  no finite `TD` equilibrium (debt ramps linearly forever). A small natural
  retirement rate (refactoring, deprecation, system replacement that happens
  independent of incident learning) yields a finite, high chilling-debt
  equilibrium. New parameter: `delta_TD` (default 0.05).

### 6.3 Fraction-driven culture reinforcement + `a_jc_c` (bistability)

- **Before:** `safety_wins = omega·remediation`,
  `backfire = psi·phi_doc·to_D·(1−privilege)`, and the culture target used
  `just_culture` with an implicit coefficient of 1.
- **After:** `safety_wins = omega·f_doc·translation_layer_efficiency`,
  `backfire = psi·phi_doc·f_doc·(1−privilege)`, and the culture target uses
  `a_jc_c·just_culture` (a tunable weight, symmetric with the spec's existing
  `a_sep` on separation).
- **Why:** the volume-based forms (`remediation`, `to_D`) *collapse* exactly in
  the learning regime, where incident throughput is low — so they cannot sustain
  the R2 reinforcement there, and the model stays monostable. Driving culture by
  the documentation *fraction* `f_doc` (gated by privilege via `backfire`)
  captures "documenting is visibly safe and productive" transparently and yields
  a genuine fold. The implicit `just_culture` coefficient of 1 pinned the culture
  floor too high for a chilling attractor to exist at sensible lever values;
  `a_jc_c` restores the bistable window. New parameter: `a_jc_c` (default 0.38).

These refinements change *quantitative* behavior to achieve well-posedness and
bistability; they preserve the qualitative semantics of every loop in the spec.

---

## 7. Parameter registry

Every parameter (6 levers + 35 structural) is declared once in
[`registry.ts`](../src/engine/registry.ts) with `{ id, label, unit, default,
min, max, group, evidence_basis, source, note }`. `evidence_basis ∈
{empirical-anchor, expert-estimate, illustrative-assumption}`. No coefficient is
tagged `empirical-anchor` (the honesty rule of spec §2.5); the directional
notes for `alpha_td`/`sigma` cite Sculley et al. (2015) but their magnitudes are
illustrative. The Assumptions & Methods panel renders directly from this
registry.

---

## 8. Integration

- Default solver **RK4** with adjustable `dt` (default 0.5); explicit **Euler**
  available for comparison (spec §2.6, §3.1).
- `horizon` is interpreted as **months of simulated time** (default 120); the
  number of integration steps is `round(horizon/dt)`.
- Integration-error check (test suite): halving `dt` changes the RK4 trajectory
  by less than the previous halving — high-order convergence.
- The deterministic core is pure and side-effect-free: identical inputs produce
  bitwise-identical trajectories (verified in `simulate.test.ts`).

---

## Change log

| Date | Version | Change |
|---|---|---|
| 2026-06-21 | 0.1.0 | Initial model. Three documented refinements vs BUILD_SPEC: (6.1) saturating debt→incident amplification + `td_sat`; (6.2) natural debt retirement `delta_TD`; (6.3) fraction-driven `safety_wins`/`backfire` + `a_jc_c` weight. Calibrated to a demonstrably bistable system: cyber→chilling (f_doc≈0.04), aviation/healthcare→learning, EU-trap→chilling+high-exposure, contested→bistable with saddle-node fold and hysteresis along `just_culture`. |
