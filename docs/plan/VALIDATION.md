# VALIDATION — Battery, Pass Criteria, and CI Wiring

Every item below is an **executable test**, not a review checklist. The v0.2 suite has ~271 tests of which
roughly 45 carry real epistemic weight and ~45 are circular (`AUDIT.md` §6.3). The point of this battery is
that **the tests that guard the headline claims must be the non-circular ones.**

Structure follows the standard system-dynamics validation set (Forrester & Senge; Sterman ch. 21), plus
four tests specific to this model's failure modes.

---

## V1 · Structure verification

**Asks:** does each equation correspond to something real, with the right sign?

| Test | Pass criterion |
|---|---|
| V1.1 Sign audit | Every parameter has a declared expected sign; a finite-difference probe confirms `∂output/∂param` matches. Any mismatch fails. |
| V1.2 Loop inventory | Each documented feedback loop is verified to **exist in the Jacobian**: for loop `X→Y→…→X`, the corresponding partials are all non-zero at a reference state. |
| V1.3 **R1 closure** | `∂(dC/dt)/∂E_pl ≠ 0` **and** `∂(dC/dt)/∂TD ≠ 0`. |

> **V1.3 is the direct regression test for `AUDIT.md` F1.** In v0.2 the culture row of the Jacobian is
> `[0,0,0,0,0,∂C]` while the docs advertise a debt→harm→exposure→culture loop. This test fails on v0.2 by
> construction and must pass on v0.3. **If it ever fails again, the model has silently reverted to a
> cascade and every loop-dominance claim in the UI is false.**

---

## V2 · Parameter verification

| Test | Pass criterion |
|---|---|
| V2.1 Registry completeness | Every numeric literal in `src/engine/**` (outside test files and a small allow-list of `0`, `1`, `2`, `0.5`) resolves to a registry entry. **Zero unregistered constants.** |
| V2.2 Tier assigned | Every parameter has exactly one tier ∈ {T1, T2, T3, T4}. |
| V2.3 Free params justified | Every **T4** carries a non-empty `whatWouldConstrainIt` field. |
| V2.4 Bounds sane | `min < default < max`; `sanitizeParams` clamps and rejects non-finite. |
| V2.5 Citation verification status | Every statutory/case citation carries `verified: true | false | 'pin-cite-pending'`. Unverified citations render with a visible flag. |

V2.1 is the enforcement mechanism for `AUDIT.md` F8 (~34 invisible coefficients driving the headline
institutional readouts).

---

## V3 · Dimensional consistency

**v0.2 has no dimensional test at all.** This is new.

| Test | Pass criterion |
|---|---|
| V3.1 Stock units declared | Every stock has a unit string from a closed enum. |
| V3.2 Flow-term units | Each additive term in each `d·/dt` is annotated with its unit expression; a symbolic check confirms all terms in one equation share a unit, and that it equals `[stock]·month⁻¹`. |
| V3.3 No implicit conversion | Any term crossing unit spaces must reference a declared conversion parameter (`c_inc_debt`, `c_harm_exp`, `c_rec_exp`). |
| V3.4 Level-vs-rate | Any quantity integrated over time must be declared a rate. Fails v0.2's `harm_events`, which is a level, used as a flow, *and* trapezoid-integrated. |

Implementation: a lightweight unit-expression checker over a declaration table — not a full CAS. Terms
are annotated once, in the registry, and the checker verifies consistency. Cheap, and it makes
`AUDIT.md` §4 unrepeatable.

---

## V4 · Extreme-condition tests

**Sterman's sense — extremes of *stocks* and physical impossibility — not corners of the lever box.**
v0.2's two "extreme-condition" tests are lever corners; they do not test the equations' physical integrity.

| Test | Pass criterion |
|---|---|
| V4.1 Empty stocks | `U = 0 ⇒` no outflow from `U`. `D/R3 = 0 ⇒ remediation = 0`. `H = 0 ⇒ detect_rate = 0`. |
| V4.2 **Non-negativity is structural** | For each non-negative stock `X`: `dX/dt ≥ 0` whenever `X = 0`, at 10⁴ random parameter draws. **No clamp may be required.** |
| V4.3 Saturation | `L = 100 ⇒ harm = 0`; `K = 1 ⇒ dK/dt ≤ 0`. |
| V4.4 No absorbing culture | From `C = 0` with `target > 0`, `C` must escape; likewise from `C = 1` with `target < 1`. |
| V4.5 Extreme parameters | At every corner of the registry box, no non-finite values and no poles. |
| V4.6 Zero-hazard | `base_hazard = 0 ⇒` all stocks decay monotonically to rest. |

**V4.2 is the acceptance test for the `dTD/dt` reformulation** (`AUDIT.md` F2) and **V4.4 for the culture
kernel** (F9). Both fail v0.2.

---

## V5 · Integration & numerical integrity

| Test | Pass criterion |
|---|---|
| V5.1 Observed order | `log₂(d₁/d₂) ≥ 3.8` for RK4 on a smooth preset (v0.2 achieves ≈ 1.07 on clamped presets and its test asserts only "any decrease"). |
| V5.2 Solver agreement | RK45 vs RK4 at tight tolerance agree to 1e-6 relative. |
| V5.3 Clamp budget | **Zero** min/max clamp events on all shipped presets over the default horizon. Any clamp sets a `saturated` flag surfaced in the UI. |
| V5.4 No silent truncation | If `stepCount` hits `MAX_STEPS`, the run errors rather than silently simulating a shorter span. |
| V5.5 Determinism | Same inputs → bit-identical trajectory. |
| V5.6 Event handling | Constraint crossings restart the integrator; energy of the discontinuity is logged. |

---

## V6 · Behaviour reproduction & discrimination

| Test | Pass criterion |
|---|---|
| V6.1 Qualitative modes | The model can produce chilling, learning, and genuinely contested trajectories under *independently motivated* parameters. |
| V6.2 **Interior resolution** | The shipped institutional presets must be **pairwise distinguishable**: for every pair, at least one headline output differs by > 5% of its range. |
| V6.3 Prior-predictive coverage | Under `CALIBRATION.md` priors, non-trivial mass below `f_doc = 0.15` in low-protection regimes. |

> **V6.2 is the acceptance test for `AUDIT.md` F4**, where aviation, healthcare, pharma, SR 11-7 and
> nuclear all produce bit-identical `C = 1.0000, f_doc = 1.0000`. A comparative-institutional model that
> cannot distinguish five institutions is not doing its job, and no amount of added structure fixes it if
> the outputs saturate.

---

## V7 · Identifiability

| Test | Pass criterion |
|---|---|
| V7.1 Structural rank | Rank of the output-sensitivity matrix `S = ∂y/∂θ` over a reference trajectory equals the number of parameters claimed independent. Rank deficiency is **reported, not hidden** — the deficient directions are named. |
| V7.2 **No single-scalar collapse** | No two levers may have `|corr| > 0.999` in their response curves at any shipped preset. |
| V7.3 Equifinality set | For each headline conclusion, search for a distinct parameter vector producing indistinguishable output. Report the set. |
| V7.4 Condition number | `cond(SᵀS)` reported per analysis; above 10⁸, results are labelled practically non-identifiable. |

V7.2 is the direct regression test for `AUDIT.md` §5.2 (r = 0.99999 between `workflow_protection` and
`safe_harbor_non_admission`). **The three-channel disaggregation exists to make this test passable**; if
it fails, `MODEL_v3_SPEC` §3.2 has not achieved its purpose and the levers should be merged rather than
pretended distinct.

---

## V8 · Analytic cross-checks

| Test | Pass criterion |
|---|---|
| V8.1 Fast-culture fold | In the limit where exposure/harm coupling → 0, the numerically located fold matches the closed-form criterion `gain·a_c·κ/4 = 1` to 1e-6. |
| V8.2 Equilibrium residual | Every equilibrium returned by `findAllEquilibria` satisfies `‖f(x*)‖ < 1e-8`, **checked by the caller**, and non-converged points are never classified. |
| V8.3 Completeness | Boundary fixed points are enumerated whether attracting or repelling. |
| V8.4 Fold localisation | Continuation locates the fold to 1e-6 in the bifurcation parameter (v0.2's resolution is 1/60, and the published "jc ≈ 0.25" is a grid artifact). |

---

## V9 · Functional-form sensitivity

**Absent entirely from v0.2**, where at least four form choices are individually sufficient to change the
qualitative conclusion.

| Test | Pass criterion |
|---|---|
| V9.1 Steepness sweep | Re-run headline conclusions across `gain ∈ [3,20]`, `g_valve ∈ [5,100]`, `g_trip ∈ [3,30]`. Conclusions that flip are **reported as steepness-dependent**. |
| V9.2 Kernel substitution | Swap logistic ↔ tanh ↔ piecewise-linear in `f_doc`; swap exponential ↔ Hill in `amp(TD)`. Report which conclusions survive all variants. |
| V9.3 Aggregation form | Replace linear blends with multiplicative (Cobb–Douglas) aggregation. Perfect substitutability is v0.2's strongest untested assumption; report what depends on it. |

V9 does not have a pass/fail in the usual sense — **its output is a table of which conclusions are
form-robust.** That table is a required section of any write-up.

---

## V10 · Surprise behaviour

| Test | Pass criterion |
|---|---|
| V10.1 Non-monotonicity census | Scan all (lever × output × preset) cells; record monotone / flat / non-monotone. **Non-monotone cells are surfaced as findings, not smoothed away.** |
| V10.2 Dead-lever alarm | Any lever with identically zero effect on all headline outputs at a shipped preset **fails CI**. |

> v0.2 has **three dead levers and 37 flat cells of 180** (`AUDIT.md` §9). V10.2 makes that condition
> impossible to ship silently. A lever that does nothing is either mis-wired or should be removed.

---

## V11 · Circularity test

**The most important new test, and the one that enforces the boundary-mapping stance.**

| Test | Pass criterion |
|---|---|
| V11.1 No tuning-to-outcome | No parameter's registry note may assert it was set to produce a qualitative behaviour. Lint on the note text (`/calibrated for|tuned (so|to)|chosen so that/i`) **fails CI**. |
| V11.2 Preset ≠ evidence | Any test asserting a preset produces its own `expectedRegime` must be tagged `@regression`, excluded from the "validation" count, and rendered in docs as a regression guard. |
| V11.3 Label coherence | `expectedRegime` must match the simulated regime, or the field must be renamed to something that is not a `Regime`. |
| V11.4 **Falsifiability** | At least one shipped test asserts a condition under which **suppression dominates**, and it must pass. |
| V11.5 Positive controls | Every "no dominant path"-style detector ships with a fixture where it returns **true**. |

**V11.4 is the load-bearing test for the whole project's stance.** If the model cannot produce a
suppression-dominant region under plausible parameters, then either (a) the structure has the conclusion
baked in — the v0.2 defect — or (b) that is a genuine finding requiring an explicit argument for why no
such region exists. **Either way it must be confronted, not left untested.** V11.3 fails v0.2 today, where
`eu-trap` and `neutral` declare `contested` and simulate `chilling`, and the UI shows both labels at once.

---

## V12 · Provenance integrity

| Test | Pass criterion |
|---|---|
| V12.1 Tier census | Counts per tier match a checked-in expected census. Promoting a parameter to T1/T2 fails CI until the census file is updated in the same commit. |
| V12.2 T1 requires citation | Any T1 must carry a resolvable citation **and** a data location. Expected T1 count is currently **0**. |
| V12.3 Rationale authenticity | Template-generated rationales may not claim `source-backed`. |
| V12.4 UI surfacing | Every parameter rendered anywhere shows its tier. |
| V12.5 Version contract | A CI hash over the registry + equation sources must change iff `MODEL_VERSION` changes. |

V12.1 replaces v0.2's **vacuous** honesty test (whose loop body never executes). V12.5 closes
`AUDIT.md` F18, where trajectory-changing commits both stamped `0.2.0`.

---

## V13 · Boundary adequacy

| Test | Pass criterion |
|---|---|
| V13.1 Documented exclusions | `MODEL_v3_SPEC` §10 and `OPEN_QUESTIONS.md` enumerate what is outside the boundary. A doc test asserts the list is non-empty and cross-referenced. |
| V13.2 Sensitivity to boundary | For each major exclusion, a written argument for why including it would not reverse the headline conclusion — or an admission that it might. |

---

## CI wiring

Extend `.github/workflows/ci.yml`. Current gates: typecheck → lint → coverage → validate-scenarios → build.

| Stage | Tests | Runtime | Trigger |
|---|---|---|---|
| **fast** (existing job) | V1, V2, V3, V4, V5.3–5.5, V10.2, V11.1–11.3, V12 | < 60 s | every push |
| **numeric** | V5.1–5.2, V5.6, V6, V8, V11.4–11.5 | ~5 min | every push |
| **heavy** (new job) | V7, V9, V10.1 | ~30 min | PRs to `main` + nightly |
| **report** | Regenerates the form-robustness table (V9) and the tier census (V12.1) as build artifacts | ~10 min | nightly |

**Coverage gates are re-pointed.** v0.2 gates only `src/engine/**` at 90%, leaving `src/lib/institutional.ts`
(the recommendation engine users act on) and `src/lib/export.ts` (the published output) ungated. v0.3:

```
thresholds: {
  perFile: true,                                  // v0.2 uses aggregate; sensitivity.ts (75%) passes by subsidy
  'src/engine/**/*.ts':  { statements: 90, branches: 85, functions: 90, lines: 90 },
  'src/lib/**/*.ts':     { statements: 85, branches: 80, functions: 85, lines: 85 },
  'src/workers/**/*.ts': { statements: 80, branches: 75, functions: 80, lines: 80 },
}
```

`perFile: true` is the important change: it stops 100%-covered tabletop files subsidising the two files
whose defaults are most defective.

**Removed:** the `validate:scenarios` step, which shells a fresh `vitest` to re-run three test files the
coverage step already ran. It is redundant, not an independent validator.

---

## Acceptance criteria for v0.3 release

A release is blocked unless:

1. V1.3 passes — **the culture loop is closed** (F1).
2. V4.2 passes — **non-negativity is structural, not clamped** (F2).
3. V6.2 passes — **presets are pairwise distinguishable** (F4).
4. V7.2 passes — **no two levers are collinear at r > 0.999** (F6).
5. V11.4 passes — **a suppression-dominant region exists and is tested** (boundary-mapping stance).
6. V12.1 passes — **tier census matches**, with T1 = 0 unless something genuinely became measured.
7. V2.1 passes — **zero unregistered constants** (F8).

These seven are the audit's seven worst findings, converted into gates. If any cannot be met, the correct
response is to **cut the affected capability**, not to relax the gate.
