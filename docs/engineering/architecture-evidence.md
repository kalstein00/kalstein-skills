## What it does

Measure a Git repository with a deterministic source/AST/Git/graph scanner and return its bounded evidence queue. Metrics are observations for review, not automatic architecture decisions.

## When to reach for it

Type this skill or ask for architecture measurements, rankings, a report, or an explicit continuation.

## Prerequisites

Node 24+, Git, npm, and the scanner's documented pinned preparation. Keep the installed skill directory separate from the target Git repository.

The target project supplies source dependencies, tsconfigs, and any layer rules. Package fixtures and historical source-project validation records do not require that original project's layout or integration harness.

## Common questions

**Does a high score prove a design defect?**

No. The consumer verifies ownership, lifecycle, change cost, and the report's scope and freshness.

## It's working if

- The report states snapshot verification, coverage, and missing measurements.
- A continuation respects the bounded queue and prior reviewed dispositions.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [improve-codebase-architecture](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/improve-codebase-architecture.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
