import test from 'node:test';
import assert from 'node:assert/strict';
import {createSvgRenderer} from '../../dist/output/svg-renderer.js';

for(const sourceSize of [{width:8192.25,height:1},{width:8000,height:4000.25}]){
 test(`source Canvas limit precedes native allocation for ${sourceSize.width}x${sourceSize.height}`,async()=>{
  let images=0,canvases=0;
  const root={},wrapper={namespaceURI:'http://www.w3.org/1999/xhtml',localName:'div'},object={parentElement:root,children:[wrapper]};root.querySelector=()=>object;
  const doc={defaultView:{CSS:{supports:()=>true},DOMParser:class{parseFromString(){return {documentElement:root};}},Image:class{constructor(){images++;throw Error('Image allocation should not occur');}}},createElement(){canvases++;throw Error('Canvas allocation should not occur');}};
  const size={width:100,height:1},scale=Math.min(size.width/sourceSize.width,size.height/sourceSize.height);
  const plan={outputSize:size,clipRect:{x:0,y:0,...size},drawRect:{x:0,y:0,width:sourceSize.width*scale,height:sourceSize.height*scale},contentRect:{x:0,y:0,...size},scaleX:scale,scaleY:scale,unit:'px',background:null};
  await assert.rejects(createSvgRenderer(doc).render({svg:'',sourceSize},{signal:new AbortController().signal,checkpoint(){}},plan),{code:'OUTPUT_LIMIT',stage:'output'});
  assert.equal(images,0);assert.equal(canvases,0);
 });
}
