'use strict';
const { evidenceId, canonicalJson } = require('./schema.cjs');
const VERSION = 'coupling-paths-v1:limit3';
const compare = (a,b) => a<b?-1:a>b?1:0;
function buildCouplingPaths(report) {
 const graph=report.collectors?.graph,coupling=report.collectors?.coupling;
 const nodes=new Map((graph?.nodes||[]).map(n=>[n.id,n.identity]));
 for(const file of graph?.files||[])nodes.set(evidenceId({kind:'file',path:file.path}),{kind:'file',path:file.path});
 const owners=new Map((coupling?.owners||[]).map(f=>[f.path,f.owner]));
 const confirmed=(coupling?.bindingEvidence?.entries||[]).filter(e=>e.classification==='confirmed'&&['calls','imports','references'].includes(e.edge.kind));
 const projections=new Map();
 function adjacency(kind,incoming){
  const key=kind+incoming;if(projections.has(key))return projections.get(key);
  const map=new Map();
  for(const entry of [...confirmed].sort((a,b)=>compare(canonicalJson(a),canonicalJson(b)))){
   const s=nodes.get(entry.edge.source),t=nodes.get(entry.edge.target);if(!s||!t)continue;
   if(kind==='symbol'&&(s.kind!=='symbol'||t.kind!=='symbol'))continue;
   const id=(original,identity)=>kind==='file'?evidenceId({kind:'file',path:identity.path}):original;
   let source=id(entry.edge.source,s),target=id(entry.edge.target,t);if(source===target)continue;
   if(incoming)[source,target]=[target,source];
   if(!map.has(source))map.set(source,new Map());
   if(!map.get(source).has(target))map.get(source).set(target,entry);
  }
  projections.set(key,map);return map;
 }
 function explain(itemId,metric){
  const base={itemId,name:metric.name,paths:[],omitted:null};
  const absent=reason=>({...base,status:'unavailable',reason});
  if(metric.validity!=='valid'||!Number.isSafeInteger(metric.value)||metric.value<0)return absent(metric.reason||'metric-unavailable');
  const root=nodes.get(itemId);
  if(!root||!coupling?.bindingEvidence||!graph)return absent('path-evidence-unavailable');
  if(!['file','symbol'].includes(root.kind))return absent('unsupported-item-kind');
  const incoming=['fanIn','impact'].includes(metric.name),depth=metric.name==='impact'?coupling.config?.impactDepth:1;
  if(!Number.isSafeInteger(depth)||depth<1||depth>100)return absent('impact-depth-unavailable');
  if(metric.value===0)return {...base,status:'observed-zero',reason:'zero-in-observed-confirmed-subset',omitted:0};
  const map=adjacency(root.kind,incoming),seen=new Set([itemId]),queue=[{nodes:[itemId],edges:[]}],paths=[];
  const wanted=Math.min(3,metric.value);
  for(let i=0;i<queue.length&&paths.length<wanted;i++){
   const current=queue[i],at=current.nodes.at(-1);if(current.edges.length>=depth)continue;
   for(const [neighbor,entry]of [...(map.get(at)||[])].sort(([a],[b])=>compare(a,b))){
    if(seen.has(neighbor))continue;
    if(metric.name==='crossOwnerOut'){
     const a=owners.get(root.path),b=owners.get(nodes.get(neighbor)?.path);
     if(a===undefined||b===undefined)return absent('owner-evidence-unavailable');
     if(a===b)continue;
    }
    seen.add(neighbor);
    const next={nodes:[...current.nodes,neighbor],edges:[...current.edges,entry]};queue.push(next);
    paths.push(incoming?{nodes:[...next.nodes].reverse(),edges:[...next.edges].reverse()}:next);
    if(paths.length===wanted)break;
   }
  }
  if(paths.length!==wanted)return absent('path-evidence-incomplete');
  return {...base,status:'available',reason:metric.value>paths.length?'display-limit':null,paths,omitted:metric.value-paths.length};
 }
 const items=[];
 for(const selected of report.queue?.selection?.selected||[]){
  if(!selected.groups?.includes('coupling'))continue;
  const rank=report.ranking?.groups?.find(g=>g.name==='coupling')?.items?.find(i=>i.id===selected.id);
  for(const signal of rank?.signals||[]){
   if(signal.percentile!==rank.percentile||!Number.isFinite(signal.percentile))continue;
   const metric=report.metrics?.find(m=>m.itemId===selected.id&&m.name===signal.name&&m.source===signal.source&&m.cohort===signal.cohort&&m.percentile===signal.percentile);
   items.push(metric?explain(selected.id,metric):{itemId:selected.id,name:signal.name,status:'unavailable',reason:'matching-metric-unavailable',paths:[],omitted:null});
  }
 }
 return {rules:VERSION,limit:3,items:items.sort((a,b)=>compare(a.itemId,b.itemId)||compare(a.name,b.name))};
}
module.exports = { buildCouplingPaths, VERSION };
