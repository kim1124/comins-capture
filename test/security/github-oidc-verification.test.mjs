import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {run} from '../../scripts/verify-github-oidc.mjs';
const ref='refs/heads/codex-governance-v111',repo='kim1124/comins-capture';
const env={REQUESTED_VERSION:'0.0.2',GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:repo,GITHUB_REF:ref,GITHUB_WORKFLOW_REF:`${repo}/.github/workflows/publish.yml@${ref}`,ACTIONS_ID_TOKEN_REQUEST_URL:'https://broker.actions.githubusercontent.com/synthetic',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'synthetic-request-placeholder'};
const payload={repository:repo,workflow_ref:env.GITHUB_WORKFLOW_REF,ref,environment:'npm',sub:`repo:${repo}:environment:npm`};
const issuer='https://token.actions.githubusercontent.com',jwks=issuer+'/.well-known/jwks';
const secret='synthetic-private-placeholder';
async function execute({claims=payload,error,fetch:fetchOverride,...options}={}){
  const output=[],calls=[],verification=[];const customFetch=Symbol('customFetch');
  const jose={customFetch,createRemoteJWKSet:(url,opts)=>{assert.equal(url.href,jwks);assert.equal(opts.timeoutDuration,10000);return opts[customFetch];},jwtVerify:async(token,key,opts)=>{
    assert.equal(token,secret);verification.push(opts);assert.deepEqual(opts,{issuer,audience:'npm:registry.npmjs.org',algorithms:['RS256'],requiredClaims:['iss','aud','exp','nbf','iat','sub']});
    await key(jwks,{method:'GET',headers:new Headers(),signal:new AbortController().signal});if(error)throw error;return {payload:claims};}};
  const fetch=fetchOverride??(async(url,opts)=>{calls.push({url,opts});return new Response(JSON.stringify(url===jwks?{keys:[]}: {value:secret}),{status:200});});
  const code=await run({env,packageJson:{name:'comins-capture',version:'0.0.2'},jose,fetch,write:v=>output.push(v),...options});
  return {code,report:JSON.parse(output.join('')),text:output.join(''),calls,verification};
}
test('claims diagnostic verifies only fixed issuer/audience/RS256/JWKS before comparing signed claims',async()=>{
  const r=await execute();assert.equal(r.code,0);assert.equal(r.report.signatureAndClaimsVerified,true);assert(Object.values(r.report.matches).every(Boolean));assert.equal(r.calls.length,2);
  assert.equal(r.calls[0].opts.method,'GET');assert.equal(new URL(r.calls[0].url).searchParams.getAll('audience').at(-1),'npm:registry.npmjs.org');assert.equal(r.calls[1].url,jwks);assert.equal(r.calls[1].opts.headers.get('Authorization'),null);
  assert(!r.text.includes(secret));assert(!r.text.includes('https:'));assert(!r.text.includes(repo));
});
test('claims diagnostic reports only existing audience presence and preserves official append',async()=>{
 const r=await execute({env:{...env,ACTIONS_ID_TOKEN_REQUEST_URL:env.ACTIONS_ID_TOKEN_REQUEST_URL+'?audience=explicit-placeholder'}});assert.equal(r.report.requestAudienceParameterPresent,true);assert.deepEqual(new URL(r.calls[0].url).searchParams.getAll('audience'),['explicit-placeholder','npm:registry.npmjs.org']);
});
test('claims diagnostic compares custom claims only after verification and treats default subject as informational',async()=>{
  const r=await execute({claims:{...payload,sub:'synthetic-other-subject'}});assert.equal(r.code,0);assert.equal(r.report.matches.subExpectedDefault,false);assert.equal(r.report.reason,'ok');
  for(const key of ['repository','workflow_ref','environment','ref']){const r=await execute({claims:{...payload,[key]:secret}});assert.equal(r.code,1);assert.equal(r.report.reason,'claims_mismatch');assert(!r.text.includes(secret));}
  const missing=await execute({claims:{}});assert(Object.values(missing.report.presence).every(v=>v===false));
});
test('claims diagnostic maps library errors to closed enums without printing token/header/error/claim values',async()=>{
  for(const [code,claim,reason] of [['ERR_JWT_CLAIM_VALIDATION_FAILED','aud','jwt_audience'],['ERR_JWT_CLAIM_VALIDATION_FAILED','iss','jwt_issuer'],['ERR_JWT_EXPIRED','exp','jwt_expired'],['ERR_JWS_SIGNATURE_VERIFICATION_FAILED','', 'jwt_signature'],['ERR_JOSE_ALG_NOT_ALLOWED','', 'jwt_algorithm'],['unexpected',secret,'verification_failed']]){
    const r=await execute({error:Object.assign(Error(secret),{code,claim,kid:secret})});assert.equal(r.code,1);assert.equal(r.report.reason,reason);assert.equal(r.report.signatureAndClaimsVerified,false);assert(Object.values(r.report.matches).every(v=>v===null));assert(!r.text.includes(secret));
  }
});
test('claims diagnostic rejects preflight and transport failures without exchange, staging or leaked responses',async()=>{
  for(const override of [{env:{}},{env:{...env,REQUESTED_VERSION:'0.0.3'}},{env:{...env,GITHUB_REF:'wrong'}},{env:{...env,ACTIONS_ID_TOKEN_REQUEST_URL:'http://invalid.example.test'}},{packageJson:{name:'wrong',version:'0.0.2'}}]){const r=await execute(override);assert.equal(r.code,1);assert.equal(r.calls.length,0);}
  for(const fetch of [async()=>new Response(secret,{status:403}),async()=>new Response('{'),async()=>{throw Error(secret);},async()=>new Response('x'.repeat(70000))]){const r=await execute({fetch});assert.equal(r.code,1);assert(!r.text.includes(secret));}
  const timeout=await execute({fetch:async()=>new Promise(()=>{}),timeoutMs:5});assert.equal(timeout.report.reason,'broker_timeout');
});
test('claims workflow uses isolated pinned tooling and a mutually exclusive nonpublication job',()=>{
  const w=readFileSync(new URL('../../.github/workflows/publish.yml',import.meta.url),'utf8');const job=w.slice(w.indexOf('  verify-oidc-claims:'));
  assert.match(job,/inputs.mode == 'verify-oidc-claims'/);assert.match(job,/environment: npm/);assert.match(job,/id-token: write/);assert.match(job,/jose-6\.2\.12\.tgz/);assert.match(job,/--ignore-scripts/);assert.match(job,/--package-lock=false/);assert.match(job,/createHash\("sha512"\)/);assert.match(job,/node scripts\/verify-github-oidc\.mjs/);assert.doesNotMatch(job,/\bnpm (?:pack|stage|publish)\b|verify-release-artifact|needs:|upload-artifact|download-artifact/);
});
