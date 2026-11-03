'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveOwnership } = require('./ownership.cjs');

test('explicit ownership uses priority then stable rule ID and explains all matching rules', () => {
  const rules = [{ id: 'wide', glob: '**', owner: 'shared', priority: 0 }, { id: 'b', glob: 'app/src/**', owner: 'app', priority: 1 }, { id: 'a', glob: 'app/src/*.ts', owner: 'core', priority: 1 }];
  const result = resolveOwnership(['app/src/a.ts'], { schemaVersion: 1, rules });
  assert.equal(result.files[0].owner, 'core');
  assert.deepEqual(result.files[0].matchedRules, ['a', 'b', 'wide']);
  assert.equal(result.files[0].fallback, false);
  assert.deepEqual(result, resolveOwnership(['app/src/a.ts'], { schemaVersion: 1, rules: [...rules].reverse() }));
});

test('invalid map schema, duplicate rules and unsupported glob syntax fail with the map location', () => {
  const rule = { id: 'one', glob: '**', owner: 'core', priority: 0 };
  for (const map of [{ schemaVersion: 2, rules: [] }, { schemaVersion: 1, rules: [rule, rule] }, { schemaVersion: 1, rules: [{ ...rule, glob: 'src/{a,b}/**' }] }, { schemaVersion: 1, rules: [{ ...rule, priority: NaN }] }]) {
    assert.throws(() => resolveOwnership(['a.ts'], map), /ownership map/);
  }
  const a = resolveOwnership(['a.ts'], { schemaVersion: 1, rules: [rule] });
  const b = resolveOwnership(['a.ts'], { schemaVersion: 1, rules: [{ ...rule, owner: 'new' }] });
  assert.notEqual(a.mapIdentity, b.mapIdentity);
});

test('fallback package/layer/feature and all cluster owners remain explainable across ownership crossings', () => {
  const map = { schemaVersion: 1, rules: [] };
  const paths = ['log-viewer-app/src/main/tag/a.ts', 'rust/writer/src/sql/lib.rs'];
  const result = resolveOwnership(paths, map, { clusters: [{ id: 'cycle', members: paths }], edges: [{ source: paths[0], target: paths[1] }] });
  assert.deepEqual(result.files.map(f => f.owner), ['log-viewer-app:main:tag', 'rust/writer:sql:root']);
  assert.ok(result.files.every(f => f.fallback && f.rule === 'package-layer-feature-v1'));
  assert.deepEqual(result.clusters[0].owners, ['log-viewer-app:main:tag', 'rust/writer:sql:root']);
  assert.equal(result.crossings[0].crossOwner, true);
});
