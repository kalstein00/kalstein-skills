## What it does

Finalize a scoped Git change using already completed review and verification. Missing evidence returns to the owning task rather than starting another repair cycle.

## When to reach for it

Type this skill or ask to commit finished changes; pushing needs its own established authorization.

## Prerequisites

The target project and the inputs/authority required by the owning task. Preserve its existing setup and documentation.

## Common questions

**Does a commit request authorize unrelated staged files?**

No. The intended candidate is isolated while unrelated content and staging are preserved.

## It's working if

- The resulting commit contains only the requested scope.
- The report identifies reused evidence and the actual local/remote delivery state.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
