---
name: ui-tdd
description: Implement UI features or repair UI regressions test-first, then operate the actual app with Agent Browser and inspect screenshots before reporting completion. Use for interaction, rendering/layout, accessibility behavior, IPC, persistence, or restore changes; literal copy-only edits use direct verification.
---

# UI TDD

Own one visible outcome through live observation, RED, implementation, automated GREEN, and final live evidence. Read [the execution contract](../implement/EXECUTION.md) and [the evidence protocol](EVIDENCE.md) before editing.

## Capability and acceptance

1. Resolve the target project's runtime commands, live URL or Electron target, fixture/source data, applicable E2E conventions, and documentation from its instructions and package configuration. Call the Skill tool with "agent-browser" and attach one unique named session to the actual non-blank target. Verify runtime identity and whether the current source/build is loaded. Reuse a healthy session; refresh attachment after restart, disconnect, or target change.
2. Record the user journey: prerequisites, starting state, actual UI actions, expected visible result, relevant alternate states, and the evidence each criterion needs. Inspect adjacent live controls and reuse their components, tokens, spacing, geometry, typography, and control states. Honor product language and existing design references.
3. Before production edits, prove the live gate works. Repair authorized environment issues through the project workflow. If the required CLI, app, data, or attachment remains unavailable, return `blocked` with the exact boundary. An isolated browser rendering of an Electron component is not the actual Electron target.

## Feature mode

1. Inspect the existing live surface and record the intended difference.
2. Choose a faithful first RED at an agreed public seam. Call the Skill tool separately with "behavior-test" and with "test-evidence" for a smaller logic seam when it expresses part of the outcome; otherwise start with target-authoritative E2E. Do one RED/GREEN slice at a time.
3. Before implementing the visible interaction boundary, add E2E when acceptance depends on interaction, IPC, window lifecycle, persistence, or restore. Call the Skill tool with "e2e-coverage" and validate the intended missing behavior as RED. Preserve the project's stronger coverage requirements.
4. Implement only the active slice. Validate deterministic GREEN for each seam and the affected package gates. A logic test alone cannot complete the visible outcome.
5. Run the final journey on the actual changed app, capture and inspect evidence under `EVIDENCE.md`, and call the Skill tool with "sync-user-manual" to synchronize affected user documentation.

## Regression mode

1. Reproduce the exact symptom live before production fixes: smallest action sequence, actual/expected result, data, timing, and relevant console/log/trace evidence. If it does not reproduce, call the Skill tool with "diagnosing-bugs" for bounded hypothesis-driven probes; report missing evidence rather than inventing a cause.
2. Add a focused target-authoritative E2E regression and observe RED for the product failure. A selector, environment, compilation, or fixture error is not RED.
3. Repair the authoritative state, lifecycle, or rendering owner inside the accepted scope. Preserve diagnostic evidence and avoid permissive fallbacks or relaxed assertions that hide the symptom.
4. Prove the same E2E GREEN, run affected gates, then repeat the original live journey and inspect the final screenshots. Record attempts and reproduction rate for intermittent symptoms; a pass only after retry is not deterministic GREEN.

## Completion

Reuse compatible app sessions and project fixtures. Follow the project's catalog, app-session ownership, and lifecycle rules when present. Keep focused verification with each ticket, even when a batch parent owns broad final gates. Refresh final live evidence after any change that affects the captured behavior.

Return status (`satisfied` or `blocked`), mode, changed paths, target/candidate identity, RED/GREEN and E2E results, performed actions and observations, inspected screenshot paths, documentation result, and remaining gaps. Follow `EVIDENCE.md` in the final user-visible response. Required live or automated evidence that is unavailable remains incomplete; capture success alone is not acceptance.
