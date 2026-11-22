## What it does

`grill-with-docs` interviews you about a design, records agreed domain terms and qualifying architectural decisions, and ends with a plan for your review. Each round builds on the decisions you confirmed in the previous round.

When the session allows writes, the skill records settled terms and qualifying decisions as you go. The plan appears in chat by default.

## When to reach for it

You invoke this by typing `/grill-with-docs`, and the agent won't reach for it on its own.

Reach for it at the start of a change, in a repo, when the plan is still fuzzy and the words for the thing are not settled yet. It is the single-session tool. Which grilling skill you want depends on what is in front of you:

| What you have | Reach for |
| --- | --- |
| You aren't working in a working directory at all | [grill-me](https://aihero.dev/skills-grill-me) |
| A repo, and a change you can settle in one session | `grill-with-docs` |
| An effort too big to hold in one session (a greenfield build, a large feature) | [wayfinder](https://aihero.dev/skills-wayfinder) |
| A repo with no domain docs at all, and no particular feature in mind | `grill-with-docs`, aimed at the repo rather than a change |
| A decision blocked on knowledge in someone else's head | [to-questionnaire](https://aihero.dev/skills-to-questionnaire) |

The wayfinder split comes down to session count: `/grill-with-docs` for single-session planning, `/wayfinder` for multi-session planning.

## Prerequisites

The skill writes into your repo, so you need to be somewhere it is safe to write. Resolved terms go to a `GLOSSARY.md` glossary at the root, or to the relevant context's `GLOSSARY.md`, if a `GLOSSARY-MAP.md` at the root marks the repo as multi-context. Decisions go to `docs/adr/`. The skill creates both only when it needs them. Nothing exists until the first term or decision is settled, so you set up nothing in advance.

The skill relies on two bundled skills for the interview and the domain records. [grilling](https://github.com/kalstein00/kalstein-skills/blob/main/docs/productivity/grilling.md) · [domain-modeling](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/domain-modeling.md)

## The paper trail

Three things come out of a session, and they are not equal.

| What resolved | Where it lands |
| --- | --- |
| A term: the project's own word for a thing | `GLOSSARY.md`, inline, the moment it resolves |
| A decision that is hard to reverse, surprising without context, and a real trade-off | An ADR under `docs/adr/` |
| Agreed scope, work order, acceptance criteria, verification, and deferred decisions | The plan in chat. A separate file is optional on request. |

Keep the plan in the conversation when drafting the spec, so details such as ordering guarantees and numeric defaults carry forward from the interview. [to-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/to-spec.md)

The glossary is the main output. This skill builds domain language: the project's own words, agreed once, so you, the agent and your colleagues do not have to work them out again. Not everyone agrees that this improves agent performance. The strongest objection is that a term and its plain-English expansion get the same result from the [model](https://www.aihero.dev/ai-coding-dictionary/model), and that the vocabulary mainly shortens communication between the humans who share it. On that view the glossary is still valuable, but the value goes to the humans.

## Common questions

**Should I use this or `/wayfinder`?**
Scope decides it. Use this for anything you can settle in one session; use [wayfinder](https://aihero.dev/skills-wayfinder) when the effort is too big to hold in one, and it charts the work as a map of decision [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket) first. Wayfinder is slower and denser, and reaching for it on a well-scoped feature is the common mistake. It does not replace this skill, and it can start a grilling session for the parts of the map that suit one.

**It ran, but no `GLOSSARY.md` and no ADRs appeared.**
There are two known causes. The first is that nothing qualified. ADRs need all three gates, and a session about a change with no new vocabulary has nothing to write. The second is a real bug. When the skill runs inside another orchestration layer (a spec-driven-development wrapper, a multi-agent framework, a rule that invokes it as a step in someone else's pipeline), users report that the file-writing half silently does not happen, while the interview still runs. The bug is filed and unfixed. If you are in that setup, check the working directory before you trust the session's output.

**It asked everything at once, with no recommendations, and never mentioned `GLOSSARY.md`.**
Ask the agent which dependencies it loaded. The interview structure comes from `grilling`, and the glossary and ADR rules come from `domain-modeling`.

**Can I point it at an existing repo that has no docs at all?**
Yes. This is the right skill for a codebase with no ADRs, no domain language and no design principles: invoke it and say "help me document my repo". Users often pair it with [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture) for building or repairing a `GLOSSARY.md`. Expect to steer it. It reads code and asks you about what it finds, and you decide which of the words already in the codebase are the right ones.

**If I say “yes, start with this pilot,” does it start building?**
That answer sets the first step in the plan. Review the plan in chat, then explicitly request the next phase in a separate message. A request to write a spec starts spec work, and a request to implement starts implementation.

**Why is it called that?**
Nobody is happy with the name. There is an open suggestion to rename it `grill-domain-model`, which describes the behaviour more accurately. Nothing has moved on it. If a rename ever lands, the docs page moves with it and the URL changes.

## It's working if

- You get a reviewable plan and the turn ends. A documentation-only session ends with a summary of the agreed model and the documents updated.

- `GLOSSARY.md` changes *during* the session, term by term, rather than appearing in one lump at the end.
- The glossary reads as pure vocabulary (your project's words with tight definitions) and contains no implementation detail or spec-like prose.
- Questions the codebase can answer get answered by reading the codebase, not asked of you.
- You get few or no ADRs, and the ones you get are decisions you would be annoyed to have to argue again.
- It challenges a word you used because your existing glossary defines it differently.

## Where it fits

`grill-with-docs` is the head of the main build chain:

```txt
grill-with-docs → to-spec → to-tickets → implement → code-review → retro
```

It comes before anything is written down as a spec. It produces the shared understanding and settled vocabulary that [to-spec](https://aihero.dev/skills-to-spec) then synthesises without interviewing you again. Its close neighbours are [grill-me](https://aihero.dev/skills-grill-me), the same interview with no repo and no files, and [domain-modeling](https://aihero.dev/skills-domain-modeling), the glossary-and-ADR discipline it drives; both use the [grilling](https://aihero.dev/skills-grilling) primitive for the interview. Upstream of it, [wayfinder](https://aihero.dev/skills-wayfinder) charts efforts too large for one session and can hand parts of the map back down to it. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
