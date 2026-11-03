## What it does

Orient the reader one abstraction layer above an unfamiliar code area. Verified ownership, callers, state, and seams are separated from inference.

## When to reach for it

Type this skill or ask for the bigger architectural picture around a confusing code area.

## Prerequisites

The target project and the inputs/authority required by the owning task. Preserve its existing setup and documentation.

## Common questions

**Does orientation authorize a refactor?**

No. It is read-only unless implementation is separately requested.

## It's working if

- The map points to actual entrypoints and owners.
- The report ends with material unknowns and the next useful investigation.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [codebase-design](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/codebase-design.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
