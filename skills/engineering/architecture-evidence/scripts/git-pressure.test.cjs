'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {selectGitCommits}=require('./git-selection.cjs');
const {collectGitPressure}=require('./git-pressure.cjs');
const {evidenceId}=require('./schema.cjs');
const {rankMetrics}=require('./ranking.cjs');
function repo(t) {
  const temp=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temp,'architecture-evidence-git-pressure-'));
  t.after(()=>{assert.equal(path.dirname(path.resolve(root)),temp);assert.ok(path.basename(root).startsWith('architecture-evidence-git-pressure-'));fs.rmSync(root,{recursive:true,force:true});});
  const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();
  git(['init','-q','-b','main']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);git(['config','core.autocrlf','false']);
  const save=files=>{for(const [name,source]of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),source);}git(['add','.']);git(['-c','commit.gpgSign=false','commit','-qm','fixture']);return git(['rev-parse','HEAD']);};
  return {root,git,save};
}
test('eligible pair maximum becomes per-file support without summing peers or mechanical commits',t=>{
  const {root,save}=repo(t);
  save({'a.ts':'1','b.ts':'1','c.ts':'1'});save({'a.ts':'2','b.ts':'2','c.ts':'2'});save({'a.ts':'3','b.ts':'3'});
  const mechanical=save({'a.ts':'4','b.ts':'4','c.ts':'4','d.ts':'4'});
  const selection=selectGitCommits(root),result=collectGitPressure(root,selection,{mechanicalCommitIds:[mechanical]});
  const metrics=result.metrics.filter(m=>m.name==='coChangeSupport');assert.equal(metrics.length,4);
  const values=Object.fromEntries(metrics.map(m=>[m.itemId,m.value]));
  for(const [p,value]of [['a.ts',3],['b.ts',3],['c.ts',0],['d.ts',0]])assert.equal(values[evidenceId({kind:'file',path:p})],value);
  assert.ok(metrics.every(m=>m.unit==='commits'&&m.direction==='higher'&&m.cohort==='typescript:file'&&m.population===4));
  assert.ok(rankMetrics(metrics).groups.find(g=>g.name==='history').items.length===4);
  assert.ok(result.coChanges.every(p=>!p.commits.includes(mechanical)));
  const low=collectGitPressure(root,selection,{coChangeMinSupport:2,mechanicalCommitIds:[mechanical]});
  assert.equal(low.metrics.find(m=>m.name==='coChangeSupport'&&m.itemId===evidenceId({kind:'file',path:'c.ts'})).value,2);
  assert.equal(low.metrics.find(m=>m.name==='coChangeSupport'&&m.itemId===evidenceId({kind:'file',path:'a.ts'})).value,3);
});
test('hand-calculated frequency, additions/deletions and co-change exclude generated-only changes',t=>{
  const {root,save}=repo(t);save({'a.ts':'a\n','b.ts':'b\n'});save({'a.ts':'a\nx\n','b.ts':'b\nx\n'});const generated=save({'generated/x.ts':'ignored\n'});
  const selection=selectGitCommits(root),config={coChangeMinSupport:2,mechanicalThreshold:3};
  const result=collectGitPressure(root,selection,config);
  const a=result.files.find(f=>f.path==='a.ts');
  assert.deepEqual({frequency:a.frequency,added:a.added,deleted:a.deleted,churn:a.churn},{frequency:2,added:2,deleted:0,churn:2});
  assert.equal(result.coChanges[0].support,2);assert.equal(result.coChanges[0].eligible,true);
  assert.ok(result.excludedCommits.some(c=>c.id===generated&&c.reason==='no production changes'));
  assert.deepEqual(result,collectGitPressure(root,selection,config));
});
test('rename provenance, binary unavailability and mechanical co-change exclusion are explicit',t=>{
  const {root,git,save}=repo(t);save({'old.ts':'one\ntwo\n','b.ts':'b\n'});
  git(['mv','old.ts','new.ts']);const renamed=save({});
  save({'binary.ts':Buffer.from([0,1,2,3])});const mechanical=save({'new.ts':'one\ntwo\nthree\n','b.ts':'b\nx\n','c.ts':'c\n'});
  const selection=selectGitCommits(root),result=collectGitPressure(root,selection,{mechanicalThreshold:3,coChangeMinSupport:2});
  assert.ok(result.renames.some(r=>r.commit===renamed&&r.from==='old.ts'&&r.to==='new.ts'));
  assert.equal(result.files.find(f=>f.path==='new.ts').churn,1);
  assert.equal(result.files.find(f=>f.path==='binary.ts').churn,null);
  assert.ok(result.metrics.some(m=>m.name==='churn'&&m.validity==='unavailable'));
  assert.ok(result.mechanicalCommits.some(c=>c.id===mechanical));
  assert.ok(result.coChanges.every(pair=>!pair.commits.includes(mechanical)));
  assert.ok(result.coChanges.every(pair=>!pair.eligible));
});
test('merge contributes no duplicate diff; missing diff objects are blocked',t=>{
  const {root,git,save}=repo(t);save({'a.ts':'a\n'});git(['checkout','-qb','side']);save({'b.ts':'b\n'});git(['checkout','-q','main']);save({'c.ts':'c\n'});git(['-c','commit.gpgSign=false','merge','--no-ff','-m','merge','side']);
  const selection=selectGitCommits(root),result=collectGitPressure(root,selection);
  assert.equal(result.files.reduce((sum,f)=>sum+f.churn,0),3);
  assert.equal(result.selectedCommits.length,3);
  const missing={...selection,commits:[{id:'0'.repeat(40),parents:[]}]};
  assert.equal(collectGitPressure(root,missing).status,'blocked');
});
test('squash and rebase aggregate their reachable diff exactly once',t=>{
  const {root,git,save}=repo(t);save({'a.ts':'a\n'});
  git(['checkout','-qb','squash']);save({'b.ts':'b\n'});git(['checkout','-q','main']);git(['merge','--squash','squash']);save({});
  git(['checkout','-qb','topic']);save({'c.ts':'c\n'});git(['checkout','-q','main']);save({'d.ts':'d\n'});git(['rebase','main','topic']);
  const result=collectGitPressure(root,selectGitCommits(root));
  assert.equal(result.files.reduce((sum,f)=>sum+f.churn,0),4);
  assert.ok(result.files.every(f=>f.frequency===1));
});
test('mutable info attributes cannot silently change snapshot line counts',t=>{
  const {root,save}=repo(t);save({'a.ts':'a\n'});const selection=selectGitCommits(root);
  assert.equal(collectGitPressure(root,selection).files[0].churn,1);
  fs.writeFileSync(path.join(root,'.git','info','attributes'),'*.ts binary\n');
  const result=collectGitPressure(root,selection);
  assert.equal(result.status,'blocked');assert.match(result.reason,/info\/attributes/);
});
test('mutable custom diff-driver binary policy is rejected explicitly',t=>{
  const {root,git,save}=repo(t);save({'a.ts':'a\n','.gitattributes':'*.ts diff=custom\n'});const selection=selectGitCommits(root);
  assert.equal(collectGitPressure(root,selection).files[0].churn,1);
  git(['config','diff.custom.binary','true']);const result=collectGitPressure(root,selection);
  assert.equal(result.status,'blocked');assert.match(result.reason,/diff driver/);
});
