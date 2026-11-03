'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { collectAstMetrics } = require('./ast-metrics.cjs');

test('class expressions and wrapped initializers preserve declared ownership', () => {
  const result = collectAstMetrics([{ path: 'wrapped.ts', source: 'const A = class Named { run() { if(x) y(); } }; const B = class Other { run() {} }; const f = (() => { if(x) y(); });' }]);
  assert.equal(result.status, 'complete');
  const values = result.items.filter(i => i.identity.kind === 'symbol').map(i => [i.identity.qualifiedName, result.metrics.find(m => m.itemId === i.id && m.name === 'complexity').value]);
  assert.deepEqual(values, [['Named.run', 2], ['Other.run', 1], ['f', 2]]);
  assert.equal(result.anonymousAttributions.length, 0);
});

test('file LOC and named function length/branch complexity match a hand-calculated source', () => {
  const source = 'export function choose(x: boolean) {\n  if (x) return 1;\n  return 0;\n}\n';
  const result = collectAstMetrics([{ path: 'a.ts', source }]);
  assert.equal(result.status, 'complete');
  assert.equal(result.metrics.find(m => m.name === 'loc').value, 4);
  assert.equal(result.metrics.find(m => m.name === 'functionLength').value, 4);
  assert.equal(result.metrics.find(m => m.name === 'complexity').value, 2);
  assert.ok(result.metrics.every(m => m.source === 'typescript@5.3.3:ast-metrics-v2' && m.validity === 'valid'));
  assert.deepEqual(result, collectAstMetrics([{ path: 'a.ts', source }]));
});

test('parse failure and unsupported language are unavailable rather than measured zero', () => {
  for (const input of [{ path: 'a.rs', source: 'fn f() {}' }, { path: 'a.ts', source: 'function {' }]) {
    const result = collectAstMetrics([input]);
    assert.equal(result.status, 'partial');
    assert.ok(result.diagnostics.length);
    assert.ok(result.metrics.every(m => m.validity === 'unavailable' && m.value === null));
  }
  const inputs = [{ path: 'a.js', source: 'const f = x => x ? 1 : 0;' }, { path: 'b.ts', source: 'function b() {}' }];
  assert.deepEqual(collectAstMetrics(inputs), collectAstMetrics([...inputs].reverse()));
});

test('ambiguous symbols are explicitly omitted while valid file and unique symbol measurements survive',()=>{
  const result=collectAstMetrics([{path:'collision.ts',source:'if (ready) start();\nfunction f(){ [1].map(x=>x ? 1 : 0); }\nfunction f(){}\nfunction unique(){ if (ready) start(); }\n'}]);
  assert.equal(result.status,'partial');
  assert.equal(result.metrics.find(m=>m.name==='loc').value,4);
  assert.equal(result.metrics.find(m=>m.name==='topLevelComplexity').value,2);
  assert.deepEqual(result.items.filter(i=>i.identity.kind==='symbol').map(i=>i.identity.qualifiedName),['unique']);
  assert.equal(result.metrics.find(m=>m.name==='complexity').value,2);
  assert.ok(result.metrics.every(m=>m.validity==='valid'));
  assert.equal(result.omittedSymbols.length,1);assert.equal(result.omittedSymbols[0].count,2);
  assert.equal(result.omittedSymbols[0].identity.qualifiedName,'f');
  assert.equal(result.anonymousAttributions.length,0);assert.equal(result.omittedAttributions.length,1);
  assert.equal(result.omittedAttributions[0].ownerId,result.omittedSymbols[0].id);
});

test('nested named functions own their decisions while anonymous callbacks belong to the enclosing owner', () => {
  const source = 'function outer() {\n function inner(x) { if(x) return 1; }\n [1].map(x => x ? 1 : 0);\n}\nclass A { run() { return true && false; } }\nclass B { run() {} }\n';
  const result = collectAstMetrics([{ path: 'nested.ts', source }]);
  const values = result.items.filter(i => i.identity.kind === 'symbol').map(i => [i.identity.qualifiedName, result.metrics.find(m => m.itemId === i.id && m.name === 'complexity').value]);
  assert.deepEqual(values.sort(), [['A.run', 2], ['B.run', 1], ['outer', 2], ['outer.inner', 2]].sort());
  assert.equal(result.anonymousAttributions.length, 1);
  assert.equal(result.anonymousAttributions[0].ownerId, result.items.find(i => i.identity.qualifiedName === 'outer').id);
});
