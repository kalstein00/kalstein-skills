---
name: agent-browser
description: Operate and inspect websites or Electron apps through the Agent Browser CLI, including navigation, forms, screenshots, and live UI verification. Use the target project's wrapper and pinned runtime when supplied.
---

# Agent Browser

Resolve the installed CLI and the target project separately. This skill supplies the workflow, not the Agent Browser executable.

1. Inspect the project's tool routing, package scripts, wrapper, and lockfile. Use its required wrapper for every command. Without a project route, resolve an installed CLI and its version; do not assume a global installation or invent a wrapper path. Prepare missing tools only within existing authorization and preserve project pins.
2. Load the installed, version-matched core instructions completely using that route's `skills get core --full`. Load the installed `electron` instructions for Electron, or another specialized instruction set only when the task needs it. Use the installed CLI's help if discovery syntax differs; do not guess unsupported flags from web examples.
3. Create one unique named session and pass it on every command. Attach to the intended non-blank URL/window and record the target identity. For Electron, attach to the actual app's configured CDP target; a separate default browser session is not a substitute. Keep session isolation and reuse a healthy attachment.
4. Inspect the current UI snapshot, act through current selectors/refs, and wait for the relevant observable state. Refresh stale refs after changes. Read logs/console and state evidence to diagnose a failed action before retrying.
5. Save screenshots to explicit task artifact paths. Open selected images with the available image viewer and inspect their pixels. For acceptance work, follow `ui-tdd`'s [evidence protocol](../ui-tdd/EVIDENCE.md); a saved image or accessibility tree alone is not a visual check.

Project-specific launch commands, CDP ports, cache paths, and E2E session ownership remain in project instructions. Honor a stronger project route. Report the exact CLI, runtime, attachment, or data failure when the required target cannot be reached; package tests cannot replace live verification. Do not register an MCP server as a CLI fallback.
