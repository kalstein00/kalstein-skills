## What it does

Add a faithful acceptance scenario at the actual app boundary. The target project retains authority over fixtures, catalog mappings, and app-session lifecycle.

## When to reach for it

The agent selects this inside UI work or when asked for existing-behavior E2E coverage.

## Prerequisites

The target project's runnable app, data, approved Agent Browser route, and applicable test/session instructions. Required live capability must be available before production UI edits.

## Common questions

**Must every project adopt a new E2E catalog?**

No. Existing project conventions are honored; catalogs and launch evidence are required where the project already defines them.

## It's working if

- The scenario exercises normal public user behavior.
- Results distinguish a product failure from a selector, environment, or fixture failure.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [ui-tdd](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ui-tdd.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
