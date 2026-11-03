'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evidenceId } = require('./schema.cjs');
const { collectCoupling } = require('./coupling.cjs');
function fixture() {
  const nodes = ['a','b','c','test'].map(n => { const identity = {kind:'symbol',path:n+'.ts',qualifiedName:n,symbolKind:'function'}; return {id:evidenceId(identity),identity,language:'typescript'}; });
  const edge = (a,b) => ({source:nodes[a].id,target:nodes[b].id,kind:'calls',provenance:'heuristic',confidence:0.5,metadata:{confidence:0.5}});
  return { graph:{id:'fixture',status:'complete',freshness:'fresh',source:'fixture-adapter',nodes,files:nodes.map(n=>({path:n.identity.path,language:n.language})),edges:[edge(0,1),edge(0,1),edge(1,2),edge(2,2),edge(3,0)],unresolved:{validity:'valid',count:0},omittedEdges:[],omittedNodes:[],missingFiles:[]}, ownership:{files:nodes.map((n,i)=>({path:n.identity.path,owner:i===2?'core':'app'}))} };
}

test('15000 independent symbols retain exact populations within a bounded collector run',()=>{
  const program=`const {collectCoupling}=require('./coupling.cjs');
    const nodes=Array.from({length:15000},(_,i)=>({id:'symbol:'+i,identity:{kind:'symbol',path:'large.ts',qualifiedName:'f'+i,symbolKind:'function'},language:'typescript'}));
    const r=collectCoupling({status:'complete',freshness:'fresh',source:'fixture',nodes,files:[{path:'large.ts',language:'typescript'}],edges:[]},{files:[{path:'large.ts',owner:'app'}]},{schemaVersion:1,impactDepth:2,testFiles:[]});
    console.log(JSON.stringify({count:r.metrics.length,symbol:r.metrics.find(m=>m.itemId==='symbol:14999'&&m.name==='fanIn'),file:r.metrics.find(m=>m.cohort==='typescript:file'&&m.name==='impact')}));`;
  const output=require('node:child_process').execFileSync(process.execPath,['--max-old-space-size=512','-e',program],{cwd:__dirname,encoding:'utf8',windowsHide:true,timeout:30000});
  const result=JSON.parse(output);assert.equal(result.count,120008);assert.equal(result.symbol.value,0);assert.equal(result.symbol.population,15000);assert.equal(result.file.population,1);assert.equal(result.file.value,0);
});
test('unique neighbors, self-edge exclusion, reverse depth and ownership crossing are exact', () => {
  const {graph,ownership} = fixture();
  const result = collectCoupling(graph,ownership,{schemaVersion:1,impactDepth:2,testFiles:[]});
  const metric = (n,name) => result.metrics.find(m=>m.itemId===graph.nodes[n].id&&m.name===name).value;
  assert.equal(metric(0,'fanOut'),1); assert.equal(metric(1,'fanIn'),1);
  assert.equal(metric(2,'fanOut'),0); assert.equal(metric(2,'impact'),2);
  assert.equal(metric(1,'crossOwnerOut'),1);
  assert.ok(result.metrics.some(m=>m.itemId===evidenceId({kind:'file',path:'b.ts'})&&m.name==='fanIn'&&m.value===1));
  assert.deepEqual(result,collectCoupling({...graph,nodes:[...graph.nodes].reverse(),edges:[...graph.edges].reverse()},ownership,{schemaVersion:1,impactDepth:2,testFiles:[]}));
});
test('static unit/integration/e2e links preserve graph uncertainty without inventing coverage', () => {
  const {graph,ownership}=fixture();
  graph.status='partial'; graph.unresolved={validity:'unavailable',reason:'not exposed'};
  const config={schemaVersion:1,impactDepth:3,testFiles:[{path:'test.ts',kind:'unit'},{path:'a.ts',kind:'integration'},{path:'b.ts',kind:'e2e'}]};
  const result=collectCoupling(graph,ownership,config);
  for(const kind of ['unit','integration','e2e']) assert.equal(result.metrics.find(m=>m.itemId===graph.nodes[2].id&&m.name==='staticTestLinkage:'+kind).value,1);
  const coverage=result.metrics.find(m=>m.itemId===graph.nodes[2].id&&m.name==='runtimeCoverage');
  assert.equal(coverage.validity,'unavailable'); assert.equal(coverage.value,null);
  assert.equal(result.status,'partial'); assert.deepEqual(result.unresolved,graph.unresolved);
  assert.ok(result.evidence.every(e=>e.confidence===0.5&&e.provenance==='heuristic'));
  assert.equal(result.candidates,undefined);
});
test('mixed file/symbol edges count once at file level and unmapped endpoints remain explicit', () => {
  const {graph,ownership}=fixture();
  const identity={kind:'file',path:'a.ts'}, file={id:evidenceId(identity),identity,language:'typescript'};
  graph.nodes.push(file); graph.edges.push({source:file.id,target:graph.nodes[1].id,kind:'imports',confidence:null,provenance:'ast'}, {source:file.id,target:'missing',kind:'calls',confidence:0.1,provenance:'heuristic'});
  const result=collectCoupling(graph,ownership,{schemaVersion:1,impactDepth:2,testFiles:[]});
  assert.equal(result.metrics.find(m=>m.itemId===file.id&&m.name==='fanOut').value,1);
  assert.equal(result.status,'partial');
  assert.equal(result.ignoredEdges[0].reason,'unmapped endpoint');
  assert.equal(result.ignoredEdges[0].confidence,0.1);
});
