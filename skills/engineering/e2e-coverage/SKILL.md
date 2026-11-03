---
name: e2e-coverage
description: Add or update target-authoritative end-to-end coverage for UI acceptance while preserving project fixtures, test catalogs, and app-session lifecycle. Use inside UI implementation or for explicitly requested coverage of existing behavior.
---

# E2E Coverage

Receive the expected user-visible outcome, mode (RED or COVERAGE), target project, and relevant acceptance criteria from the owning workflow. Read the project's E2E authority, nearby compatible spec, fixture setup, catalog/mappings, and session lifecycle rules before edits. Use any project-specific adapter the instructions require; do not fabricate a universal catalog or replace a real Electron app with a browser-only fixture.

Add one faithful scenario at the actual app boundary. Reuse a compatible session and fixtures; a new scenario alone does not justify another launch/close pair. Assert observed behavior through the public UI and use independent expected values. Preserve required categories, assertion mappings, helper data, and launch-count evidence when the project defines them.

Run the focused scenario, preserve the actual exit code, failure reason, retries/skips, and logs, then call the Skill tool with "test-evidence" to classify the requested RED or COVERAGE. Compilation, environment, missing data, or selector failures do not prove a product RED. GREEN later requires the same intended scenario to pass deterministically.

Run catalog/lifecycle checks only when the relevant boundary changed or the project requires them. Return changed files, command/result, acceptance mapping, session/category information when applicable, documentation impact, and blockers. Do not implement production behavior or claim a still capture replaces the scenario.
