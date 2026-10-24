import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('loopback runner persists navigation/stage failures and bounded authored artifacts',async t=>{
 const reservation=createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));
 const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 const origin=`http://127.0.0.1:${port}`,child=spawn(process.execPath,['scripts/resource-acceptance-server.mjs'],{cwd:new URL('../../',import.meta.url),env:{...process.env,CAPTURE_RESOURCE_PORT:String(port)},stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill('SIGTERM'));
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error(`fixture server exited ${code}`)));});
 const post=(path,value)=>fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Resource-Check':'1'},body:JSON.stringify(value)});
 const created=await post('/api/runs',{kind:'same-origin',image:[1,2,3]}),run=await created.json();assert.equal(created.status,200);
 const page=await fetch(`${origin}/runner?run=${run.id}`);assert.equal(page.status,200);
 assert.match(await page.text(),/resource-runner-bootstrap\.mjs/);
 assert.equal((await fetch(origin+'/resource-runner-bootstrap.mjs')).status,200);
 assert.equal((await fetch(origin+'/resource-runner.mjs')).status,200);
 for(const entry of ['engine-boundaries','image-cold-regression','image-boundary-probe','image-paint-probe','paper-clip-regression','native-downscale-regression','svg-layout-regression','svg-text-runs-regression','svg-flow-regression']){
  const document=await fetch(`${origin}/${entry}.html`);assert.equal(document.status,200);
  const module=(await document.text()).match(/<script type="module" src="([^"]+)"/);
  assert.ok(module,`${entry} has a module entry`);
  assert.equal((await fetch(origin+module[1])).status,200,`${entry} document module is served`);
 }
 assert.equal((await fetch(origin+'/package.json')).status,404,'allowlist does not expose project files');
 assert.equal((await post(`/api/runs/${run.id}/diagnostic`,{stage:'import-start',elapsedMs:1})).status,200);
 assert.equal((await post(`/api/runs/${run.id}/diagnostic`,{stage:'not an event',elapsedMs:1})).status,400);
 const ledger=await (await fetch(`${origin}/api/runs/${run.id}`)).json();
 assert.deepEqual(ledger.diagnostics.map(event=>event.stage),['document-request','document-response','import-start']);
 assert.equal((await post(`/api/runs/${run.id}/save`,{report:{status:'failed',error:'runner-import-timeout'}})).status,200);
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',saved=await post('/api/browser-evidence',{kind:'engine-boundary',report:{case:'authored'},files:{'raw.svg':svg}});
 assert.equal(saved.status,200);const artifact=await saved.json();
 assert.equal(artifact.hashes['raw.svg'],createHash('sha256').update(svg).digest('hex'));
 assert.equal(await readFile(new URL(`../../${artifact.directory}/raw.svg`,import.meta.url),'utf8'),svg);
 assert.equal((await post('/api/browser-evidence',{kind:'engine-boundary',report:{},files:{'../escape.svg':svg}})).status,400);
 assert.equal((await post('/api/browser-evidence',{kind:'unapproved-fixture',report:{},files:{'raw.svg':svg}})).status,400);
});
