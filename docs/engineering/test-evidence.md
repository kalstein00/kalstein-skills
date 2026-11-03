## What it does

Classify an actual focused run as RED, GREEN, or COVERAGE. Compile errors, missing fixtures, skips, and retry-only success cannot masquerade as the intended evidence.

## When to reach for it

The agent selects this inside test-first or coverage workflows when a real command result is available.

## Prerequisites

The target project and the inputs/authority required by the owning task. Preserve its existing setup and documentation.

## Common questions

**Does a zero exit code prove the intended acceptance?**

No. The relevant assertion, test title, mode, and retry/skip metadata also have to match.

## It's working if

- RED fails for the intended missing product behavior.
- GREEN passes the same intended scenario deterministically.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [behavior-test](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/behavior-test.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
