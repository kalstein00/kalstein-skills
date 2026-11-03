'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fingerprint,evidenceItems}=require('./schema.cjs');
const {runScan,main}=require('./scan.cjs');
function fixture(paths=['a.ts','b.ts','c.ts']){
  const items=evidenceItems(paths.map(path=>({kind:'file',path}))),head='a'.repeat(40);
  const state={head,inventory:{status:'complete',entries:items.map(i=>({path:i.identity.path,role:'production',language:'typescript',status:'supported',fingerprint:fingerprint(i.id)})),counts:{production:3,supported:3,unsupported:0,failed:0,unclassified:0}},sources:[],ledger:{status:'complete',identity:fingerprint(null),data:{schemaVersion:1,entries:[]}},ownershipMap:{schemaVersion:1,rules:[]},tools:{node:process.version,fixture:'v1'},dirtyFingerprint:fingerprint('clean'),gitStatus:'',configIdentity:fingerprint('config')};
  const graph={id:'graph-id',status:'complete',freshness:'fresh',source:'fixture',files:state.inventory.entries,nodes:items,edges:[],unresolved:{validity:'valid',count:0}};
  const metrics=items.map((i,n)=>({schemaVersion:1,itemId:i.id,name:'loc',value:n+1,unit:'lines',direction:'higher',source:'fixture',cohort:'typescript:file',population:3,validity:'valid'}));
  const extra=names=>items.flatMap(i=>names.map(name=>({...metrics[0],itemId:i.id,name,value:1,unit:'fixture'})));
  const outputs={capture:state,git:{id:'git-id',head,status:'complete',version:'git-fixture',commits:[{id:head,parents:[]}],shallow:false},graph,ast:{status:'complete',items,metrics:[...metrics,...extra(['topLevelComplexity'])]},surface:{status:'complete',files:items.map(i=>({path:i.identity.path,validity:'valid',fingerprint:'surface',metric:{...metrics[0],itemId:i.id,name:'exportSurface'}}))},pressure:{status:'complete',metrics:extra(['changeFrequency','churn','coChangeSupport']),renames:[]},coupling:{status:'complete',metrics:extra(['fanIn','fanOut','impact','crossOwnerOut','staticTestLinkage:unit','staticTestLinkage:integration','staticTestLinkage:e2e'])},structure:{status:'complete',metrics:[],clusters:[],violations:[]}};
  return {items,state,outputs,runner:async name=>structuredClone(outputs[name])};
}
test('scan without a symbol SDK preserves source metrics and reports unsupported call evidence',async()=>{
  const f=fixture(),{runCollector}=require('./scan-runtime.cjs');
  const result=await runScan('.',{}, {runner:(name,data)=>name==='graph'?runCollector(name,data):f.runner(name,data)});
  assert.equal(result.status,'partial');
  assert.equal(result.snapshotVerified,true);
  assert.ok(result.metrics.some(m=>m.name==='loc'));
  assert.ok(result.collectors.structure);
  assert.ok(result.diagnostics.some(d=>d.collector==='graph'&&d.reason.includes('symbol graph collection is disabled')));
  assert.ok(result.applicability.some(m=>m.name==='fanIn'&&m.status==='unsupported'));
  assert.equal(result.metrics.some(m=>m.name==='fanIn'),false);
});
test('fixed collectors produce reproducible bounded queue and distinct measurement/review states',async()=>{
  const f=fixture(),before=JSON.stringify(f.outputs),config={};
  const a=await runScan('.',config,{runner:f.runner}),b=await runScan('.',config,{runner:f.runner});
  assert.equal(a.status,'complete');assert.equal(a.review.status,'not-started');assert.equal(a.queue.selection.selected.length,3);
  assert.equal(a.canonical,b.canonical);assert.equal(a.snapshot.input.source.head,f.state.head);assert.deepEqual(a.snapshot.input.git.commits,[f.state.head]);
  assert.equal(a.ranking.metrics,undefined);assert.ok(a.collectors.surface.files.every(file=>file.metric===undefined));assert.ok(a.collectors.surface.files.every(file=>file.fingerprint==='surface'));
  assert.equal(JSON.stringify(f.outputs),before);
});

test('rejected evidence survives unrelated source and history ranking changes without hiding a changed interface',async()=>{
  const f=fixture();f.outputs.structure.status='partial';f.outputs.structure.gaps=[{reason:'unresolved alias'}];
  const cluster=evidenceItems([{kind:'cluster',members:[f.items[0].id,f.items[1].id]}])[0];
  f.outputs.structure.clusters=[{...cluster,source:'whole-graph-before',owners:['app'],dependencyKind:'value-capable',valueCyclePaths:['a.ts','b.ts']}];
  const first=await runScan('.',{},{runner:f.runner}),item=f.items[0];
  f.state.ledger.data.entries=[{...item,disposition:'rejected',reason:'reviewed as justified',candidateRef:'audit#C3',snapshot:{id:first.snapshot.id,head:f.state.head,baseline:first.baselines[item.id]}}];
  f.state.ledger.identity=fingerprint(f.state.ledger.data);
  const repeat=await runScan('.',{},{runner:f.runner});
  assert.equal(repeat.decisions[item.id].structure.status,'suppressed');
  assert.equal(repeat.queue.selection.excluded.find(i=>i.id===item.id).reason,'rejected suppression');
  assert.equal(repeat.status,'partial');assert.equal(repeat.baselines[item.id].structure.cycles.validity,'unavailable');
  f.state.inventory.entries[2].fingerprint=fingerprint('unrelated new source');
  f.outputs.structure.clusters[0].source='whole-graph-after';
  f.outputs.pressure.metrics.forEach(m=>{m.value+=20;m.source='git-pressure-v1:new-selection';});
  const changed=await runScan('.',{},{runner:f.runner});assert.equal(changed.decisions[item.id].structure.status,'suppressed');
  assert.deepEqual(changed.baselines[cluster.id].structure.reviewedEvidence,first.baselines[cluster.id].structure.reviewedEvidence);
  assert.ok(!changed.queue.selection.selected.some(i=>i.id===item.id));
  f.outputs.surface.files[0].fingerprint='new exported interface';
  const reopened=await runScan('.',{},{runner:f.runner});assert.equal(reopened.decisions[item.id].structure.status,'reopen');
  assert.ok(reopened.queue.selection.selected.some(i=>i.id===item.id));
});
test('verified reuse avoids unavailable measurement work but rejects stale or tampered artifacts',async()=>{
  const f=fixture(),config={},first=await runScan('.',config,{runner:f.runner});
  const onlyInputs=async(name,data)=>['capture','git','graph'].includes(name)?f.runner(name,data):Promise.reject(new Error('measurement unavailable'));
  const reused=await runScan('.',config,{runner:onlyInputs,reuse:JSON.parse(first.canonical)});assert.equal(reused.canonical,first.canonical);
  const tampered=JSON.parse(first.canonical);tampered.review.reviewedCount=99;assert.equal((await runScan('.',config,{runner:onlyInputs,reuse:tampered})).status,'blocked');
  f.state.dirtyFingerprint='changed';assert.equal((await runScan('.',config,{runner:onlyInputs,reuse:JSON.parse(first.canonical)})).status,'blocked');
});
test('legacy mixed metric reports cannot be reused even with a valid artifact fingerprint',async()=>{
 const f=fixture(),config={},first=await runScan('.',config,{runner:f.runner});
 const {resultIdentity,canonical,...old}=JSON.parse(first.canonical);old.schemaVersion=2;
 const result=await runScan('.',config,{runner:f.runner,reuse:{...old,resultIdentity:fingerprint(old)}});
 assert.equal(result.status,'blocked');
 assert.match(result.reason,/schema.*fresh scan/);
});
test('verified continuation replaces path witnesses along with the selected batch',async()=>{
 const f=fixture(),config={},first=await runScan('.',config,{runner:f.runner});
 assert.ok(first.couplingPaths.items.length>0);
 const next=await runScan('.',config,{runner:f.runner,reuse:JSON.parse(first.canonical),continuation:first.queue.next});
 assert.equal(next.queue.selection.selected.length,0);
 assert.deepEqual(next.couplingPaths.items,[]);
});
test('scan carries captured source proof into ranked metrics and detects drift in that input',async()=>{
 const f=fixture(),config={};
 const byPath=new Map(f.items.map(i=>[i.identity.path,i.id]));
 f.state.sources=[{path:'a.ts',source:"import './b';"},{path:'b.ts',source:'export const b=1;'},{path:'c.ts',source:"'x'.b();"}];
 f.outputs.graph.edges=[{source:byPath.get('a.ts'),target:byPath.get('b.ts'),kind:'imports'},
   {source:byPath.get('c.ts'),target:byPath.get('b.ts'),kind:'calls',confidence:0.9}];
 const {runCollector}=require('./scan-runtime.cjs');
 const runner=(name,data)=>name==='coupling'?runCollector(name,data):f.runner(name,data);
 const result=await runScan('.',config,{runner});
 assert.equal(result.metrics.find(m=>m.itemId===byPath.get('b.ts')&&m.name==='fanIn').value,1);
 assert.equal(result.collectors.coupling.confirmation.unresolvedEdges,1);
 assert.equal(result.collectors.coupling.bindingEvidence.entries.length,2);
 assert.equal(result.couplingPaths?.rules,'coupling-paths-v1:limit3');
 assert.ok(result.couplingPaths.items.some(p=>p.paths.some(w=>w.nodes.includes(byPath.get('b.ts')))));
 assert.equal(result.measurement.missing,0);assert.equal(result.measurement.unavailable,0);
 assert.equal(result.snapshotVerified,true);assert.equal(result.status,'partial');
 let captures=0;
 const drift=await runScan('.',config,{runner:async(name,data)=>{
   const output=await runner(name,data);
   if(name==='capture'&&++captures===2)output.sources[0].source='changed source';
   return output;
 }});
 assert.equal(drift.status,'blocked');assert.match(drift.reason,/input drift/);
});
test('missing required metric rows stay partial even when a collector incorrectly reports complete',async()=>{
  const f=fixture();f.outputs.surface.files=[];
  const result=await runScan('.',{},{runner:f.runner});assert.equal(result.status,'partial');assert.ok(result.diagnostics.some(d=>d.reason.includes('exportSurface')));
});

test('JavaScript does not require TypeScript declaration metrics but still requires AST metrics',async()=>{
  const f=fixture(['a.js','b.js','c.js']);for(const file of f.state.inventory.entries)file.language='javascript';f.outputs.surface.files=[];
  const a=await runScan('.',{},{runner:f.runner});assert.equal(a.status,'complete');assert.equal(a.applicability.filter(r=>r.name==='exportSurface'&&r.status==='unsupported').length,3);
  f.outputs.ast.metrics=f.outputs.ast.metrics.filter(m=>m.name!=='loc');const b=await runScan('.',{},{runner:f.runner});assert.equal(b.status,'partial');assert.ok(b.diagnostics.some(d=>d.reason==='missing loc'));
});

test('project inputs are verified during scan and reuse with bounded resource config',async()=>{
  const f=fixture(),config={surfaceProjects:['tsconfig.json'],collectorHeapMb:1024};
  f.state.surfaceProjects=[{configPath:'tsconfig.json',identity:'project-input',files:['a.ts']}];f.outputs.surface.projects=[{configPath:'tsconfig.json',inputIdentity:'project-input'}];f.outputs['verify-projects']={status:'complete'};
  const a=await runScan('.',config,{runner:f.runner});assert.equal(a.status,'complete');assert.equal((await runScan('.',config,{runner:f.runner,reuse:JSON.parse(a.canonical)})).canonical,a.canonical);
  f.outputs['verify-projects']={status:'blocked',reason:'project input drift'};assert.equal((await runScan('.',config,{runner:f.runner,reuse:JSON.parse(a.canonical)})).status,'blocked');
  assert.equal((await runScan('.',{...config,collectorHeapMb:1},{runner:f.runner})).status,'blocked');
});
test('typed producer items require their applicable metrics before completion',async()=>{
  for(const kind of ['cluster','violation','symbol']){
    const f=fixture(),identity=kind==='cluster'?{kind,members:['a.ts','b.ts']}:kind==='violation'?{kind,rule:'layer',source:'a.ts',target:'b.ts'}:{kind,path:'a.ts',qualifiedName:'run',symbolKind:'function'};
    const item=evidenceItems([identity])[0];
    if(kind==='symbol')f.outputs.ast.items=[...f.outputs.ast.items,item];
    else f.outputs.structure[kind==='cluster'?'clusters':'violations'].push({...item,sourcePath:'a.ts',targetPath:'b.ts',owners:['owner']});
    const result=await runScan('.',{},{runner:f.runner});
    assert.equal(result.status,'partial',kind);const names=kind==='cluster'?['cycleSize']:kind==='violation'?['layerViolation']:['complexity','functionLength'];
    for(const name of names)assert.ok(result.diagnostics.some(d=>d.itemId===item.id&&d.reason==='missing '+name),kind+': '+name);
    const target=kind==='symbol'?f.outputs.ast:f.outputs.structure;
    target.metrics.push(...names.map(name=>({...f.outputs.ast.metrics[0],itemId:item.id,name})));
    assert.equal((await runScan('.',{},{runner:f.runner})).status,'complete',kind+' restored');
  }
});

test('CLI writes repeatable ignored artifacts while preserving ledger and Git status',async t=>{
  const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
  const temp=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temp,'dart-scan-cli-'));
  t.after(()=>{assert.equal(path.dirname(path.resolve(root)),temp);assert.ok(path.basename(root).startsWith('dart-scan-cli-'));fs.rmSync(root,{recursive:true,force:true});});
  const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});git(['init','-q']);
  fs.writeFileSync(path.join(root,'.gitignore'),'.codex/tmp/\n');fs.writeFileSync(path.join(root,'scan.json'),JSON.stringify({}));
  const f=fixture(),args=['--root',root,'--config',path.join(root,'scan.json')],before=git(['status','--porcelain']);
  const a=await main(args,{runner:f.runner});assert.equal(a.status,'complete');const bytes=fs.readFileSync(a.output,'utf8');
  assert.equal(typeof a.textOutput,'string','CLI must publish a human-readable artifact');
  assert.match(fs.readFileSync(a.textOutput,'utf8'),/필수 metric/);
  const b=await main(args,{runner:f.runner});assert.notEqual(b.textOutput,a.textOutput);assert(fs.existsSync(a.textOutput));assert.equal(fs.readFileSync(b.output,'utf8'),bytes);assert.equal(git(['status','--porcelain']),before);
  assert.equal(fs.existsSync(path.join(root,'.agents/architecture-evidence/ledger.json')),false);
  const failed=await main(['--unknown']);assert.equal(failed.status,'blocked');assert.equal(typeof failed.textOutput,'string','preparation errors also need a readable report');assert.match(fs.readFileSync(failed.textOutput,'utf8'),/invalid CLI arguments/);assert.ok((await main(['--help'])).usage);
});
test('scan connects confirmed rename dispositions and rejected comparison to explicit continuation',async()=>{
  const f=fixture(),old=evidenceItems([{kind:'file',path:'old.ts'}])[0],oldHead='b'.repeat(40);
  const a=f.items.find(i=>i.identity.path==='a.ts'),b=f.items.find(i=>i.identity.path==='b.ts');
  f.state.ledger.data.entries=[{...old,disposition:'accepted',snapshot:{head:oldHead,baseline:{}}},{...b,disposition:'rejected',snapshot:{head:oldHead,baseline:{}}}];
  f.state.ledger.identity=fingerprint(f.state.ledger.data);
  f.outputs.window={status:'complete',baselineHead:oldHead,currentHead:f.state.head,complete:true,commits:[f.state.head],renames:[{commit:f.state.head,from:'old.ts',to:'a.ts'}],history:{status:'suppressed',count:1}};
  const first=await runScan('.',{},{runner:f.runner});
  assert.equal(first.queue.selection.excluded.find(i=>i.id===a.id)?.reason,'accepted duplicate');
  assert.equal(first.queue.eligibility.find(i=>i.id===b.id).review,'review-needed');
  assert.ok(first.reconciliation.mappings.some(m=>m.originalId===old.id&&m.currentId===a.id));
  const next=await runScan('.',{},{runner:f.runner,continuation:first.queue.next});assert.equal(next.queue.status,'exhausted');
});

test('unresolved rejected identities are held for comparison instead of returning as new candidates',async()=>{
 const f=fixture(),item=f.items[0];
 f.state.ledger.data.entries=[{...item,disposition:'rejected',reason:'known non-defect',candidateRef:null,snapshot:{head:'b'.repeat(40),baseline:{}}}];
 f.state.ledger.identity=fingerprint(f.state.ledger.data);
 f.outputs.window={status:'partial',baselineHead:'b'.repeat(40),currentHead:f.state.head,complete:false,commits:[],renames:[],history:{status:'review-needed',count:null}};
 const report=await runScan('.',{},{runner:f.runner});
 assert.equal(report.queue.selection.selected.some(i=>i.id===item.id),false);
 assert.ok(report.queue.comparisonDiagnostics.some(i=>i.id===item.id));
 assert.equal(report.reconciliation.mappings[0].currentId,null);
 assert.equal(report.queue.selection.selected.length,0,'unmatched items cannot be assumed new while rename correspondence is unavailable');
});

test('a newly observed layer violation reopens a rejected file even with other structure gaps',async()=>{
 const f=fixture(),item=f.items[0];f.outputs.structure.status='partial';
 const first=await runScan('.',{},{runner:f.runner});
 f.state.ledger.data.entries=[{...item,disposition:'rejected',reason:'cohesive',candidateRef:null,snapshot:{head:f.state.head,baseline:first.baselines[item.id]}}];
 const violation=evidenceItems([{kind:'violation',rule:'no-upward-import',source:item.id,target:f.items[1].id}])[0];
 f.outputs.structure.violations.push({...violation,sourcePath:'a.ts',targetPath:'b.ts',owners:['app']});
 const changed=await runScan('.',{},{runner:f.runner});
 assert.equal(changed.decisions[item.id].structure.status,'reopen');
});

test('type-dependent cycles stay measured but cannot consume candidate slots; new value cycles reopen',async()=>{
 const f=fixture(),clusters=[[0,1],[0,2],[1,2]].map(indices=>({...evidenceItems([{kind:'cluster',members:indices.map(i=>f.items[i].id)}])[0],owners:['app'],dependencyKind:'requires-type-only',valueCyclePaths:[]}));
 f.outputs.structure.clusters=clusters;f.outputs.structure.status='partial';
 f.outputs.structure.metrics=clusters.map(c=>({...f.outputs.ast.metrics[0],itemId:c.id,name:'cycleSize',value:2,cohort:'typescript:cluster'}));
 const first=await runScan('.',{},{runner:f.runner});
 for(const c of clusters){assert.ok(first.metrics.some(m=>m.itemId===c.id));assert.equal(first.queue.selection.selected.some(i=>i.id===c.id),false);}
 const c=clusters[0];f.state.ledger.data.entries=[{id:c.id,identity:c.identity,disposition:'rejected',reason:'type cycle',candidateRef:null,snapshot:{id:first.snapshot.id,head:f.state.head,baseline:first.baselines[c.id]}}];
 c.dependencyKind='value-capable';c.valueCyclePaths=['a.ts','b.ts'];
 const changed=await runScan('.',{},{runner:f.runner});
 assert.equal(changed.decisions[c.id].structure.status,'reopen');
 assert.ok(changed.queue.selection.selected.some(i=>i.id===c.id));
});
test('invalid config, collector timeout, partial graph and source drift never report complete',async()=>{
  const f=fixture();assert.equal((await runScan('.',{timeoutMs:0},{runner:f.runner})).status,'blocked');
  const hanging=async(name,data)=>name==='ast'?new Promise(()=>{}):f.runner(name,data);
  const timed=await runScan('.',{timeoutMs:25},{runner:hanging});assert.notEqual(timed.status,'complete');assert.ok(timed.diagnostics.some(d=>d.reason.includes('timed out')));
  assert.match(timed.reason,/verification unavailable/);assert.ok(timed.snapshot);assert.equal(timed.snapshotVerified,false);
  const partial=fixture();partial.outputs.graph.status='partial';partial.outputs.graph.recovery='Repair graph extraction';
  assert.equal((await runScan('.',{},{runner:partial.runner})).status,'partial');
  let captures=0;const drift=async(name,data)=>{const r=await f.runner(name,data);if(name==='capture'&&++captures===2)r.dirtyFingerprint='changed';return r;};
  assert.match((await runScan('.',{},{runner:drift})).reason,/drift/);
  assert.equal((await runScan('.',{},{runner:f.runner})).status,'complete');
  f.state.ownershipMap={schemaVersion:1,rules:[{}]};assert.equal((await runScan('.',{},{runner:f.runner})).status,'blocked');
});
