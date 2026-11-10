---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Record the starting commit and staged, unstaged, and new task files; preserve unrelated changes. Read [EXECUTION.md](EXECUTION.md) and apply its route: `ui-tdd` for UI/mixed behavior, `tdd` for non-UI behavior at agreed seams, and proportionate direct checks for documentation, metadata, mechanical, and literal copy changes. Reuse already accepted scope and test seams rather than asking for them again.

Before behavior-sensitive edits, complete the execution contract's [function-use check](EXECUTION.md#before-behavior-sensitive-edits). Reuse established evidence, reconcile stale instructions, and resolve dependency/source versions, callee defaults, preconditions, and completion guarantees relevant to the intended call.

Run affected typechecking and focused tests for the changed behavior. Run a full test suite only when the release workflow requires it or the user explicitly requests it. Direct documentation/metadata work uses relevant package checks. In a batch, keep ticket-specific acceptance, required E2E, and live evidence with the ticket. Update affected canonical documentation before review.

Once done, call the Skill tool with "code-review" to review the complete candidate against the recorded starting point and the source ticket or conversation requirements. Include staged, unstaged, and new task files. Resolve in-scope findings and refresh affected checks before committing.

Commit your work to the current branch.

For a standalone GitHub ticket, this invocation authorizes posting one completion comment to that ticket after verification, review, and commit. Include the implemented outcome and acceptance results, verification commands/results and material skip/retry counts, commit/branch and local-versus-published state, documentation, evidence references, and remaining limits. For UI work, include the performed journey, observed result, candidate/build identity, and inspected screenshot references. Identify local-only artifacts and their access/retention limits; image uploads require separate authority. Reuse an existing matching comment on recovery.

Use the target project's tracker tooling and read back the posted comment before reporting delivery. Reconcile an uncertain write against comment history before retrying. If posting or confirmation fails, preserve the implementation evidence and report tracker delivery as incomplete. Include the confirmed comment URL in the final response. Conversation-only work needs no ticket or tracker comment. Batch workers return evidence to their orchestrator, which owns tracker writes under its workflow.

Leave issue state and labels unchanged. Issue closure requires a separate user request or an explicitly invoked orchestrator that owns closure; push and PR publication retain their separate authority.

Report changed behavior, verification, documentation, commit/delivery state, and unresolved gaps. For a visible UI change, leave an inspected screenshot of the actual final app in a retained task artifact location and provide its reopenable path in the final response. Show the result inline when supported and name the UI state it shows. Apply the [UI evidence protocol](../ui-tdd/EVIDENCE.md) to the capture and reuse the image from live verification while it still represents the final result. For UI behavior work, also report the performed journey, observed outcome, and candidate identity. Required live proof that is missing leaves the task incomplete. Push and tracker closure follow the user's established authority separately.
