# Architecture Audit Signals

Use these signals to decide whether a change is cleanup, a quality ratchet, or architecture work. No single signal is sufficient.

## Strong architecture evidence

- one user-visible behavior requires edits across several unrelated owners;
- authoritative state is duplicated, inferred, or overwritten by fallback paths;
- a boolean/status/adapter cannot represent the outcomes callers need;
- lifecycle, restore, persistence, IPC, or event ordering is implicit across modules;
- tests cannot reproduce the real behavior without bypassing the public seam;
- the same defect family reappears because the Interface cannot express a required state;
- callers know internal sequencing or storage details that should be encapsulated;
- a Module mixes distinct reasons to change and no cohesive internal boundary contains them.

Apply the deletion test to a suspected shallow Module: if deleting it merely spreads the same complexity across callers, the Module is earning its keep; if the complexity disappears or callers become simpler by calling the real owner directly, the Module is likely pass-through indirection.

## Oversized Modules

Treat 600+ source lines as a required review signal, not an automatic split. Keep a large Module when it has one cohesive responsibility, a small stable Interface, and strong tests. Prefer extraction when the move creates a meaningful owner, reduces caller knowledge, or establishes a faithful test seam.

Reject “helpers” that only relocate syntax while callers, state ownership, and verification remain coupled.

## Quality ratchets

Use a ratchet instead of a rewrite when debt is broad and mechanically measurable: TypeScript errors, lint rules, cycles, coverage gaps, or file-size budgets. Record the baseline, prevent regression, and improve by bounded slices.

Do not upgrade dependencies, change formatting across unrelated files, or introduce a new tool unless the candidate requires it and the user authorized that scope.

## AI navigability

Useful improvements make ownership discoverable from names and imports, keep domain vocabulary consistent, expose small stable Interfaces, and place verification near the behavior. More files or abstractions are not automatically more navigable.

## Behavior-sensitive surfaces

Treat state owners, UI/main/shared seams, library lifecycle, movement/scroll authority, persistence/restore, diagnostics consumed by tests, E2E harnesses, and import/conversion contracts as behavior-sensitive. Follow the target project's documentation and tool routing before proposing local cleanup.
