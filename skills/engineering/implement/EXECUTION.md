# Execution contract

Apply this contract to the target project, not to the installed plugin directory. Project instructions own product decisions, runtime commands, tool routing, and stronger verification requirements.

## Resolve once

Read applicable project instructions and the relevant tracker, domain, and ADR pointers. Reuse an existing `CONTEXT.md`/`CONTEXT-MAP.md` or `GLOSSARY.md`/`GLOSSARY-MAP.md` according to the project's routing; do not create a competing glossary. Resolve relative project paths from the target checkout. Resolve bundled skill paths from this installed package. Never import a developer's absolute paths, caches, or project-specific commands into another project.

For each model-invoked route or capability named below, call the Skill tool with that one skill name, one call per skill, if available. Otherwise read the bundled sibling `SKILL.md` and apply it in the current task. This is instruction loading, not a reason to launch another agent or nested Codex process. Explicit-only orchestrators run only when requested. Use fresh contexts for explicitly required subagents and supply their checkout, scope, instructions, and evidence pointers.

## Select one route

| Accepted change | Route |
| --- | --- |
| New or changed UI interaction, rendering/layout behavior, accessibility behavior, IPC, persistence, or restore | Call the Skill tool with "ui-tdd"; use feature or regression mode |
| New or changed non-UI behavior | Call the Skill tool with "tdd"; observe RED then GREEN at the agreed public seam |
| Coverage for existing behavior | Call the Skill tool with "behavior-test" or "e2e-coverage", according to the actual seam, in COVERAGE mode |
| Literal copy, mechanical rename, configuration, documentation, or metadata | Direct change and proportionate checks |

Mixed UI/logic work keeps `ui-tdd` as the outer route. A fixed label replacement needs no invented RED; check its live appearance when wrapping or truncation may change. Computed text, conditional visibility, action meaning, validation, or accessibility behavior crosses the UI route boundary. Missing required live capability blocks UI production edits. Package tests and screenshots from another target do not replace it.

## Evidence and scope

Record the starting commit and staged, unstaged, and new task files. Preserve unrelated work. Acceptance criteria and requested behavior drive edits and review; heuristics and metrics need concrete evidence before they justify work. Inspect the affected state owner, event wiring, callers, and lifecycle before behavior-sensitive edits. Use project-pinned copied library documentation first when available, then official documentation; distinguish source evidence from inference. Diagnose at the failing boundary before selecting a cause. Fix authoritative state rather than hiding missing handlers or stale restore data behind silent fallbacks.

Reuse applicable instructions, decisions, and verification across stages. Keep candidate identity, covered behavior, environment, commands/results, evidence paths, and material limits in the existing task note. A stage change, commit, or new filename alone does not invalidate evidence. Refresh only checks affected by changes or a concrete unresolved concern. Required RED/GREEN, final live verification, and semantic review remain separate obligations.

Run focused checks during implementation and the project's required final gates on the final candidate. Documentation-only changes need relevant package/document checks, not application suites. Save verbose output to temporary logs, preserve actual exit codes and skip/retry counts, and inspect the failing range before retrying. Missing or failing required evidence leaves work incomplete.

## Documentation, review, and delivery

Update affected canonical design, user, and test documentation in the same task. Distinguish accepted, implemented, and verified behavior. Reuse user-manual synchronization when it covers the candidate. A no-change result names the existing passage or concrete reason, rather than silently omitting documentation.

Review the complete task candidate, including untracked files, against intent and project standards. `implement` owns its review and scoped commit; `implement-spec` owns one integration review; `git-commit` only consumes finished evidence. Resolve findings with affected checks, not another full workflow. Push, PR publication, and tracker closure follow the user's established delivery authority. Installing a skill does not authorize them.

## UI delivery evidence

`ui-tdd` owns the live interaction and screenshot protocol in its `EVIDENCE.md`. Carry its final-candidate evidence into the ticket result, batch result, PR, and final chat response. Summarize the action sequence and observed result, show the inspected screenshot inline when supported, and state unverified behavior. A link without the interaction result or an image saved but never inspected does not complete UI verification. Redact sensitive content before capture or delivery; preserve enough context to judge the result. Publishing images or tracker comments needs the established delivery authority.
