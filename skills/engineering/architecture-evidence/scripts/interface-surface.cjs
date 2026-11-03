'use strict';
const ts = require('typescript');
const path = require('node:path');
const { sourcePath, evidenceId, metricRecord, fingerprint } = require('./schema.cjs');
const SOURCE = 'typescript@5.3.3:declaration-surface-v1';
function surfaceBreakdown(parsed){
  const counts={typeDeclarations:0,valueDeclarations:0,typeReExports:0,valueCapableReExports:0,typeLocalExports:0,valueCapableLocalExports:0,exportAssignments:0};
  for(const s of parsed.statements){
    if(ts.isExportDeclaration(s)){
      const suffix=s.moduleSpecifier?'ReExports':'LocalExports';
      const entries=s.exportClause&&ts.isNamedExports(s.exportClause)?s.exportClause.elements:[s];
      for(const entry of entries)counts[(s.isTypeOnly||entry.isTypeOnly?'type':'valueCapable')+suffix]++;
    }else if(ts.isExportAssignment(s))counts.exportAssignments++;
    else if(s.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){
      const kind=ts.isInterfaceDeclaration(s)||ts.isTypeAliasDeclaration(s)?'typeDeclarations':'valueDeclarations';
      counts[kind]+=ts.isVariableStatement(s)?s.declarationList.declarations.length:1;
    }
  }
  return counts;
}
function collectInterfaceSurface(inputs) {
  if (ts.version !== '5.3.3') throw new Error('Expected pinned TypeScript 5.3.3');
  const ordered = inputs.map(i => ({ path: sourcePath(i.path), source: i.source })).sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (new Set(ordered.map(i => i.path)).size !== ordered.length) throw new Error('duplicate source path');
  if (new Set(ordered.map(i => i.path.toLowerCase())).size !== ordered.length) throw new Error('case-insensitive source path collision');
  const base = path.resolve('__architecture_evidence_input__');
  const sources = new Map(ordered.map(i => [path.resolve(base, i.path), i.source]));
  const options = { declaration: true, emitDeclarationOnly: true, removeComments: true, strict: true, types: [], jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10 };
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host), exists = host.fileExists.bind(host);
  const libRoot = path.resolve(path.dirname(ts.getDefaultLibFilePath(options))) + path.sep;
  host.readFile = p => sources.get(path.resolve(p)) ?? (path.resolve(p).startsWith(libRoot) ? read(p) : undefined);
  host.fileExists = p => sources.has(path.resolve(p)) || path.resolve(p).startsWith(libRoot) && exists(p);
  host.directoryExists = p => [...sources.keys()].some(f => f.startsWith(path.resolve(p) + path.sep));
  const program = ts.createProgram([...sources.keys()].filter(p => /\.(?:[cm]?ts|tsx)$/.test(p)), options, host);
  return {...emitSurface(program,ordered,SOURCE,file=>path.resolve(base,file)),inputIdentity:fingerprint(ordered)};
}
function emitSurface(program,inputs,source,resolvePath){
  const ordered=[...inputs].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  const diagnostics = ts.getPreEmitDiagnostics(program).map(d=>({code:d.code,file:d.file?.fileName||null,start:d.start??null,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}));
  const population=ordered.filter(i=>/\.(?:[cm]?ts|tsx)$/.test(i.path)).length;
  const files = ordered.map(input => {
    let declaration = null, surface = null, breakdown = null, reason;
    try {
      if (!/\.(?:[cm]?ts|tsx)$/.test(input.path)) throw new Error('unsupported language: TypeScript declarations only');
      const sf = program.getSourceFile(resolvePath(input.path));
      if (diagnostics.length) throw new Error('Compiler diagnostics: '+diagnostics.length+'; see shared diagnostics');
      const output = [];
      const emitted = program.emit(sf, (name, text) => { if (/\.d\.[cm]?ts$/.test(name)) output.push(text); });
      if (emitted.emitSkipped || emitted.diagnostics.length || output.length !== 1) throw new Error('declaration extraction failed or unsupported declaration input');
      declaration = output[0].replaceAll('\r\n', '\n');
      const parsed = ts.createSourceFile('surface.d.ts', declaration, ts.ScriptTarget.Latest, true);
      breakdown=surfaceBreakdown(parsed);
      surface=Object.values(breakdown).reduce((a,b)=>a+b,0);
    } catch (error) { reason = error.message; declaration = null; }
    const validity = reason ? 'unavailable' : 'valid';
    return { path: input.path, validity, ...(reason ? { reason } : {}), declaration, breakdown:reason?null:breakdown, fingerprint: reason ? null : fingerprint({ schema: source, declaration }), metric: metricRecord({ schemaVersion: 1, itemId: evidenceId({kind:'file',path:input.path}), name:'exportSurface', unit:'declaration-entries', direction:'higher', source, cohort:'typescript:file', population, validity, value:reason ? null : surface, ...(reason ? {reason} : {}) }) };
  });
  return { status: files.some(f=>f.validity !== 'valid') ? 'partial' : 'complete', files,diagnostics };
}
module.exports = { collectInterfaceSurface,emitSurface };
