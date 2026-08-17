# EPISTEMICS — What DocFlow v0.3 Can and Cannot Support

**Status of this artifact:** DocFlow v0.3 is an **independent research instrument**. It takes the
playbook *"Architecting Candor: Products Liability and AI Incident Knowledge Governance"* as its
**subject**, not its brief. It is not endorsed by the paper and is free to contradict it. Its standard is
**reproducibility**, not consistency with the playbook's conclusions.

---

## 1. Inherited epistemic frame

The paper states its own limits precisely, and v0.3 adopts the same frame rather than claiming a stronger
one:

> *"The cybersecurity incident-response literature therefore serves as the analysis's empirical proxy,
> and claims about documentation practice inside AI firms are accordingly framed as **consistent with
> analogous evidence rather than as validated against observed practice at AI developers.**"*

and

> *"The authors also conducted certain background interviews under the Chatham House Rule… those
> conversations **are not treated as primary empirical evidence**."*

**v0.3 inherits both limits and adds a third:** the paper is a doctrinal and comparative-institutional
argument; v0.3 is a *formalisation* of that argument's causal structure. **A formalisation cannot be
more empirically grounded than the argument it formalises.** Adding differential equations does not add
evidence. It adds precision about what the argument implies — which is valuable, and is a different thing.

---

## 2. What v0.3 can support

1. **Conditional structural claims.** "Under the stated structure, the three-channel architecture reduces
   total exposure **iff** ⟨explicit condition on `v_reg/v_pl`, `π_eff`, `churn`, `disc_prob`⟩." The
   condition is the deliverable; the model's job is to derive it, not to assert its antecedent holds.
2. **Consistency and inconsistency findings.** Whether a set of qualitative commitments (opposed exposure
   gradients, compounding detection, cliff-like waiver) can hold simultaneously, and what follows if they
   do. **A demonstrated inconsistency is a genuine negative result** and will be reported as such.
3. **Failure boundaries.** The regions where the architecture underperforms opacity (`MODEL_v3_SPEC` §7).
   This is the most defensible output because it does not require knowing where reality sits — only what
   the structure implies at each point.
4. **Sensitivity and identifiability structure.** Which parameters matter, which are indistinguishable
   from any achievable observation, and which conclusions are prior-dependent. These are properties of the
   model, knowable exactly, and independent of empirical grounding.
5. **Analytic results.** Where tractable, closed-form conditions (e.g. the fast-culture fold criterion,
   `AUDIT.md` §1) are theorems about the model — true regardless of calibration.
6. **A reproducible, provenance-tagged object.** Every number's tier is visible; every run is
   version-stamped and re-runnable.

---

## 3. What v0.3 cannot support

Stated flatly, because the gap between these and §2 is where a model like this normally gets misused.

1. **No forecasts.** Not of documentation rates, incident counts, litigation outcomes, or adoption. No
   output is a prediction about any actual firm, and none should be quoted as one.
2. **No claim that suppression is or is not dominant *in reality*.** §6 of the spec computes the sign of
   `ΔJ` as a function of ⟦`v_pl`, `v_reg`, `v_fid`⟧ — three **free parameters nobody has measured**. The
   model locates the boundary; **it cannot say which side of it the world is on.** This is the single most
   important limit in this document, because it is precisely the claim a reader will want to extract.
3. **No validation of the paper's legislative recommendation.** The commons analysis (`ADR/0009`) can show
   that *under a stated payoff structure* cross-firm sharing is undersupplied in Nash equilibrium relative
   to the social optimum. That is a result about the game, not evidence about the AI industry. The payoffs
   are assumed.
4. **No legal advice, and no prediction of judicial behaviour.** ⟦`p_court`⟧ is swept, never estimated,
   because no court has ruled on the central device. Model output must never be read as a probability that
   a given privilege claim will succeed.
5. **No calibrated parameter values.** Expected T1 (measured) census: **zero** (`MODEL_v3_SPEC` §8).
6. **No claim about documentation practice at any named firm.** No firm-level data is used.
7. **No resolution below the structure's own granularity.** One representative firm; no individual
   heterogeneity; roles without payoffs (`ADR/0012`).

---

## 4. Specific inherited weaknesses, carried forward openly

| Weakness | Status in v0.3 |
|---|---|
| The <5% forensic-report figure is **one interviewee's estimate**, not a statistic | Used as a prior-predictive *check*, never a fitting target. Point-matching prohibited (`CALIBRATION.md` §1.1). |
| Cybersecurity is a **proxy domain** | Every use is tier **T2 (analog-estimated)** with the transfer argument written out. Never T1. |
| The three-channel device is **untested in court** | Encoded as ⟦`p_court`⟧, swept across its whole range; results reported as ranges. |
| EU pin-cites **need verification** | Flagged in the registry; a CI check requires a verification status field on every statutory citation. |
| AIID holds **~1,400 media-derived** incidents, not a census | Used as a *lower bound* and growth prior only. |

---

## 5. How v0.3 differs from v0.2 epistemically

v0.2's honesty was real but **not load-bearing** — the disclaimers were true while the machinery
undercut them. Specifically (`AUDIT.md`):

| v0.2 | v0.3 |
|---|---|
| `METHODS.md` calls bistability **"Demonstrated"**; six coefficients carry registry notes saying they were *"Calibrated for bistability"* | Tuning-to-outcome is **prohibited** and tested against (`VALIDATION.md` V11) |
| The narrative describes an R1 feedback loop **the equations do not contain** | The loop is implemented, or it is not claimed |
| ~34 coefficients invisible to the registry, the UI, and every sensitivity analysis | Zero unregistered constants; enforced by CI |
| The `empirical-anchor` honesty test is **vacuous** (loop body never executes) | Rewritten to assert an expected tier census (V12) |
| 89 of 96 preset rationales template-generated yet default to `caveatLevel: 'source-backed'` | `source-backed` requires a per-lever citation; default is `illustrative` |
| Monte Carlo bands silently show the `[0,1]¹²` hypercube, not the scenario | Sampling is scenario-anchored; the band's meaning is labelled in the UI |
| Five institutional designs produce **bit-identical output** | Interior resolution is an acceptance criterion (V6) |

**The pattern v0.3 is trying to break:** v0.2 said the right things in prose while the code, tests, and
UI quietly asserted more. Epistemic integrity has to be *mechanised* — in tests, in the registry schema,
in what the interface renders — or it decays into a disclaimer nobody reads.

---

## 6. Rules for reporting results from v0.3

Binding on any paper, slide, or export produced from this model.

1. **Never report a point estimate of any output.** Report distributions or ranges over the free
   parameters that drive it.
2. **Always state the conditioning set.** "Under ⟨parameters⟩, X" — never bare "X."
3. **Report the failure boundary alongside the success region.** A result quoted without its boundary is
   a misquotation.
4. **Name the tier of every number shown.** If a reader cannot identify a number's tier in under ten
   seconds, the presentation has failed (this is a `VALIDATION.md` reviewer check).
5. **Distinguish model results from paper claims.** Where v0.3 supports the paper, say "consistent with";
   where it does not, say so plainly. The instrument is independent; that is its whole value.
6. **Carry the no-forecast line on every export.** Already implemented in v0.2 and retained.

---

## 7. The strongest honest summary

> DocFlow v0.3 formalises the causal structure of the Documentation Paradox as the playbook describes it,
> makes its assumptions explicit and tiered, and derives the conditions under which the proposed
> three-channel architecture does and does not reduce a firm's total exposure. **It is a device for
> reasoning about the argument's structure, not evidence about the world.** Its most defensible outputs
> are conditional: the boundary between regimes, the parameters that move it, and the parameters that
> cannot be identified at all. Its central limit is that the weights on the three exposure channels —
> which determine which side of the boundary reality sits on — are free parameters that nobody has
> measured.
