# Canonical installation

This fork uses repository `kalstein00/kalstein-skills`, marketplace `kalstein`, and plugin `kalstein-skills`. Keep README commands in sync with this file.

## Codex

```powershell
codex plugin marketplace add kalstein00/kalstein-skills --ref main
codex plugin add kalstein-skills@kalstein
```

Start a new chat/session after installation. Confirm `codex plugin list --json` shows the fork and intended version. Repository, marketplace, and plugin names are separate identifiers.

### Refresh an existing installation

```powershell
codex plugin marketplace upgrade kalstein
codex plugin add kalstein-skills@kalstein
```

Restart the app or start a new session and inspect the installed version. Marketplace refresh and installed plugin refresh are separate observations. Releases increment the plugin/package version. For a reproducible release, use `--ref v1.4.1` only after that tag is published; a tag intentionally does not follow later main updates.

### Replace the upstream installation

Install and verify this fork first. Disable the original `mattpocock-skills@mattpocock` in the plugin UI, or explicitly remove it:

```powershell
codex plugin remove mattpocock-skills@mattpocock
```

Review project-local customizations and adapters before removing overlapping skill copies. Preserve project guidance, runtime wrappers, and unrelated skills. Use the new canonical repository URL for new installs after the rename.

## Claude Code

```bash
claude plugin marketplace add kalstein00/kalstein-skills
claude plugin install kalstein-skills@kalstein
```

This fork uses its own marketplace, not `claude-plugins-official`. Other compatible harnesses need their own runtime verification.
