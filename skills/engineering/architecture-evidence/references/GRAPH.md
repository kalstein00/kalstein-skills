# Graph evidence coverage

The scanner has no external symbol graph dependency or index setup. Its graph collector returns `unsupported` with an explicit diagnostic. Call fan-in/out, impact, cross-owner call edges and static test linkage are unavailable, not measured zero. These metrics appear in applicability as unsupported; the overall report remains partial even when all applicable source metrics succeed. Do not install a symbol graph tool to clear this diagnostic.

AST size/complexity, declaration surfaces, Git history and source import structural findings remain supported. Structural collection builds a fresh file graph directly from the captured JS/TS source through `source-imports.cjs`; it does not depend on a symbol collector. Source/config/ledger identities are rechecked before publishing. Existing normalized graph algorithms remain available for synthetic tests and historical evidence interpretation, but the production scanner does not fabricate symbol edges.

Use bounded rg to locate symbols and inspect imports, exports, aliases and registration/call sites for review. A text match is not a verified call edge. Dynamic or ambiguous relations remain unresolved without source or runtime proof.

See [STRUCTURAL-FINDINGS.md](STRUCTURAL-FINDINGS.md) for file-import resolution limits and layer rule provenance. Old configs containing `sdkPath` are rejected; remove that retired setting while preserving project scopes and rules. Saved reports remain historical evidence; run a fresh scan after changing collector/config inputs.
