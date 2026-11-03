'use strict';
const { evidenceId, metricRecord, canonicalJson, sourcePath } = require('./schema.cjs');
const compare = (a,b) => canonicalJson(a) < canonicalJson(b) ? -1 : canonicalJson(a) > canonicalJson(b) ? 1 : 0;
const EDGE_KINDS = ['calls','imports','references'];
function collectCoupling(graph, ownership, config) {
  if (config?.schemaVersion !== 1 || !Number.isSafeInteger(config.impactDepth) || config.impactDepth < 1 || config.impactDepth > 100) throw new Error('coupling v1 requires explicit impactDepth 1..100');
  if (graph.status === 'blocked' || graph.freshness !== 'fresh') return {status:'blocked',reason:'fresh normalized Adapter graph required',recovery:graph.recovery};
  if (!Array.isArray(config.testFiles)) throw new Error('explicit testFiles required');
  const testFiles = config.testFiles.map(f=>({path:sourcePath(f.path),kind:f.kind})).sort(compare);
  if(testFiles.some(f=>!['unit','integration','e2e'].includes(f.kind))||new Set(testFiles.map(f=>f.path)).size!==testFiles.length) throw new Error('unique test file path with unit/integration/e2e kind required');
  const ownerByPath = new Map(ownership.files.map(f=>[f.path,f.owner]));
  const files = graph.files.map(f=>({id:evidenceId({kind:'file',path:f.path}),identity:{kind:'file',path:f.path},language:f.language}));
  const nodes = new Map(graph.nodes.map(n=>[n.id,n]));
  const items = [...new Map([...graph.nodes,...files].map(n=>[n.id,n])).values()].sort((a,b)=>compare(a.id,b.id));
  for (const item of items) if (!ownerByPath.has(item.identity.path)) throw new Error('missing ownership: '+item.identity.path);
  const outgoing = new Map(items.map(n=>[n.id,new Set()])), incoming = new Map(items.map(n=>[n.id,new Set()]));
  const ignoredEdges = [], evidence = [];
  function add(source,target) { if (source!==target) { outgoing.get(source).add(target); incoming.get(target).add(source); } }
  for (const edge of graph.edges) {
    if (!nodes.has(edge.source)||!nodes.has(edge.target)) { ignoredEdges.push({...edge,reason:'unmapped endpoint'}); continue; }
    if (!EDGE_KINDS.includes(edge.kind)) { ignoredEdges.push({...edge,reason:'kind outside coupling v1'}); continue; }
    evidence.push(edge);
    if(nodes.get(edge.source).identity.kind==='symbol'&&nodes.get(edge.target).identity.kind==='symbol') add(edge.source,edge.target);
    add(evidenceId({kind:'file',path:nodes.get(edge.source).identity.path}),evidenceId({kind:'file',path:nodes.get(edge.target).identity.path}));
  }
  function affected(id) {
    const seen = new Set([id]); let frontier = [id];
    for (let depth=0; depth<config.impactDepth && frontier.length; depth++) {
      const next=[]; for (const current of frontier) for (const neighbor of incoming.get(current)) if(!seen.has(neighbor)) {seen.add(neighbor);next.push(neighbor);} frontier=next;
    }
    seen.delete(id); return seen;
  }
  const byId = new Map(items.map(n=>[n.id,n])),populations=new Map(),testKinds=new Map(testFiles.map(f=>[f.path,f.kind]));
  for(const item of items){const cohort=item.language+':'+item.identity.kind;populations.set(cohort,(populations.get(cohort)||0)+1);}
  const metrics = items.flatMap(item=> {
    const cohort=item.language+':'+item.identity.kind;
    const impacted=affected(item.id);
    const values = {fanIn:incoming.get(item.id).size,fanOut:outgoing.get(item.id).size,impact:impacted.size,crossOwnerOut:[...outgoing.get(item.id)].filter(id=>ownerByPath.get(byId.get(id).identity.path)!==ownerByPath.get(item.identity.path)).length};
    const linkedPaths=new Set([...impacted].map(id=>byId.get(id).identity.path));
    for(const kind of ['unit','integration','e2e']) values['staticTestLinkage:'+kind]=0;
    for(const path of linkedPaths){const kind=testKinds.get(path);if(kind)values['staticTestLinkage:'+kind]++;}
    values.runtimeCoverage=null;
    return Object.entries(values).map(([name,value])=>metricRecord({schemaVersion:1,itemId:item.id,name,value,unit:name==='runtimeCoverage'?'percent':name.startsWith('staticTest')?'distinct-test-files':'distinct-nodes',direction:name==='runtimeCoverage'||name.startsWith('staticTest')?'lower':'higher',source:'coupling-v1:'+graph.source+':depth='+config.impactDepth,validity:value===null?'unavailable':'valid',...(value===null?{reason:'No runtime coverage evidence supplied; static linkage is not coverage.'}:{}),cohort,population:populations.get(cohort)}));
  });
  return {status:ignoredEdges.some(e=>e.reason==='unmapped endpoint')?'partial':graph.status,config:{...config,testFiles,edgeKinds:EDGE_KINDS},graphIdentity:graph.id,metrics,evidence:evidence.sort(compare),ignoredEdges:ignoredEdges.sort(compare),unresolved:graph.unresolved,omittedEdges:graph.omittedEdges,omittedNodes:graph.omittedNodes,missingFiles:graph.missingFiles};
}
module.exports = { collectCoupling };
