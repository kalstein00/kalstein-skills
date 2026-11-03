# Engineering

## User-invoked

- **[ask-matt](./ask-matt/SKILL.md)**: Ask which skill or flow fits your situation. A router over the skills in this repo.
- **[diagnose](./diagnose/SKILL.md)**: Establish a bug's cause from runtime evidence without authorizing a production fix.
- **[grill-with-docs](./grill-with-docs/SKILL.md)**: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- **[implement](./implement/SKILL.md)**: Implement a piece of work based on a spec or set of tickets.
- **[implement-spec](./implement-spec/SKILL.md)**: Implement the result of /to-spec and /to-tickets in code.
- **[implement-tickets](./implement-tickets/SKILL.md)**: Implement an explicit ticket list sequentially in one checkout, with the parent closing each verified ticket before advancing.
- **[improve-codebase-architecture](./improve-codebase-architecture/SKILL.md)**: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **[retro](./retro/SKILL.md)**: Conduct a retrospective on a coding session.
- **[setup-matt-pocock-skills](./setup-matt-pocock-skills/SKILL.md)**: Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
- **[to-spec](./to-spec/SKILL.md)**: Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed.
- **[to-tickets](./to-tickets/SKILL.md)**: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
- **[triage](./triage/SKILL.md)**: Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs.
- **[wayfinder](./wayfinder/SKILL.md)**: Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.

## Model-invoked

- **[agent-browser](./agent-browser/SKILL.md)**: Operate and inspect websites or Electron apps through the Agent Browser CLI, including navigation, forms, screenshots, and live UI verification. Use the target project's wrapper and pinned runtime when supplied.
- **[architecture-evidence](./architecture-evidence/SKILL.md)**: Generate reproducible architecture measurements and a bounded evidence queue from a Git repository, or explicitly continue a saved scan. Use when the user requests deterministic metrics, measurement coverage, ranking, or an architecture evidence report. Findings are evidence for later human or agent review, not automatic architecture decisions or refactoring.
- **[behavior-test](./behavior-test/SKILL.md)**: Write one minimal test through a stable public seam for an explicitly selected RED or COVERAGE cycle. Use as a fundamental capability inside TDD workflows, not as a feature implementation workflow.
- **[close-spec](./close-spec/SKILL.md)**: Verify completion and close a spec or ticket when requested, using current tracker relationships, acceptance criteria, and implementation evidence. Use existing project scope and acceptance evidence without requiring a new issue schema.
- **[code-review](./code-review/SKILL.md)**: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
- **[codebase-design](./codebase-design/SKILL.md)**: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
- **[diagnosing-bugs](./diagnosing-bugs/SKILL.md)**: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
- **[domain-modeling](./domain-modeling/SKILL.md)**: Build and sharpen a project's domain model. Use when discussing codebase terminology, editing its GLOSSARY.md or existing CONTEXT.md, or recording an ADR.
- **[e2e-coverage](./e2e-coverage/SKILL.md)**: Add or update target-authoritative end-to-end coverage for UI acceptance while preserving project fixtures, test catalogs, and app-session lifecycle. Use inside UI implementation or for explicitly requested coverage of existing behavior.
- **[git-commit](./git-commit/SKILL.md)**: Finalize a scoped local Git change by reusing existing review and verification, staging only the intended candidate, and committing it. Push only when explicitly requested. Use when implementation is finished and Git finalization remains; review and repair belong to the owning workflow.
- **[library-docs](./library-docs/SKILL.md)**: Find versioned evidence in a project's copied library documentation before changing external-library APIs or lifecycle behavior. Use when the project has pinned documentation packages; disclose missing preparation or absent source evidence.
- **[pr](./pr/SKILL.md)**: Use when writing a PR body.
- **[prototype](./prototype/SKILL.md)**: Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.
- **[research](./research/SKILL.md)**: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
- **[sync-user-manual](./sync-user-manual/SKILL.md)**: Synchronize canonical user documentation with changed UI acceptance during implementation or review. Use when changed behavior, E2E/catalog mappings, or an explicit request affects the user guide; Git finalization only consumes completed evidence.
- **[tdd](./tdd/SKILL.md)**: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
- **[test-evidence](./test-evidence/SKILL.md)**: Validate focused test output as deterministic RED, GREEN, or COVERAGE evidence. Use as a fundamental capability inside test-first workflows, not to implement behavior.
- **[ui-tdd](./ui-tdd/SKILL.md)**: Implement UI features or repair UI regressions test-first, then operate the actual app with Agent Browser and inspect screenshots before reporting completion. Use for interaction, rendering/layout, accessibility behavior, IPC, persistence, or restore changes; literal copy-only edits use direct verification.
- **[wizard](./wizard/SKILL.md)**: Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.
- **[write-a-skill](./write-a-skill/SKILL.md)**: Create or update a focused agent skill with valid metadata, progressive disclosure, and tested bundled resources. Use when the user asks to write, build, restructure, or improve a reusable skill.
- **[zoom-out](./zoom-out/SKILL.md)**: Orient the user in an unfamiliar code area by mapping the higher-level architecture, ownership, callers, dependencies, and domain concepts. Use when local code context is confusing or the user asks for the bigger picture.
