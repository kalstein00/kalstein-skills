---
name: write-a-skill
description: Create or update a focused agent skill with valid metadata, progressive disclosure, and tested bundled resources. Use when the user asks to write, build, restructure, or improve a reusable skill.
---

# Write a Skill

Create the smallest reusable workflow that reliably changes agent behavior.

1. Infer capability, triggers, inputs, outputs, safety boundaries, and representative use cases from the request and sibling skills. Ask only when a missing choice materially changes the artifact.
2. Write a concise `SKILL.md` with `name` and a discriminating `description`; front-load capability and trigger words.
3. Keep essential decision rules and workflow in the entrypoint. Move rare, detailed, or version-sensitive material to one-level references.
4. Default to no `.codex/scripts`. Add or retain one only when the skill cannot reliably perform a necessary deterministic, repeated, failure-sensitive system-boundary operation directly. The script must own real work or source-of-truth validation; never use it to re-check agent-authored intermediate input, restate the skill's decisions, or wrap a one-off judgment. State the necessity in the owning skill. Add assets only when outputs consume them, and do not create unused scaffolding.
5. Decide whether implicit invocation is appropriate. Codex still requires a clear `description`; use `policy.allow_implicit_invocation: false` in `agents/openai.yaml` for explicit-only skills rather than relying on harness-specific frontmatter.
6. Add or refresh `agents/openai.yaml` when UI metadata, invocation policy, or tool dependencies matter.
7. Validate metadata, links, referenced files, scripts, and one representative trigger/non-trigger scenario. Forward-test complex revisions without leaking the intended answer.

Prefer imperative instructions, outcome and completion criteria, explicit authority boundaries, and stop rules. Test every sentence as a possible no-op: if removing it would not change agent behavior, delete it. State the desired behavior positively; retain a prohibition only for a hard guardrail and pair it with the action to take instead. Remove repeated explanations, generic model knowledge, and examples that do not change behavior.

Treat file length as a progressive-disclosure signal, not a correctness target. Preserve stable product requirements and measured failure guards even when they cost tokens.
