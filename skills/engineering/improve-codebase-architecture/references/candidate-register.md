# Candidate Register

Use one stable row per candidate:

| Field | Meaning |
| --- | --- |
| ID | stable identifier such as `C1` |
| Evidence | concrete code, flow, test, or runtime observations |
| Outcome | behavior or maintenance property that improves |
| Cohesive move | the smallest ownership/Interface change that achieves it |
| Classification | cleanup, ratchet, or architecture |
| Contracts | domain, ADR, public behavior, lifecycle, persistence, diagnostics |
| Verification | focused test/runtime commands and success evidence |
| Dependencies | prerequisite candidate IDs or decisions |
| Status | pending, in-progress, verified, skipped-with-reason |

Close the register before execution. Add or split candidates later only when new evidence changes the architecture boundary; record why the register changed.

Execute in dependency order with at most one `in-progress` item. Preserve the register across compaction or handoff so “execute all” cannot silently shrink.

## Verification failures

Classify before editing again:

- **candidate-caused:** repair inside the same outcome and rerun;
- **pre-existing/unrelated:** preserve evidence and do not widen the candidate;
- **flaky/readiness:** stabilize the environment or rerun the same gate with evidence;
- **scope-expanding:** stop, return the item to pending, and define the new decision or slice.

Repeated local fixes that trade one acceptance dimension for another are evidence of a deeper boundary, not permission for more tuning.

Every terminal row records verification or the exact reason it was skipped. A recommendation is not complete merely because an issue was opened or code moved.

## Supplied analysis

When the user supplies an analysis report, preserve relevant source references and its scope or limitations as ordinary evidence. Verify the owning behavior before registering a candidate. Report which observations were inspected and which remain unverified; updating the original analysis artifact requires a separate request.
