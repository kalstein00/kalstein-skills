'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {GROUPS,rankMetrics}=require('./ranking.cjs');
const {selectEvidence}=require('./selection.cjs');
const entry=(id,owners=[id],extra={})=>({id,eligible:true,owners,...extra});

test('shape-only selections are separate from multiple signal groups without hiding measurements',()=>{
  const groups=[{name:'size',items:[{id:'shape',percentile:100},{id:'corroborated',percentile:90}]},{name:'interface',items:[{id:'shape',percentile:100}]},{name:'history',items:[{id:'corroborated',percentile:100}]}];
  const selected=selectEvidence({groups},[entry('shape'),entry('corroborated')]).selected;
  assert.equal(selected.find(i=>i.id==='shape').signalContext,'shape-only');
  assert.equal(selected.find(i=>i.id==='corroborated').signalContext,'multiple-signal-groups');
});
test('unranked input without eligibility still has an explicit exclusion',()=>{
  const ranking=rankMetrics([{schemaVersion:1,itemId:'sparse',name:'loc',value:1,unit:'lines',direction:'higher',source:'fixture',cohort:'typescript:file',population:1,validity:'valid'}]);
  assert.deepEqual(selectEvidence(ranking,[]).excluded,[{id:'sparse',reason:'missing eligibility'}]);
});
test('eligibility precedes Top5 so accepted/rejected do not consume group slots',()=>{
  const items=Array.from({length:8},(_,i)=>({id:'a'+i,percentile:100-i}));
  const eligibility=items.map(i=>entry(i.id));eligibility[0]={...eligibility[0],eligible:false,reason:'accepted'};eligibility[1]={...eligibility[1],eligible:false,reason:'rejected suppression'};
  const result=selectEvidence({groups:[{name:'size',items}]},eligibility);
  assert.deepEqual(result.selected.map(i=>i.id),['a2','a3','a4','a5','a6']);
  assert.equal(result.excluded.find(i=>i.id==='a0').reason,'accepted');
  assert.equal(result.excluded.find(i=>i.id==='a7').reason,'outside eligible group Top5');
});
test('fixed representatives precede fill and hard total20/owner3 caps survive permutations',()=>{
  const groups=GROUPS.map((name,g)=>({name,items:Array.from({length:5},(_,i)=>({id:g+'-'+i,percentile:100-i}))}));
  const eligibility=groups.flatMap(g=>g.items.map(i=>entry(i.id)));
  const result=selectEvidence({groups},eligibility);
  assert.equal(result.selected.length,20);
  assert.deepEqual(result.selected.slice(0,6).map(i=>i.id),['0-0','1-0','2-0','3-0','4-0','5-0']);
  assert.equal(result.excluded.filter(i=>i.reason==='total cap').length,10);
  assert.deepEqual(result,selectEvidence({groups:[...groups].reverse().map(g=>({...g,items:[...g.items].reverse()}))},[...eligibility].reverse()));
  const shared=selectEvidence({groups},eligibility.map(i=>({...i,owners:['shared']})));
  assert.equal(shared.selected.length,3);assert.equal(shared.ownerUsage.shared,3);
  assert.ok(shared.representatives.some(r=>r.status==='owner cap'));
});
test('multi-owner cluster consumes every quota and group overlap fills before single signals',()=>{
  const groups=[{name:'structure',items:[{id:'cluster',percentile:100},{id:'x',percentile:90},{id:'overlap',percentile:80}]},{name:'size',items:[{id:'s',percentile:100},{id:'overlap',percentile:80},{id:'y',percentile:70},{id:'z',percentile:60}]}];
  const eligibility=[entry('cluster',['A','B']),entry('x',['A']),entry('overlap',['A']),entry('s',['B']),entry('y',['B']),entry('z',['B'])];
  const result=selectEvidence({groups},eligibility);
  assert.deepEqual(result.selected.slice(0,3).map(i=>i.id),['cluster','s','overlap']);
  assert.equal(result.ownerUsage.A,3);assert.equal(result.ownerUsage.B,3);
  assert.equal(result.excluded.find(i=>i.id==='z').reason,'owner cap');
});
