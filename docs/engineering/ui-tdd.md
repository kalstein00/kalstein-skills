## What it does

Deliver one visible outcome through live observation, test-first implementation, and final real-app evidence. Completion includes screenshots opened for pixel inspection and the actual user journey.

Selected screenshots are kept with the task artifacts so you can reopen them after the app or test session closes. If a later change affects the captured result, the report uses an inspected replacement from the final app.

## When to reach for it

Type this skill or let the agent select it for UI behavior, rendering/layout, accessibility, IPC, persistence, or restore changes. Literal copy-only changes use proportionate direct verification.

## Prerequisites

The target project's runnable app, data, and applicable test/session instructions. The workflow uses a project-approved Agent Browser route when provided. Otherwise, if no CLI is installed, it installs the official CLI on first UI use using Node.js and npm, and installs its browser binary if needed. The CLI supplies its own version-matched core and Electron guides. Required live capability must be available before production UI edits.

## Common questions

**Does the plugin install Agent Browser?**

The plugin does not install it at plugin installation time. On the first UI task, the agent uses the project route or an existing CLI; if neither exists, it attempts to install the official CLI. Missing prerequisites or failed installation leave UI work blocked.

**Is saving a screenshot enough?**

No. The agent operates the actual changed app, opens the selected image, checks the result in context, and includes observations and images in the completion report.

## It's working if

- The final response shows the inspected result and names the performed actions.
- Automated results and the final app/candidate are explicit; missing required evidence remains incomplete.

## Where it fits

This is a reusable capability or focused standalone workflow. It works with [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
