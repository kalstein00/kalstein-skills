'use strict';
const ts=require('typescript'),path=require('node:path');
const {fingerprint,sourcePath,canonicalJson}=require('./schema.cjs');
const SOURCE='typescript@5.3.3:project-declaration-surface-v1';
const normalize=p=>ts.sys.useCaseSensitiveFileNames?p.replaceAll('\\','/'):p.replaceAll('\\','/').toLowerCase();
const storedValue=(kind,value)=>kind==='readFile'?(value===undefined?null:fingerprint(value)):Array.isArray(value)?value.map(normalize).sort():kind==='realpath'&&value?normalize(value):value??null;
function observe(kind,args){return storedValue(kind,ts.sys[kind](...args.map(a=>a===null?undefined:a)));}
function openProject(root,configPath){
  if(ts.version!=='5.3.3')throw new Error('Expected pinned TypeScript 5.3.3');
  root=path.resolve(root);const config=path.resolve(root,sourcePath(configPath)),records=new Map();
  const track=(kind,original)=>(...args)=>{const value=original(...args);args=args.map((a,i)=>i===0?normalize(path.resolve(a)):a??null);const key=canonicalJson([kind,args]),record={kind,args,value:storedValue(kind,value)};if(records.has(key)&&canonicalJson(records.get(key))!==canonicalJson(record))throw new Error('project input drift: '+args[0]);records.set(key,record);return value;};
  const sys={...ts.sys};for(const kind of ['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath'])if(sys[kind])sys[kind]=track(kind,ts.sys[kind].bind(ts.sys));
  const parsed=ts.getParsedCommandLineOfConfigFile(config,{}, {...sys,onUnRecoverableConfigFileDiagnostic:d=>{throw new Error('project config: '+ts.flattenDiagnosticMessageText(d.messageText,'\n'));}});
  if(!parsed||parsed.errors.length)throw new Error('project config: '+(parsed?.errors||[]).map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('; '));
  if(parsed.options.outFile)throw new Error('project config outFile is unsupported for per-file declaration surfaces');
  const options={...parsed.options,noEmit:false,declaration:true,emitDeclarationOnly:true,noEmitOnError:true,removeComments:true,incremental:false,composite:false};
  const host=ts.createCompilerHost(options);
  for(const kind of ['readFile','fileExists','directoryExists','getDirectories','realpath'])if(sys[kind])host[kind]=sys[kind];
  host.getSourceFile=(fileName,languageVersion,onError)=>{try{const text=host.readFile(fileName);return text===undefined?undefined:ts.createSourceFile(fileName,text,languageVersion,true);}catch(e){onError?.(e.message);return undefined;}};
  host.writeFile=()=>{throw new Error('project surface cannot write files');};
  const program=ts.createProgram({rootNames:parsed.fileNames,options,host,projectReferences:parsed.projectReferences});
  const directories=new Set();for(const file of program.getSourceFiles()){let dir=path.dirname(path.resolve(file.fileName));while(!directories.has(dir)){directories.add(dir);const parent=path.dirname(dir);if(parent===dir)break;dir=parent;}}
  for(const dir of directories){const manifest=path.join(dir,'package.json');if(sys.fileExists(manifest))sys.readFile(manifest);}
  const input=()=>({schemaVersion:1,source:SOURCE,root,config,options:JSON.parse(JSON.stringify(options)),records:[...records.values()].sort((a,b)=>canonicalJson([a.kind,a.args]).localeCompare(canonicalJson([b.kind,b.args]),'en'))});
  const files=parsed.fileNames.map(f=>path.relative(root,f).replaceAll('\\','/')).filter(f=>!f.startsWith('../'));
  return {program,input,files,root};
}
function analyzeProject(root,configPath){
  const project=openProject(root,configPath);
  // Declaration emit can resolve additional package subpaths. Capture the same
  // full-project observations regardless of which files the caller measures.
  const surface=require('./interface-surface.cjs').emitSurface(project.program,project.files.map(file=>({path:file})),SOURCE,file=>path.resolve(project.root,file));
  return {project,surface,input:project.input()};
}
function prepareProjectInput(root,configPath){const {project,input}=analyzeProject(root,configPath);return {status:'complete',configPath,files:project.files,input,identity:fingerprint(input)};}
function verifyProjectInput(input){return input.records.every(r=>canonicalJson(observe(r.kind,r.args))===canonicalJson(r.value));}
function collectProjectSurface(root,configPath,targets){
  const {project,surface,input}=analyzeProject(root,configPath),members=new Set(project.files);
  for(const file of targets)if(!members.has(sourcePath(file)))throw new Error('file outside configured project: '+file);
  const byPath=new Map(surface.files.map(file=>[file.path,file]));
  const population=targets.filter(file=>/\.(?:[cm]?ts|tsx)$/.test(file)).length;
  const files=targets.map(file=>{const measured=byPath.get(sourcePath(file));return {...measured,metric:{...measured.metric,population}};}).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  return {status:files.some(file=>file.validity!=='valid')?'partial':'complete',files,diagnostics:surface.diagnostics,configPath,input,inputIdentity:fingerprint(input)};
}
module.exports={collectProjectSurface,prepareProjectInput,verifyProjectInput};
