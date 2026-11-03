# Review decisions

Apply this transition only after LLM review of source, verified caller/import evidence, applicable domain/ADR, and
test/runtime evidence. A percentile or cycle alone does not establish a defect. Preserve each
original file/symbol/cluster/violation evidence ID and the reviewed snapshot when recording a decision.

- accepted: create or reference one complete register row with evidence, owned behavior, outcome,
  classification, contracts, verification and dependencies; record its reference on each accepted ID.
- rejected: record why the signal is justified or not actionable and the comparison baseline. A stable
  high fan-in public Interface may be rejected when the callers and tests support its shared responsibility.
- deferred: record the missing evidence or decision. Leave it available for a later audit; use explicit
  continuation to avoid consuming the same item repeatedly in the current snapshot.

One ownership problem may explain both a cycle and a large symbol. After verifying that shared
cause, link their original IDs to the same candidate. The scanner must retain separate typed items;
it does not infer that shared cause, register candidates, accept evidence, or merge candidate identities.
Confirmed rename correspondence retains original/current IDs; unresolved correspondence requires review.

Register execution status (`pending | in-progress | verified | skipped-with-reason`) and ledger
disposition (`accepted | rejected | deferred`) are independent. accepted means accepted for the register,
not implementation verified. Accepted IDs are excluded from repeated scan selection. Rejected entries
follow the structural/history reconsideration rules. Missing comparison evidence means review-needed
and stays outside the candidate queue in comparisonDiagnostics. An unchanged item-observations-v2 identity
suppresses repeat review; that guard preserves every gap and never claims complete measurement. Use the current verified report's baseline
verbatim, including reviewedEvidence; do not invent unavailable values or reconstruct old baselines.
Legacy baselines remain readable. Missing v2 observations are diagnostic, not invented proof of equivalence
or a reason to silently replace the saved decision. Confirmed structural triggers and the 250-commit
history threshold still reopen a rejected item. Type-dependent cycles are measured but excluded from
candidate selection without needing an LLM disposition.

Use the validated ledger owner for an explicitly authorized decision write, preserving concurrent-change
checks and unrelated entries. Normal scan never writes the ledger or commits it. The owning user workflow
controls publication and Git actions. See [schema-compatible examples](evidence-dispositions.md).
