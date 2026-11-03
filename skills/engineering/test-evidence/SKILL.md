---
name: test-evidence
description: Validate focused test output as deterministic RED, GREEN, or COVERAGE evidence. Use as a fundamental capability inside test-first workflows, not to implement behavior.
---

# Test Evidence

Classify an actual focused test run without weakening its signal.

## Modes

- `RED`: the test must fail because the intended behavior is missing or incorrect. An immediate pass, compile error, environment failure, missing fixture, or unrelated assertion failure is not RED.
- `GREEN`: the intended test and required nearby gate must pass deterministically. Skip, `fixme`, quarantine, flaky output, or success only after retry is not GREEN.
- `COVERAGE`: the test records behavior that already exists. An immediate deterministic pass is valid; production behavior should remain unchanged.

## Workflow

1. Read the exact command, exit code, test title, assertion output, and any retry or skip metadata.
2. Match the observed result to the requested mode.
3. When evidence is ambiguous, rerun the narrow command once only if that distinguishes deterministic behavior from tooling noise.
4. Return `blocked` with the mismatched signal and required correction instead of relabeling the result.

## Result

```text
Status: satisfied | blocked | not-applicable
Capability: test-evidence
Mode: RED | GREEN | COVERAGE
Changed paths: None
Command and result:
Evidence:
Blocker:
Required next step:
```
