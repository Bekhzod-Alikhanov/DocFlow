# RISKS — What Could Make v0.3 Worse Than v0.2

Ordered by expected harm. The first risk is the one that should govern every scope decision.

---

## R1 · Over-engineering a model whose empirical base cannot support the added structure

**Severity: critical. Probability without mitigation: high.**

v0.3 roughly doubles the state space (6 → 12 stocks) and adds endogenous privilege, a jump layer, and a
multi-firm game — while **zero parameters are empirically measured** and the expected T1 census remains
**0** (`CALIBRATION.md` §4).

The failure mode is not that the model breaks. It is that it becomes **more persuasive and no more
correct**. Added structure:

- **reduces identifiability** — more parameters over the same (absent) data means larger equifinality sets;
- **increases researcher degrees of freedom** — more knobs to reach a desired conclusion;
- **buys unearned authority** — a 12-stock model with jump processes and Sobol indices *looks* like
  science to a policy reader in a way a 6-stock model does not.

v0.2 already demonstrates the pathology at smaller scale: ~34 invisible coefficients driving the six
numbers a policy audience quotes (`AUDIT.md` F8).

**Mitigations (all binding):**
1. Rule 1 in `MODEL_v3_SPEC` — no stock without a reportable qualitative consequence, justified in the spec table.
2. Parameter budget ≤ 125 registered, **zero** unregistered (V2.1).
3. Tier census in CI with expected T1 = 0 (V12.1), so added structure cannot quietly acquire false pedigree.
4. **Cut list** in the roadmap, and a standing instruction: if a milestone cannot meet its acceptance
   criteria, cut the capability rather than relax the gate.
5. Equifinality reported as a first-class result (V7.3), so the cost of added parameters is visible.

**Residual risk after mitigation: moderate.** The mitigations make the cost visible; they do not eliminate
it. If the identifiability tests show v0.3 is *less* identifiable than v0.2 on shared outputs, **the
correct response is to cut stocks** — and that decision should be made explicitly at the M3 gate rather
than discovered at the end.

---

## R2 · The dominance boundary is an artifact of three free parameters

**Severity: critical. Probability: certain — it is structurally true.**

The headline output — where the three-channel architecture beats opacity — is a function of
⟦`v_pl`, `v_reg`, `v_fid`⟧, the relative weights on the three exposure channels. **Nobody has measured
them.** By choosing them, one chooses the answer.

This is not a defect to fix; it is a property to disclose. The risk is that it gets **lost in
presentation** — someone quotes "the model shows the architecture reduces exposure" without the
antecedent.

**Mitigations:** never report a point result (`EPISTEMICS.md` §6.1); always report the boundary in the
`v_reg/v_pl` × `v_fid/v_pl` plane rather than a verdict; V11.4 requires a passing test in the
suppression-dominant region so the other side is always visible; `OPEN_QUESTIONS.md` Q3 asks explicitly
what evidence could bound the ratio.

**Residual: high, and irreducible without data.** This should be stated in the abstract of anything
published from the model.

---

## R3 · The commons result proves only what its payoffs assume

**Severity: high.** The multi-firm module (`ADR/0009`) is the only support anywhere for the paper's
legislative recommendation — which is exactly why it is dangerous. A simulated N-firm game with invented
payoff coefficients can be made to produce undersupply trivially, and it would look like evidence.

**Mitigation:** the minimal-analytic route. Undersupply must be **derived** from the structure of a
standard public-goods game (positive externality, private cost, no exclusion), with simulation used only
for comparative statics. Then the result is "given this payoff structure, undersupply follows" — a
theorem — rather than "we picked numbers and observed undersupply." The payoff structure's *applicability*
remains an assumption, and must be labelled as one.

**If the analytic result cannot be derived cleanly, drop the module.** A dropped module is better than a
fabricated proof of the paper's central policy ask.

---

## R4 · Fixing the feedback loop changes the model's behaviour beyond recognition

**Severity: high. Probability: high.**

`AUDIT.md` F1 shows v0.2's culture equation is autonomous. Closing the loop (`MODEL_v3_SPEC` §4.6) makes
`dC/dt` depend on `E_pl` and `harm`. That is correct — but it means:

- the closed-form fold criterion no longer holds globally (retained only as a fast-culture benchmark);
- bistability may **disappear**, or appear in different regions;
- every preset's behaviour changes; all v0.2 regression tests become meaningless;
- saved scenarios are not comparable across versions.

**This is a feature disguised as a risk**: if bistability was an artifact of the decoupling plus six tuned
coefficients, then losing it is *information*. But it must be planned for, because "the new model doesn't
reproduce the old results" will otherwise read as a regression.

**Mitigation:** M2's acceptance criterion is explicitly *not* "bistability is preserved." It is "the
bistable region, if any, is located and reported, along with the region where it is absent." A finding of
no bistability under independently-motivated parameters is a **publishable negative result** and must be
pre-committed as acceptable before the work starts, or there will be pressure to re-tune.

---

## R5 · Re-tuning under pressure

**Severity: high.** Related to R4 but distinct: the social risk that when v0.3 fails to reproduce a
result the paper asserts, someone adjusts a coefficient.

v0.2 shows how this happens by increments and in good faith — six parameters carry registry notes saying
they were "Calibrated for bistability," and `METHODS.md` then calls bistability "Demonstrated."

**Mitigation:** V11.1 lints registry notes for tuning language and **fails CI**. It is crude, and it is
crude on purpose: it makes the act of tuning-to-outcome require deleting a test, which is visible in a
diff and requires a reviewer's signature.

---

## R6 · The privilege model implies false precision about legal outcomes

**Severity: high (reputational).** A logistic returning "privilege survival probability = 0.62" invites
being read as legal advice. It is not: the coefficients are uncalibrated (per the session decision), the
case base is cybersecurity rather than AI, and ⟦`p_court`⟧ is unknowable because no court has ruled on
the device.

**Mitigation:** `π` is never displayed as a bare number — always as a range over ⟦`p_court`⟧ and the
coefficient intervals; the UI carries a not-legal-advice line adjacent to it (v0.2's tabletop debrief
already does this); and `EPISTEMICS.md` §3.4 states the prohibition. If the coding protocol
(`CALIBRATION.md` §3) is never executed, the parameters stay T4 and the display stays a range.

---

## R7 · Analysis cost exceeds the value of the answers

**Severity: moderate.** Continuation, identifiability SVD, Morris-then-Sobol over ~125 parameters, PRIM
scenario discovery, jump-process ensembles, and an N-firm sweep are a large compute and engineering bill —
against a model with no data.

**Mitigation:** Morris screening before Sobol (`ADR/0008`); analytic results before numerical ones
(`ADR/0005`); the heavy tier runs nightly, not per-push; the commons stays analytic-first. If the budget
binds, cut in this order: N-firm simulation → codimension-two → jump-process ensemble size → Sobol N.

---

## R8 · The Python split fragments the source of truth

**Severity: moderate.** `ADR/0010` keeps TypeScript canonical and adds Python for analysis. The risk is
drift — an analysis-side reimplementation of a flow equation that diverges from the engine.

**Mitigation:** Python **never reimplements the model**. It consumes exported run artifacts and parameter
sets only. A CI test asserts the Python layer contains no model equations (grep for stock symbols in
arithmetic context). If a Python analysis needs a new engine output, the engine exports it; the analysis
does not compute it.

---

## R9 · Scope collapse — nine documents, one implementation, no time

**Severity: moderate.** The plan is large. The realistic failure is that M1–M2 land, the epistemics
machinery does not, and v0.3 ships with new structure and v0.2's provenance discipline — the worst
combination, because it is v0.2's over-claiming at twice the scale.

**Mitigation:** the milestone ordering in `ROADMAP.md` puts the **provenance and validation machinery in
M1**, before any new structure. If the project stops after M1, the result is v0.2 with honest
provenance — a strict improvement. If it stops after M2 without M1, it is worse than v0.2.

**This ordering is the single most important risk control in the plan.**

---

## R10 · The instrument outlives its caveats

**Severity: moderate, long-horizon.** Screenshots circulate; exports get pasted into decks; a chart
labelled "scenario projection" becomes "the model predicts." v0.2 already ships a no-forecast line on
every export precisely because of this.

**Mitigation:** retain and extend — tier badges on every rendered number (V12.4), ranges instead of points,
the no-forecast line on exports, and the boundary shown next to every success region. Accept that this is
mitigation, not prevention.

---

## Risks explicitly accepted

| Accepted | Why |
|---|---|
| v0.3 may contradict the published paper | The session decision makes v0.3 an **independent instrument**. Contradiction is an output, not a failure. |
| No parameter will be measured (T1 = 0) | True of the domain, not of the effort. Disclosed rather than disguised. |
| Small-N privilege coding cannot support a full logistic | Stated in `CALIBRATION.md` §3.4; Firth + bootstrap intervals, or nothing. |
| The model cannot say which side of the boundary reality is on | R2. Irreducible. Stated in the abstract of any write-up. |
