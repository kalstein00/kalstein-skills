'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {selectGitCommits}=require('./git-selection.cjs');
function repo(t) {
  const temp=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temp,'dart-git-selection-'));
  t.after(()=>{assert.equal(path.dirname(path.resolve(root)),temp);assert.ok(path.basename(root).startsWith('dart-git-selection-'));fs.rmSync(root,{recursive:true,force:true});});
  const git=(args,options={})=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,...options}).trim();
  git(['init','-q','-b','main']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
  const tree=git(['write-tree']);
  const commit=(parents,time,message,email='fixture@example.invalid')=>git(['commit-tree',tree,...parents.flatMap(p=>['-p',p]),'-m',message],{env:{...process.env,GIT_AUTHOR_DATE:time+' +0000',GIT_COMMITTER_DATE:time+' +0000',GIT_AUTHOR_EMAIL:email}});
  return {root,git,commit};
}
test('all-parent ancestry includes side commits and root, excludes merge, and explicitly filters bots',t=>{
  const {root,git,commit}=repo(t);
  const a=commit([],1700000000,'root'),b=commit([a],1700000010,'main'),c=commit([a],1700000010,'side','bot@example.invalid'),merge=commit([b,c],1700000020,'merge');
  git(['update-ref','refs/heads/main',merge]);
  const result=selectGitCommits(root);
  assert.deepEqual(result.commits.map(c=>c.id),[b,c].sort().concat(a));
  assert.deepEqual(result.excludedMerges,[merge]);
  assert.equal(result.sampleSize,3);assert.equal(result.shortHistory,true);
  assert.deepEqual(result,selectGitCommits(root));
  assert.deepEqual(selectGitCommits(root,{excludeAuthorEmails:['bot@example.invalid']}).commits.map(c=>c.id),[b,a]);
});
test('a shallow boundary merge cannot masquerade as a root non-merge commit',t=>{
  const {root,git,commit}=repo(t);
  const a=commit([],1700000000,'root'),b=commit([a],1700000010,'left'),c=commit([a],1700000011,'right'),merge=commit([b,c],1700000020,'merge');
  git(['update-ref','refs/heads/main',merge]);
  const clone=path.join(root,'shallow-merge');git(['clone','-q','--depth','1',require('node:url').pathToFileURL(root).href,clone]);
  const result=selectGitCommits(clone);
  assert.equal(result.shallow,true);assert.deepEqual(result.commits,[]);assert.deepEqual(result.excludedMerges,[merge]);
});
test('501 commits select exactly 500; shallow clone and process errors remain explicit',t=>{
  const {root,git}=repo(t);
  const input=Array.from({length:501},(_,i)=>'commit refs/heads/main\ncommitter Fixture <fixture@example.invalid> '+(1700000000+i)+' +0000\ndata 1\nx\n\n').join('');
  git(['fast-import','--quiet'],{input});
  const expected=git(['rev-list','HEAD']).split('\n').slice(0,500);
  const result=selectGitCommits(root);
  assert.equal(result.status,'complete');assert.deepEqual(result.commits.map(c=>c.id),expected);
  assert.deepEqual(result,selectGitCommits(root));
  const clone=path.join(root,'shallow');
  git(['clone','-q','--depth','2',require('node:url').pathToFileURL(root).href,clone]);
  const partial=selectGitCommits(clone);
  assert.equal(partial.shallow,true);assert.equal(partial.sampleSize,2);assert.match(partial.recovery,/unshallow/);
  assert.equal(selectGitCommits(path.join(root,'missing')).status,'blocked');
  assert.equal(selectGitCommits(root,{timeoutMs:1}).status,'blocked');
});
test('actual squash and rebase contribute only the commits reachable from current HEAD',t=>{
  const {root,git}=repo(t);
  const save=(name)=>{fs.writeFileSync(path.join(root,name+'.ts'),'export const '+name+' = 1;\n');git(['add','.']);git(['-c','commit.gpgSign=false','commit','-qm',name]);return git(['rev-parse','HEAD']);};
  const rootCommit=save('root');git(['checkout','-qb','squash-topic']);const original=save('topic');
  git(['checkout','-q','main']);git(['merge','--squash','squash-topic']);git(['-c','commit.gpgSign=false','commit','-qm','squashed']);const squash=git(['rev-parse','HEAD']);
  git(['checkout','-qb','rebase-topic']);const before=save('rebased');git(['checkout','-q','main']);save('main');
  git(['rebase','main','rebase-topic']);const after=git(['rev-parse','HEAD']);
  const result=selectGitCommits(root),ids=result.commits.map(c=>c.id);
  assert.notEqual(before,after);for(const id of [rootCommit,squash,after]) assert.ok(ids.includes(id));
  for(const id of [original,before]) assert.ok(!ids.includes(id));
  assert.ok(result.commits.every(c=>c.parents.length<=1));
});
