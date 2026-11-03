---
name: implement-spec
description: "Implement the result of /to-spec and /to-tickets in code."
disable-model-invocation: true
---

You have been provided a spec. This spec should have tickets associated with it, describing how to implement the spec.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is the entire spec implemented on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Start every subagent with a fresh context window.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Implementer subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the spec and tickets to understand the task graph.

2. (optional) Use an **exploration subagent** to conduct any exploration required by the tickets - relevant codebase files or external documentation. Ensure the exploration subagent can save files - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Create the integration branch. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 5 (a branch with no commits ahead of main can't open one), marked as closing the spec and tickets.

4. Use a fresh **implementer subagent** for each ticket, each in its own worktree on its own branch. Each implementer subagent:
   - confirms its worktree is based on the integration branch before starting; preserves unexpected/dirty state and resolves the base without a destructive reset;
   - reads [the execution contract](../implement/EXECUTION.md) and applies `ui-tdd` for UI/mixed behavior, `tdd` for non-UI behavior, or direct checks for documentation/metadata; completes ticket-specific tests, required E2E/live screenshots, and documentation;
   - returns its exact candidate, acceptance evidence, commands/results, inspected screenshot paths and observations, and any deferred integration gates; workers do not start nested `implement`/review/close-out cycles;
   - merges the integration branch tip into its own branch before reporting done

5. Once an **implementer subagent** completes, merge its work to the integration branch with a **merger subagent**.

6. If this changes the **frontier** of available tickets, kick off more **implementer subagents** to work on the new tickets. This allows for maximum concurrency.

7. Once all tickets are integrated, run the applicable final suite and combined acceptance on the integration candidate. Preserve valid earlier evidence; refresh screenshots/live checks when integration changes the covered UI. Call the Skill tool with `code-review` on the complete integration candidate. Fix in-scope issues in a single fresh **implementer subagent** and rerun only invalidated gates. Missing required evidence keeps the affected work incomplete.

8. If a draft PR exists, mark it ready only after final verification/review; closure awaits merge. Otherwise, apply `close-spec` to the authorized tickets then parent, requiring actual acceptance evidence and readback. Report the integration branch, exact delivery state, performed UI journeys, observations, and inspected images under [the UI evidence protocol](../ui-tdd/EVIDENCE.md). This explicit orchestration authorizes bounded close-out of its established ticket set, not unrelated issues.

9. Clean up only task-created worker worktrees whose commits and evidence are preserved; use managed archive tools when supplied. Preserve blocked work and the integration checkout. Push only under established user/PR delivery authority.
