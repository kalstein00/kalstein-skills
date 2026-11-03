'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {runScan}=require('./scan.cjs'),{readLedger,recordDisposition,LEDGER_PATH}=require('./ledger.cjs');

test('real scans preserve rejection across committing the ledger and a later docs commit, then reopen a public change',async t=>{
 const temp=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temp,'dart-repeat-review-'));
 t.after(()=>{assert.equal(path.dirname(path.resolve(root)),temp);assert.ok(path.basename(root).startsWith('dart-repeat-review-'));fs.rmSync(root,{recursive:true,force:true});});
 const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();
 git(['init','-q']);git(['config','user.email','test@example.invalid']);git(['config','user.name','Test']);
 for(const name of ['a','b','c'])fs.writeFileSync(path.join(root,name+'.ts'),'export const '+name+'=1;\n');
 git(['add','.']);git(['commit','-qm','initial source']);
 const first=await runScan(root,{});assert.equal(first.snapshotVerified,true);
 const item=first.items.find(i=>i.identity.path==='a.ts'&&i.identity.kind==='file');
 const saved=recordDisposition(root,{...item,disposition:'rejected',reason:'reviewed stable interface',candidateRef:null,
   snapshot:{id:first.snapshot.id,head:first.snapshot.input.source.head,baseline:first.baselines[item.id]}},{expectedIdentity:readLedger(root).identity});
 assert.equal(saved.status,'complete');git(['add',LEDGER_PATH]);git(['commit','-qm','record review']);
 fs.writeFileSync(path.join(root,'README.md'),'Documentation only\n');git(['add','README.md']);git(['commit','-qm','docs']);
 const bytes=fs.readFileSync(path.join(root,LEDGER_PATH),'utf8'),later=await runScan(root,{});
 assert.equal(later.snapshotVerified,true);assert.notEqual(later.snapshot.input.source.head,first.snapshot.input.source.head);
 assert.equal(later.windows[0].complete,true);assert.equal(later.windows[0].history.count,2);
 assert.equal(later.reconciliation.mappings[0].status,'matched');
 assert.equal(later.decisions[item.id].structure.status,'suppressed');
 assert.equal(later.queue.selection.selected.some(i=>i.id===item.id),false);
 fs.writeFileSync(path.join(root,'a.ts'),'export const a=1;\nexport const added=2;\n');
 const changed=await runScan(root,{});assert.equal(changed.snapshotVerified,true);
 assert.equal(changed.decisions[item.id].structure.status,'reopen');
 assert.ok(changed.decisions[item.id].structure.reasons.includes('public-surface'));
 assert.ok(changed.queue.selection.selected.some(i=>i.id===item.id));
 assert.equal(fs.readFileSync(path.join(root,LEDGER_PATH),'utf8'),bytes);
});
