'use strict';
const {metricRecord,canonicalJson,fingerprint}=require('./schema.cjs');
const compare=(a,b)=>a<b?-1:a>b?1:0;
const GROUPS=['structure','coupling','size','interface','history','test-linkage'];
const GROUP_METRICS={structure:['cycleSize','layerViolation'],coupling:['fanIn','fanOut','impact','crossOwnerOut'],size:['loc','functionLength','complexity','topLevelComplexity'],interface:['exportSurface'],history:['changeFrequency','churn','coChangeSupport'],'test-linkage':['staticTestLinkage:unit','staticTestLinkage:integration','staticTestLinkage:e2e','runtimeCoverage']};
function rankMetrics(input) {
  const normalized=input.map(metricRecord).sort((a,b)=>compare(a.itemId,b.itemId)||compare(a.name,b.name)||compare(a.cohort,b.cohort));
  const keys=new Set(),cohorts=new Map();
  for(const metric of normalized) {
    if(!/^[^:]+:(file|symbol|cluster|violation)$/.test(metric.cohort)) throw new Error('expected fixed language:item-kind cohort');
    const key=canonicalJson([metric.itemId,metric.name,metric.cohort]);if(keys.has(key)) throw new Error('duplicate item metric');keys.add(key);
    const cohortKey=canonicalJson([metric.name,metric.cohort,metric.unit,metric.direction,metric.source]);
    const rows=cohorts.get(cohortKey)||[];rows.push(metric);cohorts.set(cohortKey,rows);
  }
  const ranked=[];
  for(const [cohortKey,rows]of cohorts) {
    const valid=rows.filter(m=>m.validity==='valid');
    const counts=new Map();for(const m of valid){const risk=m.direction==='higher'?m.value:-m.value;counts.set(risk,(counts.get(risk)||0)+1);}
    const percentiles=new Map();let lower=0;
    for(const [risk,equal]of [...counts].sort((a,b)=>a[0]-b[0])) {percentiles.set(risk,100*(lower+(equal-1)/2)/(valid.length-1));lower+=equal;}
    for(const metric of rows) {
      const risk=metric.direction==='higher'?metric.value:-metric.value;
      const percentile=valid.length<3||metric.validity!=='valid'?null:percentiles.get(risk);
      ranked.push({...metric,cohortKey,observedPopulation:rows.length,validPopulation:valid.length,percentile,rankValidity:percentile===null?'unavailable':'valid',...(percentile===null?{rankReason:metric.validity!=='valid'?metric.reason:'fewer than 3 valid comparable samples'}:{})});
    }
  }
  const metrics=ranked.sort((a,b)=>compare(a.itemId,b.itemId)||compare(a.name,b.name)||compare(a.cohort,b.cohort));
  const groups=GROUPS.map(name=> {
    const byItem=new Map();
    for(const metric of metrics.filter(m=>m.rankValidity==='valid'&&GROUP_METRICS[name].includes(m.name))) {
      const row=byItem.get(metric.itemId)||{id:metric.itemId,percentile:0,signals:[]};
      row.percentile=Math.max(row.percentile,metric.percentile);row.signals.push({name:metric.name,cohort:metric.cohort,percentile:metric.percentile,source:metric.source});byItem.set(row.id,row);
    }
    return {name,items:[...byItem.values()].sort((a,b)=>b.percentile-a.percentile||compare(a.id,b.id)).map((row,i)=>({...row,rank:i+1,reason:'maximum within-group metric percentile, then ID ascending'}))};
  });
  const overlap=new Map();for(const group of groups)for(const item of group.items.slice(0,5)){const row=overlap.get(item.id)||{id:item.id,groups:[]};row.groups.push(group.name);overlap.set(item.id,row);}
  return {schemaVersion:1,rules:'midrank-risk-percentile-v1:min3',inputIdentity:fingerprint(normalized),metrics,groups,overlap:[...overlap.values()].sort((a,b)=>compare(a.id,b.id)),ungrouped:metrics.filter(m=>!Object.values(GROUP_METRICS).some(names=>names.includes(m.name))).map(m=>({itemId:m.itemId,name:m.name,reason:'metric not assigned to a v1 signal group'}))};
}
module.exports={rankMetrics,GROUPS};
