'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync,spawn}=require('node:child_process');
const git=(root,args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();
function command(file,args,cwd,env=process.env){return new Promise((resolve,reject)=>{
 const child=spawn(file,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});let out='',error='';
 const timer=setTimeout(()=>{child.kill();reject(new Error('preparation command timed out'));},600000);
 child.stdout.on('data',b=>{out=(out+b).slice(-8192);});child.stderr.on('data',b=>{error=(error+b).slice(-8192);});
 child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);code===0?resolve(out):reject(new Error('preparation command failed ('+code+'): '+(error||out)));});
});}
async function prepareRuntime(skillRoot){
 if(Number(process.versions.node.split('.')[0])<24)throw new Error('Node 24+ is required for automatic preparation');
 const scripts=fs.readdirSync(path.join(skillRoot,'scripts')).filter(n=>n.endsWith('.cjs')&&!n.endsWith('.test.cjs')).sort();
 const files=['package.json','package-lock.json',...scripts.map(n=>'scripts/'+n)];
 const id=crypto.createHash('sha256').update(JSON.stringify([process.platform,process.arch,process.versions.modules,...files.map(n=>[n,fs.readFileSync(path.join(skillRoot,n),'utf8')])])).digest('hex');
 const base=process.env.ARCHITECTURE_EVIDENCE_CACHE||path.join(process.env.LOCALAPPDATA||process.env.XDG_CACHE_HOME||path.join(os.homedir(),'.cache'),'architecture-evidence');
 const runtime=path.resolve(base,id),ready=path.join(runtime,'ready.json'),lock=runtime+'.lock';fs.mkdirSync(path.dirname(runtime),{recursive:true});
 const valid=()=>fs.existsSync(ready)&&fs.existsSync(path.join(runtime,'node_modules/typescript/package.json'))&&fs.existsSync(path.join(runtime,'node_modules/dependency-cruiser/package.json'));
 if(valid())return {runtime,cacheHit:true};
 let fd;const deadline=Date.now()+120000;
 while(fd===undefined){try{fd=fs.openSync(lock,'wx');}catch(e){if(e.code!=='EEXIST')throw e;if(valid())return {runtime,cacheHit:true};if(Date.now()>deadline)throw new Error('runtime cache is locked; another preparation may still be running: '+lock);await new Promise(r=>setTimeout(r,500));}}
 try{
  if(valid())return {runtime,cacheHit:true};
  fs.mkdirSync(path.join(runtime,'scripts'),{recursive:true});for(const name of files)fs.copyFileSync(path.join(skillRoot,name),path.join(runtime,name));
  const npm=process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
  if(!fs.existsSync(npm))throw new Error('npm CLI not found beside Node; agent must locate npm before retrying');
  process.stderr.write('[architecture-evidence] preparing pinned tools in shared cache\n');
  await command(process.execPath,[npm,'ci','--no-audit','--no-fund'],runtime);
  await command(process.execPath,['-e',"require('typescript'); require('./node_modules/dependency-cruiser/package.json')"],runtime);
  fs.writeFileSync(ready,JSON.stringify({id,node:process.version}));return {runtime,cacheHit:false};
 }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
function prepareConfig(root,runtime,explicit){
 const output=path.join(root,'.codex/tmp/architecture-evidence');
 const exclude=path.resolve(root,git(root,['rev-parse','--git-path','info/exclude']));fs.mkdirSync(path.dirname(exclude),{recursive:true});
 let text=fs.existsSync(exclude)?fs.readFileSync(exclude,'utf8'):'';for(const entry of ['/.codex/tmp/architecture-evidence/'])if(!text.split(/\r?\n/).includes(entry))text+='\n'+entry+'\n';fs.writeFileSync(exclude,text);
 fs.mkdirSync(output,{recursive:true});
 if(explicit)return path.resolve(explicit);
 const saved=path.join(output,'scan-config.json');if(fs.existsSync(saved))return saved;
 const files=git(root,['ls-files','--cached','--others','--exclude-standard']).split('\n').filter(p=>!/(^|\/)(?:docs|vendor|vendored|fixtures|__fixtures__|node_modules|generated|dist|build|target|\.agents|\.codex)(?:\/|$)/.test(p));
 const projects=files.filter(p=>/(^|\/)tsconfig(?:\.(?:node|web|scripts|wdio))?\.json$/.test(p)).sort();
 const rules=files.filter(p=>/(^|\/)\.dependency-cruiser\.cjs$/.test(p)).sort();
 const config={surfaceProjects:projects,timeoutMs:600000,collectorHeapMb:1024};
 if(rules.length===1){const prefix=path.posix.dirname(rules[0]);const dir=prefix==='.'?'':prefix;const target=fs.existsSync(path.join(root,dir,'src'))?'src':null;if(target)config.dependencyCruiser={...(dir?{root:dir}:{}),configPath:rules[0],targets:[target]};}
 fs.writeFileSync(saved,JSON.stringify(config,null,2)+'\n',{flag:'wx'});return saved;
}
async function runPrepared(options){
 const root=path.resolve(options['--root']||'.');git(root,['rev-parse','--show-toplevel']);
 const preparation=await prepareRuntime(path.resolve(__dirname,'..'));
 const config=prepareConfig(root,preparation.runtime,options['--config']);
 require('./scan-support.cjs').validateConfig(JSON.parse(fs.readFileSync(config,'utf8')));
 const args=[path.join(preparation.runtime,'scripts/scan.cjs'),'--root',root,'--config',config];for(const flag of ['--reuse','--next'])if(options[flag])args.push(flag,path.resolve(options[flag]));
 return await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:root,env:{...process.env,ARCHITECTURE_EVIDENCE_RUNTIME:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});let out='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>process.stderr.write(b));child.on('error',reject);child.on('close',code=>{try{const result=JSON.parse(out);if(![0,1,2].includes(code))throw new Error('scan process failed: '+code);resolve({...result,preparation:{...preparation,config}});}catch(e){reject(e);}});});
}
module.exports={runPrepared,prepareRuntime,prepareConfig};
