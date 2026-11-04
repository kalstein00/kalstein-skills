'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const inventory = require('./inventory.cjs');
test('agent temporary outputs and test setup stay outside production without excluding agent scripts',()=>{
  for(const file of ['.codex/tmp/probe.ts','app/.codex/tmp/probe.ts'])assert.deepEqual(inventory.classifyPath(file),{role:'excluded',rule:'agent-temporary-output'});
  assert.equal(inventory.classifyPath('app/Grid.wheel.testSetup.tsx').role,'evidence');
  for(const file of ['.codex/scripts/runtime.js','app/tmp/runtime.ts','app/.codex/tmp-support/runtime.ts'])assert.equal(inventory.classifyPath(file).role,'production');
});

test('production classification preserves multiple languages and separates evidence and excluded sources', () => {
  for (const [file, language] of [['app/src/a.ts', 'typescript'], ['rust/crate/src/lib.rs', 'rust'], ['native/a.c', 'c']]) {
    assert.deepEqual(inventory.classifyPath(file), { role: 'production', rule: 'source-extension', language });
  }
  for (const file of ['app/a.test.ts', 'app/e2e/a.ts', 'rust/a/tests/main.rs', 'app/integration/a.ts', 'rust/a/src/tests.rs', 'tools/test_a.py', 'pkg/a_test.go']) assert.equal(inventory.classifyPath(file).role, 'evidence');
  for (const file of ['app/generated/a.ts', 'vendor/a.c', 'app/fixtures/a.ts', 'docs/library-docs/a/a.ts', 'app/dist/a.js', 'rust/a/target/a.rs']) assert.equal(inventory.classifyPath(file).role, 'excluded');
  assert.equal(inventory.classifyPath('module/a.newlang').role, 'unclassified');
  assert.equal(inventory.classifyPath('module/file.constructor').role, 'unclassified');
  assert.equal(inventory.classifyPath('rust/crate/src/supervisor_tests.rs').role, 'evidence');
});

test('unreadable tracked production and unknown source kinds remain visible as partial', t => {
  const { root, git, write } = fixture(t);
  write('missing.ts', 'source'); write('other.newlang', 'unknown'); git('add', '.');
  fs.unlinkSync(path.join(root, 'missing.ts'));
  const result = inventory.collectInventory(root, { supportedLanguages: ['typescript'] });
  assert.equal(result.status, 'partial');
  assert.equal(result.counts.production, 1);
  assert.equal(result.counts.failed, 1);
  assert.equal(result.counts.unclassified, 1);
  assert.equal(result.entries.find(e => e.path === 'missing.ts').failure, 'ENOENT');
  assert.match(result.entries.find(e => e.path === 'missing.ts').recovery, /restore|access/i);
});

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'architecture-evidence-inventory-'));
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
  const write = (file, content) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), content); };
  git('init', '-q');
  t.after(() => { assert.ok(root.startsWith(path.join(os.tmpdir(), 'architecture-evidence-inventory-'))); fs.rmSync(root, { recursive: true, force: true }); });
  return { root, git, write };
}

test('Git inventory includes dirty and untracked production, applies explicit scope and reports support counts', t => {
  const { root, git, write } = fixture(t);
  write('app/a.ts', 'old'); write('native/a.c', 'c'); write('rust/a.rs', 'rust');
  write('app/a.test.ts', 'test'); write('docs/library-docs/x/demo.ts', 'copied');
  write('tools/library-docs/cli.js', 'runtime'); write('README.md', 'docs');
  write('.gitignore', 'ignored/\n'); git('add', '.');
  write('app/a.ts', 'dirty'); write('app/new.ts', 'new'); write('ignored/a.ts', 'ignored');
  const result = inventory.collectInventory(root, { supportedLanguages: ['typescript'] });
  assert.deepEqual(result.counts, { production: 5, supported: 2, unsupported: 3, failed: 0, evidence: 1, excluded: 3, unclassified: 0, outOfScope: 0 });
  assert.equal(result.status, 'partial');
  assert.equal(result.id, inventory.collectInventory(root, { supportedLanguages: ['typescript'] }).id);
  write('app/new.ts', 'changed');
  assert.notEqual(result.id, inventory.collectInventory(root, { supportedLanguages: ['typescript'] }).id);
  const scoped = inventory.collectInventory(root, { scopes: ['app'], supportedLanguages: ['typescript'] });
  assert.equal(scoped.counts.production, 2);
  assert.equal(scoped.status, 'complete');
  assert.equal(scoped.entries.find(e => e.path === 'native/a.c').rule, 'outside-explicit-scope');
  assert.throws(() => inventory.collectInventory(root, { scopes: ['absent'] }), /scope/);
});
