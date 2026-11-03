'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {runCollector}=require('./scan-runtime.cjs');
const {evidenceId}=require('./schema.cjs');
const {sourceImportGraph}=require('./source-imports.cjs');

test('structure uses module paths, not same-name graph guesses or import declaration nodes',async()=>{
  const sources=[
    {path:'formula.ts',source:"import { parse } from 'mathjs'; export const formula = parse('1');"},
    {path:'parser.ts',source:"import { formula } from './formula'; export function parse() { return formula; }"},
    {path:'contracts.ts',source:"export type { Query } from './query'; export type Intent = { value: number };"},
    {path:'query.ts',source:"import type { Intent } from './contracts'; export type Query = { intent: Intent };"}
  ];
  const nodes=sources.map(s=>({id:evidenceId({kind:'file',path:s.path}),identity:{kind:'file',path:s.path}}));
  const guessed={id:'guessed-parse',identity:{kind:'symbol',path:'parser.ts',qualifiedName:'parse',symbolKind:'function'}};
  const declaration={id:'import-declaration',identity:{kind:'symbol',path:'formula.ts',qualifiedName:'mathjs',symbolKind:'import'}};
  const graph={id:'raw',source:'synthetic-symbol-graph',freshness:'fresh',status:'partial',
    files:sources.map(s=>({path:s.path,language:'typescript'})),nodes:[...nodes,guessed,declaration],
    edges:[{kind:'imports',source:nodes[0].id,target:guessed.id,metadata:{resolvedBy:'exact-match',confidence:0.7}},
      {kind:'imports',source:nodes[1].id,target:nodes[0].id},
      {kind:'imports',source:nodes[0].id,target:declaration.id}]};
  const result=await runCollector('structure',{root:process.cwd(),config:{},graph,sources,
    productionPaths:sources.map(s=>s.path),ownership:{files:sources.map(s=>({path:s.path,owner:'shared'}))}});
  assert.deepEqual(result.clusters.map(c=>c.paths),[['contracts.ts','query.ts']]);
  assert.equal(result.metrics.find(m=>m.name==='cycleSize').value,2);
  assert.equal(result.clusters[0].dependencyKind,'requires-type-only');
  assert.equal(graph.edges.length,3);
});

test('only declaration-level type edges are erased; inline type bindings can retain module effects',()=>{
  const source="import type {T} from './b'; export type * from './b'; import {type T as U} from './b'; export {type T} from './b'; import D, {type T as V} from './b'; import './b';";
  const result=sourceImportGraph({id:'raw',status:'complete',files:[]},[{path:'a.ts',source},{path:'b.ts',source:'export type T = number; export default 1;'}]);
  assert.deepEqual(result.edges.map(e=>e.metadata.dependencyKind),['type-only','type-only','value-capable','value-capable','value-capable','value-capable']);
  const ts=require('typescript');
  const emitted=ts.transpileModule("import {type T} from './b';",{compilerOptions:{module:ts.ModuleKind.ESNext,verbatimModuleSyntax:true}}).outputText;
  assert.match(emitted,/import \{\} from/);
});

test('a value-capable subcycle inside a larger type-connected SCC is preserved',async()=>{
  const sources=[{path:'a.ts',source:"import './b'; import type {C} from './c';"},{path:'b.ts',source:"import './a';"},{path:'c.ts',source:"import type {A} from './a';"}];
  const result=await runCollector('structure',{root:process.cwd(),config:{},sources,productionPaths:sources.map(s=>s.path),ownership:{files:sources.map(s=>({path:s.path,owner:'shared'}))}});
  assert.equal(result.clusters[0].dependencyKind,'value-capable');
  assert.deepEqual(result.clusters[0].valueCyclePaths,['a.ts','b.ts']);
});

test('source imports preserve real self-imports, extension substitution and explicit gaps',()=>{
  const graph={id:'raw',status:'complete',files:[]};
  const sources=[{path:'a.ts',source:"import './a'; export type { B } from './b.js'; import '@alias/c'; import './missing'; import('./b');"},
    {path:'b.ts',source:'export type B = number;'}];
  const result=sourceImportGraph(graph,sources);
  assert.deepEqual(result.edges.map(e=>e.target),['a.ts','b.ts'].map(path=>evidenceId({kind:'file',path})));
  assert.deepEqual(result,sourceImportGraph(graph,[...sources].reverse()));
  assert.equal(result.importGaps.length,3);
  assert.equal(result.status,'partial');
  assert.throws(()=>sourceImportGraph(graph,undefined),/Captured sources required/);
  assert.throws(()=>sourceImportGraph(graph,[sources[0],sources[0]]),/Duplicate/);
  const broken=sourceImportGraph(graph,[{path:'broken.ts',source:'import {'}]);
  assert.equal(broken.edges.length,0);
  assert.equal(broken.importGaps[0].reason,'source parse diagnostics');
});
