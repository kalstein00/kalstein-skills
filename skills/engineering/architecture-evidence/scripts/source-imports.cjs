'use strict';
const ts=require('typescript');
const {fingerprint,evidenceId,sourcePath}=require('./schema.cjs');
const path=require('node:path').posix;
const SOURCE='source-module-imports-v2:typescript@5.3.3';

// Resolve only literal ES module paths in the captured source universe. Never
// promote symbol-name guesses to file dependencies or read host files.
function sourceImportGraph(graph,sources) {
  if(ts.version!=='5.3.3')throw new Error('Expected pinned TypeScript 5.3.3');
  if(!Array.isArray(sources))throw new Error('Captured sources required for structural imports');
  const files=new Map(),gaps=[],edges=[];
  for(const s of sources){
    const p=sourcePath(s.path);
    if(files.has(p)||typeof s.source!=='string')throw new Error('Duplicate or unreadable source: '+p);
    if(s.fingerprint&&s.fingerprint!==fingerprint(s.source))throw new Error('Source drift: '+p);
    files.set(p,s.source);
  }
  const names=[...files.keys()].sort();
  const nodes=names.map(p=>({id:evidenceId({kind:'file',path:p}),identity:{kind:'file',path:p}}));
  const ids=new Map(nodes.map(n=>[n.identity.path,n.id]));
  const prefix='/evidence/';
  const host={fileExists:p=>p.startsWith(prefix)&&files.has(p.slice(prefix.length)),
    readFile:p=>p.startsWith(prefix)?files.get(p.slice(prefix.length)):undefined};
  const options={moduleResolution:ts.ModuleResolutionKind.Node10,allowJs:true};
  for(const p of names){
    if(!/\.[cm]?[jt]sx?$/.test(p)){gaps.push({path:p,reason:'unsupported source language for module imports'});continue;}
    const file=ts.createSourceFile(p,files.get(p),ts.ScriptTarget.Latest,true);
    if(file.parseDiagnostics.length){gaps.push({path:p,reason:'source parse diagnostics',count:file.parseDiagnostics.length});continue;}
    function visit(node){
      if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)){
        const spec=node.moduleSpecifier;
        if(spec&&ts.isStringLiteral(spec)){
          if(!spec.text.startsWith('.')){
            gaps.push({path:p,specifier:spec.text,reason:'external or aliased module not resolved in captured sources'});
          }else{
            const resolved=ts.resolveModuleName(spec.text,prefix+p,options,host).resolvedModule?.resolvedFileName;
            const target=resolved?.startsWith(prefix)?path.normalize(resolved.slice(prefix.length)):null;
            if(!target||!ids.has(target))gaps.push({path:p,specifier:spec.text,reason:'relative module outside captured source universe'});
            else edges.push({kind:'imports',source:ids.get(p),target:ids.get(target),provenance:SOURCE,confidence:null,
              metadata:{specifier:spec.text,start:spec.getStart(file),end:spec.end,form:ts.isExportDeclaration(node)?'export':'import',
                // Inline `type` specifiers can leave import/export {} and module
                // effects under verbatimModuleSyntax. Only whole declarations
                // explicitly marked type-only are guaranteed to be erased.
                dependencyKind:(ts.isExportDeclaration(node)?node.isTypeOnly:node.importClause?.isTypeOnly)?'type-only':'value-capable'}});
          }
        }
      }else if(ts.isImportEqualsDeclaration(node)||ts.isImportTypeNode(node)||
        (ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||
          (ts.isIdentifier(node.expression)&&node.expression.text==='require')))){
        gaps.push({path:p,start:node.getStart(file),reason:'non-ES-declaration module reference not resolved'});
      }
      ts.forEachChild(node,visit);
    }
    visit(file);
  }
  const graphFiles=new Map(graph.files.map(f=>[f.path,f]));
  const sourceFiles=names.map(p=>graphFiles.get(p)||{path:p,language:/\.[cm]?tsx?$/.test(p)?'typescript':'javascript',errors:[]});
  const inputIdentity=fingerprint(names.map(p=>[p,files.get(p)]));
  return {...graph,id:fingerprint({graph:graph.id,source:SOURCE,inputIdentity,edges,gaps}),source:SOURCE,
    status:gaps.length?'partial':graph.status,files:sourceFiles,nodes,edges,importGaps:gaps};
}
module.exports={sourceImportGraph};
