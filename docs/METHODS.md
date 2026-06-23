# METHODS.md — DocFlow numerics, validation, and epistemic limits

## 1. Integration (spec §2.6, §3.1)

- **RK4** (classic 4-stage Runge–Kutta) is the default; **explicit Euler** is
  available for comparison. Step size `dt` is adjustable (default 0.5 month);
  `horizon` is months of simulated time (default 120). Steps = `round(horizon/dt)`.
- The right-hand side is pure and side-effect-free. Stocks are clamped to physical
  bounds each step; any clamp, NaN/∞, or magnitude over `1e7` is recorded as a
  `ClampEvent` and flips a `diverged` flag — **clamping never silently masks
  divergence** (spec §2.1, §4.5).
- **Integration-error check:** halving `dt` changes the RK4 trajectory by less
  than the previous halving (high-order convergence); Euler converges to the same
  answer at small `dt`. Verified in `integrators.test.ts`.

## 2. Equilibria & stability (spec §3.2)

- The culture stock is dynamically decoupled (its rate depends only on `f_doc(C)`),
  so equilibria are the roots of `g(C)` found by sign-change bracketing + bisection;
  the fast subsystem is then equilibrated at each root.
- The full 6-D fixed point is classified by the eigenvalues of the **numerical
  Jacobian** (central differences). Eigenvalues come from a real-matrix solver
  (Hessenberg reduction `elmhes` + the `hqr` QR algorithm, an EISPACK port),
  validated against matrices with known spectra in `linalg.test.ts`.
- Classification: `stable` (all Re < 0), `unstable` (all Re > 0), `saddle`
  (mixed), `marginal` (Re ≈ 0). A general damped-Newton finder is also provided.
- **Demonstrated:** two stable attractors + an unstable separatrix for the
  contested baseline (bistability); monostable presets otherwise.

## 3. Bifurcation, tipping & hysteresis (spec §3.3, §3.4)

- **1-parameter sweep** enumerates equilibria at each lever value and records the
  metric on stable vs unstable branches → the bifurcation diagram and the fold
  (tipping threshold). A clean saddle-node fold appears along `just_culture` near
  jc ≈ 0.25 at the contested background.
- **2-parameter sweep** settles the system from a fixed start across a grid →
  the tipping heatmap.
- **Hysteresis** ramps a lever up then down by numerical continuation (carrying
  the settled state forward); the up/down branches diverge across the bistable
  window. Verified in `bifurcation.test.ts`.

## 4. Monte Carlo uncertainty (spec §3.5)

- Parameters are sampled from **uniform** (default), **triangular** (mode at the
  base value), or **truncated normal** distributions over their registry ranges.
- Seeded mulberry32 RNG ⇒ fully reproducible (same seed + config → identical
  bands). `N` trajectories are run; we report **median + 10/50/90 percentile
  bands** for every stock and key auxiliary, plus the fraction of runs ending in
  each regime and the diverged fraction.

## 5. Global & local sensitivity (spec §3.6)

- **Sobol indices** (first-order `S1` + total `ST`) via Saltelli sampling with
  the Saltelli (2010) / Jansen estimators. **Validated against the Ishigami
  function's analytic indices** (`S1 ≈ [0.31, 0.44, 0]`, `ST3 ≈ 0.24`) in
  `sensitivity.test.ts`.
- **LHS + Partial Rank Correlation Coefficients (PRCC)** for monotone screening.
- **Tornado** (one-at-a-time min/max swings) for a quick local picture.
- Output metrics: final `TD`, final `L`, final `C`, final `f_doc`, cumulative
  exposure, time-to-tip.

## 6. Reproducibility (spec §3.8)

Every run can be reconstructed from a `RunRecord` carrying the model version,
full parameter vector, initial state, solver, `dt`, and seed. The deterministic
core produces bitwise-identical trajectories for identical inputs (verified).

## 7. Validation test suite (Sterman-style, spec §7.1)

- **Dimensional / accounting:** `incident_inflow = to_D + to_U`; rates finite and
  non-negative where required.
- **Extreme conditions:** `privilege=1, just_culture=1` ⇒ learning attractor;
  cyber preset ⇒ chilling attractor near ~5% (an estimate); zero
  privilege/separation ⇒ a chilling attractor exists.
- **Integration error:** halve `dt` convergence.
- **Behavior reproduction:** R1 (chilling) and R2 (learning) are each reachable;
  presets settle into their documented regimes; the contested baseline is
  path-dependent.
- **Institutional v0.2 regressions:** safe harbor lowers litigation/backfire,
  effective challenge raises learning/remediation, near-miss tiers add learning
  without direct exposure, EU trap remains high-pressure without protection,
  pharma safe-to-report improves over mandatory-only, and nuclear dual-channel
  beats public-only/private-only variants.
- **Stability/bifurcation:** two stable attractors + a saddle exist; a fold and
  hysteresis exist along a lever.
- Engine coverage ≥ 90% (statements/lines/functions ≈ 97–99%).

## 8. Epistemic limits (read this first)

- **This is not a forecast.** It is a structural/relational model for
  decision-support and structured reasoning. Outputs are *scenario projections
  under stated assumptions*, not calibrated predictions.
- **Coefficients are illustrative.** No lever→behavior coefficient is empirically
  established; all are `illustrative-assumption`s in the registry. The only
  empirical anchor is a calibration *target* (cyber ≈ 5% documentation), and that
  5%/95% figure is itself an **estimate** (Schwarcz, Wolff & Woods 2023), labeled
  as such wherever shown.
- **No calibration data ships.** The engine exposes a residual/output interface so
  a future user could fit parameters to a target, but nothing is fit here.
- **Known reliability flags (surfaced in-app):** the 95% figure is an estimate;
  the public AI Incident Database holds ~1,400 (media-derived) incidents, not
  5,000+; EU article numbers/effective dates need verification; `E` (exposure) is
  an observable that does not feed back into behavior; three functional-form
  refinements were made for well-posedness/bistability and are documented in
  [`MODEL.md`](./MODEL.md) §6.
