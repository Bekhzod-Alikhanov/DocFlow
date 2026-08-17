# ADR 0010 — TypeScript engine stays canonical; Python is an analysis layer only

**Status:** Accepted · **Date:** 2026-08-17

## Context

The brief (Phase 4) asks whether to extract the pure engine into a standalone package with a Python
analysis layer, or keep everything in TypeScript.

Constraints: the engine must keep importing no React, DOM, storage, or network code (a property v0.2 has
and that must be preserved). The browser instrument — Executive/Scientific/Tabletop modes — is a primary
deliverable, not a demo. And the new analyses (pseudo-arclength continuation, sensitivity-matrix SVD,
Morris/Sobol at ~25k evaluations, PRIM/CART scenario discovery) are exactly where the Python scientific
stack is decisively better than anything available in TypeScript.

## Decision

**Hybrid, with TypeScript canonical.**

```
src/engine/          ← canonical model. Pure TS. No React/DOM/storage/network. THE source of truth.
src/workers/         ← worker RPC for interactive analyses (unchanged)
analysis/            ← NEW. Python. Consumes exported artifacts. Never reimplements the model.
  ├── continuation/  ← pseudo-arclength, fold curves        (scipy)
  ├── identifiability/ ← sensitivity SVD, equifinality      (numpy)
  ├── sensitivity/   ← Morris, Sobol, bootstrap CIs         (SALib)
  ├── discovery/     ← PRIM, CART                           (ema_workbench, scikit-learn)
  └── io/            ← run-artifact schema + loader
```

**Hard boundary: Python never contains model equations.** It consumes:

- **parameter sets** (versioned JSON, registry-schema-validated), and
- **run artifacts** (trajectories + auxiliaries + provenance, produced by the TS engine).

Where an analysis needs many model evaluations, it invokes the TS engine as a subprocess (`node`) over a
batch protocol, or consumes a pre-computed design matrix. **It does not recompute the RHS.**

## Consequences

- **One source of truth.** The worst outcome — two implementations drifting — is structurally prevented.
  `RISKS.md` R8 mitigation: a CI test greps the Python layer for stock symbols in arithmetic context and
  fails if the model appears there.
- The browser instrument keeps working with no Python dependency; interactive analyses stay in the worker.
- Heavy analyses move off the interactive path entirely and run nightly (`VALIDATION.md` CI tiers).
- **Cost:** a subprocess batch protocol and an artifact schema must be built and versioned. Budgeted in
  `ROADMAP.md` M5.
- Reproducibility requirements: seeds recorded in every artifact; artifacts carry `MODEL_VERSION` and a
  registry hash; results archived under `runs/<model-version>/<run-id>/` with the parameter set inlined.

## Determinism and provenance (also decided here)

- Single seeded PRNG stream per run; **substreams per Monte Carlo replicate**, so changing the varied set
  does not reshuffle every run (a v0.2 defect: rejection sampling in `normal()` consumes a variable number
  of draws, breaking common random numbers across configurations).
- Every artifact embeds the full `RunRecord` (params, init, settings, seed, model version, registry hash).
- **Version contract enforced in CI:** a hash over registry + equation sources must change iff
  `MODEL_VERSION` changes (`VALIDATION.md` V12.5), closing `AUDIT.md` F18 where two different
  trajectory-producing configurations both stamped `0.2.0`.

## Alternatives rejected

**Port the engine to Python.** Best scientific tooling, and it kills the browser instrument — the thing
that makes DocFlow useful to non-modellers, which is much of its point. Also throws away a tested, ≥90%-
covered engine.

**Everything in TypeScript.** Preserves the single artifact and zero build complexity. Rejected: no mature
TS equivalents for pseudo-arclength continuation or PRIM, and hand-rolling them repeats v0.2's
trade-off — `ARCHITECTURE.md` already concedes *"the heavy scientific tooling the spec attributes to
SciPy/SALib is hand-rolled"* — at a point where the numerics are much harder and the cost of a subtle bug
is much higher.

**Extract the engine to a published npm package.** Orthogonal to this decision and premature; revisit if an
external consumer appears.
