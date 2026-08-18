# Pin-cite worklist

**Generated from the registry — do not edit by hand.** Run `npm run worklist` to refresh.
27 of 101 parameters carry a citation that has not been verified.

This exists because I cannot verify legal sources. I can say precisely which modelled
claims rest on legal authority and what each one asserts; confirming that AI Act Art. 73
is the serious-incident provision, that PLD Art. 9(1) is the rebuttable presumption, and
that each reporter cite resolves is a human task. Article numbers and effective dates are
the most likely error in this project and the cheapest to find.

Fill the last two columns and change `citationStatus` in `src/engine/registry.ts` to
`'verified'` as each is confirmed. `provenance.test.ts` counts them.

## How to use this

For each row, confirm three things:

1. **The provision exists and is numbered as stated.** EU instrument article numbers moved
   between draft and final text more than once.
2. **It says what the model assumes it says.** The `source` column is the claim; a
   citation that exists but supports something adjacent is the harder error to spot.
3. **It is still current.** Especially the AI Act and PLD, whose application dates are
   staged.

A citation that fails (2) is a modelling problem, not a typo — flag it rather than
correcting the number, because the coefficient may need to change too.

## Priority — highest risk first

These carry specific provision numbers, which is where errors concentrate.

| Parameter | Label | Cited source | Tier | Verified? | Notes |
|---|---|---|---|---|---|
| `mandatory_reporting` | Mandatory reporting | WS3; EU AI Act (Reg. 2024/1689) Art. 73 [pin-cite to verify] | T4 | | |
| `pld_penalty` | Non-documentation penalty (PLD) | WS1; EU PLD Dir. (EU) 2024/2853 Arts. 9–10 adverse-inference [pin-cite to verify] | T4 | | |

## Remaining unverified

| Parameter | Label | Cited source | Tier | Verified? | Notes |
|---|---|---|---|---|---|
| `precommit` | Pre-committed escalation | In re Target (2015) protection survived; In re Capital One (2020) and In re Rutter's (2021) failed | T4 | | |
| `significant_purpose` | Significant legal purpose | In re Kellogg Brown & Root (D.C. Cir. 2014) significant-purpose test | T4 | | |
| `valve_discipline` | One-way valve discipline | Playbook 3.2.2 strict one-way valve; Fed. R. Evid. 407 independent-admission limit | T4 | | |
| `kovel_evaluator` | Outside evaluator under Kovel | United States v. Kovel, 296 F.2d 918 (2d Cir. 1961) | T4 | | |
| `just_culture` | Just culture | WS2/WS3; EU Reg. 376/2014 Art. 16(10); ASAP "Big Five" | T4 | | |
| `recipient_enforcer_separation` | Recipient–enforcer separation | WS3; NASA ASRS (49 U.S.C. §40123); INPO; DSMB | T4 | | |
| `translation_layer` | Safety translation layer | WS3/WS4; PSQIA PSES; Sculley et al. 2015 | T4 | | |
| `workflow_protection` | Workflow protection | WS3; PSQIA PSES, 42 U.S.C. §§299b-21–26; HHS Guidance 81 Fed. Reg. 32655 | T4 | | |
| `original_records_boundary` | Original-records boundary | WS3; PSQIA original-records exception; AI Incident Playbook factual-record architecture | T4 | | |
| `safe_harbor_non_admission` | Safe harbor / non-admission | WS3; CIRCIA §681e; 21 C.F.R. §§803.16, 314.80(k), 600.80(k) | T4 | | |
| `effective_challenge` | Effective challenge | WS3; Federal Reserve/OCC SR 11-7 model risk management | T4 | | |
| `near_miss_tier` | Voluntary near-miss tier | WS3; ASRS; EU Reg. 376/2014 mandatory floor + voluntary tier | T4 | | |
| `intermediary_capacity` | Intermediary capacity | WS3; NASA ASRS, AHRQ PSOs/NPSD, ASIAS/MITRE, INPO SEE-IN | T4 | | |
| `w_407` | Remediation-record discoverability | Fed. R. Evid. 407 excludes the remedial measure, not everything around it | T4 | | |
| `near_miss_learning_boost` | Near-miss weak-signal learning | DocFlow v0.2; ASRS and EU Reg. 376/2014 voluntary occurrence tier | T4 | | |
| `b_pre` | Weight: pre-commitment | In re Target (2015) vs In re Capital One (2020) | T4 | | |
| `b_purp` | Weight: significant legal purpose | In re Kellogg Brown & Root (2014) | T4 | | |
| `l_kovel` | Kovel leakage surcharge | United States v. Kovel (1961); widening the circle widens the leak | T4 | | |
| `adm` | Independent admissions per leak | Fed. R. Evid. 407 excludes the remedial measure, not statements made alongside it | T4 | | |
| `disc_prob` | Probability the record is reached in discovery | Fed. R. Civ. P. 26(b)(1) proportionality | T4 | | |
| `xi_2` | Unprotected analysis to exposure | Playbook 1.2.2; In re Capital One (2020) | T4 | | |
| `xi_3` | Remediation record -> PL exposure | Fed. R. Evid. 407 limits admissibility at trial, not discovery (ADR/0004) | T4 | | |
| `xi_duty` | Unmet reporting duty to regulatory exposure | EU AI Act (Reg. 2024/1689) Art. 73 serious-incident reporting | T4 | | |
| `xi_pld` | PLD presumption to regulatory exposure | PLD Dir. (EU) 2024/2853 Art. 9(1) rebuttable presumption | T4 | | |
| `xi_board` | Board blind-spot to fiduciary exposure | In re Caremark (Del. Ch. 1996); Shapira 2022 | T4 | | |

## Not on this list, and why

- **Parameters citing `DocFlow BUILD_SPEC §2`** — internal, nothing external to check.
- **Academic references** (Sculley et al. 2015, Vaughan 1996, Schwarcz et al. 2023) —
  they support a DIRECTION, never a magnitude, and the registry notes say so. Worth a
  read-through for mischaracterisation, but they are not pin-cites.
- **The five seed decisions** in `docs/plan/coding/seed-cases.json` — they are covered by
  the coding protocol, which requires reading them in full rather than confirming a cite.

---

*27 rows. Every parameter here is T3 or T4: the citation supports the
structure of a mechanism, never the value of a coefficient. Verifying a cite does not
promote anything to "measured".*
