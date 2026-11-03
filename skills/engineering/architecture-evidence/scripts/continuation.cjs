'use strict';
const {fingerprint}=require('./schema.cjs');
const {selectEvidence}=require('./selection.cjs');
const text=value=>typeof value==='string'&&value.trim();
function coordinateBatch({snapshotId,ledger,ranking,eligibility,decisions={},continuation=null}){
  const fail=(status,reason)=>({status,reason,recovery:'Reread valid ledger and snapshot; restart scan without continuation. Advance only after explicitly reviewing the offered batch.'});
  if(!text(snapshotId)||ledger?.status!=='complete'||!text(ledger.identity))return fail('blocked','valid snapshot and ledger required');
  try{
    const entries=new Map(ledger.data.entries.map(e=>[e.id,e]));
    const states=eligibility.map(row=>{
      const entry=entries.get(row.priorId??row.id);
      if(row.priorId&&!entry)throw new Error('confirmed prior ID missing from ledger');
      if(!row.eligible)return {...row};
      if(entry?.disposition==='accepted')return {...row,eligible:false,reason:'accepted duplicate'};
      if(entry?.disposition==='rejected'){
        const decision=decisions[row.id]||{},statuses=[decision.structure?.status,decision.history?.status];
        if(statuses.includes('reopen'))return {...row,review:'reopen',decision};
        if(statuses.every(s=>s==='suppressed'))return {...row,eligible:false,reason:'rejected suppression',decision};
        return {...row,eligible:false,review:'review-needed',decision,reason:'rejected comparison unavailable'};
      }
      return {...row};
    }).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
    const populationIdentity=fingerprint({ranking,states});let reviewed=[];
    if(continuation!==null){
      const {id,...token}=continuation;
      if(Object.keys(token).sort().join(',')!=='ledgerIdentity,populationIdentity,reviewed,schemaVersion,snapshotId'||token.schemaVersion!==1||token.snapshotId!==snapshotId||token.ledgerIdentity!==ledger.identity||token.populationIdentity!==populationIdentity||fingerprint(token)!==id)return fail('invalid-continuation','snapshot, ledger, population or token identity mismatch');
      if(!Array.isArray(token.reviewed)||token.reviewed.some(id=>!text(id)||!states.some(s=>s.id===id))||new Set(token.reviewed).size!==token.reviewed.length)return fail('invalid-continuation','invalid reviewed IDs');
      reviewed=token.reviewed;
    }
    const consumed=new Set(reviewed),effective=states.map(row=>consumed.has(row.id)?{...row,eligible:false,reason:'reviewed in explicit continuation'}:row);
    const selection=selectEvidence(ranking,effective);
    for(const row of selection.selected)consumed.add(row.id);
    const token={schemaVersion:1,snapshotId,ledgerIdentity:ledger.identity,populationIdentity,reviewed:[...consumed].sort()};
    return {status:selection.selected.length?'batch':'exhausted',snapshotId,ledgerIdentity:ledger.identity,eligibility:effective,
      comparisonDiagnostics:states.filter(row=>row.review==='review-needed'),selection,next:selection.selected.length?{id:fingerprint(token),...token}:null};
  }catch(error){return fail(continuation!==null?'invalid-continuation':'blocked',error.message);}
}
module.exports={coordinateBatch};
