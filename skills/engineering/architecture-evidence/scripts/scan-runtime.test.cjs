'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {runCollector}=require('./scan-runtime.cjs');
test('baseline window follows committed renames and preserves incomplete-history diagnostics',async t=>{
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
 const temp=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temp,'architecture-evidence-window-'));
 t.after(()=>{assert.equal(path.dirname(path.resolve(root)),temp);assert.ok(path.basename(root).startsWith('architecture-evidence-window-'));fs.rmSync(root,{recursive:true,force:true});});
 const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();
 git(['init','-q']);git(['config','user.email','test@example.invalid']);git(['config','user.name','Test']);
 fs.writeFileSync(path.join(root,'a.ts'),'export const a=1;\n');git(['add','.']);git(['commit','-qm','baseline']);const baselineHead=git(['rev-parse','HEAD']);
 git(['mv','a.ts','renamed.ts']);git(['commit','-qm','rename']);
 const selection=require('./git-selection.cjs').selectGitCommits(root);
 const result=await runCollector('window',{root,config:{},baselineHead,selection});
 assert.equal(result.complete,true);assert.equal(result.history.count,1);
 assert.deepEqual(result.renames.map(r=>[r.from,r.to]),[['a.ts','renamed.ts']]);
 const missing=await runCollector('window',{root,config:{},baselineHead:'f'.repeat(40),selection});
 assert.equal(missing.complete,false);assert.ok(missing.reason);assert.ok(missing.recovery);
 const shallow=await runCollector('window',{root,config:{},baselineHead,selection:{...selection,shallow:true}});
 assert.equal(shallow.complete,false);assert.match(shallow.reason,/shallow/);
});
test('source import cycles remain measurable without a symbol graph or SDK',async()=>{
  const sources=[{path:'a.ts',source:"import './b'; export const a=1;"},{path:'b.ts',source:"import './a'; export const b=2;"}];
  const result=await runCollector('structure',{root:process.cwd(),config:{},sources,ownership:{files:sources.map(s=>({path:s.path,owner:'app'}))}});
  assert.equal(result.clusters.length,1);
  assert.deepEqual(result.clusters[0].paths,['a.ts','b.ts']);
  assert.equal(result.metrics.find(m=>m.name==='cycleSize').value,2);
  assert.ok(result.gaps.some(g=>g.reason==='project layer rules are not configured'));
});
test('default isolated coupling uses captured bindings instead of same-name graph guesses',async()=>{
 const {evidenceId}=require('./schema.cjs');
 const nodes=['run','native','work'].map((name,i)=>{const identity={kind:'symbol',path:i===2?'b.ts':'a.ts',qualifiedName:name,symbolKind:'function'};return {id:evidenceId(identity),identity,language:'typescript'};});
 const edges=nodes.slice(0,2).map(n=>({source:n.id,target:nodes[2].id,kind:'calls',confidence:0.9}));
 const files=['a.ts','b.ts'].map(path=>({path,language:'typescript'}));
 const graph={id:'binding',status:'complete',freshness:'fresh',source:'fixture',nodes,files,edges};
 const sources=[{path:'a.ts',source:"import {work} from './b'; function run(){work();} function native(){'a'.work();}"},{path:'b.ts',source:'export function work(){}'}];
 const result=await runCollector('coupling',{root:'.',config:{},graph,sources,ownership:{files:files.map(f=>({path:f.path,owner:'app'}))},testFiles:[]});
 assert.equal(result.metrics.find(m=>m.itemId===nodes[2].id&&m.name==='fanIn').value,1);
 assert.equal(result.bindingEvidence.entries.filter(e=>e.classification==='confirmed').length,1);
 assert.match(result.metrics.find(m=>m.name==='impact').source,/confirmed-coupling-v1/);
});
test('large coupling output crosses the isolated boundary without dropping any metric or provenance',async()=>{
  const {evidenceId}=require('./schema.cjs'),{collectConfirmedCoupling}=require('./confirmed-coupling.cjs');
  const nodes=Array.from({length:35000},(_,i)=>{const identity={kind:'symbol',path:'large-module.ts',qualifiedName:'exportedFunction'+i,symbolKind:'function'};return {id:evidenceId(identity),identity,language:'typescript'};});
  const graph={id:'large-fixture',status:'partial',freshness:'fresh',source:'fixture-adapter',nodes,files:[{path:'large-module.ts',language:'typescript'}],edges:[],unresolved:{validity:'unavailable',reason:'fixture uncertainty'},omittedEdges:[],omittedNodes:[],missingFiles:[]};
  const ownership={files:[{path:'large-module.ts',owner:'app'}]},testFiles=[];
  const expected=collectConfirmedCoupling(graph,ownership,{schemaVersion:1,impactDepth:2,testFiles},null);
  assert.ok(Buffer.byteLength(JSON.stringify({result:expected}))>64*1024*1024);
  const result=await runCollector('coupling',{root:process.cwd(),config:{},graph,ownership,testFiles});
  assert.equal(result.metrics.length,280008);assert.deepEqual(result,expected);
});
test('isolated process executes the pinned AST collector and can be cancelled without touching sources',async()=>{
  const sources=[{path:'example.ts',source:'export function f(): number { return 1; }'}],before=JSON.stringify(sources);
  const result=await runCollector('ast',{root:process.cwd(),config:{},sources});assert.equal(result.status,'complete');assert.ok(result.metrics.some(m=>m.name==='functionLength'));
  const controller=new AbortController(),pending=runCollector('ast',{root:process.cwd(),config:{},sources},controller.signal);controller.abort();
  await assert.rejects(pending,/timed out|aborted/);assert.equal(JSON.stringify(sources),before);
});

test('isolated project wiring preserves ordered ownership and detects type input changes',async t=>{
  const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{prepareProjectInput}=require('./project-surface.cjs');
  const temp=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temp,'architecture-evidence-scan-project-'));
  t.after(()=>{assert.equal(path.dirname(path.resolve(root)),temp);assert.ok(path.basename(root).startsWith('architecture-evidence-scan-project-'));fs.rmSync(root,{recursive:true,force:true});});
  for(const [p,files] of [['one.json',['a.ts']],['two.json',['a.ts','b.ts']]])fs.writeFileSync(path.join(root,p),JSON.stringify({compilerOptions:{types:[],skipLibCheck:true},files}));
  const sources=['a.ts','b.ts'].map(p=>({path:p,source:'export const x: number=1;'}));for(const s of sources)fs.writeFileSync(path.join(root,s.path),s.source);
  const config={surfaceProjects:['one.json','two.json'],collectorHeapMb:1024},projects=config.surfaceProjects.map(p=>prepareProjectInput(root,p));
  const result=await runCollector('surface',{root,config,sources,projects});assert.equal(result.status,'complete');assert.deepEqual(result.files.map(f=>[f.path,f.project]),[['a.ts','one.json'],['b.ts','two.json']]);
  assert.equal((await runCollector('verify-projects',{root,config,projects:result.projects})).status,'complete');
  fs.writeFileSync(path.join(root,'a.ts'),'export const x: string="changed";');await assert.rejects(runCollector('verify-projects',{root,config,projects:result.projects}),/drift/);
  await assert.rejects(runCollector('ast',{root,config:{collectorHeapMb:0},sources}),/collectorHeapMb/);
});

test('large classified edge evidence survives the bounded isolated transport without losing raw metadata',async()=>{
 const {evidenceId}=require('./schema.cjs'),{classifyEdges}=require('./edge-evidence.cjs'),{collectConfirmedCoupling}=require('./confirmed-coupling.cjs');
 const nodes=['a','b'].map(qualifiedName=>{const identity={kind:'symbol',path:'evidence.ts',qualifiedName,symbolKind:'function'};return {id:evidenceId(identity),identity,language:'typescript'};});
 const edges=Array.from({length:20000},(_,i)=>({source:nodes[0].id,target:nodes[1].id,kind:'calls',confidence:0.9,metadata:{index:i,context:'retained provenance '.repeat(90)}}));
 const graph={id:'large-evidence',status:'partial',freshness:'fresh',source:'fixture',nodes,files:[{path:'evidence.ts',language:'typescript'}],edges,missingFiles:[],omittedNodes:[],omittedEdges:[],unresolved:{validity:'unavailable',reason:'fixture uncertainty'}};
 const ownership={files:[{path:'evidence.ts',owner:'app'}]},sources=[],testFiles=[];
 const input={root:process.cwd(),config:{},graph,ownership,sources,testFiles};
 assert.ok(Buffer.byteLength(JSON.stringify(input))<64*1024*1024);
 const expected=collectConfirmedCoupling(graph,ownership,{schemaVersion:1,impactDepth:2,testFiles},classifyEdges(graph,sources));
 assert.ok(Buffer.byteLength(JSON.stringify(expected))>64*1024*1024);
 const actual=await runCollector('coupling',input);assert.deepEqual(actual,expected);
});

test('binding transport rejects corrupt and unsupported envelopes explicitly',()=>{
 const {packResult,unpackResult}=require('./metric-transport.cjs');
 const input={metrics:[],bindingEvidence:{entries:[{edge:{source:'a',target:'b'},classification:'confirmed',reason:'binding',proof:{start:1,end:2}}]}};
 const wire=packResult(input);assert.deepEqual(unpackResult(JSON.parse(JSON.stringify(wire))),input);
 assert.throws(()=>unpackResult({...wire,bindingWire:{...wire.bindingWire,version:2}}),/invalid binding evidence transport/);
 assert.throws(()=>unpackResult({...wire,bindingWire:{...wire.bindingWire,data:'broken'}}));
 assert.throws(()=>unpackResult({...wire,result:{...wire.result,bindingEvidence:{}}}),/invalid binding evidence transport/);
});
