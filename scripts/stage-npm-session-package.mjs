import assert from 'node:assert/strict';
import {execFileSync,spawn as spawnChild} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,mkdtemp,readFile,realpath,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {run as checkIdentity} from './check-npm-public-identity.mjs';
import {loadNpmTools,verifyTransfer} from './session-stage-provenance.mjs';

const NAME='comins-capture',VERSION='0.0.2';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ERROR_CODES=new Set(['E401','E403','E404','ENEEDAUTH','EOTP','EINTEGRITY','ETIMEDOUT','ENOTFOUND','ECONNRESET','EAI_AGAIN','EACCES','EPERM','EUSAGE']);
const initial=()=>({schemaVersion:1,outcome:'not_started',reason:'preflight_failed',automaticRetry:false,sideEffects:'none',identityVerified:false,artifactVerified:false,provenanceVerified:false,stageId:null,pendingVerified:false,errorCode:null});
async function workspace(){const dir=await mkdtemp(join(tmpdir(),'capture-session-stage-'));try{for(const name of ['cache','logs','tmp'])await mkdir(join(dir,name));await writeFile(join(dir,'globalconfig'),'');await writeFile(join(dir,'package.json'),JSON.stringify({name:'capture-session-stage',private:true}));return dir;}catch{await rm(dir,{recursive:true,force:true});throw Error();}}
async function configPath(value){assert(isAbsolute(value)&&!/[\x00-\x1f]/.test(value));const path=await realpath(value);assert((await stat(path)).isFile());return path;}
async function sessionEnv(env,dir,validateConfig){
 const result={};const selectors=[];
 for(const [key,value] of Object.entries(env)){
  if(/^npm_config_userconfig$/i.test(key)){selectors.push(value);continue;}
  if(/^npm_config_/i.test(key)||['ACTIONS_ID_TOKEN_REQUEST_URL','ACTIONS_ID_TOKEN_REQUEST_TOKEN','SIGSTORE_ID_TOKEN','NPM_TOKEN','NODE_AUTH_TOKEN','NPM_AUTH_TOKEN','NPM_ID_TOKEN','NPM_USERNAME','NPM_PASSWORD','NPM_EMAIL'].includes(key.toUpperCase()))continue;
  result[key]=value;
 }
 if(selectors.length){assert.equal(new Set(selectors).size,1);result.NPM_CONFIG_USERCONFIG=await validateConfig(selectors[0]);}
 for(const key of ['TMPDIR','TEMP','TMP'])result[key]=join(dir,'tmp');return result;
}
function flags(dir){return ['--registry=https://registry.npmjs.org/','--logs-max=0','--timing=false','--update-notifier=false',`--globalconfig=${join(dir,'globalconfig')}`,`--cache=${join(dir,'cache')}`,`--logs-dir=${join(dir,'logs')}`];}
function collect(child,{timeoutMs,maxBytes}){
 return new Promise(resolveResult=>{
  let finished=false,bytes=0,stdout='',forced=null,killTimer,started=Number.isInteger(child.pid);const timer=setTimeout(()=>stop('timeout'),timeoutMs);
  function stop(reason){if(forced||finished)return;forced=reason;child.kill('SIGTERM');killTimer=setTimeout(()=>{if(!finished)child.kill('SIGKILL');},250);}
  function finish(exit,signal,error=false){if(finished)return;finished=true;clearTimeout(timer);clearTimeout(killTimer);resolveResult({exit,signal,error,started,forced,stdout});stdout='';}
  function data(chunk,keep){if(finished||forced)return;bytes+=Buffer.byteLength(chunk);if(bytes>maxBytes){stop('output_limit');return;}if(keep)stdout+=chunk.toString('utf8');}
  child.stdout.on('data',c=>data(c,true));child.stderr.on('data',c=>data(c,false));child.on('spawn',()=>{started=true;});child.on('error',()=>finish(null,null,true));child.on('close',(exit,signal)=>finish(exit,signal));
 });
}
async function pending({execRead,options,stageId,manifest,directory,cliFlags}){
 const view=JSON.parse(execRead(['stage','view',stageId,'--json',...cliFlags],options));
 assert.equal(view.id,stageId);assert.equal(view.packageName,NAME);assert.equal(view.version,VERSION);
 const json=JSON.parse(execRead(['stage','download',stageId,'--json',...cliFlags],options));
 assert.equal(json?.[NAME]?.name,NAME);assert.equal(json?.[NAME]?.version,VERSION);
 const bytes=await readFile(join(directory,`${NAME}-${VERSION}-${stageId}.tgz`));
 return createHash('sha256').update(bytes).digest('hex')===manifest.tgzSHA256;
}

/** Explicit 0.0.2 exception: existing local session only; never approve/public-publish. */
export async function run({args=process.argv.slice(2),env=process.env,tools,verify=verifyTransfer,identity=checkIdentity,spawn=spawnChild,execRead,createWorkspace=workspace,cleanup=p=>rm(p,{recursive:true,force:true}),validateConfig=configPath,verifyPending=pending,write=v=>process.stdout.write(v),timeoutMs=150_000,maxBytes=1_048_576}={}){
 const report=initial();let dir;
 try{
  if(env.COMINS_CAPTURE_MANUAL_STAGE_0_0_2!=='true'||env.CI||env.GITHUB_ACTIONS||env.GITLAB_CI||env.CIRCLECI||args.length!==7||args[0]!=='--allow-manual-0.0.2'||!isAbsolute(args[1])||!Number.isInteger(timeoutMs)||timeoutMs<=0||timeoutMs>150_000||!Number.isInteger(maxBytes)||maxBytes<1024||maxBytes>1_048_576)return finish();
  const expected={name:NAME,version:VERSION,sourceSHA:args[2],runId:args[3],runAttempt:args[4],tgzSHA256:args[5],bundleSHA256:args[6]};
  assert.match(expected.sourceSHA,/^[a-f0-9]{40}$/);assert.match(expected.runId,/^[1-9][0-9]{0,19}$/);assert.match(expected.runAttempt,/^[1-9][0-9]{0,5}$/);assert.match(expected.tgzSHA256,/^[a-f0-9]{64}$/);assert.match(expected.bundleSHA256,/^[a-f0-9]{64}$/);
  tools??=await loadNpmTools();assert.equal(tools.npmVersion,'11.17.0');dir=await createWorkspace();assert(isAbsolute(dir));
  const childEnv=await sessionEnv(env,dir,validateConfig);const options={cwd:dir,env:childEnv,shell:false,stdio:['ignore','pipe','pipe'],encoding:'utf8',timeout:30_000,maxBuffer:1_048_576};
  const cliFlags=flags(dir);execRead??=((argv,opts)=>execFileSync(process.execPath,[tools.npmCli,...argv],opts));
  const verified=await verify({directory:args[1],expected,tools});report.artifactVerified=true;report.provenanceVerified=true;
  // Expected service identity stays in memory; standard npm alone reads existing credentials.
  const identityOptions={env,execNpm:(argv)=>execRead([...argv,...cliFlags],options),writeError:()=>{}};
  if(identity({...identityOptions,args:['--profile']})!==0||identity({...identityOptions,args:[]})!==0){report.reason='identity_failed';return finish();}report.identityVerified=true;
  const argv=[tools.npmCli,'stage','publish',verified.artifact,`--provenance-file=${verified.bundle}`,'--json','--ignore-scripts','--access=public','--tag=latest','--color=false','--progress=false',...cliFlags];
  let child;try{child=spawn(process.execPath,argv,{cwd:dir,env:childEnv,shell:false,stdio:['ignore','pipe','pipe']});}catch{report.reason='spawn_failed';return finish();}
  report.sideEffects='possible';report.outcome='unknown';
  const result=await collect(child,{timeoutMs,maxBytes});
  if(result.error){report.reason='spawn_failed';if(!result.started){report.outcome='not_started';report.sideEffects='none';}return finish();}
  if(result.forced){report.reason=result.forced;return finish();}if(result.signal){report.reason='interrupted';return finish();}
  let output;try{output=JSON.parse(result.stdout);}catch{report.reason='invalid_output';return finish();}
  if(output?.error?.code)report.errorCode=ERROR_CODES.has(output.error.code)?output.error.code:'other';
  const ack=output?.[NAME];
  if(result.exit!==0||output?.error||ack?.name!==NAME||ack?.version!==VERSION||typeof ack?.stageId!=='string'||!UUID.test(ack.stageId)){report.reason='missing_acknowledgement';return finish();}
  report.stageId=ack.stageId;report.reason='pending_unverified';
  report.pendingVerified=await verifyPending({execRead,options,stageId:ack.stageId,manifest:verified.manifest,directory:dir,cliFlags});
  if(!report.pendingVerified)return finish();report.outcome='success';report.sideEffects='staged';report.reason='staged_and_verified';return finish();
 }catch{report.reason=report.sideEffects==='possible'?'pending_unverified':'preflight_failed';return finish();}
 finally{if(dir)try{await cleanup(dir);}catch{/* Never expose raw cleanup errors or config paths. */}}
 function finish(){write(JSON.stringify(report)+'\n');return report.outcome==='success'?0:1;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 run().then(code=>{process.exitCode=code;}).catch(()=>{process.stdout.write(JSON.stringify({...initial(),outcome:'unknown',sideEffects:'possible',reason:'internal_error'})+'\n');process.exitCode=1;});
}
