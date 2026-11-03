## What it does

Express one expected outcome through a stable public seam in RED or COVERAGE mode. This capability writes the focused test without implementing production behavior.

## When to reach for it

The agent selects this inside a test-first UI workflow or for requested existing-behavior coverage.

## Prerequisites

The target project and the inputs/authority required by the owning task. Preserve its existing setup and documentation.

## Common questions

**Is an immediately passing test a valid RED?**

No. It can be valid COVERAGE for behavior that already exists.

## It's working if

- The test name describes observable behavior.
- The expected value is independent of the implementation and the actual command result is retained.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [test-evidence](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/test-evidence.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
