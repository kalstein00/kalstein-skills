'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {main}=require('./scan.cjs');
test('a plain project scan prepares tools and config without user setup commands',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'architecture-auto-'));
 t.after(()=>{assert.equal(path.dirname(root),os.tmpdir());assert(path.basename(root).startsWith('architecture-auto-'));fs.rmSync(root,{recursive:true,force:true});});
 const git=args=>execFileSync('git',['-C',root,...args],{stdio:'pipe'});
 fs.writeFileSync(path.join(root,'sample.ts'),'export const answer=42;');git(['init']);git(['add','.']);git(['-c','user.name=Test','-c','user.email=test@example.invalid','commit','-m','fixture']);
 const a=await main(['--root',root]);assert.notEqual(a.status,'blocked',a.reason);assert(a.output);assert(fs.existsSync(a.textOutput));
 const report=JSON.parse(fs.readFileSync(a.output));assert(report.snapshotVerified);assert.equal(report.status,'partial');assert.ok(report.diagnostics.some(d=>d.collector==='graph'&&d.reason.includes('symbol graph collection is disabled')));assert.equal(fs.existsSync(path.join(root,'.codegraph')),false);assert.equal(fs.existsSync(path.join(a.preparation.runtime,'node_modules/@colbymchenry/codegraph')),false);assert.equal(report.metrics.some(m=>m.name==='fanIn'),false);assert.ok(report.collectors.structure);assert.equal(report.measurement.missing,0);assert.equal(report.measurement.unavailable,0);assert.equal(git(['status','--porcelain']).toString(),'');
 const b=await main(['--root',root]);assert.equal(b.preparation.cacheHit,true);assert.notEqual(a.textOutput,b.textOutput);assert(fs.existsSync(a.textOutput));assert.equal(b.snapshotId,a.snapshotId);
 const second=fs.mkdtempSync(path.join(os.tmpdir(),'architecture-auto-'));t.after(()=>{assert.equal(path.dirname(second),os.tmpdir());assert(path.basename(second).startsWith('architecture-auto-'));fs.rmSync(second,{recursive:true,force:true});});
 fs.cpSync(root,second,{recursive:true,filter:p=>!['.codex'].includes(path.basename(p))});
 const c=await main(['--root',second]);assert.notEqual(c.status,'blocked',c.reason);assert(c.preparation.cacheHit);assert.equal(c.preparation.runtime,a.preparation.runtime);
 const bad=path.join(root,'.codex/tmp/architecture-evidence/bad.json');fs.writeFileSync(bad,JSON.stringify({sdkPath:root}));
 const failure=await main(['--root',root,'--config',bad]);assert.equal(failure.status,'blocked');assert.equal(failure.output,undefined);
assert.equal(git(['status','--porcelain']).toString(),'');
});
