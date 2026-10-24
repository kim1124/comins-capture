import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdtemp,readFile,realpath,rm,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const NAME='comins-capture',VERSION='0.0.2',REPO='kim1124/comins-capture';
const REF='refs/heads/codex-governance-v111',WORKFLOW='.github/workflows/publish.yml';
const ISSUER='https://token.actions.githubusercontent.com',IDENTITY=`https://github.com/${REPO}/${WORKFLOW}@${REF}`;
const TGZ=`${NAME}-${VERSION}.tgz`,BUNDLE=`${NAME}-${VERSION}.sigstore.json`;
const KEYS=['name','version','sourceSHA','runId','runAttempt','tgzSHA256','bundleSHA256'];
const hash=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');

export async function loadNpmTools(){
  const root=resolve(dirname(process.execPath),'../lib/node_modules/npm');
  const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));assert.equal(pkg.name,'npm');assert.equal(pkg.version,'11.17.0');
  const require=createRequire(join(root,'package.json'));
  const {generateProvenance,verifyProvenance}=require('./node_modules/libnpmpublish/lib/provenance.js');
  const sigstore=require('sigstore'),model=require('@sigstore/bundle'),npa=require('npm-package-arg'),pacote=require('pacote');
  return {npmVersion:pkg.version,npmCli:join(root,'bin/npm-cli.js'),generateProvenance,verifyProvenance,verify:sigstore.verify,bundleFromJSON:model.bundleFromJSON,
    toPurl:({name,version})=>npa.toPurl(npa.resolve(name,version)),manifest:async file=>{const cache=await mkdtemp(join(tmpdir(),'capture-manifest-'));try{return await pacote.manifest(file,{ignoreScripts:true,offline:true,cache});}finally{await rm(cache,{recursive:true,force:true});}}};
}
async function bytes(file,limit){const path=resolve(file);assert((await lstat(path)).isFile());assert.equal(await realpath(path),path);const value=await readFile(path);assert(value.length<=limit);return value;}
function binding(value){
  assert.deepEqual(Object.keys(value).sort(),[...KEYS].sort());assert.equal(value.name,NAME);assert.equal(value.version,VERSION);assert.match(value.sourceSHA,/^[a-f0-9]{40}$/);assert.match(value.runId,/^[1-9][0-9]{0,19}$/);assert.match(value.runAttempt,/^[1-9][0-9]{0,5}$/);
  for(const key of ['tgzSHA256','bundleSHA256'])assert.match(value[key],/^[a-f0-9]{64}$/);
}
function signedBinding(bundle,expected,tools,subject){
  // Standard Sigstore protobuf model performs serialization decoding. No JWT/DER/base64 parser.
  const model=tools.bundleFromJSON(bundle);assert.equal(model.content.$case,'dsseEnvelope');
  const envelope=model.content.dsseEnvelope;assert.equal(envelope.payloadType,'application/vnd.in-toto+json');assert(envelope.payload instanceof Uint8Array);assert(envelope.payload.length<=262_144);
  const statement=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(envelope.payload));
  assert.equal(statement._type,'https://in-toto.io/Statement/v1');assert.equal(statement.predicateType,'https://slsa.dev/provenance/v1');assert.deepEqual(statement.subject,[subject]);
  const definition=statement.predicate?.buildDefinition;
  assert.equal(definition?.buildType,'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1');
  assert.deepEqual(definition.externalParameters?.workflow,{ref:REF,repository:`https://github.com/${REPO}`,path:WORKFLOW});
  assert.deepEqual(definition.resolvedDependencies,[{uri:`git+https://github.com/${REPO}@${REF}`,digest:{gitCommit:expected.sourceSHA}}]);
  assert.equal(statement.predicate?.runDetails?.metadata?.invocationId,`https://github.com/${REPO}/actions/runs/${expected.runId}/attempts/${expected.runAttempt}`);
  assert.equal(statement.predicate?.runDetails?.builder?.id,'https://github.com/actions/runner/github-hosted');
}
async function verifyFiles(directory,expected,tools){
  const artifact=join(resolve(directory),TGZ),bundle=join(resolve(directory),BUNDLE);
  const tarball=await bytes(artifact,50_000_000),proof=await bytes(bundle,2_000_000);
  assert.equal(hash(tarball),expected.tgzSHA256);assert.equal(hash(proof),expected.bundleSHA256);
  const manifest=await tools.manifest(artifact);assert.equal(manifest.name,NAME);assert.equal(manifest.version,VERSION);
  const subject={name:tools.toPurl({name:NAME,version:VERSION}),digest:{sha512:hash(tarball,'sha512')}};
  // npm checks subject/PURL/digest; Sigstore separately enforces the certificate identity policy.
  const verified=await tools.verifyProvenance(subject,bundle);
  await tools.verify(verified,{certificateIssuer:ISSUER,certificateIdentityURI:IDENTITY});
  signedBinding(verified,expected,tools,subject);
  return {manifest:expected,artifact,bundle};
}
export async function verifyTransfer({directory,expected,tools}={}){
  directory=await realpath(directory);tools??=await loadNpmTools();assert.equal(tools.npmVersion,'11.17.0');binding(expected);
  const manifest=JSON.parse(await bytes(join(directory,'session-stage.json'),4096));binding(manifest);assert.deepEqual(manifest,expected);
  return verifyFiles(directory,manifest,tools);
}
export async function generate({directory=process.cwd(),env=process.env,tools,gitHead=()=>execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}={}){
  directory=await realpath(directory);assert.equal(env.REQUESTED_VERSION,VERSION);assert.equal(env.GITHUB_ACTIONS,'true');assert.equal(env.GITHUB_REPOSITORY,REPO);assert.equal(env.GITHUB_REF,REF);assert.equal(env.GITHUB_WORKFLOW_REF,`${REPO}/${WORKFLOW}@${REF}`);assert.equal(env.GITHUB_JOB,'prepare-session-stage');assert.equal(gitHead(),env.GITHUB_SHA);
  assert.equal(env.GITHUB_SERVER_URL,'https://github.com');assert.equal(env.RUNNER_ENVIRONMENT,'github-hosted');
  tools??=await loadNpmTools();assert.equal(tools.npmVersion,'11.17.0');
  const tarball=await bytes(join(directory,TGZ),50_000_000);const manifest=await tools.manifest(join(directory,TGZ));assert.equal(manifest.name,NAME);assert.equal(manifest.version,VERSION);
  const expected={name:NAME,version:VERSION,sourceSHA:env.GITHUB_SHA,runId:env.GITHUB_RUN_ID,runAttempt:env.GITHUB_RUN_ATTEMPT,tgzSHA256:hash(tarball),bundleSHA256:'0'.repeat(64)};binding(expected);
  const subject={name:tools.toPurl({name:NAME,version:VERSION}),digest:{sha512:hash(tarball,'sha512')}};
  const proof=await tools.generateProvenance([subject],{timeout:15_000,retry:0});
  const serialized=JSON.stringify(proof)+'\n';assert(Buffer.byteLength(serialized)<=2_000_000);
  await writeFile(join(directory,BUNDLE),serialized,{flag:'wx',mode:0o600});expected.bundleSHA256=hash(serialized);
  await verifyFiles(directory,expected,tools);
  await writeFile(join(directory,'session-stage.json'),JSON.stringify(expected,null,2)+'\n',{flag:'wx',mode:0o600});
  return expected;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  (async()=>{assert.deepEqual(process.argv.slice(2),['generate']);await generate();})().catch(()=>{process.stderr.write('session-stage-provenance: failed\n');process.exitCode=1;});
}
