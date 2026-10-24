import {capture} from '/dist/index.js';

const results=[],files={},expect=(condition,message)=>{if(!condition)throw Error(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fixtures=[
 {name:'absolute-control',absolute:true,style:'display:block;position:absolute;left:0;top:0',text:'Plain statement 073'},
 {name:'normal-single',text:'Plain statement 073'},
 {name:'static-ignored-insets',controlOnly:true,style:'position:static;left:31px;top:19px;inset-inline-start:17px;inset-block-end:11px',text:'Static inset remains ignored'},
 {name:'relative-offset',controlOnly:true,style:'position:relative;left:3.25px;top:4.5px;margin-bottom:8px',text:'Relative offset remains applied'},
 {name:'source-mutated',controlOnly:true,mutate:true,text:'Captured text remains immutable'},
 {name:'normal-multiline',text:'Plain statement 073 office ffi Alpha text for multiple lines and sibling flow.'},
 {name:'fractional-multiline',width:200.25,text:'한글 가나다 English office ffi 0123456789 여러 줄 텍스트 보존과 다음 형제 위치 확인'},
 {name:'margin-flow',style:'margin:7.25px 3.5px 9.75px',text:'Normal flow margin with multiple lines and following sibling'},
 {name:'fill-and-align-last',style:'-webkit-text-fill-color:rgb(240,40,50);text-align-last:right',text:'Rightmost text on the final line of plain block content'},
 {name:'hidden',fallback:true,style:'visibility:hidden',text:'Hidden flow content'},
 {name:'padding',fallback:true,style:'padding:3px 5px',text:'Padded text'},
 {name:'border',fallback:true,style:'border:2px solid #222',text:'Bordered text'},
 {name:'mixed-inline',fallback:true,mixed:true,text:'Plain '},
 {name:'inline-baseline',fallback:true,inline:true,text:'Inline baseline'},
 {name:'flex-baseline',fallback:true,parent:'display:flex;align-items:baseline',text:'Flex baseline'},
 {name:'grid-baseline',fallback:true,parent:'display:grid;grid-template-columns:auto auto;align-items:baseline',text:'Grid baseline'},
 {name:'flex-intrinsic',fallback:true,parent:'display:flex',style:'width:auto;flex:0 1 auto',text:'Intrinsic width consumer'},
 {name:'grid-intrinsic',fallback:true,parent:'display:grid;grid-template-columns:min-content auto',style:'width:auto',text:'Intrinsic width'},
 {name:'preceding-float',fallback:true,float:'sibling',text:'Plain statement 073 office ffi Alpha text for multiple lines and sibling flow.'},
 {name:'ancestor-sibling-float',fallback:true,float:'ancestor-sibling',text:'Plain statement 073 office ffi Alpha text for multiple lines and sibling flow.'},
 {name:'static-negative-z-index',fallback:true,style:'z-index:-1',text:'Static z-index must remain ignored'},
 {name:'negative-margin-paint-order',fallback:true,negativeMargin:true,style:'background:#f33',text:'Static block paint order'},
 {name:'overlapping-positioned-peer',fallback:true,overlap:true,style:'background:#f33',text:'Overlapping peer paint order'},
 {name:'effect-context',fallback:true,effects:true,text:'Effect context retains original flow'},
 {name:'generated-peer-outset',fallback:true,pseudoPeer:true,style:'background:#f33',text:'Generated peer paint order'},
];
const outputs=[
 {name:'css240',size:{kind:'css',width:240,height:160}},
 {name:'fractional',size:{kind:'css',width:239.625,height:159.75}},
 {name:'cover',size:{kind:'css',width:240,height:140},fit:'cover',align:{x:.3,y:.7}},
 {name:'stretch',size:{kind:'css',width:240,height:130},fit:'stretch'},
 {name:'A5-mm-margin',size:{kind:'paper',name:'A5',marginMm:{top:70,right:60,bottom:70,left:60}}},
 {name:'q3793',size:{kind:'css',width:360*3793/10001,height:240*3793/10001}},
];
function makeSource(fixture){
 const source=document.createElement('div');source.style.cssText='position:relative;box-sizing:content-box;width:360px;height:240px;padding:0;border:0;background:#fff;color:#000;font:16px/22px system-ui;';
 const parent=document.createElement('div');parent.id='flow-parent';parent.style.cssText='position:relative;margin:12px;width:320px;padding:0;border:0;'+(fixture.parent??'');source.append(parent);
 if(fixture.float){const floating=document.createElement('div');floating.style.cssText='float:left;width:80px;height:70px;background:#ccc';if(fixture.float==='sibling')parent.append(floating);else source.insertBefore(floating,parent);}
 const leaf=document.createElement(fixture.inline||fixture.absolute?'span':'div');leaf.id='flow-text';leaf.style.cssText=`box-sizing:content-box;width:${fixture.width??200}px;margin:0;padding:0;border:0;`+(fixture.style??'');leaf.textContent=fixture.text;
 if(fixture.mixed){const strong=document.createElement('strong');strong.textContent='bold mixed markup';leaf.append(strong);}
 parent.append(leaf);
 if(fixture.overlap){const peer=document.createElement('div');peer.style.cssText='position:absolute;left:0;top:8px;width:100px;height:18px;background:#36c';parent.insertBefore(peer,leaf);}
 if(fixture.pseudoPeer){const peer=document.createElement('div');peer.className='paint-peer';peer.style.cssText='position:absolute;left:280px;top:150px;width:1px;height:1px';parent.insertBefore(peer,leaf);}
 const sibling=document.createElement('div');sibling.id='flow-sibling';sibling.style.cssText='width:70px;height:18px;font:11px/18px Georgia,serif;background:#e1e9f5';sibling.textContent='Baseline';parent.append(sibling);
 if(fixture.negativeMargin)sibling.style.marginTop='-20px';
 const after=document.createElement('div');after.id='after-parent';after.style.cssText='width:50px;height:7px;background:#3167b2';source.append(after);
 if(fixture.absolute||fixture.effects){const clip=document.createElement('div');clip.id='clip-control';clip.style.cssText='position:absolute;left:245px;top:150px;width:70px;height:60px;overflow:hidden;border:2px solid #526980;border-radius:7px;box-shadow:3px 4px 3px #33445566;background:#def';
 const circle=document.createElement('div');circle.id='circle-control';circle.style.cssText='position:absolute;left:38px;top:-12px;width:42px;height:42px;border:5px solid #e3a932;border-radius:50%;background:#ffedbd';clip.append(circle);source.append(clip);}
 document.querySelector('#fixture').append(source);return source;
}
function measure(element,root){
 const rootBox=root.getBoundingClientRect(),matrix=root.getScreenCTM?.(),inverse=matrix?.inverse();
 const point=(x,y)=>inverse?new DOMPoint(x,y).matrixTransform(inverse):{x:x-rootBox.left,y:y-rootBox.top};
 const box=rect=>{const a=point(rect.left,rect.top),b=point(rect.right,rect.bottom);return {x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y};};
 const chars=[],rows=[],textStyles=[],walker=element.ownerDocument.createTreeWalker(element,NodeFilter.SHOW_TEXT);let text,offset=0;
 while((text=walker.nextNode())){const style=element.ownerDocument.defaultView.getComputedStyle(text.parentElement);textStyles.push(Object.fromEntries(['font-family','font-size','font-weight','line-height','letter-spacing','white-space'].map(key=>[key,style.getPropertyValue(key)])));for(let index=0;index<text.length;index++){
  const range=element.ownerDocument.createRange();range.setStart(text,index);range.setEnd(text,index+1);const rect=range.getBoundingClientRect();
  let row=rows.find(row=>row.top===rect.top);if(!row)rows.push(row={top:rect.top,indices:[]});row.indices.push(offset+index);
  chars.push({index:offset+index,text:text.data[index],...box(rect)});
 }offset+=text.length;}
 const style=element.ownerDocument.defaultView.getComputedStyle(element);
 return {text:element.textContent,box:box(element.getBoundingClientRect()),chars,textStyles,partitions:rows.map(row=>row.indices),paint:{visibility:style.visibility,fill:style.getPropertyValue('-webkit-text-fill-color'),alignLast:style.textAlignLast},rootScreenCTM:matrix?Object.fromEntries(['a','b','c','d','e','f'].map(key=>[key,matrix[key]])):null};
}
const selectors=['#flow-text','#flow-parent','#flow-sibling','#after-parent','#clip-control','#circle-control'];
const measureAll=(doc,root)=>Object.fromEntries(selectors.filter(selector=>doc.querySelector(selector)).map(selector=>[selector,measure(doc.querySelector(selector),root)]));
function layout(options){
 const mm=options.size.kind==='paper',width=mm?148:options.size.width,height=mm?210:options.size.height,m=mm?options.size.marginMm:{top:0,right:0,bottom:0,left:0};
 const available={width:width-m.left-m.right,height:height-m.top-m.bottom},sx=available.width/360,sy=available.height/240;
 const scale=(options.fit==='cover'?Math.max:Math.min)(sx,sy),scaleX=options.fit==='stretch'?sx:scale,scaleY=options.fit==='stretch'?sy:scale,align=options.align??{x:.5,y:.5};
 return {width,height,mm,scaleX,scaleY,x:m.left+(available.width-360*scaleX)*align.x,y:m.top+(available.height-240*scaleY)*align.y};
}
async function inspect(svg,plan,scale=1){
 if(scale!==1){const enlarged=new DOMParser().parseFromString(svg,'image/svg+xml');enlarged.documentElement.setAttribute('width',`${plan.width*scale}${plan.mm?'mm':''}`);enlarged.documentElement.setAttribute('height',`${plan.height*scale}${plan.mm?'mm':''}`);svg=new XMLSerializer().serializeToString(enlarged);}
 const frame=document.createElement('iframe'),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 frame.width=String(plan.width*(plan.mm?96/25.4:1)*scale);frame.height=String(plan.height*(plan.mm?96/25.4:1)*scale);
 try{const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;});frame.src=url;document.body.append(frame);await loaded;await frame.contentDocument.fonts.ready;
  return measureAll(frame.contentDocument,frame.contentDocument.documentElement);
 }finally{frame.remove();URL.revokeObjectURL(url);}
}
async function authoredPaint(svg,plan){
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();
 const canvas=Object.assign(document.createElement('canvas'),{width:image.naturalWidth,height:image.naturalHeight});
 try{const context=canvas.getContext('2d');context.drawImage(image,0,0);
  const pixel=(x,y)=>[...context.getImageData(Math.floor((plan.x+x*plan.scaleX)*canvas.width/plan.width),Math.floor((plan.y+y*plan.scaleY)*canvas.height/plan.height),1,1).data];
  const circle=pixel(303,164),outsideClip=pixel(344,164),shadow=pixel(321,200);
  expect(circle[0]>220&&circle[1]>180&&circle[2]<220,'Authored circle fill disappeared');
  expect(outsideClip.every(value=>value===255),'Circle escaped authored clip boundary');
  expect(shadow.slice(0,3).every(value=>value<255),'Authored shadow disappeared');return {circle,outsideClip,shadow};
 }finally{canvas.width=canvas.height=0;image.src='';}
}
function compare(actual,expected,plan,selector,failures){
 // Source and output each quantize local layout to 1/64 CSS px. Propagate
 // those two edge bounds into root user units; an external 3x SVG viewport
 // transform does not change the HTML layout quantum before that transform.
 const outputCssUnit=plan.mm?25.4/96:1,tolerance={x:(plan.scaleX+outputCssUnit)/64,y:(plan.scaleY+outputCssUnit)/64};
 const checkBox=(box,source,label)=>{for(const key of ['x','y','width','height']){
  const axis=key==='x'||key==='width'?'x':'y',scale=axis==='x'?plan.scaleX:plan.scaleY,offset=key==='x'?plan.x:key==='y'?plan.y:0,target=source[key]*scale+offset,delta=Math.abs(box[key]-target);
  const bound=tolerance[axis]*(key==='width'||key==='height'?2:1);
  if(delta>bound+Number.EPSILON*Math.max(1,Math.abs(target))*8)failures.push(`${selector} ${label}.${key}: ${box[key]} != ${target} (delta ${delta}, propagated layout quantum ${bound})`);
 }};
 checkBox(actual.box,expected.box,'box');
 if(!same(actual.partitions,expected.partitions))failures.push(`${selector} character line partition changed`);
 if(actual.text!==expected.text)failures.push(`${selector} original text code units changed`);
 if(selector==='#flow-text')for(let i=0;i<Math.min(actual.chars.length,expected.chars.length);i++){
  const local=(char,box)=>({...char,x:char.x-box.x,y:char.y-box.y});
  const localPlan={...plan,x:0,y:0};
  // Plain leaves have no padding/border: their measured box origin is the
  // actual parent content origin for the native text and the projected run.
  const observed=local(actual.chars[i],actual.box),native=local(expected.chars[i],expected.box);
  for(const key of ['x','y','width','height']){
   const axis=key==='x'||key==='width'?'x':'y',scale=axis==='x'?localPlan.scaleX:localPlan.scaleY,target=native[key]*scale,bound=tolerance[axis]*2,delta=Math.abs(observed[key]-target);
   if(delta>bound)failures.push(`${selector} local char[${i}].${key}: ${observed[key]} != ${target} (delta ${delta}, propagated layout quantum ${bound})`);
  }
 }
}
function nativeFlowCounterfactual(svg,native,geometry){
 const output=new DOMParser().parseFromString(svg,'image/svg+xml'),original=new DOMParser().parseFromString(native,'image/svg+xml');
 // Restore the public native1x HTML, including original margins, positioning
 // and ignored static insets. Pin only independently measured native used size;
 // this control contains no projected text span or reciprocal text transform.
 for(const selector of ['#flow-text','#flow-sibling']){
  const retained=original.querySelector(selector),current=output.querySelector(selector),replacement=output.importNode(retained,true);
  replacement.style.setProperty('width',`${geometry[selector].box.width}px`,'important');replacement.style.setProperty('height',`${geometry[selector].box.height}px`,'important');current.replaceWith(replacement);
 }
 return new XMLSerializer().serializeToString(output);
}
function compareFlowBoxes(actual,control,selector,plan,failures){
 const quantum=(plan.mm?25.4/96:1)/64;
 for(const key of ['x','y','width','height']){
  const delta=Math.abs(actual.box[key]-control.box[key]);
  if(delta>quantum)failures.push(`${selector} projection changed native-flow box.${key} by ${delta} (layout quantum ${quantum})`);
 }
}
await document.fonts.ready;
for(const fixture of fixtures){
 const source=makeSource(fixture);let snapshot;
 try{
  await document.fonts.ready;const original=source.outerHTML,sourceGeometry=measureAll(source,source);snapshot=await capture(source);const native=(await snapshot.toSvg()).value;
  const nativeGeometry=await inspect(native,{width:360,height:240,mm:false});
  expect(same(nativeGeometry['#flow-text'].partitions,sourceGeometry['#flow-text'].partitions),'Native1x capture changed source character line partition');
  const parsed=new DOMParser().parseFromString(native,'image/svg+xml'),before=parsed.getElementById('flow-text'),beforeStructure={html:before.innerHTML,style:before.getAttribute('style')};
  if(fixture.mutate){source.querySelector('#flow-text').textContent='MUTATED after capture';source.style.width='40px';source.remove();}
  for(const output of fixture.fallback||fixture.controlOnly?[outputs[0]]:outputs.filter(output=>output.name!=='q3793'||['normal-multiline','fill-and-align-last'].includes(fixture.name))){
   const row={name:`${fixture.name}/${output.name}`,fixture:fixture.name,output:output.name,status:'failed',fallback:!!fixture.fallback,source:sourceGeometry,native:nativeGeometry},failures=[];
   try{
    const options={...output,background:'#fff'};delete options.name;const plan=layout(options),svg=(await snapshot.toSvg(options)).value;
    files[`${fixture.name}-${output.name}.svg`]=svg;expect(await (await snapshot.toBlob({...options,format:'svg'})).value.text()===svg,'toSvg and SVG Blob differ');
    const outputDoc=new DOMParser().parseFromString(svg,'image/svg+xml'),text=outputDoc.getElementById('flow-text');expect(text,'Original text element disappeared');
    expect(!outputDoc.querySelector('image,feImage'),'SVG contains an image replacement');expect(outputDoc.querySelector('foreignObject'),'HTML SVG structure disappeared');
    for(const selector of ['#clip-control','#circle-control'])if(parsed.querySelector(selector)){
     const original=parsed.querySelector(selector),retained=outputDoc.querySelector(selector);expect(retained&&retained.innerHTML===original.innerHTML&&retained.getAttribute('style')===original.getAttribute('style'),'Authored clip/circle/shadow structure changed');
    }
    if(fixture.fallback){expect(text.innerHTML===beforeStructure.html&&text.getAttribute('style')===beforeStructure.style,'Safety fallback text structure changed');
     if(fixture.name==='hidden'){row.actual=await inspect(svg,plan);expect(row.actual['#flow-text'].paint.visibility==='hidden','Hidden text became visible');}
    }
    else{row.actual=await inspect(svg,plan);
     const ideal=[];for(const selector of selectors.slice(0,4))compare(row.actual[selector],nativeGeometry[selector],plan,selector,ideal);
     row.idealSourceScaleFailures=ideal.filter(message=>message.includes(' box.'));
     failures.push(...ideal.filter(message=>!message.includes(' box.')));
     const counterfactual=nativeFlowCounterfactual(svg,native,nativeGeometry);row.nativeFlowControl=await inspect(counterfactual,plan);
     files[`${fixture.name}-${output.name}-native-flow-control.svg`]=counterfactual;
     for(const selector of selectors.slice(0,4))compareFlowBoxes(row.actual[selector],row.nativeFlowControl[selector],selector,plan,failures);
     expect(same(row.actual['#flow-text'].paint,sourceGeometry['#flow-text'].paint),'Inherited text paint or final-line alignment changed');
     expect(same(row.actual['#flow-text'].textStyles,nativeGeometry['#flow-text'].textStyles),'Native font, spacing or white-space style changed');
     // The SVG is opened again at 3x viewport size. This measures retained HTML
     // geometry through that document's actual root CTM, without raster embedding.
     row.reenlarged=await inspect(svg,plan,3);row.reenlargementFailures=[];for(const selector of selectors.slice(0,4))compare(row.reenlarged[selector],nativeGeometry[selector],plan,selector,row.reenlargementFailures);
     row.reenlargementStatus=row.reenlargementFailures.length?'known-limit-or-diagnosis':'pass';
     if(output.name==='css240'&&fixture.absolute)row.authoredPaint=await authoredPaint(svg,plan);
    }
    expect((await snapshot.toSvg()).value===native,'Native SVG changed after resized outputs');expect(fixture.mutate?source.outerHTML!==original:source.outerHTML===original,fixture.mutate?'Source mutation control was not exercised':'Source DOM changed');
    row.failures=failures;expect(!failures.length,failures[0]);row.status='pass';
   }catch(error){row.error=error.code??error.message;row.failures=failures;}results.push(row);
  }
 }catch(error){results.push({name:fixture.name,status:'failed',error:error.code??error.message});}
 finally{snapshot?.dispose();source.remove();}
}
const report={revision:'svg-flow-regression-3',userAgent:navigator.userAgent,dpr:devicePixelRatio,status:results.every(row=>row.status==='pass')?'pass':'failed',results,completedAt:new Date().toISOString(),scope:'effect-free nonoverlapping plain block leaves; exact native character partitions/local glyph geometry and inherited typography including sampled two-stage zoom; projection delta against restored public native1x flow boxes; float/effect/pseudo/negative-margin/outset/paint-order contexts retain original HTML; ideal source-scale box quantization and external SVG enlargement recorded separately; original absolute clip/shadow controls retained; no native Safari or arbitrary CSS paint-safety claim'};
globalThis.svgFlowRegressionResults=report;globalThis.svgFlowRegressionFiles=files;document.body.dataset.svgFlowRegression=report.status;document.querySelector('#results').textContent=JSON.stringify(report,null,2);
