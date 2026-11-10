# Behavior correctness

Use this procedure for behavior changes on the Spec axis. Review the candidate read-only. Keep exploration tied to the changed effects and affected contracts; a literal-copy or mechanical change with no behavior impact needs only a short applicability statement.

## 1. Trace affected contracts

Derive invariants independently from the accepted requirements and relevant domain/ADR, public API and test contracts. Cite their sources. Existing implementation explains mechanisms, but does not by itself establish intended product behavior. Mark inferred expectations and unresolved product meaning explicitly.

Follow each material changed effect through its callers, callees and defaults, event producers, authoritative state owners and actual consumers. Inspect unchanged code on that path. At new, retry, recovery or background calls to an existing operation, compare arguments and omitted defaults with established call sites and identify any contract changed by the difference.

## 2. Complete the boundary ledger

Before reporting findings, account for each materially affected stateful or asynchronous effect. Group paths sharing the same guarantees. Retain a compact ledger with source references:

| Effect/stage and owner | Value identity, generation or coordinate frame | Acceptance guard and what it proves | Applied effect/completion condition |
| --- | --- | --- | --- |

Trace intent, response, state publication, consumer installation, and externally observable completion where those stages exist. Assign a producer/snapshot to every value crossing a boundary. Include retained values, captured closures and live reads. A request token, an old ready result and a current consumer can coexist; identify the actual source-level link between them rather than treating their individually valid predicates as one version guarantee.

At deferred commands, compare the snapshot used to compute the command with the snapshot against which the consumer interprets it. For positional commands, determine whether the position is stable identity or an index in a particular projection. Existence of the same entity in two projections does not establish equal positions or equal data versions.

Where framework/library update or event semantics decide whether these states can overlap, consult the project's versioned-library evidence route. Cite what that source guarantees. If application to the consumer remains unproven, identify that exact edge and the smallest observation needed; a general "framework timing unknown" does not complete the ledger.

## 3. Try to falsify each material guard

For each guard or completion predicate relied on in the ledger, construct a source-reachable state where the predicate passes but the promised invariant is false. Check relevant boundaries, not an arbitrary catalogue:

- After a new intent advances, before its result arrives: what previously ready data remains readable, which callbacks can still execute, and can they claim completion for the new intent?
- After state publication, before consumer installation: does an acknowledgement, setter or render notification prove that this exact result is installed, or only that an update was scheduled?
- During a delayed callback: can a captured position/value be applied to a newer consumer snapshot while its entity still exists and its request token remains current?
- On retry, reactivation or background completion: do defaults, retained errors, earlier responses or another event producer change the accepted state?

Select relevant transitions from the inspected path. If source ordering or a documented atomic/synchronous boundary excludes an interval, cite that exclusion and move on. Check both command-time interpretation and completion-time evidence. A freshness guard at one stage proves a later stage only through a traced relation to the later state.

Do not stop after finding an unrelated easier defect. Finish or explicitly mark each material ledger path unresolved, even when another finding already exists.

## 4. Report supported conclusions

- **Defect:** cite the contract, changed path, feasible triggering sequence, missing/insufficient guard and observable consequence. Source can establish a defect without runtime reproduction; identify any library premise it depends on.
- **Evidence gap:** name the precise unresolved relation, its impact on a requirement, and the smallest source, documented guarantee or runtime observation needed. Distinguish a demonstrated missing guarantee from a sequence whose reachability is still unknown.
- **Advisory:** label hypothetical risks, unrelated existing defects and new behavior suggestions.

Use existing tests only for conditions they exercise. A missing test alone is not a defect, and a static guard can exclude a counterexample. Preserve the ledger and a short coverage/limits note even when findings exist. With no findings, cite the important counterexamples excluded. Required unresolved evidence prevents a clean pass; it does not authorize a broad test rerun or implementation by the reviewer.
