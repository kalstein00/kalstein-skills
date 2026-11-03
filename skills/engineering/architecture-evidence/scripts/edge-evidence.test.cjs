'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyEdges } = require('./edge-evidence.cjs');
const { fingerprint } = require('./schema.cjs');
const symbol = (id, path, qualifiedName) => ({ id, identity: { kind: 'symbol', path, qualifiedName, symbolKind: 'function' } });
function fixture() {
  const nodes = [symbol('run', 'a.ts', 'run'), symbol('native', 'a.ts', 'native'), symbol('normalize', 'b.ts', 'normalize')];
  const edge = source => ({ source, target: 'normalize', kind: 'calls', confidence: 0.9, metadata: { resolvedBy: 'exact-match' } });
  return { graph: { nodes, edges: [edge('run'), edge('native')] }, sources: [
    { path: 'a.ts', source: "import { normalize as clean } from './b'; export function run() { return clean('a'); } export function native() { return 'a'.normalize('NFC'); }" },
    { path: 'b.ts', source: 'export function normalize(value: string) { return value; }' }
  ] };
}
test('only the imported function binding confirms a call, not a same-name native member', () => {
  const { graph, sources } = fixture();
  const result = classifyEdges(graph, sources);
  assert.equal(result.entries.find(e => e.edge.source === 'run').classification, 'confirmed');
  assert.equal(result.entries.find(e => e.edge.source === 'native').classification, 'unresolved');
});
test('source evidence, not confidence, is preserved and deterministic', () => {
  const { graph, sources } = fixture();
  const before = JSON.stringify(graph);
  const result = classifyEdges(graph, sources);
  assert.deepEqual(classifyEdges({ ...graph, edges: [...graph.edges].reverse(), nodes: [...graph.nodes].reverse() }, [...sources].reverse()), result);
  assert.equal(JSON.stringify(graph), before);
  assert.deepEqual(result.entries.map(e => e.edge).sort((a,b) => a.source.localeCompare(b.source)), [...graph.edges].sort((a,b) => a.source.localeCompare(b.source)));
  assert.equal(result.entries.find(e => e.classification === 'confirmed').proof.targetPath, 'b.ts');
  const changed = sources.map(s => ({ ...s, source: s.source + '\n' }));
  assert.notEqual(classifyEdges(graph, changed).inputIdentity, result.inputIdentity);
  assert.notEqual(classifyEdges(graph, changed).identity, result.identity);
});
test('native hash update and ambiguous source names never become proven bindings', () => {
  const graph = { nodes: [symbol('hash', 'a.js', 'hash'), symbol('update', 'b.js', 'update')],
    edges: [{ source: 'hash', target: 'update', kind: 'calls', confidence: 1 }] };
  const sources = [{ path: 'a.js', source: "const {createHash}=require('node:crypto'); function hash() { return createHash('sha256').update('x'); }" },
    { path: 'b.js', source: 'function update() {}' }];
  assert.equal(classifyEdges(graph, sources).entries[0].classification, 'unresolved');
  sources[0].source = 'function hash() { update(); } function hash() { update(); }';
  assert.equal(classifyEdges(graph, sources).entries[0].reason, 'source-or-identity-unavailable');
});
test('missing, unsupported, malformed, unreadable and drifted sources remain explicit', () => {
  const { graph, sources } = fixture();
  assert.ok(classifyEdges(graph, []).entries.every(e => e.reason === 'source-or-identity-unavailable'));
  assert.throws(() => classifyEdges(graph, [{ path: 'a.ts', source: null }]), /read failed/);
  assert.throws(() => classifyEdges(graph, [{ ...sources[0], fingerprint: fingerprint('older bytes') }]), /source drift/);
  assert.throws(() => classifyEdges(graph, [sources[0], sources[0]]), /duplicate source/);
  assert.ok(classifyEdges(graph, sources.map(s => ({ ...s, source: 'function {' }))).entries.every(e => e.classification === 'unresolved'));
  const unsupported = { nodes: [symbol('x', 'a.rs', 'run')], edges: [{ source: 'x', target: 'x', kind: 'calls' }] };
  assert.equal(classifyEdges(unsupported, [{ path: 'a.rs', source: 'fn run() {}' }]).entries[0].classification, 'unresolved');
});
test('file imports and direct lexical calls are proven while callbacks are not charged to their outer function', () => {
  const graph = { nodes: [symbol('run', 'a.ts', 'run'), symbol('nested', 'a.ts', 'nested'), symbol('work', 'b.ts', 'work'),
    { id: 'a', identity: {kind: 'file', path: 'a.ts'} }, { id: 'b', identity: {kind: 'file', path: 'b.ts'} }],
    edges: [{source:'a',target:'b',kind:'imports'}, {source:'run',target:'work',kind:'calls'}, {source:'nested',target:'work',kind:'calls'}] };
  const sources = [{path:'a.ts',source:"import { work } from './b'; function run() { work(); } function nested() { return () => work(); }"},
    {path:'b.ts',source:'export function work() {}'}];
  const result = classifyEdges(graph, sources);
  assert.equal(result.entries.find(e=>e.edge.source==='a').classification, 'confirmed');
  assert.equal(result.entries.find(e=>e.edge.source==='run').classification, 'confirmed');
  assert.equal(result.entries.find(e=>e.edge.source==='nested').classification, 'unresolved');
});
test('a declaration name is not a reference and unsupported source bytes still identify input', () => {
  const graph = { nodes: [{id:'file',identity:{kind:'file',path:'a.ts'}}, symbol('inner','a.ts','inner')],
    edges: [{source:'file',target:'inner',kind:'references'}] };
  assert.equal(classifyEdges(graph,[{path:'a.ts',source:'const inner = () => 0;'}]).entries[0].classification,'unresolved');
  assert.equal(classifyEdges(graph,[{path:'a.ts',source:'const inner = () => 0; inner;'}]).entries[0].classification,'confirmed');
  const a = classifyEdges(graph,[{path:'a.rs',source:'fn a() {}'}]);
  const b = classifyEdges(graph,[{path:'a.rs',source:'fn b() {}'}]);
  assert.notEqual(a.inputIdentity,b.inputIdentity);
  assert.throws(()=>classifyEdges(graph,[{path:'a.rs',source:''},{path:'a.rs',source:''}]),/duplicate/);
});
