# Execution

The skill directory (`SKILL`) and target Git repository (`PROJECT`) are independent absolute paths. Replace uppercase placeholders with actual paths; commands below use PowerShell variables for spaces in paths.

## Agent-owned automatic preparation

Users do not run setup commands. Start with:

```powershell
node "$SKILL/scripts/scan.cjs" --root "$PROJECT"
```

The entrypoint uses a per-user runtime keyed by package lock, bundled production script bytes, OS, architecture and Node ABI. Windows defaults to LOCALAPPDATA/architecture-evidence; other hosts use XDG_CACHE_HOME or ~/.cache/architecture-evidence. ARCHITECTURE_EVIDENCE_CACHE can select an explicit location. Identical skill copies across projects reuse the same runtime. The source skill needs no node_modules.

On a cache miss it acquires an exclusive preparation lock, copies package/lock/scripts into the managed cache, runs pinned npm ci, and verifies tool imports before writing readiness. An interrupted/failed install has no ready marker and is never reported as measured. A waiting process times out visibly rather than deleting another process's lock. Cached native/tool load failures remain explicit diagnostics; inspect/repair the named cache instead of silently downloading an alternative build. Node24+, Git and npm are host prerequisites. No MCP registration or version upgrade occurs.

Project setup adds only /.codex/tmp/architecture-evidence/ to Git's local info/exclude and creates ignored scan-config.json when absent. It discovers root and nested tsconfig.json/node/web/scripts/wdio configs; inspect the selection and adjust the ignored config to the user's actual scope when necessary. One discovered .dependency-cruiser.cjs with a src directory is selected; absent/ambiguous rules require agent inspection and remain a visible layer gap until resolved. Existing explicit configs are preserved. Do not use unrelated archived or vendored tsconfigs.

No external symbol index is prepared. File import evidence comes from captured source; symbol call/impact/test-link metrics are unsupported, so the overall report stays partial. On --reuse, stale inputs fail verification. Project source packages remain owned by the target: when preparation reports missing packages, run that project's documented frozen/lockfile-based install yourself and retry, preserving unrelated edits. Do not send the user an npm command as the solution.

The config below is an advanced agent reference, not a user prerequisite.

When overriding auto-selection, edit the ignored scan-config.json in PROJECT. Example for a simple TS project:

```json
{
  "scopes": [],
  "timeoutMs": 600000,
  "collectorHeapMb": 1024,
  "surfaceProjects": ["tsconfig.json"],
  "dependencyCruiser": {
    "configPath": ".dependency-cruiser.cjs",
    "targets": ["src"]
  }
}
```

All project paths are repository-relative. dependencyCruiser optionally accepts `root` for an app subdirectory; configPath remains repository-relative, while targets and rule-reported paths are relative to root. Use an existing CommonJS rule config with serializable fields. Loaded CommonJS config dependencies are fingerprinted and rechecked with the snapshot. Keep rules deterministic and file-backed; environment-dependent or arbitrary runtime file reads are not a supported configuration contract. Omit dependencyCruiser when no project rule set exists; layer evidence stays partial with a diagnostic, rather than using invented rules. Missing/failed configured tools also stay partial/blocked.

surfaceProjects is ordered; the first project owns overlapping roots. Declaration files outside those projects use explicitly identified independent-v1 mode. Compiler options, source/config/type/package reads and resolution observations are captured and reverified. Type diagnostics are unavailable, never zero exports. Pinning the collector compiler does not assert equivalence to a different project compiler version.

## Run

```powershell
$CONFIG = Join-Path $PROJECT '.codex/tmp/architecture-evidence/scan-config.json'
node "$SKILL/scripts/scan.cjs" --root "$PROJECT" --config "$CONFIG"
```

Stdout contains status, absolute output (raw JSON), textOutput (human-readable UTF-8 text), snapshotId, elapsedMs. Read compact fields from the JSON at output; stderr reports collector progress. Exit codes: 0 complete, 1 partial, 2 blocked. Each collector has a 64 MiB transport bound and a configurable heap (1024 MiB default; 256–4096 range). The total timeout defaults to120000ms; this example allows600000ms. Use a fresh CLI process for each large report.

Inspect measurement.required/missing/unavailable, applicability, diagnostics, collectors, ranking and queue.selection. The raw canonical report includes source/dirty bytes, selected Git commits, tools/config/schema, graph and ledger identities. Unsupported languages, ambiguous symbols, graph omissions and unavailable unresolved-reference enumeration remain explicit partial evidence. Required missing/unavailable must be zero before claiming applicable required metrics succeeded; this does not imply whole-repository completeness or semantic review.

For a bounded preview, set REPORT to the output path and run the following. Full collector inputs can contain thousands of type-resolution records; do not print the whole collectors object. Snapshot ID is snapshot.id; normalized config identity is snapshot.input.config. Total metric rows and required valid rows are different counts.

```powershell
node -e "const r=JSON.parse(require('node:fs').readFileSync(process.argv[1],'utf8')); console.log(JSON.stringify({status:r.status,snapshot:r.snapshot?.id,configIdentity:r.snapshot?.input.config,measurement:r.measurement,review:r.review,diagnosticCount:r.diagnostics?.length,diagnostics:r.diagnostics?.slice(0,8),selected:r.queue?.selection.selected},null,2))" "$REPORT"
```

For identical-input repeatability, copy the first output before rerunning (the same identity uses the same output filename), then compare both canonical file SHA-256 hashes. Source/config/graph changes require a fresh scan, not stale reuse.

```powershell
node "$SKILL/scripts/scan.cjs" --root "$PROJECT" --config "$CONFIG" --reuse "$REPORT"
# Only on an explicit next request: save REPORT's queue.next object alone in TOKEN.
node "$SKILL/scripts/scan.cjs" --root "$PROJECT" --config "$CONFIG" --reuse "$REPORT" --next "$TOKEN"
```

Reuse verifies source, graph, ledger and project inputs. It rejects stale/tampered artifacts. Next skips previously offered IDs but does not claim they were semantically reviewed or write dispositions. Do not auto-loop. Report the selected IDs, 5/20/3 caps and review count independently.

## Recovery

Read the named collector's diagnostic. Repair invalid config/map/ledger, missing tool dependencies, source/type failures, timeouts or stale graph inputs explicitly. Disabled symbol metrics cannot be restored through indexing. Do not install a graph tool; inspect callers using scoped rg and source reads. Preserve original ledger and report artifacts. Partial evidence can be handed to a reviewer with its limitations; it cannot establish complete measurement or implementation completion on its own.

## Script-generated text report

Every scan reaching artifact output also writes `architecture-evidence-YYYY-MM-DDTHH-mm-ss-SSSZ-<unique>.txt` beside the ignored raw JSON. UTC time and a unique suffix preserve all earlier text reports, including repeated identical snapshots and explicit next batches. Canonical JSON remains free of these volatile presentation fields.

The text includes snapshot/scope, required missing/unavailable counts, selected paths/symbols and metric values/units/provenance, signal-group lists, exclusion counts, graph/AST gaps, diagnostic recovery and measurement/review separation. It is a fixed script rendering, with no LLM call, scoring invention or semantic conclusion. Unknown values remain unknown. Return this file to the user; do not substitute an LLM-authored report.

Early preparation/argument failures write a blocked text report in the OS temporary `architecture-evidence-reports` directory, since project output may not be ready. The CLI still returns status blocked and exit2. If even text writing fails, reportWriteError is explicit. No report retention deletion is performed automatically.
