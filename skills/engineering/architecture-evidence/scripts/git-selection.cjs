'use strict';
const {execFileSync}=require('node:child_process');
const {fingerprint}=require('./schema.cjs');
function selectGitCommits(root,{excludeAuthorEmails=[],timeoutMs=30000}={}) {
  if(!Array.isArray(excludeAuthorEmails)||excludeAuthorEmails.some(e=>typeof e!=='string'||!e.trim())||!Number.isSafeInteger(timeoutMs)||timeoutMs<1) throw new Error('invalid Git selection config');
  const config={schemaVersion:1,limit:500,order:'committer-time-desc,object-id-asc',ancestry:'all-parents',excludeAuthorEmails:[...new Set(excludeAuthorEmails)].sort()};
  const git=args=>execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:'utf8',windowsHide:true,timeout:timeoutMs,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
  try {
    const version=git(['--version']).trim(),head=git(['rev-parse','--verify','HEAD^{commit}']).trim();
    const shallow=git(['rev-parse','--is-shallow-repository']).trim()==='true';
    const parts=git(['log','--full-history','--format=%H%x00%ct%x00%P%x00%ae','-z',head,'--']).split('\0');
    if(parts.at(-1)==='') parts.pop(); if(parts.length%4) throw new Error('unsupported Git log record');
    const records=[];
    for(let i=0;i<parts.length;i+=4) {
      const [id,time,parents,email]=parts.slice(i,i+4);
      if(!/^[a-f0-9]{40,64}$/.test(id)||!/^\d+$/.test(time)) throw new Error('invalid Git log identity/time');
      records.push({id,committerTime:Number(time),parents:parents?parents.split(' '):[],authorEmail:email});
    }
    if(shallow) for(const record of records) if(!record.parents.length) {
      const header=git(['cat-file','commit',record.id]).split('\n\n',1)[0];
      record.parents=[...header.matchAll(/^parent ([a-f0-9]{40,64})$/gm)].map(m=>m[1]);
    }
    records.sort((a,b)=>b.committerTime-a.committerTime||(a.id<b.id?-1:a.id>b.id?1:0));
    const excludedMerges=records.filter(c=>c.parents.length>1).map(c=>c.id);
    const excludedAuthors=records.filter(c=>c.parents.length<=1&&config.excludeAuthorEmails.includes(c.authorEmail)).map(c=>c.id);
    const eligible=records.filter(c=>c.parents.length<=1&&!config.excludeAuthorEmails.includes(c.authorEmail));
    const commits=eligible.slice(0,config.limit),shortHistory=commits.length<config.limit;
    const report={schemaVersion:1,status:shallow||shortHistory?'partial':'complete',head,version,config,commits,sampleSize:commits.length,reachableCount:records.length,eligibleCount:eligible.length,excludedMerges,excludedAuthors,shallow,shortHistory,historyCompleteness:shallow?'shallow-boundary':'complete-reachable-ancestry',mergeOnlyResolution:{validity:'unavailable',reason:'Merge commits are excluded; changes present only in merge resolution are not measured.'},recovery:shallow?'Fetch full history (git fetch --unshallow) and rerun.':shortHistory?'Use actual sample size; this repository has fewer than 500 eligible reachable commits.':null};
    if(git(['rev-parse','--verify','HEAD^{commit}']).trim()!==head) throw new Error('HEAD changed during history collection');
    return {id:fingerprint(report),...report};
  } catch(error) {return {status:'blocked',reason:error.code==='ETIMEDOUT'?'Git selection timed out':String(error.stderr||error.message).trim(),recovery:'Verify Git executable, repository HEAD and object availability, then rerun selection.',config};}
}
module.exports = { selectGitCommits };
