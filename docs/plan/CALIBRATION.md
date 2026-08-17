# CALIBRATION — Anchors, Ratings, and What Remains Uncalibrated

**Headline conclusion, stated first:**

> **DocFlow v0.3 is not calibrated, and with the evidence currently available it cannot be.** Every
> candidate anchor below supports a **prior** over a parameter, not a **likelihood** over model output.
> There is no dataset against which trajectories can be scored. The correct posture is prior-predictive
> analysis plus explicit statements of what evidence would change the answer — not Bayesian updating
> dressed over an absent likelihood.

This inverts v0.2's implicit posture, where a single "calibration target" (cyber `f_doc ≈ 0.05`) was
treated as an anchor while being **missed by 44%** (`AUDIT.md` §3).

---

## 1. Anchor inventory

Each rated on **Strength** (how solid within its own domain) × **Transferability** (how defensibly it maps
to AI-firm documentation behaviour). Both 1–5.

| # | Anchor | Str | Trans | What it can support |
|---|---|---|---|---|
| **A1** | **Schwarcz, Wolff & Woods (2023), p. 450** — formal written forensic report requested in <5% of cybersecurity incidents | **2** | **3** | A **prior** on `f_doc` in a low-protection, high-discoverability regime. |
| **A2** | **AI Incident Database** (McGregor 2021) — ~1,400 media-derived incidents; growth curve | **4** | **2** | A **lower bound** on detected-and-public incident counts; a growth prior for `hazard_gen`. |
| **A3** | **ASRS** public report volumes | **5** | **1** | Order-of-magnitude prior on what a mature protected voluntary channel yields per unit exposure. |
| **A4** | **PSQIA / PSO** listing and adoption data | **4** | **2** | A prior on **adoption dynamics** of workflow protection, not on documentation rates. |
| **A5** | **FDA adverse-event reporting** volumes (MedWatch/FAERS) | **4** | **1** | Prior on mandatory-reporting volume under non-admission rules. |
| **A6** | **Frontier-lab capability frameworks** (Anthropic 2026; Google DeepMind 2026) | **3** | **4** | **Existence and structure** of pre-committed thresholds — supports the tripwire's *form*, not its calibration. |
| **A7** | **Privilege case law** (*Target*, *Capital One*, *Rutter's*, *Guo Wengui*, *Kellogg*) | **3** | **4** | The **factor structure** of §5.1. Could support coefficients if coded — see §3. |

### 1.1 A1 is a calibration target, never a statistic

The <5% figure is **one interviewed forensic investigator's estimate**, reported in a qualitative
interview study. It is not a measured rate, has no sampling frame, no confidence interval, and no
denominator. v0.2's registry says this; v0.2's *tests* then guard it with `f_doc < 0.1`, a one-sided,
factor-of-two-loose bound that the model misses anyway (actual 0.0721).

**v0.3 treatment:** A1 becomes a **prior-predictive check**, not a fitting target. The check is:
*does the model, under a low-protection/high-discoverability parameterisation, place non-trivial
posterior-predictive mass below `f_doc = 0.15`?* If it cannot, the structure is wrong. If it can, that is
weak corroboration — nothing more. **Point-matching 0.05 is explicitly forbidden**, because doing so tunes
the model to a number that does not carry that precision.

### 1.2 Transferability is the binding constraint

A3–A5 are the strongest evidence in the table and the least transferable. Aviation and healthcare
reporting rates reflect decades of statutory protection, professional licensure, and institutional
scaffolding absent in AI. Using an ASRS rate as an AI prior would import the conclusion (*protected
channels produce candour*) as an assumption. **They are therefore used only for order-of-magnitude sanity
bounds and for the *adoption-dynamics* structure in A4 — never as level anchors.**

This mirrors the paper's own methodology: the cybersecurity literature is *"the analysis's empirical
proxy,"* and claims about AI-firm practice are *"consistent with analogous evidence rather than validated
against observed practice."* `EPISTEMICS.md` holds v0.3 to the same standard.

---

## 2. Method: prior-predictive, not posterior

### 2.1 Why not Bayesian calibration (`ADR/0007`)

Posterior inference requires `p(data | θ)`. We have **no time series of documentation behaviour at AI
firms** — no `f_doc(t)`, no incident counts by documentation status, no privilege outcomes by firm. The
Chatham House interviews behind the paper are explicitly *"not treated as primary empirical evidence."*
Running MCMC here would produce a posterior that is the prior reshaped by an arbitrary likelihood — an
authority-laundering exercise, and precisely the failure mode a hostile reviewer looks for.

### 2.2 What is run instead

1. **Elicited priors on every T4 parameter**, stated as distributions with written rationale, replacing
   v0.2's uniform-over-registry-range default (which, per `AUDIT.md` §8.2, silently discards the
   scenario).
2. **Prior-predictive simulation** — sample θ from priors, simulate, and compare the *distribution* of
   outputs against the qualitative anchors:
   - low-protection regimes place mass at low `f_doc` (A1);
   - detected-incident counts are order-consistent with AIID growth (A2);
   - protected-channel regimes do not produce implausible documentation rates (A3–A5 as bounds).
3. **Prior sensitivity** — re-run under a deliberately different prior family. Conclusions that flip are
   reported as prior-dependent. This is the honest substitute for posterior diagnostics.
4. **"What would move this" table** — for each T4 parameter, the observation that would constrain it and
   its realistic obtainability. This is the actionable output of the whole document.

### 2.3 Diagnostics

Since there is no posterior: no R̂, no ESS, no divergences. Reported instead — prior-predictive coverage
of each qualitative anchor; the fraction of prior mass producing non-physical trajectories (a structural
check); and prior-vs-prior conclusion stability.

**If and when data arrives** (§3, or firm telemetry), the pipeline is specified and ready: likelihood on
channel-level counts, NUTS, full diagnostics. It is specified, not run.

---

## 3. Privilege case-law coding protocol — **specified, NOT executed**

The highest-value opportunity to replace an invented coefficient with data, and the only item requiring
labour outside this repository. Per the session decision, the protocol is specified in full and the
parameters remain **T4/uncalibrated** until it is executed.

### 3.1 Sample

Federal and state decisions ruling on privilege or work-product protection for **incident/breach
investigations**. Seed set from the paper: *In re Target* (2015), *In re Capital One* (2020),
*In re Rutter's* (2021), *Guo Wengui v. Clark Hill* (2021), *In re Kellogg Brown & Root* (2014).
Expand by citator (all citing/cited cases), then by targeted search. **Realistic N ≈ 15–30.**

### 3.2 Coding scheme

Per decision, four binary/ordinal factors matching §5.1 plus the outcome:

| Field | Values |
|---|---|
| `precommit` | 0 = post-hoc engagement · 1 = protocol/retainer predating the incident |
| `separation` | 0–2: none / partial / demonstrably separate workstream |
| `significant_purpose` | 0–2: purely business / mixed / legal advice a significant purpose |
| `valve` | 0–2: conclusions circulated widely / limited / tightly held |
| **`outcome`** | 0 = protection denied · 1 = partial · 2 = upheld |

Plus: jurisdiction, year, doctrine invoked (AC privilege / work product / both), and a free-text
quotation supporting each code.

### 3.3 Reliability

Two independent coders, blind to each other and to the hypothesis. **Cohen's κ per factor**, reported
per factor, not pooled. κ < 0.6 on any factor ⇒ that factor's rubric is rewritten and coding is redone,
**not** silently retained. Disagreements adjudicated by a third coder with the rationale recorded.
Codebook and coded data published with the model.

### 3.4 What is and is not estimable at N ≈ 15–30

**Honestly:**

- **Not estimable:** a four-predictor logistic with interactions. With N = 20 and ~10 events per outcome
  class, the events-per-variable ratio is ≈ 2–3, far below the ≈ 10 rule of thumb. Coefficients would be
  unstable, separation is likely (e.g. if every `precommit = 1` case was upheld, the MLE diverges), and
  standard errors would be uninterpretable.
- **Estimable, with care:** (a) **direction and rough magnitude** of each factor via penalised logistic
  regression (Firth), which handles separation and small-sample bias; (b) a **rank ordering** of factor
  importance; (c) **exact-test contingency results** for single factors.
- **Preferred output:** a **Firth-penalised model with bootstrap intervals**, reported as an *interval on
  each `b·` coefficient*, propagated into the model as a distribution — never as a point estimate.

### 3.5 Propagation

Coded coefficients enter as **priors with bootstrap-derived spread**, not fixed values. `π` therefore
carries uncertainty into every downstream result, and §6's dominance boundary is reported as a **band**.
Tier moves T4 → **T2 (analog-estimated)** — *not* T1 — because the decisions are cybersecurity and
general-corporate, not AI, and because coded judicial outcomes are a proxy for future rulings on an
untested device.

### 3.6 Why this is worth doing even at small N

A defensible small-N model with stated limits is worth far more than a confident slider. It replaces
"we chose 0.3" with "coded 22 decisions; pre-commitment is the strongest single predictor; here is the
interval; here is the codebook." That is auditable. The current alternative is not.

---

## 4. What remains uncalibrated

**Everything.** Explicitly, and in rough order of how much the headline result depends on it:

| Parameter(s) | Tier | Why it matters | What would constrain it |
|---|---|---|---|
| ⟦`v_pl`, `v_reg`, `v_fid`⟧ | T4 | **Determine the §6 dominance boundary outright.** | Firm-level data on realised costs by exposure type; enforcement-action base rates; derivative-suit outcomes. Realistically: expert elicitation with wide intervals. |
| ⟦`b_pre`, `b_sep`, `b_purp`, `b_valve`⟧ | T4 → T2 | Privilege survival | **§3 coding protocol.** The one tractable item. |
| ⟦`p_court`⟧ | T4 | Untested device | **Unknowable by construction.** Swept `[0,1]`, never estimated. |
| `CAPTURE_BASE[4]` | T4 | Detection realism | Instrumentation studies at AI firms; possibly AIID metadata on how incidents surfaced. |
| ⟦`eta_K`, `churn`⟧ | T4 | Compounding loop strength | Regression-suite growth data; model-deprecation cadence. Plausibly obtainable from public release notes. |
| ⟦`omega`, `psi`, `psi_E`, `psi_H`⟧ | T4 | Culture loop | Organisational-behaviour literature gives *direction* only. **In v0.2 these were tuned for bistability** (`AUDIT.md` §6.1); in v0.3 they must not be. |
| ⟦`gain`, `g_valve`, `g_trip`⟧ | T4 | Sharpness of every transition | Nothing available. Reported via steepness-sweeps (`VALIDATION.md` V9). |
| `c_inc_debt`, `c_harm_exp`, `c_rec_exp` | T3 | Unit conversions | Structural by construction — they *define* the index units. Not free, not measured. |

### 4.1 The prohibition that replaces v0.2's practice

**No parameter may be set to produce a qualitative outcome.** v0.2 has six parameters whose registry
notes say they were "Calibrated for bistability," while `METHODS.md` presents bistability as
"Demonstrated." v0.3 forbids this: if bistability appears, it must appear as a *consequence* of
independently-motivated parameters, and the region where it appears must be reported alongside the region
where it does not. `VALIDATION.md` V11 is the circularity test that enforces it.
