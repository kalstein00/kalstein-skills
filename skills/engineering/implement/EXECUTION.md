# Execution contract

Apply this contract to the target project, not to the installed plugin directory. Project instructions own product decisions, runtime commands, tool routing, and stronger verification requirements.

## Resolve once

Read applicable project instructions and the relevant tracker, domain, and ADR pointers. Reuse an existing `CONTEXT.md`/`CONTEXT-MAP.md` or `GLOSSARY.md`/`GLOSSARY-MAP.md` according to the project's routing; do not create a competing glossary. Resolve relative project paths from the target checkout. Resolve bundled skill paths from this installed package. Never import a developer's absolute paths, caches, or project-specific commands into another project.

For ticket work, apply [the ticket handoff contract](TICKET.md) before dependent edits. Recover accepted decisions and verification boundaries from the ticket and its sources; report a necessary unresolved decision to the dispatching parent or standalone user. Reuse completed handoff checks when the ticket and accepted scope are unchanged.

For each model-invoked route or capability named below, call the Skill tool with that one skill name, one call per skill, if available. Otherwise read the bundled sibling `SKILL.md` and apply it in the current task. This is instruction loading, not a reason to launch another agent or nested Codex process. Explicit-only orchestrators run only when requested. Use fresh contexts for explicitly required subagents and supply their checkout, scope, instructions, and evidence pointers.

## Select one route

Classify the actual effect before the file type. Behavior changes take precedence over the direct route, including changes made through configuration, wiring, or metadata. A setting that changes authentication or restore behavior uses the corresponding non-UI or UI route; direct checks apply when the change preserves behavior or only changes literal copy.

| Accepted change | Route |
| --- | --- |
| New or changed UI interaction, rendering/layout behavior, accessibility behavior, IPC, persistence, or restore | Call the Skill tool with "ui-tdd"; use feature or regression mode |
| New or changed non-UI behavior | Call the Skill tool with "tdd"; observe RED then GREEN at the agreed public seam |
| Coverage for existing behavior | Call the Skill tool with "behavior-test" or "e2e-coverage", according to the actual seam, in COVERAGE mode |
| Literal copy, mechanical rename, configuration, documentation, or metadata | Direct change and proportionate checks |

Mixed UI/logic work keeps `ui-tdd` as the outer route. A fixed label replacement needs no invented RED; check its live appearance when wrapping or truncation may change. Computed text, conditional visibility, action meaning, validation, or accessibility behavior crosses the UI route boundary. Missing required live capability blocks UI production edits. Package tests and screenshots from another target do not replace it.

## Evidence and scope

### Before behavior-sensitive edits

Resolve the intended function use before adding, changing, or reusing a call across a module, library, or state/lifecycle interface. Reuse valid evidence for unchanged use; literal-copy and mechanical changes with no behavior impact need only a short applicability statement.

1. Reconcile applicable instructions, accepted domain/ADR decisions, and the current implementation. Check nearby examples and existing callers against that contract. A stale instruction or example is not proof of current behavior. Resolve a documented supersession from its authoritative source; if the intended contract remains contradictory, keep dependent edits pending, identify the unresolved decision, and continue independent work.
2. For external behavior, obtain version/source identity and compatibility evidence for the required contract before relying on the call. If the project has copied documentation, call the Skill tool with "library-docs" first; [library-docs](../library-docs/SKILL.md) owns those checks. Otherwise obtain the same evidence through the project's approved versioned official-source route. Keep dependent edits pending for unresolved discrepancies or guarantees, and preserve dependency/documentation pins unless the task authorizes changing them.
3. Inspect the callee's types and implementation where available, its defaults, and the relevant established callers. Establish input identity/units/coordinate frame, required state and ordering, omitted-argument effects, side effects/errors, and what return, acknowledgement, readiness, or events actually prove. Separate the external symbol's guarantees from the caller's required outcome. Cover only the facts material to this use.
4. Retain a compact usage note in the existing task record: intended operation, source/version references, relevant defaults/preconditions, completion condition, and remaining uncertainty. Decide whether the available contract supports the call. Resolve a missing guarantee through source, matching official evidence, or the smallest focused observation before dependent production edits; do not substitute an assumed guarantee. Feed a relevant misuse or state-ordering counterexample into the selected route's agreed RED/GREEN seam. This adds neither a separate test lifecycle nor a broad-suite requirement.

Ordinary documentation changes do not need library retrieval solely because they name a package. Recheck only the contract facts affected by a changed dependency, source, call, or assumption. The note is evidence for implementation and later review, not a new approval form or generated checklist.

### Candidate evidence

Record the starting commit and staged, unstaged, and new task files. Preserve unrelated work. Acceptance criteria and requested behavior drive edits and review; heuristics and metrics need concrete evidence before they justify work. Inspect the affected state owner, event wiring, callers, and lifecycle before behavior-sensitive edits. Reuse the function-use evidence above and distinguish source evidence from inference. Diagnose at the failing boundary before selecting a cause. Fix authoritative state rather than hiding missing handlers or stale restore data behind silent fallbacks.

Reuse applicable instructions, decisions, and verification across stages. Keep candidate identity, covered behavior, environment, commands/results, evidence paths, and material limits in the existing task note. A stage change, commit, or new filename alone does not invalidate evidence. Refresh only checks affected by changes or a concrete unresolved concern. Required RED/GREEN, final live verification, and semantic review remain separate obligations.

When reusing evidence after an edit, record the changed boundary, which checks cover it, and which previous results remain applicable and why. State, event, lifecycle, and rendering changes refresh their affected integration/E2E/live checks; build, dependency, fixture, and runtime configuration changes refresh checks that depend on those inputs. Documentation-only edits use document/package checks and preserve unrelated runtime evidence. If impact is uncertain, run the smallest check at the affected public boundary; expand to its consuming flow if that check cannot establish coverage. Evidence with an unresolved applicability gap cannot prove acceptance. In a batch, the worker returns this mapping and the parent checks it before acceptance or closure.

For an individual issue, verify the final candidate with focused checks selected from the affected behavior and its consuming boundaries. Include affected typechecking and the route's required acceptance, E2E, and live checks. Expand the focused selection when evidence identifies another affected boundary. Use the full suite when required by the release workflow or explicitly requested by the user. Documentation-only changes use relevant package/document checks. Save verbose output to temporary logs, preserve actual exit codes and skip/retry counts, and inspect the failing range before retrying. Missing or failing required evidence leaves work incomplete.

## Documentation, review, and delivery

Update affected canonical design, user, and test documentation in the same task. Distinguish accepted, implemented, and verified behavior. Reuse user-manual synchronization when it covers the candidate. A no-change result names the existing passage or concrete reason, rather than silently omitting documentation.

Review the complete task candidate, including untracked files, against intent and project standards. `implement` owns its review and scoped commit; `implement-spec` owns one integration review; `git-commit` only consumes finished evidence. Resolve findings with affected checks, not another full workflow. Push, PR publication, and tracker closure follow the user's established delivery authority. Installing a skill does not authorize them.

Standalone `implement` owns the completion comment and confirmed readback for a GitHub ticket under [its delivery instructions](SKILL.md), while leaving issue state and labels unchanged. An explicit `implement-tickets` invocation authorizes its parent orchestrator to comment on and close each supplied implementation ticket after ticket-specific acceptance, before the next dispatch. The batch's CLOSEOUT.md owns readback, actual parent progress, deferred batch gates, and recovery. Workers do not mutate the tracker, and the parent PRD/spec remains open.

## UI delivery evidence

`ui-tdd` owns the live interaction and screenshot protocol in its `EVIDENCE.md`. Carry its final-candidate evidence into the ticket result, batch result, PR, and final chat response. Summarize the action sequence and observed result, show the inspected screenshot inline when supported, and state unverified behavior. A link without the interaction result or an image saved but never inspected does not complete UI verification. Redact sensitive content before capture or delivery; preserve enough context to judge the result. Publishing images or tracker comments needs the established delivery authority.
