## What it does

Implement an explicit ordered ticket list with fresh sequential workers in one checkout. Each worker returns its verified change and scoped commit; the parent records completion and closes that implementation ticket before the next worker starts. The parent PRD/spec remains open, and broad final batch gates stay separate from each ticket's acceptance.

## When to reach for it

Invoke this orchestrator explicitly for a supplied ticket list; use implement-spec for a parallel spec graph.

## Prerequisites

The target project, its configured tracker, and the actual ticket/parent relationships. The parent needs a working tracker route for comments, completed closure, and state readback before implementation begins. Before each dispatch it checks the [ticket handoff contract](https://github.com/kalstein00/kalstein-skills/blob/main/skills/engineering/implement/TICKET.md), recovering accepted decisions and verification boundaries from their sources. Preserve the project's existing setup and documentation.

## Common questions

**Can a batch skip live UI verification until the end?**

No. Each UI ticket supplies its required live journey and inspected images. After a change, the worker maps the changed boundary to affected checks and explains why retained evidence still applies; the parent checks that mapping before acceptance. Evidence with uncertain applicability cannot prove acceptance until the relevant boundary is checked.

**Will the parent's progress move from 1/4 to 2/4 as tickets finish?**

For native linked sub-issues, the parent records each completed child as closed and reads back its state and available parent progress. It does not merely report a counter in chat. It uses the parent's actual child set, which may include tickets outside this batch. If the tracker does not expose progress or the expected relationship is absent, it reports that limitation rather than inventing a fraction or rewriting the PRD.

**Do I need to ask separately for each ticket to close?**

No. Explicitly invoking implement-tickets authorizes the orchestrating parent to close the supplied implementation tickets after their own acceptance, review, documentation, and commit are verified. Workers do not write to the tracker. Closing the parent PRD/spec, pushing commits, or merging a PR still needs the corresponding delivery authority.

**Can a ticket close while the batch's full suite is still pending?**

Yes, when all of that ticket's acceptance is already proven and the remaining gates are broader batch regression checks. A check needed to prove the ticket's acceptance runs before closure. The completion comment names deferred gates and local-only commits honestly; batch completion still waits for the final gates.

Before closure the parent matches each required `Verification` entry to a result that covers the relevant candidate, input or starting state, and observed outcome. The check's owner fills any gap with the smallest affected check. The parent reuses valid results and the existing final batch run.

**What if closing a ticket fails or a later test finds a regression?**

The parent reconciles the real state before retrying and does not start the next worker while closure is unconfirmed. If later evidence invalidates a ticket closed by this batch, it records the failure, reopens that ticket, and repairs/reverifies it before closing again. Unaffected completed tickets stay closed.

## It's working if

- Tickets keep their requested order and scoped commits.
- Each worker receives source decisions, excluded work, acceptance criteria, and verification boundaries without needing the planning conversation.
- Each ticket has a completion comment and confirmed completed closure before the next ticket starts.
- The parent PRD stays open, with progress observed from actual child states or explicitly reported as unavailable.
- The final batch report carries UI observations and images and distinguishes deferred from completed gates.

## Where it fits

This is an explicitly requested orchestration flow. It works with [implement-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-spec.md) for the neighboring responsibility. [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
