'use strict';
const {sourcePath,evidenceId,fingerprint}=require('./schema.cjs');
// Item-local observed evidence; no claim about unmeasured dependencies. Ranking
// populations and Git history cannot invalidate an unchanged structural review.
function reviewedEvidence(state,{config,ownership,metricSchema,metrics,structure,surface,ast,coupling}){
  const files=new Map(state.inventory.entries.filter(e=>e.role==='production').map(e=>[evidenceId({kind:'file',path:e.path}),e]));
  const declarations=new Map((surface?.files||[]).map(f=>[f.path,{validity:f.validity,fingerprint:f.fingerprint??null}]));
  const observations=new Map(),relations=new Map();
  for(const {itemId,name,value,unit,direction,source,cohort,validity,reason} of metrics){
    if(['changeFrequency','churn','coChangeSupport'].includes(name))continue;
    const rows=observations.get(itemId)||[];rows.push({name,value,unit,direction,source,cohort,validity,reason:reason??null});observations.set(itemId,rows);
  }
  for(const entry of [...(structure?.clusters||[]),...(structure?.violations||[])]){
    const ids=entry.identity.kind==='cluster'?entry.identity.members:[entry.identity.source,entry.identity.target];
    // SCC source is the whole-graph snapshot ID. Local edges retain their own
    // provenance; unrelated graph bytes must not change this comparison.
    const {source,...localCluster}=entry,observed=entry.identity.kind==='cluster'?localCluster:entry;
    for(const id of [entry.id,...ids]){const rows=relations.get(id)||[];rows.push(observed);relations.set(id,rows);}
  }
  const environment=fingerprint({config,ownership,metricSchema,tools:state.tools,
    collectors:[ast,surface,structure,coupling].map(c=>c?{status:c.status,gaps:c.gaps??[],diagnostics:c.diagnostics??[]}:null)});
  return item=>{
    const i=item.identity,ids=i.path?[evidenceId({kind:'file',path:i.path})]:i.kind==='cluster'?i.members:[i.source,i.target];
    const entries=ids.map(id=>files.get(id));
    if(entries.some(e=>!e?.fingerprint)||state.inventory.counts.failed)return null;
    return {rule:'item-observations-v2',identity:fingerprint({environment,identity:i,
      files:entries.map(e=>({path:e.path,fingerprint:e.fingerprint,declaration:declarations.get(e.path)??null})),
      observations:observations.get(item.id)??[],relations:[...new Map([item.id,...ids].flatMap(id=>relations.get(id)||[]).map(e=>[e.id,e])).values()]})};
  };
}
function validateConfig(config){
  const keys=['scopes','ownershipMapPath','impactDepth','timeoutMs','excludeAuthorEmails','coChangeMinSupport','mechanicalThreshold','mechanicalCommitIds','surfaceProjects','collectorHeapMb','dependencyCruiser'];
  if(!config||Array.isArray(config)||typeof config!=='object'||Object.keys(config).some(k=>!keys.includes(k))||!Number.isSafeInteger(config.timeoutMs??120000)||(config.timeoutMs??120000)<1)throw new Error('invalid scan config');
  if(config.dependencyCruiser){const d=config.dependencyCruiser;
    if(Object.keys(d).some(k=>!['root','configPath','targets'].includes(k))||!d.configPath||!Array.isArray(d.targets)||!d.targets.length)throw new Error('dependencyCruiser requires configPath and targets');
    sourcePath(d.configPath);if(d.root)sourcePath(d.root);d.targets.forEach(sourcePath);
  }
  const heap=config.collectorHeapMb??1024;if(!Number.isSafeInteger(heap)||heap<256||heap>4096)throw new Error('collectorHeapMb must be 256..4096');
  const projects=config.surfaceProjects??[];if(!Array.isArray(projects)||new Set(projects.map(sourcePath)).size!==projects.length)throw new Error('unique surfaceProjects required');
}
function metricRequirements(items,{graph,ast,pressure}){
  const graphIds=new Set([...(graph?.nodes||[]).map(i=>i.id),...(graph?.files||[]).map(f=>evidenceId({kind:'file',path:f.path}))]);
  const astIds=new Set((ast?.items||[]).map(i=>i.id)),historyIds=new Set([...(pressure?.files||[]).map(f=>evidenceId({kind:'file',path:f.path})),...(pressure?.metrics||[]).map(m=>m.itemId)]);
  const coupling=['fanIn','fanOut','impact','crossOwnerOut','staticTestLinkage:unit','staticTestLinkage:integration','staticTestLinkage:e2e'],required=new Set(),unsupported=[];
  const add=(id,name,applies,reason)=>applies?required.add(id+'|'+name):unsupported.push({itemId:id,name,status:'unsupported',reason});
  for(const {id,identity:i} of items){
    if(i.kind==='cluster'){add(id,'cycleSize',true);continue;}if(i.kind==='violation'){add(id,'layerViolation',true);continue;}
    if(i.kind==='file'){
      for(const name of ['loc','topLevelComplexity'])add(id,name,/\.(?:[cm]?[tj]s|[tj]sx)$/.test(i.path),'AST collector supports TS/JS only');
      add(id,'exportSurface',/\.(?:[cm]?ts|tsx)$/.test(i.path)&&! /\.d\.[cm]?ts$/.test(i.path),'TypeScript emitted source declarations only');
      for(const name of ['changeFrequency','churn','coChangeSupport'])add(id,name,historyIds.has(id),'No selected-history file record; not a measured zero');
    }else if(astIds.has(id))for(const name of ['complexity','functionLength'])add(id,name,true);
    for(const name of coupling)add(id,name,graphIds.has(id),'Item is not in the normalized graph');
  }
  return {required,unsupported};
}
function compactCollector(result){const {metrics,sources,...rest}=result;if(rest.files)rest.files=rest.files.map(({metric,...file})=>file);return rest;}
module.exports={validateConfig,metricRequirements,compactCollector,reviewedEvidence};
