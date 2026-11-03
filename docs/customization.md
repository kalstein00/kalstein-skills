# Customization and source integration

## Accepted scope, 2026-11-03

Distribute a portable `kalstein-skills` plugin from `kalstein00/kalstein-skills`, with marketplace namespace `kalstein`. Combine current upstream engineering flows with useful local workflow extensions. UI acceptance includes actual Agent Browser operation, saved captures opened for pixel inspection, and action/result/image evidence in the final completion response. Project commands, data, product decisions, E2E authority, and runtime adapters remain project-owned.

## Source revisions

- Fork starting point: `d81f3a183412e71a5b1e84ca21bc1a35eea03a60`, package `1.2.3`.
- Upstream: `mattpocock/skills` `main` at `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`, fetched 2026-11-03. Its released manifest is `1.3.2`; this revision also includes unreleased changes. The integration retains the full upstream ancestry and its non-promoted experimental skills without promoting them.
- Local source: the DART repository's `.agents/skills` at `55e6a3b88d563c29219f030a1bcbf58679daffc1`, inspected 2026-11-03. Only tracked package assets are imported; runtime installations, generated reports, caches, and `node_modules` are excluded. Source fingerprints are in [local-sources.json](local-sources.json).
- Fork release: `1.4.0`, an independent version sequence. The upstream MIT license and attribution remain in [LICENSE](../LICENSE).

## Local skill disposition

| Local source | Integration decision |
| --- | --- |
| `agent-browser` | Portable CLI discovery and actual Electron/web attachment; project wrapper and CDP discovery stay project-owned |
| `architecture-evidence` | Import the complete tracked portable scanner package and its references/tests; retain its own pinned runtime/tool preparation |
| `behavior-test` | Import the narrow public-seam test capability |
| `close-spec` | Generalize acceptance-based authorized closure and state readback; require UI evidence |
| `code-review` | Retain latest upstream standards search and fresh review contexts; add full worktree/new-file candidate, caller policy, and UI evidence handling |
| `codebase-design` | Retain current upstream; local entrypoint has no additional operative rules |
| `dart-e2e-coverage` | Generalize to `e2e-coverage`; project E2E catalog/session/fixture rules remain authoritative |
| `diagnose` | Preserve explicit diagnosis-only entry; latest `diagnosing-bugs` owns the evidence loop and forced-mutation check |
| `domain-modeling` | Retain upstream discipline with existing `CONTEXT`/context-map compatibility |
| `git-commit` | Import scoped finalization and reuse of finished verification/review; repair stays with its owner |
| `grill-me`, `grill-with-docs` | Retain current upstream wrappers |
| `grilling` | Retain upstream's newer affirmative recommendations and fresh subagent contexts |
| `handoff` | Retain upstream entry with compact continuation state, verification freshness, and UI image pointers |
| `impeccable` | Keep as a separately installed third-party tool; transfer relevant adjacent-control consistency and bounded visual inspection to `ui-tdd`. Do not vendor its independent binary/download lifecycle |
| `implement` | Add route selection, evidence reuse, documentation, full-candidate review, and UI completion output |
| `implement-spec` | Retain latest fresh-per-ticket graph orchestration; add per-ticket routes, combined evidence, safe checkout handling, and scoped close-out |
| `implement-tickets` | Import sequential fresh-worker workflow, same-model role effort settings, parent-owned broad gates, and UI evidence propagation |
| `improve-codebase-architecture` | Combine upstream report/design vocabulary with evidence-first bounded audit and closed Candidate Register modes |
| `library-docs` | Generalize pinned copied-source lookup; the target project's CLI/corpus/cache configuration is a prerequisite, not a bundled runtime |
| `retro` | Retain latest upstream, including writing-for-agents use |
| `setup-matt-pocock-skills` | Retain the existing command name for compatibility; make setup idempotent, preserve existing domain docs, and discover project UI runtime facts |
| `sync-user-manual` | Generalize canonical documentation synchronization with optional project impact/catalog tools |
| `tdd` | Retain latest upstream seam catch/miss guidance; reuse already accepted seams and project domain routing |
| `test-evidence` | Import deterministic RED/GREEN/COVERAGE classification |
| `to-spec`, `to-tickets` | Retain upstream templates and dependency graph; add scenario-specific live UI acceptance/evidence |
| `triage` | Retain current upstream, including newer issue handling; project domain routing preserves existing `CONTEXT` vocabulary |
| `ui-tdd` | Generalize feature/regression workflow and strengthen final-candidate interaction, image inspection, and completion delivery |
| `write-a-skill` | Import focused metadata, progressive disclosure, and package-validation guidance |
| `writing-for-agents` | Retain current upstream; local operative text matches |
| `zoom-out` | Import read-only architecture orientation |

Local `.codex/skills/oracle` and `release-electron-app` are project/provider-specific operational integrations, not copied into this general plugin. Keep them or migrate their runtime configuration in a separate scoped task. System skills and separately installed plugins are not copied. This update does not delete local skills, alter DART source/guidance, or replace current global installations.

## Runtime and project boundary

### Decision update, 2026-11-04: per-ticket closure

Version `1.4.1` changes implement-tickets from commit-only completion to parent-owned tracker close-out after every supplied implementation ticket. After verifying its acceptance, review, documentation, and scoped commit, the parent posts/reuses completion evidence, closes the ticket as completed, reads back its actual state and available parent progress, and only then dispatches the next worker. Workers never mutate the tracker; the parent PRD/spec stays open. This supersedes the initial batch wrapper's no-automatic-ticket-closure rule, without adding push, merge, or parent-closure authority.

Ticket-specific acceptance cannot be deferred behind closure. Only broader batch regression gates may remain pending, explicitly disclosed in the completion comment. Failed or uncertain tracker writes stop advancement; later evidence that invalidates acceptance on a ticket closed by this batch triggers bounded reopen/repair/reverification. Valid earlier closures survive an unrelated queue failure. Native parent progress is read from actual linked child states, never fabricated from the batch size. The owning protocol is [implement-tickets/CLOSEOUT.md](../skills/engineering/implement-tickets/CLOSEOUT.md).

GitHub's official [parent/sub-issue progress documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-parent-issue-and-sub-issue-progress-fields), checked 2026-11-04, identifies the native parent relationship and completed-sub-issue progress field. The workflow reads that relationship/state rather than maintaining a second PRD counter.

The plugin contains instructions. Agent Browser must be available through the target project's approved wrapper or an installed CLI, with version-matched instructions. The actual web/Electron target, data, build, and required E2E commands must be runnable. The architecture scanner separately requires Node 24+, Git, npm, and its documented preparation; its dependency pins stay in its own package. Library documentation search needs a project's prepared copied corpus and CLI. A missing required capability is reported, not replaced with unrelated green tests.

Projects should keep existing `AGENTS.md`/`CLAUDE.md`, tracker/domain/ADR pointers, runtime wrappers, fixture/session/catalog authority, UI reference decisions, and canonical user-guide/QA owners. Migrate DART-specific references before deleting local adapters. The global package's default E2E capability does not silently satisfy an explicit project requirement to load `dart-e2e-coverage`.

## Upstream maintenance

1. Clone this fork and add `https://github.com/mattpocock/skills.git` as `upstream`.
2. Fetch upstream and integrate a selected commit in a working branch. Review identity/manifests, install wording, workflow references, and changed skill semantics; avoid a blind overwrite or force-sync of customized `main`.
3. Refresh affected human docs and router entries. Keep new experiments outside the promoted manifest until deliberately adopted.
4. Increment `package.json` for a release and run `node scripts/sync-plugin-version.mjs`; keep lockfile root identity/version aligned. The existing Changesets workflow uses this fork's package and repository identities.
5. Validate the package, review the complete candidate, and publish the authorized update. Use a version tag for exact cross-PC reproducibility, or `main` for curated ongoing updates. Installed sessions are refreshed separately.

Actual verification and its limitations are recorded in [verification.md](verification.md). Packaging checks establish discoverability and integrity; they do not prove that a future app feature has passed live UI acceptance.
