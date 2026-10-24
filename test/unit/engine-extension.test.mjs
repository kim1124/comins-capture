import test from 'node:test';
import assert from 'node:assert/strict';
const runtime=await import('../../dist/engine/snapdom-extension.js').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
const required=()=>assert.equal(typeof runtime.createExtensionSession,'function');
const png='data:image/png;base64,AAAA';
function context(controller=new AbortController()) {return {signal:controller.signal,checkpoint(){if(controller.signal.aborted)throw Error('raw abort');}};}
const detached=()=>({parentNode:null});
test('extension only reads copied prepared images; sessions never share approval',async()=>{
 required();const images=[{url:'https://fixture.invalid/a',dataUrl:png}],a=runtime.createExtensionSession({images,cloneShallow:detached},context());
 images[0].dataUrl='data:image/svg+xml,unsafe';images.push({url:'https://fixture.invalid/b',dataUrl:png});
 assert.deepEqual(await a.resolveImage('https://fixture.invalid/a'),{ok:true,data:png});
 const b=runtime.createExtensionSession({images:[],cloneShallow:detached},context());
 await assert.rejects(b.resolveImage('https://fixture.invalid/a'),{code:'RESOURCE_UNVERIFIABLE'});
 assert.throws(()=>b.assertComplete(),{code:'RESOURCE_UNVERIFIABLE'});a.assertComplete();
 await assert.rejects(a.resolveImage('https://fixture.invalid/b'),{code:'RESOURCE_UNVERIFIABLE'});
});
test('missing resources poison completion even if engine catches rejection',async()=>{
 required();const session=runtime.createExtensionSession({images:[],cloneShallow:detached},context());
 await session.resolveImage('https://fixture.invalid/private').catch(()=>{});
 assert.throws(()=>session.assertComplete(),e=>e.code==='RESOURCE_UNVERIFIABLE'&&!JSON.stringify(e).includes('private'));
});
test('cloning uses the provided factory once and rejects returning the original or an attached node',()=>{
 required();const source={parentNode:null},clone=detached();let calls=0;
 const s=runtime.createExtensionSession({images:[],cloneShallow:n=>{assert.equal(n,source);calls++;return clone;}},context());
 assert.equal(runtime.shallowClone(source,{__comins:s}),clone);assert.equal(calls,1);
 for(const value of [source,{parentNode:{}},null]) {
  const bad=runtime.createExtensionSession({images:[],cloneShallow:()=>value},context());
  assert.throws(()=>bad.shallowClone(source),{code:'ENGINE_FAILED'});
  assert.throws(()=>bad.assertComplete(),{code:'ENGINE_FAILED'});
 }
});
test('cancel and disposal block later hooks; raw callback failures are sanitized',async()=>{
 required();const c=new AbortController(),s=runtime.createExtensionSession({images:[{url:'a',dataUrl:png}],cloneShallow:detached},context(c));
 c.abort();await assert.rejects(s.resolveImage('a'),{code:'ABORTED'});assert.throws(()=>s.assertComplete(),{code:'ABORTED'});
 const d=runtime.createExtensionSession({images:[],cloneShallow:detached},context());d.dispose();d.dispose();
 assert.throws(()=>d.shallowClone({}),{code:'DISPOSED'});
 const e=runtime.createExtensionSession({images:[],cloneShallow:()=>{throw Error('private callback');}},context());
 assert.throws(()=>e.shallowClone({}),err=>err.code==='ENGINE_FAILED'&&!err.message.includes('private'));
 assert.throws(()=>e.assertComplete(),{code:'ENGINE_FAILED'});
});
test('invalid or ambiguous prepared image entries reject at session construction',()=>{
 required();for(const images of [[{url:'a',dataUrl:'https://fixture.invalid/a'}],[{url:'a',dataUrl:'data:image/svg+xml;base64,AAAA'}],[{url:'a',dataUrl:'data:image/png;base64,'}],...[ 'A','AAA','AAAA=','AA=A','AAAA\n','AAA\n','AA=\n','AAA\r','AAA\u2028','AAA\u2029','AA==AAAA'].map(body=>[{url:'a',dataUrl:'data:image/png;base64,'+body}]),[{url:'a',dataUrl:png},{url:'a',dataUrl:png}]]) {
  assert.throws(()=>runtime.createExtensionSession({images,cloneShallow:detached},context()),{code:'RESOURCE_UNVERIFIABLE'});
 }
});
test('large prepared data URLs validate without repeated-group stack limits',async()=>{
 required();const dataUrl='data:image/png;base64,'+'AAAA'.repeat(1_000_000);
 const session=runtime.createExtensionSession({images:[{url:'large',dataUrl}],cloneShallow:detached},context());
 assert.equal((await session.resolveImage('large')).data,dataUrl);session.dispose();
});
test('generated bundle hooks require an explicit session and retain normal prepared lookup',async()=>{
 required();assert.throws(()=>runtime.shallowClone({},{}),{code:'ENGINE_FAILED'});
 await assert.rejects(runtime.resolveImage('a',{}),{code:'ENGINE_FAILED'});
 const s=runtime.createExtensionSession({images:[{url:'a',dataUrl:png}],cloneShallow:detached},context());
 assert.deepEqual(await runtime.resolveImage('a',{__comins:s}),{ok:true,data:png});s.assertComplete();
});
test('scrollbar collection is call-owned, sanitizes failure and releases the callback on dispose',()=>{
 const source={},calls=[];
 const a=runtime.createExtensionSession({images:[],cloneShallow:detached,scrollbarCss:n=>{calls.push(n);return 'target CSS';}},context());
 const b=runtime.createExtensionSession({images:[],cloneShallow:detached,scrollbarCss:()=>''},context());
 assert.equal(runtime.collectScrollbarCss(source,{__comins:a}),'target CSS');
 assert.equal(runtime.collectScrollbarCss(source,{__comins:b}),'');assert.deepEqual(calls,[source]);
 a.dispose();assert.throws(()=>runtime.collectScrollbarCss(source,{__comins:a}),{code:'DISPOSED'});assert.equal(calls.length,1);
 const c=new AbortController(),cancelled=runtime.createExtensionSession({images:[],cloneShallow:detached,scrollbarCss:()=>{throw Error('must not run');}},context(c));
 c.abort();assert.throws(()=>cancelled.collectScrollbarCss(source),{code:'ABORTED'});
 const failed=runtime.createExtensionSession({images:[],cloneShallow:detached,scrollbarCss:()=>{throw Error('private');}},context());
 assert.throws(()=>failed.collectScrollbarCss(source),e=>e.code==='ENGINE_FAILED'&&!e.message.includes('private'));
 assert.throws(()=>failed.assertComplete(),{code:'ENGINE_FAILED'});
});
