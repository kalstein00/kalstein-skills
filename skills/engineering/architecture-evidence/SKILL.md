---
name: architecture-evidence
description: Generate reproducible architecture measurements and a bounded evidence queue from a Git repository, or explicitly continue a saved scan. Use when the user requests deterministic metrics, measurement coverage, ranking, or an architecture evidence report. Findings are evidence for later human or agent review, not automatic architecture decisions or refactoring.
---

# Architecture Evidence

Measure the requested Git repository and return an inspectable report. This package owns deterministic source/AST/Git/graph collection, ranking, snapshot verification, and bounded selection. Those repeated, failure-sensitive system boundaries require the bundled scripts; architectural judgment remains with the consumer.

## Inputs and preparation

The user only invokes this skill or asks for a report. Handle setup yourself; do not ask the user to remember or execute installation, configuration, or indexing commands. Resolve the installed skill directory and target Git repository separately. Read [execution.md](references/execution.md) and run the bundled scanner with --root; --config is optional.

The entrypoint automatically prepares pinned tools in a per-user cache, creates ignored project configuration when absent, and captures current source before measurement. Reuse validates the saved snapshot. Announce first-time preparation briefly; tool installation never changes dependency versions or registers an MCP server. Node24+, Git and npm must be available. If a prerequisite is missing, diagnose it and perform an available authorized repair; report the precise blocker only if it cannot be repaired here.

Honor the user's scope. Inspect auto-selected tsconfigs and layer config for the project. Reuse existing explicit configuration; when multiple project rule sets or configs need a choice, resolve it from repository evidence and the requested scope. Do not invent layer rules. If declaration diagnostics identify missing project dependencies, use the project's existing lockfile and documented package manager to install them yourself, then retry the affected preparation. Preserve lockfiles and unrelated source changes; do not substitute versions, switch package managers, or turn a preparation failure into success.

## Execute and hand off

1. Run the bundled `scripts/scan.cjs` with `--root` (and an existing `--config` when supplied). Keep source, graph, config, and ledger inputs stable until verification finishes.
2. Inspect status, `snapshotVerified`, measurement counts, required missing/unavailable, applicability, and collector diagnostics. `partial`/`blocked` is not complete measurement. Never replace missing values with zero or a successful exit code.
3. Return the generated `textOutput` file to the user with a short execution status. The script generates the UTF-8 text report from observed fields; do not rewrite it with an LLM or add inferred findings. `output` remains the raw JSON for machine use. The timestamped text files accumulate without overwriting earlier reports.
4. Preserve Top 5 per signal group, at most 20 unique items and 3 per owner, charging every owner of a cluster. Repeating a scan does not advance the batch. Use verified reuse and `queue.next` only for an explicit continuation request.
5. Return the report to the user. The user may supply it to any review workflow; no sibling skill is called or required. A high metric is not a confirmed defect. Report actual LLM-reviewed IDs/count separately; scan starts at zero, `not-started`.

Read the saved signalContext, SCC dependencyKind and declaration breakdown before describing a signal.
Shape-only Top entries need responsibility/change-cost evidence; type-dependent cycles are not proven
runtime cycles; declaration entries are not runtime API counts. Multiple Top groups also do not prove a
defect. Preserve prior rejected reasons and reconsideration diagnostics shown in the report; an unchanged
reviewed-evidence suppression is a duplicate-review decision, not complete measurement or proof of safety.
Schema 5 excludes requires-type-only cycles from candidate selection while retaining raw measurements.
Rejected comparison failures stay outside the candidate queue in queue.comparisonDiagnostics; report
them separately, never as rediscovered defects. Item-local structural observations exclude Git history
and ranking drift; confirmed structural changes and 250 elapsed non-merge commits can still reopen.

Preparation writes its shared tool cache, local Git exclude entries, ignored config. Measurement writes only ignored raw artifacts. It does not edit source, write review dispositions, create issues, commit, or invoke another agent. If explicitly asked to record a reviewed disposition, read [review-decisions.md](references/review-decisions.md) and [LEDGER.md](references/LEDGER.md); preserve concurrent-change checks and the user's review authority.

## Contracts and verification

Read [CONTRACT.md](references/CONTRACT.md) for schema and identity, [INVENTORY.md](references/INVENTORY.md) for inclusion rules, [GRAPH.md](references/GRAPH.md) for supported import evidence and unavailable symbol graph metrics, and [STRUCTURAL-FINDINGS.md](references/STRUCTURAL-FINDINGS.md) for project rule provenance. Producer-specific references are named after their scripts. Read them only when explaining or changing that metric.

See [PORTABILITY.md](references/PORTABILITY.md) for the isolated-project validation record. Run `npm test` in this directory after script changes. The package includes synthetic graph/AST/Git/ledger tests; an actual project run must be reported separately. Copy or archive this entire directory excluding node_modules to use it elsewhere, then invoke the skill there; the agent handles preparation. The target project owns its source dependencies, rule config, and saved report/ledger; they are not package assets.
