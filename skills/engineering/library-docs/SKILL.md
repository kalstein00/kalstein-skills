---
name: library-docs
description: Find versioned evidence in a project's copied library documentation before changing external-library APIs or lifecycle behavior. Use when the project has pinned documentation packages; disclose missing preparation or absent source evidence.
---

# Library Docs

Resolve the target project's copied-documents lock/manifest, installed search CLI, package/snapshot pin, and configured shared caches from its instructions. The plugin does not ship a documentation engine or copied library corpus. Use the project's public CLI and installed help; never assume a DART path, model, cache, or library scope in another project.

1. Inspect only the requested library's lock entry and manifest. Distinguish the installed package version from the document snapshot/revision; rolling or legacy snapshots are not release guarantees.
2. Search a short query that preserves API identifiers, error strings, versions, and negative conditions. Use English for an English source corpus while answering in the user's language. Serialize operations against the same index cache. Verify the returned status and exact requested scope; ranking is a discovery aid, not proof.
3. Select only directly relevant results. Read bounded source ranges when an excerpt is insufficient, rather than dumping every top result. If the source does not support the claim, narrow the query based on the concrete gap or report no evidence.
4. Cite the library/package version, snapshot, source URL, and selected reference/range. Use separate explicit pins for version comparisons. Do not change pins to obtain a preferred answer.
5. When preparation is missing, inspect the actual error and reuse the existing shared cache and pinned engine/model. Perform authorized preparation for the requested scope; distinguish missing, incompatible, stale, and corrupt states. Preserve old evidence and versions. Preparation is not permission to delete caches, re-scrape sources, rewrite copied documents, or update dependencies.

If the project has no copied package, follow its documented fallback, normally the library's official documentation. State which source route was used. If project instructions require copied evidence and it remains unavailable, report that missing capability before behavior-sensitive edits. Do not silently change library scope, model, or retrieval mode to manufacture a successful lookup.
