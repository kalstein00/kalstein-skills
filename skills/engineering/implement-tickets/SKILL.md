---
name: implement-tickets
description: Orchestrate an explicit list of tickets sequentially through implement subagents in one checkout, carrying verified lessons between tickets. Use for batch ticket implementation; use implement for a single ticket and implement-spec for a spec's parallel ticket graph.
disable-model-invocation: true
---

# Implement Tickets

Implement the supplied tickets through a fresh [implement](../implement/SKILL.md) subagent per ticket, with the batch verification policy below. The parent owns sequencing, context transfer, and final batch verification; each worker owns its ticket's implementation, focused verification, documentation, review, and commit. Creating or discussing this skill does not execute tickets.

## Resolve the project workflow

Resolve the repository's sibling `implement` skill and record its absolute `SKILL.md` path for worker prompts. If it is unavailable, report the missing dependency before dispatch; this orchestrator does not bundle a replacement implementation workflow.

Read the target project's applicable instructions and configured tracker. Apply [the execution contract](../implement/EXECUTION.md). Resolve bundled skill paths from the installed plugin and project paths from the checkout. Keep runtime-specific requirements in project guidance.

## Model and reasoning effort

Keep the invoking session's current model for every ticket implementer and its Standards/Spec reviewers. Set `reasoning_effort: "medium"` for implementation workers and `reasoning_effort: "high"` for both review workers through the spawn tool's settings. Review findings return to the existing implementation worker for fixes at `medium`.

Use model inheritance only when the tool guarantees the same model; otherwise pass the invoking session's exact model identifier. If the tool requires `fork_turns: "none"` for effort overrides, use it and supply the complete dispatch context explicitly. Prompt text alone does not configure reasoning effort. If the requested model or effort cannot be selected, stop before dispatch and report the missing capability.

Pass this policy to each implementation worker as part of its dispatch contract. The worker carries the resolved model and review effort into `code-review`; the orchestrator checks the actual spawn settings before accepting the result. This policy applies to this batch workflow, leaving standalone `implement` and `code-review` defaults unchanged.

## Prepare the queue

1. Resolve the supplied ticket numbers or URLs through the project's configured issue tracker. State their titles and preserve the supplied order, processing duplicate references once. Fetch linked context and blockers as needed without adding siblings or the parent spec to the implementation scope. Ask only when a reference, scope, or conflicting dependency order cannot be resolved from available evidence.
2. Record the repository, absolute checkout path, current branch, starting commit, and staged, unstaged, and untracked work. Reuse this checkout and branch throughout the batch. Preserve unrelated changes and identify them in worker prompts. Do not create per-ticket branches/worktrees or an integration/merger workflow. If the checkout cannot safely host the work, stop and report the concrete conflict; use another checkout only when the user requests it or an applicable repository rule requires it.
3. Keep a compact queue and continuation checkpoint in the existing task note or handoff, following the project's continuation guidance. Record ticket status, worker, commit/evidence references, relevant lessons, unresolved questions, and next action. Resume from valid completed work rather than repeating it.

## Batch verification policy

This policy replaces `implement`'s per-invocation full-suite step only for workers dispatched by this skill. Standalone `implement` keeps its existing behavior.

- Before dispatch, record the applicable full suite and batch-wide quality commands in the existing checkpoint. Assign each check to the worker or parent by its coverage, not its name. Workers retain ticket-specific acceptance checks; only broad regression and common quality gates move to the parent.
- Each worker performs the selected route's RED/GREEN, affected tests, typechecking, necessary builds, required E2E/live verification, documentation, and Standards/Spec review before its scoped commit. Its return lists completed checks and explicitly deferred parent gates. A ticket may advance with these gates pending; the batch remains unverified.
- The parent runs the deferred full suite and common quality gates once on the final combined candidate, after all workers, reviews, builds, and live checks finish. Run heavy gates sequentially. Reuse existing evidence only when it covers that same candidate and relevant environment under the execution strategy.
- An intermediate broad check requires a concrete unresolved regression or shared-boundary concern. Record the reason and covered candidate; refresh only evidence invalidated by subsequent changes. A diagnostic run does not prove a later final candidate.
- Apply the execution strategy's [verification after a change](../implement/EXECUTION.md) to ticket repairs and final-gate failures. Carry forward unaffected tests, live checks, installed-artifact evidence, and review results with their coverage limits. Before another expensive build, package, installation, or test cycle, record the invalidated evidence and the smallest replacement check. Close that gap and advance when the required gates are satisfied.
- Preserve failed commands, exit codes, counts, and logs. Diagnose failures at the smallest useful boundary and return in-scope repairs to the owning implementation worker with affected verification and review. Repeat a broad gate only when a repair or unresolved concern invalidates its evidence. An unavailable or unresolved final gate leaves the batch incomplete, even when ticket commits exist.

## Run one ticket at a time

4. Before dispatch, check the next ticket's current scope and blockers. A previous ticket's verified implementation on this branch may satisfy a dependency while its issue remains OPEN; retain unresolved external blockers. If the next ticket cannot proceed, stop the queue and report the remaining tickets as pending rather than silently reordering them.
5. Spawn one implementation subagent for the next ticket, with the dispatch contract below. This skill explicitly authorizes these sequential workers and the subagents required by their loaded `implement` workflow, including `code-review`'s two axes. Wait for this worker and its required subagents to finish before dispatching the next ticket. If subagents or the required `implement` skill are unavailable, report the missing capability rather than replacing this workflow with parent-side implementation or a nested Codex process.
6. Inspect the worker's result and the actual branch/checkout state. Advance only when the ticket's required acceptance evidence, review, documentation, and scoped commit are present and no unexplained ticket changes or active worker/reviewer remain. Reuse valid verification; inspect evidence gaps instead of rerunning unchanged tests or adding a batch-wide review cycle. Changes made by later tickets invalidate earlier evidence only where they affect its covered behavior; send that specific gap to the current worker before advancing.
7. When a worker encounters a problem, distinguish observed facts, a confirmed cause/fix, and unresolved hypotheses. Send actionable corrections or missing context to the same worker when an in-scope recovery is possible. Retry only with new evidence or a concrete correction; stop on unresolved scope/authorization, missing required capability, or a repeated failure without a new recovery action. Preserve partial changes and report the blocked ticket and pending queue.
8. After a completed ticket, pass only relevant, verified lessons to the next worker: affected paths/boundaries, failure symptoms, proven cause/workaround, commands and evidence references, and applicability limits. Keep unresolved hypotheses labeled; do not turn a one-ticket workaround into a global rule. Use compact context pointers rather than copied logs or the full conversation.

## Worker dispatch contract

Begin each worker prompt with `implement #<ticket-number>` and the resolved repository/ticket URL. Include:

- The absolute checkout path, required current branch, and dispatch-time HEAD; all work stays there.
- The absolute path to `implement/SKILL.md`, with instructions to read and apply its route, ticket-specific verification, review, and scoped commit. Loading that skill does not spawn another implementer.
- An explicit verification override: "This is one ticket in an `implement-tickets` batch. The parent owns `implement`'s full-suite step and the listed batch-wide quality gates on the final combined candidate. Run the ticket's focused checks and all required acceptance/E2E/live verification, review, and commit; return the deferred gates without running them." Include the actual parent-owned command list and the ticket-owned checks so the worker and its reviewers use the same completion boundary.
- The resolved model and role-specific spawn settings from **Model and reasoning effort**, including the review policy to pass to `code-review` and explicit context for workers without inherited conversation history.
- The ticket scope, accepted decisions, satisfied dependencies with commit/proof references, and any outstanding constraints. The worker fetches the current ticket and confirms its title under `implement`.
- Unrelated existing changes to preserve, plus relevant previous-ticket lessons and their evidence/freshness limits. Each worker records its own starting candidate so its review and commit exclude previous tickets and unrelated work.
- Existing verification/review evidence to reuse, changes that invalidate it, and the remaining checks. Pass the same scope to reviewers and repair turns so a finding triggers affected verification and review rather than restarting the ticket workflow.
- A return contract: ticket status; commit(s) and changed paths; completed acceptance/verification, review, and documentation evidence; for UI tickets, the performed journey, observed results, final target/candidate, and inspected screenshot paths under `ui-tdd/EVIDENCE.md`; deferred parent gates; model/effort spawn settings used for the implementer and each reviewer; problems encountered and confirmed resolutions; unresolved limitations; remaining worktree changes and active subagents.

Use the available subagent tool directly. Keep one ticket implementer active; its required review subagents remain part of that ticket's workflow. The parent coordinates recovery and evidence transfer instead of implementing alongside the worker.

## Finish

After the queue finishes, verify the final candidate under **Batch verification policy** and record its identity, commands, actual exit codes/results, and evidence references in the existing checkpoint. If the queue stops early, report the completed ticket checks and pending final gates rather than claiming batch completion.

Report completed, blocked, and pending tickets, their local commits, batch verification results and limitations, and the checkout/branch used. Batch completion requires every requested ticket's implementation evidence and scoped commit plus passing final batch gates. Retain incomplete status for any unresolved ticket or gate. Include workers' UI journeys, observations, and inspected images in the final user response; refresh evidence invalidated by later tickets. A screenshot path dropped during handoff is an evidence gap, not a completed UI check.

Inherit `implement`'s delivery authority: this batch wrapper adds no automatic push, PR, merge, ticket closure, or parent-spec closure. Perform separately requested delivery or close-out through its owning workflow. Do not remove the reused checkout.
