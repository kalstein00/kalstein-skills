# Fork verification

## Candidate, 2026-11-04: official Agent Browser guides

The standalone plugin skill is removed; `ui-tdd` now loads the official CLI guides through the target project route, installs the official CLI on first UI use when no route or installation exists, and retains actual target and UI evidence requirements. The patch changeset was consumed for the 1.4.4 release candidate.

- Official Agent Browser CLI 0.41.2 listed bundled `core` and `electron` guides. A named session opened example.com and returned an interactive snapshot.
- `npm run check-plugin-version` passed at 1.4.4, and package and lockfile versions agree. Official Claude CLI 2.1.0 validated both manifests without warnings.
- Codex CLI with an isolated temporary home and process-only local marketplace overrides discovered `kalstein-skills@kalstein` at 1.4.4. A temporary-home PATH-helper warning did not prevent discovery. This does not refresh the installed plugin.
- Instruction scenario inspection confirmed project-route priority, reuse of an installed CLI, on-demand installation, missing-browser preparation, and blocked failure reporting. This is an instruction check, not an automated fresh-machine UI task.
- Reference scan found no remaining skill invocation or removed directory path; `git diff --check` passed. The local source fingerprint is historical.
- The dev link script was not run: it deletes existing non-symlink skill directories in its destinations. No agent-browser entry was found in those destinations. Existing plugin caches require their normal refresh after publication.


## Release 1.4.3, 2026-11-04: repository-neutral package guidance

Base: `5034baac573dbb768f7f667cfcba116d35308465`. The accepted change removes source-project naming and integration assumptions from distributed instructions, architecture references, and test fixture names. Historical validation outcomes and original import metadata remain intact. `npm run version` consumed the patch changeset and synchronized package/plugin version `1.4.3`; the lockfile root and installation examples match.

| Check | Actual result |
| --- | --- |
| `npm test --prefix skills/engineering/architecture-evidence` | 129 passed, 0 failed, 0 skipped; duration 41761 ms. Reused for the unchanged tested source and fixtures; later edits only affect instructions, installation docs, and release metadata |
| Production script and fixture scope inspection | All 27 production `.cjs` files retain their Git blob identities. Ten test files differ only in temporary-directory prefixes and one description; assertions are unchanged |
| Source-project reference scan | Distributed skills, manifests, and current prose have no remaining source-project name. The sole remaining original skill identifier is historical provenance in unchanged `docs/local-sources.json` |
| Metadata/link inspection | All 41 promoted skill frontmatters and Codex invocation policies match; changed human docs retain required sections and relative/fork-local links resolve |
| `npm run check-plugin-version` and lockfile root inspection | Passed: package, plugin, lockfile root, and root package entry agree on `1.4.3`; dependency resolutions are unchanged |
| Official `@anthropic-ai/claude-code@2.1.0 plugin validate --help`, then validation of both manifests | Supported syntax confirmed; both passed without warnings |
| Codex CLI, isolated temporary home with process-only local marketplace overrides | Discovered `kalstein-skills@kalstein` `1.4.3` as available and uninstalled; user configuration and installation were not modified. The CLI's temporary-home PATH-helper warning did not prevent discovery |
| Current-session direct-route review | Changes are limited to repository-neutral wording, mechanical fixture names, uninstall guidance, and release metadata; production scanner behavior and project-owned adapters are preserved |
| `git diff --check` | Passed |

The README and canonical install block now document `codex plugin remove kalstein-skills@kalstein` instead of removing the upstream plugin. The installed `codex plugin remove --help` confirms the `PLUGIN@MARKETPLACE` selector syntax. This was a documentation check; no plugin was removed.

The existing standalone-project regression exercises scanner preparation against a temporary Git/TypeScript project with its own rules. This package test does not claim acceptance for an external application. The router was inspected; its target-owned corpus/runtime routing remains accurate without a flow change. The test log is `kalstein-repository-neutral-scanner-tests.log` in the verification host's OS temporary directory; the counts and scope above are the durable record.

### Publication verification

Release commit: `ff8697f3008c9c358df4ad92c8b85559a32c1e5b`. A normal atomic push published `main` and the annotated `v1.4.3` tag; remote ref readback confirmed the tag resolves to that commit. The [release workflow](https://github.com/kalstein00/kalstein-skills/actions/runs/41792972014) completed successfully, and [GitHub release v1.4.3](https://github.com/kalstein00/kalstein-skills/releases/tag/v1.4.3) was published as a stable release on 2026-11-04 with only this version's changelog section.

In the isolated temporary home, `codex plugin marketplace add kalstein00/kalstein-skills --ref v1.4.3 --json` downloaded the published Git source. `plugin list --marketplace kalstein --available --json` then discovered `kalstein-skills@kalstein` `1.4.3` as available and uninstalled. The temporary-home PATH-helper warning remained non-blocking. User configuration and installed plugins are unchanged. This publication record is a documentation-only follow-up to the release commit.

## Release 1.4.2, 2026-11-04: explicit ticket handoff

Base: `215d6b6ad05bce581a38673b01ee34ef7cadf942`. This instruction-only release adds [the shared ticket handoff contract](../skills/engineering/implement/TICKET.md), links creation/dispatch/implementation to it, clarifies accepted test boundaries and routing by actual behavior, and requires evidence applicability after edits. `npm run version` consumed the patch changeset and synchronized package/plugin version `1.4.2`; the lockfile root and installation examples were updated to match.

| Check | Actual result |
| --- | --- |
| `npm run check-plugin-version` and lockfile root inspection | Passed: package, plugin, lockfile root, and root package entry agree on `1.4.2`; dependency resolutions are unchanged |
| Official `@anthropic-ai/claude-code@2.1.0 plugin validate --help`, then `plugin validate` for each manifest | Supported syntax confirmed; both manifests passed with no warnings |
| Codex CLI `0.166.0`, isolated temporary home with process-only local marketplace overrides, `plugin list --marketplace kalstein --available --json` | Discovered `kalstein-skills@kalstein` `1.4.2` as available and uninstalled; the user's existing installation still reports `1.4.1`. The CLI warned that temporary homes cannot create PATH helper aliases, but discovery succeeded. User configuration and installed plugins are unchanged |
| Inline Node/`js-yaml` structural inspection | All 41 promoted frontmatters and Codex invocation policies match; changed human docs retain required sections in order; relative and fork-local links/anchors resolve; new prose punctuation passes |
| Independent Standards and Spec reviews | Standards reported one P3 prose-branch formatting issue, corrected to a three-row execution-flow table and checked locally. Spec reported no findings; accepted decisions, UI proof, tracker ownership, and same-model policy remain intact |
| `git diff --check` | Passed |

Manual instruction walkthroughs covered the following inputs and required outcomes. They check consistency of the written workflow, not actual model execution.

| Scenario | Outcome under the written instructions |
| --- | --- |
| Approved non-UI ticket names an API request/response | Recover and reuse that public boundary with its catch/miss limits, without another seam approval |
| Feature approved, but no test boundary can be recovered | Return the missing boundary decision to the parent, or ask the standalone user before dependent test writes |
| Decisions exist only in the planning conversation | Preserve them inline or in a durable linked note before publishing ready tickets; a separate spec is optional |
| Existing ready ticket lacks handoff fields | Recover accepted context from sources first; a ready label alone cannot resolve a necessary missing decision |
| Criterion belongs to a sibling ticket | Keep its acceptance with that ticket and represent the actual prerequisite as a dependency |
| Authentication or restore changes through configuration | Choose the corresponding behavior route rather than direct checks based on the settings file type |
| Non-UI behavior ticket or documentation-only ticket | Include only affected layers; behavior uses agreed boundaries, documentation uses direct checks without fabricated UI work or RED |
| Handler/lifecycle edit follows passing checks | Map the changed boundary to affected integration/E2E/live checks and refresh them; parent checks reuse applicability |
| Documentation edit follows application verification | Run relevant document/package checks and retain unrelated runtime evidence with its applicability reason |
| User only asks whether a lower-tier worker is suitable | Explain the workflow; discussing or editing skills does not dispatch implementation workers or mutate tickets |

The unchanged architecture scanner and application UI suites were not rerun for these instruction edits. No Sol/Terra comparison was executed, so these checks do not establish model compliance or equal implementation quality. The batch's existing same-model policy is preserved.

### Publication verification

Release commit: `52125e62c786e5d45add39213f1d27867d0114b9`. A normal atomic push published `main` and the annotated `v1.4.2` tag; remote ref readback confirmed the tag resolves to that commit. The [release workflow](https://github.com/kalstein00/kalstein-skills/actions/runs/41788479659) completed successfully, and [GitHub release v1.4.2](https://github.com/kalstein00/kalstein-skills/releases/tag/v1.4.2) was published as a stable release on 2026-11-04. Release notes contain only this version's changelog section.

Codex CLI `0.166.0`, using the same isolated temporary home, ran `plugin marketplace add kalstein00/kalstein-skills --ref v1.4.2 --json` and then `plugin list --marketplace kalstein --available --json`. The downloaded Git source discovered `kalstein-skills@kalstein` `1.4.2` as available and uninstalled. The temporary-home PATH-helper warning remained non-blocking. This proves remote tagged-package discovery without updating the user's installed plugin or global configuration. The publication record is a documentation-only follow-up to the release commit.

## Release 1.4.1, 2026-11-04: sequential ticket close-out

The accepted change is parent-owned successful closure of each supplied implementation ticket before the next dispatch, with completion evidence and tracker readback. Parent PRDs/specs remain open. Ticket acceptance and the batch's deferred broad gates are distinct; later invalidation of acceptance on a ticket closed by this batch requires bounded state reconciliation. This supersedes 1.4.0's commit-only batch completion boundary. No real project ticket is being implemented or closed by editing this instruction package.

Base: `894f0f2535986bbca61bf9ad2b0d95ac670141c5`. The 1.4.0 scanner/runtime evidence below remains applicable only to unchanged package assets; it does not prove this new workflow behavior. This instruction/metadata change uses the direct route and does not require rerunning the unchanged scanner suite or app UI tests.

| Check | Actual result |
| --- | --- |
| `npm run check-plugin-version` | Passed: package, plugin, and lockfile root version `1.4.1` |
| Official `@anthropic-ai/claude-code@2.1.0 plugin validate` for each manifest file | Both passed, no warnings; reused the supported CLI route documented in the earlier record |
| Codex CLI with process-only local marketplace overrides, filtered available-plugin listing | Discovered `kalstein-skills@kalstein` `1.4.1`; not installed or enabled by this task |
| Inline structural inspection using `js-yaml` | All 41 frontmatters and Codex metadata match; 95 relative links in changed/new Markdown resolve; new prose punctuation passes. Unchanged historical changelog text was preserved |
| Independent Standards review | One reverse-dependency finding corrected by passing the parent's loaded context into close-spec; scoped recheck reported no remaining blockers |
| Independent Spec/forward scenario review | All 10 written-workflow scenarios consistent; stale wording about earlier in-batch tickets remaining OPEN was also corrected |

| Reviewed scenario | Expected result confirmed from the written workflow |
| --- | --- |
| First child complete; broad batch suite pending | Parent comments/closes/confirms/checkpoints before ticket two; batch remains unverified |
| Ticket acceptance gate missing | Keep open; run that check before closure |
| Uncertain close response | Re-read state and comments before retry; no duplicate mutation or advancement without confirmation |
| Already closed with valid evidence | Reuse; no reimplementation, duplicate comment, or close request |
| Two supplied tickets of four children, with another already closed | Observe `2/4`, then `3/4` if the remaining starting states match; never substitute the batch denominator |
| Later acceptance invalidation | Reopen only the affected ticket closed by this batch, verify state, repair/reverify, and close again |
| Unrelated final-suite failure | Preserve valid closures; report the batch incomplete |
| Worker attempts tracker writes | Worker remains evidence-only; parent owns reconciliation and readback |
| All children complete | Parent PRD/spec stays open |
| Parent progress unavailable or relationship missing | Keep confirmed child closure; report progress as unverified without inventing a counter or editing relationships |

These are semantic instruction checks, not live GitHub issue mutation tests. Editing this skill did not implement or close any real project ticket. Temporary CLI validation output is retained as `kalstein-1.4.1-manifests.log` in the verification host's OS temporary directory; the commands/results here are the durable record.

## Candidate, 2026-11-03

Release `1.4.0`, based on upstream `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`. This task changes workflow instructions and plugin packaging, not an application UI. Live app screenshots and application RED/GREEN are not claimed as evidence for this documentation task.

Skill/manifest candidate: `885a61453cf89fed71dd26640745ddb2ea8080f6`, published to the renamed fork's `main`. A subsequent documentation-only commit records remote delivery verification without changing the verified skill/manifest inputs.

## Checks

| Check | Actual result |
| --- | --- |
| `npm run check-plugin-version` at repository root | Passed: package and plugin version `1.4.0` |
| Official CLI `npx --yes @anthropic-ai/claude-code@2.1.0 plugin validate .claude-plugin/marketplace.json` | Passed, no warnings |
| Same official CLI validating `.claude-plugin/plugin.json` | Passed, no warnings |
| Codex CLI `0.165.0`, process-only local `marketplaces.kalstein.source_type/source` overrides, `plugin list --marketplace kalstein --available --json` | Discovered `kalstein-skills@kalstein`, version `1.4.0`, available and not installed; user configuration unchanged |
| Same Codex CLI with process-only Git source overrides for `https://github.com/kalstein00/kalstein-skills.git`, `ref=main`; `plugin marketplace upgrade kalstein`, then filtered `plugin list` | Downloaded the published marketplace and discovered plugin `1.4.0`; not installed/enabled. A fresh remote listing first reported its absent snapshot, then the documented refresh prepared it. Default configured marketplaces still contain the original registrations only |
| Inline Node structural inspection using installed `js-yaml` | All 41 promoted skill frontmatters and Codex metadata parsed; invocation policies match; README/docs entries present; 27 changed/new human pages have the required sections |
| Bundled file/link inspection | 131 relative links checked, no missing targets; project paths remain target-owned |
| Imported scanner integrity | All 79 tracked source assets match the recorded local package byte-for-byte |
| `npm ci --ignore-scripts` in scanner package, then `npm test --prefix skills/engineering/architecture-evidence` at repository root | 129 passed, 0 failed, 0 skipped; scanner setup audit reported 0 vulnerabilities |
| `git diff --check` with the checkout's normal line-ending configuration | Passed |
| Independent Standards and Spec subagents, fresh contexts | Initial findings corrected; scoped repair rechecks reported no remaining blocking findings |

The latest official Claude package `2.1.317` failed to execute its native Windows binary on this host. The available JavaScript CLI `2.1.0` does not support the inherited `--strict` flag; installed help established the supported command, and both manifest files were validated explicitly with zero warnings. This is compatibility manifest verification, not a claim of the latest native CLI passing. A first unregistered local Codex listing returned no entries; explicit documented process-scoped local-source overrides established the actual discovery result without changing installed plugins.

Temporary logs retained on the verification host: `kalstein-manifests-final.log`, `kalstein-codex-scoped-discovery.json`, `kalstein-codex-remote-refresh.log`, `kalstein-codex-remote-discovery.json`, `kalstein-scanner-tests.log`, and `kalstein-diff-check.log` in its OS temporary directory. They are not cross-PC artifacts. The commands, results, source identities, and scope in this document are the durable record.

## Behavioral scenarios

The independent Spec review exercised these written-instruction scenarios; all eight were consistent after repair:

| Scenario | Required decision/evidence |
| --- | --- |
| New UI option with Save/restore | Feature UI route, faithful E2E RED/GREEN, actual Save/reopen journey, inspected image and completion evidence |
| Clipped or overlapping UI | Live reproduction, regression E2E RED/GREEN, original-scenario recheck and contextual comparison |
| Fixed English button label | Direct proportionate checks; live appearance only when wrapping/truncation may change |
| Browser CLI unavailable while tests pass | Blocked before UI production edits; tests do not discharge live proof |
| Worker returns an uninspected image path | Incomplete until actual pixel inspection and observation/artifact delivery |
| Later ticket changes a captured screen | Refresh affected final-candidate live evidence; reuse unaffected checks |
| Spec already accepts test seams | Reuse the decision; reopen only a materially changed or missing seam |
| Diagnosis-only request | Evidence and cause without production repair |

Regressions found during this task were conflicting literal-copy ticket requirements, universal-TDD claims in router/human docs, ambiguous capability invocation, and three copied Codex policies that disabled required model-invoked capabilities. Their corrections are covered by the scenario recheck and metadata parse. This is semantic workflow review, not real app execution.

## Limits

Global plugin configuration and project-local skills are preserved. Cross-PC installation instructions require an available compatible Codex CLI; external app runtimes and project data are not bundled. No source-project application suite or unrelated app UI was run for these instruction/package edits.

Root release-tool installation preserves upstream dependency resolutions. `npm audit --json` reported one high-severity indirect `js-yaml` entry in that inherited developer toolchain (exit 1); the plugin's instructions do not require installing the root release dependencies. Dependency remediation is outside this workflow-customization change and was not silently applied. The unchanged `wait-what` human page intentionally omits a FAQ under the authoring guide's optional-question rule; changed/new pages were checked separately rather than forcing unrelated prose edits.
