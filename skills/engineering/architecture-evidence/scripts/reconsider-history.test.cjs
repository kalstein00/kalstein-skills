'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {selectGitCommits}=require('./git-selection.cjs');
const {reconsiderHistory}=require('./reconsider-history.cjs');
function repo(t){
  const temp=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temp,'architecture-evidence-history-'));
  t.after(()=>{assert.equal(path.dirname(path.resolve(root)),temp);assert.ok(path.basename(root).startsWith('architecture-evidence-history-'));fs.rmSync(root,{recursive:true,force:true});});
  const git=(args,options={})=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe'],...options}).trim();
  git(['init','-q','-b','main']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
  const tree=git(['write-tree']),commit=(parents,label)=>git(['commit-tree',tree,...parents.flatMap(p=>['-p',p]),'-m',label]);
  return {root,git,commit};
}
test('249 retains, 250 reopens and 600 newly reachable commits exceed the selection window',t=>{
  const {root,git}=repo(t);
  const input=Array.from({length:601},(_,i)=>'commit refs/heads/main\ncommitter Fixture <fixture@example.invalid> '+(1700000000+i)+' +0000\ndata 1\nx\n\n').join('');git(['fast-import','--quiet'],{input});
  const current=selectGitCommits(root);assert.equal(current.commits.length,500);
  for(const n of [249,250,600]){const base=git(['rev-parse','HEAD~'+n]),before=git(['status','--porcelain']);const result=reconsiderHistory(root,base,current);assert.equal(result.count,n);assert.equal(result.status,n<250?'suppressed':'reopen');assert.deepEqual(result,reconsiderHistory(root,base,current));assert.equal(git(['status','--porcelain']),before);}
});
test('all-parent set includes newly merged side ancestry but excludes the merge itself',t=>{
  const {root,git,commit}=repo(t),a=commit([],'root'),b=commit([a],'baseline'),side=commit([a],'side'),m=commit([b,side],'merge');git(['update-ref','refs/heads/main',m]);
  const result=reconsiderHistory(root,b,selectGitCommits(root));assert.equal(result.count,1);assert.deepEqual(result.commits,[side]);
});
test('missing baseline, rewritten ancestry, shallow and stale selection are review-needed with no invented zero',t=>{
  const {root,git,commit}=repo(t),a=commit([],'root'),b=commit([a],'baseline'),rewrite=commit([a],'rewrite');git(['update-ref','refs/heads/main',rewrite]);
  const current=selectGitCommits(root);
  for(const base of [b,'f'.repeat(40)]){const r=reconsiderHistory(root,base,current);assert.equal(r.status,'review-needed');assert.equal(r.count,null);assert.ok(r.recovery);}
  const clone=path.join(root,'shallow');git(['clone','-q','--depth','1',require('node:url').pathToFileURL(root).href,clone]);
  assert.match(reconsiderHistory(clone,a,selectGitCommits(clone)).reason,/shallow/);
  git(['update-ref','refs/heads/main',b]);assert.match(reconsiderHistory(root,a,current).reason,/HEAD/);
  assert.equal(fs.existsSync(path.join(root,'.agents/architecture-evidence/ledger.json')),false);
});
