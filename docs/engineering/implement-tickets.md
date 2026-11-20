## What it does

`implement-tickets` runs an explicit ordered ticket list in your current Codex session and checkout. It keeps the ordered ticket URLs and completion condition in one Goal, and records progress in a durable checkpoint. The session verifies, commits, and confirms closure for each ticket before moving on.

## When to reach for it

Invoke `$implement-tickets #101 #102 #103` when you already know the tickets and their order. The host needs native Goal support, and the project needs tracker access to read, comment on, close, and confirm the supplied tickets. Use [implement-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-spec.md) for a spec's parallel dependency graph.

## Common questions

**Can the reviewers use a different model from the implementation session?**

At the start of every new batch, the skill asks which model and reasoning effort to use for the independent Standards and Spec reviewers. The default is the current session's settings when the runtime exposes them. You can choose, for example, GPT-6.2 Astra at high effort while implementing in GPT-6.2 Sol at low effort. The batch saves both confirmed values and uses them for every review and re-review, including after a continuation.

**How does a long batch recover after an interruption or context compaction?**

The Goal retains the ticket order and completion condition. The checkpoint tracks the current ticket, reviewer settings, checkout and branch, commit and evidence references, tracker state, pending checks, and next action. On continuation, the session checks that the checkout and branch match and reconciles the checkpoint with Git and the tracker. A confirmed commit can be reused if interruption happens before issue closure, and an existing matching completion comment can be reused after an uncertain tracker write. Once the Goal is complete, an explicit invocation can start another batch in the same session.

**What must pass before a ticket closes?**

Each ticket needs its own acceptance checks, review, documentation as applicable, and a verified scoped commit. UI tickets need their required live journeys and inspected screenshots. Broad regression checks can run on the final combined candidate. If later evidence invalidates an earlier ticket's acceptance, the [close-out contract](https://github.com/kalstein00/kalstein-skills/blob/main/skills/engineering/implement-tickets/CLOSEOUT.md) governs reopening, repair, and re-verification.

**What changes in the tracker?**

The session records completion and closes each supplied implementation ticket, then confirms the actual tracker state and available parent progress. The parent PRD/spec stays open. Push, PR publication, and merge require separate authority.

## It's working if

- Each ticket closes in the supplied order with a scoped commit, both independent reviews, and verified acceptance.
- The next action after an interruption can be recovered from the checkpoint, Git history, and tracker.
- The Goal completes after all requested closures and passing batch checks on the final combined candidate.

## Where it fits

`implement-tickets` runs the build and close-out steps for an ordered list from [to-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-tickets.md). [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the full workflow.
