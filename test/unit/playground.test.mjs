import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {CaptureError} from '../../dist/errors.js';
async function setup({format='png',size='source',fail=false,pending=false}={}){
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:false,textContent:'',hidden:true,children:[],addEventListener(){},querySelector(){return {};},removeAttribute(key){delete this[key];},replaceChildren(...children){this.children=children;}});return elements.get(id);};
 for(const [id,value] of Object.entries({format,size,width:'800',height:'600',fit:'contain',background:'transparent',standard:'ISO',ppi:'300',orientation:'portrait',margin:'10'}))element(id).value=value;
 let disposed=0,revoked=0,options,captureOptions,started;
 const entered=new Promise(r=>started=r);
 const sandbox={document:{getElementById:element,querySelectorAll:()=>[],fonts:{ready:Promise.resolve()}},CaptureError,
 capture:async(target,opts)=>{assert.equal(target,element('target'));captureOptions=opts;await opts.ready();return {dispose(){disposed++;},async toBlob(opts){options=opts;started();if(pending)await new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(new CaptureError('ABORTED','output')),{once:true}));if(fail)throw new CaptureError('INVALID_OPTIONS','output');return {value:new Blob(['fixture']),meta:{width:800,height:600,unit:format==='svg'?'css-px':'px',diagnostics:[]}};}};},
 AbortController,Blob,URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){revoked++;}},Image:class {async decode(){}},addEventListener(){}};
 vm.createContext(sandbox);vm.runInContext((await readFile('playground/app.mjs','utf8')).replace(/^import .*;\n/gm,''),sandbox);
 return {element,entered,state:()=>({disposed,revoked,options,captureOptions})};
}
test('Playground passes SVG custom size through public API and reset revokes output',async()=>{
 const {element,state}=await setup({format:'svg',size:'custom'});await element('capture').onclick();
 assert.equal('crop' in state().options,false);assert.equal(state().options.size.kind,'css');assert.equal(state().options.size.width,800);
 assert.equal(element('dimensions').textContent,'800 × 600 css-px · SVG');assert.equal(state().disposed,1);assert.equal(element('download').hidden,false);
 element('reset').onclick();assert.equal(state().revoked,1);assert.equal(element('download').hidden,true);assert.equal(element('output').children.length,0);
});
test('Playground propagates paper options and releases snapshot on typed output failure',async()=>{
 const {element,state}=await setup({format:'jpeg',size:'A4',fail:true});await element('capture').onclick();
 assert.equal(state().options.size.ppi,300);assert.equal(state().options.size.marginMm.left,10);assert.equal(state().options.background,undefined);
 assert.match(element('status').textContent,/INVALID_OPTIONS/);assert.equal(element('download').hidden,true);assert.equal(state().disposed,1);assert.equal(element('capture').disabled,false);
});
test('Playground cancel aborts output, disposes snapshot and restores controls',async()=>{
 const {element,state,entered}=await setup({pending:true});const running=element('capture').onclick();await entered;
 assert.equal(element('capture').disabled,true);element('cancel').onclick();await running;
 assert.equal(state().captureOptions.signal.aborted,true);assert.equal(state().disposed,1);assert.equal(state().revoked,0);
 assert.equal(element('status').textContent,'작업을 취소했습니다.');assert.equal(element('download').hidden,true);assert.equal(element('cancel').disabled,true);assert.equal(element('capture').disabled,false);
});
