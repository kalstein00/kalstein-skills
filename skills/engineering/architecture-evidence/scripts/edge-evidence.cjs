'use strict';
const ts = require('typescript');
const path = require('node:path').posix;
const { fingerprint, canonicalJson, sourcePath } = require('./schema.cjs');
const RULES = 'typescript-binding-v1';
const order = (a, b) => canonicalJson(a).localeCompare(canonicalJson(b), 'en');
// Closed, in-memory source universe: no host filesystem or implicit library reads.
function classifyEdges(graph, sources) {
  if (ts.version !== '5.3.3') throw new Error('Expected pinned TypeScript 5.3.3');
  const files = new Map();
  for (const input of sources) {
    const file = sourcePath(input.path);
    if (typeof input.source !== 'string') throw new Error('source read failed: ' + file);
    if (input.fingerprint && input.fingerprint !== fingerprint(input.source)) throw new Error('source drift: ' + file);
    if (files.has(file)) throw new Error('duplicate source: ' + file);
    files.set(file, input.source);
  }
  const absolute = file => '/evidence/' + file;
  const relative = file => file.startsWith('/evidence/') ? file.slice(10) : file;
  const options = { allowJs: true, checkJs: true, noLib: true, noEmit: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext };
  const host = {
    getSourceFile: (name, version) => files.has(relative(name)) ? ts.createSourceFile(name, files.get(relative(name)), version, true) : undefined,
    getDefaultLibFileName: () => '', writeFile: () => { throw new Error('read-only evidence'); },
    getCurrentDirectory: () => '/evidence', getDirectories: () => [],
    fileExists: name => files.has(relative(name)), readFile: name => files.get(relative(name)),
    getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true, getNewLine: () => '\n',
    resolveModuleNames: (names, containing) => names.map(name => {
      if (!name.startsWith('.')) return undefined;
      const base = path.normalize(path.join(path.dirname(containing), name));
      const candidates = [base, ...['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'].map(ext => base + ext)];
      const found = candidates.find(file => files.has(relative(file)));
      return found ? { resolvedFileName: found } : undefined;
    })
  };
  const program = ts.createProgram([...files.keys()].filter(file => /\.[cm]?[jt]sx?$/.test(file)).sort().map(absolute), options, host);
  const checker = program.getTypeChecker();
  const nodes = new Map(graph.nodes.map(node => [node.id, node.identity]));
  const index = new Map();
  for (const file of program.getSourceFiles()) {
    const declarations = [];
    function visit(node) {
      if (ts.isFunctionDeclaration(node) && node.name && node.body) declarations.push(node);
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer &&
          (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) declarations.push(node);
      ts.forEachChild(node, visit);
    }
    visit(file);
    index.set(relative(file.fileName), { file, declarations });
  }
  const locate = identity => {
    const entry = index.get(identity?.path);
    if (!entry || entry.file.parseDiagnostics.length) return null;
    if (identity.kind === 'file') return entry.file;
    const matches = entry.declarations.filter(d => d.name.text === identity.qualifiedName);
    return matches.length === 1 ? matches[0] : null;
  };
  const binding = node => {
    let symbol = checker.getSymbolAtLocation(node);
    if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    return symbol?.declarations || [];
  };
  const entries = graph.edges.map(edge => {
    const source = nodes.get(edge.source), target = nodes.get(edge.target);
    const origin = locate(source), destination = locate(target);
    let proof = null;
    const scope = origin && ts.isVariableDeclaration(origin) ? origin.initializer : origin;
    function visit(node) {
      if (proof) return;
      if (node !== scope && ts.isFunctionLike(node)) return;
      let reference;
      if (edge.kind === 'calls' && ts.isCallExpression(node)) reference = node.expression;
      if (edge.kind === 'references' && ts.isIdentifier(node) && node !== node.parent?.name &&
          !ts.isImportSpecifier(node.parent) && !ts.isExportSpecifier(node.parent)) reference = node;
      if (edge.kind === 'imports' && ts.isImportDeclaration(node)) reference = node.moduleSpecifier;
      if (reference && binding(reference).includes(destination)) {
        proof = { sourcePath: source.path, targetPath: target.path, start: reference.getStart(), end: reference.end, rule: 'resolved-declaration-binding' };
      }
      ts.forEachChild(node, visit);
    }
    if (origin && destination) visit(scope);
    return { edge, classification: proof ? 'confirmed' : 'unresolved',
      reason: proof ? 'resolved-declaration-binding' : !origin || !destination ? 'source-or-identity-unavailable' : 'no-proven-binding', proof };
  }).sort(order);
  const inputIdentity = fingerprint([...files].sort(([a], [b]) => a < b ? -1 : 1));
  const result = { schemaVersion: 1, rules: RULES, inputIdentity, entries };
  return { ...result, identity: fingerprint(result) };
}
module.exports = { classifyEdges, RULES };
