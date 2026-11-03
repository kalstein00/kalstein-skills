'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evidenceId } = require('./schema.cjs');
const { classifyEdges } = require('./edge-evidence.cjs');
const { collectConfirmedCoupling } = require('./confirmed-coupling.cjs');
const { collectCoupling } = require('./coupling.cjs');
function fixture() {
  const nodes = ['a','b','c','x'].map(name => {
    const identity = {kind:'symbol',path:name+'.ts',qualifiedName:name,symbolKind:'function'};
    return {id:evidenceId(identity),identity,language:'typescript'};
  });
  const edge = (from,to) => ({source:nodes[from].id,target:nodes[to].id,kind:'calls',confidence:0.9});
  const graph = {id:'fixture',status:'partial',freshness:'fresh',source:'fixture',nodes,
    files:nodes.map(n=>({path:n.identity.path,language:n.language})),edges:[edge(0,1),edge(1,2),edge(3,1)],
    unresolved:{validity:'unavailable',reason:'not exposed'},omittedNodes:[],omittedEdges:[],missingFiles:[]};
  const sources = ["import { b } from './b'; export function a(){b();}","import { c } from './c'; export function b(){c();}",'export function c(){}','export function x(){}']
    .map((source,i)=>({path:nodes[i].identity.path,source}));
  return {graph,sources,ownership:{files:graph.files.map((f,i)=>({path:f.path,owner:i===2?'core':'app'}))},config:{schemaVersion:1,impactDepth:2,testFiles:[{path:'x.ts',kind:'unit'}]}};
}
test('unproven edges do not increase direct or transitive confirmed coupling', () => {
  const {graph,sources,ownership,config}=fixture();
  const result=collectConfirmedCoupling(graph,ownership,config,classifyEdges(graph,sources));
  const value=(i,name)=>result.metrics.find(m=>m.itemId===graph.nodes[i].id&&m.name===name).value;
  assert.equal(value(1,'fanIn'),1);
  assert.equal(value(2,'impact'),2);
  assert.equal(value(3,'fanOut'),0);
  assert.equal(value(1,'crossOwnerOut'),1);
});
test('uncertainty is preserved and static linkage keeps the original graph semantics',()=>{
  const {graph,sources,ownership,config}=fixture();
  const evidence=classifyEdges(graph,sources), result=collectConfirmedCoupling(graph,ownership,config,evidence);
  assert.equal(result.status,'partial');
  assert.equal(result.confirmation.unresolvedEdges,1);
  assert.equal(result.confirmation.status,'observed');
  assert.deepEqual(result.bindingEvidence,evidence);
  const linkage=metrics=>metrics.filter(m=>m.name.startsWith('staticTest')||m.name==='runtimeCoverage');
  assert.deepEqual(linkage(result.metrics),linkage(collectCoupling(graph,ownership,config).metrics));
  assert.deepEqual(result.unresolved,graph.unresolved);
  const shuffled={...graph,edges:[...graph.edges].reverse(),nodes:[...graph.nodes].reverse()};
  assert.deepEqual(collectConfirmedCoupling(shuffled,ownership,config,classifyEdges(shuffled,[...sources].reverse())),result);
  const without={...graph,edges:graph.edges.slice(0,2)};
  const changed=collectConfirmedCoupling(without,ownership,config,classifyEdges(without,sources));
  const values=metrics=>metrics.filter(m=>['fanIn','fanOut','impact','crossOwnerOut'].includes(m.name));
  assert.deepEqual(values(result.metrics),values(changed.metrics));
});
test('missing classification is unavailable rather than a successful measured zero; mismatched evidence fails',()=>{
  const {graph,sources,ownership,config}=fixture();
  const missing=collectConfirmedCoupling(graph,ownership,config,null);
  assert.equal(missing.confirmation.status,'unavailable');
  assert.ok(missing.metrics.filter(m=>m.name==='impact').every(m=>m.validity==='unavailable'&&m.value===null&&m.reason));
  const evidence=classifyEdges(graph,sources);
  assert.throws(()=>collectConfirmedCoupling({...graph,edges:[]},ownership,config,evidence),/mismatch/);
  assert.throws(()=>collectConfirmedCoupling(graph,ownership,config,{...evidence,identity:'tampered'}),/mismatch/);
  const empty={...graph,edges:[]};
  const zero=collectConfirmedCoupling(empty,ownership,config,classifyEdges(empty,sources));
  assert.ok(zero.metrics.filter(m=>m.name==='impact').every(m=>m.validity==='valid'&&m.value===0));
  assert.equal(zero.status,'partial'); // known upstream unresolved enumeration gap remains.
});
test('deduplication, cycles and self edges retain bounded direct/transitive counts',()=>{
  const {graph,sources,ownership,config}=fixture();
  sources[2].source="import { a } from './a'; export function c(){a();c();}";
  graph.edges=[...graph.edges,graph.edges[0],{source:graph.nodes[2].id,target:graph.nodes[0].id,kind:'calls'},
    {source:graph.nodes[2].id,target:graph.nodes[2].id,kind:'calls'}];
  const result=collectConfirmedCoupling(graph,ownership,config,classifyEdges(graph,sources));
  const value=(i,name)=>result.metrics.find(m=>m.itemId===graph.nodes[i].id&&m.name===name).value;
  assert.equal(value(0,'fanOut'),1);
  assert.equal(value(2,'fanOut'),1);
  assert.equal(value(0,'impact'),2);
});
