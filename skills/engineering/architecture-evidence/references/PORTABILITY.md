# Portable package validation

> Historical validation: records below predate the 2026-09-25 external graph removal. Current scans use source imports and explicitly report symbol metrics as unsupported; old index/SDK instructions are obsolete.

2026-09-06, Windows, Node24.16.0.

- Copied the skill folder outside the source repository without node_modules and ran `npm ci` there: 46 packages installed from the package lock.
- Created a separate Git repository with two TypeScript source files, a tsconfig and a project-owned CommonJS dependency rule. Built its index through the installed CodeGraph1.2.0 public API.
- Invoked the copied `scripts/scan.cjs` with explicit --root/--config twice in fresh processes. Required metrics61, missing0, unavailable0, snapshotVerified true; canonical bytes identical. The configured a-no-b violation was observed once. Timings7363ms/5462ms; Git remained clean.
- Overall status remained partial/exit1 for short Git history and the pinned graph's unresolved-reference coverage. This is not whole-repository or semantic review completion.
- Package tests: `npm test`, 85/85 passed. Source-project benchmark/reporter regression tests remained outside this package and passed 2/2 after relocation; they are not package prerequisites.
- Portability regression tests cover an arbitrary Git root, package-owned tool versions, loaded rule-module identity changes and project-specific layer findings. Production scripts use the supplied target repository and package-owned tools independently of the source project and sibling skills.

This historical validation used a small real fixture; it does not establish whole-project benchmark coverage or verification of every operating system. Its graph-index setup describes the older runtime only. Current preparation and target-owned source dependencies and declaration/layer configuration follow [execution.md](execution.md).

## Automatic preparation

The scan entrypoint now accepts --root alone. A fresh Git fixture without configuration/index completed preparation and measurement, with required missing/unavailable0 and verified snapshot. Repeat execution preserved identity and reused the shared cache. A second project used the same runtime with cacheHit=true. An invalid SDK configuration returned blocked with no measurement report. Local Git status remained clean; no project dependency installation command was required from the user. The automatic test uses real npm/CodeGraph when the shared cache is cold.

Final package suite after automatic preparation and missing-rule diagnostics:87/87 PASS; repository skill metadata/link validation:26 skills PASS.

Independent forward-test copied the skill without node_modules into a new temporary location and ran it against a new Git/TS project without config or index. Config/index were created automatically, the shared cache was reused, both directories remained without node_modules, and Git stayed clean. Scan was verified with required missing/unavailable0; overall partial remained explicit.

Script-owned text report verification:89/89 package tests passed. Actual fixture execution emitted a UTF-8 timestamped text artifact. Tests preserve canonical JSON equality across runs, verify unique retained text filenames, retain partial/unknown values and observed paths/metrics, and produce a blocked text artifact for early argument/preparation failure. No LLM API is used by the renderer.
