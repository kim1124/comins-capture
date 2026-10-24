import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {run} from '../../scripts/stage-npm-package.mjs';

const ref='refs/heads/codex-governance-v111';
const env={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'kim1124/comins-capture',GITHUB_WORKFLOW_REF:`kim1124/comins-capture/.github/workflows/publish.yml@${ref}`,GITHUB_REF:ref,RUNNER_TEMP:'/owned-runner-temp',GITHUB_SHA:'synthetic-sha',ACTIONS_ID_TOKEN_REQUEST_URL:'synthetic-request',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'synthetic-placeholder',GITHUB_TOKEN:'synthetic-gh-placeholder',NPM_ID_TOKEN:'synthetic-override',NPM_CONFIG_PROVENANCE:'false',NPM_TOKEN:'synthetic-fallback',NODE_AUTH_TOKEN:'synthetic-fallback',npm_config_userconfig:'/private-config',NPM_CONFIG_TOKEN:'synthetic-fallback'};
const pkg={name:'comins-capture',version:'0.0.2'};
const stageId='00000000-0000-4000-8000-000000000001';
const success=()=>JSON.stringify({'comins-capture':{name:pkg.name,version:pkg.version,stageId,files:[{path:'private-unused'}]}});
function execute({stdout=success(),stderr='',exit=0,signal=null,hang=false,spawnError=false,...options}={}){
  const output=[],calls=[],kills=[],cleanups=[];
  return run({env,packageJson:pkg,args:['./package-artifact/comins-capture-0.0.2.tgz'],
    prepare:async()=>({workspace:'/owned-runner-temp/unique',artifact:'/artifact/comins-capture-0.0.2.tgz',npmCli:'/official/npm-cli.js',npmVersion:'11.17.0'}),
    cleanup:async p=>cleanups.push(p),write:v=>output.push(v),
    spawn:(command,args,opts)=>{
      calls.push({command,args,opts});const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();
      child.kill=s=>{kills.push(s);queueMicrotask(()=>child.emit('close',null,s));return true;};
      queueMicrotask(()=>{if(spawnError){child.emit('error',Error('synthetic-sensitive-error'));return;}child.stdout.emit('data',Buffer.from(stdout));child.stderr.emit('data',Buffer.from(stderr));if(!hang)child.emit('close',exit,signal);});return child;
    },...options}).then(code=>({code,report:JSON.parse(output.join('')),output:output.join(''),calls,kills,cleanups}));
}
test('stage wrapper requires official JSON acknowledgement and preserves genuine CLI with isolated config',async()=>{
  const r=await execute();assert.equal(r.code,0);assert.equal(r.report.outcome,'success');assert.deepEqual(r.report.acknowledgement,{name:pkg.name,version:pkg.version,stageId});assert.equal(r.calls.length,1);
  const {args,opts}=r.calls[0];assert.deepEqual(args.slice(0,4),['/official/npm-cli.js','stage','publish','/artifact/comins-capture-0.0.2.tgz']);
  for(const flag of ['--json','--ignore-scripts','--logs-max=0','--timing=false','--update-notifier=false','--registry=https://registry.npmjs.org/','--access=public','--loglevel=verbose','--color=false'])assert(args.includes(flag));
  for(const key of ['NPM_ID_TOKEN','NPM_CONFIG_PROVENANCE','NPM_TOKEN','NODE_AUTH_TOKEN','npm_config_userconfig','NPM_CONFIG_TOKEN'])assert.equal(opts.env[key],undefined);
  for(const key of ['GITHUB_SHA','GITHUB_TOKEN','ACTIONS_ID_TOKEN_REQUEST_URL','ACTIONS_ID_TOKEN_REQUEST_TOKEN'])assert.equal(opts.env[key],env[key]);
  assert.deepEqual(opts.stdio,['ignore','pipe','pipe']);assert.equal(opts.shell,false);assert.equal(opts.cwd,'/owned-runner-temp/unique');assert.equal(opts.env.TMPDIR,'/owned-runner-temp/unique/tmp');
  assert(args.includes('--userconfig=/owned-runner-temp/unique/userconfig'));assert(args.includes('--globalconfig=/owned-runner-temp/unique/globalconfig'));assert.deepEqual(r.cleanups,['/owned-runner-temp/unique']);
  const workflow=readFileSync(new URL('../../.github/workflows/publish.yml',import.meta.url),'utf8');assert.match(workflow,/node scripts\/stage-npm-package\.mjs "\.\/package-artifact\/\$PACKAGE_FILE"/);
});
test('stage wrapper blocks local, wrong identity/ref/version and nonlocal artifact before child creation',async()=>{
  for(const override of [{env:{}},{env:{...env,GITHUB_REF:'refs/heads/other'}},{env:{...env,GITHUB_WORKFLOW_REF:'other'}},{packageJson:{...pkg,version:'0.0.3'}},{args:['package-artifact/comins-capture-0.0.2.tgz']},{args:['./package-artifact/../comins-capture-0.0.2.tgz']},{args:[]}]){
    const r=await execute(override);assert.equal(r.code,1);assert.equal(r.report.outcome,'not_started');assert.equal(r.calls.length,0);
  }
  const r=await execute({prepare:async()=>({npmVersion:'11.21.1',workspace:'/owned'})});assert.equal(r.calls.length,0);assert.equal(r.report.reason,'preflight_failed');
});
test('stage wrapper never infers success from exit alone, wrong ack, malformed output or interruption',async()=>{
  for(const stdout of ['{}','{','[]',JSON.stringify({stageId}),success().replace('0.0.2','0.0.3'),success().replace(stageId,'not-an-id')]){
    const r=await execute({stdout});assert.equal(r.code,1);assert.equal(r.report.outcome,'unknown');assert.equal(r.report.acknowledgement,null);assert.equal(r.calls.length,1);
  }
  for(const o of [{exit:1},{signal:'SIGTERM'},{hang:true,timeoutMs:5},{stdout:'x'.repeat(2048),maxBytes:1024}]){
    const r=await execute(o);assert.equal(r.code,1);assert.notEqual(r.report.outcome,'success');assert.equal(r.calls.length,1);assert.equal(r.report.automaticRetry,false);
  }
});
test('stage wrapper emits closed OIDC/status/error metadata and discards synthetic sensitive output',async()=>{
  const hidden='synthetic-private-placeholder';
  const stderr=[`npm http fetch GET https://broker.actions.githubusercontent.com/synthetic?value=${hidden} 200 1ms`,'npm http fetch POST 404 https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/comins-capture 1ms',`npm verbose oidc Failed token exchange request with body message: ${hidden}`,'npm error code E401',`npm error ${hidden}`].join('\n');
  const r=await execute({exit:1,stdout:JSON.stringify({error:{code:'E401',summary:hidden,detail:hidden}}),stderr});
  assert.equal(r.report.oidc.brokerHttpStatus,200);assert.equal(r.report.oidc.exchangeHttpStatus,404);assert.equal(r.report.oidc.exchangeFailed,true);assert.equal(r.report.errorCode,'E401');assert(!r.output.includes(hidden));assert(!r.output.includes('https:'));assert(!r.output.includes('synthetic-'));assert.equal(r.report.acknowledgement,null);
  const unknown=await execute({exit:1,stderr:`npm error code ${hidden}`});assert.equal(unknown.report.errorCode,'other');assert(!unknown.output.includes(hidden));
  const thrown=await execute({spawn:()=>{throw Error(hidden);}});assert.equal(thrown.report.reason,'spawn_failed');assert(!thrown.output.includes(hidden));
});
test('stage wrapper bounds split stderr lines and output streams without recording raw values',async()=>{
  const r=await execute({stderr:'npm http fetch POST 201 https://registry.npmjs.org/-/stage/package/comins-capture 1ms (cache skip)\nnpm verbose oidc Enabling provenance\nnpm verbose oidc Successfully retrieved and set token\n'+'q'.repeat(10000)+'\n'});assert.equal(r.report.oidc.stageHttpStatus,201);assert.equal(r.report.oidc.provenanceAutoEnabled,true);assert.equal(r.report.oidc.exchangeTokenSet,true);assert.equal(r.report.outcome,'success');
  const r2=await execute({spawnError:true});assert.equal(r2.code,1);assert.equal(r2.report.reason,'spawn_failed');assert(!r2.output.includes('synthetic-sensitive-error'));
  assert.deepEqual(Object.keys(r.report),['schemaVersion','outcome','reason','automaticRetry','sideEffects','errorCode','oidc','acknowledgement']);
});
