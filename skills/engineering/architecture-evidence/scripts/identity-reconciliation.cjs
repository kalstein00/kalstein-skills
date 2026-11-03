'use strict';
const {evidenceId,evidenceItems,sourcePath,canonicalJson}=require('./schema.cjs');
const compare=(a,b)=>canonicalJson(a)<canonicalJson(b)?-1:canonicalJson(a)>canonicalJson(b)?1:0;
const isHead=value=>typeof value==='string'&&/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
function reconcileIdentities(ledger,currentItems,options){
  if(ledger.status!=='complete')return {status:'blocked',reason:'valid ledger required'};
  if(typeof options.currentComplete!=='boolean'||!isHead(options.currentHead)||!Array.isArray(options.windows))throw new Error('current HEAD/completeness and baseline windows required');
  const current=currentItems.map(i=>{const normalized=evidenceItems([i.identity])[0];if(i.id!==normalized.id)throw new Error('current identity mismatch');return normalized;}).sort(compare);
  const counts=new Map();for(const i of current)counts.set(i.id,(counts.get(i.id)||0)+1);
  const windows=options.windows.map(w=>{if(!isHead(w.baselineHead)||!isHead(w.currentHead)||typeof w.complete!=='boolean'||!Array.isArray(w.renames))throw new Error('invalid rename window');return {...w,renames:w.renames.map(r=>{if(!isHead(r.commit))throw new Error('rename commit provenance required');return {commit:r.commit,from:sourcePath(r.from),to:sourcePath(r.to)};}).sort(compare)};});
  const mappings=ledger.data.entries.map(entry=>{
    let identity=entry.identity,evidence=[],reason='same typed identity';
    const base={originalId:entry.id,disposition:entry.disposition,entry};
    const unresolved=reason=>({...base,currentId:null,status:'unresolved',reason,renameEvidence:evidence});
    if(['file','symbol'].includes(identity.kind)){
      const matches=windows.filter(w=>w.baselineHead===entry.snapshot.head&&w.currentHead===options.currentHead);
      const window=entry.snapshot.head===options.currentHead?{complete:true,commits:[],renames:[]}:matches.length===1?matches[0]:null;
      if(!window?.complete)return unresolved('missing, ambiguous or incomplete baseline rename window');
      if(!Array.isArray(window.commits)||window.commits.some(c=>!isHead(c))||new Set(window.commits).size!==window.commits.length||window.renames.some(r=>!window.commits.includes(r.commit)))return unresolved('verified chronological commit order required');
      const bySource=new Map(),byTarget=new Map();for(const r of window.renames){const a=bySource.get(r.from)||new Set(),b=byTarget.get(r.to)||new Set();a.add(r.to);b.add(r.from);bySource.set(r.from,a);byTarget.set(r.to,b);}
      let at=identity.path;const seen=new Set([at]);
      for(const commit of window.commits){
        const moves=window.renames.filter(r=>r.commit===commit&&r.from===at);if(!moves.length)continue;
        if(bySource.get(at).size!==1)return unresolved('ambiguous rename branch');
        const next=moves[0].to;if(byTarget.get(next).size!==1)return unresolved('converging rename paths');
        if(seen.has(next))return unresolved('rename cycle or path reuse');seen.add(next);
        evidence.push(...moves);at=next;
      }
      if(at!==identity.path){if(counts.has(entry.id))return unresolved('old identity still present: path reuse or collision');identity={...identity,path:at};reason='confirmed file path rename; exact symbol key preserved';}
    }
    const target=evidenceId(identity),count=counts.get(target)||0;
    if(count>1)return unresolved('current symbol/identity collision');
    if(!count)return {...base,currentId:null,status:options.currentComplete?'retired':'unresolved',reason:options.currentComplete?'typed identity absent; removed or membership/key changed':'current population incomplete',renameEvidence:evidence};
    return {...base,currentId:target,status:target===entry.id?'matched':'renamed',reason,renameEvidence:evidence};
  }).sort((a,b)=>compare(a.originalId,b.originalId));
  const targetCounts=new Map();for(const m of mappings)if(m.currentId)targetCounts.set(m.currentId,(targetCounts.get(m.currentId)||0)+1);
  for(const m of mappings)if(m.currentId&&targetCounts.get(m.currentId)>1){m.proposedId=m.currentId;m.currentId=null;m.status='unresolved';m.reason='multiple ledger entries map to one current identity';}
  const mapped=new Set(mappings.map(m=>m.currentId).filter(Boolean));
  const collisions=[...counts].filter(([,count])=>count>1).map(([id])=>id).sort();
  return {status:collisions.length||mappings.some(m=>m.status==='unresolved')?'partial':'complete',ledgerIdentity:ledger.identity,mappings,collisions,newItems:current.filter(i=>counts.get(i.id)===1&&!mapped.has(i.id))};
}
module.exports={reconcileIdentities};
