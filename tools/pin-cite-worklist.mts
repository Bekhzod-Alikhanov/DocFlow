/**
 * Generate docs/plan/PIN_CITE_WORKLIST.md from the registry.
 *
 * Generated, not written, so it cannot go stale and cannot omit a parameter someone
 * added last week. I can tell you WHICH claims rest on legal authority and WHAT each one
 * asserts; I cannot verify a citation authoritatively, and pretending otherwise on
 * article numbers and reporter pages is exactly the kind of error a lawyer reading this
 * would catch first.
 *
 *   npm run worklist
 */
import { writeFileSync } from 'node:fs'
import { PARAM_SPECS } from '../src/engine/registry'

const flagged = PARAM_SPECS.filter((p) => p.citationStatus && p.citationStatus !== 'verified')
const pending = flagged.filter((p) => p.citationStatus === 'pin-cite-pending')
const unverified = flagged.filter((p) => p.citationStatus === 'unverified')

const row = (p: (typeof PARAM_SPECS)[number]) =>
  `| \`${p.id}\` | ${p.label} | ${p.source.replace(/\|/g, '\|')} | ${p.tier} | | |`

const md = `# Pin-cite worklist

**Generated from the registry — do not edit by hand.** Run \`npm run worklist\` to refresh.
${flagged.length} of ${PARAM_SPECS.length} parameters carry a citation that has not been verified.

This exists because I cannot verify legal sources. I can say precisely which modelled
claims rest on legal authority and what each one asserts; confirming that AI Act Art. 73
is the serious-incident provision, that PLD Art. 9(1) is the rebuttable presumption, and
that each reporter cite resolves is a human task. Article numbers and effective dates are
the most likely error in this project and the cheapest to find.

Fill the last two columns and change \`citationStatus\` in \`src/engine/registry.ts\` to
\`'verified'\` as each is confirmed. \`provenance.test.ts\` counts them.

## How to use this

For each row, confirm three things:

1. **The provision exists and is numbered as stated.** EU instrument article numbers moved
   between draft and final text more than once.
2. **It says what the model assumes it says.** The \`source\` column is the claim; a
   citation that exists but supports something adjacent is the harder error to spot.
3. **It is still current.** Especially the AI Act and PLD, whose application dates are
   staged.

A citation that fails (2) is a modelling problem, not a typo — flag it rather than
correcting the number, because the coefficient may need to change too.

## Priority — highest risk first

These carry specific provision numbers, which is where errors concentrate.

| Parameter | Label | Cited source | Tier | Verified? | Notes |
|---|---|---|---|---|---|
${pending.map(row).join('\n')}

## Remaining unverified

| Parameter | Label | Cited source | Tier | Verified? | Notes |
|---|---|---|---|---|---|
${unverified.map(row).join('\n')}

## Not on this list, and why

- **Parameters citing \`DocFlow BUILD_SPEC §2\`** — internal, nothing external to check.
- **Academic references** (Sculley et al. 2015, Vaughan 1996, Schwarcz et al. 2023) —
  they support a DIRECTION, never a magnitude, and the registry notes say so. Worth a
  read-through for mischaracterisation, but they are not pin-cites.
- **The five seed decisions** in \`docs/plan/coding/seed-cases.json\` — they are covered by
  the coding protocol, which requires reading them in full rather than confirming a cite.

---

*${flagged.length} rows. Every parameter here is T3 or T4: the citation supports the
structure of a mechanism, never the value of a coefficient. Verifying a cite does not
promote anything to "measured".*
`

writeFileSync('docs/plan/PIN_CITE_WORKLIST.md', md, 'utf8')
console.log(`wrote docs/plan/PIN_CITE_WORKLIST.md (${flagged.length} rows: ${pending.length} pin-cite-pending, ${unverified.length} unverified)`)
