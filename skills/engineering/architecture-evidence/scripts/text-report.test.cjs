'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {renderReport}=require('./text-report.cjs');
const context={createdAt:'2026-09-06T12:00:00.000Z',root:'fixture',rawOutput:'raw.json',elapsedMs:10};
test('unavailable comparisons are visible outside selected candidates with the original decision and recovery',()=>{
 const r={items:[{id:'a',identity:{kind:'file',path:'a.ts'}}],
  collectors:{capture:{ledger:{data:{entries:[{id:'a',reason:'cohesive facade',candidateRef:'audit#C3'}]}}}},
  queue:{comparisonDiagnostics:[{id:'a',reason:'rejected comparison unavailable',decision:{structure:{status:'review-needed',diagnostics:['legacy baseline']},history:{status:'review-needed',reason:'shallow history',recovery:'fetch baseline'}}}],selection:{selected:[],excluded:[],groups:[]}}};
 const out=renderReport(r,context);
 assert.match(out,/\[판정 비교 진단 — 개선 후보와 별도\]/);assert.match(out,/a.ts: rejected comparison unavailable/);
 assert.match(out,/cohesive facade/);assert.match(out,/legacy baseline/);assert.match(out,/fetch baseline/);
});

test('report explains shape signals, type-dependent cycles and export composition',()=>{
  const r={items:[{id:'a',identity:{kind:'file',path:'a.ts'}},{id:'cycle',identity:{kind:'cluster',members:['a']}}],
    collectors:{structure:{clusters:[{id:'cycle',dependencyKind:'requires-type-only',valueCyclePaths:[]}]},surface:{files:[{path:'a.ts',breakdown:{typeDeclarations:7,valueDeclarations:0,typeReExports:2,valueCapableReExports:1,typeLocalExports:0,valueCapableLocalExports:0,exportAssignments:0}}]}},
    queue:{selection:{selected:[{id:'a',groups:['interface'],signalContext:'shape-only'},{id:'cycle',groups:['structure']}],excluded:[],groups:[]}}};
  const out=renderReport(r,context);
  assert.match(out,/형태 지표만 선정됨/);assert.match(out,/type-only 선언 edge를 제외하면 관측 순환이 사라짐/);
  assert.match(out,/타입 선언=7; 값 선언=0; 타입 re-export=2; 값 가능 re-export=1/);
  assert.match(out,/런타임 결함 판정이 아님/);
});
function couplingReport(){
 const metric=(name,value,percentile)=>({itemId:'a',name,value,percentile,unit:'distinct-nodes',validity:'valid',rankValidity:'valid',source:'confirmed-coupling-v1:fixture',cohort:'javascript:file',validPopulation:85,observedPopulation:90});
 return {status:'partial',items:[{id:'a',identity:{kind:'file',path:'a.js'}}],metrics:[metric('impact',45,100),metric('fanIn',6,88)],
  ranking:{groups:[{name:'coupling',items:[{id:'a',percentile:100,signals:[{name:'impact',percentile:100,cohort:'javascript:file',source:'confirmed-coupling-v1:fixture'},{name:'fanIn',percentile:88,cohort:'javascript:file',source:'confirmed-coupling-v1:fixture'}]}]}]},
  collectors:{coupling:{confirmation:{status:'observed',confirmedEdges:12,unresolvedEdges:3,reason:null},bindingEvidence:{entries:[{classification:'unresolved',reason:'no-proven-binding'}]}}},
  queue:{selection:{selected:[{id:'a',groups:['coupling'],owners:['app'],bestPercentile:100}],excluded:[],groups:[]}}};
}
test('coupling selection explains the winning metric population and uncertainty from JSON',()=>{
 const r=couplingReport(),out=renderReport(r,context);
 assert.match(out,/선정 기여: impact: 45 distinct-nodes; 비교군=javascript:file; 유효 표본=85; 관측 표본=90; percentile=100/);
 assert.doesNotMatch(out,/선정 기여: fanIn/);
 assert.match(out,/관측 그래프 전체: 확인된 연결=12; 추정\/판정 불가=3/);
 assert.match(out,/no-proven-binding/);
});
test('tied contribution signals are all shown and missing raw details are not inferred',()=>{
 const r=couplingReport();r.metrics[1].percentile=100;r.ranking.groups[0].items[0].signals[1].percentile=100;
 assert.match(renderReport(r,context),/선정 기여: fanIn: 6/);
 const ordered=renderReport(r,context);
 r.ranking.groups[0].items[0].signals.reverse();r.metrics.reverse();
 assert.equal(renderReport(r,context),ordered);
 r.metrics=r.metrics.filter(m=>m.name!=='impact');
 assert.match(renderReport(r,context),/impact — 확인 불가 \(일치하는 원시 metric 없음\)/);
 delete r.ranking;
 assert.match(renderReport(r,context),/저장된 coupling 선정 신호 없음/);
 delete r.collectors;
 const unknown=renderReport(r,context);
 assert.match(unknown,/근거: 확인 불가 \(저장된 근거 분류 없음\)/);
 assert.match(unknown,/확인된 연결=확인 불가; 추정\/판정 불가=확인 불가/);
 assert.doesNotMatch(unknown,/근거: 확인된 정적 연결의 관측값/);
});
test('saved path witnesses and absence reasons appear without recomputing paths',()=>{
 const r=couplingReport();r.items.push({id:'b',identity:{kind:'file',path:'b.js'}});
 r.couplingPaths={rules:'coupling-paths-v1:limit3',limit:3,items:[{itemId:'a',name:'impact',status:'available',reason:'display-limit',omitted:4,
  paths:[{nodes:['b','a'],edges:[{classification:'confirmed',reason:'binding',proof:{sourcePath:'b.js',start:12,end:16}}]}]}]};
 const out=renderReport(r,context);assert.match(out,/대표 경로 \(impact\): b.js -> a.js/);assert.match(out,/생략=4; 이유=display-limit/);assert.match(out,/b.js; UTF-16 offset \[12, 16\)/);
 assert.match(out,/fanIn\/impact의 0은 실제 사용처가 없다는 뜻이 아닙니다/);
 assert.match(out,/줄 번호가 아닙니다/);
 r.couplingPaths.items[0]={itemId:'a',name:'impact',status:'unavailable',reason:'path-evidence-unavailable',paths:[],omitted:null};
 assert.match(renderReport(r,context),/경로 상태 \(impact\): unavailable; 생략=확인 불가; 이유=path-evidence-unavailable/);
});
test('text preserves unknown and partial evidence without turning it into successful zero measurements',()=>{
 const blocked=renderReport({status:'blocked',reason:'collector failed'},context);
 assert.match(blocked,/상태: blocked/);assert.match(blocked,/필수 metric 누락 \/ 측정 불가: 확인 불가 \/ 확인 불가/);assert.match(blocked,/collector failed/);
 const partial=renderReport({status:'partial',snapshotVerified:true,measurement:{required:4,missing:1,unavailable:2},review:{reviewedCount:0,status:'not-started'}},context);
 assert.match(partial,/필수 metric 누락 \/ 측정 불가: 1 \/ 2/);assert.match(partial,/실제 LLM 검토: 0개/);
 assert.equal(partial,renderReport({status:'partial',snapshotVerified:true,measurement:{required:4,missing:1,unavailable:2},review:{reviewedCount:0,status:'not-started'}},context));
});
test('selected clusters show member paths and observed metric values rather than only opaque IDs',()=>{
 const r={status:'partial',items:[{id:'a',identity:{kind:'file',path:'src/a.ts'}},{id:'b',identity:{kind:'file',path:'src/b.ts'}},{id:'cycle',identity:{kind:'cluster',members:['a','b']}}],metrics:[{itemId:'cycle',name:'cycleSize',value:2,unit:'files',validity:'valid',percentile:90,source:'fixture'}],queue:{selection:{selected:[{id:'cycle',groups:['structure'],owners:['app'],bestPercentile:90,phase:'representative'}],excluded:[{id:'other',reason:'owner cap'}],groups:[]}}};
 const out=renderReport(r,context);assert.match(out,/src\/a.ts/);assert.match(out,/src\/b.ts/);assert.match(out,/cycleSize: 2 files/);assert.match(out,/owner cap: 1개/);
});
