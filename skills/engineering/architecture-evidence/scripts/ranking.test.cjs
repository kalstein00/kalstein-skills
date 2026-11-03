'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {rankMetrics}=require('./ranking.cjs');
function metric(itemId,value,extra={}) {return {schemaVersion:1,itemId,name:'loc',value,unit:'lines',direction:'higher',source:'fixture-v1',cohort:'typescript:file',population:4,validity:'valid',...extra};}
test('risk direction, tied midrank percentile and input-order invariance are exact',()=>{
  const input=[metric('a',10),metric('b',20),metric('c',20),metric('d',40)];
  const result=rankMetrics(input);
  assert.deepEqual(result.metrics.map(m=>[m.itemId,m.percentile]),[['a',0],['b',50],['c',50],['d',100]]);
  assert.deepEqual(rankMetrics([...input].reverse()),result);
  const inverse=rankMetrics(input.map(m=>({...m,direction:'lower'})));
  assert.equal(inverse.metrics.find(m=>m.itemId==='a').percentile,100);
});
test('missing/small populations stay unranked and languages never share raw comparison',()=>{
  const result=rankMetrics([metric('a',10),metric('b',20),metric('c',null,{validity:'unavailable',reason:'parse failure'}),metric('r',999,{cohort:'rust:file',population:1})]);
  assert.ok(result.metrics.every(m=>m.percentile===null&&m.rankValidity==='unavailable'));
  assert.equal(result.metrics.find(m=>m.itemId==='r').validPopulation,1);
  assert.equal(result.metrics.find(m=>m.itemId==='c').rankReason,'parse failure');
});
test('fixed signal groups expose dominant evidence and top-five overlap without a total defect score',()=>{
  const input=['a','b','c','d'].flatMap((id,i)=>[metric(id,i),metric(id,4-i,{name:'fanIn',unit:'nodes'})]);
  const result=rankMetrics(input),size=result.groups.find(g=>g.name==='size'),coupling=result.groups.find(g=>g.name==='coupling');
  assert.deepEqual(size.items.map(i=>i.id),['d','c','b','a']);
  assert.deepEqual(coupling.items.map(i=>i.id),['a','b','c','d']);
  assert.deepEqual(result.overlap.find(i=>i.id==='a').groups,['coupling','size']);
  assert.ok(result.metrics.every(m=>!Object.hasOwn(m,'defectScore')));
  assert.deepEqual(result,rankMetrics([...input].reverse()));
});
