import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForResourceFrame} from '../browser/resource-runner.mjs';

function fixture(){
 const window=new EventTarget(),frame=new EventTarget();frame.contentWindow={};
 let expired;const stages=[];
 const result=waitForResourceFrame(frame,'authored-run',{window,origin:'http://fixture.test',timeoutMs:45_000,
  setTimeout(callback){expired=callback;return 1;},clearTimeout(){},onStage:event=>stages.push(event)});
 const message=(data,source=frame.contentWindow,origin='http://fixture.test')=>{
  const event=new Event('message');Object.assign(event,{data,source,origin});window.dispatchEvent(event);
 };
 return {frame,result,message,stages,expire:()=>expired()};
}
test('frame results require the expected source, origin and run before accepting a result',async()=>{
 const f=fixture(),report={status:'pass'};
 f.message({type:'resource-check-result',run:'authored-run',report},{ });
 f.message({type:'resource-check-result',run:'authored-run',report},f.frame.contentWindow,'http://other.test');
 f.message({type:'resource-check-result',run:'other-run',report});
 f.message({type:'resource-check-stage',run:'authored-run',stage:'import-ready'});
 f.message({type:'resource-check-result',run:'authored-run',report});
 assert.deepEqual(await f.result,report);
 assert.deepEqual(f.stages.map(event=>event.stage),['import-ready','result-received']);
 f.frame.dispatchEvent(new Event('load'));
 assert.equal(f.stages.length,2,'result removes load and message listeners');
});
test('timeout distinguishes navigation, module bootstrap, and an executing fixture',async()=>{
 for(const [stage,expected] of [[undefined,'runner-navigation-timeout'],['load','runner-bootstrap-timeout'],['import-start','runner-import-timeout'],['capture-start','runner-case-timeout']]){
  const f=fixture();
  if(stage==='load')f.frame.dispatchEvent(new Event('load'));
  else if(stage)f.message({type:'resource-check-stage',run:'authored-run',stage});
  const rejected=assert.rejects(f.result,error=>error.code===expected&&error.lastStage===(stage??'navigation-start'));
  f.expire();await rejected;
 }
});
test('a frame navigation error is retained separately from fixture assertion failures',async()=>{
 const f=fixture(),rejected=assert.rejects(f.result,error=>error.code==='runner-navigation-error');
 f.frame.dispatchEvent(new Event('error'));await rejected;
});
test('late frame load does not replace an executing fixture stage',async()=>{
 const f=fixture();f.message({type:'resource-check-stage',run:'authored-run',stage:'capture-start'});
 f.frame.dispatchEvent(new Event('load'));
 const rejected=assert.rejects(f.result,error=>error.code==='runner-case-timeout'&&error.lastStage==='capture-start');
 f.expire();await rejected;
});
