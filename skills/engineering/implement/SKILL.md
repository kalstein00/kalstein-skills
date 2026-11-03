---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Record the starting commit and staged, unstaged, and new task files; preserve unrelated changes. Read [EXECUTION.md](EXECUTION.md) and apply its route: `ui-tdd` for UI/mixed behavior, `tdd` for non-UI behavior at agreed seams, and proportionate direct checks for documentation, metadata, mechanical, and literal copy changes. Reuse already accepted scope and test seams rather than asking for them again.

Run affected typechecking and focused tests during behavior implementation and the project's applicable full suite once on the final candidate. Direct documentation/metadata work uses its relevant package checks. A calling batch may assign broad final gates to its parent; ticket-specific acceptance, E2E, and live evidence stay with this task. Update affected canonical documentation before review.

Once done, call the Skill tool with "code-review" to review the complete candidate against the recorded starting point and the source ticket or conversation requirements. Include staged, unstaged, and new task files. Resolve in-scope findings and refresh affected checks before committing.

Commit your work to the current branch.

Report changed behavior, verification, documentation, commit/delivery state, and unresolved gaps. For UI work, carry `ui-tdd`'s performed journey, observed outcome, candidate identity, and inspected screenshots into the final response under its [evidence protocol](../ui-tdd/EVIDENCE.md). Show the result image inline when supported. Required live proof that is missing leaves the task incomplete. Push and tracker closure follow the user's established authority separately.
