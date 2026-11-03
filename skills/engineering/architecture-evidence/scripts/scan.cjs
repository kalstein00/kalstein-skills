'use strict';
const {canonicalJson,fingerprint,evidenceItems,snapshotRecord}=require('./schema.cjs');
const {resolveOwnership}=require('./ownership.cjs');
const {rankMetrics}=require('./ranking.cjs');
const {coordinateBatch}=require('./continuation.cjs');
const {reconcileIdentities}=require('./identity-reconciliation.cjs');
const {reconsiderStructure}=require('./reconsider-structure.cjs');
const {validateConfig,metricRequirements,compactCollector,reviewedEvidence}=require('./scan-support.cjs');
function baselineFor(item,context,ownershipIdentity,metricSchemaIdentity){
  const {metricIndex,surfaceIndex,overlapIndex,structure}=context;
  const NA={validity:'not-applicable'},unavailable={validity:'unavailable'},path=item.identity.path,file=path?evidenceItems([{kind:'file',path}])[0].id:null;
  const declaration=surfaceIndex.get(path),percentiles={};
  for(const name of ['fanIn','fanOut','impact','complexity']){
    const metric=metricIndex.get(item.id+'|'+(name==='complexity'&&item.identity.kind==='file'?'topLevelComplexity':name));
    percentiles[name]=metric?.rankValidity==='valid'?{validity:'valid',value:metric.percentile,cohortKey:metric.cohortKey,direction:'risk-higher'}:path?unavailable:NA;
  }
  return {schemaVersion:1,reviewedEvidence:context.reviewedEvidence(item),publicSurface:path?declaration?.validity==='valid'?{validity:'valid',fingerprint:declaration.fingerprint}:unavailable:NA,percentiles,
    topGroups:{validity:'valid',population:'before-suppression',groups:overlapIndex.get(item.id)||[]},
    cycles:structure?.status==='complete'?{validity:'valid',ids:structure.clusters.filter(c=>c.id===item.id||c.identity.members.includes(file)).map(c=>c.id)}:unavailable,
    observedCycles:structure?{validity:'valid',ids:structure.clusters.filter(c=>c.id===item.id||c.identity.members.includes(file)).map(c=>c.id+':'+(c.dependencyKind||'unknown'))}:unavailable,
    observedViolations:structure?{validity:'valid',ids:structure.violations.filter(v=>v.id===item.id||v.identity.source===file||v.identity.target===file).map(v=>v.id)}:unavailable,
    violations:structure?.status==='complete'?{validity:'valid',ids:structure.violations.filter(v=>v.id===item.id||v.identity.source===file||v.identity.target===file).map(v=>v.id)}:unavailable,ownershipIdentity,metricSchemaIdentity};
}
const identify=report=>{const result={...report,resultIdentity:fingerprint(report)};return {...result,canonical:canonicalJson(result)+'\n'};};
function snapshotFor(state,git,graph,ownership,config,diagnostics){return snapshotRecord({schemaVersion:1,source:{head:state.head,files:state.inventory.entries.filter(f=>f.role==='production'&&f.fingerprint).map(f=>({path:f.path,fingerprint:f.fingerprint})),dirtyFingerprint:state.dirtyFingerprint},git:{commits:git.commits.map(c=>c.id),selection:git.id},graph:{identity:graph?.id||fingerprint(diagnostics.filter(d=>d.collector==='graph')),freshness:graph?.freshness||'missing'},tools:{...state.tools,git:git.version},config:fingerprint({config,inputs:state.configIdentity}),metricSchema:fingerprint({schema:'architecture-evidence-v4',coupling:require('./confirmed-coupling.cjs').VERSION,bindings:require('./edge-evidence.cjs').RULES,paths:require('./coupling-paths.cjs').VERSION}),ownership:ownership.mapIdentity,ledger:state.ledger.identity});}
async function runScan(root,config,{runner,continuation=null,reuse=null,onProgress=()=>{}}={}){
  const diagnostics=[],results={};
  let initialSnapshot=null,initialCounts=null;
  const deadline=Date.now()+(config?.timeoutMs??120000);
  const step=async(name,data={})=>{let timer;const controller=new AbortController();try{
    onProgress(name+' started');
    const remaining=deadline-Date.now();if(remaining<=0)throw new Error('scan timed out');
    const result=await Promise.race([runner(name,{root,config,...data},controller.signal),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error(name+' timed out'));},remaining);})]);
    if(!result||result.status==='blocked')throw new Error(result?.reason||'collector returned no result');results[name]=result;
    if(result.status==='unsupported'){diagnostics.push({collector:name,reason:result.reason,recovery:result.recovery});return null;}
    if(result.status==='partial')diagnostics.push({collector:name,reason:result.reason||'partial evidence',recovery:result.recovery||'Inspect collector diagnostics and repair inputs before retry.'});return result;
  }catch(error){diagnostics.push({collector:name,reason:error.message,recovery:'Repair the named collector/input and rerun; no zero-value fallback.'});return null;}finally{clearTimeout(timer);onProgress(name+' finished');}};
  const blocked=reason=>({status:'blocked',reason,snapshot:initialSnapshot,snapshotVerified:false,measurement:{status:'blocked',counts:initialCounts},diagnostics,review:{status:'not-started'}});
  try{
    validateConfig(config);
    config=JSON.parse(canonicalJson(config));runner??=require('./scan-runtime.cjs').runCollector;
    const state=await step('capture');if(!state||state.ledger.status!=='complete')return blocked('valid source and ledger required');
    initialCounts=state.inventory.counts;
    const git=await step('git');if(!git)return blocked('Git selection unavailable');
    const production=state.inventory.entries.filter(e=>e.role==='production'),paths=new Set(production.map(e=>e.path));
    const graph=await step('graph',{productionPaths:[...paths]});
    const ownership=resolveOwnership([...paths,...(graph?.files||[]).map(f=>f.path)],state.ownershipMap);
    const snapshot=snapshotFor(state,git,graph,ownership,config,diagnostics);
    initialSnapshot=snapshot;
    if(reuse){if(reuse.schemaVersion!==5)return blocked('cached metric schema unsupported; run a fresh scan');const {resultIdentity,canonical,...cached}=reuse;if(reuse.snapshot?.id!==snapshot.id||fingerprint(cached)!==resultIdentity)return blocked('cached snapshot mismatch or artifact corruption; run a fresh scan');
      if((state.surfaceProjects||[]).length&&!await step('verify-projects',{projects:cached.collectors.surface?.projects||[]}))return blocked('project input verification failed during reuse');
      const after=await step('capture'),checkedGraph=graph?await step('graph',{productionPaths:[...paths]}):null;
      if(!after||(graph&&!checkedGraph))return blocked('input verification unavailable; inspect timeout/collector failure and retry');
      if(fingerprint(after)!==fingerprint(state)||git.head!==state.head||(graph&&checkedGraph?.id!==graph.id))return blocked('input drift while validating reuse');
      if(continuation!==null){cached.queue=coordinateBatch({snapshotId:snapshot.id,ledger:state.ledger,ranking:cached.ranking,eligibility:cached.eligibility,decisions:cached.decisions,continuation});if(['blocked','invalid-continuation'].includes(cached.queue.status))cached.status='blocked';}
      if(continuation!==null)cached.couplingPaths=require('./coupling-paths.cjs').buildCouplingPaths(cached);
      return identify(cached);
    }
    const ast=await step('ast',{sources:state.sources}),surface=await step('surface',{sources:state.sources,projects:state.surfaceProjects||[]});
    const pressure=await step('pressure',{selection:git});
    const coupling=graph?await step('coupling',{graph,ownership,sources:state.sources,testFiles:state.inventory.entries.filter(e=>e.role==='evidence').map(e=>({path:e.path,kind:e.path.includes('/e2e/')?'e2e':e.path.includes('/integration/')?'integration':'unit'}))}):null;
    const structure=await step('structure',{ownership,productionPaths:[...paths],sources:state.sources});
    const items=new Map(evidenceItems(production.map(e=>({kind:'file',path:e.path}))).map(i=>[i.id,i]));
    for(const item of [...(graph?.nodes||[]),...(ast?.items||[])])if(paths.has(item.identity.path))items.set(item.id,{id:item.id,identity:item.identity});
    for(const item of [...(structure?.clusters||[]),...(structure?.violations||[]).filter(v=>paths.has(v.sourcePath)||paths.has(v.targetPath))])items.set(item.id,{id:item.id,identity:item.identity,owners:item.owners});
    const metrics=[...(ast?.metrics||[]),...(surface?.files||[]).map(f=>f.metric).filter(Boolean),...(pressure?.metrics||[]),...(coupling?.metrics||[]),...(structure?.metrics||[])].filter(m=>items.has(m.itemId));
    const {metrics:rankedMetrics,...ranking}=rankMetrics(metrics),owners=new Map(ownership.files.map(f=>[f.path,f.owner]));
    const measured=new Set(metrics.map(m=>m.itemId+'|'+m.name)),{required,unsupported:applicability}=metricRequirements(items.values(),{graph,ast,pressure});
    for(const key of required)if(!measured.has(key)){const at=key.lastIndexOf('|');diagnostics.push({collector:'metrics',itemId:key.slice(0,at),reason:'missing '+key.slice(at+1),recovery:'Repair the applicable collector; absence is not zero or completion.'});}
    const windows=[];for(const baselineHead of [...new Set(state.ledger.data.entries.map(e=>e.snapshot.head))].sort()){
      const window=baselineHead===state.head?{baselineHead,currentHead:state.head,complete:true,commits:[],renames:[],history:{status:'suppressed',count:0}}:await step('window',{baselineHead,selection:git});if(window)windows.push(window);
    }
    const reconciliation=reconcileIdentities(state.ledger,[...items.values()],{currentHead:state.head,currentComplete:state.inventory.status==='complete'&&graph?.status==='complete'&&ast?.status==='complete',windows});
    const mapped=new Map(reconciliation.mappings.filter(m=>m.currentId).map(m=>[m.currentId,m])),decisions={},baselines={};
    const baselineContext={metricIndex:new Map(rankedMetrics.map(m=>[m.itemId+'|'+m.name,m])),surfaceIndex:new Map((surface?.files||[]).map(f=>[f.path,f])),overlapIndex:new Map(ranking.overlap.map(i=>[i.id,i.groups])),structure,
      reviewedEvidence:reviewedEvidence(state,{config,ownership:ownership.mapIdentity,metricSchema:snapshot.input.metricSchema,metrics:rankedMetrics,structure,surface,ast,coupling,pressure})};
    const unresolvedPrior=reconciliation.mappings.some(m=>m.status==='unresolved'&&['accepted','rejected'].includes(m.disposition));
    const unresolvedIds=new Set(reconciliation.mappings.filter(m=>m.status==='unresolved').map(m=>m.originalId));
    const typeCycles=new Set((structure?.clusters||[]).filter(c=>c.dependencyKind==='requires-type-only').map(c=>c.id));
    const eligibility=[...items.values()].map(i=>{
      const prior=mapped.get(i.id),base=baselineFor(i,baselineContext,ownership.mapIdentity,snapshot.input.metricSchema);baselines[i.id]={structure:base};
      if(prior?.disposition==='rejected')decisions[i.id]={structure:reconsiderStructure(prior.entry.snapshot.baseline.structure,base),history:windows.find(w=>w.baselineHead===prior.entry.snapshot.head)?.history||{status:'review-needed',reason:'history comparison unavailable'}};
      return {id:i.id,eligible:!typeCycles.has(i.id)&&(!unresolvedPrior||!!prior),owners:i.owners||[owners.get(i.identity.path)],...(prior?{priorId:prior.originalId}:unresolvedPrior?{reason:'prior identity correspondence unresolved',...(unresolvedIds.has(i.id)?{review:'review-needed'}:{})}:{}),...(typeCycles.has(i.id)?{reason:'type-dependent cycle; no observed value cycle'}:{})};
    });
    if(reconciliation.status!=='complete')diagnostics.push({collector:'reconciliation',reason:'identity correspondence unresolved',recovery:'Inspect original IDs and complete baseline rename windows; do not guess disposition transfers.'});
    const queue=coordinateBatch({snapshotId:snapshot.id,ledger:state.ledger,ranking,eligibility,decisions,continuation});
    if(queue.comparisonDiagnostics?.length)diagnostics.push({collector:'reconsideration',reason:'prior comparison unavailable; excluded from candidate queue',recovery:'Inspect queue.comparisonDiagnostics and original ledger baselines; do not infer a new defect or overwrite prior review.'});
    const unavailable=metrics.filter(m=>m.validity!=='valid'&&required.has(m.itemId+'|'+m.name)).length;
    if(unavailable)diagnostics.push({collector:'metrics',reason:'required metric unavailable',recovery:'Inspect each metric validity/reason and restore its collector input.'});
    if(state.inventory.status!=='complete')diagnostics.push({collector:'inventory',reason:'unsupported, failed or unclassified source',recovery:'Inspect inventory counts and entries; prepare explicit language support.'});
    const after=await step('capture'),graphAfter=graph?await step('graph',{productionPaths:[...paths]}):null;
    if((state.surfaceProjects||[]).length&&(!surface||!await step('verify-projects',{projects:surface.projects||[]})))return blocked('project input verification failed');
    if(!after||(graph&&!graphAfter))return blocked('input verification unavailable; inspect timeout/collector failure and retry');
    if(fingerprint(after)!==fingerprint(state)||state.head!==git.head||(graph&&graphAfter?.id!==graph.id))return blocked('input drift during scan; retry from a stable source/graph/ledger snapshot');
    const status=queue.status==='blocked'||queue.status==='invalid-continuation'?'blocked':diagnostics.length?'partial':'complete';
    const report={schemaVersion:5,status,snapshot,measurement:{status,scope:'current source size/structure; HEAD history churn',counts:state.inventory.counts,metrics:metrics.length,required:required.size,unavailable,missing:[...required].filter(k=>!measured.has(k)).length},review:{status:'not-started',reviewedCount:0},diagnostics,applicability,items:[...items.values()].sort((a,b)=>a.id<b.id?-1:1),metrics:rankedMetrics,ranking,queue,eligibility,decisions,reconciliation,baselines,windows,collectors:Object.fromEntries(Object.entries({...results,capture:state}).map(([name,result])=>[name,compactCollector(result)]))};
    report.snapshotVerified=true;
    report.couplingPaths=require('./coupling-paths.cjs').buildCouplingPaths(report);
    return identify(report);
  }catch(error){return blocked(error.message);}
}
async function main(argv,{runner,onProgress}={}){
  const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{RAW_ROOT}=require('./ledger.cjs'),started=Date.now();
  let requestedRoot=path.resolve('.');
  try{
    if(argv.length===1&&argv[0]==='--help')return {status:'complete',usage:'node <skill>/scripts/scan.cjs [--config <json>] [--root <repo>] [--reuse <report-json>] [--next <token-json>]',config:'dependencyCruiser{root,configPath,targets[]}; scopes[], surfaceProjects[](ordered tsconfig paths), collectorHeapMb(default1024/range256..4096), ownershipMapPath, impactDepth(default2), timeoutMs(total/default120000), excludeAuthorEmails[], coChangeMinSupport(default3), mechanicalThreshold(default100), mechanicalCommitIds[]',output:RAW_ROOT+'/<snapshot>-<continuation>.json; raw canonical report; review not started; exit 0 complete, 1 partial, 2 blocked; collectors: isolated configurable heaps and 64MiB I/O; metrics stored once at report.metrics'};
    const options={};for(let i=0;i<argv.length;i+=2){if(!['--root','--config','--next','--reuse'].includes(argv[i])||!argv[i+1]||options[argv[i]])throw new Error('invalid CLI arguments; use --help');options[argv[i]]=argv[i+1];}
    requestedRoot=path.resolve(options['--root']||'.');
    if(!runner&&!process.env.ARCHITECTURE_EVIDENCE_RUNTIME)return await require('./prepare.cjs').runPrepared(options);
    if(!options['--config'])throw new Error('--config JSON required');const root=path.resolve(options['--root']||'.'),configPath=path.resolve(options['--config']),bytes=fs.readFileSync(configPath,'utf8'),config=JSON.parse(bytes);
    const continuation=options['--next']?JSON.parse(fs.readFileSync(path.resolve(options['--next']),'utf8')):null;
    const reuse=options['--reuse']?JSON.parse(fs.readFileSync(path.resolve(options['--reuse']),'utf8')):null;
    let report=await runScan(root,config,{runner,continuation,reuse,onProgress});if(fs.readFileSync(configPath,'utf8')!==bytes)report={status:'blocked',reason:'config input drift; retry from stable config'};
    const filename=(report.snapshot?.id||fingerprint(report)).replace('sha256:','')+'-'+fingerprint(continuation).slice(7,19)+'.json',relative=RAW_ROOT+'/'+filename,output=path.join(root,relative);
    execFileSync('git',['-C',root,'check-ignore','--quiet','--no-index','--',relative],{windowsHide:true,stdio:['ignore','pipe','pipe'],timeout:30000});
    fs.mkdirSync(path.dirname(output),{recursive:true});const temporary=output+'.'+require('node:crypto').randomUUID()+'.tmp';fs.writeFileSync(temporary,report.canonical||canonicalJson(report)+'\n',{flag:'wx'});fs.renameSync(temporary,output);
    const elapsedMs=Date.now()-started,textOutput=require('./text-report.cjs').writeReport(report,{root,rawOutput:output,elapsedMs});
    return {status:report.status,output,textOutput,snapshotId:report.snapshot?.id||null,elapsedMs};
  }catch(error){
    const result={status:'blocked',reason:error.message,recovery:'Repair the named preparation/input failure and retry. No completed measurement is claimed.'};
    try{result.textOutput=require('./text-report.cjs').writeFailure(result,{root:requestedRoot,elapsedMs:Date.now()-started});}catch(writeError){result.reportWriteError=writeError.message;}
    return result;
  }
}
if(require.main===module)main(process.argv.slice(2),{onProgress:message=>process.stderr.write('[architecture-evidence] '+message+'\n')}).then(result=>{process.stdout.write(JSON.stringify(result)+'\n');process.exitCode=result.status==='complete'?0:result.status==='partial'?1:2;});
module.exports={runScan,main};
