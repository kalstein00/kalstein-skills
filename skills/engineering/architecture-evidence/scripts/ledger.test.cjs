'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {evidenceId,fingerprint}=require('./schema.cjs');
const {LEDGER_PATH,RAW_ROOT,readLedger,recordDisposition,acceptedEligibility}=require('./ledger.cjs');
function rootFor(t){const temp=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(temp,'architecture-evidence-ledger-'));t.after(()=>{assert.equal(path.dirname(path.resolve(root)),temp);assert.ok(path.basename(root).startsWith('architecture-evidence-ledger-'));fs.rmSync(root,{recursive:true,force:true});});return root;}
function entry(disposition='accepted'){const identity={kind:'file',path:'src/a.ts'};return {id:evidenceId(identity),identity,disposition,reason:'measured and reviewed',snapshot:{id:fingerprint('snapshot'),head:'a'.repeat(40),baseline:{}},candidateRef:disposition==='accepted'?'docs/audit.md#C1':null};}
test('read/scan are byte-preserving and only explicit record stores accepted decision evidence',t=>{
  const root=rootFor(t),before=readLedger(root);assert.equal(before.status,'complete');assert.equal(fs.existsSync(path.join(root,'.agents')),false);
  const item=entry(),saved=recordDisposition(root,item,{expectedIdentity:before.identity});assert.equal(saved.status,'complete');
  const file=path.join(root,LEDGER_PATH),bytes=fs.readFileSync(file,'utf8'),read=readLedger(root);
  assert.deepEqual(read.data.entries,[item]);assert.equal(acceptedEligibility(read,item.id).eligible,false);
  assert.equal(fs.readFileSync(file,'utf8'),bytes);
  assert.equal(recordDisposition(root,item,{expectedIdentity:read.identity}).changed,false);
  assert.equal(fs.readFileSync(file,'utf8'),bytes);
  assert.equal(RAW_ROOT,'.codex/tmp/architecture-evidence');
});
test('rejected/deferred evidence survives stale writes and atomic replacement failure',t=>{
  const root=rootFor(t),initial=readLedger(root),saved=recordDisposition(root,entry('rejected'),{expectedIdentity:initial.identity});
  const file=path.join(root,LEDGER_PATH),bytes=fs.readFileSync(file,'utf8');
  const stale=recordDisposition(root,entry('deferred'),{expectedIdentity:initial.identity});
  assert.equal(stale.status,'blocked');assert.match(stale.reason,/changed/);assert.equal(fs.readFileSync(file,'utf8'),bytes);
  const io={...fs,renameSync(){throw Object.assign(new Error('injected replace failure'),{code:'EACCES'});}};
  const failed=recordDisposition(root,entry('deferred'),{expectedIdentity:saved.identity,io});
  assert.equal(failed.status,'blocked');assert.equal(failed.phase,'replace');assert.ok(failed.recovery);
  assert.equal(fs.readFileSync(file,'utf8'),bytes);assert.deepEqual(fs.readdirSync(path.dirname(file)),['ledger.json']);
  assert.equal(recordDisposition(root,entry('deferred'),{expectedIdentity:saved.identity}).status,'complete');
  assert.equal(readLedger(root).data.entries[0].disposition,'deferred');
});
test('malformed and schema mismatch never become an empty ledger or overwrite the original',t=>{
  const root=rootFor(t),file=path.join(root,LEDGER_PATH);fs.mkdirSync(path.dirname(file),{recursive:true});
  for(const bytes of ['{bad','{"schemaVersion":2,"entries":[]}']){
    fs.writeFileSync(file,bytes);const read=readLedger(root);assert.equal(read.status,'blocked');assert.equal(read.phase,'read/validate');
    assert.equal(recordDisposition(root,entry(),{expectedIdentity:'anything'}).status,'blocked');assert.equal(fs.readFileSync(file,'utf8'),bytes);
  }
});
test('non-string snapshot HEAD is schema mismatch for both read and explicit record',t=>{
  const root=rootFor(t),invalid=entry();invalid.snapshot.head=['a'.repeat(40)];
  const initial=readLedger(root),written=recordDisposition(root,invalid,{expectedIdentity:initial.identity});
  assert.equal(written.status,'blocked');assert.equal(fs.existsSync(path.join(root,LEDGER_PATH)),false);
  const file=path.join(root,LEDGER_PATH);fs.mkdirSync(path.dirname(file),{recursive:true});const bytes=JSON.stringify({schemaVersion:1,entries:[invalid]});fs.writeFileSync(file,bytes);
  assert.equal(readLedger(root).status,'blocked');assert.equal(fs.readFileSync(file,'utf8'),bytes);
});
