# Kalstein Skills

Personal engineering workflows based on [mattpocock/skills](https://github.com/mattpocock/skills), updated with portable local extensions and evidence-based UI completion. The fork ships 40 promoted skills as one Codex-compatible plugin. Upstream attribution and the MIT license are preserved.

## Install on any PC

Install a compatible Codex CLI and sign in first. Run these commands in PowerShell, bash, or your terminal:

```powershell
codex plugin marketplace add kalstein00/kalstein-skills --ref main
codex plugin add kalstein-skills@kalstein
```

Start a **new chat/session** so the installed skills are loaded. Verify the plugin identity and version:

```powershell
codex plugin list --json
```

Expected plugin: `kalstein-skills@kalstein`, version `1.4.5` for this release. No manual copy into a project or plugin cache is needed. Repository `kalstein00/kalstein-skills`, marketplace `kalstein`, and plugin `kalstein-skills` are distinct names.

### Update another PC

```powershell
codex plugin marketplace upgrade kalstein
codex plugin add kalstein-skills@kalstein
```

Restart the app or begin a new session, then check the installed version. A release bumps the manifest version; editing the plugin cache is not the customization workflow. For exact reproducibility, replace `--ref main` with a published version tag, such as `--ref v1.4.5` after the tag exists. A pinned tag does not follow future main updates.

### Uninstall kalstein-skills

```powershell
codex plugin remove kalstein-skills@kalstein
```

Restart the app or start a new session after removal.

### Claude Code

```bash
claude plugin marketplace add kalstein00/kalstein-skills
claude plugin install kalstein-skills@kalstein
```

## What changes for UI tickets

- Ticket/spec acceptance includes prerequisites, the actual user action sequence, expected visible results, relevant alternate states, and key capture states.
- `implement` selects `ui-tdd` for UI/mixed behavior. Regression work reproduces the symptom live and proves E2E RED/GREEN; feature coverage follows the accepted interaction boundary.
- Agent Browser operates the **actual changed app**, including the real Electron target when applicable. Internal state injection is diagnostic support, not a replacement for user operation.
- The agent saves the key captures, **opens and inspects the images**, fixes in-scope defects, and verifies the final candidate.
- Completion reports include performed actions, observed results, automated checks, inspected screenshots displayed inline when supported, documentation, and unverified gaps. Workers propagate those artifacts through batch/spec orchestration.
- Missing required live evidence leaves the task incomplete. Screenshots supplement tests; they do not alone prove persistence, IPC, or interaction correctness.

The canonical rules live in [ui-tdd](skills/engineering/ui-tdd/SKILL.md), its [evidence protocol](skills/engineering/ui-tdd/EVIDENCE.md), and [the execution contract](skills/engineering/implement/EXECUTION.md).

## Sequential ticket completion

Explicitly invoking `implement-tickets` authorizes the parent orchestrator to record completion and close each supplied implementation ticket before starting the next one. The parent verifies acceptance, review, documentation, the scoped commit, and required UI evidence, then confirms the tracker state and available parent progress. Workers do not close tickets, and the parent PRD/spec remains open. Only broad batch regression gates may remain pending; a gate needed for ticket acceptance runs before closure. See [the close-out contract](skills/engineering/implement-tickets/CLOSEOUT.md).

## Project setup and prerequisites

Use `setup-matt-pocock-skills` when a project needs tracker, label, domain, or UI runtime routing. The command name is retained for upstream compatibility. Existing setup and `CONTEXT.md`/`GLOSSARY.md` conventions are respected.

Agent Browser is a separate CLI/runtime. UI work uses the project-pinned wrapper when provided, otherwise an existing CLI. If neither exists, the agent installs the official CLI on first UI use with Node.js and npm, and prepares its browser binary if needed. The app URL/CDP target, build, fixtures, E2E/session conventions, product decisions, and user-guide/QA owners remain project-specific. Global skill installation does not launch an app or install all project tools.

The optional architecture scanner requires Node 24+, Git, npm, and its own pinned preparation. `library-docs` requires a project-provided copied corpus and CLI. Impeccable remains a separately installed design tool. See [source integration and local-skill migration](docs/customization.md) before deleting old adapters.

## Skills

Explicit-only skills run when requested. Other skills can be selected automatically when their description matches. In Codex, use the skill picker or `$skill-name`; names may appear under the `kalstein-skills` namespace. `ask-matt` remains the upstream-compatible router.

### User-invoked

- **[ask-matt](skills/engineering/ask-matt/SKILL.md)**: Ask which skill or flow fits your situation. A router over the skills in this repo.
- **[diagnose](skills/engineering/diagnose/SKILL.md)**: Establish a bug's cause from runtime evidence without authorizing a production fix.
- **[grill-me](skills/productivity/grill-me/SKILL.md)**: A relentless interview to sharpen a plan or design.
- **[grill-with-docs](skills/engineering/grill-with-docs/SKILL.md)**: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- **[handoff](skills/productivity/handoff/SKILL.md)**: Compact the current conversation into a handoff document for another agent to pick up.
- **[implement](skills/engineering/implement/SKILL.md)**: Implement a piece of work based on a spec or set of tickets.
- **[implement-spec](skills/engineering/implement-spec/SKILL.md)**: Implement the result of /to-spec and /to-tickets in code.
- **[implement-tickets](skills/engineering/implement-tickets/SKILL.md)**: Implement an explicit ticket list sequentially in one checkout, with the parent closing each verified ticket before advancing.
- **[improve-codebase-architecture](skills/engineering/improve-codebase-architecture/SKILL.md)**: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **[retro](skills/engineering/retro/SKILL.md)**: Conduct a retrospective on a coding session.
- **[setup-matt-pocock-skills](skills/engineering/setup-matt-pocock-skills/SKILL.md)**: Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
- **[teach](skills/productivity/teach/SKILL.md)**: Teach the user a new skill or concept, within this workspace.
- **[to-questionnaire](skills/productivity/to-questionnaire/SKILL.md)**: Turn a decision you can't fully answer into a questionnaire for someone else to fill in.
- **[to-spec](skills/engineering/to-spec/SKILL.md)**: Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed.
- **[to-tickets](skills/engineering/to-tickets/SKILL.md)**: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
- **[triage](skills/engineering/triage/SKILL.md)**: Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs.
- **[wait-what](skills/productivity/wait-what/SKILL.md)**: Stop. That last message did not land: re-pitch it.
- **[wayfinder](skills/engineering/wayfinder/SKILL.md)**: Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.

### Model-invoked

- **[architecture-evidence](skills/engineering/architecture-evidence/SKILL.md)**: Generate reproducible architecture measurements and a bounded evidence queue from a Git repository, or explicitly continue a saved scan. Use when the user requests deterministic metrics, measurement coverage, ranking, or an architecture evidence report. Findings are evidence for later human or agent review, not automatic architecture decisions or refactoring.
- **[behavior-test](skills/engineering/behavior-test/SKILL.md)**: Write one minimal test through a stable public seam for an explicitly selected RED or COVERAGE cycle. Use as a fundamental capability inside TDD workflows, not as a feature implementation workflow.
- **[close-spec](skills/engineering/close-spec/SKILL.md)**: Verify completion and close a spec or ticket when requested, using current tracker relationships, acceptance criteria, and implementation evidence. Use existing project scope and acceptance evidence without requiring a new issue schema.
- **[code-review](skills/engineering/code-review/SKILL.md)**: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
- **[codebase-design](skills/engineering/codebase-design/SKILL.md)**: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
- **[diagnosing-bugs](skills/engineering/diagnosing-bugs/SKILL.md)**: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
- **[domain-modeling](skills/engineering/domain-modeling/SKILL.md)**: Build and sharpen a project's domain model. Use when discussing codebase terminology, editing its GLOSSARY.md or existing CONTEXT.md, or recording an ADR.
- **[e2e-coverage](skills/engineering/e2e-coverage/SKILL.md)**: Add or update target-authoritative end-to-end coverage for UI acceptance while preserving project fixtures, test catalogs, and app-session lifecycle. Use inside UI implementation or for explicitly requested coverage of existing behavior.
- **[git-commit](skills/engineering/git-commit/SKILL.md)**: Finalize a scoped local Git change by reusing existing review and verification, staging only the intended candidate, and committing it. Push only when explicitly requested. Use when implementation is finished and Git finalization remains; review and repair belong to the owning workflow.
- **[grilling](skills/productivity/grilling/SKILL.md)**: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
- **[library-docs](skills/engineering/library-docs/SKILL.md)**: Find versioned evidence in a project's copied library documentation before changing external-library APIs or lifecycle behavior. Use when the project has pinned documentation packages; disclose missing preparation or absent source evidence.
- **[pr](skills/engineering/pr/SKILL.md)**: Use when writing a PR body.
- **[prototype](skills/engineering/prototype/SKILL.md)**: Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.
- **[research](skills/engineering/research/SKILL.md)**: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
- **[sync-user-manual](skills/engineering/sync-user-manual/SKILL.md)**: Synchronize canonical user documentation with changed UI acceptance during implementation or review. Use when changed behavior, E2E/catalog mappings, or an explicit request affects the user guide; Git finalization only consumes completed evidence.
- **[tdd](skills/engineering/tdd/SKILL.md)**: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
- **[test-evidence](skills/engineering/test-evidence/SKILL.md)**: Validate focused test output as deterministic RED, GREEN, or COVERAGE evidence. Use as a fundamental capability inside test-first workflows, not to implement behavior.
- **[ui-tdd](skills/engineering/ui-tdd/SKILL.md)**: Implement UI features or repair UI regressions test-first, then operate the actual app with Agent Browser and inspect screenshots before reporting completion. Use for interaction, rendering/layout, accessibility behavior, IPC, persistence, or restore changes; literal copy-only edits use direct verification.
- **[wizard](skills/engineering/wizard/SKILL.md)**: Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.
- **[write-a-skill](skills/engineering/write-a-skill/SKILL.md)**: Create or update a focused agent skill with valid metadata, progressive disclosure, and tested bundled resources. Use when the user asks to write, build, restructure, or improve a reusable skill.
- **[writing-for-agents](skills/productivity/writing-for-agents/SKILL.md)**: Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md.
- **[zoom-out](skills/engineering/zoom-out/SKILL.md)**: Orient the user in an unfamiliar code area by mapping the higher-level architecture, ownership, callers, dependencies, and domain concepts. Use when local code context is confusing or the user asks for the bigger picture.

## Maintain this fork

Edit the source repository, commit reviewed changes, and bump the release version. Keep an `upstream` remote for selected mattpocock updates and integrate them with the local adaptations. See [customization and source revisions](docs/customization.md), [verification and limits](docs/verification.md), and the [canonical install wording](.agents/install-block.md).

Upstream attribution: [Matt Pocock and contributors](https://github.com/mattpocock/skills). This fork is maintained independently and is not an official upstream release. See [LICENSE](LICENSE).
