'use strict';
const {execFileSync}=require('node:child_process');
const {fingerprint}=require('./schema.cjs');
const isHead=value=>typeof value==='string'&&/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
function reconsiderHistory(root,baselineHead,selection,{timeoutMs=30000}={}){
  const failure=reason=>({status:'review-needed',baselineHead,currentHead:selection?.head||null,count:null,commits:[],reason,recovery:'Restore/fetch full baseline ancestry, rerun Git selection, then explicitly re-review if history was rewritten; do not reset the ledger baseline automatically.'});
  if(!isHead(baselineHead)||!isHead(selection?.head)||!['complete','partial'].includes(selection?.status)||!Number.isSafeInteger(timeoutMs)||timeoutMs<1)return failure('invalid baseline or Git selection');
  const git=args=>execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:'utf8',windowsHide:true,timeout:timeoutMs,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']}).trim();
  try{
    if(selection.shallow||git(['rev-parse','--is-shallow-repository'])==='true')return failure('shallow ancestry cannot establish elapsed history');
    const head=selection.head;if(git(['rev-parse','--verify','HEAD^{commit}'])!==head)return failure('HEAD changed since Git selection');
    git(['cat-file','-e',baselineHead+'^{commit}']);
    try{git(['merge-base','--is-ancestor',baselineHead,head]);}catch(error){if(error.status===1)return failure('baseline is not an ancestor: rewritten or unrelated history');throw error;}
    const text=git(['rev-list','--reverse','--topo-order','--no-merges',head,'^'+baselineHead,'--']);
    const commits=text?text.split('\n'):[];
    if(commits.some(c=>!isHead(c))||new Set(commits).size!==commits.length)throw new Error('invalid ancestry commit list');
    if(git(['rev-parse','--verify','HEAD^{commit}'])!==head)return failure('HEAD changed during elapsed history collection');
    const result={schemaVersion:1,status:commits.length>=250?'reopen':'suppressed',baselineHead,currentHead:head,count:commits.length,commits,order:'oldest-first-topological',threshold:250,reason:commits.length>=250?'250 newly reachable non-merge commits reached':'fewer than 250 newly reachable non-merge commits',recovery:null};
    return {id:fingerprint(result),...result};
  }catch(error){return failure(error.code==='ETIMEDOUT'?'elapsed history timed out':String(error.stderr||error.message).trim());}
}
module.exports={reconsiderHistory};
