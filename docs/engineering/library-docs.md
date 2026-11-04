## What it does

Find source-backed evidence in a project's pinned copied library documentation. The package does not substitute memory or a different scope for missing evidence.

## When to reach for it

The agent selects this for external-library API or lifecycle questions when a project has copied documentation.

## Prerequisites

A project-configured copied corpus and public search CLI, or the project's documented official-source fallback.

Paths, retrieval engine/model, cache, and library scope come from the target project's instructions and configuration. An originating project's setup is not a portable default.

## Common questions

**Does this plugin contain every library corpus and retrieval engine?**

No. The project supplies the lock, corpus, public CLI, pins, and shared cache configuration.

## It's working if

- Claims cite the selected library version, snapshot, and source range.
- Missing or stale preparation is identified without changing versions silently.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
