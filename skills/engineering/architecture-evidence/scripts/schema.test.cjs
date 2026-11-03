'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const schema = require('./schema.cjs');

test('canonical evidence serialization ignores object key order and preserves ordered arrays', () => {
  assert.equal(schema.canonicalJson({ z: [2, 1], a: { y: 2, b: 1 } }), '{"a":{"b":1,"y":2},"z":[2,1]}');
  assert.equal(schema.canonicalJson({ a: { b: 1, y: 2 }, z: [2, 1] }), '{"a":{"b":1,"y":2},"z":[2,1]}');
  for (const value of [NaN, Infinity, undefined, new Date(), { a: undefined }]) {
    assert.throws(() => schema.canonicalJson(value));
  }
});

test('snapshot identity is order-independent for source files but records ordered selected Git commits', () => {
  const input = { schemaVersion: 1, source: { head: 'head', files: [{ path: 'b.ts', fingerprint: 'b' }, { path: 'a.ts', fingerprint: 'a' }], dirtyFingerprint: 'clean' }, git: { commits: ['b', 'a'], selection: 'ancestry-v1' }, graph: { identity: 'g', freshness: 'fresh' }, tools: { graph: '1.2.0' }, config: 'config', metricSchema: 'v1', ownership: 'map', ledger: 'empty' };
  const first = schema.snapshotRecord(input);
  assert.deepEqual(first.input.source.files.map(f => f.path), ['a.ts', 'b.ts']);
  assert.equal(first.id, schema.snapshotRecord({ ...input, source: { ...input.source, files: [...input.source.files].reverse() } }).id);
  assert.notEqual(first.id, schema.snapshotRecord({ ...input, git: { ...input.git, commits: ['a', 'b'] } }).id);
  assert.notEqual(first.id, schema.snapshotRecord({ ...input, source: { ...input.source, dirtyFingerprint: 'dirty' } }).id);
  for (const patch of [{ schemaVersion: 2 }, { graph: null }, { ledger: undefined }, { source: { ...input.source, files: [input.source.files[0], input.source.files[0]] } }]) {
    assert.throws(() => schema.snapshotRecord({ ...input, ...patch }));
  }
});

test('metric validity distinguishes unavailable evidence from measured zero', () => {
  const metric = { schemaVersion: 1, itemId: 'file:a', name: 'loc', unit: 'lines', direction: 'higher', source: 'fixture:1', cohort: 'typescript:file', population: 10, validity: 'valid', value: 0 };
  assert.deepEqual(schema.metricRecord(metric), metric);
  assert.deepEqual(schema.metricRecord({ ...metric, validity: 'unavailable', value: null, reason: 'unsupported language' }).value, null);
  for (const patch of [{ schemaVersion: 2 }, { validity: undefined }, { value: NaN }, { population: -1 }, { validity: 'unavailable', value: 0 }, { validity: 'unavailable', value: null }]) {
    assert.throws(() => schema.metricRecord({ ...metric, ...patch }));
  }
});

test('typed evidence identities keep item kinds separate and detect ambiguous symbols', () => {
  const file = { kind: 'file', path: 'src/a.ts' };
  assert.equal(schema.evidenceId(file), schema.evidenceId({ kind: 'file', path: 'src\\a.ts' }));
  const symbol = { kind: 'symbol', path: 'src/a.ts', qualifiedName: 'A.run', symbolKind: 'method' };
  assert.notEqual(schema.evidenceId(file), schema.evidenceId(symbol));
  assert.throws(() => schema.evidenceItems([symbol, { ...symbol }]), /duplicate/);
  assert.equal(schema.evidenceItems([symbol, { ...symbol, discriminator: 'overload:string' }]).length, 2);
  const a = schema.evidenceId(file), b = schema.evidenceId(symbol);
  assert.equal(schema.evidenceId({ kind: 'cluster', members: [a, b] }), schema.evidenceId({ kind: 'cluster', members: [b, a] }));
  assert.equal(schema.canonicalJson(schema.evidenceItems([{ kind: 'cluster', members: [a, b] }])), schema.canonicalJson(schema.evidenceItems([{ kind: 'cluster', members: [b, a] }])));
  assert.equal(schema.canonicalJson(schema.evidenceItems([file])), schema.canonicalJson(schema.evidenceItems([{ ...file, path: 'src\\a.ts' }])));
  assert.notEqual(schema.evidenceId({ kind: 'cluster', members: [a] }), schema.evidenceId({ kind: 'cluster', members: [a, b] }));
  assert.notEqual(schema.evidenceId({ kind: 'violation', rule: 'layer', source: a, target: b }), schema.evidenceId({ kind: 'violation', rule: 'layer', source: b, target: a }));
  assert.throws(() => schema.evidenceId({ ...symbol, line: 5 }), /Unknown/);
});
