'use strict';
const LEDGER_PATH='.agents/architecture-evidence/ledger.json',RAW_ROOT='.codex/tmp/architecture-evidence';
const fs=require('node:fs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {canonicalJson,fingerprint,evidenceItems}=require('./schema.cjs');
function validateLedger(data){
  if(data?.schemaVersion!==1||!Array.isArray(data.entries)||Object.keys(data).some(k=>!['schemaVersion','entries'].includes(k)))throw new Error('ledger: expected schemaVersion1/entries');
  const entries=data.entries.map((entry,i)=>{
    const at='entries['+i+']';
    if(!entry||Object.keys(entry).some(k=>!['id','identity','disposition','reason','snapshot','candidateRef'].includes(k)))throw new Error(at+': unknown entry field');
    const normalized=evidenceItems([entry.identity])[0];
    if(entry.id!==normalized.id||!['accepted','rejected','deferred'].includes(entry.disposition)||typeof entry.reason!=='string'||!entry.reason.trim())throw new Error(at+': id/disposition/reason invalid');
    if(!entry.snapshot||typeof entry.snapshot.id!=='string'||!entry.snapshot.id.trim()||typeof entry.snapshot.head!=='string'||!/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(entry.snapshot.head)||!entry.snapshot.baseline||Object.getPrototypeOf(entry.snapshot.baseline)!==Object.prototype||Object.keys(entry.snapshot).some(k=>!['id','head','baseline'].includes(k)))throw new Error(at+'.snapshot: id/head/baseline required');
    if(entry.candidateRef!==null&&(typeof entry.candidateRef!=='string'||!entry.candidateRef.trim()))throw new Error(at+'.candidateRef: explicit reference or null required');
    return {...entry,identity:normalized.identity};
  }).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('ledger: duplicate evidence ID');
  return JSON.parse(canonicalJson({schemaVersion:1,entries}));
}
const failure=(file,phase,error)=>({status:'blocked',path:file,phase,reason:error.message,recovery:'Preserve the original ledger; inspect the named field/path or active lock, repair explicitly, then retry with freshly read identity.'});
function readLedger(root,io=fs){
  const file=path.resolve(root,LEDGER_PATH);
  try {let bytes;try{bytes=io.readFileSync(file,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;bytes=null;}
    const data=validateLedger(bytes===null?{schemaVersion:1,entries:[]}:JSON.parse(bytes));
    return {status:'complete',path:file,exists:bytes!==null,identity:fingerprint(bytes),data};
  }catch(error){return failure(file,'read/validate',error);}
}
function recordDisposition(root,entry,{expectedIdentity,io=fs}={}){
  const file=path.resolve(root,LEDGER_PATH),lock=file+'.lock',temp=file+'.'+randomUUID()+'.tmp';let lockFd,tempFd,tempCreated=false,phase='validate',result;
  try {
    const checked=validateLedger({schemaVersion:1,entries:[entry]}).entries[0];
    if(typeof expectedIdentity!=='string'||!expectedIdentity)throw new Error('expected ledger identity required');
    phase='lock';io.mkdirSync(path.dirname(file),{recursive:true});lockFd=io.openSync(lock,'wx');
    phase='read';const current=readLedger(root,io);if(current.status!=='complete')throw new Error(current.reason);
    if(current.identity!==expectedIdentity)throw new Error('ledger changed since read');
    const data=validateLedger({schemaVersion:1,entries:[...current.data.entries.filter(e=>e.id!==checked.id),checked]});
    if(canonicalJson(data)===canonicalJson(current.data))return result={...current,changed:false};
    const bytes=JSON.stringify(data,null,2)+'\n';phase='write';tempFd=io.openSync(temp,'wx');tempCreated=true;io.writeFileSync(tempFd,bytes,'utf8');io.fsyncSync(tempFd);io.closeSync(tempFd);tempFd=undefined;
    if(readLedger(root,io).identity!==current.identity)throw new Error('ledger changed while preparing write');
    phase='replace';io.renameSync(temp,file);tempCreated=false;
    return result={status:'complete',path:file,exists:true,identity:fingerprint(bytes),data,changed:true};
  }catch(error){return result=failure(file,phase,error);}
  finally {
    const cleanup=[()=>{if(tempFd!==undefined)io.closeSync(tempFd);},()=>{if(tempCreated)io.unlinkSync(temp);},()=>{if(lockFd!==undefined){io.closeSync(lockFd);io.unlinkSync(lock);}}];
    for(const action of cleanup)try{action();}catch(error){if(result){result.cleanupFailure={reason:error.message,recovery:'Inspect and remove only this writer temporary/lock files after confirming no writer is active.'};if(result.status==='complete')result.status='partial';}}
  }
}
function acceptedEligibility(ledger,id){if(ledger.status!=='complete')return {eligible:false,reason:'ledger unavailable'};return ledger.data.entries.some(e=>e.id===id&&e.disposition==='accepted')?{eligible:false,reason:'accepted duplicate'}:{eligible:null,reason:'not accepted; remaining disposition policies required'};}
module.exports={LEDGER_PATH,RAW_ROOT,readLedger,recordDisposition,acceptedEligibility};
