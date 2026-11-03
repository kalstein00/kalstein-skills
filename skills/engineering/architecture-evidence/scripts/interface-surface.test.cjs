'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { collectInterfaceSurface } = require('./interface-surface.cjs');
test('case aliases fail explicitly', () => {
  assert.throws(() => collectInterfaceSurface([{path:'A.ts',source:'export const a = 1;'}, {path:'a.ts',source:'export const b = 2;'}]), /case-insensitive/);
});

test('surface counts retain totals while separating type declarations, values and re-export bindings',()=>{
  const result=collectInterfaceSurface([{path:'a.ts',source:'export interface I {} export type T = number; export const a=1, b=2; export class C {} export {type B, v} from "./b"; export type * from "./b"; const local=1; export {local}; export default local;'}, {path:'b.ts',source:'export type B = string; export const v=1;'}]);
  const a=result.files[0];assert.equal(a.validity,'valid');assert.equal(a.metric.value,10);
  assert.deepEqual(a.breakdown,{typeDeclarations:2,valueDeclarations:3,typeReExports:2,valueCapableReExports:1,typeLocalExports:0,valueCapableLocalExports:1,exportAssignments:1});
  assert.equal(Object.values(a.breakdown).reduce((a,b)=>a+b,0),a.metric.value);
  assert.equal(collectInterfaceSurface([{path:'bad.ts',source:'export {'}]).files[0].breakdown,null);
});
test('invalid dependencies cannot produce valid any fingerprints', () => {
  const result = collectInterfaceSurface([{path:'a.ts',source:'import {f} from "./b"; export const x = f();'}, {path:'b.ts',source:'export function f() { return missing(); }'}]);
  assert.ok(result.files.every(f => f.validity === 'unavailable' && f.fingerprint === null));
});
test('self-contained TSX declarations emit with explicit JSX mode', () => {
  const source = 'declare global { namespace JSX { interface Element {} interface IntrinsicElements { div: {}; } } } export function f() { return <div />; }';
  assert.equal(collectInterfaceSurface([{path:'a.tsx',source}]).status, 'complete');
});
test('standard library types participate without undeclared any substitutions', () => {
  const result = collectInterfaceSurface([{path:'a.ts',source:'export function f(x: Array<string>): number { return x.length; }'}]);
  assert.equal(result.status, 'complete');
  assert.match(result.files[0].declaration, /Array<string>/);
});
test('declaration fingerprint ignores explicit-return implementation and comments but detects public types', () => {
  const collect = source => collectInterfaceSurface([{ path: 'a.ts', source }]).files[0];
  const a = collect('export function f(x: number): number { return x; }');
  const b = collect('// implementation only\nexport function f(x:number):number { return x + 1; }');
  const c = collect('export function f(x: string): string { return x; }');
  assert.equal(a.validity, 'valid');
  assert.equal(a.metric.value, 1);
  assert.equal(a.fingerprint, b.fingerprint);
  assert.notEqual(a.fingerprint, c.fingerprint);
});

test('re-exports are explicit entries, declaration order is preserved, and input order is irrelevant', () => {
  const inputs = [{ path:'a.ts', source:'export {f as alias} from "./b"; export * from "./b";' }, {path:'b.ts',source:'export function f(): number { return 1; }'}];
  const result = collectInterfaceSurface(inputs);
  assert.equal(result.status, 'complete');
  assert.equal(result.files[0].metric.value, 2);
  assert.deepEqual(result, collectInterfaceSurface([...inputs].reverse()));
  const reordered = collectInterfaceSurface([{...inputs[0],source:'export * from "./b"; export {f as alias} from "./b";'}, inputs[1]]);
  assert.notEqual(result.files[0].fingerprint, reordered.files[0].fingerprint);
});

test('unsupported, syntax failures and unresolved imports never yield a usable fingerprint', () => {
  for (const input of [{path:'a.rs',source:'fn f() {}'}, {path:'a.ts',source:'export function {'}, {path:'a.ts',source:'export * from "missing";'}]) {
    const result = collectInterfaceSurface([input]);
    assert.equal(result.status, 'partial');
    assert.equal(result.files[0].fingerprint, null);
    assert.equal(result.files[0].metric.validity, 'unavailable');
    assert.equal(result.files[0].metric.value, null);
  }
});
