import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const checker=resolve('scripts/check-public-identities.mjs');
const account='comins-fixture';
const publicEmail=[account,'users.noreply.github.com'].join('@');
async function fixture(run) {
  const cwd=await mkdtemp(join(tmpdir(),'capture-identity-'));
  const env={...process.env,GIT_AUTHOR_NAME:account,GIT_COMMITTER_NAME:account,
    GIT_AUTHOR_EMAIL:publicEmail,GIT_COMMITTER_EMAIL:publicEmail};
  const git=(...args)=>{
    const result=spawnSync('git',args,{cwd,env,encoding:'utf8'});
    assert.equal(result.status,0,'fixture Git operation failed');
    return result.stdout.trim();
  };
  const check=(...args)=>spawnSync(process.execPath,[checker,...args],{cwd,env,encoding:'utf8'});
  try {
    git('init','-q');git('config','user.name',account);git('config','user.email',publicEmail);
    await writeFile(join(cwd,'fixture.txt'),'initial\n');git('add','fixture.txt');git('commit','-qm','초기 상태');
    await run({cwd,git,check});
  } finally {await rm(cwd,{recursive:true,force:true});}
}

test('public identity checker accepts configured handle and full public history',()=>fixture(async({git,check})=>{
  assert.equal(check().status,0);
  assert.equal(check(git('rev-parse','HEAD')).status,0);
}));
test('public identity checker rejects mismatched local name with value-free output',()=>fixture(async({git,check})=>{
  git('config','user.name','different-handle');
  const result=check();assert.equal(result.status,1);
  assert.equal(result.stdout,'');assert.equal(result.stderr,'public-identity-check: failed\n');
}));
test('public identity checker accepts an exact ancestor range and rejects malformed revisions',()=>fixture(async({cwd,git,check})=>{
  const base=git('rev-parse','HEAD');
  await writeFile(join(cwd,'fixture.txt'),'updated\n');git('add','fixture.txt');git('commit','-qm','상태 갱신');
  const head=git('rev-parse','HEAD');
  assert.equal(check(base,head).status,0);
  assert.equal(check(head,base).status,1);
  assert.equal(check('--all').status,1);
  assert.equal(check('invalid',head).status,1);
}));
test('public identity checker rejects a nonpublic author within the reviewed range',()=>fixture(async({cwd,git,check})=>{
  const base=git('rev-parse','HEAD');
  await writeFile(join(cwd,'fixture.txt'),'updated\n');git('add','fixture.txt');
  const author=['different-handle <',publicEmail,'>'].join('');
  git('commit','-qm','다른 작성자','--author',author);
  assert.equal(check(base,git('rev-parse','HEAD')).status,1);
}));
