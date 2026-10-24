import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {run as identity, validateCurrentIdentity} from '../../scripts/check-npm-public-identity.mjs';
import {validateInventory, verifyDigest} from '../../scripts/verify-release-artifact.mjs';

const person = {name:'comins-service',email:['service','example.test'].join('@')};
const env = {COMINS_NPM_PUBLIC_NAME:person.name,COMINS_NPM_PUBLIC_EMAIL:person.email};
function check(args=[], outputs={}, options={}) {
  const errors=[],calls=[];
  const result=identity({args,env,packageJson:{name:'comins-capture'},writeError:v=>errors.push(v),
    execNpm:(argv,opts)=>{
      calls.push({argv,opts});
      return JSON.stringify(argv[0]==='profile' ? outputs.profile : outputs[argv[2]]);
    },...options});
  return {result,errors,calls};
}
function failed(result) {
  assert.equal(result.result,1);
  assert.deepEqual(result.errors,['npm-public-identity-check: failed\n']);
}

test('identity rejects missing expectations, extra maintainers and unavailable registry without exposing values',()=>{
  failed(check([],{}, {env:{}}));
  failed(check([],{maintainers:[person,person]}));
  failed(check([],{}, {execNpm:()=>{throw Error(person.email);}}));
  failed(check([],{}, {execNpm:()=>'{'}));
  assert.equal(validateCurrentIdentity([person],person),true);
  assert.equal(validateCurrentIdentity([{...person,name:'other'}],person),false);
});

test('profile requires verified email, publishing 2FA and no personal fullname',()=>{
  const profile={...person,email_verified:true,tfa:{mode:'auth-and-writes'},fullname:''};
  assert.equal(check(['--profile'],{profile}).result,0);
  for(const override of [{email_verified:false},{tfa:null},{tfa:{mode:'auth-only'}},{fullname:'private profile'}]) {
    failed(check(['--profile'],{profile:{...profile,...override}}));
  }
});

test('bootstrap and trusted publication modes enforce distinct publisher metadata',()=>{
  const bootstrap={maintainers:[person],_npmUser:person,author:null,contributors:[]};
  const provider={name:'GitHub Actions',email:['actions','github.com'].join('@'),
    approver:person,trustedPublisher:{id:'github',oidcConfigId:'provider-id'}};
  assert.equal(check(['--bootstrap-version','0.0.1'],bootstrap).result,0);
  failed(check(['--version','0.0.1'],bootstrap));
  assert.equal(check(['--version','0.0.1'],{...bootstrap,_npmUser:provider}).result,0);
  for(const override of [{author:person},{contributors:[person]},
    {_npmUser:{...provider,approver:{...person,name:'other'}}}]) {
    failed(check(['--version','0.0.1'],{...bootstrap,_npmUser:provider,...override}));
  }
});

test('identity rejects range and tag input and always uses captured official registry queries',()=>{
  for(const v of ['latest','v0.0.1','0.0','01.0.0','0.0.1 || 1.0.0'])failed(check(['--version',v]));
  const r=check([],{maintainers:[[person]]});assert.equal(r.result,0);
  assert.equal(r.calls.length,1);
  assert.ok(r.calls[0].argv.includes('--registry=https://registry.npmjs.org/'));
  assert.deepEqual(r.calls[0].opts.stdio,['ignore','pipe','pipe']);
});

const manifest={name:'comins-capture',version:'0.0.1',private:false,publishConfig:{access:'public'},
  files:['dist','LICENSE','THIRD_PARTY_NOTICES.md'],exports:{'.':{types:'./dist/index.d.ts',import:'./dist/index.js'}}};
const paths=['package.json','LICENSE','THIRD_PARTY_NOTICES.md','dist/index.js','dist/index.d.ts',
  'dist/engine/vendor/LICENSE','dist/engine/vendor/provenance.json'];

test('artifact rejects excluded files, traversal, duplicate entries and missing legal/export evidence',()=>{
  assert.deepEqual(validateInventory(manifest,paths),paths);
  for(const bad of ['../private','.env','test/fixture.js','dist/../private','/tmp/private','dist\\private','dist/a\nb']) {
    assert.throws(()=>validateInventory(manifest,[...paths,bad]));
  }
  assert.throws(()=>validateInventory(manifest,[...paths,paths[0]]));
  for(const missing of ['LICENSE','dist/index.js','dist/engine/vendor/LICENSE','dist/engine/vendor/provenance.json']) {
    assert.throws(()=>validateInventory(manifest,paths.filter(p=>p!==missing)));
  }
});

test('artifact transfer detects changed bytes and rejects malformed digests',()=>{
  const temp=mkdtempSync(join(tmpdir(),'capture-digest-test-'));
  try {
    const file=join(temp,'package.tgz');writeFileSync(file,'reviewed bytes');
    const digest=createHash('sha256').update(readFileSync(file)).digest('hex');
    verifyDigest(file,digest);
    writeFileSync(file,'different bytes');assert.throws(()=>verifyDigest(file,digest));
    for(const invalid of ['',digest+'x','../digest'])assert.throws(()=>verifyDigest(file,invalid));
  } finally {rmSync(temp,{recursive:true,force:true});}
});

test('publish workflow limits OIDC to stage, preserves immutable artifact transfer and never publishes directly',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/publish.yml',import.meta.url),'utf8');
  assert.match(workflow,/workflow_dispatch:/);assert.doesNotMatch(workflow,/pull_request|push:/);
  assert.equal((workflow.match(/id-token: write/g)||[]).length,1);
  assert.ok(workflow.indexOf('id-token: write')>workflow.indexOf('  stage:'));
  assert.equal((workflow.match(/environment: npm/g)||[]).length,1);
  assert.match(workflow,/verify-release-artifact\.mjs --digest/);
  assert.equal(workflow.match(/^\s*npm stage publish "([^"]+)"/m)?.[1],'./package-artifact/$PACKAGE_FILE');
  assert.match(workflow,/npm stage publish/);assert.doesNotMatch(workflow,/\bnpm publish\b|NODE_AUTH_TOKEN|NPM_TOKEN/);
  assert.equal((workflow.match(/check-npm-public-identity\.mjs/g)||[]).length,2);
  for(const line of workflow.split('\n').filter(l=>l.includes('uses:')))assert.match(line,/@[a-f0-9]{40}\b/);
});
