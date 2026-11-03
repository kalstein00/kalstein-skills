'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evidenceItems}=require('./schema.cjs');
const {reconcileIdentities}=require('./identity-reconciliation.cjs');
const item=identity=>evidenceItems([identity])[0];
const oldHead='a'.repeat(40),currentHead='b'.repeat(40);
const ledger=items=>({status:'complete',identity:'ledger-fixture',data:{entries:items.map(i=>({...i,disposition:'rejected',reason:'reviewed',snapshot:{head:oldHead}}))}});
const scope=renames=>({currentHead,currentComplete:true,windows:[{baselineHead:oldHead,currentHead,complete:true,commits:[...new Set(renames.map(r=>r.commit))],renames}]});
test('confirmed file rename preserves file and exact named-symbol dispositions without ledger writes',()=>{
  const old=[item({kind:'file',path:'old.ts'}),item({kind:'symbol',path:'old.ts',qualifiedName:'run',symbolKind:'function'})];
  const current=old.map(i=>item({...i.identity,path:'new.ts'}));const prior=ledger(old),before=JSON.stringify(prior);
  const options=scope([{commit:currentHead,from:'old.ts',to:'new.ts'}]);
  const result=reconcileIdentities(prior,current,options);
  assert.ok(result.mappings.every(m=>m.status==='renamed'&&m.disposition==='rejected'&&m.currentId));
  assert.deepEqual(new Set(result.mappings.map(m=>m.originalId)),new Set(old.map(i=>i.id)));
  assert.equal(result.newItems.length,0);assert.equal(JSON.stringify(prior),before);
  assert.deepEqual(result,reconcileIdentities(prior,[...current].reverse(),options));
});
test('deletion, ambiguous mappings and changed cluster membership preserve prior records',()=>{
  const a=item({kind:'file',path:'a.ts'}),b=item({kind:'file',path:'b.ts'}),c=item({kind:'file',path:'c.ts'}),prior=ledger([a]);
  assert.equal(reconcileIdentities(prior,[],scope([])).mappings[0].status,'retired');
  assert.equal(reconcileIdentities(prior,[],{...scope([]),currentComplete:false}).mappings[0].status,'unresolved');
  const ambiguous=scope([{commit:currentHead,from:'a.ts',to:'b.ts'},{commit:currentHead,from:'a.ts',to:'c.ts'}]);
  assert.equal(reconcileIdentities(prior,[b,c],ambiguous).mappings[0].status,'unresolved');
  const cluster=item({kind:'cluster',members:[a.id,b.id]}),next=item({kind:'cluster',members:[a.id,c.id]});
  const changed=reconcileIdentities(ledger([cluster]),[next],scope([]));
  assert.equal(changed.mappings[0].status,'retired');assert.deepEqual(changed.newItems,[next]);
});
test('duplicate current symbol keys are unresolved even without an existing disposition',()=>{
  const symbol=item({kind:'symbol',path:'x.ts',qualifiedName:'f',symbolKind:'function'});
  const result=reconcileIdentities(ledger([]),[symbol,symbol],scope([]));
  assert.equal(result.status,'partial');assert.deepEqual(result.collisions,[symbol.id]);assert.deepEqual(result.newItems,[]);
});
test('chronological path reuse cannot transfer disposition through an earlier unrelated rename',()=>{
  const a=item({kind:'file',path:'a.ts'}),b=item({kind:'file',path:'b.ts'}),c=item({kind:'file',path:'c.ts'});
  const events=[{commit:'c'.repeat(40),from:'b.ts',to:'c.ts'},{commit:currentHead,from:'a.ts',to:'b.ts'}];
  const options=scope(events),result=reconcileIdentities(ledger([a]),[b,c],options);
  assert.equal(result.mappings[0].currentId,b.id);assert.deepEqual(result.newItems,[c]);
  options.windows[0].renames.reverse();assert.deepEqual(reconcileIdentities(ledger([a]),[b,c],options),result);
  options.windows[0].commits.reverse();
  assert.equal(reconcileIdentities(ledger([a]),[c],options).mappings[0].currentId,c.id);
  delete options.windows[0].commits;
  assert.equal(reconcileIdentities(ledger([a]),[b,c],options).mappings[0].status,'unresolved');
});
