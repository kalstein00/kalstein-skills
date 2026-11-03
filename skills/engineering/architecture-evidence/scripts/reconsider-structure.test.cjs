'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reconsiderStructure}=require('./reconsider-structure.cjs');
const baseline=()=>({schemaVersion:1,publicSurface:{validity:'valid',fingerprint:'surface-a'},percentiles:Object.fromEntries(['fanIn','fanOut','impact','complexity'].map(name=>[name,{validity:'valid',value:40,cohortKey:name+':typescript:symbol:higher:source-v1',direction:'risk-higher'}])),topGroups:{validity:'valid',population:'before-suppression',groups:['size']},cycles:{validity:'valid',ids:['cycle-a']},violations:{validity:'valid',ids:[]},ownershipIdentity:'owners-a',metricSchemaIdentity:'metrics-a'});
test('identical item observations ignore relative rank movement but preserve confirmed structural triggers',()=>{
 const a=baseline();a.reviewedEvidence={rule:'item-observations-v2',identity:'sha256:'+'a'.repeat(64)};
 const b=structuredClone(a);b.percentiles.complexity.value=90;b.topGroups.groups.push('coupling','history');
 assert.equal(reconsiderStructure(a,b).status,'suppressed');
 b.publicSurface.fingerprint='changed';assert.equal(reconsiderStructure(a,b).status,'reopen');
});

test('unchanged reviewed evidence suppresses repeat review while preserving gaps and trigger precedence',()=>{
  const a=baseline();a.cycles={validity:'unavailable'};
  a.reviewedEvidence={rule:'captured-evidence-v1',identity:'sha256:'+'a'.repeat(64)};
  const b=structuredClone(a);
  const same=reconsiderStructure(a,b);assert.equal(same.status,'suppressed');
  assert.equal(same.basis,'unchanged-reviewed-evidence');assert.ok(same.diagnostics.length);
  b.reviewedEvidence.identity='sha256:'+'b'.repeat(64);assert.equal(reconsiderStructure(a,b).status,'review-needed');
  b.reviewedEvidence=structuredClone(a.reviewedEvidence);b.topGroups.groups.push('coupling');assert.equal(reconsiderStructure(a,b).status,'reopen');
  delete b.reviewedEvidence;assert.equal(reconsiderStructure(a,b).status,'reopen');
  b.topGroups.groups.pop();assert.equal(reconsiderStructure(a,b).status,'review-needed');
  a.reviewedEvidence.identity=b.reviewedEvidence={};assert.equal(reconsiderStructure(a,b).status,'review-needed');
});
test('every independent structural trigger releases rejection with a named reason',()=>{
  const cases=[['public-surface',b=>b.publicSurface.fingerprint='b'],...['fanIn','fanOut','impact','complexity'].map(n=>['percentile:'+n,b=>b.percentiles[n].value=50]),['top-group:coupling',b=>b.topGroups.groups.push('coupling')],['new-cycle:cycle-b',b=>b.cycles.ids.push('cycle-b')],['new-violation:layer-b',b=>b.violations.ids.push('layer-b')],['ownership-changed',b=>b.ownershipIdentity='b'],['metric-schema-changed',b=>b.metricSchemaIdentity='b']];
  for(const [reason,change] of cases){const a=baseline(),b=baseline();change(b);const before=JSON.stringify([a,b]);const result=reconsiderStructure(a,b);assert.equal(result.status,'reopen',reason);assert.ok(result.reasons.includes(reason),reason);assert.equal(JSON.stringify([a,b]),before);}
});
test('10 percentage points is inclusive; internal bodies and smaller or improving changes stay suppressed',()=>{
  const a=baseline(),b=baseline();b.bodyFingerprint='internal-only';
  b.percentiles.complexity.value=49.99;assert.equal(reconsiderStructure(a,b).status,'suppressed');
  b.percentiles.complexity.value=50;assert.equal(reconsiderStructure(a,b).status,'reopen');
  b.percentiles.complexity.value=20;assert.equal(reconsiderStructure(a,b).status,'suppressed');
  a.percentiles.complexity.value=9.9;b.percentiles.complexity.value=19.9;assert.equal(reconsiderStructure(a,b).status,'reopen');
  a.percentiles.complexity.value=100*4/30;b.percentiles.complexity.value=100*7/30;assert.equal(reconsiderStructure(a,b).status,'reopen');
});
test('incomparable or missing evidence needs review instead of normal suppression',()=>{
  const changes=[b=>delete b.publicSurface,b=>b.publicSurface.validity='unavailable',b=>delete b.percentiles.fanIn,b=>b.percentiles.fanIn.cohortKey='other',b=>b.percentiles.fanIn.direction='lower',b=>b.percentiles.fanIn.value=NaN,b=>b.topGroups.population='after-suppression',b=>b.cycles.validity='unavailable',b=>delete b.ownershipIdentity];
  for(const change of changes){const b=baseline();change(b);const result=reconsiderStructure(baseline(),b);assert.equal(result.status,'review-needed');assert.ok(result.diagnostics.length);}
  assert.equal(reconsiderStructure({},baseline()).status,'review-needed');
  const a=baseline(),b=baseline();a.publicSurface=b.publicSurface={validity:'not-applicable'};
  assert.equal(reconsiderStructure(a,b).status,'suppressed');
  b.publicSurface={validity:'valid',fingerprint:'new'};assert.equal(reconsiderStructure(a,b).status,'review-needed');
});
