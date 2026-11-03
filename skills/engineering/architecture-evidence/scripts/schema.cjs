'use strict';

const { createHash } = require('node:crypto');
function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + Array.from(value, canonicalJson).join(',') + ']';
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  }
  throw new TypeError('Expected finite JSON data');
}
const fingerprint = value => 'sha256:' + createHash('sha256').update(canonicalJson(value)).digest('hex');
function text(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('Missing ' + label);
  return value;
}
function sourcePath(value) {
  const normalized = text(value, 'path').replaceAll('\\', '/');
  if (/^\/|:/.test(normalized) || normalized.split('/').some(p => !p || p === '.' || p === '..')) throw new TypeError('Expected repository-relative path');
  return normalized;
}
function exactKeys(value, allowed) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError('Expected object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new TypeError('Unknown field: ' + key);
}
function evidenceIdentity(item) {
  const keys = {
    file: ['kind', 'path'], symbol: ['kind', 'path', 'qualifiedName', 'symbolKind', 'discriminator'],
    cluster: ['kind', 'members'], violation: ['kind', 'rule', 'source', 'target']
  };
  if (!keys[item?.kind]) throw new TypeError('Unknown evidence kind');
  exactKeys(item, keys[item.kind]);
  let identity;
  if (item.kind === 'file' || item.kind === 'symbol') {
    identity = { ...item, path: sourcePath(item.path) };
    if (item.kind === 'symbol') {
      text(item.qualifiedName, 'qualifiedName'); text(item.symbolKind, 'symbolKind');
      if ('discriminator' in item) text(item.discriminator, 'structural discriminator');
    }
  } else if (item.kind === 'cluster') {
    if (!Array.isArray(item.members) || !item.members.length) throw new TypeError('Cluster needs members');
    identity = { kind: item.kind, members: [...new Set(item.members.map(m => text(m, 'member ID')))].sort() };
  } else {
    identity = { kind: item.kind, rule: text(item.rule, 'rule'), source: text(item.source, 'source'), target: text(item.target, 'target') };
  }
  return identity;
}
function evidenceId(item) {
  return item.kind + ':' + fingerprint(evidenceIdentity(item));
}
function evidenceItems(items) {
  const result = items.map(evidenceIdentity).map(identity => ({ id: evidenceId(identity), identity }));
  if (new Set(result.map(item => item.id)).size !== result.length) throw new TypeError('duplicate evidence identity: supply a structural discriminator for ambiguous symbols');
  return result.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
function metricRecord(metric) {
  exactKeys(metric, ['schemaVersion', 'itemId', 'name', 'unit', 'direction', 'source', 'cohort', 'population', 'validity', 'value', 'reason']);
  if (metric.schemaVersion !== 1) throw new TypeError('Unsupported metric schemaVersion');
  for (const key of ['itemId', 'name', 'unit', 'source', 'cohort']) text(metric[key], key);
  if (!['higher', 'lower'].includes(metric.direction)) throw new TypeError('Unknown direction');
  if (!Number.isSafeInteger(metric.population) || metric.population < 0) throw new TypeError('Invalid population');
  if (metric.validity === 'valid') {
    if (!Number.isFinite(metric.value) || metric.population === 0) throw new TypeError('Invalid measured value/population');
  } else if (['unavailable', 'failed'].includes(metric.validity)) {
    if (metric.value !== null) throw new TypeError('Unavailable metric must have null value');
    text(metric.reason, 'reason');
  } else throw new TypeError('Unknown validity');
  return JSON.parse(canonicalJson(metric));
}
function snapshotRecord(input) {
  exactKeys(input, ['schemaVersion', 'source', 'git', 'graph', 'tools', 'config', 'metricSchema', 'ownership', 'ledger']);
  if (input.schemaVersion !== 1) throw new TypeError('Unsupported snapshot schemaVersion');
  for (const key of ['config', 'metricSchema', 'ownership', 'ledger']) text(input[key], key);
  exactKeys(input.source, ['head', 'files', 'dirtyFingerprint']);
  text(input.source.head, 'HEAD'); text(input.source.dirtyFingerprint, 'dirtyFingerprint');
  if (!Array.isArray(input.source.files)) throw new TypeError('Expected source files');
  const files = input.source.files.map(file => {
    exactKeys(file, ['path', 'fingerprint']);
    return { path: sourcePath(file.path), fingerprint: text(file.fingerprint, 'content fingerprint') };
  }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (new Set(files.map(f => f.path)).size !== files.length) throw new TypeError('duplicate source path');
  exactKeys(input.git, ['commits', 'selection']); text(input.git.selection, 'Git selection');
  if (!Array.isArray(input.git.commits)) throw new TypeError('Expected selected commit list');
  input.git.commits.forEach(commit => text(commit, 'commit'));
  if (new Set(input.git.commits).size !== input.git.commits.length) throw new TypeError('duplicate commit');
  exactKeys(input.graph, ['identity', 'freshness']); text(input.graph.identity, 'graph identity');
  if (!['fresh', 'stale', 'missing', 'unknown'].includes(input.graph.freshness)) throw new TypeError('Unknown graph freshness');
  if (!input.tools || Object.getPrototypeOf(input.tools) !== Object.prototype || !Object.keys(input.tools).length) throw new TypeError('Expected tool versions');
  Object.entries(input.tools).forEach(([name, version]) => { text(name, 'tool'); text(version, 'version'); });
  const normalized = JSON.parse(canonicalJson({ ...input, source: { ...input.source, files } }));
  return { id: fingerprint(normalized), input: normalized };
}
module.exports = { canonicalJson, fingerprint, evidenceId, evidenceItems, sourcePath, metricRecord, snapshotRecord };
