---
name: sync-user-manual
description: Synchronize canonical user documentation with changed UI acceptance during implementation or review. Use when changed behavior, E2E/catalog mappings, or an explicit request affects the user guide; Git finalization only consumes completed evidence.
---

# Sync User Manual

Work within the owning task. Receive its exact candidate and review/write mode. Identify canonical user documentation through project instructions and any existing E2E/catalog mapping. Reuse valid synchronization evidence when the behavior, candidate, and mapped passages still apply.

1. Resolve affected pages from the project's impact tool when one exists; preserve required mappings and justified no-impact entries. Without that tool, trace the changed user journey to the existing documentation owner. Do not invent a required catalog in projects that have none.
2. Compare accepted behavior, current UI source, E2E expectations, and applicable live evidence. Inspect labels, eligibility, lifecycle, empty/error states, and explicit versus automatic actions. Conflicting source or missing required live proof is a gap to resolve before claiming accurate documentation.
3. In review mode, report stale or missing passages read-only. In write mode, update the smallest inaccurate canonical section and include it in the same task candidate. Preserve the project's UI language and actual control names.
4. Check changed links/anchors and applicable focused documentation or mapping gates. Return each affected page with `updated`, `no-change`, `not-applicable`, or `blocked`, its evidence, and verification result. `no-change` names the existing passage and why it still matches; `not-applicable` gives a concrete reason.

Required mappings, documentation, or acceptance that remain unresolved keep the owning task incomplete. Creating or invoking this skill adds no commit, push, tracker-write, or background automation authority.
