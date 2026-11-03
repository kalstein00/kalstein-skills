'use strict';
const { evidenceId, fingerprint, canonicalJson, sourcePath, metricRecord } = require('./schema.cjs');
const compare=(a,b)=>canonicalJson(a)<canonicalJson(b)?-1:canonicalJson(a)>canonicalJson(b)?1:0;
function cyclicComponents(paths,out,incoming){
  const visited=new Set(),order=[];
  for(const path of paths) {
    const stack=[[path,false]];
    while(stack.length) {
      const [at,done]=stack.pop(); if(done) {order.push(at);continue;} if(visited.has(at)) continue;
      visited.add(at);stack.push([at,true]);for(const next of [...out.get(at)].sort().reverse()) if(!visited.has(next)) stack.push([next,false]);
    }
  }
  visited.clear(); const clusters=[];
  for(const path of order.reverse()) {
    if(visited.has(path)) continue; const members=[],stack=[path];visited.add(path);
    while(stack.length) {const at=stack.pop();members.push(at);for(const next of incoming.get(at)) if(!visited.has(next)) {visited.add(next);stack.push(next);}}
    if(members.length<2&&!out.get(members[0]).has(members[0])) continue; members.sort();
    clusters.push(members);
  }
  return clusters;
}
function collectStructuralFindings(graph,ownership,cruise) {
  if(graph.freshness!=='fresh'||graph.status==='blocked') return {status:'blocked',reason:'fresh normalized graph required'};
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  const owner=new Map(ownership.files.map(f=>[f.path,f.owner]));
  const paths=[...new Set(graph.files.map(f=>sourcePath(f.path)))].sort();
  const out=new Map(paths.map(p=>[p,new Set()])), incoming=new Map(paths.map(p=>[p,new Set()]));
  const gaps=[...(graph.importGaps||[])],edges=[];
  for(const edge of graph.edges) {
    if(edge.kind!=='imports') continue;
    const a=nodes.get(edge.source)?.identity.path,b=nodes.get(edge.target)?.identity.path;
    if(!out.has(a)||!out.has(b)) {gaps.push({...edge,reason:'unmapped dependency endpoint'});continue;}
    out.get(a).add(b);incoming.get(b).add(a);edges.push({...edge,sourcePath:a,targetPath:b});
  }
  const clusters=[];
  for(const members of cyclicComponents(paths,out,incoming)){
    const missingOwners=members.filter(p=>!owner.has(p));
    if(missingOwners.length) {gaps.push({reason:'missing owner for SCC',paths:missingOwners,recovery:'Resolve ownership for every SCC member and retry.'});continue;}
    const owners=members.map(p=>owner.get(p));
    const identity={kind:'cluster',members:members.map(path=>evidenceId({kind:'file',path})).sort()};
    const memberEdges=edges.filter(e=>members.includes(e.sourcePath)&&members.includes(e.targetPath)).sort(compare);
    const valueOut=new Map(members.map(p=>[p,new Set()])),valueIn=new Map(members.map(p=>[p,new Set()]));
    for(const edge of memberEdges)if(edge.metadata?.dependencyKind!=='type-only'){
      valueOut.get(edge.sourcePath).add(edge.targetPath);valueIn.get(edge.targetPath).add(edge.sourcePath);
    }
    const valueCyclePaths=cyclicComponents(members,valueOut,valueIn).flat().sort();
    const unknown=memberEdges.some(e=>!['type-only','value-capable'].includes(e.metadata?.dependencyKind));
    const dependencyKind=unknown?'unknown':valueCyclePaths.length?'value-capable':'requires-type-only';
    clusters.push({id:evidenceId(identity),identity,paths:members,owners:[...new Set(owners)].sort(),source:graph.id,edges:memberEdges,dependencyKind,valueCyclePaths});
  }
  const violations=new Map();
  const ruleSet=cruise?.rules,RULE_SOURCE=cruise?.ruleSource;
  try {
    if(!ruleSet||!Array.isArray(ruleSet.forbidden)||!RULE_SOURCE||cruise?.source!=='dependency-cruiser@17.4.0'||cruise.ruleIdentity!==fingerprint(ruleSet)||!Array.isArray(cruise.result?.summary?.violations)) throw new Error('current dependency-cruiser 17.4.0 report and rule identity required');
    for(const reported of cruise.result.summary.violations) {
      const rule=ruleSet.forbidden.find(r=>r.name===reported.rule?.name);
      if(!rule) throw new Error('unknown reported rule');
      if(rule.to.circular) continue; // cycle evidence has its independent Adapter SCC identity
      if(reported.type && reported.type!=='dependency'||reported.rule.severity!==rule.severity) throw new Error('unsupported rule violation shape or severity');
      const source=sourcePath((cruise.pathPrefix?sourcePath(cruise.pathPrefix)+'/':'')+sourcePath(reported.from)),target=sourcePath((cruise.pathPrefix?sourcePath(cruise.pathPrefix)+'/':'')+sourcePath(reported.to));
      if(!owner.has(source)||!owner.has(target)) throw new Error('missing violation ownership');
      const identity={kind:'violation',rule:rule.name,source:evidenceId({kind:'file',path:source}),target:evidenceId({kind:'file',path:target})};
      violations.set(evidenceId(identity),{id:evidenceId(identity),identity,sourcePath:source,targetPath:target,owners:[...new Set([owner.get(source),owner.get(target)])].sort(),rule,ruleSource:RULE_SOURCE,ruleIdentity:cruise.ruleIdentity,provenance:cruise.source});
    }
  } catch(error) {violations.clear();gaps.push(cruise?{reason:error.message,recovery:'Run pinned dependency-cruiser JSON with the unchanged repository config and all endpoint ownership.'}:{reason:'project layer rules are not configured',recovery:'Layer measurement is unavailable. Do not invent project rules; use an existing authoritative rule set only when one is available.'});}
  const fileErrors=graph.files.filter(f=>f.errors?.length).map(f=>({path:f.path,errors:f.errors})).sort(compare);
  const languages=new Map(graph.files.map(f=>[f.path,f.language]));
  const rows=[...clusters,...violations.values()].map(item=>{
    const members=item.paths||[item.sourcePath,item.targetPath],values=members.map(p=>languages.get(p));
    const missing=values.some(v=>typeof v!=='string'||!v.trim()||v.includes(':'));
    const language=missing?'unknown':new Set(values).size===1?values[0]:'mixed';
    return {item,cohort:language+':'+item.identity.kind,missing};
  });
  const metrics=rows.map(({item,cohort,missing})=>metricRecord({schemaVersion:1,itemId:item.id,
    name:item.identity.kind==='cluster'?'cycleSize':'layerViolation',value:missing?null:item.paths?item.paths.length:1,
    unit:item.paths?'files':'violations',direction:'higher',source:item.paths?'structural-findings-v1:'+graph.source:'structural-findings-v1:dependency-cruiser@17.4.0:'+cruise.ruleIdentity,
    cohort,population:rows.filter(r=>r.cohort===cohort).length,validity:missing?'unavailable':'valid',...(missing?{reason:'member or endpoint language unavailable'}:{})})).sort(compare);
  return {status:gaps.length||fileErrors.length||rows.some(r=>r.missing)?'partial':graph.status,metrics,clusters:clusters.sort(compare),violations:[...violations.values()].sort(compare),gaps:gaps.sort(compare),graphIdentity:graph.id,unresolved:graph.unresolved,omittedNodes:graph.omittedNodes??[],omittedEdges:graph.omittedEdges??[],missingFiles:graph.missingFiles??[],fileErrors,recovery:graph.recovery??null};
}
module.exports = { collectStructuralFindings };
