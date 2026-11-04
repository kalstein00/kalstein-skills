'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {runCollector}=require('./scan-runtime.cjs');
test('captures a standalone Git project without source-project layout',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'architecture-portable-'));
 t.after(()=>{assert.equal(path.dirname(root),os.tmpdir());assert(path.basename(root).startsWith('architecture-portable-'));fs.rmSync(root,{recursive:true,force:true});});
 const git=args=>execFileSync('git',['-C',root,...args],{stdio:'pipe'});
 fs.writeFileSync(path.join(root,'sample.ts'),'export const answer = 42;');git(['init']);git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture']);
 const result=await runCollector('capture',{root,config:{}}).catch(e=>({status:'blocked',reason:e.message}));
 assert.equal(result.status,'complete',result.reason);assert.equal(result.inventory.counts.production,1);assert.equal(result.tools.typescript,'5.3.3');assert.equal(result.tools['dependency-cruiser'],'17.4.0');assert.equal(result.gitStatus,'');
 fs.writeFileSync(path.join(root,'rules.cjs'),'module.exports={forbidden:[]}');
 fs.writeFileSync(path.join(root,'config.cjs'),"module.exports=require('./rules.cjs')");
 const config={dependencyCruiser:{configPath:'config.cjs',targets:['sample.ts']}};
 const structure=await runCollector('structure',{root,config,sources:result.sources,productionPaths:['sample.ts'],graph:{id:'fixture',status:'complete',freshness:'fresh',files:[],nodes:[],edges:[]},ownership:{files:[{path:'sample.ts',owner:'app'}]}});
 assert.equal(structure.status,'complete');assert.deepEqual(structure.violations,[]);
 const before=await runCollector('capture',{root,config});
 fs.writeFileSync(path.join(root,'rules.cjs'),'module.exports={forbidden:[{name:"new-rule"}]}');
 const after=await runCollector('capture',{root,config});assert.notEqual(before.configIdentity,after.configIdentity);

});

test('layer evidence uses the supplied project rules and paths instead of a host repository',()=>{
 const {collectStructuralFindings}=require('./structural-findings.cjs'),{evidenceId,fingerprint}=require('./schema.cjs');
 const paths=['src/a.ts','src/b.ts'],rules={forbidden:[{name:'isolated-layer',severity:'error',from:{path:'a'},to:{path:'b'}}]};
 const graph={id:'fixture',source:'fixture',freshness:'fresh',status:'complete',files:paths.map(path=>({path,language:'typescript'})),nodes:[],edges:[]};
 const ownership={files:paths.map(path=>({path,owner:'app'}))};
 const r=collectStructuralFindings(graph,ownership,{source:'dependency-cruiser@17.4.0',rules,ruleSource:'.dependency-cruiser.cjs',pathPrefix:'',ruleIdentity:fingerprint(rules),result:{summary:{violations:[{type:'dependency',from:paths[0],to:paths[1],rule:{name:'isolated-layer',severity:'error'}}]}}});
 assert.equal(r.status,'complete');assert.equal(r.violations[0].sourcePath,'src/a.ts');assert.equal(r.violations[0].ruleSource,'.dependency-cruiser.cjs');
});
