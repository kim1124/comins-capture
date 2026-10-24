import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {run as identity, validateCurrentIdentity, validateManualSessionPublishedIdentity} from '../../scripts/check-npm-public-identity.mjs';
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

test('publish workflow isolates diagnostic OIDC from stage, preserves immutable artifact transfer and never publishes directly',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/publish.yml',import.meta.url),'utf8');
  assert.match(workflow,/workflow_dispatch:/);assert.doesNotMatch(workflow,/pull_request|push:/);
  assert.equal((workflow.match(/id-token: write/g)||[]).length,4);
  assert.ok(workflow.indexOf('id-token: write')>workflow.indexOf('  stage:'));
  assert.equal((workflow.match(/environment: npm/g)||[]).length,4);
  assert.match(workflow,/verify-release-artifact\.mjs --digest/);
  assert.equal(workflow.match(/^\s*node scripts\/stage-npm-package\.mjs "([^"]+)"/m)?.[1],'./package-artifact/$PACKAGE_FILE');
  assert.match(workflow,/node scripts\/stage-npm-package\.mjs/);assert.doesNotMatch(workflow,/\bnpm stage publish\b/);assert.doesNotMatch(workflow,/\bnpm publish\b|NODE_AUTH_TOKEN|NPM_TOKEN/);
  assert.equal((workflow.match(/check-npm-public-identity\.mjs/g)||[]).length,3);
  for(const line of workflow.split('\n').filter(l=>l.includes('uses:')))assert.match(line,/@[a-f0-9]{40}\b/);
});

test('diagnostic mode skips pack and stage while default stage retains the protected dependency route',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/publish.yml',import.meta.url),'utf8');
 assert.match(workflow,/mode:\n\s+description:[^\n]+\n\s+required: true\n\s+type: choice\n\s+default: stage\n\s+options:\n\s+- stage\n\s+- diagnose-oidc/);
 for(const name of ['verify-and-pack','stage']){const job=workflow.slice(workflow.indexOf('  '+name+':')).split(/\n  [a-z][a-z-]+:/)[0];assert.match(job,/if:.*inputs.mode == 'stage'.*github.ref == 'refs\/heads\/codex-governance-v111'/);}
 const stage=workflow.slice(workflow.indexOf('  stage:'));assert.match(stage,/needs: verify-and-pack/);
 const diagnostic=workflow.slice(workflow.indexOf('  diagnose-oidc:')).split('\n  # Claims verification')[0];assert.match(diagnostic,/if:.*inputs.mode == 'diagnose-oidc'.*github.ref == 'refs\/heads\/codex-governance-v111'/);
 assert.match(diagnostic,/environment: npm/);assert.match(diagnostic,/id-token: write/);assert.match(diagnostic,/REQUESTED_VERSION: \$\{\{ inputs.version \}\}/);
 assert.match(diagnostic,/run: node scripts\/diagnose-npm-oidc\.mjs/);assert.equal((diagnostic.match(/\brun:/g)||[]).length,1);assert.doesNotMatch(diagnostic,/npm (?:ci|install|stage|publish|pack)|verify-and-pack|needs:|upload-artifact|download-artifact/);
});

test('manual publisher exception is explicit and limited to comins-capture0.0.2 without changing default policy',()=>{
 const metadata={maintainers:[person],_npmUser:person,author:null,contributors:[]};
 const opt={env:{...env,COMINS_CAPTURE_MANUAL_STAGE_0_0_2:'true'}};
 assert.equal(check(['--manual-session-version','0.0.2'],metadata,opt).result,0);
 failed(check(['--manual-session-version','0.0.2'],metadata));
 for(const version of ['0.0.1','0.0.3','1.0.0'])failed(check(['--manual-session-version',version],metadata,opt));
 failed(check(['--version','0.0.2'],metadata,opt));
 for(const override of [{author:person},{contributors:[person]},{_npmUser:{...person,trustedPublisher:{id:'github'}}},{maintainers:[person,person]}])failed(check(['--manual-session-version','0.0.2'],{...metadata,...override},opt));
});
test('session preparation is a separate0.0.2 canonical one-pack proof job and default stage guards are unchanged',()=>{
 const w=readFileSync(new URL('../../.github/workflows/publish.yml',import.meta.url),'utf8');
 const job=w.slice(w.indexOf('  prepare-session-stage:')).split('\n  # This mutually exclusive')[0];
 assert.match(job,/inputs.mode == 'prepare-session-stage'.*inputs.version == '0.0.2'.*github.ref == 'refs\/heads\/codex-governance-v111'/);
 assert.match(job,/environment: npm/);assert.match(job,/id-token: write/);assert.match(job,/npm run verify/);assert.match(job,/node --test test\/security\/\*\.test\.mjs/);
 assert.equal((job.match(/node scripts\/verify-release-artifact\.mjs\)/g)||[]).length,1);
 assert.match(job,/node scripts\/session-stage-provenance\.mjs generate/);assert.match(job,/comins-capture-0\.0\.2\.sigstore\.json/);assert.match(job,/session-stage\.json/);assert.match(job,/npm-session-stage-/);
 assert.doesNotMatch(job,/npm stage|npm publish|stage-npm-session-package|download-artifact|needs:/);
 const ordinary=w.slice(w.indexOf('  verify-and-pack:')).split('\n  stage:')[0];assert.doesNotMatch(ordinary,/id-token: write|environment: npm|generateProvenance/);assert.match(ordinary,/inputs.mode == 'stage'/);
});

test('manual0.0.2 validator accepts only an absent or exact approved two-own-key approver',()=>{
 const base={maintainers:[person],npmUser:person,author:null,contributors:[]};
 for(const approver of [undefined,null,{...person}])assert.equal(validateManualSessionPublishedIdentity({...base,npmUser:{...person,approver}},person),true);
 const inherited=Object.create(person),missingOwn=Object.assign(Object.create({email:person.email}),{name:person.name});
 const hidden=Object.defineProperty({...person},'token',{value:'explicit-placeholder'});
 const hiddenName=Object.defineProperty({email:person.email},'name',{value:person.name});
 for(const approver of [{...person,name:'other-service'},{...person,email:['other','example.test'].join('@')},[],[person],'explicit-placeholder',{}, {name:person.name},{email:person.email},inherited,missingOwn,hidden,hiddenName,{...person,trustedPublisher:{id:'github'}},{...person,token:'explicit-placeholder'},{...person,approver:person},{...person,[Symbol('extra')]:'explicit-placeholder'}])assert.equal(validateManualSessionPublishedIdentity({...base,npmUser:{...person,approver}},person),false);
});
test('manual0.0.2 CLI contract accepts the approved approver without broadening other modes or versions',()=>{
 const metadata={maintainers:[person],_npmUser:{...person,approver:{...person}},author:null,contributors:[]};
 const opt={env:{...env,COMINS_CAPTURE_MANUAL_STAGE_0_0_2:'true'}};
 assert.equal(check(['--manual-session-version','0.0.2'],metadata,opt).result,0);
 failed(check(['--manual-session-version','0.0.2'],metadata));failed(check(['--version','0.0.2'],metadata,opt));
 for(const v of ['0.0.1','0.0.3','1.0.0'])failed(check(['--manual-session-version',v],metadata,opt));
 for(const approver of [{...person,name:'other-service'},{...person,email:['other','example.test'].join('@')},[],[person],'explicit-placeholder',{}, {name:person.name},{...person,trustedPublisher:{id:'github'}},{...person,token:'explicit-placeholder'},{...person,approver:person}])failed(check(['--manual-session-version','0.0.2'],{...metadata,_npmUser:{...person,approver}},opt));
});
