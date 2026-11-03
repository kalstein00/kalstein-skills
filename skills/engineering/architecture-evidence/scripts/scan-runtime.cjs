'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync,spawnSync,spawn}=require('node:child_process');
const {fingerprint}=require('./schema.cjs');
const {packResult,unpackResult}=require('./metric-transport.cjs');
const git=(root,args)=>execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']}).trim();
function capture(root,config){
  const {collectInventory}=require('./inventory.cjs'),{readLedger}=require('./ledger.cjs');
  const inventory=collectInventory(root,{scopes:config.scopes||[],supportedLanguages:['typescript','javascript']}),ledger=readLedger(root);
  if(ledger.status!=='complete')throw new Error(ledger.reason);
  const sourceEntries=inventory.entries.filter(e=>e.role==='production'&&e.status==='supported');
  const sources=sourceEntries.map(e=>({path:e.path,source:fs.readFileSync(path.join(root,e.path),'utf8')}));
  const mapPath=config.ownershipMapPath?path.resolve(root,config.ownershipMapPath):path.join(root,'.agents/architecture-evidence/ownership.json');
  const ownershipMap=fs.existsSync(mapPath)?JSON.parse(fs.readFileSync(mapPath,'utf8')):config.ownershipMapPath?(()=>{throw new Error('ownership map missing: '+mapPath);})():{schemaVersion:1,rules:[]};
  const packages=['typescript','dependency-cruiser'],tools={node:process.version};
  for(const name of packages)try{tools[name]=require('../node_modules/'+name+'/package.json').version;}catch{tools[name]='unavailable';}
  tools.collectors=fingerprint(fs.readdirSync(__dirname).filter(n=>n.endsWith('.cjs')&&!n.endsWith('.test.cjs')).sort().map(n=>[n,fs.readFileSync(path.join(__dirname,n),'utf8')]));
  const projectInputs=[];
  if(config.dependencyCruiser){
    const entry=require.resolve(path.resolve(root,config.dependencyCruiser.configPath));require(entry);
    const seen=new Set(),visit=mod=>{if(!mod||seen.has(mod.filename))return;seen.add(mod.filename);projectInputs.push([mod.filename,fs.readFileSync(mod.filename,'utf8')]);mod.children.forEach(visit);};
    visit(require.cache[entry]);projectInputs.sort((a,b)=>a[0].localeCompare(b[0]));
  }
  const evidence=inventory.entries.filter(e=>e.role==='evidence').map(e=>[e.path,fingerprint(fs.readFileSync(path.join(root,e.path),'utf8'))]);
  const surfaceProjects=(config.surfaceProjects||[]).map(p=>require('./project-surface.cjs').prepareProjectInput(root,p));
  const gitStatus=git(root,['status','--porcelain=v1','--untracked-files=all']);
  return {status:inventory.status,head:git(root,['rev-parse','HEAD']),inventory,sources,evidence,ledger,ownershipMap,tools,gitStatus,surfaceProjects,dirtyFingerprint:fingerprint({gitStatus,files:inventory.entries.filter(e=>e.fingerprint).map(e=>[e.path,e.fingerprint]),evidence}),configIdentity:fingerprint({config,ownershipMap,projectInputs,surfaceProjects:surfaceProjects.map(p=>p.identity)})};
}
async function collect(name,d){
  const {root,config}=d;
  if(name==='capture')return capture(root,config);
  if(name==='git')return require('./git-selection.cjs').selectGitCommits(root,{excludeAuthorEmails:config.excludeAuthorEmails});
  if(name==='graph')return {status:'unsupported',reason:'External symbol graph collection is disabled; call/impact/test-link metrics are unavailable.',recovery:'Inspect callers and imports with scoped rg and source reads. Missing evidence is not zero.'};
  if(name==='ast')return require('./ast-metrics.cjs').collectAstMetrics(d.sources);
  if(name==='surface'){
    const remaining=new Map(d.sources.filter(s=>/\.(?:[cm]?ts|tsx)$/.test(s.path)&&! /\.d\.[cm]?ts$/.test(s.path)).map(s=>[s.path,s])),files=[],projects=[],diagnostics=[];
    const api=require('./project-surface.cjs');
    for(const project of d.projects||[]){const targets=project.files.filter(p=>remaining.has(p));
      if(!targets.length){projects.push({configPath:project.configPath,inputIdentity:project.identity,input:project.input});continue;}
      const result=api.collectProjectSurface(root,project.configPath,targets);if(result.inputIdentity!==project.identity||!api.verifyProjectInput(result.input))throw new Error('project input drift: '+project.configPath);
      projects.push({configPath:project.configPath,inputIdentity:result.inputIdentity,input:result.input});diagnostics.push(...result.diagnostics.map(d=>({...d,project:project.configPath})));
      for(const file of result.files){files.push({...file,project:project.configPath});remaining.delete(file.path);}
    }
    if(remaining.size){const result=require('./interface-surface.cjs').collectInterfaceSurface([...remaining.values()]);files.push(...result.files);diagnostics.push(...result.diagnostics.map(d=>({...d,project:'independent-v1'})));}
    return {status:files.some(f=>f.validity!=='valid')?'partial':'complete',files:files.sort((a,b)=>a.path<b.path?-1:1),projects,diagnostics};
  }
  if(name==='verify-projects'){
    if(d.projects.length!==(config.surfaceProjects||[]).length||d.projects.some((p,i)=>p.configPath!==config.surfaceProjects[i]||!require('./project-surface.cjs').verifyProjectInput(p.input)))throw new Error('project input drift or missing project verification');
    return {status:'complete'};
  }
  if(name==='pressure')return require('./git-pressure.cjs').collectGitPressure(root,d.selection,config);
  if(name==='coupling'){
    const evidence=Array.isArray(d.sources)?require('./edge-evidence.cjs').classifyEdges(d.graph,d.sources):null;
    return require('./confirmed-coupling.cjs').collectConfirmedCoupling(d.graph,d.ownership,{schemaVersion:1,impactDepth:config.impactDepth??2,testFiles:d.testFiles},evidence);
  }
  if(name==='structure'){
    const spec=config.dependencyCruiser;let cruise=null;
    if(spec){
      const manifest=require('../node_modules/dependency-cruiser/package.json'),app=path.resolve(root,spec.root||'.'),configPath=path.resolve(root,spec.configPath);
      const run=spawnSync(process.execPath,[path.resolve(__dirname,'../node_modules/dependency-cruiser',manifest.bin.depcruise),'--config',configPath,'--output-type','json',...spec.targets],{cwd:app,encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:64*1024*1024});
      if(run.error||![0,1].includes(run.status))throw new Error('dependency-cruiser failed: '+(run.error?.message||run.stderr));
      const rules=require(configPath);
      cruise={source:'dependency-cruiser@'+manifest.version,ruleIdentity:fingerprint(rules),rules,ruleSource:spec.configPath,pathPrefix:spec.root||'',result:JSON.parse(run.stdout)};
    }
    const sourceSnapshot={id:fingerprint(d.sources),status:'complete',freshness:'fresh',files:[]};
    const graph=require('./source-imports.cjs').sourceImportGraph(sourceSnapshot,d.sources);
    return require('./structural-findings.cjs').collectStructuralFindings(graph,d.ownership,cruise);
  }
  if(name==='window'){
    const history=require('./reconsider-history.cjs').reconsiderHistory(root,d.baselineHead,d.selection),base={status:'partial',baselineHead:d.baselineHead,currentHead:d.selection.head,complete:false,commits:history.commits,renames:[],history};
    if(history.count===null)return {...base,reason:history.reason,recovery:history.recovery};
    if(git(root,['rev-list','--min-parents=2',d.selection.head,'^'+d.baselineHead,'--']))return {...base,recovery:'Merged baseline range has ambiguous rename lineage; explicitly reconcile after reviewing branch history.'};
    const text=git(root,['rev-list','--parents','--no-merges',d.selection.head,'^'+d.baselineHead,'--']),commits=text?text.split('\n').map(line=>{const [id,...parents]=line.split(' ');return {id,parents};}):[];
    const pressure=require('./git-pressure.cjs').collectGitPressure(root,{status:'complete',head:d.selection.head,id:fingerprint(history.commits),commits,shallow:false,
      historyCompleteness:'complete-reachable-ancestry',mergeOnlyResolution:{validity:'not-applicable',reason:'Verified baseline range contains no merge commits.'}},config);
    return {...base,status:pressure.status==='complete'?'complete':'partial',complete:pressure.status==='complete',renames:pressure.renames||[],reason:pressure.reason||null,recovery:pressure.recovery||null};
  }
  throw new Error('unknown collector: '+name);
}
function runCollector(name,data,signal){return new Promise((resolve,reject)=>{
  const input=JSON.stringify(data),limit=64*1024*1024;if(Buffer.byteLength(input)>limit)return reject(new Error(name+' collector input exceeds 64 MiB'));
  const heap=data.config?.collectorHeapMb??1024;if(!Number.isSafeInteger(heap)||heap<256||heap>4096)return reject(new Error('collectorHeapMb must be 256..4096'));
  const child=spawn(process.execPath,['--max-old-space-size='+heap,__filename,'--collector',name],{windowsHide:true,stdio:['pipe','pipe','pipe']});let settled=false,size=0,stderr='';const chunks=[];
  const finish=(error,value)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',abort);if(error)child.kill();error?reject(error):resolve(value);};
  const abort=()=>finish(new Error(name+' timed out or aborted'));signal?.addEventListener('abort',abort,{once:true});
  child.stdout.on('data',b=>{size+=b.length;if(size>limit)finish(new Error(name+' collector output exceeds 64 MiB'));else chunks.push(b);});child.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-8192);});child.on('error',e=>finish(e));child.stdin.on('error',e=>finish(e));
  child.on('close',code=>{if(settled)return;try{if(code!==0)throw new Error(name+' collector process failed (exit '+code+'): '+(/heap|memory/i.test(stderr)?'memory limit reached':stderr.trim().slice(0,500)));const r=JSON.parse(Buffer.concat(chunks).toString());if(r.error)throw new Error(r.error);finish(null,unpackResult(r));}catch(error){finish(error);}});
  if(signal?.aborted)abort();else child.stdin.end(input);
});}
if(process.argv[2]==='--collector'){let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{input+=s;});process.stdin.on('end',()=>collect(process.argv[3],JSON.parse(input)).then(result=>process.stdout.write(JSON.stringify(packResult(result))),error=>process.stdout.write(JSON.stringify({error:error.message}))));}
module.exports={runCollector};
