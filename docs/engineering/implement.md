## What it does

The fork selects one UI, non-UI, coverage, or direct route by actual effect, including behavior changes made through configuration or wiring. UI completion requires actual app operation, inspected screenshots, and observed results in the final response; review includes new and uncommitted task files.

For a visible UI change, the completion report names the state shown in the actual final app, displays the screenshot inline where supported, and provides a link you can reopen after test cleanup. It reuses the image from live verification when that image still represents the delivered result.

For a standalone GitHub ticket, the run also posts and confirms a completion comment with acceptance results, verification, commit/delivery state, documentation, evidence references, and limits. UI evidence includes the actual journey and inspected captures. Local-only artifacts are identified as such; posting the comment does not authorize uploading them. The issue stays open with its labels unchanged until you separately request closure.

`implement` builds work that has already been decided. You point it at a [ticket](https://www.aihero.dev/ai-coding-dictionary/ticket), a [spec](https://www.aihero.dev/ai-coding-dictionary/spec), or the plan you just agreed in the conversation, and it selects the UI, non-UI, or direct verification route, implements the accepted scope, runs [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md) at the end, and commits to the current branch.

Accepted decisions carry forward without another planning interview. Before dependent edits, the [ticket handoff contract](https://github.com/kalstein00/kalstein-skills/blob/main/skills/engineering/implement/TICKET.md) checks that source decisions, exclusions, acceptance, and verification boundaries can be recovered. A necessary unresolved decision returns to the dispatching parent or standalone user; routine implementation choices remain with the worker.

Before behavior-sensitive function use, the shared execution contract checks the intended call against current accepted instructions, resolved dependency/source versions, actual callee defaults and preconditions, and completion guarantees. A short usage note reuses the existing task record. Stale examples or type-correct calls do not substitute for that contract; literal-copy changes keep proportionate checks.

## When to reach for it

You invoke this by typing `/implement` yourself, and the agent won't reach for it on its own. It ships with `disable-model-invocation: true`, so no other skill can call it either. Wherever [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) or [to-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-tickets.md) says "then `/implement` per ticket", that is an instruction to you, not something the agent will do unprompted.

Where the work currently lives decides whether this is the right skill:

| The work is… | Reach for |
| --- | --- |
| A ticket on the tracker | `/implement #42`, one ticket per [session](https://www.aihero.dev/ai-coding-dictionary/session), [clearing](https://www.aihero.dev/ai-coding-dictionary/clearing) context between tickets |
| A spec, not yet split up, and the build spans sessions | [to-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-tickets.md) first, then `/implement` per ticket |
| A spec, and the build is small | `/implement` directly against the spec |
| Only in the conversation you just had, and it's still small | `/implement` right there, in the same window |
| Not written down anywhere yet | [grill-with-docs](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/grill-with-docs.md), or [grill-me](https://github.com/kalstein00/kalstein-skills/blob/main/docs/productivity/grill-me.md) if there's no codebase |
| One concrete behaviour you want test-first, with no spec | [tdd](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/tdd.md) directly |
| Already built, and you want it checked | [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md) directly |

The same-session case is worth naming because the skill's own first line doesn't cover it. `SKILL.md` says "the spec or tickets", which pushes the [model](https://www.aihero.dev/ai-coding-dictionary/model) to look for a file that doesn't exist. If the plan lives only in the thread, say so when you invoke it.

## Prerequisites

`implement` commits to the branch you are on. It does not create one, and it does not ask. Check you are on the branch you want the work on before you start.

If the tickets came from [to-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-tickets.md), [setup-matt-pocock-skills](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/setup-matt-pocock-skills.md) configured the tracker they live on. `code-review` reads the same configuration to find the originating spec at close-out.

## What one run does

A run has six steps, in order:

1. Read the ticket or spec, recover accepted decisions, and check its handoff and test boundaries.
2. Select ui-tdd for UI/mixed behavior, tdd for non-UI behavior at agreed seams, or direct proportionate checks for behavior-preserving documentation, metadata, mechanical, and literal-copy changes. Before behavior edits, resolve material function-use contracts and source-version compatibility. Actual behavior takes precedence over file type.
3. Typecheck often, run single test files as it goes.
4. Verify affected behavior and consuming boundaries, including required acceptance and live checks. Run the full suite when the release workflow requires it or you explicitly request it.
5. Run [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md), then commit to the current branch.
6. For a standalone GitHub ticket, post the completion evidence, read back the comment, and return its URL. Conversation-only work finishes with the report; batch workers return evidence to their orchestrator.

One run covers one ticket. The tickets [to-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-tickets.md) produces are tracer-bullet vertical slices sized to fit a single fresh [context window](https://www.aihero.dev/ai-coding-dictionary/context-window), so the intended rhythm is: clear context, implement one ticket, commit, clear again. Each ticket is self-contained, so you can discard the previous ticket's context.

## Pre-agreed seams

The skill's central idea is the **seam**, the public boundary you observe behaviour at without reaching inside. Tests live at seams. When the seam is agreed before any code exists, the tests last, and you can rewrite the implementation underneath without changing them.

Accepted seams carry forward when the spec, ticket, or earlier agreement identifies the public boundary, explicitly or through an unambiguous public operation. Generic feature approval does not choose an unspecified seam. Only missing or materially changed seam decisions need confirmation. Behavior changes require the selected route's RED/GREEN; direct changes do not invent a failing behavior test.

When an edit follows verification, the implementer records the changed boundary, the checks that cover it, and why retained evidence still applies. Uncertain impact triggers a focused boundary check, expanding to its consuming flow when needed. In a batch, the parent checks that mapping before accepting reused evidence.

## Common questions

**It finished, but my ticket is still open and the acceptance criteria are still unchecked.**

Standalone `implement` leaves a confirmed GitHub completion comment after verification, resolved in-scope review findings, and a scoped commit. It leaves issue state, labels, and acceptance checkboxes unchanged. Ask separately for [close-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/close-spec.md) to verify and close the issue. For [implement-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-tickets.md), the batch parent owns completion comments and confirmed closure before advancing. This matters on a dependency chain because open blockers keep later tickets from starting.

**The implementation committed, but the GitHub comment failed. Is the run complete?**

The implementation remains committed, but tracker delivery is incomplete. The agent preserves its evidence and reports the failure. After an uncertain write it checks comment history before retrying, so recovery reuses a matching comment rather than posting a duplicate. The final response includes the comment URL only after readback confirms it.

**Can I point it at all my tickets at once, or run several in parallel?**

Not with `/implement`: one invocation, one ticket. For a whole spec in one run, use [implement-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-spec.md), which gives each ticket on the ready frontier to a [subagent](https://www.aihero.dev/ai-coding-dictionary/subagent) in its own worktree, then merges the results onto one integration branch. Running several `/implement` sessions side by side in one checkout is worse than unsupported. One field report describes a `git commit --amend` in one session landing on another session's commit, a stash vanishing from `refs/stash`, and commits landing on the wrong branch, all in a single afternoon across three issues. The sessions share one working directory, one index, and one HEAD. Users work around this with git worktrees, but `refs/stash` is shared across worktrees too, so worktrees alone do not fix the stash case.

**Can it open a pull request instead of committing?**

Not built in. It commits straight to the current branch. Several people find this too eager, because the code lands before they can verify it works. There is no configuration flag and no PR mode. People override it in the invocation ("commit to a branch and open a PR") or by editing their local copy of the skill. When the agent does write the PR, [pr](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/pr.md) shapes its body.

**`code-review` says it cannot see my changes.**

The current fork reviews the complete candidate, including staged, unstaged, and new task files against the recorded starting point. A pre-commit candidate does not need an interim commit to become visible. Confirm the same base and path scope reach both review axes; older HEAD-only guidance does not describe the current fork.

Separately, some people do not want the review inside the run at all, because an agent reviewing the code it just wrote is biased toward its own solution. Running [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md) in a fresh session against a fixed point is a valid alternative. The same bias is why that skill runs its two axes in separate sub-agents.

**One ticket burned 150k tokens. Am I using it wrong?**

Probably not. The ticket is more likely too big. A run does codebase exploration, a red-green loop per seam, focused verification, and a review, so a non-trivial ticket exceeding 100k [tokens](https://www.aihero.dev/ai-coding-dictionary/token) is normal rather than a sign something broke. The fix is upstream. Right-size the tickets in [to-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-tickets.md) so each fits one fresh window. If a single ticket keeps going over, split it rather than raising the [effort](https://www.aihero.dev/ai-coding-dictionary/effort) level.

**`/implement #2` in a fresh session worked on something completely unrelated.**

The agent resolved `#2` against another numbered list in context, such as a todo file or checklist, rather than the configured tracker. `implement` now fetches a passed reference from the issue tracker and states its title before starting, and asks when the reference is ambiguous. Check that title matches the ticket you meant; passing the issue URL or `owner/repo#2` removes the ambiguity entirely.

## It's working if

- The session opens by reading the ticket or spec and restating what it will build, rather than asking you what to build.
- The trace shows the selected route and its actual evidence: UI journey and inspected images, non-UI RED/GREEN, or direct package/document checks.
- Behavior-sensitive calls have source-backed version, default/precondition, and completion evidence before dependent edits; unresolved contracts remain visible rather than assumed safe.
- Affected typechecks and focused tests run during the work, and required acceptance checks cover the final candidate.
- The run reaches a commit on your current branch without you prompting it to carry on.
- A standalone GitHub ticket receives a completion comment with verification and evidence, and the final response links it while the issue state and labels remain unchanged.
- The diff is one ticket's worth of change: a vertical slice through every layer, not several tickets swept together.

## Where it fits

`implement` is the build step of the main chain:

```txt
grill-with-docs → to-spec → to-tickets → implement → code-review → retro
```

Its neighbours are [to-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-tickets.md), which produces the tickets it consumes and declares the blocking edges that decide their order; [tdd](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/tdd.md), which supplies the non-UI behavior loop; and [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md), which it runs before committing. It sits downstream of the planning skills and trusts them. It does not re-validate the shape of what it was handed, so a badly-structured map or a horizontally-layered ticket gets built as written.

That trust is why [wayfinder](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/wayfinder.md) merges onto the chain at [to-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-spec.md) rather than looping its map straight into `implement`. Go straight to `implement` from a map only when the effort turned out small.

[ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) is the router over the whole set when you are not sure which flow you are in.
