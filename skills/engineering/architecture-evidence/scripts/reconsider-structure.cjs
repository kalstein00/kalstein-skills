'use strict';
const {GROUPS}=require('./ranking.cjs');
const named=value=>typeof value==='string'&&value.trim().length>0;
const ids=value=>Array.isArray(value)&&value.every(named)&&new Set(value).size===value.length;
function reconsiderStructure(baseline,current){
  const reasons=[],diagnostics=[];
  if(baseline?.schemaVersion!==1||current?.schemaVersion!==1)return {status:'review-needed',reasons,diagnostics:['structural baseline schema missing or unsupported']};
  const a=baseline.reviewedEvidence,b=current.reviewedEvidence;
  const unchanged=['captured-evidence-v1','item-observations-v2'].includes(a?.rule)&&b?.rule===a.rule&&/^sha256:[a-f0-9]{64}$/.test(a.identity)&&a.identity===b.identity;
  const sameObservations=unchanged&&a.rule==='item-observations-v2';
  function pair(name,a,b,valid,compare){
    if(a?.validity==='not-applicable'&&b?.validity==='not-applicable')return;
    if(a?.validity!=='valid'||b?.validity!=='valid'||!valid(a)||!valid(b)){diagnostics.push(name+': missing or incomparable evidence');return;}
    compare(a,b);
  }
  pair('public-surface',baseline.publicSurface,current.publicSurface,x=>named(x.fingerprint),(a,b)=>{if(a.fingerprint!==b.fingerprint)reasons.push('public-surface');});
  for(const name of ['fanIn','fanOut','impact','complexity']){
    pair(name,baseline.percentiles?.[name],current.percentiles?.[name],x=>Number.isFinite(x.value)&&x.value>=0&&x.value<=100&&named(x.cohortKey)&&x.direction==='risk-higher',(a,b)=>{
      if(a.cohortKey!==b.cohortKey)diagnostics.push(name+': comparison cohort/source/unit/direction changed');
      else if(!sameObservations&&b.value-a.value>=10-4*Number.EPSILON*Math.max(10,a.value,b.value))reasons.push('percentile:'+name);
    });
  }
  pair('top-groups',baseline.topGroups,current.topGroups,x=>x.population==='before-suppression'&&ids(x.groups)&&x.groups.every(g=>GROUPS.includes(g)),(a,b)=>{for(const group of b.groups)if(group!=='history'&&!sameObservations&&!a.groups.includes(group))reasons.push('top-group:'+group);});
  for(const [field,label] of [['cycles','new-cycle'],['violations','new-violation']])pair(field,baseline[field],current[field],x=>ids(x.ids),(a,b)=>{for(const id of b.ids)if(!a.ids.includes(id))reasons.push(label+':'+id);});
  // Positive observations can establish a new cycle even when unresolved imports
  // prevent a complete absence claim. Legacy baselines are not backfilled.
  for(const [field,label] of [['observedCycles','observed-cycle'],['observedViolations','observed-violation']]){
    if(baseline[field]||current[field])pair(label,baseline[field],current[field],x=>ids(x.ids),(a,b)=>{for(const id of b.ids)if(!a.ids.includes(id))reasons.push(label+':'+id);});
  }
  for(const [field,label] of [['ownershipIdentity','ownership-changed'],['metricSchemaIdentity','metric-schema-changed']]){
    if(!named(baseline[field])||!named(current[field]))diagnostics.push(field+': missing comparison identity');
    else if(baseline[field]!==current[field])reasons.push(label);
  }
  return {status:reasons.length?'reopen':diagnostics.length&&!unchanged?'review-needed':'suppressed',reasons:reasons.sort(),diagnostics:diagnostics.sort(),
    ...(!reasons.length&&unchanged?{basis:'unchanged-reviewed-evidence'}:{})};
}
module.exports={reconsiderStructure};
