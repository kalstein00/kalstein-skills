---
name: git-commit
description: Finalize a scoped local Git change by reusing existing review and verification, staging only the intended candidate, and committing it. Push only when explicitly requested. Use when implementation is finished and Git finalization remains; review and repair belong to the owning workflow.
---

# Git Commit

Finish the requested Git operation without starting another implementation, review, or test cycle. `implement` already owns its review and commit; this skill is for work left uncommitted outside that completed path. Editing this skill does not authorize committing the workspace.

## Scope and evidence

1. Read `git status --short` and the relevant staged, unstaged, and untracked changes. Identify the requested paths/hunks or, for a push-only request, the exact existing commits and destination. Preserve unrelated work and staging intent; a push-only request does not authorize committing local changes.
2. Reuse the owning task's intent, review result, verification, and applicable UI/User Guide evidence under [execution continuity](../implement/EXECUTION.md). Evidence may be recorded in this conversation or referenced artifacts; no new report, digest, or approval record is required. The owning workflow determines which checks were required.
3. Compare the actual candidate with the reviewed change and the verification's relevant inputs. Matching filenames alone is insufficient. Unchanged, applicable evidence needs no repeat. Identify only the added or altered scope when later edits invalidate it; an unrelated worktree change does not invalidate a reviewed commit set being pushed.
4. If required review, verification, or documentation evidence is missing, stale, failed, or has unresolved blocking findings, report the precise gap and leave finalization pending. Return that gap to the owning task; do not launch `code-review`, spawn a reviewer, rerun tests, repair source/docs, or waive a required check. Current-session review of a direct-route change is sufficient when that was the applicable review requirement.

## Finalize

1. For a commit request, check the candidate's working diff, stage only its intended content, then run `git diff --cached --check -- <candidate-paths>` and inspect the staged diff including additions/deletions. This also checks previously staged and new files. Ensure the actual commit will exclude unrelated staged changes as well as unrelated unstaged files. If the scope cannot be isolated safely, report that boundary before committing.
2. Create one clear Conventional Commit for the scoped outcome. Inspect the resulting commit and worktree state to confirm its contents. If a hook fails or changes the candidate, report the result and reassess affected evidence rather than bypassing the hook, repairing content, or repeatedly committing.
3. Push only when explicitly requested. Confirm the intended branch/remote and exact outgoing commits; preserve unrelated local changes. Use a normal push, then verify the remote ref matches the intended commit. An ambiguous destination, unexpected outgoing commits, or a rejected push is a reported boundary, not permission to force, rebase, or discard work.
4. Report the commit ID and outcome, reused review/verification evidence, push result when requested, and any remaining worktree changes or gaps. Do not close issues, publish releases, or modify tracker state.
