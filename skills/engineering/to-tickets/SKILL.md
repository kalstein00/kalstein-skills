---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every affected layer (schema, API, UI, tests). Include only layers needed for its outcome; a non-UI change does not require UI work.
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Check the handoff and quiz the user

Apply [the ticket handoff contract](../implement/TICKET.md) to every ticket before presenting the breakdown. Preserve source references, accepted decisions and exclusions, prerequisites, observable acceptance criteria, and verification boundaries for UI and non-UI work. Select verification by actual behavior under [the execution contract](../implement/EXECUTION.md). Recover existing agreements before raising an unresolved decision.

For each UI behavior or layout ticket, add a **UI verification** section using [the UI evidence protocol](../ui-tdd/EVIDENCE.md): prerequisites/starting screen, ordered normal user actions, expected visible result, relevant alternate states, required E2E/public seam, and key screenshot states. Inherit testing decisions already agreed in the spec. State that implementation must operate the actual app with Agent Browser, open and inspect selected captures, and carry the action/result evidence and images into its completion response. Include persistence/reopen and window-size checks only when acceptance requires them. Non-UI and literal-copy-only tickets omit this mandatory section. A fixed label replacement follows direct proportionate checks, with a live appearance check when wrapping/truncation may change; it does not require a fabricated RED or full UI journey. Computed text, action meaning, conditional visibility, or accessibility behavior uses the UI route.

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work
- **Handoff**: source/decision references, acceptance criteria, and verification boundaries with their catch/miss limits where behavior tests apply

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown and its handoff content, reusing earlier accepted decisions and test boundaries. Publish as ready only when the handoff contract is satisfied.

### 5. Publish the tickets to the configured tracker

Publish the approved tickets. **How** depends on the tracker `/setup-matt-pocock-skills` configured; the tickets are the same either way, only the shape of the blocking edges changes:

- **Local files** → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below: one ticket per file, never a single combined file.
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues. If the source was an existing issue, make each ticket its sub-issue (tracker doc's operation). Apply the `ready-for-agent` triage label after the handoff check and approval unless instructed otherwise.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

Do NOT close or modify any parent issue.

<local-ticket-template>

# <NN>: <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Source and decisions:** source spec/decision references, including accepted constraints and excluded work. Preserve conversation-only decisions here or in a durable linked note.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Prerequisites:** starting state, fixtures, or capabilities beyond blocking tickets, or "None".

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

**Verification:** map each criterion to its boundary, inputs/starting state, expected result, and check under the handoff contract. Name accepted test seams and their catch/miss limits for behavior work; direct changes use proportionate checks.

For UI behavior/layout work, append the scenario-specific UI verification section defined above.

</local-ticket-template>

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective, not layer-by-layer implementation.

## Source and decisions

Source spec/decision references, including accepted constraints and excluded work. Preserve conversation-only decisions here or in a durable linked note.

## Prerequisites

Starting state, fixtures, or capabilities beyond blocking tickets, or "None".

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Verification

Map each criterion to its boundary, inputs/starting state, expected result, and check under the handoff contract. Name accepted test seams and their catch/miss limits for behavior work; direct changes use proportionate checks.

For UI behavior/layout work, append the scenario-specific UI verification section defined above.

## Blocked by

- A reference to each blocking ticket, or "None (can start immediately)". Omit this section when blockers were set as native edges.

</issue-template>

In either form, include stable paths or links to source specs, ADRs, glossary entries, and verification conventions when needed to recover context. Express acceptance in behavior rather than prescribing implementation file paths or line numbers, which can become stale. If a prototype produced a snippet that encodes an accepted decision more precisely than prose can (state machine, reducer, schema, type shape), inline the decision-rich parts and note that source.
