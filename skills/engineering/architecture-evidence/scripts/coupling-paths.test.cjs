'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildCouplingPaths}=require('./coupling-paths.cjs');
const {evidenceId}=require('./schema.cjs');
function fixture(name='impact',value=2){
 const nodes=['a','b','c','x'].map(id=>({id,identity:{kind:'symbol',path:id+'.ts',qualifiedName:id,symbolKind:'function'}}));
 const entry=(source,target,classification='confirmed')=>({edge:{source,target,kind:'calls',confidence:0.9},classification,reason:'binding',proof:{sourcePath:source+'.ts',targetPath:target+'.ts'}});
 const metric={itemId:'c',name,value,validity:'valid',percentile:100,source:'confirmed',cohort:'typescript:symbol'};
 return {items:nodes,metrics:[metric],queue:{selection:{selected:[{id:'c',groups:['coupling']}]}},
  ranking:{groups:[{name:'coupling',items:[{id:'c',percentile:100,signals:[{name,percentile:100,source:'confirmed',cohort:'typescript:symbol'}]}]}]},
  collectors:{graph:{nodes,files:[]},coupling:{config:{impactDepth:2},owners:nodes.map(n=>({path:n.identity.path,owner:n.id==='c'?'core':'app'})),
   bindingEvidence:{entries:[entry('a','b'),entry('b','c'),entry('x','c','unresolved')]}}}};
}
test('impact witnesses follow real incoming edges and exclude speculative shortcuts',()=>{
 const result=buildCouplingPaths(fixture());
 assert.deepEqual(result.items[0]?.paths.map(p=>p.nodes),[['b','c'],['a','b','c']]);
 assert.equal(result.items[0].omitted,0);
 assert.equal(result.items[0].paths[1].edges[0].proof.sourcePath,'a.ts');
});
test('direct outgoing and cross-owner witnesses have the metric direction',()=>{
 for(const name of ['fanOut','crossOwnerOut']){
  const r=fixture(name,1);r.collectors.coupling.bindingEvidence.entries=[{edge:{source:'c',target:'a',kind:'calls'},classification:'confirmed',proof:{rule:'binding'}}];
  assert.deepEqual(buildCouplingPaths(r).items[0].paths[0].nodes,['c','a']);
 }
 const incoming=fixture('fanIn',1);
 assert.deepEqual(buildCouplingPaths(incoming).items[0].paths.map(p=>p.nodes),[['b','c']]);
});
test('cycle and duplicate paths are bounded and order-independent with explicit truncation',()=>{
 const r=fixture('impact',4),c=r.collectors.coupling;
 c.bindingEvidence.entries=[...c.bindingEvidence.entries,{edge:{source:'c',target:'a',kind:'calls'},classification:'confirmed'},
  {edge:{source:'x',target:'c',kind:'calls'},classification:'confirmed'}];
 r.collectors.graph.nodes.push({id:'d',identity:{kind:'symbol',path:'d.ts',qualifiedName:'d'}});
 c.bindingEvidence.entries.push({edge:{source:'d',target:'c',kind:'calls'},classification:'confirmed'});
 const first=buildCouplingPaths(r);
 assert.equal(first.items[0].paths.length,3);assert.equal(first.items[0].omitted,1);assert.equal(first.items[0].reason,'display-limit');
 assert.ok(first.items[0].paths.every(p=>p.edges.length<=2&&new Set(p.nodes).size===p.nodes.length));
 c.bindingEvidence.entries.reverse();r.collectors.graph.nodes.reverse();
 assert.deepEqual(buildCouplingPaths(r),first);
 c.bindingEvidence.entries.push(c.bindingEvidence.entries[0]);assert.deepEqual(buildCouplingPaths(r),first);
});
test('observed zero, unavailable input, missing owners and insufficient witnesses are distinct',()=>{
 const zero=buildCouplingPaths(fixture('fanIn',0)).items[0];assert.equal(zero.status,'observed-zero');
 const missing=fixture();delete missing.collectors.coupling.bindingEvidence;
 assert.equal(buildCouplingPaths(missing).items[0].reason,'path-evidence-unavailable');
 const unknown=fixture();unknown.metrics[0].validity='unavailable';unknown.metrics[0].value=null;
 assert.equal(buildCouplingPaths(unknown).items[0].reason,'metric-unavailable');
 const short=fixture();short.collectors.coupling.config.impactDepth=1;
 assert.equal(buildCouplingPaths(short).items[0].reason,'path-evidence-incomplete');
 const owner=fixture('crossOwnerOut',1);owner.collectors.coupling.bindingEvidence.entries=[{edge:{source:'c',target:'a',kind:'calls'},classification:'confirmed'}];
 delete owner.collectors.coupling.owners;assert.equal(buildCouplingPaths(owner).items[0].reason,'owner-evidence-unavailable');
});
test('file witnesses retain symbol provenance after file-pair projection',()=>{
 const r=fixture('fanIn',1),id=evidenceId({kind:'file',path:'c.ts'});
 r.collectors.graph.files=['a.ts','b.ts','c.ts','x.ts'].map(path=>({path}));
 r.queue.selection.selected[0].id=id;r.ranking.groups[0].items[0].id=id;r.metrics[0].itemId=id;
 r.metrics[0].cohort='typescript:file';r.ranking.groups[0].items[0].signals[0].cohort='typescript:file';
 const p=buildCouplingPaths(r).items[0].paths[0];
 assert.deepEqual(p.nodes,[evidenceId({kind:'file',path:'b.ts'}),id]);assert.equal(p.edges[0].edge.source,'b');
});
