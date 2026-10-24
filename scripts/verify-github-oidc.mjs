import {lstat, readFile} from 'node:fs/promises';
import {isAbsolute, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const REPO='kim1124/comins-capture',REF='refs/heads/codex-governance-v111';
const ISSUER='https://token.actions.githubusercontent.com',JWKS=ISSUER+'/.well-known/jwks';
const AUDIENCE='npm:registry.npmjs.org',LIMIT=65_536;
const fields={repository:REPO,workflow_ref:`${REPO}/.github/workflows/publish.yml@${REF}`,ref:REF,environment:'npm',subExpectedDefault:`repo:${REPO}:environment:npm`};
const initial=()=>({schemaVersion:1,stage:'preflight',reason:'preflight_failed',requestAudienceParameterPresent:false,brokerHttpStatus:null,jwksHttpStatus:null,signatureAndClaimsVerified:false,presence:Object.fromEntries(Object.keys(fields).map(k=>[k,null])),matches:Object.fromEntries(Object.keys(fields).map(k=>[k,null]))});
class TransportFailure extends Error{constructor(reason){super();this.reason=reason;}}
async function boundedText(response,signal){
  const reader=response.body?.getReader();if(!reader)throw Error();
  const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
  let text='',bytes=0;
  try{const decoder=new TextDecoder('utf-8',{fatal:true});for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>LIMIT){cancel();throw Error();}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
  finally{signal.removeEventListener('abort',cancel);reader.releaseLock();}
}
async function request(fetch,url,options,timeoutMs){
  const controller=new AbortController();let timer,status=null;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(new TransportFailure('timeout'));controller.abort();},timeoutMs);});
  try{return await Promise.race([timeout,(async()=>{
    const signal=options.signal?AbortSignal.any([options.signal,controller.signal]):controller.signal;
    const response=await fetch(url,{...options,redirect:'error',signal});
    status=Number.isInteger(response.status)&&response.status>=100&&response.status<=599?response.status:null;
    if(response.status!==200){void response.body?.cancel().catch(()=>{});return {kind:'http',status};}
    try{return {kind:'ok',status,text:await boundedText(response,signal)};}catch{return {kind:'body',status};}
  })()]);}catch(error){return {kind:error instanceof TransportFailure?'timeout':'network',status};}
  finally{clearTimeout(timer);}
}
async function loadJose(env){
  const root=env.JOSE_TOOLING_ROOT;if(!root||!isAbsolute(root))throw Error();
  const p=JSON.parse(await readFile(join(root,'node_modules/jose/package.json'),'utf8'));
  if(p.name!=='jose'||p.version!=='6.2.12'||p.license!=='MIT'||Object.keys(p.dependencies??{}).length||!(await lstat(join(root,'node_modules/jose/LICENSE.md'))).isFile())throw Error();
  return import(pathToFileURL(join(root,'node_modules/jose/dist/webapi/index.js')).href);
}
function verificationReason(error){
  if(error instanceof TransportFailure)return error.reason;
  if(error?.code==='ERR_JWT_EXPIRED')return 'jwt_expired';
  if(error?.code==='ERR_JWS_SIGNATURE_VERIFICATION_FAILED')return 'jwt_signature';
  if(error?.code==='ERR_JOSE_ALG_NOT_ALLOWED')return 'jwt_algorithm';
  if(error?.code==='ERR_JWT_CLAIM_VALIDATION_FAILED'){
    if(error.claim==='aud')return 'jwt_audience';if(error.claim==='iss')return 'jwt_issuer';return 'jwt_claim';
  }
  if(['ERR_JWKS_NO_MATCHING_KEY','ERR_JWKS_MULTIPLE_MATCHING_KEYS','ERR_JWKS_INVALID','ERR_JWK_INVALID','ERR_JWKS_TIMEOUT'].includes(error?.code))return 'jwks_error';
  return 'verification_failed';
}

/** Diagnostic only: standard library verifies signature/time/issuer/audience; no registry exchange. */
export async function run({env=process.env,packageJson,jose,fetch=globalThis.fetch,write=v=>process.stdout.write(v),timeoutMs=10_000}={}){
  const report=initial();let token,payload;
  try{
    packageJson??=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
    if(env.REQUESTED_VERSION!=='0.0.2'||env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!==REPO||env.GITHUB_REF!==REF||env.GITHUB_WORKFLOW_REF!==fields.workflow_ref||packageJson.name!=='comins-capture'||packageJson.version!=='0.0.2'||!env.ACTIONS_ID_TOKEN_REQUEST_URL||!env.ACTIONS_ID_TOKEN_REQUEST_TOKEN||!Number.isInteger(timeoutMs)||timeoutMs<=0||timeoutMs>10_000)return finish();
    let broker;try{broker=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);}catch{return finish();}
    if(broker.protocol!=='https:'||!broker.hostname.endsWith('.actions.githubusercontent.com')||broker.username||broker.password||broker.port||broker.hash)return finish();
    report.requestAudienceParameterPresent=broker.searchParams.has('audience');
    // Match npm's append behavior without inspecting or printing existing values.
    broker.searchParams.append('audience',AUDIENCE);
    jose??=await loadJose(env);
    report.stage='broker';
    const response=await request(fetch,broker.href,{method:'GET',headers:{Accept:'application/json',Authorization:`Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`}},timeoutMs);
    report.brokerHttpStatus=response.status;
    if(response.kind!=='ok'){report.reason=`broker_${response.kind}`;return finish();}
    try{token=JSON.parse(response.text)?.value;}catch{report.reason='broker_json';return finish();}finally{response.text=undefined;}
    if(typeof token!=='string'||!token||token.length>LIMIT){report.reason='missing_token';return finish();}
    let jwksRequests=0;
    const key=jose.createRemoteJWKSet(new URL(JWKS),{timeoutDuration:10_000,cooldownDuration:60_000,cacheMaxAge:60_000,[jose.customFetch]:async(url,options)=>{
      if(String(url)!==JWKS||options.method!=='GET'||++jwksRequests>1)throw new TransportFailure('jwks_request_limit');
      const result=await request(fetch,JWKS,{method:'GET',headers:options.headers,signal:options.signal},timeoutMs);
      report.jwksHttpStatus=result.status;
      if(result.kind!=='ok')throw new TransportFailure(`jwks_${result.kind}`);
      return new Response(result.text,{status:200,headers:{'content-type':'application/json'}});
    }});
    report.stage='verification';
    try{({payload}=await jose.jwtVerify(token,key,{issuer:ISSUER,audience:AUDIENCE,algorithms:['RS256'],requiredClaims:['iss','aud','exp','nbf','iat','sub']}));}
    catch(error){report.reason=verificationReason(error);return finish();}
    report.signatureAndClaimsVerified=true;
    for(const [field,expected] of Object.entries(fields)){
      const actual=payload[field==='subExpectedDefault'?'sub':field];
      report.presence[field]=typeof actual==='string'&&actual.length>0;report.matches[field]=actual===expected;
    }
    // Default-subject comparison is informational; it is not an npm trust condition.
    report.reason=['repository','workflow_ref','ref','environment'].every(k=>report.matches[k])?'ok':'claims_mismatch';report.stage='complete';return finish();
  }catch{report.reason='internal_error';return finish();}
  finally{token=undefined;payload=undefined;}
  function finish(){write(JSON.stringify(report)+'\n');return report.reason==='ok'?0:1;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  run().then(code=>{process.exitCode=code;}).catch(()=>{process.stdout.write(JSON.stringify({...initial(),reason:'internal_error'})+'\n');process.exitCode=1;});
}
