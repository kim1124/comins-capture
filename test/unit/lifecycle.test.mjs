import test from 'node:test';
import assert from 'node:assert/strict';
const life=await import('../../dist/lifecycle/operation.js');
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
// A timeout must reject an uncooperative task and dispose its late result once.
test('timeout rejects promptly; late ownership is discarded and tracked until drained',async()=>{
 assert.equal(typeof life.createOperation,'function');
 const op=life.createOperation('capture',{timeoutMs:10}),late=deferred();let disposed=0;
 const output=op.wait(()=>late.promise,()=>{disposed++;});
 await assert.rejects(output,{code:'TIMEOUT',stage:'capture'});
 let drained=false;const drain=op.drained().then(()=>{drained=true;});await Promise.resolve();assert.equal(drained,false);
 late.resolve({});await drain;assert.equal(disposed,1);op.close();
});
test('pre-abort prevents callbacks; consumer abort reasons never reach errors',async()=>{
 assert.equal(typeof life.createOperation,'function');const c=new AbortController();c.abort('private callback value');
 const op=life.createOperation('prepare',{signal:c.signal});let called=false;
 await assert.rejects(op.wait(()=>{called=true;}),e=>e.code==='ABORTED'&&!JSON.stringify(e).includes('private'));
 assert.equal(called,false);op.close();
});
test('operation rejects invalid timeout and closing detaches capture signal',async()=>{
 assert.equal(typeof life.createOperation,'function');
 for(const timeoutMs of [0,-1,Infinity,NaN])assert.throws(()=>life.createOperation('prepare',{timeoutMs}),{code:'INVALID_OPTIONS'});
 const c=new AbortController(),op=life.createOperation('prepare',{signal:c.signal});op.close();c.abort();assert.equal(op.signal.aborted,false);
});
test('synchronous blocking work cannot evade timeout by delaying timer callbacks',async()=>{
 const op=life.createOperation('capture',{timeoutMs:5});let disposed=0;
 await assert.rejects(op.wait(()=>{const end=performance.now()+25;while(performance.now()<end){}return {};},()=>{disposed++;}),{code:'TIMEOUT'});
 await op.drained();assert.equal(disposed,1);op.close();
});
