## What it does

Find source-backed evidence for the intended function use in a project's pinned copied library documentation. The resolved dependency version, copied snapshot, and upstream source identity are checked separately, so a target version label cannot silently make rolling or older documentation compatible.

## When to reach for it

The agent selects this for external-library API or lifecycle questions when a project has copied documentation.

## Prerequisites

A project-configured copied corpus and public search CLI, or the project's documented official-source fallback.

Paths, retrieval engine/model, cache, and library scope come from the target project's instructions and configuration. An originating project's setup is not a portable default.

For the requested contract, the evidence covers relevant parameters and defaults, preconditions, return/completion meanings, and event ordering. When sources differ from the resolved dependency, a narrow comparison with matching official documentation, types, or source can establish compatibility. Unrelated parts of the corpus need no refresh.

## Common questions

**Does this plugin contain every library corpus and retrieval engine?**

No. The project supplies the lock, corpus, public CLI, pins, and shared cache configuration.

**Does a matching packageVersion field mean the documentation matches the installed release?**

No. It may identify the requested target while the original source is rolling, legacy, or from another release. The result states whether the needed contract is version-matched, supported despite the source difference, or unresolved. A familiar name or matching function signature does not establish event, default, or completion semantics.

**Will a source-version difference stop every change?**

Only the required contract needs resolution. Matching official evidence can support unchanged semantics without changing dependencies or documentation pins. Unsupported behavior remains an explicit gap before dependent implementation; literal documentation changes do not require a library lookup merely because they name a package.

## It's working if

- Claims distinguish the resolved dependency, document snapshot/revision, and upstream release/tag or rolling source.
- The requested parameter/default, readiness, or completion claim has a source reference and an explicit compatibility status.
- Missing or stale preparation is identified without changing versions silently.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
