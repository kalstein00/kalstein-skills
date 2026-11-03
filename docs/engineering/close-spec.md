## What it does

Verify actual acceptance evidence and close only the authorized tracker target. A commit or closed child issue alone does not establish completion.

## When to reach for it

Type this skill or request completion verification or closure of a named ticket/spec.

## Prerequisites

The target project and the inputs/authority required by the owning task. Preserve its existing setup and documentation.

## Common questions

**Does implementation automatically close every related issue?**

No. Closure follows the established target scope and delivery authority, with incomplete acceptance left open.

## It's working if

- The completion record maps acceptance to implementation and verification.
- After an authorized mutation, the resulting tracker state is read back.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
