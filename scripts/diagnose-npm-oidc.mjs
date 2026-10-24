import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const AUDIENCE='npm:registry.npmjs.org';
const EXCHANGE='https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/comins-capture';
const REF='refs/heads/codex-governance-v111';
const REPOSITORY='kim1124/comins-capture';
const WORKFLOW=`${REPOSITORY}/.github/workflows/publish.yml@${REF}`;
const LIMIT=65_536;
const present=value=>typeof value==='string'&&value.length>0;

// Parse only bounded transport JSON. ID tokens remain opaque; no JWT parsing.
async function readJson(response,signal){
  const reader=response.body?.getReader();if(!reader)throw Error();
  const abort=()=>{void reader.cancel().catch(()=>{});};
  signal.addEventListener('abort',abort,{once:true});
  let text='',bytes=0;
  try{
    const decoder=new TextDecoder('utf-8',{fatal:true});
    for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>LIMIT){abort();throw Error();}text+=decoder.decode(value,{stream:true});}
    text+=decoder.decode();return JSON.parse(text);
  }finally{signal.removeEventListener('abort',abort);reader.releaseLock();}
}
async function request(fetch,url,options,timeoutMs){
  const controller=new AbortController();let timer,timedOut=false,status=null;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;reject(Error());controller.abort();},timeoutMs);});
  try{
    return await Promise.race([timeout,(async()=>{
      const response=await fetch(url,{...options,redirect:'error',signal:controller.signal});
      status=Number.isInteger(response.status)&&response.status>=100&&response.status<=599?response.status:null;
      if(!response.ok){void response.body?.cancel().catch(()=>{});return {kind:'http',status};}
      try{return {kind:'ok',status,body:await readJson(response,controller.signal)};}catch{return {kind:'json',status};}
    })()]);
  }catch{return {kind:timedOut?'timeout':'network',status};}
  finally{clearTimeout(timer);}
}
function brokerUrl(value){
  try{
    const url=new URL(value);
    if(url.protocol!=='https:'||!url.hostname.endsWith('.actions.githubusercontent.com')||url.username||url.password||url.port||url.hash||!url.pathname.endsWith('/idtoken')||url.searchParams.has('audience'))return;
    url.searchParams.append('audience',AUDIENCE);return url;
  }catch{return;}
}

function initialReport(env){
  return {schemaVersion:1,stage:'preflight',reason:'preflight_failed',brokerHttpStatus:null,exchangeHttpStatus:null,tokenSource:'none',brokerAttempted:false,exchangeAttempted:false,
    presence:{overrideToken:present(env.NPM_ID_TOKEN),requestUrl:present(env.ACTIONS_ID_TOKEN_REQUEST_URL),requestToken:present(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN),idToken:false,exchangeToken:false},
    environmentMatches:{actions:env.GITHUB_ACTIONS==='true',repository:env.GITHUB_REPOSITORY===REPOSITORY,workflow:env.GITHUB_WORKFLOW_REF===WORKFLOW,ref:env.GITHUB_REF===REF,version:env.REQUESTED_VERSION==='0.0.2'}};
}

/** Read-only token exchange diagnostic. No npm config writes, staging or publication. */
export async function run({env=process.env,packageJson,fetch=globalThis.fetch,write=value=>process.stdout.write(value),timeoutMs=10_000}={}){
  const report=initialReport(env);
  let idToken,body;
  try{
    packageJson??=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
    if(!Object.values(report.environmentMatches).every(Boolean)||packageJson.name!=='comins-capture'||packageJson.version!=='0.0.2'||!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>30_000)return finish();
    // npm 11.17 gives a truthy NPM_ID_TOKEN precedence over the GitHub broker.
    if(report.presence.overrideToken){idToken=env.NPM_ID_TOKEN;report.tokenSource='environment';}
    else{
      if(!report.presence.requestUrl||!report.presence.requestToken){report.reason='missing_request';return finish();}
      const url=brokerUrl(env.ACTIONS_ID_TOKEN_REQUEST_URL);if(!url){report.reason='invalid_broker';return finish();}
      report.stage='github-request';report.tokenSource='github';report.brokerAttempted=true;
      const result=await request(fetch,url.href,{method:'GET',headers:{Accept:'application/json','User-Agent':'comins-capture-oidc-diagnostic/1',Authorization:`Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`}},timeoutMs);
      report.brokerHttpStatus=result.status;
      if(result.kind!=='ok'){report.reason=reason(result.kind,'broker');return finish();}
      body=result.body;idToken=body?.value;body=undefined;
    }
    if(!present(idToken)||idToken.length>LIMIT){report.reason='missing_id_token';return finish();}
    report.presence.idToken=true;report.stage='registry-exchange';report.exchangeAttempted=true;
    const result=await request(fetch,EXCHANGE,{method:'POST',headers:{Accept:'application/json','User-Agent':'comins-capture-oidc-diagnostic/1',Authorization:`Bearer ${idToken}`}},timeoutMs);
    report.exchangeHttpStatus=result.status;
    if(result.kind!=='ok'){report.reason=reason(result.kind,'exchange');return finish();}
    body=result.body;report.presence.exchangeToken=present(body?.token)&&body.token.length<=LIMIT;body=undefined;
    if(!report.presence.exchangeToken){report.reason='missing_exchange_token';return finish();}
    report.stage='complete';report.reason='ok';return finish();
  }catch{report.reason='internal_error';return finish();}
  finally{idToken=undefined;body=undefined;}
  function finish(){write(JSON.stringify(report)+'\n');return report.reason==='ok'?0:1;}
}
function reason(kind,stage){return kind==='timeout'?'timeout':kind==='network'?'network_error':`${stage}_${kind}`;}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  run().then(code=>{process.exitCode=code;}).catch(()=>{process.stdout.write(JSON.stringify({...initialReport({}),reason:'internal_error'})+'\n');process.exitCode=1;});
}
