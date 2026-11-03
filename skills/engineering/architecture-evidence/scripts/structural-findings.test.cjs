'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evidenceId, fingerprint } = require('./schema.cjs');
const { collectStructuralFindings } = require('./structural-findings.cjs');
const rules = {forbidden:[{name:'no-main-to-renderer',severity:'warn',from:{path:'^src/main'},to:{path:'^src/renderer'}}]};
const {rankMetrics}=require('./ranking.cjs');
function fixture() {
  const paths=['log-viewer-app/src/main/a.ts','log-viewer-app/src/renderer/b.ts','log-viewer-app/src/shared/c.ts'];
  const nodes=paths.map(path=>({id:evidenceId({kind:'file',path}),identity:{kind:'file',path}}));
  const edge=(a,b)=>({source:nodes[a].id,target:nodes[b].id,kind:'imports',provenance:'ast',confidence:null});
  return {graph:{id:'graph',freshness:'fresh',status:'complete',nodes,files:paths.map(path=>({path})),edges:[edge(0,1),edge(1,0),edge(1,2)],unresolved:{validity:'valid',count:0}},ownership:{files:paths.map((path,i)=>({path,owner:'owner'+i}))},cruise:{source:'dependency-cruiser@17.4.0',rules,ruleSource:'log-viewer-app/.dependency-cruiser.cjs',pathPrefix:'log-viewer-app',ruleIdentity:fingerprint(rules),result:{summary:{violations:[]}}}};
}
test('SCC IDs ignore traversal order but change with membership and preserve all owners', () => {
  const {graph,ownership,cruise}=fixture();
  const a=collectStructuralFindings(graph,ownership,cruise);
  assert.equal(a.clusters.length,1);
  assert.deepEqual(a.clusters[0].owners,['owner0','owner1']);
  assert.equal(a.clusters[0].identity.members.length,2);
  assert.deepEqual(a,collectStructuralFindings({...graph,nodes:[...graph.nodes].reverse(),edges:[...graph.edges].reverse()},ownership,cruise));
  graph.edges.push({source:graph.nodes[2].id,target:graph.nodes[0].id,kind:'imports',provenance:'ast',confidence:null});
  assert.notEqual(a.clusters[0].id,collectStructuralFindings(graph,ownership,cruise).clusters[0].id);
});
test('SCC and layer metrics reach structure ranking with explicit comparable populations',()=>{
  const groups=[[0],[1,2],[3,4,5]],paths=Array.from({length:6},(_,i)=>'log-viewer-app/src/main/f'+i+'.ts');
  const nodes=paths.map(path=>({id:evidenceId({kind:'file',path}),identity:{kind:'file',path}}));
  const graph={id:'three-cycles',freshness:'fresh',status:'complete',files:paths.map(path=>({path,language:'typescript'})),nodes,
    edges:groups.flatMap(g=>g.map((n,i)=>({source:nodes[n].id,target:nodes[g[(i+1)%g.length]].id,kind:'imports'})))};
  const ownership={files:paths.map(path=>({path,owner:'owner'}))};
  const cruise={source:'dependency-cruiser@17.4.0',rules,ruleSource:'log-viewer-app/.dependency-cruiser.cjs',pathPrefix:'log-viewer-app',ruleIdentity:fingerprint(rules),result:{summary:{violations:[0,1,2].map(i=>({type:'dependency',from:'src/main/f'+i+'.ts',to:'src/main/f'+(i+3)+'.ts',rule:{name:'no-main-to-renderer',severity:'warn'}}))}}};
  let result=collectStructuralFindings(graph,ownership,cruise);
  assert.ok(Array.isArray(result.metrics),'collector must emit ranking metrics');
  assert.deepEqual(result.metrics.filter(m=>m.name==='cycleSize').map(m=>m.value).sort(),[1,2,3]);
  assert.ok(result.metrics.every(m=>m.population===3&&m.validity==='valid'&&m.direction==='higher'));
  const ranking=rankMetrics(result.metrics);assert.equal(ranking.groups.find(g=>g.name==='structure').items.length,6);
  assert.deepEqual(ranking.metrics.filter(m=>m.name==='layerViolation').map(m=>m.percentile),[50,50,50]);
  graph.files[2].language='rust';result=collectStructuralFindings(graph,ownership,cruise);
  assert.equal(result.metrics.find(m=>m.name==='cycleSize'&&m.value===2).cohort,'mixed:cluster');
  delete graph.files[2].language;result=collectStructuralFindings(graph,ownership,cruise);
  assert.ok(result.metrics.some(m=>m.validity==='unavailable'&&m.value===null&&m.reason.includes('language')));
  assert.equal(result.status,'partial');
});
test('authoritative layer violations remain separate typed evidence with current rule source', () => {
  const {graph,ownership,cruise}=fixture();
  const violation={type:'dependency',from:'src/main/a.ts',to:'src/renderer/b.ts',rule:{name:'no-main-to-renderer',severity:'warn'}};
  cruise.result.summary.violations=[violation,violation];
  const result=collectStructuralFindings(graph,ownership,cruise);
  assert.equal(result.clusters.length,1);assert.equal(result.violations.length,1);
  assert.equal(result.violations[0].identity.kind,'violation');
  assert.notEqual(result.clusters[0].id,result.violations[0].id);
  assert.equal(result.violations[0].ruleSource,'log-viewer-app/.dependency-cruiser.cjs');
  assert.deepEqual(result.violations[0].rule, rules.forbidden.find(r=>r.name==='no-main-to-renderer'));
  assert.deepEqual(result.violations[0].owners,['owner0','owner1']);
  assert.equal(collectStructuralFindings(graph,ownership,{...cruise,ruleIdentity:'stale'}).status,'partial');
});
test('self-import cycles are evidence while unresolved endpoints retain a partial gap', () => {
  const {graph,ownership,cruise}=fixture();
  graph.edges=[{source:graph.nodes[0].id,target:graph.nodes[0].id,kind:'imports',provenance:'ast',confidence:null},{source:graph.nodes[0].id,target:'missing',kind:'imports',provenance:'heuristic',confidence:0.2}];
  const result=collectStructuralFindings(graph,ownership,cruise);
  assert.equal(result.status,'partial');assert.equal(result.clusters.length,1);
  assert.equal(result.clusters[0].identity.members.length,1);
  assert.equal(result.gaps[0].confidence,0.2);
});
test('Adapter extraction errors and owner gaps retain partial diagnostics and recovery', () => {
  const {graph,ownership,cruise}=fixture();
  graph.status='partial';graph.files[0].errors=['parser failed'];graph.recovery={index:'repair extraction and sync'};
  let result=collectStructuralFindings(graph,ownership,cruise);
  assert.deepEqual(result.fileErrors,[{path:graph.files[0].path,errors:['parser failed']}]);
  assert.deepEqual(result.recovery,graph.recovery);
  ownership.files=ownership.files.slice(1);
  result=collectStructuralFindings(graph,ownership,cruise);
  assert.equal(result.status,'partial');assert.equal(result.clusters.length,0);
  assert.ok(result.gaps.some(g=>g.reason.includes('missing owner')&&g.recovery));
  assert.deepEqual(result.violations,[]);
});

test('absent project layer rules explain the measurement gap without requesting a nonexistent config',()=>{
 const {graph,ownership}=fixture();const result=collectStructuralFindings(graph,ownership,null);
 assert.equal(result.status,'partial');assert(result.gaps.some(g=>g.reason==='project layer rules are not configured'&&g.recovery.includes('Do not invent')));
});
