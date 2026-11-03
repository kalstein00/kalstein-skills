'use strict';
const { fingerprint, sourcePath } = require('./schema.cjs');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
function globRegex(glob) {
  const segments = sourcePath(glob).split('/');
  return new RegExp('^' + segments.map((segment, i) => {
    if (segment === '**') return i === segments.length - 1 ? '.*' : '(?:[^/]+/)*';
    return segment.split('').map(char => char === '*' ? '[^/]*' : char === '?' ? '[^/]' : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + (i < segments.length - 1 ? '/' : '');
  }).join('') + '$');
}
function fallbackOwner(file) {
  const dirs = file.split('/').slice(0, -1);
  const packageName = dirs[0] === 'rust' && dirs.length > 1 ? dirs.splice(0, 2).join('/') : dirs.shift() || 'root';
  const [layer = 'root', feature = 'root'] = dirs.filter(dir => dir !== 'src');
  return { owner: [packageName, layer, feature].join(':'), package: packageName, layer, feature, rule: 'package-layer-feature-v1', fallback: true };
}
function resolveOwnership(paths, map, { clusters = [], edges = [] } = {}) {
  if (map?.schemaVersion !== 1 || !Array.isArray(map.rules) || Object.keys(map).some(k => !['schemaVersion', 'rules'].includes(k))) throw new Error('ownership map: expected schemaVersion 1 and rules');
  const ids = new Set();
  const rules = map.rules.map((rule, i) => {
    const at = 'ownership map rules[' + i + ']';
    if (!rule || ['id', 'owner', 'glob'].some(k => typeof rule[k] !== 'string' || !rule[k].trim()) || !Number.isSafeInteger(rule.priority)) throw new Error(at + ': id/owner/glob and integer priority required');
    if (Object.keys(rule).some(k => !['id', 'owner', 'glob', 'priority'].includes(k)) || ids.has(rule.id)) throw new Error(at + ': unknown field or duplicate id');
    ids.add(rule.id);
    try {
      const glob = sourcePath(rule.glob);
      if (/[\[\]{}()!]/.test(glob) || glob.split('/').some(p => p.includes('**') && p !== '**')) throw new Error('unsupported glob; use *, ?, or whole-segment **');
      return { ...rule, glob };
    } catch (error) { throw new Error(at + '.glob: ' + error.message); }
  }).sort((a, b) => b.priority - a.priority || compare(a.id, b.id));
  const files = [...new Set(paths.map(sourcePath))].sort().map(file => {
    const matches = rules.filter(rule => globRegex(rule.glob).test(file));
    return { path: file, matchedRules: matches.map(rule => rule.id), ...(matches.length ? { owner: matches[0].owner, rule: matches[0].id, fallback: false } : fallbackOwner(file)) };
  });
  const byPath = new Map(files.map(file => [file.path, file.owner]));
  const owner = member => { const value = byPath.get(sourcePath(member)); if (!value) throw new Error('Unknown ownership member: ' + member); return value; };
  return { mapIdentity: fingerprint({ schemaVersion: map.schemaVersion, rules }), files,
    clusters: clusters.map(cluster => ({ id: cluster.id, owners: [...new Set(cluster.members.map(owner))].sort() })).sort((a, b) => compare(a.id, b.id)),
    crossings: edges.map(edge => ({ ...edge, sourceOwner: owner(edge.source), targetOwner: owner(edge.target), crossOwner: owner(edge.source) !== owner(edge.target) })).sort((a, b) => compare(a.source, b.source) || compare(a.target, b.target)) };
}
module.exports = { resolveOwnership };
