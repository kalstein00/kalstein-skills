# Customization and source integration

## Standalone ticket evidence, 2026-11-09

An explicit standalone `implement` invocation for a GitHub ticket now authorizes a completion comment after verification, review, and commit. The comment connects acceptance results to verification and retained evidence, discloses local-only delivery and artifact access limits, and is read back before its URL is reported. Recovery reuses a matching comment; failed or unconfirmed posting leaves tracker delivery incomplete. Issue state and labels remain unchanged, and closure still needs a separate request. Batch orchestrators retain their existing tracker ownership. The authoritative instructions are in [implement](../skills/engineering/implement/SKILL.md).

## Accepted scope, 2026-11-03

Distribute a portable `kalstein-skills` plugin from `kalstein00/kalstein-skills`, with marketplace namespace `kalstein`. Combine current upstream engineering flows with useful local workflow extensions. UI acceptance includes actual Agent Browser operation, saved captures opened for pixel inspection, and action/result/image evidence in the final completion response. Project commands, data, product decisions, E2E authority, and runtime adapters remain project-owned.

## Source revisions

- Fork starting point: `d81f3a183412e71a5b1e84ca21bc1a35eea03a60`, package `1.2.3`.
- Upstream: `mattpocock/skills` `main` at `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`, fetched 2026-11-03. Its released manifest is `1.3.2`; this revision also includes unreleased changes. The integration retains the full upstream ancestry and its non-promoted experimental skills without promoting them.
- Local source: the original project repository's `.agents/skills` at `55e6a3b88d563c29219f030a1bcbf58679daffc1`, inspected 2026-11-03. Only tracked package assets are imported; runtime installations, generated reports, caches, and `node_modules` are excluded. Source fingerprints and original skill identifiers are historical provenance in [local-sources.json](local-sources.json), not installed skill names or runtime requirements.
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
| Source-project E2E coverage | Distribute as `e2e-coverage`; each target project's E2E catalog/session/fixture rules remain authoritative |
| `diagnose` | Preserve explicit diagnosis-only entry; latest `diagnosing-bugs` owns the evidence loop and forced-mutation check |
| `domain-modeling` | Retain upstream discipline with existing `CONTEXT`/context-map compatibility |
| `git-commit` | Import scoped finalization and reuse of finished verification/review; repair stays with its owner |
| `grill-me`, `grill-with-docs` | Retain current upstream wrappers |
| `grilling` | Retain upstream's newer affirmative recommendations and fresh subagent contexts |
| `handoff` | Retain upstream entry with compact continuation state, verification freshness, and UI image pointers |
| `impeccable` | Keep as a separately installed third-party tool; transfer relevant adjacent-control consistency and bounded visual inspection to `ui-tdd`. Do not vendor its independent binary/download lifecycle |
| `implement` | Add route selection, evidence reuse, documentation, full-candidate review, UI completion output, and confirmed GitHub completion comments |
| `implement-spec` | Retain latest fresh-per-ticket graph orchestration; add per-ticket routes, combined evidence, safe checkout handling, and scoped close-out |
| `implement-tickets` | Import sequential fresh-worker workflow, Terra implementation and Sol diagnosis, guarded Codex queue continuation, parent-owned broad gates, and UI evidence propagation |
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

Project-specific provider, runtime, and release integrations stay in target-project guidance. Existing project skills, system skills, and separately installed plugins retain their own installation and configuration.

## Runtime and project boundary

### Decision update, 2026-11-04: repository-neutral distribution

Distributed skill instructions, scanner references, and test fixture names use repository-neutral wording. The scanner's production implementation, assertions, report semantics, and historical validation outcomes are preserved. Source-project integration commands in historical references are described as external records rather than package prerequisites. Test temporary-directory prefixes use the package's `architecture-evidence` name.

Original import identifiers and fingerprints remain in `local-sources.json` solely for provenance. Current workflows resolve paths, commands, documentation tooling, fixtures, and project adapters from the target checkout's instructions and configuration.

### Decision update, 2026-11-04: explicit ticket handoff

Ticket creation, dispatch, and implementation share [implement/TICKET.md](../skills/engineering/implement/TICKET.md). Ready tickets preserve source decisions, exclusions, prerequisites, observable criteria, and verification boundaries for UI and non-UI behavior. The existing breakdown approval covers that content; accepted decisions are reused. Stable spec/ADR references are allowed, while implementation paths remain navigation hints rather than acceptance requirements.

The execution contract chooses by actual behavior before file type and requires a changed-boundary/check mapping when reusing evidence after edits. The batch parent checks that mapping before acceptance. These instruction changes reduce implicit context transfer and do not establish model equivalence. The later queue and model policy below supersedes the earlier same-model policy.

The 2026-11-05 follow-up uses the same `Verification` entries to record material failure conditions, route checks to the earliest stage that can run them, and match results before ticket closure. Standards checks evidence required by repository rules, while Spec checks whether the evidence demonstrates acceptance under the stated condition. Reviewers reuse existing results and send missing observations to the check owner.

### Decision update, 2026-11-04: per-ticket closure

Version `1.4.1` changes implement-tickets from commit-only completion to parent-owned tracker close-out after every supplied implementation ticket. After verifying its acceptance, review, documentation, and scoped commit, the parent posts/reuses completion evidence, closes the ticket as completed, reads back its actual state and available parent progress, and only then dispatches the next worker. Workers never mutate the tracker; the parent PRD/spec stays open. This supersedes the initial batch wrapper's no-automatic-ticket-closure rule, without adding push, merge, or parent-closure authority.

Ticket-specific acceptance cannot be deferred behind closure. Only broader batch regression gates may remain pending, explicitly disclosed in the completion comment. Failed or uncertain tracker writes stop advancement; later evidence that invalidates acceptance on a ticket closed by this batch triggers bounded reopen/repair/reverification. Valid earlier closures survive an unrelated queue failure. Native parent progress is read from actual linked child states, never fabricated from the batch size. The owning protocol is [implement-tickets/CLOSEOUT.md](../skills/engineering/implement-tickets/CLOSEOUT.md).

GitHub's official [parent/sub-issue progress documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-parent-issue-and-sub-issue-progress-fields), checked 2026-11-04, identifies the native parent relationship and completed-sub-issue progress field. The workflow reads that relationship/state rather than maintaining a second PRD counter.

The plugin contains instructions. Agent Browser uses the target project's approved wrapper when present, otherwise an installed CLI. On first UI use without either, the agent installs the official CLI using npm and prepares the browser binary if needed, then loads version-matched instructions. The actual web/Electron target, data, build, and required E2E commands must be runnable. The architecture scanner separately requires Node 24+, Git, npm, and its documented preparation; its dependency pins stay in its own package. Library documentation search needs a project's prepared copied corpus and CLI. A missing required capability is reported, not replaced with unrelated green tests.

Projects should keep existing `AGENTS.md`/`CLAUDE.md`, tracker/domain/ADR pointers, runtime wrappers, fixture/session/catalog authority, UI reference decisions, and canonical user-guide/QA owners. A project-mandated adapter remains authoritative; the plugin's default E2E capability satisfies it only when the project explicitly accepts that substitution.

### Decision update, 2026-11-04: official Agent Browser guides

The standalone plugin skill is removed in the 1.4.4 release. The official Agent Browser CLI provides version-matched core and Electron guides. `ui-tdd` retains project-owned wrapper and pin selection, actual target attachment, and UI acceptance requirements. The local-source table and fingerprint remain historical provenance.

## Upstream maintenance

1. Clone this fork and add `https://github.com/mattpocock/skills.git` as `upstream`.
2. Fetch upstream and integrate a selected commit in a working branch. Review identity/manifests, install wording, workflow references, and changed skill semantics; avoid a blind overwrite or force-sync of customized `main`.
3. Refresh affected human docs and router entries. Keep new experiments outside the promoted manifest until deliberately adopted.
4. Increment `package.json` for a release and run `node scripts/sync-plugin-version.mjs`; keep lockfile root identity/version aligned. The existing Changesets workflow uses this fork's package and repository identities.
5. Validate the package, review the complete candidate, and publish the authorized update. Use a version tag for exact cross-PC reproducibility, or `main` for curated ongoing updates. Installed sessions are refreshed separately.

Actual verification and its limitations are recorded in [verification.md](verification.md). Packaging checks establish discoverability and integrity; they do not prove that a future app feature has passed live UI acceptance.

## Ticket orchestration continuation

The ticket batch uses Terra for implementation and a read-only Sol agent for nontrivial diagnosis. Reviewers retain the invoking model at high effort. Direct worker-to-parent queue continuation is conditional on a verified Codex worker lifecycle: queue delivery alone cannot establish that a native subagent survives the parent turn, that the parent resumed, or that the worker has completed. Without that capability the active parent uses bounded native waits and reports the limitation. A Windows Codex Desktop top-level parent was observed resuming after direct worker notification; unloaded spawned parents remain unsupported in the tested path.
