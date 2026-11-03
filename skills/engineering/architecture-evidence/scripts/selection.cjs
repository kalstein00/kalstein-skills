'use strict';
const {GROUPS}=require('./ranking.cjs');
const compare=(a,b)=>a<b?-1:a>b?1:0;
function selectEvidence(ranking,eligibility) {
  const states=new Map();
  for(const state of eligibility) {
    if(!state.id||typeof state.eligible!=='boolean'||states.has(state.id)) throw new Error('unique explicit eligibility required');
    if(state.eligible&&(!Array.isArray(state.owners)||!state.owners.length||state.owners.some(o=>typeof o!=='string'||!o.trim()))) throw new Error('all owners required for eligible item');
    if(!state.eligible&&!state.reason) throw new Error('ineligible reason required');
    states.set(state.id,{...state,owners:[...new Set(state.owners||[])].sort()});
  }
  if(ranking.groups.some(g=>!GROUPS.includes(g.name))||new Set(ranking.groups.map(g=>g.name)).size!==ranking.groups.length) throw new Error('unique v1 signal groups required');
  const allIds=new Set(states.keys()),rankedIds=new Set(),candidates=new Map();
  for(const metric of ranking.metrics||[]) allIds.add(metric.itemId);
  const groups=GROUPS.map(name=> {
    const rows=ranking.groups.find(g=>g.name===name)?.items||[];
    if(new Set(rows.map(r=>r.id)).size!==rows.length||rows.some(r=>!r.id||!Number.isFinite(r.percentile)||r.percentile<0||r.percentile>100)) throw new Error('unique finite ranked group items required');
    for(const row of rows) {allIds.add(row.id);rankedIds.add(row.id);}
    const top=rows.filter(r=>states.get(r.id)?.eligible).sort((a,b)=>b.percentile-a.percentile||compare(a.id,b.id)).slice(0,5);
    for(const row of top) {const item=candidates.get(row.id)||{id:row.id,owners:states.get(row.id).owners,groups:[],bestPercentile:0};item.groups.push(name);item.bestPercentile=Math.max(item.bestPercentile,row.percentile);candidates.set(row.id,item);}
    return {name,ids:top.map(r=>r.id)};
  });
  const selected=[],selectedIds=new Set(),usage=new Map(),quotaReasons=new Map(),representatives=[];
  function choose(id,phase) {
    if(selectedIds.has(id)) return 'already selected';
    const item=candidates.get(id),blockedOwners=item.owners.filter(owner=>(usage.get(owner)||0)>=3);
    const reason=selected.length>=20?'total cap':blockedOwners.length?'owner cap':null;
    if(reason) {quotaReasons.set(id,{reason,...(blockedOwners.length?{blockedOwners}:{})});return reason;}
    const signalContext=item.groups.every(g=>['size','interface'].includes(g))?'shape-only':item.groups.length>1?'multiple-signal-groups':'single-signal-group';
    selected.push({...item,phase,signalContext});selectedIds.add(id);for(const owner of item.owners)usage.set(owner,(usage.get(owner)||0)+1);return 'selected';
  }
  for(const group of groups)for(const id of group.ids) {
    const status=choose(id,'representative');representatives.push({group:group.name,id,status});
    if(status==='selected'||status==='already selected') break;
  }
  const fill=[...candidates.values()].sort((a,b)=>b.groups.length-a.groups.length||b.bestPercentile-a.bestPercentile||compare(a.id,b.id));
  for(const item of fill) choose(item.id,'overlap-fill');
  const excluded=[...allIds].sort().filter(id=>!selectedIds.has(id)).map(id=>({id,...(quotaReasons.get(id)||{reason:!states.has(id)?'missing eligibility':!states.get(id).eligible?states.get(id).reason:!rankedIds.has(id)?'no ranked metric':'outside eligible group Top5'})}));
  return {schemaVersion:2,rules:'eligible-top5-total20-owner3-v2',selected,excluded,groups,representatives,ownerUsage:Object.fromEntries([...usage].sort((a,b)=>compare(a[0],b[0])))};
}
module.exports={selectEvidence};
