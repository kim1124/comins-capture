import test from 'node:test';
import assert from 'node:assert/strict';
const {planLayout}=await import('../../dist/geometry/layout.js').catch(()=>({}));
const source={width:640,height:420};
test('layout defaults and captured DPR are explicit',()=>{
 assert.equal(typeof planLayout,'function');
 assert.deepEqual(planLayout(source,{},'raster',2).outputSize,source);
 assert.deepEqual(planLayout(source,{size:{kind:'scale',value:'device'}},'raster',2).outputSize,{width:1280,height:840});
 const p=planLayout(source,{size:{kind:'pixels',width:800,height:800}},'raster');
 assert.deepEqual(p.contentRect,{x:0,y:137.5,width:800,height:525});
});
test('fit and alignment preserve cover clipping and independent stretch axes',()=>{
 assert.equal(typeof planLayout,'function');
 const cover=planLayout(source,{size:{kind:'pixels',width:800,height:800},fit:'cover',align:{x:1,y:0}},'raster');
 assert.equal(cover.drawRect.x,800-640*(800/420));assert.deepEqual(cover.contentRect,{x:0,y:0,width:800,height:800});
 const stretch=planLayout(source,{size:{kind:'pixels',width:800,height:800},fit:'stretch'},'raster');assert.notEqual(stretch.scaleX,stretch.scaleY);
});
test('paper margins and SVG physical dimensions retain distinct units',()=>{
 assert.equal(typeof planLayout,'function');const marginMm={top:10,right:10,bottom:10,left:10};
 const p=planLayout(source,{size:{kind:'paper',name:'A4',marginMm}},'raster');
 assert.deepEqual(p.outputSize,{width:2480,height:3508});assert.deepEqual(p.clipRect,{x:118,y:118,width:2244,height:3272});
 assert.deepEqual(planLayout(source,{size:{kind:'paper',name:'B4',system:'jis',orientation:'landscape'}},'raster').outputSize,{width:4299,height:3035});
 const svg=planLayout(source,{size:{kind:'paper',name:'A4',marginMm}},'svg');
 assert.equal(svg.unit,'mm');assert.deepEqual(svg.outputSize,{width:210,height:297});assert.deepEqual(svg.clipRect,{x:10,y:10,width:190,height:277});
});
test('invalid, mixed and out-of-bounds geometry never clamps or silently downscales',()=>{
 assert.equal(typeof planLayout,'function');
 for(const options of [{size:null},{fit:null},{size:{kind:'paper',name:'A4',ppi:null}},{crop:{x:-1,y:0,width:1,height:1}},{crop:{x:639,y:0,width:2,height:1}},{crop:{x:0,y:0,width:0,height:1}}, {size:{kind:'scale',value:0.00001}}, {size:{kind:'pixels',width:2.1,height:3}}, {size:{kind:'pixels',width:2,height:3,ppi:300}}, {size:{kind:'paper',name:'A4',marginMm:{top:300,right:0,bottom:0,left:0}}}, {size:{kind:'paper',name:'toString'}},{fit:'guess'},{align:{x:2,y:0}},{background:'url(https://invalid/a)'}])assert.throws(()=>planLayout(source,options,'raster'),{code:'INVALID_OPTIONS'});
 assert.throws(()=>planLayout(source,{size:{kind:'paper',name:'A4',ppi:300}},'svg'),{code:'INVALID_OPTIONS'});
 assert.throws(()=>planLayout(source,{size:{kind:'scale',value:2}},'svg'),{code:'INVALID_OPTIONS'});
 assert.throws(()=>planLayout(source,{background:null},'raster',1,'jpeg'),{code:'INVALID_OPTIONS'});
 const large=planLayout(source,{size:{kind:'pixels',width:20000,height:10000}},'raster');assert.equal(large.outputSize.width,20000);
});
