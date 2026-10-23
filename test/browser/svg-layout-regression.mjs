import {capture} from '/dist/index.js';

const results=[],images={},files={};
const expect=(condition,message)=>{if(!condition)throw Error(message);};
const ctx=canvas=>canvas.getContext('2d');
const makeCanvas=(width,height)=>Object.assign(document.createElement('canvas'),{width,height});
const margin={top:10,right:10,bottom:10,left:10};
const cases=[
 {name:'css1240',options:{size:{kind:'css',width:1240,height:1120},background:'#fff'}},
 {name:'css539',options:{size:{kind:'css',width:539,height:487},background:'#fff'}},
 {name:'A4-mm-margin',options:{size:{kind:'paper',name:'A4',marginMm:margin},background:'#fff'}},
 {name:'A5-landscape-mm-margin',options:{size:{kind:'paper',name:'A5',orientation:'landscape',marginMm:margin},background:'#fff'}},
 {name:'cover-asymmetric',options:{size:{kind:'css',width:539,height:400},fit:'cover',align:{x:.8,y:.2},background:'#fff'}},
 {name:'stretch539',options:{size:{kind:'css',width:539,height:360},fit:'stretch',background:'#fff'}},
];
async function check(name,work){const result={name,status:'failed'};try{Object.assign(result,await work());result.status='pass';}catch(error){result.error=error.code??error.message;}results.push(result);}
function partitions(element){
 const doc=element.ownerDocument,walker=doc.createTreeWalker(element,NodeFilter.SHOW_TEXT),rows=[];
 let text,offset=0;
 while((text=walker.nextNode())){
  for(let index=0;index<text.length;index++){
   const range=doc.createRange();range.setStart(text,index);range.setEnd(text,index+1);
   const box=range.getBoundingClientRect();let row=rows.find(row=>row.top===box.top);
   if(!row)rows.push(row={top:box.top,indices:[],text:''});row.indices.push(offset+index);row.text+=text.data[index];
  }
  offset+=text.length;
 }
 return rows;
}
const signature=rows=>rows.map(row=>row.indices);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// This test has no marked-up label or replacement glyph. Reuse the original invoice verbatim.
const authored=new DOMParser().parseFromString(await (await fetch('/native-downscale-regression.html')).text(),'text/html');
const style=document.createElement('style');style.textContent=authored.querySelector('style').textContent;document.head.append(style);
const source=document.importNode(authored.querySelector('.invoice'),true);document.querySelector('#fixture').append(source);
await document.fonts.ready;
const sourceRect=source.getBoundingClientRect(),relative=box=>({x:box.left-sourceRect.left,y:box.top-sourceRect.top,width:box.width,height:box.height});
const label=source.querySelector('.clip-label'),range=document.createRange();range.selectNodeContents(label);
const labelBox=relative(range.getBoundingClientRect()),sourcePartitions=partitions(label);
const labelLineHeight=parseFloat(getComputedStyle(label).lineHeight);
const boxes=Object.fromEntries(['.metric','.clip-inner','.clip-outer','.clip-circle','.clip-stripe'].map(selector=>[selector,relative(source.querySelector(selector).getBoundingClientRect())]));
// Independent document geometry, deliberately not importing the production planner.
function layout(options){
 const paper=options.size.kind==='paper',width=paper?210:options.size.width,height=paper?(options.size.name==='A5'?148:297):options.size.height;
 const m=paper?options.size.marginMm??{top:0,right:0,bottom:0,left:0}:{top:0,right:0,bottom:0,left:0};
 const clip={x:m.left,y:m.top,width:width-m.left-m.right,height:height-m.top-m.bottom};
 const sx=clip.width/sourceRect.width,sy=clip.height/sourceRect.height,fit=options.fit??'contain';
 const scale=fit==='cover'?Math.max(sx,sy):Math.min(sx,sy),scaleX=fit==='stretch'?sx:scale,scaleY=fit==='stretch'?sy:scale;
 const align=options.align??{x:.5,y:.5};
 return {width,height,unit:paper?'mm':'css-px',clip,scaleX,scaleY,x:clip.x+(clip.width-sourceRect.width*scaleX)*align.x,y:clip.y+(clip.height-sourceRect.height*scaleY)*align.y};
}
function embeddedSvg(svg){
 const parsed=new DOMParser().parseFromString(svg,'image/svg+xml'),values=[];
 for(const element of parsed.querySelectorAll('image,feImage')){const href=element.getAttribute('href')??element.getAttributeNS('http://www.w3.org/1999/xlink','href')??'';if(href.startsWith('data:image/svg+xml')){const comma=href.indexOf(',');values.push(href.slice(0,comma).includes(';base64')?atob(href.slice(comma+1)):decodeURIComponent(href.slice(comma+1)));}}
 return values;
}
async function inspect(svg,plan){
 const nested=embeddedSvg(svg);if(nested.length){const result=await inspect(nested[0],{width:sourceRect.width,height:sourceRect.height,unit:'css-px'});return {...result,layoutSurface:'embedded immutable native1x SVG'};}
 const frame=document.createElement('iframe'),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 frame.width=String(plan.unit==='mm'?plan.width*96/25.4:plan.width);frame.height=String(plan.unit==='mm'?plan.height*96/25.4:plan.height);
 try{const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;});frame.src=url;document.body.append(frame);await loaded;await frame.contentDocument.fonts.ready;
  const retainedLabel=frame.contentDocument.querySelector('.clip-label');expect(retainedLabel,'Serialized SVG label element disappeared');
  return {partitions:partitions(retainedLabel),text:retainedLabel.textContent};
 }finally{frame.remove();URL.revokeObjectURL(url);}
}
async function decode(svg){
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();
 const canvas=makeCanvas(image.naturalWidth,image.naturalHeight);ctx(canvas).drawImage(image,0,0);return canvas;
}
function pixel(canvas,x,y){return [...ctx(canvas).getImageData(Math.floor(x),Math.floor(y),1,1).data];}
function mapping(canvas,plan){return {x:x=>(plan.x+x*plan.scaleX)*canvas.width/plan.width,y:y=>(plan.y+y*plan.scaleY)*canvas.height/plan.height};}
function region(canvas,rect,test){
 const left=Math.max(0,Math.ceil(rect.x)),top=Math.max(0,Math.ceil(rect.y)),right=Math.min(canvas.width,Math.floor(rect.x+rect.width)),bottom=Math.min(canvas.height,Math.floor(rect.y+rect.height));
 let matched=0,inspected=0;for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){inspected++;if(test(pixel(canvas,x,y)))matched++;}return {inspected,matched};
}
function imageObservations(canvas,plan){
 const map=mapping(canvas,plan),sx=plan.scaleX*canvas.width/plan.width,sy=plan.scaleY*canvas.height/plan.height;
 // A second line must not appear below the source Range's one line. The ROI ends
 // before the fixture's blue stripe; its authored background contains no dark ink.
 const below={x:map.x(labelBox.x),y:map.y(labelBox.y+labelBox.height+1),width:labelBox.width*sx,height:(labelLineHeight-3)*sy};
 const dark=p=>p[0]<80&&p[1]<100&&p[2]<120&&p[3]>0;
 const first=region(canvas,{x:map.x(labelBox.x),y:map.y(labelBox.y),width:labelBox.width*sx,height:labelBox.height*sy},dark),second=region(canvas,below,dark);
 const inner=boxes['.clip-inner'],circle=boxes['.clip-circle'],stripe=boxes['.clip-stripe'];
 const probes=[
  {name:'stripe',x:stripe.x+stripe.width/2,y:stripe.y+stripe.height/2,rgb:[44,109,210]},
  {name:'circle',x:circle.x+circle.width/2,y:circle.y+circle.height/2,rgb:[255,245,216]},
  {name:'outside-inner-clip',x:inner.x+inner.width+1.5,y:circle.y+circle.height/2,rgb:[231,240,253]},
 ].map(probe=>{const x=map.x(probe.x),y=map.y(probe.y);const visible=x>=plan.clip.x*canvas.width/plan.width&&x<(plan.clip.x+plan.clip.width)*canvas.width/plan.width&&y>=plan.clip.y*canvas.height/plan.height&&y<(plan.clip.y+plan.clip.height)*canvas.height/plan.height;return {...probe,x,y,visible,actual:visible?pixel(canvas,x,y):undefined};});
 const metric=boxes['.metric'];
 // The authored 0 2px 4px shadow darkens the otherwise-white region below
 // the metric. Each interior column must retain a shadow within this extent;
 // the farther band is outside the declared blur and must stay white.
 const shadowRect={x:map.x(metric.x+metric.width*.25),y:Math.floor(map.y(metric.y+metric.height)),width:metric.width*.5*sx,height:Math.ceil(map.y(metric.y+metric.height+4))-Math.floor(map.y(metric.y+metric.height))};
 const shadow=region(canvas,shadowRect,p=>p[3]===255&&p.slice(0,3).every(v=>v<255&&v>200));
 const shadowColumns=[];
 for(let x=Math.ceil(shadowRect.x);x<Math.floor(shadowRect.x+shadowRect.width);x++)shadowColumns.push(region(canvas,{x,y:shadowRect.y,width:1,height:shadowRect.height},p=>p[3]===255&&p.slice(0,3).every(v=>v<255&&v>200)).matched>0);
 const outsideShadow=region(canvas,{x:shadowRect.x,y:Math.ceil(map.y(metric.y+metric.height+7)),width:shadowRect.width,height:Math.max(1,Math.ceil(2*sy))},p=>p.some(v=>v!==255));
 const marginPixels={inspected:0,matched:0},data=ctx(canvas).getImageData(0,0,canvas.width,canvas.height).data;
 // Test all four reserved margins, excluding only the fractional SVG viewport
 // edge and the antialiased boundary pixel, where coverage need not be opaque.
 const clip={left:plan.clip.x*canvas.width/plan.width,right:(plan.clip.x+plan.clip.width)*canvas.width/plan.width,top:plan.clip.y*canvas.height/plan.height,bottom:(plan.clip.y+plan.clip.height)*canvas.height/plan.height};
 for(let y=1;y<canvas.height-1;y++)for(let x=1;x<canvas.width-1;x++){if(!(x+1<clip.left||x>clip.right+1||y+1<clip.top||y>clip.bottom+1))continue;marginPixels.inspected++;const offset=(y*canvas.width+x)*4;if(data.slice(offset,offset+4).some(v=>v!==255))marginPixels.matched++;}
 const shadowSamples=Array.from({length:9},(_,index)=>({offset:index-2,pixel:pixel(canvas,map.x(metric.x+metric.width/2),map.y(metric.y+metric.height)+index-2)}));
 return {firstLineInk:first,unexpectedSecondLineInk:second,probes,shadowBand:{...shadow,columns:shadowColumns.length,columnsWithShadow:shadowColumns.filter(Boolean).length,outsideBoundingBand:outsideShadow},shadowSamples,marginPixels};
}
function structure(svg,baseline,originalSvg){
 const parsed=new DOMParser().parseFromString(svg,'image/svg+xml');expect(!parsed.querySelector('parsererror'),'Invalid XML');
 const root=parsed.documentElement,nested=embeddedSvg(svg);
 expect(nested.length<=1&&nested.every(value=>value===originalSvg),'Embedded SVG must preserve the exact immutable verified source');
 const content=nested.length?new DOMParser().parseFromString(nested[0],'image/svg+xml'):parsed;
 const objects=content.querySelectorAll('foreignObject'),label=content.querySelector('.clip-label');
 const rasterImages=doc=>[...doc.querySelectorAll('image,img,feImage')].map(element=>element.getAttribute('href')??element.getAttribute('src')??element.getAttributeNS('http://www.w3.org/1999/xlink','href')).filter(value=>!value?.startsWith('data:image/svg+xml'));
 const images=[...rasterImages(parsed),...(nested.length?rasterImages(content):[])];
 expect(objects.length===1&&label?.textContent==='중첩 clip · border','ForeignObject HTML text was flattened or lost');
 expect(same(images,baseline),'A new raster image was embedded in the SVG');
 expect(content.querySelector('.clip-stripe')&&content.querySelector('.clip-circle')&&content.querySelector('table'),'Source HTML shape/table structure disappeared');
 return {width:root.getAttribute('width'),height:root.getAttribute('height'),viewBox:root.getAttribute('viewBox'),foreignObjects:objects.length,rasterImages:images.length,embeddedImmutableSvg:nested.length};
}
const report={revision:'svg-layout-regression-2',userAgent:navigator.userAgent,dpr:devicePixelRatio,source:{size:{width:sourceRect.width,height:sourceRect.height},labelBox,lineHeight:labelLineHeight,partitions:sourcePartitions,boxes},results,scope:'public SVG string/Blob; unmarked invoice; independent source Range and authored image probes; no native Safari claim'};
let snapshot;
try{
 expect(sourcePartitions.length===1&&sourcePartitions[0].text==='중첩 clip · border','Source label must begin on one line');
 const original=source.outerHTML;snapshot=await capture(source);
 const originalSvg=(await snapshot.toSvg()).value;files['source-1x.svg']=originalSvg;
 const baseline=[...new DOMParser().parseFromString(originalSvg,'image/svg+xml').querySelectorAll('image,img')].map(element=>element.getAttribute('href')??element.getAttribute('src'));
 const native=await decode(originalSvg);images['source-1x']=native.toDataURL();report.source.nativeImage=imageObservations(native,{width:sourceRect.width,height:sourceRect.height,clip:{x:0,y:0,width:sourceRect.width,height:sourceRect.height},scaleX:1,scaleY:1,x:0,y:0});native.width=native.height=0;
 expect(report.source.nativeImage.firstLineInk.matched>0&&report.source.nativeImage.unexpectedSecondLineInk.matched===0,'Public native1x SVG is not a valid one-line control');
 for(const fixture of cases){
  const row={name:fixture.name,status:'failed',options:fixture.options};let image;
  try{
   const plan=layout(fixture.options),svg=(await snapshot.toSvg(fixture.options)).value;files[fixture.name+'.svg']=svg;
   const blob=(await snapshot.toBlob({...fixture.options,format:'svg'})).value;
   expect(blob.type==='image/svg+xml'&&await blob.text()===svg,'SVG Blob and string contract differ');
   row.root=structure(svg,baseline,originalSvg);expect(row.root.width===`${plan.width}${plan.unit==='mm'?'mm':''}`&&row.root.height===`${plan.height}${plan.unit==='mm'?'mm':''}`,'SVG output dimensions mismatch');
   row.serialized=await inspect(svg,plan);image=await decode(svg);images[fixture.name]=image.toDataURL();row.image=imageObservations(image,plan);row.layout=plan;
   const failures=[];
   if(!same(signature(row.serialized.partitions),signature(sourcePartitions)))failures.push('Serialized SVG changed source character line partition');
   if(row.image.firstLineInk.matched===0||row.image.unexpectedSecondLineInk.matched!==0)failures.push('Decoded SVG changed the source one-line text layout');
   if(row.image.probes.some(probe=>probe.visible&&!same(probe.actual,[...probe.rgb,255])))failures.push('Decoded shape or nested clip sample mismatch');
   if(row.image.shadowBand.columns===0||row.image.shadowBand.columnsWithShadow!==row.image.shadowBand.columns||row.image.shadowBand.outsideBoundingBand.matched!==0)failures.push('Decoded metric shadow band missing or striped');
   if(row.image.marginPixels.matched!==0)failures.push('Content leaked into paper margin');
   expect(source.outerHTML===original,'SVG output mutated source DOM');expect((await snapshot.toSvg()).value===originalSvg,'Output mutated retained source SVG');
   row.failures=failures;expect(failures.length===0,failures.join('; '));row.status='pass';
  }catch(error){row.error=error.code??error.message;}finally{if(image)image.width=image.height=0;}results.push(row);
 }
 await check('source mutation preserves retained SVG and output',async()=>{
  const before=(await snapshot.toSvg(cases[0].options)).value,oldStyle=source.getAttribute('style'),oldText=label.textContent;
  try{source.style.width='300px';label.textContent='MUTATED SOURCE';expect((await snapshot.toSvg()).value===originalSvg,'Live source mutation changed retained SVG');expect((await snapshot.toSvg(cases[0].options)).value===before,'Live source mutation changed serialized output');}
  finally{if(oldStyle===null)source.removeAttribute('style');else source.setAttribute('style',oldStyle);label.textContent=oldText;}
  return {retainedBytesUnchanged:true,outputBytesUnchanged:true};
 });
}catch(error){report.error=error.code??error.message;}finally{snapshot?.dispose();}
report.status=!report.error&&results.length===cases.length+1&&results.every(row=>row.status==='pass')?'pass':'failed';report.completedAt=new Date().toISOString();
globalThis.svgLayoutRegressionResults=report;globalThis.svgLayoutRegressionImages=images;globalThis.svgLayoutRegressionFiles=files;
document.body.dataset.svgLayoutRegression=report.status;document.querySelector('#results').textContent=JSON.stringify(report,null,2);
