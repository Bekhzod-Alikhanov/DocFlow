# ADR 0002 — Three channels as distinct model objects

**Status:** Accepted · **Date:** 2026-08-17

## Context

v0.2 has a single `D` (documented incidents) stock. The paper's architecture turns on **three artifacts
with different evidentiary status**: Channel One (factual telemetry, *discoverable by design*), Channel Two
(counsel-directed privileged analysis, entered via a pre-committed tripwire), Channel Three (remediation
records in operational language).

`D` conflates all three. Because it does, v0.2 cannot express the valve, the tripwire, or the Rule 407
hedge — and it cannot give the protection levers distinct pathways, which is a direct cause of the
identifiability failure in `AUDIT.md` §5.2.

## Decision

Three stocks — `R1` (factual-record completeness), `R2` (privileged-analysis volume), `R3` (remediation
throughput) — with distinct inflows, distinct decay, and **distinct exposure consequences**:

| | Written regardless? | Discoverable | Drives |
|---|---|---|---|
| `R1` | yes | by design | `E_pl` ↑, `E_reg` ↓, `E_fid` ↓ |
| `R2` | only if tripwire fires | contingent on `π` | `E_pl` ↑ only as `(1−π)` |
| `R3` | yes | yes, with `q_407` discount | `K` ↑ (learning conduit) |

Retire `D`. Discoverability disaggregates into `pd_fact` / `pd_anal` / `pd_rem` (`MODEL_v3_SPEC` §3.2).

## Consequences

- **Identifiability improves by construction**: protection levers now act on different channels with
  different observable consequences, so they are separable in principle. `VALIDATION.md` **V7.2** tests
  that this actually worked (no two levers at `|r| > 0.999`). If V7.2 fails, the disaggregation did not
  achieve its purpose and the levers should be **merged** rather than pretended distinct.
- Three stocks added against the parameter budget; each justified in the spec's Rule 1 table.
- Preset migration required — v0.2 scenarios have no channel decomposition; `ROADMAP.md` M3 budgets it.
- The paper's line *"Only the second channel depends on its legal protection for its existence. The first
  and third are written regardless"* becomes a structural property: `R1` and `R3` inflows do not reference
  `π`; `R2`'s does.

## Alternatives rejected

**Keep `D`, add channel *fractions* as auxiliaries.** Cheaper and avoids two stocks. Rejected because the
channels have different **decay** and different **retention/legal-hold** behaviour, which fractions of a
single stock cannot represent; and because it would preserve the single-pathway collapse that causes the
identifiability failure.

**Model channels as a routing matrix over one record stock.** More elegant, but the evidentiary status is
a property of the artifact, not of a routing decision, and privilege attaches to `R2` alone.
