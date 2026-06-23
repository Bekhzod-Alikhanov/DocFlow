# MODEL.md - DocFlow system-dynamics model

> **Source of truth for the math.** This file tracks the implementation in
> [`src/engine`](../src/engine). DocFlow is a structural model for
> decision-support and structured reasoning, not a calibrated forecast. All
> coefficients are illustrative assumptions unless separately validated.

Model version: **0.2.0** (see [`src/engine/version.ts`](../src/engine/version.ts)).

## 1. Stocks

| Symbol | Meaning | Unit | Bounds | Default init |
|---|---|---|---|---|
| `U` | Undocumented incidents | incidents | >= 0 | 20 |
| `D` | Documented and analyzed incidents | incidents | >= 0 | 5 |
| `TD` | Latent technical debt | debt index | >= 0 | 10 |
| `L` | Organizational learning / safety capability | 0-100 | [0,100] | 30 |
| `E` | Litigation + regulatory exposure | exposure index | >= 0 | 10 |
| `C` | Documentation culture / psychological safety | 0-1 | [0,1] | 0.4 |

`E` is an observable: it accumulates discovery and regulatory pressure, but it
does not feed back into other stocks. The chilling feedback enters through
`backfire`, which affects culture.

## 2. Levers

DocFlow v0.2 keeps the six-stock core and adds institutional design levers:

| Lever | Institutional meaning |
|---|---|
| `privilege_strength` | Strength of legal protection for analysis |
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
perceived_discoverability =
      w_m * mandatory_reporting + w_p * pld_penalty
    - w_priv * privilege_strength
    - w_sep * recipient_enforcer_separation
    - w_tl * translation_layer
    - w_workflow * workflow_protection
    - w_records * original_records_boundary
    - w_safe * safe_harbor_non_admission

drive_to_document =
      a_c * C + a_jc * just_culture + a_m * mandatory_reporting
    - a_disc * relu(perceived_discoverability)

f_doc = sigmoid(gain * (drive_to_document - threshold))
```

Mandatory reporting can raise the direct drive to document, but if it arrives
with PLD pressure and no protective scaffold, positive perceived discoverability
can still suppress documentation.

## 4. Flows

```
capability_factor = max(0, 1 - beta_L * L/100)
debt_ratio = TD / TD_ref
debt_amplification = 1 + alpha_td * (debt_ratio / (1 + debt_ratio / td_sat))
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

remediation =
    rho * D * (L/100) * (1 + challenge_remediation_boost * effective_challenge)

d_closeout = kappa_D * D
belated_doc = mu * U * f_doc
u_to_debt = sigma * U
harm_events = gamma * TD * max(0, 1 - L/100)
```

## 5. Culture and Exposure

```
safety_wins = omega * f_doc * translation_layer_efficiency

protection_bundle = clamp01(
    0.36 * privilege_strength
  + 0.22 * workflow_protection
  + 0.18 * safe_harbor_non_admission
  + 0.14 * original_records_boundary
  + 0.10 * recipient_enforcer_separation
)

backfire = psi * phi_doc * f_doc * (1 - protection_bundle)
```

Stock equations:

```
dU/dt  = to_U - belated_doc - u_to_debt
dD/dt  = to_D + belated_doc - d_closeout
dTD/dt = u_to_debt + td_baseline - remediation - delta_TD * TD
dL/dt  = learning_gain - delta_L * L
dE/dt  = phi_doc * to_D * (1 - privilege_strength)
       + phi_harm * harm_events
       + phi_pld * pld_penalty * to_U
       - theta_E * E
dC/dt  = lambda_C * (a_jc_c * just_culture
       + a_sep * recipient_enforcer_separation
       + safety_wins - backfire - C) * C * (1 - C)
```

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

These readouts are not legal conclusions. They are structured comparisons among
institutional design packages.

## 7. Feedback Loops

- **R1 chilling:** weak protection -> high perceived discoverability/backfire ->
  low culture -> low documentation -> lower learning and higher debt -> more
  incidents and exposure.
- **R2 learning:** protected workflow + just culture + separation + translation
  layer + intermediary capacity -> reports become safe and useful -> learning
  and remediation improve -> culture rises.

The slow culture stock `C` with logistic dynamics, coupled to sigmoidal
`f_doc(C)`, creates the model's path dependence and tipping behavior.

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
