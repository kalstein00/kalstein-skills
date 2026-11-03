---
name: close-spec
description: Verify completion and close a spec or ticket when requested, using current tracker relationships, acceptance criteria, and implementation evidence. Use existing project scope and acceptance evidence without requiring a new issue schema.
---

# Close Spec

This extension owns requested tracker close-out; upstream `implement` ends at review and commit. A request to inspect completion only does not authorize tracker writes.

When called by an explicitly invoked `implement-spec`, its established ticket set and parent are authorized close-out targets. Process each target separately, children before parent, using the same evidence gates below. A standalone parent-only request still does not authorize closing its children.

1. Read the target body, comments, current scope, blockers, and completion evidence through `docs/agents/issue-tracker.md`. For a parent, establish the complete child set from native sub-issues and explicit body/comment links. If completeness is uncertain, keep it open and identify the missing evidence.
2. Check each ticket's acceptance criteria or the spec's user stories and testing decisions against actual implementation and verification. Honor existing numbered criteria, mappings, and approved scope decisions when present, but do not require new `Parent AC contribution` fields, an Approval Record, or an issue-body migration. A commit or a closed state alone does not prove fulfillment.
3. For a parent, require all required children and blockers to be resolved. A duplicate, superseded, or not-planned closure discharges work only when a completed replacement or explicit scope decision accounts for it. Decision-only work uses its recorded human decision; implementation work needs connected change and verification evidence.
4. Check combined behavior when completion depends on several tickets. UI claims require the applicable `ui-tdd` live/E2E evidence and inspected screenshots with the performed journey. Reuse valid evidence; carry the observed results and image references into close-out; report missing coverage instead of inferring a pass or routinely rerunning all tests.
5. Report completed and missing acceptance evidence. If anything required remains unproven, keep the target open. When closure was requested and all scope is proven, post one concise completion comment, close only the requested target, and remove stale execution/ready labels from that target. Do not close siblings or a parent implicitly.
6. Read back the target state after mutation. An uncertain write requires reconciliation before retrying; report the actual result.

Preserve historical issue bodies and approval comments. Resolve conflicting scope with the maintainer instead of rewriting history or treating the old revision-hash system as a new prerequisite.
