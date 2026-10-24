import {capture} from '/dist/index.js';
import {describeSvg,serializeRaster,saveBrowserEvidence} from '/image-boundary-tools.mjs';
const results=[],fontRequests=[];
const assert=(value,message)=>{if(!value)throw Error(message);};
const nativeFontFace=globalThis.FontFace;
// Engine-owned font acquisition must be observed before browser networking.
globalThis.FontFace=class extends nativeFontFace {
 constructor(family,source,options){fontRequests.push({family,source:String(source)});throw Error('Unexpected engine font acquisition');}
};
async function check(name,work){
 try{await work();results.push({name,status:'pass'});}
 catch(error){results.push({name,status:'failed',error:error.code??error.message,stage:error.stage,...(error.evidence?{evidence:error.evidence}:{}),...(error.evidenceError?{evidenceError:error.evidenceError}:{})});}
}
try{
 for(const filled of [false,true])await check(`material-symbols-${filled?'filled':'outlined'}`,async()=>{
  const node=document.createElement('span');node.className='material-symbols-outlined';node.textContent='home';
  node.style.cssText="display:inline-block;width:60px;height:40px;font-family:'Material Symbols Outlined';font-size:24px"+(filled?";font-variation-settings:'FILL' 1":"");
  document.body.append(node);const before=node.outerHTML;let snapshot;
  try{
   snapshot=await capture(node);const svg=(await snapshot.toSvg()).value;
   assert(svg.includes('home'),'Original icon text was replaced');
   assert(fontRequests.length===0,'Engine attempted font acquisition');
   assert(node.outerHTML===before,'Source changed');
  }finally{snapshot?.dispose();node.remove();}
 });
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1000;
 const context=canvas.getContext('2d'),pixels=context.createImageData(1000,1000);let seed=7;
 for(let i=0;i<pixels.data.length;i+=4){for(let c=0;c<3;c++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;pixels.data[i+c]=seed>>>24;}pixels.data[i+3]=255;}
 context.putImageData(pixels,0,0);
 for(const mime of ['image/png','image/jpeg']){
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,.8)),url=URL.createObjectURL(blob);
 try{
  for(const kind of ['image','background'])await check(`downscaled-${mime}-${kind}`,async()=>{
   const node=document.createElement(kind==='image'?'img':'div');node.style.cssText='display:block;width:100px;height:100px';
   if(kind==='image'){node.src=url;await node.decode();}else{node.style.backgroundImage=`url("${url}")`;node.style.backgroundSize='contain';node.style.backgroundRepeat='no-repeat';}
   document.body.append(node);const before=node.outerHTML;let snapshot,svg,output;
   try{
    snapshot=await capture(node,{resources:{network:'deny',resolve:()=>blob}});
    svg=(await snapshot.toSvg()).value;assert(svg.includes(`data:${mime};base64,`),'Prepared image missing');
    output=(await snapshot.toCanvas()).value;
    assert(output.width===100&&output.height===100,'Output geometry mismatch');
    assert(output.getContext('2d').getImageData(50,50,1,1).data[3]===255,'Image output missing');
    output.width=output.height=0;assert(node.outerHTML===before,'Source changed');
   }catch(error){
    if(svg&&new URLSearchParams(location.search).get('save')==='1'){
     const report={case:`downscaled-${mime}-${kind}`,error:error.code??error.message,userAgent:navigator.userAgent,structure:describeSvg(svg),sourceUnchanged:node.outerHTML===before};
     const files={'raw.svg':svg,'current-1.svg':serializeRaster(svg)};
     if(output)files['public-1.png']=output.toDataURL();
     try{error.evidence=await saveBrowserEvidence('engine-boundary',report,files);}catch{error.evidenceError='authored-evidence-save-failed';}
    }
    throw error;
   }finally{if(output)output.width=output.height=0;snapshot?.dispose();node.remove();}
  });
 }finally{URL.revokeObjectURL(url);}
 }
 canvas.width=canvas.height=0;
}finally{
 globalThis.FontFace=nativeFontFace;
 globalThis.engineBoundaryResults={results,fontRequests,userAgent:navigator.userAgent};
 document.getElementById('results').textContent=JSON.stringify(globalThis.engineBoundaryResults,null,2);
 document.body.dataset.engineBoundaries=results.length===6&&results.every(row=>row.status==='pass')&&fontRequests.length===0?'pass':'failed';
}
