import {spawn as spawnChild} from 'node:child_process';
import {lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {dirname, isAbsolute, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const NAME='comins-capture',VERSION='0.0.2';
const REF='refs/heads/codex-governance-v111',REPO='kim1124/comins-capture';
const ARTIFACT=`./package-artifact/${NAME}-${VERSION}.tgz`;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODES=new Set(['E401','E403','E404','ENEEDAUTH','EOTP','EPRIVATE','EINTEGRITY','ETIMEDOUT','ECONNRESET','ENOTFOUND','EAI_AGAIN','ECONNREFUSED','EACCES','EPERM','EUSAGE','EINVALIDTAGNAME']);
const code=value=>typeof value==='string'?(CODES.has(value)?value:'other'):null;
const authEnv=new Set(['NODE_AUTH_TOKEN','NPM_TOKEN','NPM_AUTH_TOKEN','NPM_ID_TOKEN','NPM_USERNAME','NPM_PASSWORD','NPM_EMAIL']);

async function prepareChild(env){
  const artifact=resolve(ARTIFACT);
  if(!isAbsolute(env.RUNNER_TEMP)||!(await lstat(artifact)).isFile()||await realpath(artifact)!==artifact)throw Error();
  const npmRoot=resolve(dirname(process.execPath),'../lib/node_modules/npm');
  const npmPackage=JSON.parse(await readFile(join(npmRoot,'package.json'),'utf8'));
  if(npmPackage.name!=='npm'||npmPackage.version!=='11.17.0')throw Error();
  const workspace=await mkdtemp(join(env.RUNNER_TEMP,'capture-npm-stage-'));
  try{
    for(const name of ['cache','logs','tmp'])await mkdir(join(workspace,name));
    for(const name of ['userconfig','globalconfig'])await writeFile(join(workspace,name),'',{mode:0o600});
    // Stop config prefix traversal before it can reach the repository npmrc.
    await writeFile(join(workspace,'package.json'),JSON.stringify({name:'capture-stage-runner',private:true}));
    return {workspace,artifact,npmCli:join(npmRoot,'bin/npm-cli.js'),npmVersion:npmPackage.version};
  }catch{await rm(workspace,{recursive:true,force:true});throw Error();}
}
function childEnvironment(env,workspace){
  const child={};
  for(const [key,value] of Object.entries(env))if(!/^npm_config_/i.test(key)&&!authEnv.has(key.toUpperCase()))child[key]=value;
  // Preserve actual GitHub/Sigstore metadata; do not synthesize CLI headers or claims.
  for(const key of ['TMPDIR','TMP','TEMP'])child[key]=join(workspace,'tmp');
  return child;
}
function observeLine(line,report){
  // Raw URL/body text is matched only in memory and is never returned or logged.
  const broker=line.match(/^npm http fetch GET https:\/\/[^\s/]+\.actions\.githubusercontent\.com\/\S+ ([1-5][0-9]{2}) [0-9]+ms$/);
  const exchange=line.match(/^npm http fetch POST ([1-5][0-9]{2}) https:\/\/registry\.npmjs\.org\/-\/npm\/v1\/oidc\/token\/exchange\/package\/comins-capture [0-9]+ms(?: attempt #[0-9]+)?(?: \(cache [a-z]+\))?$/);
  const stage=line.match(/^npm http fetch POST ([1-5][0-9]{2}) https:\/\/registry\.npmjs\.org\/-\/stage\/package\/comins-capture [0-9]+ms(?: attempt #[0-9]+)?(?: \(cache [a-z]+\))?$/);
  if(broker)report.oidc.brokerHttpStatus=Number(broker[1]);
  if(exchange)report.oidc.exchangeHttpStatus=Number(exchange[1]);
  if(stage)report.oidc.stageHttpStatus=Number(stage[1]);
  if(line==='npm verbose oidc Enabling provenance')report.oidc.provenanceAutoEnabled=true;
  if(line==='npm verbose oidc Successfully retrieved and set token')report.oidc.exchangeTokenSet=true;
  if(line.startsWith('npm verbose oidc Failed token exchange request with body message: '))report.oidc.exchangeFailed=true;
  const error=line.match(/^npm error code (\S+)$/);if(error)report.errorCode=code(error[1]);
}
async function collect(child,report,{timeoutMs,maxBytes}){
  return new Promise(resolveResult=>{
    let started=Number.isInteger(child.pid),settled=false,bytes=0,stdout='',line='',dropping=false,forced=null,killTimer;
    const timer=setTimeout(()=>stop('timeout'),timeoutMs);
    function stop(reason){
      if(forced||settled)return;forced=reason;
      child.kill('SIGTERM');killTimer=setTimeout(()=>{if(!settled)child.kill('SIGKILL');},250);
    }
    function finish(exit,signal,error=false){
      if(settled)return;settled=true;clearTimeout(timer);clearTimeout(killTimer);
      if(line&&!dropping)observeLine(line,report);line='';
      resolveResult({exit,signal,error,forced,stdout,started});stdout='';
    }
    function accept(chunk,stderr){
      if(settled||forced)return;
      bytes+=Buffer.byteLength(chunk);if(bytes>maxBytes){stop('output_limit');return;}
      const text=chunk.toString('utf8');
      if(!stderr){stdout+=text;return;}
      for(const char of text){
        if(char==='\n'){if(!dropping)observeLine(line.replace(/\r$/,''),report);line='';dropping=false;}
        else if(!dropping){if(line.length>=8192){line='';dropping=true;}else line+=char;}
      }
    }
    child.stdout.on('data',chunk=>accept(chunk,false));child.stderr.on('data',chunk=>accept(chunk,true));
    child.on('spawn',()=>{started=true;});
    child.on('error',()=>finish(null,null,true));child.on('close',(exit,signal)=>finish(exit,signal));
  });
}

function initialReport(){return {schemaVersion:1,outcome:'not_started',reason:'preflight_failed',automaticRetry:false,sideEffects:'none',errorCode:null,
  oidc:{brokerHttpStatus:null,exchangeHttpStatus:null,stageHttpStatus:null,exchangeFailed:false,exchangeTokenSet:false,provenanceAutoEnabled:false},acknowledgement:null};}

/** Genuine npm CLI stage, emitting only bounded closed observations and public ack. */
export async function run({env=process.env,args=process.argv.slice(2),packageJson,spawn=spawnChild,prepare=prepareChild,cleanup=p=>rm(p,{recursive:true,force:true}),write=v=>process.stdout.write(v),timeoutMs=150_000,maxBytes=1_048_576}={}){
  const report=initialReport();
  let prepared;
  try{
    packageJson??=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
    if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!==REPO||env.GITHUB_REF!==REF||env.GITHUB_WORKFLOW_REF!==`${REPO}/.github/workflows/publish.yml@${REF}`||!env.ACTIONS_ID_TOKEN_REQUEST_URL||!env.ACTIONS_ID_TOKEN_REQUEST_TOKEN||packageJson.name!==NAME||packageJson.version!==VERSION||args.length!==1||args[0]!==ARTIFACT||!Number.isInteger(timeoutMs)||timeoutMs<=0||timeoutMs>150_000||!Number.isInteger(maxBytes)||maxBytes<1024||maxBytes>1_048_576)return finish();
    prepared=await prepare(env);
    if(prepared.npmVersion!=='11.17.0'||!isAbsolute(prepared.workspace)||!isAbsolute(prepared.artifact)||!isAbsolute(prepared.npmCli))return finish();
    const {workspace,artifact,npmCli}=prepared;
    const argv=[npmCli,'stage','publish',artifact,'--json','--ignore-scripts','--access=public','--tag=latest','--registry=https://registry.npmjs.org/','--logs-max=0','--timing=false','--update-notifier=false','--loglevel=verbose','--color=false','--progress=false',`--userconfig=${join(workspace,'userconfig')}`,`--globalconfig=${join(workspace,'globalconfig')}`,`--cache=${join(workspace,'cache')}`,`--logs-dir=${join(workspace,'logs')}`];
    // Provenance stays at npm's default so its official public-CI auto-enable runs.
    let child;
    try{child=spawn(process.execPath,argv,{cwd:workspace,env:childEnvironment(env,workspace),shell:false,stdio:['ignore','pipe','pipe']});}catch{report.reason='spawn_failed';return finish();}
    report.sideEffects='possible';
    const result=await collect(child,report,{timeoutMs,maxBytes});
    if(result.error){report.outcome=result.started?'unknown':'not_started';report.sideEffects=result.started?'possible':'none';report.reason=result.started?'child_error':'spawn_failed';return finish();}
    report.outcome='unknown';
    if(result.forced){report.reason=result.forced;return finish();}
    if(result.signal){report.reason='interrupted';return finish();}
    let json;
    try{json=JSON.parse(result.stdout);}catch{report.reason='invalid_output';return finish();}
    if(json?.error)report.errorCode=code(json.error.code)??report.errorCode;
    if(result.exit!==0){report.outcome='failed';report.reason='cli_error';return finish();}
    const ack=json?.[NAME];
    if(json?.error||!ack||ack.name!==NAME||ack.version!==VERSION||typeof ack.stageId!=='string'||!UUID.test(ack.stageId)){report.reason='invalid_acknowledgement';return finish();}
    report.acknowledgement={name:NAME,version:VERSION,stageId:ack.stageId};
    report.outcome='success';report.reason='staged';report.sideEffects='staged';return finish();
  }catch{report.reason=report.sideEffects==='possible'?'internal_error':'preflight_failed';if(report.sideEffects==='possible')report.outcome='unknown';return finish();}
  finally{if(prepared?.workspace)try{await cleanup(prepared.workspace);}catch{/* No raw cleanup errors or paths. */}}
  function finish(){write(JSON.stringify(report)+'\n');return report.outcome==='success'?0:1;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  run().then(code=>{process.exitCode=code;}).catch(()=>{process.stdout.write(JSON.stringify({...initialReport(),outcome:'unknown',reason:'internal_error',sideEffects:'possible'})+'\n');process.exitCode=1;});
}
