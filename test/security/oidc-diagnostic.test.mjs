import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const runtime=await import('../../scripts/diagnose-npm-oidc.mjs').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return {};throw error;});
const secret=['opaque','secret','never-log'].join('-');
const environment=()=>({GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'kim1124/comins-capture',GITHUB_REF:'refs/heads/codex-governance-v111',GITHUB_WORKFLOW_REF:'kim1124/comins-capture/.github/workflows/publish.yml@refs/heads/codex-governance-v111',REQUESTED_VERSION:'0.0.2',ACTIONS_ID_TOKEN_REQUEST_URL:'https://vstoken.actions.githubusercontent.com/path/idtoken?api-version=2.0',ACTIONS_ID_TOKEN_REQUEST_TOKEN:secret});
const pkg={name:'comins-capture',version:'0.0.2'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status});
async function execute({env=environment(),packageJson=pkg,responses=[json({value:secret}),json({token:secret})],fetch:injected,timeoutMs=50}={}){
 assert.equal(typeof runtime.run,'function');const calls=[],logs=[];
 const fetch=injected??(async(url,options)=>{calls.push({url:String(url),options});const value=responses.shift();if(value instanceof Error)throw value;return value;});
 const code=await runtime.run({env,packageJson,fetch,timeoutMs,write:value=>logs.push(value)});
 assert.equal(logs.length,1);assert.ok(!logs[0].includes(secret));assert.ok(!/https?:|Bearer|@|idtoken\?|stack|message/.test(logs[0]));const report=JSON.parse(logs[0]);
 assert.deepEqual(Object.keys(report).sort(),['brokerHttpStatus','environmentMatches','exchangeHttpStatus','presence','reason','schemaVersion','stage','tokenSource','brokerAttempted','exchangeAttempted'].sort());
 for(const group of [report.environmentMatches,report.presence])for(const value of Object.values(group))assert.equal(typeof value,'boolean');
 assert.ok(['preflight','github-request','registry-exchange','complete'].includes(report.stage));
 assert.ok(['ok','preflight_failed','missing_request','invalid_broker','broker_http','broker_json','missing_id_token','exchange_http','exchange_json','missing_exchange_token','timeout','network_error','internal_error'].includes(report.reason));
 assert.ok(['none','environment','github'].includes(report.tokenSource));assert.equal(typeof report.brokerAttempted,'boolean');assert.equal(typeof report.exchangeAttempted,'boolean');
 for(const call of calls){assert.equal(call.options.headers['User-Agent'],'comins-capture-oidc-diagnostic/1');assert.equal(call.options.headers['npm-command'],undefined);assert.equal(call.options.redirect,'error');assert.ok(call.options.signal instanceof AbortSignal);assert.ok(!/stage|publish/.test(new URL(call.url).pathname));}
 return {code,report,calls};
}
test('diagnostic uses only official GitHub GET audience and package-specific npm exchange POST, with no credential output',async()=>{
 const {code,report,calls}=await execute();assert.equal(code,0);assert.equal(report.stage,'complete');assert.equal(report.reason,'ok');
 assert.equal(report.brokerHttpStatus,200);assert.equal(report.exchangeHttpStatus,200);assert.equal(report.presence.idToken,true);assert.equal(report.presence.exchangeToken,true);
 assert.equal(calls.length,2);const broker=new URL(calls[0].url);assert.equal(broker.searchParams.get('audience'),'npm:registry.npmjs.org');assert.equal(calls[0].options.method,'GET');
 assert.equal(calls[1].url,'https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/comins-capture');assert.equal(calls[1].options.method,'POST');assert.equal(calls[1].options.headers.Authorization,'Bearer '+secret);assert.equal(calls[1].options.body,undefined);
});
test('truthy NPM_ID_TOKEN overrides GitHub request exactly as npm 11.17; token remains opaque',async()=>{
 const env={...environment(),NPM_ID_TOKEN:secret};delete env.ACTIONS_ID_TOKEN_REQUEST_URL;delete env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
 const {code,report,calls}=await execute({env,responses:[json({token:secret})]});assert.equal(code,0);assert.equal(calls.length,1);assert.equal(report.presence.overrideToken,true);assert.equal(report.brokerHttpStatus,null);
 const fallback=await execute({env:{...environment(),NPM_ID_TOKEN:''}});assert.equal(fallback.calls.length,2);assert.equal(fallback.report.presence.overrideToken,false);
});
test('preflight/missing environment and untrusted broker never acquire tokens',async()=>{
 for(const options of [{env:{...environment(),GITHUB_REPOSITORY:'elsewhere'}},{env:{...environment(),REQUESTED_VERSION:'0.0.1'}},{packageJson:{...pkg,version:'0.0.1'}},{packageJson:{...pkg,name:'other'}}]){const r=await execute(options);assert.equal(r.code,1);assert.equal(r.report.reason,'preflight_failed');assert.equal(r.calls.length,0);}
 for(const key of ['ACTIONS_ID_TOKEN_REQUEST_TOKEN','ACTIONS_ID_TOKEN_REQUEST_URL']){const env=environment();delete env[key];const r=await execute({env});assert.equal(r.report.reason,'missing_request');assert.equal(r.calls.length,0);}
 const credentialedBroker=new URL(environment().ACTIONS_ID_TOKEN_REQUEST_URL);credentialedBroker.username='placeholder';credentialedBroker.password='placeholder';assert.equal(credentialedBroker.username,'placeholder');assert.equal(credentialedBroker.password,'placeholder');
 for(const url of ['http://vstoken.actions.githubusercontent.com/path/idtoken','https://evil.invalid/idtoken','https://actions.githubusercontent.com.evil.invalid/idtoken',credentialedBroker.href,'https://vstoken.actions.githubusercontent.com/path/other','https://vstoken.actions.githubusercontent.com:444/path/idtoken','https://vstoken.actions.githubusercontent.com/path/idtoken?audience=evil']){const r=await execute({env:{...environment(),ACTIONS_ID_TOKEN_REQUEST_URL:url}});assert.equal(r.report.reason,'invalid_broker');assert.equal(r.calls.length,0);}
});
test('HTTP rejection bodies and sensitive errors never reach logs or start subsequent steps',async()=>{
 for(const status of [301,400,401,403,404,429,500]){
  const broker=await execute({responses:[json({error:secret},status)]});assert.equal(broker.report.reason,'broker_http');assert.equal(broker.report.brokerHttpStatus,status);assert.equal(broker.calls.length,1);
  const exchange=await execute({responses:[json({value:secret}),json({error:secret},status)]});assert.equal(exchange.report.reason,'exchange_http');assert.equal(exchange.report.exchangeHttpStatus,status);assert.equal(exchange.calls.length,2);
 }
 const r=await execute({responses:[Error(secret)]});assert.equal(r.report.reason,'network_error');assert.equal(r.calls.length,1);
});
test('invalid JSON, absent tokens and secret-containing extra response fields are sanitized',async()=>{
 for(const [responses,reason]of [[[new Response(secret)],'broker_json'],[[json({private:secret})],'missing_id_token'],[[json({value:secret}),new Response(secret)],'exchange_json'],[[json({value:secret}),json({private:secret})],'missing_exchange_token']]){const r=await execute({responses});assert.equal(r.code,1);assert.equal(r.report.reason,reason);}
 const r=await execute({responses:[json({value:secret,private:secret}),json({token:secret,private:secret})]});assert.equal(r.code,0);
});
test('broker and exchange timeouts abort and emit only a closed timeout reason',async()=>{
 for(const exchange of [false,true]){let calls=0;const r=await execute({timeoutMs:5,fetch:async(_url,options)=>{calls++;if(exchange&&calls===1)return json({value:secret});return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error(secret)),{once:true}));}});assert.equal(r.report.reason,'timeout');assert.equal(r.code,1);assert.equal(calls,exchange?2:1);}
});

test('bounded transport bodies and hanging body/fetch cannot retain an unbounded operation',async()=>{
 const large=await execute({responses:[json({value:secret,extra:secret.repeat(10_000)})]});assert.equal(large.report.reason,'broker_json');assert.equal(large.calls.length,1);
 for(const bodyHang of [false,true]){const r=await execute({timeoutMs:5,fetch:async()=>bodyHang?new Response(new ReadableStream({start(){}})):new Promise(()=>{})});assert.equal(r.report.reason,'timeout');assert.equal(r.code,1);}
 for(const value of [null,[],{value:7},{value:{token:secret}}]){const r=await execute({responses:[json(value)]});assert.equal(r.report.reason,'missing_id_token');}
});
test('CLI preflight prints one fixed-schema result and no stderr even with secret environment mismatches',()=>{
 const result=spawnSync(process.execPath,['scripts/diagnose-npm-oidc.mjs'],{encoding:'utf8',env:{GITHUB_REPOSITORY:secret,NPM_ID_TOKEN:secret}});
 assert.equal(result.status,1);assert.equal(result.stderr,'');assert.ok(!result.stdout.includes(secret));assert.equal(JSON.parse(result.stdout).reason,'preflight_failed');
});
