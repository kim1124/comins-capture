import {capture} from '/dist/index.js';
const colors=[[224,40,60],[30,160,80],[40,70,220],[230,180,30]],points=[[.25,.25],[.75,.25],[.25,.75],[.75,.75]],results=[];
const cases=[
 {mime:'image/png',root:'img',scale:1},{mime:'image/jpeg',root:'img',scale:1},
 {mime:'image/png',root:'div',scale:1},{mime:'image/jpeg',root:'div',scale:1},
 {mime:'image/png',root:'img',scale:2},{mime:'image/png',root:'img',scale:1,transparent:true},
];
for(const fixture of cases){
 const report={...fixture,status:'failed'};let snapshot,url,target,output;
 try{
  const source=document.createElement('canvas');source.width=source.height=1000;
  const context=source.getContext('2d'),pixels=context.createImageData(1000,1000);let seed=7;
  for(let i=0;i<pixels.data.length;i+=4){for(let c=0;c<3;c++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;pixels.data[i+c]=seed>>>24;}pixels.data[i+3]=255;}context.putImageData(pixels,0,0);
  points.forEach(([x,y],index)=>{context.fillStyle=`rgb(${colors[index].join(',')})`;context.fillRect(x*1000-100,y*1000-100,200,200);});
  const corner=crypto.getRandomValues(new Uint8Array(3));context.fillStyle=`rgb(${corner.join(',')})`;context.fillRect(0,0,100,100);
  if(fixture.transparent)context.clearRect(650,650,200,200);
  const blob=await new Promise(resolve=>source.toBlob(resolve,fixture.mime,.8));source.width=source.height=0;
  url=URL.createObjectURL(blob);const image=new Image();image.src=url;image.style.cssText='display:block;width:100px;height:100px';await image.decode();
  target=fixture.root==='img'?image:document.createElement('div');if(target!==image)target.append(image);target.style.cssText='display:block;width:100px;height:100px';document.getElementById('fixtures').append(target);
  const before=target.outerHTML;snapshot=await capture(target,{resources:{network:'deny',resolve:()=>blob}});
  output=(await snapshot.toCanvas({size:{kind:'scale',value:fixture.scale}})).value;
  // Read immediately after the public result; no retained renderer Image, timer, or test-side SVG mutation.
  report.pixels=points.map(([x,y])=>[...output.getContext('2d').getImageData(Math.floor(output.width*x),Math.floor(output.height*y),1,1).data]);
  report.geometry=output.width===100*fixture.scale&&output.height===100*fixture.scale;
  report.sourceUnchanged=target.outerHTML===before;
  report.pixelsMatch=report.pixels.every((pixel,index)=>fixture.transparent&&index===3?pixel[3]===0:pixel[3]===255&&pixel.slice(0,3).every((value,channel)=>Math.abs(value-colors[index][channel])<=12));
  if(!report.geometry||!report.sourceUnchanged||!report.pixelsMatch)throw Error('cold-image-output-mismatch');
  report.status='pass';
 }catch(error){report.error=error.code??error.message;}
 finally{if(output)output.width=output.height=0;snapshot?.dispose();target?.remove();if(url)URL.revokeObjectURL(url);}
 results.push(report);
}
globalThis.imageColdRegressionResults={userAgent:navigator.userAgent,scope:'authored-cold-image-immediate-raster',results};
document.getElementById('results').textContent=JSON.stringify(globalThis.imageColdRegressionResults,null,2);
document.body.dataset.imageColdRegression=results.length===6&&results.every(result=>result.status==='pass')?'pass':'failed';
