import test from 'node:test';
import assert from 'node:assert/strict';
import {runPreparedProbe} from '../../output/playwright/workbench/g1-model.mjs';

const data = {image:'data:image/svg+xml;base64,PHN2Zy8+',font:'data:font/ttf;base64,AA=='};
function fixture(overrides={}) {
  const calls=[];
  return {calls, args:{resolve:async()=>data, prepare:async()=>{calls.push('prepare');return {node:{},dispose(){calls.push('dispose');}};},
    capture:async()=>{calls.push('capture');return {};}, exportImage:async()=>{calls.push('export');return 'png';}, ...overrides}};
}
test('unresolved resource fails before DOM preparation or engine call',async()=>{
  const f=fixture({resolve:async()=>({...data,image:undefined})});
  await assert.rejects(runPreparedProbe(f.args),{message:'RESOURCE_UNRESOLVED'});assert.deepEqual(f.calls,[]);
});
test('remote URL cannot enter the prepared fixture',async()=>{
  const f=fixture({resolve:async()=>({...data,image:'https://example.invalid/a.svg'})});
  await assert.rejects(runPreparedProbe(f.args),{message:'RESOURCE_UNRESOLVED'});assert.deepEqual(f.calls,[]);
});
test('resolver rejection never invokes engine',async()=>{
  const f=fixture({resolve:async()=>{throw Error('RESOLVER_FAILED');}});
  await assert.rejects(runPreparedProbe(f.args),{message:'RESOLVER_FAILED'});assert.deepEqual(f.calls,[]);
});
test('pre-abort never resolves or prepares',async()=>{
  const c=new AbortController();c.abort();const f=fixture({signal:c.signal,resolve:async()=>{throw Error('UNEXPECTED_RESOLVE');}});
  await assert.rejects(runPreparedProbe(f.args),{message:'CANCELLED'});assert.deepEqual(f.calls,[]);
});
test('abort during engine call discards artifact and cleans up',async()=>{
  const c=new AbortController();const f=fixture({signal:c.signal,capture:async()=>{c.abort();return {};}});
  await assert.rejects(runPreparedProbe(f.args),{message:'CANCELLED'});assert.deepEqual(f.calls,['prepare','dispose']);
});
test('engine failure still cleans up prepared DOM',async()=>{
  const f=fixture({capture:async()=>{throw Error('ENGINE_FAILED');}});
  await assert.rejects(runPreparedProbe(f.args),{message:'ENGINE_FAILED'});assert.deepEqual(f.calls,['prepare','dispose']);
});
test('two exports reuse one capture and cleanup follows both',async()=>{
  const f=fixture();assert.deepEqual(await runPreparedProbe(f.args),['png','png']);
  assert.deepEqual(f.calls,['prepare','capture','export','export','dispose']);
});
