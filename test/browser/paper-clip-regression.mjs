import {capture} from '/dist/index.js';

const source=document.querySelector('.invoice');
const results=[],images={};
const margin={top:10,right:10,bottom:10,left:10};
const cases=[
 {name:'default',size:undefined},
 {name:'scale2',size:{kind:'scale',value:2}},
 {name:'custom930',size:{kind:'pixels',width:930,height:840}},
 {name:'A4-72-margin',size:{kind:'paper',name:'A4',ppi:72,marginMm:margin}},
 {name:'A4-72',size:{kind:'paper',name:'A4',ppi:72}},
 {name:'A4-72-cover-asymmetric',size:{kind:'paper',name:'A4',ppi:72,marginMm:{top:8,right:14,bottom:20,left:10}},fit:'cover',align:{x:.8,y:.2}},
 {name:'A4-72-stretch-margin',size:{kind:'paper',name:'A4',ppi:72,marginMm:margin},fit:'stretch'},
 {name:'A4-72-transparent-margin',size:{kind:'paper',name:'A4',ppi:72,marginMm:margin},transparent:true},
 {name:'JIS-B4-72',size:{kind:'paper',name:'B4',system:'jis',orientation:'landscape',ppi:72}},
 {name:'JIS-B4-72-margin',size:{kind:'paper',name:'B4',system:'jis',orientation:'landscape',ppi:72,marginMm:margin}},
 {name:'A4-300-margin',size:{kind:'paper',name:'A4',ppi:300,marginMm:margin}},
 {name:'JIS-B4-300',size:{kind:'paper',name:'B4',system:'jis',orientation:'landscape',ppi:300}},
 {name:'SVG-A4-margin',svg:true,size:{kind:'paper',name:'A4',marginMm:margin}},
 {name:'SVG-A4-stretch-margin',svg:true,size:{kind:'paper',name:'A4',marginMm:margin},fit:'stretch'},
 {name:'SVG-JIS-B4',svg:true,size:{kind:'paper',name:'B4',system:'jis',orientation:'landscape'}},
];
const expect=(condition,message)=>{if(!condition)throw Error(message);};
const center=rect=>({x:rect.left+rect.width/2,y:rect.top+rect.height/2});
function sourceProbes(){
 const root=source.getBoundingClientRect(),inner=source.querySelector('.clip-inner').getBoundingClientRect();
 const circle=source.querySelector('.clip-circle').getBoundingClientRect();
 return [
  {name:'label-marker',point:center(source.querySelector('.clip-label-marker').getBoundingClientRect()),rgb:[198,52,168]},
  {name:'diagonal-stripe',point:center(source.querySelector('.clip-stripe').getBoundingClientRect()),rgb:[44,109,210]},
  {name:'circle-interior',point:center(circle),rgb:[255,245,216]},
  // The circle extends beyond the inner clip. Keeping this outer-background sample
  // prevents a regression fix from simply removing overflow clipping.
  {name:'outside-inner-clip',point:{x:inner.right+1.5,y:circle.top+circle.height/2},rgb:[231,240,253]},
 ].map(probe=>({...probe,point:{x:probe.point.x-root.left,y:probe.point.y-root.top}}));
}

// Independent expected layout from documented paper dimensions and contain/center.
// Do not import the implementation's layout planner or compare two faulty outputs.
function geometry(size,svg,fit='contain',align={x:.5,y:.5}){
 let width=620,height=560,factor=1;
 if(size?.kind==='scale'){width=620*size.value;height=560*size.value;}
 if(size?.kind==='pixels'){width=size.width;height=size.height;}
 if(size?.kind==='paper'){
  const mm=size.name==='A4'?{width:210,height:297}:{width:364,height:257};
  factor=svg?1:size.ppi/25.4;
  width=svg?mm.width:Math.round(mm.width*factor);
  height=svg?mm.height:Math.round(mm.height*factor);
 }
 const m=Object.fromEntries(['top','right','bottom','left'].map(key=>{
  const value=(size?.marginMm?.[key]??0)*factor;return [key,svg?value:Math.round(value)];
 }));
 const available={width:width-m.left-m.right,height:height-m.top-m.bottom};
 const ratios=[available.width/620,available.height/560];
 const scale=fit==='cover'?Math.max(...ratios):Math.min(...ratios);
 const scaleX=fit==='stretch'?ratios[0]:scale,scaleY=fit==='stretch'?ratios[1]:scale;
 return {width,height,scaleX,scaleY,x:m.left+(available.width-620*scaleX)*align.x,y:m.top+(available.height-560*scaleY)*align.y,margins:m,fit};
}

async function rasterizeSvg(svg){
 const image=new Image();
 // Use a self-contained data URI: Blob SVG readback has separate platform taint behavior.
 image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
 await image.decode();
 const canvas=Object.assign(document.createElement('canvas'),{width:image.naturalWidth,height:image.naturalHeight});
 canvas.getContext('2d').drawImage(image,0,0);
 return canvas;
}

function samples(canvas,layout,probes){
 const context=canvas.getContext('2d');
 const fx=canvas.width/layout.width,fy=canvas.height/layout.height;
 const measured=probes.map(probe=>{
  const x=Math.floor((layout.x+probe.point.x*layout.scaleX)*fx);
  const y=Math.floor((layout.y+probe.point.y*layout.scaleY)*fy);
  if(layout.fit==='cover'&&(x<layout.margins.left*fx||x>=(layout.width-layout.margins.right)*fx||y<layout.margins.top*fy||y>=(layout.height-layout.margins.bottom)*fy)){
   return {name:probe.name,x,y,matches:true,skipped:'Outside legitimate cover crop'};
  }
  const rgba=[...context.getImageData(x,y,1,1).data];
  return {name:probe.name,x,y,expected:[...probe.rgb,255],actual:rgba,
   matches:rgba[3]===255&&probe.rgb.every((value,index)=>rgba[index]===value)};
 });
 if(layout.fit==='cover'){
  // A clipped circle may approach the right content edge. No part may leak into
  // the reserved paper margin, even when HTML overflow clipping is preserved.
  const circle=probes.find(probe=>probe.name==='circle-interior');
  const x=Math.floor((layout.width-layout.margins.right+4)*fx);
  const y=Math.floor((layout.y+circle.point.y*layout.scaleY)*fy);
  const rgba=[...context.getImageData(x,y,1,1).data];
  measured.push({name:'outside-paper-clip',x,y,expected:[255,255,255,255],actual:rgba,matches:rgba.every(value=>value===255)});
 }
 return measured;
}

function observeCoverMargin(canvas,layout){
 const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 let nonWhitePixels=0,maxChannelDelta=0,minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1;
 const examples=[];
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  if(x>=layout.margins.left&&x<canvas.width-layout.margins.right&&y>=layout.margins.top&&y<canvas.height-layout.margins.bottom)continue;
  const index=(y*canvas.width+x)*4,rgba=[...pixels.subarray(index,index+4)];
  if(rgba.every(value=>value===255))continue;
  nonWhitePixels++;maxChannelDelta=Math.max(maxChannelDelta,...rgba.map(value=>255-value));
  minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  if(examples.length<16)examples.push({x,y,rgba});
 }
 return {scope:'diagnostic only; exact integer raster clip outside; no threshold assertion',nonWhitePixels,maxChannelDelta,
  bounds:nonWhitePixels?{minX,minY,maxX,maxY}:null,examples};
}

async function run(){
 await document.fonts.ready;
 const initial=source.outerHTML,probes=sourceProbes();
 const report={revision:'paper-clip-regression-2',userAgent:navigator.userAgent,dpr:devicePixelRatio,
  scope:'authored complex nested overflow clip; public outputs; no text antialias tolerance',
  source:{width:620,height:560,probes},results,status:'failed'};
 let snapshot;
 try{
  snapshot=await capture(source);
  const originalSvg=(await snapshot.toSvg()).value;
  expect(originalSvg.includes('중첩 clip · border'),'Retained label text missing');
  for(const fixture of cases){
   const options={...(fixture.size?{size:fixture.size}:{}),...(fixture.fit?{fit:fixture.fit,...(fixture.align?{align:fixture.align}:{})}:{}),background:fixture.transparent?null:'#fff'};
   const result={name:fixture.name,status:'failed',options,svg:!!fixture.svg};
   let output;
   try{
    const layout=geometry(fixture.size,fixture.svg,fixture.fit,fixture.align);
    if(fixture.svg){
     const svg=(await snapshot.toSvg(options)).value;
     const root=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;
     result.svgRoot={width:root.getAttribute('width'),height:root.getAttribute('height'),viewBox:root.getAttribute('viewBox')};
     expect(result.svgRoot.width===`${layout.width}mm`&&result.svgRoot.height===`${layout.height}mm`&&result.svgRoot.viewBox===`0 0 ${layout.width} ${layout.height}`,'Physical SVG root mm/viewBox contract mismatch');
     output=await rasterizeSvg(svg);
    }else output=(await snapshot.toCanvas(options)).value;
    result.layout=layout;result.width=output.width;result.height=output.height;
    // Read the first returned public raster immediately; no timer or SVG mutation.
    result.samples=samples(output,layout,probes);
    if(fixture.fit==='cover')result.coverMarginObservation=observeCoverMargin(output,layout);
    if(fixture.transparent){
     result.marginSample=[...output.getContext('2d').getImageData(1,1,1,1).data];
     expect(result.marginSample.every(value=>value===0),'Transparent paper margin must preserve alpha zero');
    }
    if(!fixture.svg)expect(output.width===layout.width&&output.height===layout.height,'Output dimensions mismatch');
    images[fixture.name]=output.toDataURL('image/png');
    expect(result.samples.every(sample=>sample.matches),'Nested clip content or clipping boundary mismatch');
    expect(source.outerHTML===initial,'Original DOM changed');
    expect((await snapshot.toSvg()).value===originalSvg,'Retained snapshot SVG changed');
    result.status='pass';
   }catch(error){result.error=error.code??error.message;}
   finally{if(output)output.width=output.height=0;}
   results.push(result);
  }
 }catch(error){report.error=error.code??error.message;}
 finally{snapshot?.dispose();}
 report.status=results.length===cases.length&&results.every(result=>result.status==='pass')?'pass':'failed';
 report.completedAt=new Date().toISOString();
 globalThis.paperClipRegressionResults=report;globalThis.paperClipRegressionImages=images;
 document.body.dataset.paperClipRegression=report.status;
 document.getElementById('results').textContent=JSON.stringify(report,null,2);
 for(const [name,src] of Object.entries(images)){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption'),image=new Image();
  caption.textContent=name;image.src=src;image.alt=name;figure.append(caption,image);document.getElementById('outputs').append(figure);
 }
}
await run();
