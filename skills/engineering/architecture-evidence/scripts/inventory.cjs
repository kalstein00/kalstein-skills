'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { sourcePath, fingerprint } = require('./schema.cjs');
const LANGUAGES = { ts: 'typescript', tsx: 'typescript', mts: 'typescript', cts: 'typescript', js: 'javascript', jsx: 'javascript', cjs: 'javascript', mjs: 'javascript', rs: 'rust', c: 'c', h: 'c', cc: 'cpp', cpp: 'cpp', hpp: 'cpp', go: 'go', py: 'python', ps1: 'powershell', psm1: 'powershell', sh: 'shell', sql: 'sql', java: 'java', kt: 'kotlin', cs: 'csharp', rb: 'ruby', vue: 'vue', svelte: 'svelte', swift: 'swift' };
function classifyPath(file) {
  const normalized = sourcePath(file);
  const parts = normalized.toLowerCase().split('/');
  const name = parts.at(-1), extension = name.split('.').at(-1);
  if(parts.some((p,i)=>p==='.codex'&&parts[i+1]==='tmp'))return {role:'excluded',rule:'agent-temporary-output'};
  if (normalized.startsWith('docs/library-docs/') || parts.some(p => ['node_modules', 'vendor', 'vendored', 'generated', 'gen', 'fixtures', '__fixtures__', 'dist', 'build', 'target', 'coverage', '.git', 'npm-cache'].includes(p)) || /\.(generated|gen)\./.test(name)) return { role: 'excluded', rule: 'generated-vendor-fixture-docs-output' };
  if (parts.some(p => ['test', 'tests', '__tests__', 'e2e', 'integration', 'unit'].includes(p)) || /\.(test|spec|testsetup)\.|^tests?\.|^test_|_tests?\./.test(name)) return { role: 'evidence', rule: 'test-evidence' };
  if (Object.hasOwn(LANGUAGES, extension)) return { role: 'production', rule: 'source-extension', language: LANGUAGES[extension] };
  if (/^(md|txt|json|jsonl|yaml|yml|toml|lock|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|pdf|zip|gz|exe|dll|bin|db|sqlite|csv|xlg|xml|html|css|map)$/.test(extension) || /^(license|notice|dockerfile|makefile)$/.test(name) || name.startsWith('.')) return { role: 'excluded', rule: 'non-source' };
  return { role: 'unclassified', rule: 'unknown-source-kind' };
}
function collectInventory(root, { scopes = [], supportedLanguages = [] } = {}) {
  const scope = [...new Set(scopes.map(sourcePath))].sort();
  const supported = [...new Set(supportedLanguages)].sort();
  if (supported.some(language => !Object.values(LANGUAGES).includes(language))) throw new TypeError('Unknown supported language');
  const paths = [...new Set(execFileSync('git', ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024, timeout: 30000 }).split('\0').filter(Boolean))].sort();
  for (const target of scope) if (!paths.some(file => file === target || file.startsWith(target + '/'))) throw new Error('Unknown explicit scope: ' + target);
  const entries = paths.map(file => {
    if (scope.length && !scope.some(target => file === target || file.startsWith(target + '/'))) return { path: file, role: 'outOfScope', rule: 'outside-explicit-scope' };
    const entry = { path: file, ...classifyPath(file) };
    if (entry.role !== 'production') return entry;
    try {
      const absolute = path.join(root, sourcePath(file));
      if (!fs.lstatSync(absolute).isFile()) throw Object.assign(new Error('Not a regular source file'), { code: 'ENOTFILE' });
      const bytes = fs.readFileSync(absolute);
      return { ...entry, status: supported.includes(entry.language) ? 'supported' : 'unsupported', fingerprint: 'sha256:' + createHash('sha256').update(bytes).digest('hex') };
    } catch (error) {
      return { ...entry, status: 'failed', failure: error.code || 'READ_FAILED', recovery: 'Restore the source or repair read access, then rerun inventory.' };
    }
  });
  const counts = { production: 0, supported: 0, unsupported: 0, failed: 0, evidence: 0, excluded: 0, unclassified: 0, outOfScope: 0 };
  for (const entry of entries) { counts[entry.role]++; if (entry.role === 'production') counts[entry.status]++; }
  const report = { schemaVersion: 1, rules: 'git-source-inventory-v2', enumeration: 'git-ls-files:cached+untracked-exclude-standard', scopes: scope, supportedLanguages: supported, counts, status: counts.unsupported || counts.failed || counts.unclassified ? 'partial' : 'complete', entries };
  return { id: fingerprint(report), ...report };
}
module.exports = { classifyPath, collectInventory };
