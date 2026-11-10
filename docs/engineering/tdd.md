## What it does

Previously accepted test seams are reused, including their catch/miss limits. Mixed UI/logic work retains one outer UI workflow and final live evidence.

Before behavior-sensitive function use, the shared execution contract checks source-version compatibility, callee defaults and preconditions, and completion semantics. Existing contract evidence is reused; relevant misuse counterexamples stay in the same agreed RED/GREEN loop.

`tdd` builds a feature or fixes a bug test-first: one failing test, then just enough code to pass it, then the next behaviour. It carries the standards that make that loop produce tests worth keeping: what a good test is, where tests go, what mocks are for, and the three anti-patterns that make a suite worthless.

It writes tests at agreed public boundaries. An accepted spec or ticket that identifies the boundary carries that agreement forward; only a missing or materially changed boundary needs confirmation. Testing effort is finite, and this rule spends it on the critical paths instead of on every edge case. `tdd` is also a **reference**, not a driver. It contains the rules of the loop, and something else (you, or [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md)) runs the [session](https://www.aihero.dev/ai-coding-dictionary/session) that applies them.

## When to reach for it

Type `/tdd`, or the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) reaches for it automatically when a task fits: building a feature or fixing a bug test-first, or when you say "red-green-refactor".

Reach for it when there is a concrete behaviour to build, with an input and an observable output, and you want tests that survive a refactor.

| Your situation | Where to go |
| --- | --- |
| A behaviour with defined inputs and outputs (business logic, a request/response contract, a transformation, validation) | `tdd` |
| The behaviour isn't pinned down yet | [to-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-spec.md), which also agrees the test seams before any code is written |
| The question is really the shape of the interface, not the tests | [codebase-design](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/codebase-design.md) |
| You have a [spec](https://www.aihero.dev/ai-coding-dictionary/spec) or [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket) and want the whole build run for you | [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md), which drives `tdd` per ticket |
| Configuration or wiring that changes observable behavior | The corresponding non-UI TDD or outer UI route |
| Behavior-preserving metadata, mechanical changes, or literal copy | Direct proportionate checks under [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) |

The [execution contract](https://github.com/kalstein00/kalstein-skills/blob/main/skills/engineering/implement/EXECUTION.md) selects by actual effect before file type. Authentication or restore changes still need behavior verification when made in a settings file. Direct changes use checks appropriate to the artifact, avoiding tests that merely restate it.

## Prerequisites

[codebase-design](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/codebase-design.md) needs to be installed. `tdd` used to carry its own deep-module and interface-design notes; v1.0 deleted them in favour of the shared skill, and `tdd` now uses its interface-design vocabulary. Nothing else; the skill is [stateless](https://www.aihero.dev/ai-coding-dictionary/stateless) and writes no files of its own.

## The loop, and the seam it runs at

The skill rests on three terms.

**Red-green.** Write the failing test, then only enough code to pass it. Do not write code for the test after next. There is no refactor phase. The skill dropped it in June 2026 because agents almost never performed it, and because review and implementation work better as separate sessions. Refactoring belongs to [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md).

**Vertical slice.** Write one test at one seam, then the minimal implementation, then repeat. The first cycle is a **tracer bullet** that proves a single path end to end. The opposite is horizontal slicing: all the tests first, then all the code. Tests written in bulk verify *imagined* behaviour. They check the shape of things rather than what a user does, and they commit you to a test structure before you understand the implementation.

**Pre-agreed seam.** A seam is the public boundary you observe behaviour at without reaching inside. The [ticket handoff contract](https://github.com/kalstein00/kalstein-skills/blob/main/skills/engineering/implement/TICKET.md) distinguishes an agreed boundary, including an unambiguous public operation, from generic feature approval. Recover existing agreement first. Missing or materially changed boundaries return to the dispatching parent, or to you for standalone work, with each candidate's catch/miss limits.

The three anti-patterns it is written to prevent:

| Anti-pattern | The tell |
| --- | --- |
| Implementation-coupled | The test breaks when you rename an internal function, though behaviour did not change. Mocked internal collaborators, asserted call counts, database queries used to verify instead of the interface. |
| Tautological | The expected value is computed the way the code computes it, so the test passes by construction. Expected values have to come from somewhere else: a known-good literal, a worked example, the spec. |
| Horizontal slicing | A batch of tests landed before any implementation. |

Mocks are for system boundaries only: external APIs, time, randomness, sometimes the filesystem or the database. Never mock your own modules.

## Common questions

**Why doesn't it refactor? The description says "red-green-refactor".**

Because the refactor step was removed and the description was not. The removal was deliberate. Agents almost never did the step, and keeping implementation and review in separate sessions works better. Whether the result still counts as TDD by the book matters less than whether the loop produces better code. The mismatch between the trigger phrase and the body is filed as [issue #589](https://github.com/mattpocock/skills/issues/589) and is still open, so "red-green-refactor" continues to work as a phrase that fires the skill. What you get is red-green, with refactoring in [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md).

**It asked me to choose a test seam and I had no idea which to pick.**

Each proposed seam now includes what it catches and misses, so you can choose by coverage rather than a label. [to-tickets](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-tickets.md) preserves those boundaries for UI and non-UI behavior. An already accepted boundary is reused without another question.

**It wrote the implementation before the test, even though the skill says red first.**

It happens. One user pushed the [model](https://www.aihero.dev/ai-coding-dictionary/model) on it and got an unusually honest answer: "I knew the skill said 'one test at a time, watch it fail for the right reason'. I read it. I just defaulted to my normal habit." The skill accepts this. No instruction makes an agent comply 100% of the time, and stricter wording restricts the agent's creativity for little gain. The loop is worth running even when the agent does not follow it strictly, because the results are still better overall. If strict adherence matters for a particular slice, watch the run rather than trusting the skill to enforce it.

**Should it write browser or end-to-end tests first?**

The accepted public boundary and the selected route decide. UI interactions, IPC, lifecycle, persistence, and restore retain the target-authoritative E2E requirements of [ui-tdd](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ui-tdd.md). Smaller logic seams can provide earlier focused feedback, but do not replace required UI acceptance. An environment or selector failure is not the intended RED.

**Does `/tdd` replace `/implement`, or the course's `/do-work`?**

No. `/tdd` documents the methodology; `/implement` is a simple work→feedback→commit loop and is the direct stand-in for `/do-work`. The course's single `/do-work` step is now split across `/implement`, `/tdd` and `/code-review`. If you are asking which one to run against a ticket, the answer is almost always `/implement`.

**Where did the deep-modules and interface-design guidance go?**

Into [codebase-design](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/codebase-design.md) in v1.0, generalised so several skills share one vocabulary. `refactoring.md` left at the same time; refactoring is now [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md)'s job, and that skill carries the Fowler smell baseline.

**Does it know about my other tickets?**

No. Run against one ticket, it can propose work that belongs to a sibling ticket, because it has no view of the rest of the issue graph ([issue #129](https://github.com/mattpocock/skills/issues/129)). This is not `tdd`'s job. Passing the spec alongside the ticket helps; right-sizing the tickets in the first place helps more.

## It's working if

- It reuses an accepted test boundary; a missing or changed boundary is explained with catch/miss limits before confirmation.
- One test appears, goes red, gets just enough code to pass, and only then does the next test appear, not a batch of tests followed by a batch of code.
- Test names read as capabilities ("user can checkout with valid cart"), not as internals ("checkout calls paymentService.process").
- Expected values in assertions are literals you can trace to the spec, not values recomputed the way the code computes them.
- Renaming an internal function breaks nothing in the suite.
- Mocks appear only at external boundaries (the payment API, the clock) and never around your own modules.

## Where it fits

`tdd` runs inside the build step of the main chain; it is not a step of its own:

```txt
grill-with-docs → to-spec → to-tickets → implement → code-review → retro
```

[to-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-spec.md) agrees the test seams up front, [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) drives `tdd` per ticket, and [code-review](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/code-review.md) checks afterwards that only the agreed seams were used, and owns the refactoring `tdd` no longer does. Its other neighbour is [codebase-design](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/codebase-design.md), the shared source of the seam and deep-module vocabulary that `tdd` uses. You can also reach for it on its own, whenever there is a concrete behaviour to build and no full spec in play. When you are unsure which skill fits your situation, [ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) routes you.
