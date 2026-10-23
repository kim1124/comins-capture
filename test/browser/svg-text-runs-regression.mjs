import {capture} from '/dist/index.js';
const results=[],images={};
const expect=(condition,message)=>{if(!condition)throw Error(message);};
const cases=[
 {name:'multiple-fonts',eligible:true,style:'font-family:Georgia,serif;font-variant-ligatures:common-ligatures;font-feature-settings:"liga" 1;width:200.25px;height:24.5px',text:'office ffi Alpha',multiple:true},
 {name:'custom-fill',eligible:true,style:'-webkit-text-fill-color:rgb(240,40,50)',text:'Styled fill'},
 {name:'isolated-ltr-ancestor',eligible:true,parentStyle:'unicode-bidi:isolate'},
 {name:'align-last',eligible:true,style:'text-align-last:right',text:'Rightmost text'},
 {name:'hidden-leaf',style:'visibility:hidden',hidden:true},
 {name:'hidden-ancestor',rootStyle:'visibility:hidden',hidden:true},
 {name:'normal-flow',eligible:true,style:'position:static'},
 {name:'padded',style:'padding-left:3px'},
 {name:'bordered',style:'border:2px solid #222'},
 {name:'mixed-inline',mixed:true},
 {name:'multiple-text-nodes',split:true},
 {name:'generated-pseudo',pseudo:true},
 {name:'rtl',style:'direction:rtl'},
 {name:'leaf-isolate',eligible:true,style:'unicode-bidi:isolate'},
 {name:'rtl-script',text:'Mixed אבג'},
 {name:'bidi-control',text:'abc\u202edef'},
 {name:'preformatted',style:'white-space:pre',text:'first\nsecond'},
 {name:'text-shadow',style:'text-shadow:1px 1px red'},
 {name:'scrollable',style:'overflow:auto'},
 {name:'clipped-leaf',style:'overflow:hidden'},
 {name:'text-security',style:'-webkit-text-security:disc'},
 {name:'transformed-ancestor',parentStyle:'transform:translateX(2px)'},
 {name:'zoomed-ancestor',parentStyle:'zoom:1.1'},
];
function geometry(element,root){
 const rootBox=root.getBoundingClientRect(),walker=element.ownerDocument.createTreeWalker(element,NodeFilter.SHOW_TEXT),rows=[];
 let text,offset=0;const boxes=[];
 while((text=walker.nextNode())){for(let i=0;i<text.length;i++){const range=element.ownerDocument.createRange();range.setStart(text,i);range.setEnd(text,i+1);const box=range.getBoundingClientRect();boxes.push(box);let row=rows.find(row=>row.top===box.top);if(!row)rows.push(row={top:box.top,indices:[]});row.indices.push(offset+i);}offset+=text.length;}
 const left=Math.min(...boxes.map(box=>box.left)),top=Math.min(...boxes.map(box=>box.top)),right=Math.max(...boxes.map(box=>box.right)),bottom=Math.max(...boxes.map(box=>box.bottom));
 const box=element.getBoundingClientRect(),matrix=root.getScreenCTM?.(),inverse=matrix?.inverse();
 // Range uses the actual CSS viewport. Normalize through the measured root
 // CTM so fractional intrinsic SVG viewport rounding is not text-shaping error.
 const logical=(x,y)=>inverse?new DOMPoint(x,y).matrixTransform(inverse):{x:x-rootBox.left,y:y-rootBox.top};
 const first=logical(left,top),last=logical(right,bottom);
 return {text:element.textContent,x:first.x,y:first.y,width:last.x-first.x,height:last.y-first.y,partitions:rows.map(row=>row.indices),rootBox:{x:rootBox.x,y:rootBox.y,width:rootBox.width,height:rootBox.height},rootScreenCTM:matrix?Object.fromEntries(['a','b','c','d','e','f'].map(key=>[key,matrix[key]])):null,elementBox:{x:box.left-rootBox.left,y:box.top-rootBox.top,width:box.width,height:box.height},glyphOrigin:{x:left-box.left,y:top-box.top}};
}
async function frameSvg(svg,work){
 const frame=document.createElement('iframe'),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));frame.width='240';frame.height='67';
 try{const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;});frame.src=url;document.body.append(frame);await loaded;await frame.contentDocument.fonts.ready;return work(frame.contentDocument);}
 finally{frame.remove();URL.revokeObjectURL(url);}
}
async function decode(svg){const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();const canvas=Object.assign(document.createElement('canvas'),{width:image.naturalWidth,height:image.naturalHeight});canvas.getContext('2d').drawImage(image,0,0);return canvas;}
function ink(canvas){const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let nonWhite=0,dark=0,red=0,partialAlphaPixels=0;const alphaExamples=[];for(let i=0;i<data.length;i+=4){if(data.slice(i,i+3).some(v=>v!==255))nonWhite++;if(data[i]<100&&data[i+1]<100&&data[i+2]<100)dark++;if(data[i]>120&&data[i+1]<100&&data[i+2]<110)red++;if(data[i+3]!==255){partialAlphaPixels++;if(alphaExamples.length<3)alphaExamples.push({x:i/4%canvas.width,y:Math.floor(i/4/canvas.width),rgba:[...data.slice(i,i+4)]});}}return {nonWhite,dark,red,partialAlphaPixels,alphaExamples};}
function makeSource(fixture){
 const source=document.createElement('div');source.style.cssText='position:relative;box-sizing:content-box;width:360px;height:100px;padding:0;border:0;background:#fff;color:#000;font:16px/22px system-ui;'+(fixture.rootStyle??'');
 const parent=document.createElement('div');parent.style.cssText='position:relative;width:360px;height:100px;'+(fixture.parentStyle??'');source.append(parent);
 const leaf=document.createElement('span');leaf.id='text-'+fixture.name;leaf.className=fixture.pseudo?'generated-before':'memo-'+fixture.name;leaf.style.cssText='position:absolute;display:block;left:12px;top:12px;box-sizing:content-box;width:200px;height:24px;margin:0;padding:0;border:0;'+(fixture.style??'');leaf.textContent=fixture.text??'Plain statement 073';
 if(fixture.mixed){const strong=document.createElement('strong');strong.textContent=' bold';leaf.append(strong);}
 if(fixture.split)leaf.append(document.createTextNode(' second run'));
 parent.append(leaf);const leaves=[leaf];
 if(fixture.multiple){const second=leaf.cloneNode(false);second.id+='-second';second.className='different-notice';second.style.cssText='position:absolute;display:block;left:17.5px;top:55px;width:220.625px;height:27.25px;margin:0;padding:0;border:0;font:600 18px/25px "Times New Roman",serif;letter-spacing:.25px';second.textContent='Different 0193';parent.append(second);leaves.push(second);}
 document.body.append(source);return {source,leaves};
}
await document.fonts.ready;
for(const fixture of cases){
 const row={name:fixture.name,status:'failed',eligible:!!fixture.eligible},owned=makeSource(fixture);let snapshot,raster,image;
 try{
  await document.fonts.ready;const {source,leaves}=owned,original=source.outerHTML,sourceGeometry=leaves.map(leaf=>geometry(leaf,source));
  snapshot=await capture(source);const native=(await snapshot.toSvg()).value,parsed=new DOMParser().parseFromString(native,'image/svg+xml'),root=parsed.documentElement,object=root.querySelector('foreignObject');
  const direct=object?.parentElement===root&&[...object.children].some(child=>child.localName==='div'&&child.namespaceURI==='http://www.w3.org/1999/xhtml')&&CSS.supports('zoom','2');
  const before=leaves.map(leaf=>{const cloned=parsed.getElementById(leaf.id);return {html:cloned.innerHTML,style:cloned.getAttribute('style'),text:cloned.textContent};});
  raster=(await snapshot.toCanvas()).value;const rasterBefore=raster.toDataURL();raster.width=raster.height=0;raster=undefined;
  const options={size:{kind:'css',width:240,height:100*2/3},background:'#fff'},svg=(await snapshot.toSvg(options)).value;
  expect(await (await snapshot.toBlob({...options,format:'svg'})).value.text()===svg,'SVG string and Blob differ');
  row.direct=direct;row.source=sourceGeometry;
  row.output=await frameSvg(svg,doc=>leaves.map(leaf=>{const output=doc.getElementById(leaf.id);return {...geometry(output,doc.documentElement),children:output.children.length,html:output.innerHTML,style:output.getAttribute('style')};}));
  for(let i=0;i<leaves.length;i++){
   const actual=row.output[i],expected=sourceGeometry[i];expect(actual.text===(fixture.eligible?expected.text:before[i].text),'Original text code units changed');
   if(fixture.eligible&&direct){
    expect(actual.children===1,'Eligible direct text was not projected');
    expect(JSON.stringify(actual.partitions)===JSON.stringify(expected.partitions),'Source character line partition changed');
    // After measured root CTM normalization, the remaining layout bound is
    // one native 1/64 CSS pixel quantization unit, including parent placement.
    for(const key of ['x','y','width','height'])expect(Math.abs(actual[key]-expected[key]*2/3)<=1/64,`Native text ${key} changed`);
   }else expect(actual.html===before[i].html&&actual.style===before[i].style,'Unsupported or reciprocal text structure changed');
  }
  image=await decode(svg);images[fixture.name]=image.toDataURL();row.ink=ink(image);
  if(fixture.hidden)expect(row.ink.nonWhite===0&&row.ink.dark===0&&row.ink.red===0,'Hidden text became visible');
  if(fixture.name==='custom-fill')expect(row.ink.red>0&&row.ink.dark===0,'Inherited custom text fill changed');
  raster=(await snapshot.toCanvas()).value;expect(raster.toDataURL()===rasterBefore,'Raster output changed after SVG serialization');
  expect((await snapshot.toSvg()).value===native,'Native1x SVG changed after output');expect(source.outerHTML===original,'Source DOM changed');
  row.status='pass';
 }catch(error){row.error=error.code??error.message;}
 finally{if(raster)raster.width=raster.height=0;if(image)image.width=image.height=0;snapshot?.dispose();owned.source.remove();}results.push(row);
}
const report={revision:'svg-text-runs-regression-3',userAgent:navigator.userAgent,dpr:devicePixelRatio,results,status:results.every(row=>row.status==='pass')?'pass':'failed',completedAt:new Date().toISOString(),scope:'bounded absolute and safe normal-flow single text leaf projection including plain LTR isolate, text paint inheritance and unsupported fallback; no native Safari or whole-SVG reenlargement claim'};
globalThis.svgTextRunsRegressionResults=report;globalThis.svgTextRunsRegressionImages=images;document.body.dataset.svgTextRunsRegression=report.status;document.querySelector('#results').textContent=JSON.stringify(report,null,2);
