import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../../dist/core/capture.js').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
const required=()=>assert.equal(typeof module.createCapturePipeline,'function');
const {CaptureError}=await import('../../dist/errors.js');
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
function fixture(overrides={}){
 const events=[],doc={},source={ownerDocument:doc},preparedRoot={ownerDocument:doc};
 let sourceText='fixed';
 const artifact={svg:'<svg>fixed</svg>',sourceSize:{width:24,height:16},diagnostics:[],dispose(){events.push('artifact-dispose');}};
 const engine={async capture(root){assert.equal(root,preparedRoot);events.push('engine');return artifact;}};
 const renderer={serialize(output){return output.svg;},async render(){throw Error('unexpected raster');}};
 const stages={
  async inspect(){events.push('inspect');return {documentUrl:'https://source.invalid/',resources:[],sourceSize:{width:24,height:16},assertUnchanged(){events.push('unchanged');},dispose(){events.push('inspection-dispose');}};},
  async prepare(){events.push('prepare');return {root:preparedRoot,dispose(){events.push('prepared-dispose');}};},
  engine,
  renderer,
  async verify(){events.push('verify');return {svg:artifact.svg,status:'complete',diagnostics:[]};},...overrides,
 };
 return {source,doc,events,engine,renderer,artifact,stages,setSourceText(v){sourceText=v;},getSourceText(){return sourceText;}};
}
test('capture sequences preparation and verification; frozen snapshots survive source changes',async()=>{
 required();const f=fixture(),capture=module.createCapturePipeline(f.stages);
 const c=new AbortController(),snapshot=await capture(f.source,{signal:c.signal,ready:async()=>f.events.push('ready')});
 f.setSourceText('changed');c.abort();const result=await snapshot.toSvg();
 assert.equal(result.value,'<svg>fixed</svg>');assert.equal(result.meta.status,'complete');assert.equal(result.meta.snapshotId,snapshot.meta.snapshotId);
 assert.ok(Object.isFrozen(snapshot.meta));assert.ok(Object.isFrozen(snapshot.meta.sourceRect));
 assert.deepEqual(f.events,['ready','inspect','prepare','engine','verify','unchanged','inspection-dispose']);
 snapshot.dispose();snapshot.dispose();assert.equal(f.events.filter(x=>x==='artifact-dispose').length,1);assert.equal(f.events.filter(x=>x==='prepared-dispose').length,1);
 await assert.rejects(snapshot.toSvg(),{code:'DISPOSED'});assert.equal(result.value,'<svg>fixed</svg>');
});
test('default deny prevents prepare/engine, and verification errors release every owner',async()=>{
 required();const f=fixture();const inspect=f.stages.inspect;
 f.stages.inspect=async()=>({...await inspect(),resources:[{resourceRef:'r1',kind:'image',url:'/a',dependsOn:[]}]});
 await assert.rejects(module.createCapturePipeline(f.stages)(f.source),{code:'NETWORK_DISABLED'});
 assert.deepEqual(f.events,['inspect','inspection-dispose']);
 const bad=fixture({verify:async()=>{throw Error('raw secret');}});
 await assert.rejects(module.createCapturePipeline(bad.stages)(bad.source),e=>e.code==='RESOURCE_UNVERIFIABLE'&&!JSON.stringify(e).includes('secret'));
 assert.equal(bad.events.filter(x=>x==='artifact-dispose').length,1);assert.equal(bad.events.filter(x=>x==='prepared-dispose').length,1);
});
test('late engine result is disposed; document remains BUSY until underlying work settles',async()=>{
 required();const f=fixture(),late=deferred(),entered=deferred();f.engine.capture=()=>{entered.resolve();return late.promise;};
 const capture=module.createCapturePipeline(f.stages),c=new AbortController(),pending=capture(f.source,{signal:c.signal});await entered.promise;
 c.abort();await assert.rejects(pending,{code:'ABORTED'});assert.equal(f.events.includes('prepared-dispose'),false);
 // A different coordinator must not bypass the same-document lease.
 await assert.rejects(module.createCapturePipeline(f.stages)(f.source),{code:'BUSY'});
 late.resolve(f.artifact);await new Promise(setImmediate);
 assert.equal(f.events.filter(x=>x==='artifact-dispose').length,1);assert.equal(f.events.filter(x=>x==='prepared-dispose').length,1);
 f.engine.capture=async()=>f.artifact;const next=await capture(f.source);next.dispose();
});
test('partial configuration and incomplete verification cannot authorize a snapshot',async()=>{
 required();for(const failure of ['error','allow-partial']){
  const f=fixture();await assert.rejects(module.createCapturePipeline(f.stages)(f.source,{failure}),{code:'INVALID_OPTIONS'});assert.deepEqual(f.events,[]);
 }
 const partial=fixture({verify:async()=>({svg:'<svg>incomplete</svg>',status:'partial',diagnostics:[]})});
 await assert.rejects(module.createCapturePipeline(partial.stages)(partial.source),{code:'RESOURCE_UNVERIFIABLE'});
 assert.equal(partial.events.filter(x=>x==='artifact-dispose').length,1);
 const f=fixture({verify:async()=>({svg:'<svg>verified</svg>',status:'complete',diagnostics:[{code:'SYSTEM_FONT',stage:'capture',message:'private contents'}]})});
 const snapshot=await module.createCapturePipeline(f.stages)(f.source);
 assert.equal((await snapshot.toSvg()).meta.diagnostics[0].message,'SYSTEM_FONT');snapshot.dispose();
});

test('dispose cancels outputs but retains artifacts until late rendering completes',async()=>{
 required();const f=fixture(),late=deferred(),entered=deferred();f.renderer.render=()=>{entered.resolve();return late.promise;};
 const snapshot=await module.createCapturePipeline(f.stages)(f.source),output=snapshot.toCanvas();await entered.promise;
 await assert.rejects(snapshot.toSvg(),{code:'BUSY'});snapshot.dispose();await assert.rejects(output,{code:'DISPOSED'});
 assert.equal(f.events.includes('artifact-dispose'),false);late.resolve({width:24,height:16});await new Promise(setImmediate);
 assert.equal(f.events.filter(x=>x==='artifact-dispose').length,1);
});
test('dispose during synchronous SVG output rejects the output without throwing',async()=>{
 required();const f=fixture(),snapshot=await module.createCapturePipeline(f.stages)(f.source);
 for(const method of ['toSvg','svgBlob']){
  const current=method==='toSvg'?snapshot:await module.createCapturePipeline(f.stages)(f.source);
  const pending=method==='toSvg'?current.toSvg():current.toBlob({format:'svg'});
  assert.doesNotThrow(()=>current.dispose());
  await assert.rejects(pending,{code:'DISPOSED'});
  current.dispose();
 }
 assert.equal(f.events.filter(x=>x==='artifact-dispose').length,2);
});
test('removed crop and tile surfaces cannot invoke rendering or appear in metadata',async()=>{
 required();const f=fixture();let calls=0;f.renderer.render=async()=>{calls++;return {width:24,height:16};};
 const snapshot=await module.createCapturePipeline(f.stages)(f.source);
 assert.deepEqual(Object.keys(snapshot).sort(),['dispose','meta','toBlob','toCanvas','toSvg']);
 for(const method of ['toCanvas','toSvg','toBlob']){
  for(const options of [{crop:{x:0,y:0,width:12,height:8}},{tile:{width:12,height:8}},{output:'canvas'}])await assert.rejects(snapshot[method](options),{code:'INVALID_OPTIONS'});
 }
 assert.equal(calls,0);const result=await snapshot.toCanvas();assert.equal(result.meta.width,24);
 for(const key of ['crop','totalWidth','totalHeight'])assert.equal(key in result.meta,false);
 snapshot.dispose();
});

test('MIME substitution and output size mismatch never become a successful result',async()=>{
 required();const f=fixture();f.renderer.render=async()=>({width:24,height:16,toBlob(callback){callback(new Blob(['wrong'],{type:'image/png'}));}});
 const snapshot=await module.createCapturePipeline(f.stages)(f.source);
 await assert.rejects(snapshot.toBlob({format:'webp'}),{code:'FORMAT_UNSUPPORTED'});
 await assert.rejects(snapshot.toBlob({format:'png',quality:0.5}),{code:'INVALID_OPTIONS'});
 f.renderer.render=async()=>({width:1,height:1});await assert.rejects(snapshot.toCanvas(),{code:'OUTPUT_MISMATCH'});snapshot.dispose();
});
test('abort at the final inspection boundary rejects and cleans owned results',async()=>{
 required();const controller=new AbortController(),f=fixture(),inspect=f.stages.inspect;
 f.stages.inspect=async()=>({...await inspect(),assertUnchanged(){queueMicrotask(()=>queueMicrotask(()=>controller.abort()));}});
 await assert.rejects(module.createCapturePipeline(f.stages)(f.source,{signal:controller.signal}),{code:'ABORTED'});
 await new Promise(setImmediate);assert.equal(f.events.filter(x=>x==='artifact-dispose').length,1);
});
test('abort between render completion and output delivery discards the unreturned canvas',async()=>{
 required();const controller=new AbortController(),f=fixture(),canvas={width:24,height:16};
 f.renderer.render=async()=>{queueMicrotask(()=>queueMicrotask(()=>queueMicrotask(()=>queueMicrotask(()=>controller.abort()))));return canvas;};
 const snapshot=await module.createCapturePipeline(f.stages)(f.source);
 await assert.rejects(snapshot.toCanvas({signal:controller.signal}),{code:'ABORTED'});assert.equal(canvas.width,0);snapshot.dispose();
});
test('timed out raster retains its lease until the late canvas is discarded',async()=>{
 required();const f=fixture(),late=deferred(),entered=deferred();f.renderer.render=()=>{entered.resolve();return late.promise;};
 const snapshot=await module.createCapturePipeline(f.stages)(f.source),pending=snapshot.toCanvas({timeoutMs:10});
 const rejected=assert.rejects(pending,{code:'TIMEOUT'});await entered.promise;await rejected;
 await assert.rejects(snapshot.toSvg(),{code:'BUSY'});const canvas={width:24,height:16};late.resolve(canvas);await new Promise(setImmediate);
 assert.equal(canvas.width,0);await snapshot.toSvg();snapshot.dispose();
});

test('unsupported options and malformed resource policy fail before stage side effects',async()=>{
 required();for(const options of [{unknown:true},{resources:{network:null}},{resources:{fetch:()=>{}}},{resources:{network:'all'}},{resources:{network:{origins:['https://source.invalid/']}}}]){
  const f=fixture();await assert.rejects(module.createCapturePipeline(f.stages)(f.source,options),{code:'INVALID_OPTIONS'});assert.deepEqual(f.events,[]);
 }
});

test('every output consumes an immutable verified SVG, never the raw engine raster',async()=>{
 required();const verified={svg:'<svg>clean</svg>',status:'complete',diagnostics:[]},f=fixture({verify:async()=>verified});
 const seen=[];f.renderer.render=()=>{throw Error('raw engine renderer must not run');};
 f.stages.renderer={serialize(output){return output.svg;},async render(output,op,plan){seen.push(output.svg);assert.ok(Object.isFrozen(output));return {...plan.outputSize,
 getContext(){return {save(){},restore(){},fillRect(){}};},toBlob(cb,mime){cb(new Blob([output.svg],{type:mime}));}};}};
 const snapshot=await module.createCapturePipeline(f.stages)(f.source);verified.svg='<svg>changed</svg>';f.artifact.svg='<svg>raw changed</svg>';
 assert.equal((await snapshot.toSvg()).value,'<svg>clean</svg>');
 assert.equal(await (await snapshot.toBlob({format:'svg'})).value.text(),'<svg>clean</svg>');
 await snapshot.toCanvas();for(const format of ['png','jpeg','webp'])assert.equal(await (await snapshot.toBlob({format})).value.text(),'<svg>clean</svg>');
 assert.equal(seen.length,4);assert.ok(seen.every(s=>s==='<svg>clean</svg>'));snapshot.dispose();
});
test('diagnostics alone and missing verified renderer cannot authorize output',async()=>{
 required();const f=fixture({verify:async()=>({status:'complete',diagnostics:[]})});
 await assert.rejects(module.createCapturePipeline(f.stages)(f.source),{code:'RESOURCE_UNVERIFIABLE'});
 const noRenderer=fixture();delete noRenderer.stages.renderer;
 await assert.rejects(module.createCapturePipeline(noRenderer.stages)(noRenderer.source));
});
test('single-output layout preserves captured DPR, custom size, and allocation limits',async()=>{
 const f=fixture();f.doc.defaultView={devicePixelRatio:2};const plans=[];
 f.stages.renderer.render=async(_,op,plan)=>{plans.push(plan);return {...plan.outputSize};};
 const snapshot=await module.createCapturePipeline(f.stages)(f.source);f.doc.defaultView.devicePixelRatio=3;
 const canvas=await snapshot.toCanvas({size:{kind:'scale',value:'device'}});assert.equal(canvas.value.width,48);
 const result=await snapshot.toCanvas({size:{kind:'pixels',width:30,height:30},fit:'stretch'});
 assert.equal(result.meta.width,30);assert.equal(result.meta.height,30);assert.ok(Object.isFrozen(plans[1]));
 assert.deepEqual(plans[1].contentRect,{x:0,y:0,width:30,height:30});
 await assert.rejects(snapshot.toCanvas({size:{kind:'pixels',width:20000,height:10000}}),{code:'OUTPUT_LIMIT'});
 assert.equal(plans.length,2);snapshot.dispose();
});

test('renderer allocation limits remain OUTPUT_LIMIT; unrelated failures remain ENGINE_FAILED',async()=>{
 required();const f=fixture();let failure=new CaptureError('OUTPUT_LIMIT','output');
 f.renderer.render=async()=>{throw failure;};
 const snapshot=await module.createCapturePipeline(f.stages)(f.source);
 await assert.rejects(snapshot.toCanvas({size:{kind:'scale',value:.5}}),{code:'OUTPUT_LIMIT',stage:'output'});
 failure=new CaptureError('RESOURCE_FAILED','output');
 await assert.rejects(snapshot.toCanvas({size:{kind:'scale',value:.5}}),{code:'ENGINE_FAILED',stage:'output'});
 snapshot.dispose();
});
