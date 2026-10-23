import {capture} from '/dist/index.js';
const source=document.querySelector('.invoice'),results=[],images={};
const expect=(condition,message)=>{if(!condition)throw Error(message);};
const context=c=>c.getContext('2d');
const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
function usesDirect(svg){const root=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement,object=root.querySelector('foreignObject');return Boolean(object?.parentElement===root&&[...object.children].some(child=>child.namespaceURI==='http://www.w3.org/1999/xhtml'&&child.localName==='div')&&CSS.supports('zoom','2'));}
const margin={top:10,right:10,bottom:10,left:10};
const cases=[
 {name:'A4-margin',options:{size:{kind:'paper',name:'A4',ppi:72,marginMm:margin},background:'#fff'}},
 {name:'A4',options:{size:{kind:'paper',name:'A4',ppi:72},background:'#fff'}},
 {name:'scale0869',options:{size:{kind:'scale',value:.869354839},background:'#fff'}},
 {name:'cover500',options:{size:{kind:'pixels',width:500,height:400},fit:'cover',align:{x:.8,y:.2},background:'#fff'}},
 {name:'A5-landscape',options:{size:{kind:'paper',name:'A5',orientation:'landscape',ppi:72,marginMm:margin},fit:'cover',background:'#fff'}},
 {name:'A5-transparent',options:{size:{kind:'paper',name:'A5',orientation:'landscape',ppi:72,marginMm:margin},fit:'cover',background:null}},
 {name:'stretch539',options:{size:{kind:'pixels',width:539,height:360},fit:'stretch',background:'#fff'}},
 {name:'transparent',options:{size:{kind:'paper',name:'A4',ppi:72,marginMm:margin},background:null}},
];
// Expected geometry follows documented dimensions and fit rules, independently of planLayout.
function layout(size,options){
 const target=options.size;let width,height;
 if(target.kind==='scale'){width=Math.round(size.width*target.value);height=Math.round(size.height*target.value);}
 else if(target.kind==='pixels')({width,height}=target);
 else{width=Math.round(210*target.ppi/25.4);height=Math.round((target.name==='A4'?297:148)*target.ppi/25.4);}
 const m=Object.fromEntries(['top','right','bottom','left'].map(key=>[key,Math.round((target.marginMm?.[key]??0)*(target.ppi??0)/25.4)]));
 const available={width:width-m.left-m.right,height:height-m.top-m.bottom},fit=options.fit??'contain',align=options.align??{x:.5,y:.5};
 const sx=available.width/size.width,sy=available.height/size.height,scale=fit==='cover'?Math.max(sx,sy):Math.min(sx,sy);
 const scaleX=fit==='stretch'?sx:scale,scaleY=fit==='stretch'?sy:scale;
 return {width,height,scaleX,scaleY,clip:{x:m.left,y:m.top,...available},draw:{x:m.left+(available.width-size.width*scaleX)*align.x,y:m.top+(available.height-size.height*scaleY)*align.y,width:size.width*scaleX,height:size.height*scaleY}};
}
function reference(value,size,plan,background){
 const output=canvas(plan.width,plan.height),ctx=context(output);
 if(background){ctx.fillStyle=background;ctx.fillRect(0,0,output.width,output.height);}
 ctx.save();ctx.beginPath();ctx.rect(plan.clip.x,plan.clip.y,plan.clip.width,plan.clip.height);ctx.clip();
 ctx.drawImage(value,0,0,size.width,size.height,plan.draw.x,plan.draw.y,plan.draw.width,plan.draw.height);ctx.restore();return output;
}
function difference(a,b,roi){
 const x=Math.max(0,Math.floor(roi.x)),y=Math.max(0,Math.floor(roi.y));
 const width=Math.min(a.width-x,Math.ceil(roi.width)),height=Math.min(a.height-y,Math.ceil(roi.height));
 const left=context(a).getImageData(x,y,width,height).data,right=context(b).getImageData(x,y,width,height).data;
 let changed=0;for(let i=0;i<left.length;i++)if(left[i]!==right[i])changed++;
 return {roi:{x,y,width,height},changedChannels:changed};
}
function outsideClip(value,clip,background){
 const pixels=context(value).getImageData(0,0,value.width,value.height).data;let inspected=0,unexpected=0;
 for(let y=0;y<value.height;y++)for(let x=0;x<value.width;x++){if(x>=clip.x&&x<clip.x+clip.width&&y>=clip.y&&y<clip.y+clip.height)continue;inspected++;const offset=(y*value.width+x)*4;if(background?pixels.slice(offset,offset+4).some(v=>v!==255):pixels[offset+3]!==0)unexpected++;}
 return {inspectedPixels:inspected,unexpectedPixels:unexpected,expected:background?'RGBA 255,255,255,255':'alpha 0'};
}
async function tracked(work,{fault,controller}={}){
 const create=document.createElement,draw=CanvasRenderingContext2D.prototype.drawImage,allocated=[],draws=[];
 document.createElement=function(...args){const value=create.apply(this,args);if(args[0]==='canvas')allocated.push(value);return value;};
 CanvasRenderingContext2D.prototype.drawImage=function(...args){
  if(args[0] instanceof HTMLCanvasElement){draws.push({source:{width:args[0].width,height:args[0].height},arguments:args.slice(1)});if(fault==='final-draw')throw Error('authored-final-draw-failure');}
  const result=draw.apply(this,args);if(fault==='source-draw-abort'&&args[0] instanceof HTMLImageElement)controller.abort();return result;
 };
 try{return {value:await work(),allocated,draws};}
 catch(error){return {error,allocated,draws};}
 finally{document.createElement=create;CanvasRenderingContext2D.prototype.drawImage=draw;}
}
async function check(name,work){const row={name,status:'failed'};try{Object.assign(row,await work());row.status='pass';}catch(error){row.error=error.code??error.message;}results.push(row);}
async function decode(blob){const url=URL.createObjectURL(blob);try{const image=new Image();image.src=url;await image.decode();const value=canvas(image.naturalWidth,image.naturalHeight);context(value).drawImage(image,0,0);return value;}finally{URL.revokeObjectURL(url);}}
await document.fonts.ready;
const root=source.getBoundingClientRect(),relative=box=>({x:box.left-root.left,y:box.top-root.top,width:box.width,height:box.height});
const label=source.querySelector('.clip-label'),text=label.firstChild;
const characters=[...text.textContent].map((character,index)=>{const characterRange=document.createRange();characterRange.setStart(text,index);characterRange.setEnd(text,index+character.length);return {character,index,rect:relative(characterRange.getBoundingClientRect())};});
const partitions=characters.reduce((rows,character)=>{let row=rows.find(row=>row.top===character.rect.y);if(!row)rows.push(row={top:character.rect.y,indices:[]});row.indices.push(character.index);return rows;},[]);
const range=document.createRange();range.selectNodeContents(label);
const labelBox=relative(range.getBoundingClientRect()),lines=[...range.getClientRects()].map(relative);
const shadows=[...source.querySelectorAll('.metric,.clip-outer')].filter((_,index)=>index===0||index===3).map(element=>relative(element.getBoundingClientRect()));
const report={revision:'native-downscale-regression-3',userAgent:navigator.userAgent,dpr:devicePixelRatio,sourceRangeLines:lines,sourceCharacterPartitions:partitions,results,scope:'public raster downscale, actual renderer Canvas ownership; no SVG output or long-run heap claim'};
let snapshot=await capture(source),base=(await snapshot.toCanvas()).value;
const size={width:snapshot.meta.sourceRect.width,height:snapshot.meta.sourceRect.height},svg=(await snapshot.toSvg()).value;
images['source-1x']=base.toDataURL();
const direct=usesDirect(svg);report.branch=direct?'direct-html-zoom':'reciprocal-fallback';
await check('unmarked normal text has one source line and nonempty raster ink',async()=>{
 expect(lines.length===1&&partitions.length===1&&partitions[0].indices.length===characters.length,'Source characters must begin on one line');
 const pixels=context(base).getImageData(Math.floor(labelBox.x),Math.floor(labelBox.y),Math.ceil(labelBox.width),Math.ceil(labelBox.height)).data;
 let ink=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<80&&pixels[i+1]<100&&pixels[i+2]<120&&pixels[i+3]>0)ink++;
 expect(ink>0,'Source text raster is empty');return {inkPixels:ink,sourceLineCount:lines.length};
});
for(const fixture of cases)await check(fixture.name,async()=>{
 const plan=layout(size,fixture.options),expected=reference(base,size,plan,fixture.options.background),run=await tracked(()=>snapshot.toCanvas(fixture.options));
 if(run.error)throw run.error;const actual=run.value.value;
 images[fixture.name]=actual.toDataURL();
 const rois=[labelBox,...shadows].map(box=>({x:plan.draw.x+(box.x-4)*plan.scaleX,y:plan.draw.y+(box.y-4)*plan.scaleY,width:(box.width+8)*plan.scaleX,height:(box.height+8)*plan.scaleY}));
 const comparisons=rois.map(roi=>difference(expected,actual,roi));
 const temporary=run.allocated.filter(value=>value!==actual);
 const marginPixels=fixture.name.startsWith('A5-')?outsideClip(actual,plan.clip,fixture.options.background):undefined;
 const observed={comparisons,marginPixels,allocations:run.allocated.length,temporaryReleased:temporary.every(value=>value.width===0&&value.height===0),draws:run.draws};
 try{
  if(direct)expect(comparisons.every(value=>value.changedChannels===0),'Label or shadow differs from independent public1x native downscale');
  if(marginPixels)expect(marginPixels.inspectedPixels>0&&marginPixels.unexpectedPixels===0,'Content leaked outside the paper clip');
  expect(temporary.length===(direct?1:0)&&observed.temporaryReleased,'Unexpected renderer intermediate ownership');
  if(!direct)expect(run.draws.length===0,'Fallback must retain its original Image draw');
  if(fixture.name==='transparent')expect(context(actual).getImageData(0,0,1,1).data[3]===0,'Transparent margin lost');
  expect((await snapshot.toSvg()).value===svg,'Retained SVG changed');return observed;
 }finally{actual.width=actual.height=expected.width=expected.height=0;}
});
await check('JPEG default background follows native reference',async()=>{
 const options={size:cases[0].options.size},plan=layout(size,options),expected=reference(base,size,plan,'#fff');
 const run=await tracked(()=>snapshot.toBlob({...options,format:'jpeg'}));if(run.error)throw run.error;
 const referenceBlob=await new Promise(resolve=>expected.toBlob(resolve,'image/jpeg',.92));
 const actual=await decode(run.value.value),decoded=await decode(referenceBlob);
 try{const diff=difference(actual,decoded,{x:0,y:0,width:actual.width,height:actual.height});if(direct)expect(diff.changedChannels===0,'JPEG differs from independent native encoding');else expect([...context(actual).getImageData(0,0,1,1).data].every(v=>v===255),'JPEG background must be white');expect(run.allocated.length===(direct?2:1)&&run.allocated.every(c=>!c.width&&!c.height),'JPEG renderer Canvases retained');return {difference:diff,allocations:run.allocated.length};}
 finally{actual.width=actual.height=decoded.width=decoded.height=expected.width=expected.height=0;}
});
await check('ten downscale operations release each intermediate',async()=>{
 for(let i=0;i<10;i++){const run=await tracked(()=>snapshot.toCanvas(cases[2].options));if(run.error)throw run.error;const output=run.value.value;try{expect(run.allocated.length===(direct?2:1),'Unexpected source intermediate');expect(run.allocated.filter(c=>c!==output).every(c=>!c.width&&!c.height),'Intermediate retained');}finally{output.width=output.height=0;}}
 return {iterations:10};
});
if(direct)await check('final draw failure clears actual renderer Canvases',async()=>{
 const run=await tracked(()=>snapshot.toCanvas(cases[2].options),{fault:'final-draw'});
 try{expect(run.error?.code==='ENGINE_FAILED','Final native draw failure must reject');expect(run.allocated.length===2&&run.allocated.every(c=>!c.width&&!c.height),'Unreturned Canvas retained');return {allocations:run.allocated.length};}
 finally{if(run.value?.value)run.value.value.width=run.value.value.height=0;}
});
if(direct)await check('abort after source draw clears allocated renderer intermediate',async()=>{
 const controller=new AbortController(),run=await tracked(()=>snapshot.toCanvas({...cases[2].options,signal:controller.signal}),{fault:'source-draw-abort',controller});
 expect(run.error?.code==='ABORTED','Abort after source draw must reject as ABORTED');expect(run.allocated.length===1&&run.allocated.every(value=>!value.width&&!value.height),'Allocated source Canvas retained after abort');
 await new Promise(requestAnimationFrame);await snapshot.toSvg();return {allocations:run.allocated.length,allReleased:true,leaseDrained:true};
});
base.width=base.height=0;snapshot.dispose();
for(const kind of ['abort','timeout','dispose'])await check(`pending decode ${kind} drains without Canvas retention`,async()=>{
 const current=await capture(source),imagePrototype=source.ownerDocument.defaultView.HTMLImageElement.prototype;
 const originalDecode=Object.getOwnPropertyDescriptor(imagePrototype,'decode');let release,entered;
 const gate=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{entered=resolve;});
 const controller=new AbortController();
 try{
  expect(typeof originalDecode?.value==='function','Native image decode descriptor unavailable');
  // Hook the actual image method: Safari may bypass a replaced window.Image constructor.
  Object.defineProperty(imagePrototype,'decode',{...originalDecode,value:async function(...args){await originalDecode.value.apply(this,args);entered();await gate;}});
  const run=await tracked(async()=>{
   const operation=current.toCanvas({...cases[2].options,...(kind==='timeout'?{timeoutMs:100}:{signal:controller.signal})});
   const outcome=operation.then(value=>{value.value.width=value.value.height=0;return {unexpected:true};},error=>({code:error.code}));
   await Promise.race([started,outcome.then(()=>{throw Error('Output settled before pending decode hook entered');})]);
   if(kind==='abort')controller.abort();if(kind==='dispose')current.dispose();
   const rejected=await outcome;expect(rejected.code===({abort:'ABORTED',timeout:'TIMEOUT',dispose:'DISPOSED'}[kind]),'Pending decode rejection mismatch');
   if(kind!=='dispose'){let busy;try{await current.toSvg();}catch(error){busy=error.code;}expect(busy==='BUSY','Pending renderer drain lost its lease');}
   release();await new Promise(requestAnimationFrame);
   if(kind!=='dispose')await current.toSvg();return rejected;
  });
  if(run.error)throw run.error;expect(run.allocated.every(c=>!c.width&&!c.height),'Late renderer Canvas retained');return {rejected:run.value.code,allocations:run.allocated.length};
 }finally{release();if(originalDecode)Object.defineProperty(imagePrototype,'decode',originalDecode);current.dispose();}
});
await check('fractional source uses ceil allocation and actual fractional source crop',async()=>{
 const target=document.createElement('div');target.style.cssText='width:620.25px;height:560.5px;background:#e0203c';document.body.append(target);
 const current=await capture(target),fractionalDirect=usesDirect((await current.toSvg()).value);
 try{const run=await tracked(()=>current.toCanvas({size:{kind:'pixels',width:310,height:280},fit:'stretch'}));if(run.error)throw run.error;const output=run.value.value;
  try{const draw=run.draws.find(row=>row.arguments.length===8);if(fractionalDirect){expect(draw?.source.width===621&&draw.source.height===561,'Fractional source Canvas must use ceil dimensions');expect(draw.arguments[2]===620.25&&draw.arguments[3]===560.5,'Native source crop must retain fractional dimensions');}else expect(run.draws.length===0,'Fallback must not allocate a native source Canvas');const edges=[[309,140],[155,279]].map(([x,y])=>[...context(output).getImageData(x,y,1,1).data]);expect(edges.every(pixel=>pixel[3]>0),'Fractional source edge disappeared');expect(run.allocated.filter(c=>c!==output).every(c=>!c.width&&!c.height),'Fractional intermediate retained');return {draw,edgePixels:edges};}
  finally{output.width=output.height=0;}
 }finally{current.dispose();target.remove();}
});
for(const [width,height] of [[8192.25,1],[8000,4000.25]])await check(`intermediate OUTPUT_LIMIT ${width}x${height}`,async()=>{
 const target=document.createElement('div');target.style.cssText=`width:${width}px;height:${height}px;background:#123456`;document.body.append(target);const current=await capture(target),limitDirect=usesDirect((await current.toSvg()).value);
 try{const run=await tracked(()=>current.toCanvas({size:{kind:'pixels',width:100,height:1}}));try{if(limitDirect){expect(run.error?.code==='OUTPUT_LIMIT','Intermediate allocation limit must propagate');expect(run.allocated.length===0,'Oversized intermediate allocated a Canvas');}else{if(run.error)throw run.error;expect(run.allocated.length===1&&run.draws.length===0,'Fallback allocation behavior changed');}return {code:run.error?.code??'unchanged-fallback',allocations:run.allocated.length};}finally{if(run.value?.value)run.value.value.width=run.value.value.height=0;}}
 finally{current.dispose();target.remove();}
});
report.status=results.every(row=>row.status==='pass')?'pass':'failed';report.completedAt=new Date().toISOString();
globalThis.nativeDownscaleRegressionResults=report;globalThis.nativeDownscaleRegressionImages=images;
document.body.dataset.nativeDownscaleRegression=report.status;document.getElementById('results').textContent=JSON.stringify(report,null,2);
