# ROADMAP — Milestones, Acceptance Criteria, Dependencies, Effort

**Ordering principle (see `RISKS.md` R9):** the provenance and validation machinery lands **before** any
new model structure. If the project stops after M1, the result is v0.2 with honest provenance — a strict
improvement. If it stops after new structure without M1, the result is *worse* than v0.2: the same
over-claiming at twice the scale.

Effort is in **engineer-days** for one experienced developer already fluent in this codebase. Legal and
domain work is called out separately because it cannot be supplied by the implementer.

---

## Dependency graph

```
M0 ──► M1 ──► M2 ──► M3 ──► M4 ──► M6 ──► M8
             │      │      └────► M5 ─────┘
             │      └───────────► M7 (independent after M3)
             └──► (M1 alone is a shippable improvement)
```

---

## M0 · Freeze and baseline — **3 d**

Pin what v0.2 does before changing it, so every later claim of improvement is measurable.

- Tag `v0.2.0-audit-baseline`; bump `MODEL_VERSION` to `0.2.1` and add the missing change-log entries
  (closes `AUDIT.md` F18's immediate instance).
- Land the audit diagnostics from `AUDIT.md` §11 as a **permanent** `diagnostics/` suite (not throwaway):
  monotonicity census, Richardson order, stiffness, collinearity, aggregation probe.
- Record baseline numbers as a checked-in JSON fixture.
- Fix the two label contradictions (`eu-trap`, `neutral` `expectedRegime`) — either correct the field or
  rename it. Currently the UI shows "Contested" and "Chilling" for the same scenario.

**Acceptance:** diagnostics run in CI; baseline fixture committed; no UI shows two contradictory regime
labels.

---

## M1 · Provenance and validation machinery — **12 d** ⟵ *highest priority*

No model changes. Build the epistemic infrastructure v0.3 depends on.

- Registry schema v2: `tier ∈ {T1,T2,T3,T4}`, `whatWouldConstrainIt` (required for T4), citation
  `verified` status, unit expression per parameter.
- **Migrate all ~34 unregistered constants into the registry** (`AUDIT.md` F8) — `protectionBundle`,
  `policy_scaffold_dependency`, `private_ordering_gap`, `accountability_legitimacy`,
  `safe_to_report_score`, `litigation_pressure`, `near_miss_signal`, plus the tabletop coefficients.
- V2 (registry), V3 (dimensional), V12 (provenance) test suites.
- Repoint coverage: `perFile: true`, add `src/lib` and `src/workers` thresholds; delete the redundant
  `validate:scenarios` step.
- V11.1 tuning-language lint; V11.3 label coherence.
- UI: tier badge on every rendered number; Assumptions panel renders the *complete* set.

**Acceptance:** V2.1 passes (**zero unregistered constants**); V3 passes or every dimensional violation is
explicitly waived with a written justification; V12.1 tier census committed with **T1 = 0**; coverage gates
green under `perFile`.

**Dependencies:** M0. **Blocks:** everything.

> This milestone alone resolves `AUDIT.md` F3, F8, F16, F18 and makes the model honest about what it is.
> It is the highest value-per-day in the plan.

---

## M2 · Core structural repair — **15 d**

Fix the equations before adding any.

- **Close the culture loop** (`MODEL_v3_SPEC` §4.6): add `psi_E`, `psi_H` terms → V1.3 passes.
- **Reformulate `dTD/dt`** so `TD = 0` is invariant → V4.2 passes, clamp events go to zero.
- **Replace the culture kernel** (`eps_C` blend) → V4.4 passes, no absorbing states.
- **`relu` → `softplus`** → C¹ RHS; RK4 order restored.
- **Michaelis–Menten → bounded exponential** in `amp(TD)` → pole removed.
- Adaptive RK45 with event handling; `saturated` flag distinct from `diverged`.
- Equilibrium callers **must** read `converged`; `classifyStability` tolerance scales with `‖J‖`.

**Acceptance:** V1.3, V4.2, V4.4, V5.1 (observed order ≥ 3.8), V5.3 (zero clamps) all pass. **Bistability
is explicitly *not* an acceptance criterion** — see `RISKS.md` R4. Whatever the corrected model does is the
finding.

**Dependencies:** M1. **Effort note:** budget 3 of the 15 days for re-establishing preset behaviour, which
will change.

---

## M3 · Three channels, exposure decomposition, endogenous privilege — **20 d**

The structural fidelity work.

- `R1`/`R2`/`R3` stocks; `E` → `E_pl`/`E_reg`/`E_fid`; `pd` disaggregated into `pd_fact`/`pd_anal`/`pd_rem`.
- Endogenous `π` from the four doctrinal factors; `privilege_strength` **removed as a lever**.
- Valve cliff: waiver term + independent-admission term.
- ⟦`p_court`⟧ introduced as a swept parameter.
- Retire `D`; migrate presets; write the v0.2→v0.3 scenario migration.

**Acceptance:** V6.2 passes (**presets pairwise distinguishable** — the F4 gate); V7.2 passes (**no two
levers at r > 0.999** — the F6 gate); V7.1 rank deficiency reported with directions named.

> **Decision gate.** If V7.1 shows v0.3 is *less* identifiable than v0.2 on shared outputs, **cut stocks
> here** (`RISKS.md` R1). This gate exists to be used, not admired.

**Dependencies:** M2.

---

## M4 · Detection stage and capability stock — **10 d**

- `H`, `A`, `N`, `K` stocks; `p_look` split from `f_doc`; `capture_factor` from the §3.1.2 taxonomy.
- Unify the static `tabletop/capturability.ts` into the continuous core.
- Second-order suppression cost via `dK/dt`.

**Acceptance:** V4.1, V4.3 pass; suppression demonstrably degrades future detection (a named test); the
tabletop reads `K` from the engine rather than recomputing it.

**Dependencies:** M3.

---

## M5 · Analysis upgrade — **18 d**

- Analytic: fast-culture fold criterion as a theorem + V8.1 cross-check.
- Pseudo-arclength continuation with fold test function (replaces grid count-change).
- Identifiability: sensitivity-matrix SVD, condition number, equifinality search (V7).
- Morris screening → Sobol on survivors, **with bootstrap CIs** (`ADR/0008`).
- Scenario discovery: PRIM/CART over the failure region.
- Monte Carlo: scenario-anchored sampling replacing the hypercube default (F10); simultaneous bands or an
  explicit label that bands are pointwise.
- Jump layer: Poisson events for disclosure orders, PLD Art. 9(1) presumption, preservation triggers;
  report distributions and variance, never means alone.
- Python analysis layer (`ADR/0010`) for continuation, SVD, PRIM.

**Acceptance:** V7, V8, V9 pass; every Sobol bar ships with a CI; the fold is located to 1e-6; the
form-robustness table (V9) is generated as a build artifact.

**Dependencies:** M3 (M4 helpful, not blocking).

---

## M6 · Red-team module and boundary mapping — **10 d**

- The four attacks in `MODEL_v3_SPEC` §7.
- `ΔJ` dominance comparison; boundary rendered in the `v_reg/v_pl` × `v_fid/v_pl` plane.
- **V11.4**: a passing test asserting a suppression-dominant region exists.

**Acceptance:** the failure boundary is a first-class, exportable result; V11.4 passes; V11.5 positive
controls ship.

**Dependencies:** M5. **This is the milestone that delivers the session's boundary-mapping stance.**

---

## M7 · Multi-firm commons — **12 d**, *conditional*

- Analytic public-goods formulation; derive under-supply in Nash vs social optimum.
- N-firm simulation **only** for comparative statics.

**Acceptance:** the undersupply result is **derived**, not simulated. **If it cannot be derived cleanly,
this milestone is cut** (`RISKS.md` R3) — a dropped module beats a fabricated proof of the paper's central
policy ask.

**Dependencies:** M3. Independent of M4–M6.

---

## M8 · Tabletop doctrinal nodes, UI, docs — **12 d**

- Extend the existing tabletop with the five doctrinal decision points (tripwire crossing, admission to
  the protected channel, Kovel evaluator entry, preservation attachment, ticket language).
- Reuse `resolver.ts`, `applyChoice.ts`, `schema.ts` — this is an extension, not a rebuild.
- Fix `goodVector` (`AUDIT.md` §6.3): remove the flat `+0.30` flag term that makes non-domination
  structurally guaranteed.
- Views for exposure decomposition, privilege factors, boundary map.
- Rewrite `MODEL.md`, `METHODS.md`, `ARCHITECTURE.md`; fix the documented doc-drift.

**Acceptance:** V11.5 passes for the tabletop detector; docs match code (a doc-drift test); no view renders
an untiered number.

**Dependencies:** M6.

---

## Totals

| Track | Days |
|---|---|
| M0 + M1 (honesty floor) | **15** |
| M2 + M3 + M4 (structure) | **45** |
| M5 + M6 (analysis + boundary) | **28** |
| M7 (commons, conditional) | **12** |
| M8 (surface + docs) | **12** |
| **Total** | **~112 engineer-days** (≈ 22 working weeks at 1 FTE) |

**Non-engineering work, not in the above and not suppliable by the implementer:**

| Task | Effort | Who |
|---|---|---|
| Privilege case-law coding, 2 coders + adjudicator | 20–40 h each | Legal co-authors; needs Westlaw/Lexis |
| Prior elicitation for T4 parameters | 8–12 h | Domain experts |
| EU pin-cite verification | 4–6 h | Legal |

---

## Cut order under time pressure

Cut from the bottom. Each cut is safe in the sense that what remains is still coherent and honest.

1. **M7** commons — highest value but also highest fabrication risk; cut first if the analytic result
   resists.
2. **M8** tabletop doctrinal nodes — the existing tabletop already works.
3. **M5** jump layer and PRIM — keep continuation and identifiability, drop the rest.
4. **M4** detection stage — painful (it is the strongest single addition) but severable.

**Never cut M1.** Cutting M1 while keeping M2–M4 produces the worst possible artifact.
