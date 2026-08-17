# ADR 0003 — Decompose exposure into three opposing gradients

**Status:** Accepted · **Date:** 2026-08-17

## Context

v0.2 has a single exposure stock `E` which, by its own registry note, *"does not feed back into behavior."*
It is a read-out.

The paper's central claim is that exposure gradients **oppose** one another: candid documentation raises
products-liability exposure through discovery, while suppression raises regulatory exposure (unmet EU AI
Act Art. 73 duties; PLD Art. 9(1) rebuttable presumption on failure to comply with a disclosure order) and
fiduciary exposure (*Caremark* — boards deprived of oversight data).

**A single lumped, non-feeding-back stock cannot represent opposed gradients.** v0.2 is therefore
structurally incapable of expressing the argument it exists to illustrate. This is the largest fidelity gap
in the audit.

Corroborating evidence: the only genuinely non-monotone results v0.2 produces (`pld_penalty` and
`mandatory_reporting` *reducing* `f_doc` at the cyber baseline) arise in the one place it encodes opposed
signs. Opposed forces are what generate non-trivial results.

## Decision

Replace `E` with `E_pl`, `E_reg`, `E_fid`, each with its own inflows and shared decay, aggregated as
`E_tot = v_pl·E_pl + v_reg·E_reg + v_fid·E_fid`.

**All three `v·` weights are T4 free parameters, explicitly permitted to be zero.**

Sign structure (`MODEL_v3_SPEC` §4.5):

| | candour ↑ | suppression ↑ |
|---|---|---|
| `E_pl` | **↑** discovery of `R1`, and `(1−π)·R2` | ↓ |
| `E_reg` | ↓ | **↑** unmet duty on undocumented anomalies; PLD presumption on `N` |
| `E_fid` | ↓ board visibility rises with `R1` | **↑** |

`E_pl` and `harm` now feed back into culture (`ADR/0011`), closing the loop v0.2 lacks.

## Consequences

- **The headline result becomes a function of three unmeasured weights.** This is the model's largest
  epistemic dependency (`RISKS.md` R2, `OPEN_QUESTIONS.md` Q1). Mitigated by reporting the boundary in the
  `v_reg/v_pl` × `v_fid/v_pl` plane rather than a verdict — never a point result.
- `phi_doc`'s dual role in v0.2 (exposure conversion *and* culture gain) is eliminated; the hard parameter
  alias in `AUDIT.md` §4 is broken.
- Two stocks added. Justified: without them the paper's core claim is inexpressible.
- **Contingency:** if `E_fid` proves doctrinally near-dead (`OPEN_QUESTIONS.md` Q3), collapse it into a
  term inside `E_reg` and amend this ADR. Modelling a channel that barely exists would be the same defect
  as v0.2's — structure encoding a thesis.

## Alternatives rejected

**Keep one `E` with signed contributions.** Cheapest. Rejected: the three channels have different decay
rates, different triggering events (a disclosure order is not an enforcement action), and different
audiences. Summing them before dynamics destroys exactly the structure being studied.

**Five channels** (adding reputational and contractual/indemnity). Rejected on parameter budget: neither
has a doctrinal treatment in the paper, and both would be pure T4 with no bounding argument.
