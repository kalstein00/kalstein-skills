'use strict';
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const {sourcePath,evidenceId,metricRecord,fingerprint}=require('./schema.cjs');
const {classifyPath}=require('./inventory.cjs');
function collectGitPressure(root,selection,{coChangeMinSupport=3,mechanicalThreshold=100,mechanicalCommitIds=[],timeoutMs=30000}={}) {
  if(![coChangeMinSupport,mechanicalThreshold,timeoutMs].every(n=>Number.isSafeInteger(n)&&n>0)||!Array.isArray(mechanicalCommitIds)) throw new Error('invalid pressure config');
  const config={schemaVersion:1,rename:'50%,unlimited-candidates',diff:'myers,no-indent-heuristic,no-textconv',coChangeAggregation:'max-eligible-pair-support-per-file-v1',coChangeMinSupport,mechanicalThreshold,mechanicalCommitIds:[...new Set(mechanicalCommitIds)].sort()};
  try {
    if(selection.status==='blocked'||selection.shallow) throw new Error('complete reachable history required for diff parents; shallow selection cannot be treated as root diffs');
    if(!selection.id||!Array.isArray(selection.commits)||selection.commits.some(c=>!/^[a-f0-9]{40,64}$/.test(c.id)||!Array.isArray(c.parents)||c.parents.length>1)) throw new Error('non-merge selector output required');
    const info=execFileSync('git',['-C',root,'rev-parse','--git-path','info/attributes'],{encoding:'utf8',windowsHide:true,timeout:timeoutMs,stdio:['ignore','pipe','pipe']}).trim();
    if(fs.existsSync(path.resolve(root,info))&&fs.readFileSync(path.resolve(root,info),'utf8').trim()) throw new Error('Mutable info/attributes is outside the selected snapshot; use a checkout without this override.');
    let driverPolicy='';
    try {driverPolicy=execFileSync('git',['-C',root,'config','--name-only','--get-regexp','^diff\\..*\\.binary$'],{encoding:'utf8',windowsHide:true,timeout:timeoutMs,stdio:['ignore','pipe','pipe']});} catch(error) {if(error.status!==1) throw error;}
    if(driverPolicy.trim()) throw new Error('Mutable diff driver binary policy is outside the selected snapshot; use a checkout/config without this override.');
    const output=selection.commits.length?execFileSync('git',['--no-replace-objects','-C',root,'-c','core.attributesFile=','log','--no-walk=unsorted','--stdin','--format=%x1e%H%x00','--numstat','-z','--root','-M50%','-l0','--diff-algorithm=myers','--no-indent-heuristic','--no-ext-diff','--no-textconv','--no-show-signature','--no-notes'],{input:selection.commits.map(c=>c.id).join('\n')+'\n',encoding:'utf8',windowsHide:true,timeout:timeoutMs,maxBuffer:64*1024*1024,env:{...process.env,GIT_ATTR_SOURCE:selection.head,GIT_ATTR_NOSYSTEM:'1'},stdio:['pipe','pipe','pipe']}):'';
    const records=new Map(),renames=[];let current;
    const tokens=output.split('\0');
    for(let i=0;i<tokens.length;i++) {
      const token=tokens[i].replace(/^\n/,''); if(!token) continue;
      if(/^\x1e[a-f0-9]{40,64}$/.test(token)) {current=token.slice(1);records.set(current,[]);continue;}
      const match=/^(\d+|-)\t(\d+|-)\t([\s\S]*)$/.exec(token);
      if(!current||!match) throw new Error('unsupported numstat record');
      let file=match[3];
      if(!file) {const from=sourcePath(tokens[++i]),to=sourcePath(tokens[++i]);renames.push({commit:current,from,to});file=to;}
      records.get(current).push({path:sourcePath(file),added:match[1]==='-'?null:Number(match[1]),deleted:match[2]==='-'?null:Number(match[2])});
    }
    if(records.size!==selection.commits.length||selection.commits.some(c=>!records.has(c.id))) throw new Error('Git did not return every selected commit');
    const byPath=new Map(),pairs=new Map(),excludedCommits=[],mechanicalCommits=[];
    for(const commit of selection.commits) {
      const changes=records.get(commit.id).filter(c=>classifyPath(c.path).role==='production');
      if(!changes.length) {excludedCommits.push({id:commit.id,reason:'no production changes'});continue;}
      const mechanical=changes.length>=mechanicalThreshold||config.mechanicalCommitIds.includes(commit.id);
      if(mechanical) mechanicalCommits.push({id:commit.id,reason:config.mechanicalCommitIds.includes(commit.id)?'explicit mechanical commit':'production path threshold',pathCount:changes.length});
      for(const change of changes) {
        const file=byPath.get(change.path)||{path:change.path,frequency:0,added:0,deleted:0,churn:0,commits:[]};
        file.frequency++;file.commits.push(commit.id);
        if(change.added===null||file.added===null) file.added=file.deleted=file.churn=null;
        else {file.added+=change.added;file.deleted+=change.deleted;file.churn=file.added+file.deleted;}
        byPath.set(change.path,file);
      }
      if(!mechanical) {const paths=[...new Set(changes.map(c=>c.path))].sort();for(let a=0;a<paths.length;a++)for(let b=a+1;b<paths.length;b++){const key=JSON.stringify([paths[a],paths[b]]);const pair=pairs.get(key)||{paths:[paths[a],paths[b]],commits:[]};pair.commits.push(commit.id);pairs.set(key,pair);}}
    }
    const files=[...byPath.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),coChanges=[...pairs.values()].map(p=>({...p,support:p.commits.length,eligible:p.commits.length>=coChangeMinSupport})).sort((a,b)=>JSON.stringify(a.paths)<JSON.stringify(b.paths)?-1:1);
    const metrics=files.flatMap(file=>Object.entries({changeFrequency:file.frequency,churn:file.churn}).map(([name,value])=>metricRecord({schemaVersion:1,itemId:evidenceId({kind:'file',path:file.path}),name,value,unit:name==='churn'?'lines':'commits',direction:'higher',source:'git-pressure-v1:'+selection.id,cohort:classifyPath(file.path).language+':file',population:files.filter(f=>classifyPath(f.path).language===classifyPath(file.path).language).length,validity:value===null?'unavailable':'valid',...(value===null?{reason:'binary numstat has no line count'}:{})})));
    const support=new Map(files.map(f=>[f.path,0]));
    for(const pair of coChanges)if(pair.eligible)for(const file of pair.paths)support.set(file,Math.max(support.get(file),pair.support));
    metrics.push(...files.map(file=>metricRecord({schemaVersion:1,itemId:evidenceId({kind:'file',path:file.path}),name:'coChangeSupport',value:support.get(file.path),unit:'commits',direction:'higher',source:'git-pressure-v1:'+selection.id+':'+fingerprint(config),cohort:classifyPath(file.path).language+':file',population:files.filter(f=>classifyPath(f.path).language===classifyPath(file.path).language).length,validity:'valid'})));
    const report={status:files.some(f=>f.churn===null)?'partial':selection.status,config,selectionIdentity:selection.id,selectedCommits:selection.commits.map(c=>c.id),historyCompleteness:selection.historyCompleteness,mergeOnlyResolution:selection.mergeOnlyResolution,files,metrics,coChanges,excludedCommits,mechanicalCommits,renames:renames.sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:1)};
    return {id:fingerprint(report),...report};
  } catch(error) {return {status:'blocked',reason:String(error.stderr||error.message).trim(),config,recovery:'Verify selected objects and complete parent history; rerun the same bounded selection/diff. No zero-value fallback.'};}
}
module.exports={collectGitPressure};
