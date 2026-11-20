---
name: implement-tickets
description: Implement and close an explicit ordered ticket list in the current session with a batch Goal and a durable checkpoint.
disable-model-invocation: true
---

# Implement Tickets

Implement one ticket at a time in the invoking session on the same checkout and branch. Explicit invocation with a ticket list authorizes one batch Goal and [close-out](CLOSEOUT.md) for those implementation tickets. The parent PRD/spec stays open. Editing or discussing the skill leaves the tracker and Goals untouched.

## Start the batch

1. Read project instructions, [EXECUTION.md](../implement/EXECUTION.md), and [CLOSEOUT.md](CLOSEOUT.md). Resolve ticket numbers or URLs through the configured tracker, state their titles, and deduplicate while preserving first occurrence order. Confirm scope, parent relationships, and access for comment, closure, and readback. Resolve conflicts in scope or dependency order before starting.
2. Inspect the current Goal before asking about review settings or writing a checkpoint. Continue a matching active batch using its saved checkout, ordered ticket URLs, and checkpoint. If a different unfinished Goal occupies the thread, the matching Goal is inactive and unfinished, or the host lacks Goal support, report the blocker and preserve existing Goal state. An explicit new invocation can start a batch with no Goal or replace a completed Goal. On automatic continuation, use the existing Goal and checkpoint.
3. For each new batch, ask the user once which model and reasoning effort to use for both review axes. Default each field to the invoking session's current value as reported by the runtime and accept overrides for either field, for example `gpt-6.2-astra` at `high`. Ask for an explicit value for any field the runtime cannot resolve. Confirm both concrete values before implementation. If the host cannot set a confirmed value for reviewers, report the blocker and obtain a supported choice.
4. Create a durable checkpoint in the project's existing task note or handoff location, or a batch-specific local task note outside the ticket commit scope when there is no convention. Record the ordered ticket URLs, repository, absolute checkout, branch, starting HEAD, staged, unstaged and untracked work to preserve, both confirmed review values, required batch-wide checks, and next action.
5. Create the batch Goal using the host's native Goal capability and confirm it is active before implementation. Put the exact ordered ticket URLs, the absolute paths to this skill and the checkpoint, and the completion condition in the objective. Completion requires a scoped commit, verified acceptance and confirmed completed tracker state for every listed ticket, plus passing required batch checks on the final combined candidate.

## Run one ticket at a time

At every ticket boundary and on every continuation, reload the checkpoint and these instructions. Require the recorded checkout and branch before resuming work, even if another branch points to the same HEAD. Report a mismatch and leave the ticket pending on the recorded branch. Reconcile the current ticket and stage with HEAD, relevant evidence, and tracker state. Resume at the first outstanding step. Reuse verified commits, matching completion comments, and valid checks. An uncertain tracker write requires reconciliation before retrying. Keep the input order even when a blocker prevents advancement.

1. Fetch the next ticket and apply [TICKET.md](../implement/TICKET.md). Confirm its current scope, blockers and accepted decisions, and record its starting HEAD, path boundary, and **Verification** entries. Carry forward only relevant verified dependencies and lessons with evidence pointers. Check confirmed closure of earlier tickets before advancing.
2. Read and apply the route in [implement](../implement/SKILL.md) directly in this session, supplying the checkpointed branch and concrete review settings. Use its single `code-review` invocation path for the independent Standards and Spec reviews and any follow-up reviews. Apply the batch verification policy below to separate ticket acceptance checks from final batch checks. Diagnose failures at the smallest useful boundary and refresh affected evidence under EXECUTION.md.
3. Save the commit and evidence before tracker writes. For UI tickets, retain the journey, observations, final candidate/build, and inspected screenshot references under [the UI evidence protocol](../ui-tdd/EVIDENCE.md). Apply CLOSEOUT.md for the supplied ticket before beginning the next one. Save confirmed tracker state, comment URL, available parent progress, and the next action. Checkpoint before any required user wait or turn boundary.

Keep the active ticket, stage, concrete review settings, evidence references, pending gates, blockers and next action readable from the checkpoint alone.

## Batch verification

- Run checks needed for a ticket's acceptance before closing it. Defer broad checks of the combined candidate outside individual acceptance. Use the project's verification policy, including its limits on full-suite execution. Record release-owned checks in the release workflow.
- Run deferred batch-wide checks on the final combined candidate, with heavy gates sequentially. Run an intermediate broad check only for a concrete regression or shared-boundary concern, and record its reason and candidate. Preserve command results, exit codes, counts and failure logs.
- When a repair changes the candidate, map the affected boundary to invalidated tests, live checks, build or installed-artifact evidence, and review. Reuse unaffected evidence and rerun the smallest checks that reestablish coverage. Use CLOSEOUT.md to reconcile closures whose acceptance is invalidated. Record remaining blockers and keep the batch incomplete while any required gate remains unresolved.

## Finish

Before marking the Goal complete, verify the recorded commits, actual completed tracker states, and passing final batch checks against the Goal's ordered list and the checkpoint. Report completed, blocked and pending tickets, scoped commits and completion-comment URLs, observed parent progress, branch and checkout, and batch verification results. Include required UI journeys, observations and inspected screenshots. Identify local-only commits and pending publication. Tracker authority covers only the supplied implementation tickets, including bounded close-out reconciliation. Push, PR publication, merge and parent-spec closure require their own authority.
