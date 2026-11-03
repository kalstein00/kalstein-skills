# Fork verification

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

Global plugin configuration and project-local skills are preserved. Cross-PC installation instructions require an available compatible Codex CLI; external app runtimes and project data are not bundled. No broad DART application suite or unrelated app UI was run for these instruction/package edits.

Root release-tool installation preserves upstream dependency resolutions. `npm audit --json` reported one high-severity indirect `js-yaml` entry in that inherited developer toolchain (exit 1); the plugin's instructions do not require installing the root release dependencies. Dependency remediation is outside this workflow-customization change and was not silently applied. The unchanged `wait-what` human page intentionally omits a FAQ under the authoring guide's optional-question rule; changed/new pages were checked separately rather than forcing unrelated prose edits.
