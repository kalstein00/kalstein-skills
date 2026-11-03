## What it does

Keep canonical user documentation aligned with accepted and verified UI behavior in the same task. A no-change result names the existing passage that still matches.

## When to reach for it

The agent selects this when changed behavior or E2E acceptance affects user documentation.

## Prerequisites

The target project and the inputs/authority required by the owning task. Preserve its existing setup and documentation.

## Common questions

**Does the skill require a project-specific impact tool everywhere?**

No. It uses an existing mapping/tool when supplied, otherwise traces the changed user journey to the canonical owner.

## It's working if

- Updated pages use the actual visible control names and workflow.
- The result explains each update, no-change reason, or remaining documentation gap.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [ui-tdd](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ui-tdd.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
