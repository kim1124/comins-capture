import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const config=resolve('.gitleaks.toml');
async function scan(text) {
  const cwd=await mkdtemp(join(tmpdir(),'capture-detector-'));
  try {
    await writeFile(join(cwd,'fixture.txt'),text);
    return spawnSync(process.env.GITLEAKS_BIN??'gitleaks',[
      'dir',cwd,'--config',config,'--ignore-gitleaks-allow','--no-banner','--redact',
    ],{stdio:'ignore'}).status;
  } finally {await rm(cwd,{recursive:true,force:true});}
}

test('security gate accepts scoped and unscoped npm version coordinates',async()=>{
  const scoped=['@','zumer','/','snapdom','@','3.2.0'].join('');
  const plain=['modern-screenshot','@','4.6.6'].join('');
  assert.equal(await scan(`${scoped}\n${plain}\n`),0,'npm coordinate rejected');
});
test('security gate rejects private-shaped email and local account path',async()=>{
  const email=['private-fixture','@','private-fixture.test'].join('');
  const path=['/','Users','/','private-fixture','/','project'].join('');
  assert.equal(await scan(email),1,'private email not detected');
  assert.equal(await scan(path),1,'local account path not detected');
});
