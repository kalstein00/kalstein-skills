---
name: code-review
description: "Review committed and working-tree changes since a fixed point along Standards and Spec axes, including regressions of affected established contracts. Runs independent reviewers and reports findings and evidence gaps separately. Use for branch, PR, work-in-progress, or review-since requests."
---

Two-axis review of the committed and working-tree candidate since a fixed point supplied by the user or calling workflow:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code implement the requirements and preserve the established contracts affected by the change?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings. Start every sub-agent with a fresh context window.

Use the project's tracker instructions when the source is a ticket. Conversation requirements are a valid spec for an ordinary chat task; they do not require tracker setup.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point (a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.). If they didn't specify one, ask for it.

Resolve `git merge-base <fixed-point> HEAD`, then capture `git diff <base>` for the committed, staged, and unstaged candidate and `git ls-files --others --exclude-standard` for new files to read separately. Note commits via `git log <fixed-point>..HEAD --oneline`. Honor the caller's candidate paths and preserve unrelated pre-existing work. Pass both reviewers the same base, path boundary, and new-file list.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the candidate has a diff or new files. A pre-commit candidate must not disappear because `HEAD` has no new commits. Both reviewers inspect read-only and do not mutate files or tracker state.

### 2. Identify the spec source

Reuse caller-supplied tickets/specs or the task's conversation requirements first. Otherwise look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.), fetched via the workflow in the tracker doc.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If there is none, report "no explicit spec available" and retain the Spec reviewer for affected established contracts. Distinguish sourced contracts from inferred expectations; unresolved product meaning is a question, not a new requirement.

### 3. Identify the standards sources

Start with applicable project instructions and their current standards pointers. Check for `CODING_STANDARDS.md` and `CONTRIBUTING.md` at the repository root and in the candidate's directory ancestry; include existing files as sources and read only sections relevant to the candidate. Reuse sources already supplied by the caller.

Follow references needed to establish an affected rule or contract. Widen discovery only for a named gap; consult historical plans, audits, and verification records when needed to resolve authority, supersession, or evidence. Retain source paths and section/line references. Pass applicable coding rules to Standards and affected behavior contracts found in those same documents to Spec, regardless of the filename.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below: a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn both sub-agents in parallel

Issue both sub-agent calls together, in the foreground, and aggregate the reports they return.

Apply any caller-supplied model/effort settings through the spawn tool, not just prompt text. Preserve fresh contexts and supply repository, candidate, standards, source requirements, and relevant evidence explicitly. Without such a policy use the host's normal settings. Report a required setting/capability that cannot be honored rather than silently substituting it.

Pass the applicable **Verification** entries and recorded evidence to both reviewers. Review the evidence in place. If it is insufficient, identify the unmet criterion or documented rule and the smallest missing observation. The check owner can supply existing evidence or run the focused check.

Supply relevant domain/ADR pointers alongside the source requirements. Each reviewer derives its conclusions independently; treat the implementer's safety claims as claims to inspect.

For UI claims, give the Spec reviewer the accepted journey, automated results, final app/candidate identity, inspected screenshot paths, and observations under `ui-tdd`'s [evidence protocol](../ui-tdd/EVIDENCE.md). The reviewer checks coverage and freshness; routine review does not rerun unchanged browser work. Missing required evidence is a finding. A code smell alone cannot expand the requested outcome into unrelated work.

**Standards sub-agent prompt** should include:

- The full diff command and commit list.
- The applicable rules and source references from step 3, **plus the smell baseline from step 3** pasted in full (the sub-agent has no other access to it).
- The brief: "Report, per file/hunk where relevant, (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls: documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Be concise; preserve substantiated findings and material limits."
- Flag an evidence gap on this axis when a documented repository rule requires the missing check or environment. Cite that rule and the affected change.

**Spec sub-agent prompt** should include:

- The diff command and commit list.
- The source requirements and pointers to affected established contracts, including those found in standards documents in step 3, with missing sources disclosed.
- The brief: "Report missing/partial requirements, scope creep, wrong implementations, and regressions of affected established contracts. Cite the violated requirement or contract. For behavior changes, read and apply [BEHAVIOR.md](BEHAVIOR.md) before composing findings, including its boundary ledger and guard challenges. For literal copy or mechanical changes with no behavior impact, state that applicability briefly. Be concise; preserve substantiated findings and material limits."
- Check whether the evidence exercises the condition named in Verification and demonstrates the promised outcome. If the check can pass without exercising that condition, name the criterion, what the evidence actually shows, and the observation needed to resolve the gap. A regression caused by the candidate is in scope when it violates an affected established contract even if the ticket does not repeat that contract. Unrelated pre-existing defects and proposed new behavior are advisory.

Missing product requirements limit product acceptance claims; they do not remove the review of affected established contracts.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate (see _Why two axes_).

Retain each axis's coverage and evidence gaps, including the Spec boundary ledger for affected stateful behavior. A finding on one path does not complete the other affected paths. Distinguish defects, unresolved required evidence, and advisory suggestions; unresolved required evidence is not a clean pass.

Record the base/candidate identity and path scope, the skill revision or instruction artifact, which axes actually ran, and their report references in the existing task record. Refresh affected review evidence if the candidate changes. End with a one-line summary of findings and material gaps per axis, and the worst issue _within each axis_ (if any). Keep the axes separate.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
