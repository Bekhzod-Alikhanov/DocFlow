# OPEN QUESTIONS — Legal, Empirical, and Domain Input Required

Questions I cannot resolve from the codebase, the paper, or modelling judgment. Each states **who** can
answer it, **what changes** if they do, and **what v0.3 does meanwhile**. Ordered by how much the model's
conclusions depend on the answer.

---

## Q1 · What are the relative magnitudes of the three exposure channels?

**The model's single largest epistemic dependency.** ⟦`v_pl`⟧, ⟦`v_reg`⟧, ⟦`v_fid`⟧ weight products-liability,
regulatory, and fiduciary exposure in `E_tot`. Their **ratio determines the sign of `ΔJ`** — i.e. whether
the three-channel architecture beats opacity. Choosing them chooses the answer.

- **Who:** legal co-authors + empirical work. Candidate evidence: distribution of realised
  products-liability judgments/settlements against software and platform defendants; EU AI Act Art. 73
  enforcement base rates once operative; frequency and outcome of *Caremark* oversight claims surviving
  motions to dismiss.
- **If answered:** the boundary collapses from a 2-D map to a located point-with-uncertainty, and v0.3 can
  say something about which regime the industry is actually in — its most valuable possible output.
- **Meanwhile:** all three are T4; the result is reported as a boundary in the `v_reg/v_pl` × `v_fid/v_pl`
  plane, never as a verdict. `EPISTEMICS.md` §3.2 states the prohibition.
- **Honest note:** `v_fid` may be the hardest. *Caremark* claims rarely succeed; their deterrent value may
  be mostly reputational, which the model does not represent.

---

## Q2 · Who executes the privilege case-law coding, and is Westlaw/Lexis access available?

`CALIBRATION.md` §3 specifies the protocol in full and marks it **not executed**. It is the one tractable
route from an invented coefficient to data.

- **Who:** legal co-authors (Mosi Secret wrote §1). Needs **two independent coders** plus an adjudicator,
  20–40 h each, and paid database access for citator expansion beyond the five seed cases.
- **If answered:** ⟦`b_pre`, `b_sep`, `b_purp`, `b_valve`⟧ move **T4 → T2** with bootstrap intervals; `π`
  carries real uncertainty; the dominance boundary becomes a band rather than a curve.
- **Meanwhile:** T4 with stated bounds. `π` is never displayed as a bare number.
- **Decision needed:** if the coding will not happen, say so, and the privilege factor model should be
  simplified to a transparent non-fitted rubric rather than a logistic that implies estimated coefficients.

---

## Q3 · Is the *Caremark* / fiduciary channel real enough to model?

The paper asserts suppression "deprives corporate boards of the incident data their oversight duties
require," citing *Caremark* and Shapira (2022). v0.3 makes this a full exposure stock with its own
dynamics.

- **Who:** corporate-governance counsel.
- **The concern:** *Caremark* is famously hard to plead. If the channel is doctrinally near-dead, giving it
  a co-equal stock **overweights the paper's argument** — the model would be asserting an opposed gradient
  that barely exists. That is the mirror image of the v0.2 defect: structure that encodes a thesis.
- **If answered "weak":** collapse `E_fid` into a term inside `E_reg` rather than a stock, and record the
  change in `ADR/0003`.
- **Meanwhile:** modelled as a stock with ⟦`v_fid`⟧ free and explicitly allowed to be **zero**, so the
  "weak channel" case is inside the swept space rather than excluded by construction.

---

## Q4 · Does Rule 407 do any work at the discovery stage?

`ADR/0004` argues it does not: 407 limits **admissibility at trial**, not discovery, so in a model whose
outcome is discovery-driven exposure it should carry almost no weight. v0.3 therefore models Channel Three
primarily as the **learning conduit**, with only a small ⟦`q_407`⟧ admissibility discount.

- **Who:** litigation counsel.
- **The question:** is there a settlement-value channel — does anticipated inadmissibility reduce expected
  cost even when the material is produced? If yes, ⟦`q_407`⟧ should be larger and should enter the
  settlement term rather than the discovery term.
- **Meanwhile:** ⟦`q_407`⟧ is T4 and small; sensitivity to it is reported.

---

## Q5 · Can frontier-lab capability frameworks anchor the tripwire?

The paper likens the tripwire to published capability thresholds (Anthropic 2026; Google DeepMind 2026).

- **Who:** anyone with access to the published frameworks; possibly Sean McGregor via AIID.
- **The question:** do these frameworks specify **quantitative** thresholds with **observable crossing
  rates**? If so, ⟦`τ_review`⟧ and the tiered band gain a T2 anchor — the first non-trivial calibration in
  the model.
- **Meanwhile:** the frameworks support the tripwire's *form* (pre-commitment exists and is practicable),
  rated Strength 3 / Transferability 4 in `CALIBRATION.md` A6, but supply no level.

---

## Q6 · Can AIID data bound detection-capability growth?

⟦`eta_K`⟧ and ⟦`churn`⟧ govern the compounding loop — the strongest addition in v0.3.

- **Who:** Sean McGregor / AIID.
- **The questions:** (a) Does AIID metadata record **how** an incident surfaced (user report, internal
  telemetry, media, research)? A shift in that mix over time would be a proxy for detection capability.
  (b) Do incident reports indicate whether a regression test resulted? (c) What is a realistic model or
  pipeline deprecation cadence — the empirical content of ⟦`churn`⟧?
- **If answered:** a genuine T2 anchor on the loop that most distinguishes v0.3 from v0.2.
- **Meanwhile:** both T4. AIID counts are used only as a lower bound and growth prior.
- **Caveat to carry:** AIID is media-derived (~1,400 incidents), so it measures *public* surfacing, not
  detection. The gap between them is exactly the quantity of interest, which makes this evidence
  suggestive rather than decisive.

---

## Q7 · Is the capture-resistance taxonomy ordinal, and where do real incidents fall?

`CAPTURE_BASE` assigns a base capturability to each of the paper's four properties
(`silent | irreproducible | distributional | environment_dependent`). v0.2 assigns `{30, 35, 45, 55}` with
no basis.

- **Who:** ML engineering practitioners; possibly the Chatham House interviewees.
- **The questions:** is the taxonomy ordinal at all? What fraction of real AI incidents falls in each
  class? Are they exclusive, or does one incident carry several properties?
- **If answered:** four T2 values and a realistic distribution over incident types.
- **Meanwhile:** T4; the model sweeps them and reports whether conclusions depend on the ordering.

---

## Q8 · Is "significant purpose" binary or graded in practice?

*In re Kellogg Brown & Root* holds protection can survive a parallel regulatory purpose if legal advice was
*a* significant purpose. v0.3 codes it 0–2.

- **Who:** legal co-authors; also resolvable *by* the Q2 coding, which is a reason to prioritise Q2.
- **Why it matters:** if courts treat it as effectively binary, an ordinal code adds false resolution and
  the logistic should take a binary input.

---

## Q9 · What counts as an "incident" for the model's unit?

`U`, `A`, `N` are in "incidents"; `H` in "hazards". The paper uses the OECD security/misuse/malfunction
taxonomy. But a single latent hazard can generate many user-visible events, and a distributional failure
may have no discrete event at all.

- **Who:** AIID / incident-taxonomy practitioners.
- **The problem:** if the hazard-to-event multiplicity varies by orders of magnitude across failure types,
  a single "incidents" unit is a category error, and `H → A` needs a multiplicity parameter.
- **Meanwhile:** ⟦`rho_scan`⟧ absorbs the multiplicity implicitly. **This is a known weakness of the unit
  system**, recorded here rather than hidden.

---

## Q10 · Should the commons module model regulators as strategic?

`ADR/0009` models N firms plus a passive certified intermediary. The paper's ASRS analogy turns on the
recipient being **separated from the enforcer** — which is an institutional-design fact, not a strategy.

- **Who:** the paper's authors (§4 is the user's own section).
- **The question:** is the separation credible-by-construction (statutory), or does it require modelling
  the regulator's incentive not to defect? If the latter, the commons game needs a third player and
  becomes substantially harder.
- **Meanwhile:** the intermediary is passive and non-strategic, and this is stated as an assumption.

---

## Q11 · Interpretive: should v0.3 publish results that contradict the paper?

Partially settled — the session decision makes v0.3 an **independent research instrument**, free to
contradict, with reproducibility rather than consistency as its standard.

**Remaining, and for the authors rather than the implementer:** if v0.3 finds a plausible region where
suppression dominates, or finds the commons adequately supplied without statute, **how is that
communicated** relative to a published playbook that argues otherwise? Options range from a footnote in
the model docs to a companion note. This is an authorship and positioning question, not a technical one,
and it should be decided **before** M6 produces the boundary rather than after.
