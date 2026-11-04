---
name: implement-tickets
description: Implement an explicit ticket list sequentially in one checkout, with the parent closing each verified ticket before advancing.
disable-model-invocation: true
---

# Implement Tickets

Implement the supplied tickets through a fresh [implement](../implement/SKILL.md) subagent per ticket, with the batch verification policy below. The parent owns sequencing, context transfer, per-ticket tracker close-out, and final batch verification; each worker owns its ticket's implementation, focused verification, documentation, review, and commit. Explicit invocation authorizes the parent to update and close the supplied implementation tickets as they complete, not the parent PRD/spec or unrelated issues. Creating, editing, or discussing this skill does not execute a batch or mutate tickets.

## Resolve the project workflow

Resolve the repository's sibling `implement` skill and record its absolute `SKILL.md` path for worker prompts. If it is unavailable, report the missing dependency before dispatch; this orchestrator does not bundle a replacement implementation workflow.

Read the target project's applicable instructions and configured tracker. Apply [the execution contract](../implement/EXECUTION.md). Resolve bundled skill paths from the installed plugin and project paths from the checkout. Keep runtime-specific requirements in project guidance.

Read [CLOSEOUT.md](CLOSEOUT.md) before dispatch. Resolve the parent's tracker read, comment, close, and state-readback route and the actual parent/child relationships. Missing required tracker access blocks the queue before implementation; do not silently downgrade to commit-only delivery. Workers return evidence and leave tracker mutations to the parent.

## Model and reasoning effort

Keep the invoking session's current model for every ticket implementer and its Standards/Spec reviewers. Set `reasoning_effort: "medium"` for implementation workers and `reasoning_effort: "high"` for both review workers through the spawn tool's settings. Review findings return to the existing implementation worker for fixes at `medium`.

Use model inheritance only when the tool guarantees the same model; otherwise pass the invoking session's exact model identifier. If the tool requires `fork_turns: "none"` for effort overrides, use it and supply the complete dispatch context explicitly. Prompt text alone does not configure reasoning effort. If the requested model or effort cannot be selected, stop before dispatch and report the missing capability.

Pass this policy to each implementation worker as part of its dispatch contract. The worker carries the resolved model and review effort into `code-review`; the orchestrator checks the actual spawn settings before accepting the result. This policy applies to this batch workflow, leaving standalone `implement` and `code-review` defaults unchanged.

## Prepare the queue

1. Resolve the supplied ticket numbers or URLs through the project's configured issue tracker. State their titles and preserve the supplied order, processing duplicate references once. Fetch linked context and blockers as needed without adding siblings or the parent spec to the implementation scope. Ask only when a reference, scope, or conflicting dependency order cannot be resolved from available evidence.
2. Record the repository, absolute checkout path, current branch, starting commit, and staged, unstaged, and untracked work. Reuse this checkout and branch throughout the batch. Preserve unrelated changes and identify them in worker prompts. Do not create per-ticket branches/worktrees or an integration/merger workflow. If the checkout cannot safely host the work, stop and report the concrete conflict; use another checkout only when the user requests it or an applicable repository rule requires it.
3. Keep a compact queue and continuation checkpoint in the existing task note or handoff, following the project's continuation guidance. Record ticket status, worker, commit/evidence references, relevant lessons, unresolved questions, and next action. Resume from valid completed work rather than repeating it.

## Batch verification policy

Workers follow `implement`'s focused verification. The parent owns batch-wide checks under the project's verification policy, including any project limits on full-suite execution.

- Before dispatch, record the required or explicitly requested batch-wide checks in the existing checkpoint. Assign each check by its coverage. Workers retain ticket-specific acceptance checks. The parent owns checks that apply to the combined candidate.
- Carry the ticket's **Verification** into the existing dispatch and checkpoint. Assign a check to the worker if it proves that ticket's acceptance. Assign a check to the parent if it proves behavior of the combined candidate outside individual ticket acceptance. Record release-owned checks in their existing release workflow. If ticket acceptance depends on an artifact or capability unavailable at that point in the queue, resolve the prerequisite under the existing dispatch rules before starting that ticket.
- Each worker performs the selected route's RED/GREEN, affected tests, typechecking, necessary builds, required E2E/live verification, documentation, and Standards/Spec review before its scoped commit. Its return lists completed checks and explicitly deferred parent gates. Bring forward any check needed to prove that ticket's acceptance before closure; only broader regression/common gates outside its acceptance may remain deferred. A verified ticket can close while those batch gates are pending; the batch remains unverified.
- The parent runs the deferred batch-wide checks once on the final combined candidate, after all workers, reviews, builds, and live checks finish. Run heavy gates sequentially. Reuse existing evidence only when it covers that same candidate and relevant environment under the execution strategy.
- An intermediate broad check requires a concrete unresolved regression or shared-boundary concern. Record the reason and covered candidate; refresh only evidence invalidated by subsequent changes. A diagnostic run does not prove a later final candidate.
- Apply the execution strategy's [verification after a change](../implement/EXECUTION.md) to ticket repairs and final-gate failures. Carry forward unaffected tests, live checks, installed-artifact evidence, and review results with their coverage limits. Before another expensive build, package, installation, or test cycle, record the invalidated evidence and the smallest replacement check. Close that gap and advance when the required gates are satisfied.
- Preserve failed commands, exit codes, counts, and logs. Diagnose failures at the smallest useful boundary and return in-scope repairs to the owning implementation worker with affected verification and review. Repeat a broad gate only when a repair or unresolved concern invalidates its evidence. An unavailable or unresolved final gate leaves the batch incomplete, even when ticket commits exist.

## Run one ticket at a time

4. Before dispatch, check the next ticket's current scope and blockers and apply [the ticket handoff contract](../implement/TICKET.md). Recover missing context from accepted sources; resolve necessary open decisions before giving them to a worker as implementation work. Use verified in-branch implementation evidence to assess code dependencies and require confirmed closure of earlier tickets in this batch; retain unresolved external blockers. If the next ticket cannot proceed, stop the queue and report the remaining tickets as pending rather than silently reordering them.
5. Spawn one implementation subagent for the next ticket, with the dispatch contract below. This skill explicitly authorizes these sequential workers and the subagents required by their loaded `implement` workflow, including `code-review`'s two axes. Wait for this worker and its required subagents to finish before dispatching the next ticket. If subagents or the required `implement` skill are unavailable, report the missing capability rather than replacing this workflow with parent-side implementation or a nested Codex process.
6. Inspect the worker's result and the actual branch/checkout state. Require the ticket's acceptance evidence, review, documentation, and scoped commit, with no unexplained changes or active worker/reviewer. Before closing the ticket, match each required Verification entry to the worker's result or reusable evidence for the relevant candidate, starting state or input, and observed outcome. If required evidence is missing or no longer applies, return the smallest affected check to its owner. Reuse unaffected evidence and the existing final batch run for checks already covered there. Then the parent calls the Skill tool with "close-spec" for that ticket alone, passing the already-loaded [CLOSEOUT.md](CLOSEOUT.md) context: record completion evidence and deferred batch gates, close as completed, read back the closed state, and observe the actual parent's progress when available. Finish this close-out before dispatching the next ticket; a commit or worker success message alone cannot advance the queue. Reuse valid evidence instead of restarting verification/review. If later changes invalidate an earlier closure's acceptance, reconcile the affected ticket under CLOSEOUT.md before proceeding.
7. When a worker encounters a problem, distinguish observed facts, a confirmed cause/fix, and unresolved hypotheses. Send actionable corrections or missing context to the same worker when an in-scope recovery is possible. Retry only with new evidence or a concrete correction; stop on unresolved scope/authorization, missing required capability, or a repeated failure without a new recovery action. Preserve partial changes and report the blocked ticket and pending queue.
8. After confirmed ticket closure, retain the ticket/comment URL, closed state, and observed parent progress in the checkpoint. Pass only relevant, verified lessons to the next worker: affected paths/boundaries, failure symptoms, proven cause/workaround, commands and evidence references, and applicability limits. Keep unresolved hypotheses labeled; do not turn a one-ticket workaround into a global rule. Use compact context pointers rather than copied logs or the full conversation.

## Worker dispatch contract

Begin each worker prompt with `implement #<ticket-number>` and the resolved repository/ticket URL. Include:

- The absolute checkout path, required current branch, and dispatch-time HEAD; all work stays there.
- The absolute path to `implement/SKILL.md`, with instructions to read and apply its route, ticket-specific verification, review, and scoped commit. Loading that skill does not spawn another implementer.
- An explicit verification override: "This is one ticket in an `implement-tickets` batch. The parent owns `implement`'s full-suite step and the listed batch-wide quality gates on the final combined candidate. Run the ticket's focused checks and all required acceptance/E2E/live verification, review, and commit; return the deferred gates without running them." Include the actual parent-owned command list and the ticket-owned checks so the worker and its reviewers use the same completion boundary.
- The resolved model and role-specific spawn settings from **Model and reasoning effort**, including the review policy to pass to `code-review` and explicit context for workers without inherited conversation history.
- The ticket scope and source references, accepted decisions and exclusions, verification boundaries with catch/miss limits, satisfied dependencies with commit/proof references, and any outstanding constraints. The worker fetches the current ticket and confirms its title under `implement`.
- A tracker ownership rule: "Do not post completion comments, change labels/state, or close the ticket. Return acceptance evidence and the scoped commit to the parent; the parent closes this ticket before the next dispatch." Identify ticket-owned acceptance gates separately from deferred batch regression gates.
- Unrelated existing changes to preserve, plus relevant previous-ticket lessons and their evidence/freshness limits. Each worker records its own starting candidate so its review and commit exclude previous tickets and unrelated work.
- Existing verification/review evidence to reuse, its coverage and the boundary-to-check mapping required by `EXECUTION.md`, and the remaining checks. Check the worker's updated mapping before accepting reused evidence. Pass the same scope to reviewers and repair turns so a finding triggers affected verification and review rather than restarting the ticket workflow.
- A return contract: ticket status; commit(s) and changed paths; completed acceptance/verification, review, and documentation evidence; for UI tickets, the performed journey, observed results, final target/candidate, and inspected screenshot paths under `ui-tdd/EVIDENCE.md`; deferred parent gates; model/effort spawn settings used for the implementer and each reviewer; problems encountered and confirmed resolutions; unresolved limitations; remaining worktree changes and active subagents.

Use the available subagent tool directly. Keep one ticket implementer active; its required review subagents remain part of that ticket's workflow. The parent coordinates recovery and evidence transfer instead of implementing alongside the worker.

## Finish

After the queue finishes, verify the final candidate under **Batch verification policy** and record its identity, commands, actual exit codes/results, and evidence references in the existing checkpoint. If the queue stops early, report the completed ticket checks and pending final gates rather than claiming batch completion.

Report completed/closed, blocked, and pending tickets, their commits and completion-comment URLs, actual tracker states and observed parent progress, batch verification results/limitations, and the checkout/branch used. Batch completion requires every requested implementation ticket's evidence, scoped commit, and confirmed closure plus passing final batch gates. Keep the parent PRD/spec open. Retain incomplete status for unresolved acceptance, tracker synchronization, or a required gate. Include workers' UI journeys, observations, and inspected images in the final user response; refresh evidence invalidated by later tickets. A screenshot path dropped during handoff is an evidence gap, not a completed UI check.

This orchestrator's explicit invocation adds per-ticket completion comments, completed closure, configured execution-label cleanup, and bounded reconciliation under CLOSEOUT.md. It adds no automatic push, PR, merge, or parent-spec closure. Disclose local-only commits and pending publication instead of claiming remote delivery. Do not remove the reused checkout.
