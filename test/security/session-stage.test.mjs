import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {generate,verifyTransfer} from '../../scripts/session-stage-provenance.mjs';
import {run as stage} from '../../scripts/stage-npm-session-package.mjs';
const NAME='comins-capture',VERSION='0.0.2',sha='a'.repeat(40),runId='123456';
const issuer='https://token.actions.githubusercontent.com',uri='https://github.com/kim1124/comins-capture/.github/workflows/publish.yml@refs/heads/codex-governance-v111';
const digest=v=>createHash('sha256').update(v).digest('hex');
async function fixture(){const directory=await mkdtemp(join(tmpdir(),'capture-session-test-'));await writeFile(join(directory,NAME+'-'+VERSION+'.tgz'),'synthetic artifact');return directory;}
function statement(subject){return {_type:'https://in-toto.io/Statement/v1',subject:[subject],predicateType:'https://slsa.dev/provenance/v1',predicate:{buildDefinition:{buildType:'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1',externalParameters:{workflow:{ref:'refs/heads/codex-governance-v111',repository:'https://github.com/kim1124/comins-capture',path:'.github/workflows/publish.yml'}},resolvedDependencies:[{uri:'git+https://github.com/kim1124/comins-capture@refs/heads/codex-governance-v111',digest:{gitCommit:sha}}]},runDetails:{builder:{id:'https://github.com/actions/runner/github-hosted'},metadata:{invocationId:`https://github.com/kim1124/comins-capture/actions/runs/${runId}/attempts/1`}}}};}
function tools(){const calls=[];return {calls,npmVersion:'11.17.0',npmCli:'/official/npm-cli.js',toPurl:spec=>{assert.deepEqual(spec,{name:NAME,version:VERSION});return 'pkg:npm/comins-capture@0.0.2';},manifest:async()=>({name:NAME,version:VERSION}),generateProvenance:async(subject,opts)=>{calls.push(['generate',subject,opts]);return {synthetic:true,statement:statement(subject[0])};},verifyProvenance:async(subject,path)=>{calls.push(['verifySubject',subject,path]);return JSON.parse(await readFile(path,'utf8'));},verify:async(bundle,opts)=>{calls.push(['verifyIdentity',bundle,opts]);assert.deepEqual(opts,{certificateIssuer:issuer,certificateIdentityURI:uri});},bundleFromJSON:bundle=>({content:{$case:'dsseEnvelope',dsseEnvelope:{payloadType:'application/vnd.in-toto+json',payload:new TextEncoder().encode(JSON.stringify(bundle.statement))}}})};}
const env={GITHUB_RUN_ATTEMPT:'1',GITHUB_SERVER_URL:'https://github.com',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'kim1124/comins-capture',GITHUB_REF:'refs/heads/codex-governance-v111',GITHUB_WORKFLOW_REF:'kim1124/comins-capture/.github/workflows/publish.yml@refs/heads/codex-governance-v111',GITHUB_JOB:'prepare-session-stage',GITHUB_SHA:sha,GITHUB_RUN_ID:runId,REQUESTED_VERSION:VERSION};
test('session provenance links one canonical artifact/run/head through both standard verifiers',async()=>{const dir=await fixture(),api=tools();try{
 const manifest=await generate({directory:dir,env,tools:api,gitHead:()=>sha});assert.equal(manifest.sourceSHA,sha);assert.equal(manifest.runId,runId);assert.equal(manifest.tgzSHA256,digest('synthetic artifact'));assert.equal(api.calls.filter(c=>c[0]==='generate').length,1);assert.equal(api.calls.filter(c=>c[0]==='verifySubject').length,1);assert.equal(api.calls.filter(c=>c[0]==='verifyIdentity').length,1);
 const result=await verifyTransfer({directory:dir,expected:manifest,tools:api});assert.equal(result.manifest.name,NAME);assert.equal(api.calls.filter(c=>c[0]==='generate').length,1);
 await writeFile(result.artifact,'changed');await assert.rejects(verifyTransfer({directory:dir,expected:manifest,tools:api}));
}finally{await rm(dir,{recursive:true,force:true});}});
test('session provenance fails closed on context, digest, identity and package mismatch',async()=>{const dir=await fixture();try{
 for(const override of [{...env,GITHUB_SHA:'b'.repeat(40)},{...env,GITHUB_JOB:'stage'},{...env,REQUESTED_VERSION:'0.0.3'}])await assert.rejects(generate({directory:dir,env:override,tools:tools(),gitHead:()=>sha}));
 const api=tools();const manifest=await generate({directory:dir,env,tools:api,gitHead:()=>sha});
 for(const key of ['sourceSHA','runId','tgzSHA256','bundleSHA256'])await assert.rejects(verifyTransfer({directory:dir,expected:{...manifest,[key]:'bad'},tools:api}));
 for(const method of ['verifyProvenance','verify','manifest']){const bad={...tools(),[method]:async()=>{throw Error('synthetic-sensitive-placeholder');}};await assert.rejects(verifyTransfer({directory:dir,expected:manifest,tools:bad}));}
}finally{await rm(dir,{recursive:true,force:true});}});
test('signed statement rejects same artifact proof from another run, SHA, attempt or workflow',async()=>{const dir=await fixture();try{
 const api=tools(),manifest=await generate({directory:dir,env,tools:api,gitHead:()=>sha});const file=join(dir,NAME+'-'+VERSION+'.sigstore.json');const original=JSON.parse(await readFile(file,'utf8'));
 for(const mutation of [p=>p.predicate.runDetails.metadata.invocationId='https://github.com/kim1124/comins-capture/actions/runs/999/attempts/1',p=>p.predicate.runDetails.metadata.invocationId=`https://github.com/kim1124/comins-capture/actions/runs/${runId}/attempts/2`,p=>p.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit='b'.repeat(40),p=>p.predicate.buildDefinition.externalParameters.workflow.ref='refs/heads/other']){
  const proof=structuredClone(original);mutation(proof.statement);const text=JSON.stringify(proof);await writeFile(file,text);const changed={...manifest,bundleSHA256:digest(text)};await writeFile(join(dir,'session-stage.json'),JSON.stringify(changed));await assert.rejects(verifyTransfer({directory:dir,expected:changed,tools:api}));
 }
}finally{await rm(dir,{recursive:true,force:true});}});
const stageId='00000000-0000-4000-8000-000000000001';
async function runStage(overrides={}){
 const reports=[],calls=[],identities=[],api=tools();const manifest={name:NAME,version:VERSION,sourceSHA:sha,runId,runAttempt:'1',tgzSHA256:digest('pending fixture bytes'),bundleSHA256:'c'.repeat(64)};
 const result=await stage({args:['--allow-manual-0.0.2','/transfer',sha,runId,'1',manifest.tgzSHA256,manifest.bundleSHA256],env:{COMINS_CAPTURE_MANUAL_STAGE_0_0_2:'true',NPM_TOKEN:'synthetic-override',NPM_ID_TOKEN:'synthetic-override',npm_config_userconfig:'/approved/userconfig'},tools:api,
 createWorkspace:async()=>'/owned/temp',cleanup:async()=>{},validateConfig:async p=>p,
 verify:async()=>({manifest,artifact:'/transfer/comins-capture-0.0.2.tgz',bundle:'/transfer/comins-capture-0.0.2.sigstore.json'}),identity:opts=>{identities.push(opts.args);return 0;},
 execRead:(args,opts)=>{calls.push({read:args,opts});if(args[1]==='view')return JSON.stringify({id:stageId,packageName:NAME,version:VERSION});return '{}';},verifyPending:async()=>true,
 spawn:(cmd,args,opts)=>{calls.push({stage:args,opts});const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{queueMicrotask(()=>child.emit('close',null,'SIGTERM'));};queueMicrotask(()=>{child.stdout.emit('data',Buffer.from(JSON.stringify({[NAME]:{name:NAME,version:VERSION,stageId}})));child.emit('close',0,null);});return child;},write:v=>reports.push(v),...overrides});
 return {result,report:JSON.parse(reports.join('')),text:reports.join(''),calls,identities};
}
test('local session stages once with explicit exception, fresh gates and existing config selector only',async()=>{
 const r=await runStage();assert.equal(r.result,0);assert.equal(r.report.outcome,'success');assert.equal(r.report.pendingVerified,true);assert.deepEqual(r.identities,[['--profile'],[]]);
 const invocation=r.calls.find(c=>c.stage);assert(invocation);assert.equal(r.calls.filter(c=>c.stage).length,1);assert(invocation.stage.includes('--provenance-file=/transfer/comins-capture-0.0.2.sigstore.json'));assert(invocation.stage.includes('--ignore-scripts'));assert(!invocation.stage.some(a=>a.startsWith('--provenance=')));assert.equal(invocation.opts.env.NPM_TOKEN,undefined);assert.equal(invocation.opts.env.NPM_ID_TOKEN,undefined);assert.equal(invocation.opts.env.NPM_CONFIG_USERCONFIG,'/approved/userconfig');assert.equal(invocation.opts.cwd,'/owned/temp');assert.deepEqual(invocation.opts.stdio,['ignore','pipe','pipe']);
});
test('local session stops before stage for missing opt-in, CI, bad binding, identity or proof failure',async()=>{
 for(const opts of [{env:{}},{env:{COMINS_CAPTURE_MANUAL_STAGE_0_0_2:'true',GITHUB_ACTIONS:'true'}},{args:[]},{identity:()=>1},{verify:async()=>{throw Error('synthetic-sensitive-placeholder');}}]){const r=await runStage(opts);assert.equal(r.result,1);assert.equal(r.calls.filter(c=>c.stage).length,0);assert(!r.text.includes('synthetic-sensitive-placeholder'));}
});
test('local session returns unknown on timeout, output cap, malformed acknowledgement or pending mismatch without retry',async()=>{
 for(const outcome of ['timeout','output','ack','pending']){let child;
 const opts=outcome==='pending'?{verifyPending:async()=>false}:{timeoutMs:5,maxBytes:1024,spawn:()=>{child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>queueMicrotask(()=>child.emit('close',null,'SIGTERM'));queueMicrotask(()=>{if(outcome==='timeout')return;child.stdout.emit('data',Buffer.from(outcome==='output'?'x'.repeat(2048):'{}'));child.emit('close',0,null);});return child;}};
 const r=await runStage(opts);assert.equal(r.result,1);assert.equal(r.report.outcome,'unknown');assert.equal(r.report.automaticRetry,false);assert.notEqual(r.report.sideEffects,'none');}
});

test('local production pending gate verifies genuine view/download shapes and exact downloaded digest',async()=>{
 const dir=await fixture();try{
  for(const changed of [false,true]){
   const r=await runStage({createWorkspace:async()=>dir,verifyPending:undefined,execRead:args=>{
    if(args[1]==='view')return JSON.stringify({id:stageId,packageName:NAME,version:VERSION,actor:'synthetic-private-placeholder'});
    assert.equal(args[1],'download');writeFileSync(join(dir,`${NAME}-${VERSION}-${stageId}.tgz`),changed?'changed bytes':'pending fixture bytes');return JSON.stringify({[NAME]:{name:NAME,version:VERSION}});
   }});
   assert.equal(r.result,changed?1:0);assert.equal(r.report.pendingVerified,!changed);assert.equal(r.calls.filter(c=>c.stage).length,1);assert(!r.text.includes('synthetic-private-placeholder'));
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('local session discards child errors and auth/broker environment overrides without a new credential',async()=>{
 const secret='synthetic-sensitive-placeholder';
 const r=await runStage({spawn:()=>{const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{};queueMicrotask(()=>{child.stdout.emit('data',Buffer.from(JSON.stringify({error:{code:'E401',summary:secret,detail:secret}})));child.stderr.emit('data',Buffer.from(secret));child.emit('close',1,null);});return child;}});
 assert.equal(r.result,1);assert.equal(r.report.errorCode,'E401');assert.equal(r.report.automaticRetry,false);assert(!r.text.includes(secret));
 for(const ci of ['true','false']){const r=await runStage({env:{COMINS_CAPTURE_MANUAL_STAGE_0_0_2:'true',GITHUB_ACTIONS:ci}});assert.equal(r.calls.filter(c=>c.stage).length,0);}
 const ci=await runStage({env:{COMINS_CAPTURE_MANUAL_STAGE_0_0_2:'true',CI:'1'}});assert.equal(ci.calls.filter(c=>c.stage).length,0);
 const rejected=await runStage({env:{COMINS_CAPTURE_MANUAL_STAGE_0_0_2:'true',npm_config_userconfig:'relative'},validateConfig:undefined});assert.equal(rejected.calls.filter(c=>c.stage).length,0);
});
