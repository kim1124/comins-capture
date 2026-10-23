import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('retained disposed snapshots release SVG, renderer and cleanup ownership',()=>{
 const moduleUrl=new URL('../../dist/core/snapshot.js',import.meta.url).href;
 const result=spawnSync(process.execPath,['--expose-gc','--input-type=module','-e',`
  import assert from 'node:assert/strict';
  import {createSnapshot} from ${JSON.stringify(moduleUrl)};
  function fixture(){
   const artifact={svg:'<svg>'+ 'x'.repeat(1_000_000)+'</svg>',sourceSize:{width:24,height:16}};
   const owner={resource:new Uint8Array(1_000_000)};
   const renderer={serialize(value){return value.svg;},async render(){throw Error('unexpected');}};
   const references=[artifact,renderer,owner].map(value=>new WeakRef(value));
   const snapshot=createSnapshot(artifact,renderer,{capturedDpr:1},()=>{owner.resource.fill(0);});
   return {snapshot,references};
  }
  const {snapshot,references}=fixture();
  snapshot.dispose();
  for(let i=0;i<8;i++){await new Promise(setImmediate);global.gc();}
  assert.deepEqual(references.map(reference=>reference.deref()===undefined),[true,true,true]);
  await assert.rejects(snapshot.toSvg(),{code:'DISPOSED'});
 `],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
});
