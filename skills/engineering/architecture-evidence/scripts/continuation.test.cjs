'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {coordinateBatch}=require('./continuation.cjs');
const fixture=()=>({snapshotId:'snapshot-a',ledger:{status:'complete',identity:'ledger-a',data:{entries:[{id:'i0',disposition:'accepted'},{id:'i1',disposition:'rejected'},{id:'i2',disposition:'deferred'},{id:'i3',disposition:'rejected'},{id:'i4',disposition:'rejected'}]}},ranking:{groups:[{name:'size',items:Array.from({length:13},(_,i)=>({id:'i'+i,percentile:100-i}))}]},eligibility:Array.from({length:13},(_,i)=>({id:'i'+i,eligible:true,owners:['owner'+i]})),decisions:{i1:{structure:{status:'suppressed'},history:{status:'suppressed'}},i3:{structure:{status:'reopen'},history:{status:'suppressed'}}}});
test('scan is repeatable; explicit continuation consumes prior batch through exhaustion',()=>{
  const input=fixture(),before=JSON.stringify(input),first=coordinateBatch(input);assert.equal(first.status,'batch');assert.deepEqual(first,coordinateBatch(input));
  assert.deepEqual(first.selection.selected.map(x=>x.id),['i2','i3','i5','i6','i7']);
  assert.equal(first.selection.excluded.find(x=>x.id==='i0').reason,'accepted duplicate');
  assert.equal(first.selection.excluded.find(x=>x.id==='i1').reason,'rejected suppression');
  assert.equal(first.eligibility.find(x=>x.id==='i4').review,'review-needed');
  assert.equal(first.selection.excluded.find(x=>x.id==='i4').reason,'rejected comparison unavailable');
  assert.deepEqual(first.comparisonDiagnostics.map(x=>x.id),['i4']);
  const seen=new Set();let result=first;
  for(let step=0;result.status==='batch'&&step<10;step++){for(const row of result.selection.selected){assert.ok(!seen.has(row.id));seen.add(row.id);}result=coordinateBatch({...input,continuation:result.next});}
  assert.equal(result.status,'exhausted');assert.equal(seen.size,10);assert.equal(result.next,null);
  assert.deepEqual(coordinateBatch(input),first);assert.equal(JSON.stringify(input),before);
});
test('stale snapshot/ledger, altered token and wrong population cannot consume items',()=>{
  const input=fixture(),next=coordinateBatch(input).next;
  for(const changed of [{...input,snapshotId:'new'},{...input,ledger:{...input.ledger,identity:'new'}},{...input,eligibility:input.eligibility.slice(1)}]){const r=coordinateBatch({...changed,continuation:next});assert.equal(r.status,'invalid-continuation');assert.ok(r.recovery);}
  const broken=structuredClone(next);broken.reviewed.push('bogus');assert.equal(coordinateBatch({...input,continuation:broken}).status,'invalid-continuation');
  assert.equal(coordinateBatch({...input,ledger:{status:'blocked'}}).status,'blocked');
});
test('confirmed prior ID preserves accepted exclusion; deferred returns in a new audit',()=>{
  const input=fixture();input.eligibility[5].priorId='i0';
  const first=coordinateBatch(input);assert.equal(first.selection.excluded.find(x=>x.id==='i5').reason,'accepted duplicate');
  assert.ok(first.selection.selected.some(x=>x.id==='i2'));
  const later=coordinateBatch({...input,continuation:first.next});assert.ok(!later.selection.selected.some(x=>x.id==='i2'));
  const fresh=coordinateBatch({...input,snapshotId:'new-audit'});assert.ok(fresh.selection.selected.some(x=>x.id==='i2'));
});
