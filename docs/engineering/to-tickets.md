## What it does

Every ticket preserves its source decisions, excluded work, observable acceptance criteria, and verification boundaries for a fresh implementer. UI tickets also include an executable verification scenario and key capture states. The implementer operates the actual app, inspects the selected images, and carries them into the completion response.

`to-tickets` takes a plan, a [spec](https://www.aihero.dev/ai-coding-dictionary/spec), or the conversation you are in, and breaks it into a set of **[tickets](https://www.aihero.dev/ai-coding-dictionary/ticket)** on your issue tracker. Each ticket declares its **blocking edges**: the other tickets that have to finish before it can start.

Every ticket is a **tracer bullet**: a narrow but complete path through every layer of the change (schema, API, UI, tests) that you can demo on its own as soon as it lands. This is what makes the skill different from the obvious way to split work, which is to cut one layer at a time and integrate at the end. It also sizes each ticket to fit in a single fresh [context window](https://www.aihero.dev/ai-coding-dictionary/context-window), because a [session](https://www.aihero.dev/ai-coding-dictionary/session) that has never seen your spec will pick the ticket up.

## When to reach for it

You invoke this by typing `/to-tickets`. The [agent](https://www.aihero.dev/ai-coding-dictionary/agent) won't reach for it on its own.

| Where you are | What to run |
| --- | --- |
| You have a spec issue and the build spans several sessions | `/to-tickets`, or `/to-tickets #<spec_issue>` |
| The plan is only in the conversation, never written up | `/to-tickets` reads the thread directly, no spec needed |
| The whole change fits in one context window | [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md), skip the tickets |
| Nothing is decided yet | [grill-with-docs](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/grill-with-docs.md), then [to-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-spec.md) |
| A [wayfinder](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/wayfinder.md) map has cleared | [to-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-spec.md) first, to collapse the map, then `/to-tickets` |

Tickets receive `ready-for-agent` after their handoff content passes the shared contract and you approve the breakdown, including its criteria and verification boundaries. Existing accepted decisions carry forward. Don't run [triage](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/triage.md) over them. Triage is for work that arrived from someone else.

## Prerequisites

`to-tickets` publishes into a tracker, so [setup-matt-pocock-skills](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/setup-matt-pocock-skills.md) must have configured one for this repo, along with the triage-label vocabulary. Either kind works: a real tracker like GitHub or Linear, or local markdown files under `.scratch/`, which work with no extra setup.

## Tracer bullets, not layers

A **horizontal** slice ships one layer of the change. Nothing works until every layer has landed, and each ticket's acceptance criteria have to reach into work that another ticket owns. A **vertical** slice (the tracer bullet) ships one thin path through all affected layers at once, so it is verifiable alone and owns everything it grades. Only layers needed for that outcome are included; a non-UI change does not acquire UI work.

This is the rule people break most often. One team ran a 26-ticket stack sliced by layer (corpus, producer, aggregator, selector) and got roughly twenty agent runs per closed ticket, about three quarters of them rework. Their own post-mortem traced every failure class back to the horizontal slicing rather than to the implementations.

Before publication, `to-tickets` looks for prefactoring (the principle "make the change easy, then make the easy change") and orders that work first. It checks each ticket against the [shared handoff contract](https://github.com/kalstein00/kalstein-skills/blob/main/skills/engineering/implement/TICKET.md), then presents the breakdown, criteria, and verification boundaries for approval. The quiz is where you check granularity, blocking edges, and possible merges or splits.

## Blocking edges

The edges are the point of the artifact. They work in two ways, depending on the tracker:

| Tracker | Where the edges live | How you work them |
| --- | --- | --- |
| Local markdown | Text in one file per ticket under `.scratch/<feature>/issues/<NN>-<slug>.md`, numbered blockers-first | Top to bottom, by hand |
| A real tracker (GitHub, Linear) | Native blocking links, or sub-issues where the tracker has them | Any ticket whose blockers are done is on the **frontier** and can be grabbed |

The edges live in the ticket either way. The tracker only decides whether anything can act on them in parallel. `to-tickets` produces the artifact; running it (one session at a time, or a fleet) is your job, not the skill's.

## The wide-refactor exception

One shape breaks the tracer-bullet rule. A **wide refactor** is a single mechanical change (rename a column, retype a shared symbol) whose **blast radius** covers the whole codebase. One edit breaks thousands of call sites, so no vertical slice can land green.

`to-tickets` sequences that as **expand–contract** instead:

- **Expand**: add the new form beside the old, so nothing breaks.
- **Migrate**: move call sites over in batches sized by blast radius (per package, per directory), one ticket per batch, each blocked by the expand. CI stays green because the old form still exists.
- **Contract**: delete the old form once no caller remains, in a ticket blocked by every migrate batch.

Where even the batches can't stay green alone, they share an integration branch and all block a final integrate-and-verify ticket. CI only has to be green at that ticket.

## Common questions

**It produced twelve tickets for a three-line change.**
Over-decomposition is the most reported problem with this skill, and many users see it. The [model](https://www.aihero.dev/ai-coding-dictionary/model) defaults to atomic units and loses the grouping that would make them meaningful. The quiz step is where you fix this. Ask it to merge tickets, and it will. There is also a lower limit. If the whole change fits in one context window, you don't need this skill at all. Go straight to [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md).

**The tickets came out one per layer: all the schema in one, all the API in another.**
This is the failure the vertical-slice rule is written against, and the skill still produces it sometimes. Catch it at the quiz step by asking one question per ticket: what can I demo when this is done? A ticket with no answer is a horizontal slice. Some people add a "demo path" line to each ticket for this reason, and report that it pushes the model toward vertical slices.

**On GitHub the tickets weren't created as sub-issues of the spec issue.**
This was reported across a dozen runs and several models, [most fully in issue #554](https://github.com/mattpocock/skills/issues/554). Fixed: `to-tickets` now makes each ticket a sub-issue of its source issue, and the GitHub tracker template gives the command (`gh issue create --parent <n>`, `gh` 2.94+). Re-run [setup-matt-pocock-skills](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/setup-matt-pocock-skills.md) to refresh an older `docs/agents/issue-tracker.md`.

**"Blocked by" was written into the issue body instead of a real blocking link.**
This is the same kind of problem, [reported in issue #513](https://github.com/mattpocock/skills/issues/513), where the agent even stated that GitHub has no native blocking relationship at all. It does: `gh issue create --blocked-by 12,15`. Because the skill publishes blockers first, their numbers are always available at creation time. The body text is meant to be the fallback for trackers with no native edge, not the default. The ticket template now omits `## Blocked by` when the edges are native.

**Where do the local tickets go? The v1.1 notes said a root-level `tickets.md`.**
They did, and that was a bug. A single shared file also caused race conditions when parallel agents wrote to it. Local mode now writes one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, in dependency order, matching the layout the local tracker template already described. The `NN` prefix is a real ticket ID, so `/implement 03` works instead of retyping a long title.

**It kept truncating when it tried to read my spec.**
A very large spec can outgrow what a tracker issue serves back cleanly. There is no local copy to fall back on, so the agent spends [tool calls](https://www.aihero.dev/ai-coding-dictionary/tool-call) fetching chunks again and never reaches the end. Don't [clear](https://www.aihero.dev/ai-coding-dictionary/clearing) or [compact](https://www.aihero.dev/ai-coding-dictionary/compaction) between `/to-spec` and `/to-tickets`. Run them in the same context window and the agent never has to fetch the spec back.

**The acceptance criteria graded nothing: some passed before any work was done.**
The handoff check now requires an observable pass/fail result, a verification boundary, and acceptance this ticket can satisfy once its prerequisites hold. New or repaired behavior names the observation expected to fail before implementation. Existing-behavior coverage and direct changes use their own checks without inventing a product failure.

If an ordinary success check would miss an acceptance failure, the existing `Verification` entry names the condition that exposes it and the first stage that can check it. For example, startup verification can check the first transition to ready, when a check on an already running app would miss an ordering bug. Existing checks that cover the condition are reused.

**Can a fresh implementer use a different model without guessing what the planning session decided?**
The ticket must preserve conversation-only decisions inline or in a durable note and link relevant specs or ADRs. UI and non-UI behavior tickets both identify test boundaries and their catch/miss limits. Routine implementation choices remain with the worker; unresolved product decisions prevent ready status. This reduces missing context but does not establish equivalent quality across models. The separate [implement-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-tickets.md) batch documents its model policy for implementation, diagnosis, and review.

**The tickets are published. How do I actually run them?**

The skill stops at the artifact. Choose the execution flow for your work:

| Work | Execution flow |
| --- | --- |
| One unblocked ticket | Run [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) in a fresh context and update ticket state yourself. |
| An ordered ticket batch | Explicitly invoke [implement-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-tickets.md); the parent owns per-ticket closure. |
| A parallel spec graph | Use [implement-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-spec.md). |

## It's working if

- Every ticket has an answer to "what can I demo when this is done?", and the answer is behaviour, not a layer.
- The list comes back to you numbered, with a "Blocked by" line on each, before anything is published.
- The ticket at the top has no blockers and can be started immediately.
- A fresh implementer can find the accepted spec and decisions through stable references or inline content, without the original conversation.
- Each acceptance criterion has an observable result and a verification check; behavior tests name their accepted public boundaries and catch/miss limits.
- Each ticket reads like something a fresh session could finish without you in the room.
- Prefactoring, where it found any, is at the front of the order rather than mixed into feature tickets.

## Where it fits

`to-tickets` is a step in the main build chain:

```txt
grill-with-docs → to-spec → to-tickets → implement → code-review → retro
```

Upstream is [to-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-spec.md), which hands it a settled spec to slice against. Keep both in one context window, with no clear between them. Downstream is [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md), which builds one ticket per fresh session, driving [tdd](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/tdd.md) for the tests and closing with [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md). [implement-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-spec.md) is the other way down. It reads the same blocking edges as a task graph and builds every ready ticket in parallel on one integration branch. When you're unsure which skill or flow fits, [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) routes you.
