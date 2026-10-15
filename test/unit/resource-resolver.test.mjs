import test from 'node:test';
import assert from 'node:assert/strict';
import {createOperation} from '../../dist/lifecycle/operation.js';
const module=await import('../../dist/resources/resolve.js').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
const entry=(resourceRef,url,extra={})=>({resourceRef,kind:'image',url,dependsOn:[],...extra});
async function withOp(run){const op=createOperation('prepare');try{return await run(op);}finally{op.close();}}
const required=()=>assert.equal(typeof module.resolveResources,'function');
// Removing the memory/resolver precedence or adding an implicit fetch must fail this test.
test('memory precedes resolver; a shared URL resolves once without hidden fetch',async()=>{
 required();await withOp(async op=>{
  const seen=[];const bytes=new Blob(['image'],{type:'image/png'});
  const result=await module.resolveResources([entry('r1','/one',{memory:bytes}),entry('r2','/two'),entry('r3','/two')],'https://source.invalid/',{
   resolve:async({url})=>{seen.push(url);return bytes;},fetch:()=>{throw Error('Forbidden network');}
  },op);
  assert.deepEqual(seen,['https://source.invalid/two']);assert.equal(await result.get('r1').text(),'image');assert.equal(result.get('r2'),result.get('r3'));
  result.dispose();assert.throws(()=>result.get('r1'),{code:'DISPOSED'});
 });
});
test('unresolved default deny and resolver rejection fail closed with sanitized errors',async()=>{
 required();await withOp(async op=>{
  let requests=0;const fetch=()=>{requests++;throw Error('unexpected');};
  await assert.rejects(module.resolveResources([entry('r1','/private?key=hidden')],'https://source.invalid/',{fetch},op),{code:'NETWORK_DISABLED'});
  await assert.rejects(module.resolveResources([entry('r1','/private')],'https://source.invalid/',{network:'same-origin',fetch,resolve:async()=>{throw Error('secret body');}},op),e=>e.code==='RESOURCE_FAILED'&&!JSON.stringify(e).includes('secret')&&!e.cause);
  assert.equal(requests,0);
 });
});
test('missing dependencies and cycles reject before any resolver side effect',async()=>{
 required();await withOp(async op=>{
  let calls=0;const options={resolve:async()=>{calls++;return new Blob();}};
  for(const entries of [[entry('r1','/a',{dependsOn:['r2']})],[entry('r1','/a',{dependsOn:['r2']}),entry('r2','/b',{dependsOn:['r1']})]])
   await assert.rejects(module.resolveResources(entries,'https://source.invalid/',options,op),{code:'RESOURCE_UNVERIFIABLE'});
  assert.equal(calls,0);
 });
});
test('network credentials are same-origin only and redirects are always rejected',async()=>{
 required();await withOp(async op=>{
  const calls=[];const fetch=async(url,init)=>{calls.push({url,...init});return new Response('ok',{headers:{'Content-Type':'image/png'}});};
  await module.resolveResources([entry('r1','/one'),entry('r2','https://asset.invalid/two')],'https://source.invalid/',{network:{origins:['https://source.invalid','https://asset.invalid']},credentials:'same-origin',fetch},op);
  assert.deepEqual(calls.map(x=>[x.credentials,x.redirect]),[['same-origin','error'],['omit','error']]);
  assert.ok(calls.every(x=>x.signal===op.signal&&x.referrerPolicy==='no-referrer'));
  await assert.rejects(module.resolveResources([entry('r1','https://source.invalid.evil/a')],'https://source.invalid/',{network:'same-origin',fetch},op),{code:'NETWORK_DISABLED'});
 });
});
test('late resolver result cannot trigger a network fallback after abort',async()=>{
 required();const c=new AbortController(),op=createOperation('prepare',{signal:c.signal});let finish,entered;
 const started=new Promise(r=>{entered=r;});let requests=0;
 const result=module.resolveResources([entry('r1','/a')],'https://source.invalid/',{network:'same-origin',fetch:()=>{requests++;},resolve:()=>{entered();return new Promise(r=>{finish=r;});}},op);
 await started;c.abort();await assert.rejects(result,{code:'ABORTED'});finish(undefined);await op.drained();assert.equal(requests,0);op.close();
});

test('deferred SVG and stylesheet resources reject before resolver or network work',async()=>{
 required();await withOp(async op=>{
  let calls=0;const options={resolve:async()=>{calls++;return new Blob();},fetch:async()=>{calls++;throw Error('unexpected network');}};
  for(const kind of ['svg','css'])await assert.rejects(module.resolveResources([entry('r1','/deferred',{kind})],'https://source.invalid/',options,op),{code:'RESOURCE_UNVERIFIABLE'});
  assert.equal(calls,0);
 });
});
