---
name: behavior-test
description: Write one minimal test through a stable public seam for an explicitly selected RED or COVERAGE cycle. Use as a fundamental capability inside TDD workflows, not as a feature implementation workflow.
---

# Behavior Test

Express one observable behavior with the smallest test that can fail for a useful product reason.

## Inputs

Require the parent workflow to provide:

- the behavior and expected outcome;
- mode: `RED` for missing or incorrect behavior, or `COVERAGE` for behavior that already exists;
- the public seam and focused test command;
- relevant domain, ADR, fixture, and safety constraints.

If the seam or expected outcome is materially ambiguous, return `blocked` before editing.

## Workflow

1. Inspect the nearest behavior tests and select the narrowest real public seam.
2. Derive expected values from a specification, literal, worked example, or fixture independent of the implementation algorithm.
3. Add one focused test named for observable behavior. Mock only unsafe or nondeterministic external boundaries.
4. Run the focused command once and preserve its exit code and failure or pass evidence.
5. Return the structured capability result. Do not change production code.

Avoid private-method assertions, internal call counts, snapshots with no behavior signal, and expectations computed with the implementation algorithm.

## Result

```text
Status: satisfied | blocked | not-applicable
Capability: behavior-test
Mode: RED | COVERAGE
Changed paths:
Command and result:
Evidence:
Blocker:
Required next step:
```

`satisfied` means the test is minimal and the observed command result is available for `test-evidence`; it does not itself declare RED, GREEN, or COVERAGE valid.
