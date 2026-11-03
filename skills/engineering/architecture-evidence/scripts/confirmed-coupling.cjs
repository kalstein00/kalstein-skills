'use strict';
const { collectCoupling } = require('./coupling.cjs');
const { canonicalJson, fingerprint } = require('./schema.cjs');
const { RULES } = require('./edge-evidence.cjs');
const METRICS = ['fanIn','fanOut','impact','crossOwnerOut'];
const VERSION = 'confirmed-coupling-v1';
function collectConfirmedCoupling(graph, ownership, config, bindingEvidence) {
  const original = collectCoupling(graph, ownership, config);
  if (original.status === 'blocked') return original;
  const reason = !bindingEvidence ? 'binding-evidence-unavailable' : null;
  if (bindingEvidence) {
    const { identity, ...content } = bindingEvidence;
    const edges = values => values.map(canonicalJson).sort();
    if (bindingEvidence.schemaVersion !== 1 || bindingEvidence.rules !== RULES ||
        fingerprint(content) !== identity ||
        canonicalJson(edges(bindingEvidence.entries.map(e=>e.edge))) !== canonicalJson(edges(graph.edges))) {
      throw new Error('binding evidence mismatch; reclassify the current graph and sources');
    }
  }
  const entries = bindingEvidence?.entries || [];
  const confirmedEdges = entries.filter(e=>e.classification==='confirmed').map(e=>e.edge);
  const projection = reason ? null : collectCoupling({...graph,edges:confirmedEdges},ownership,config);
  const projected = new Map((projection?.metrics||[]).map(m=>[m.itemId+'|'+m.name,m]));
  const metrics = original.metrics.map(metric => {
    if (!METRICS.includes(metric.name)) return metric; // static linkage retains its original meaning.
    const observed = projected.get(metric.itemId+'|'+metric.name);
    return reason ? {...metric,source:VERSION+':'+metric.source,validity:'unavailable',value:null,reason}
      : {...observed,source:VERSION+':'+observed.source};
  });
  return {...original,status:reason||entries.some(e=>e.classification!=='confirmed')?'partial':original.status,
    metrics,bindingEvidence:bindingEvidence||null,owners:[...ownership.files].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),
    confirmation:{version:VERSION,status:reason?'unavailable':'observed',reason,
      scope:'confirmed subset of observed static graph; not resolution completeness',
      confirmedEdges:confirmedEdges.length,unresolvedEdges:entries.length-confirmedEdges.length}};
}
module.exports = { collectConfirmedCoupling, METRICS, VERSION };
