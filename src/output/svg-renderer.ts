import type {SvgRenderer,VerifiedSvg} from '../engine/contract.js';
import type {LayoutPlan} from '../geometry/layout.js';
import {CaptureError} from '../errors.js';
const SVG='http://www.w3.org/2000/svg';
function directHtmlWrapper(root:Element,zoomSupported:boolean):HTMLElement|undefined {
 const object=root.querySelector('foreignObject');
 if(!zoomSupported||object?.parentElement!==root)return undefined;
 return Array.from(object.children).find(child=>child.namespaceURI==='http://www.w3.org/1999/xhtml'&&child.localName==='div') as HTMLElement|undefined;
}
function checkCanvasSize(size:{width:number;height:number}):void {
 if(![size.width,size.height].every(n=>Number.isSafeInteger(n)&&n>0&&n<=8192)||size.width*size.height>32_000_000)
  throw new CaptureError('OUTPUT_LIMIT','output');
}
/** Internal: cancel the browser's Float32 effective zoom before text shaping. */
export function reciprocalTextZoom(zoom:number):number {
 const reciprocal=1/zoom,outer=Math.fround(zoom),inner=Math.fround(reciprocal);
 if(!Number.isFinite(inner)||outer===0||Math.fround(outer*inner)===1)return reciprocal;
 const value=new Float32Array([inner]),bits=new Uint32Array(value.buffer),original=bits[0]!;
 // Positive IEEE754 Float32 encodings are ordered. Check only the adjacent
 // representable values; choose one only when the rounded product is exactly1.
 for(const direction of [-1,1]){
  bits[0]=original+direction;
  if(Math.fround(outer*value[0]!)===1)return value[0]!;
 }
 return reciprocal;
}
/** Internal: use a second exact Float32 stage only if one reciprocal cannot cancel. */
export function textZoomPair(zoom:number):{intermediate:number;inverse:number} {
 const parent=Math.fround(zoom),single=reciprocalTextZoom(zoom),fallback={intermediate:1,inverse:single};
 if(!(parent>0)||!Number.isFinite(parent)||!Number.isFinite(Math.fround(single))||Math.fround(parent*Math.fround(single))===1)return fallback;
 const value=new Float32Array([1]),bits=new Uint32Array(value.buffer),original=bits[0]!;
 for(const direction of [-1,1]){
  bits[0]=original+direction;const intermediate=value[0]!,effective=Math.fround(parent*intermediate),inverse=reciprocalTextZoom(effective);
  if(effective>0&&Number.isFinite(Math.fround(inverse))&&Math.fround(effective*Math.fround(inverse))===1)return {intermediate,inverse};
 }
 return fallback;
}
/** Recompose one complete output from validated content without reading the live source. */
function compose(output:VerifiedSvg,plan:LayoutPlan,doc:Document):string {
 const view=doc.defaultView;if(!view)throw new CaptureError('UNSUPPORTED_ENVIRONMENT','output');
 const parsed=new view.DOMParser().parseFromString(output.svg,'image/svg+xml'),root=parsed.documentElement;
 if(parsed.querySelector('parsererror')||root.querySelectorAll('foreignObject').length!==1)throw new CaptureError('OUTPUT_MISMATCH','output');
 // SVG decode can finish before nested HTML images paint; raster reads need synchronous image decoding.
 if(plan.unit==='px')for(const image of Array.from(root.getElementsByTagNameNS('http://www.w3.org/1999/xhtml','img')))image.setAttribute('decoding','sync');
 const node=(tag:string,attrs:Record<string,string|number>)=>{const n=parsed.createElementNS(SVG,tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));return n;};
 const object=root.querySelector('foreignObject')!,wrapper=directHtmlWrapper(root,Boolean(view.CSS?.supports?.('zoom','2')));
 const direct=Boolean(wrapper);
 // Physical SVG scaling also displaces WebKit HTML clips. Compose this path in CSS pixels.
 const factor=direct&&plan.unit==='mm'?96/25.4:1;
 const scaledRect=(rect:LayoutPlan['drawRect'])=>({x:rect.x*factor,y:rect.y*factor,width:rect.width*factor,height:rect.height*factor});
 const layout:LayoutPlan=factor===1?plan:{...plan,unit:'css-px',outputSize:{width:plan.outputSize.width*factor,height:plan.outputSize.height*factor},clipRect:scaledRect(plan.clipRect),drawRect:scaledRect(plan.drawRect),contentRect:scaledRect(plan.contentRect),scaleX:plan.scaleX*factor,scaleY:plan.scaleY*factor};
 const source=node('svg',{x:layout.drawRect.x-layout.clipRect.x,y:layout.drawRect.y-layout.clipRect.y,width:layout.drawRect.width,height:layout.drawRect.height,viewBox:`0 0 ${layout.drawRect.width} ${layout.drawRect.height}`,preserveAspectRatio:'none',style:'overflow:hidden'});
 if(direct&&wrapper){
  // Scale HTML layout itself: WebKit loses nested clips/shadows under an SVG scale.
  const zoom=Math.max(layout.scaleX,layout.scaleY);
  const textZoom=plan.unit!=='px'&&zoom<1?textZoomPair(zoom):undefined;
  let projectedText=false;
  if(plan.unit!=='px'&&zoom<1)for(const run of output.textRuns??[]){
   const matches=root.querySelectorAll(`[data-comins-node="${run.ref}"]`),leaf=matches[0] as HTMLElement|undefined;
   if(matches.length!==1||leaf?.childNodes.length!==1||leaf.firstChild?.nodeType!==3||leaf.textContent!==run.text)throw new CaptureError('OUTPUT_MISMATCH','output');
   // Keep the effect box at its native used size after its text leaves flow.
   leaf.style.setProperty('width',`${run.width}px`,'important');leaf.style.setProperty('height',`${run.height}px`,'important');
   if(run.position==='static'){
    leaf.style.setProperty('position','relative','important');
    // Static insets were ignored in the source; making a containing block must
    // not activate either physical or logical offsets retained by the engine.
    for(const property of ['top','right','bottom','left','inset-block-start','inset-block-end','inset-inline-start','inset-inline-end'])leaf.style.setProperty(property,'auto','important');
   }
   const text=parsed.createElementNS('http://www.w3.org/1999/xhtml','span') as HTMLElement;
   // Inherited text paint (visibility/fill/final-line alignment) must stay inherited;
   // noninherited backgrounds/effects still reset instead of painting a second copy.
   text.setAttribute('style',`all:unset!important;display:block!important;position:absolute!important;left:0!important;top:0!important;margin:0!important;padding:0!important;border:0!important;box-sizing:content-box!important;width:${run.width}px!important;height:${run.height}px!important;zoom:${1/zoom}!important;transform:scale(${zoom},${zoom})!important;transform-origin:0 0!important;`);
   for(const [key,value] of run.styles)text.style.setProperty(key,value,'important');
   // CSSOM style mutation rounds zoom numbers. Append the full-precision value
   // only after all style edits so q and 1/q still cancel before text shaping.
   text.setAttribute('style',`${text.getAttribute('style')};zoom:${textZoom!.inverse}!important;`);
   text.append(leaf.firstChild);
   if(textZoom!.intermediate===1)leaf.append(text);
   else{
    const intermediate=parsed.createElementNS('http://www.w3.org/1999/xhtml','span');
    intermediate.setAttribute('style',`all:unset!important;display:block!important;position:absolute!important;left:0!important;top:0!important;margin:0!important;padding:0!important;border:0!important;box-sizing:content-box!important;overflow:visible!important;zoom:${textZoom!.intermediate}!important;`);
    intermediate.append(text);leaf.append(intermediate);
   }
   projectedText=true;
  }
  wrapper.style.setProperty('zoom',String(zoom),'important');
  if(layout.scaleX!==layout.scaleY){wrapper.style.setProperty('transform',`scale(${layout.scaleX/zoom},${layout.scaleY/zoom})`,'important');wrapper.style.setProperty('transform-origin','0 0','important');}
  if(projectedText)wrapper.setAttribute('style',`${wrapper.getAttribute('style')};zoom:${zoom}!important;`);
  source.setAttribute('x',String(layout.drawRect.x));source.setAttribute('y',String(layout.drawRect.y));
  source.setAttribute('viewBox',`${layout.drawRect.x} ${layout.drawRect.y} ${layout.drawRect.width} ${layout.drawRect.height}`);
  const clip=layout.clipRect,draw=layout.drawRect;
  const offsetX=Number(object.getAttribute('x')??0)*layout.scaleX,offsetY=Number(object.getAttribute('y')??0)*layout.scaleY;
  const htmlClip=parsed.createElementNS('http://www.w3.org/1999/xhtml','div'),position=parsed.createElementNS('http://www.w3.org/1999/xhtml','div');
  // Engine tag resets set div to inline; both isolated wrappers must declare block layout.
  htmlClip.setAttribute('style',`all:initial;display:block;box-sizing:border-box;position:relative;overflow:hidden;clip-path:inset(0);width:${clip.width}px;height:${clip.height}px;`);
  position.setAttribute('style',`all:initial;display:block;box-sizing:border-box;position:absolute;left:${draw.x-clip.x+offsetX}px;top:${draw.y-clip.y+offsetY}px;width:${draw.width}px;height:${draw.height}px;overflow:hidden;clip-path:inset(0);`);
  wrapper.replaceWith(htmlClip);htmlClip.append(position);position.append(wrapper);
  object.setAttribute('x',String(clip.x));object.setAttribute('y',String(clip.y));
  object.setAttribute('width',String(clip.width));object.setAttribute('height',String(clip.height));
  source.append(object);
  // Keep verified font/style rules outside the source viewport with the SVG root.
 }else{
  // Preserve engines that already pair a reciprocal SVG group scale with HTML zoom.
  const positioned=node('g',{transform:`matrix(${layout.scaleX} 0 0 ${layout.scaleY} 0 0)`});
  while(root.firstChild)positioned.append(root.firstChild);
  source.append(positioned);
 }
 const clip=node('svg',{x:layout.clipRect.x,y:layout.clipRect.y,width:layout.clipRect.width,height:layout.clipRect.height,viewBox:`${direct?layout.clipRect.x:0} ${direct?layout.clipRect.y:0} ${layout.clipRect.width} ${layout.clipRect.height}`,style:'overflow:hidden'});
 clip.append(source);
 if(layout.background)root.append(node('rect',{x:0,y:0,...layout.outputSize,fill:layout.background}));
 root.append(clip);
 if(factor!==1){
  // Cancel the root mm-to-CSS-pixel transform while preserving its public mm/viewBox contract.
  const inverse=node('svg',{width:plan.outputSize.width,height:plan.outputSize.height,viewBox:`0 0 ${layout.outputSize.width} ${layout.outputSize.height}`});
  while(root.firstChild)inverse.append(root.firstChild);
  root.append(inverse);
 }
 const suffix=plan.unit==='mm'?'mm':'';
 root.setAttribute('width',`${plan.outputSize.width}${suffix}`);root.setAttribute('height',`${plan.outputSize.height}${suffix}`);
 root.setAttribute('viewBox',`0 0 ${plan.outputSize.width} ${plan.outputSize.height}`);root.setAttribute('preserveAspectRatio','none');
 return new view.XMLSerializer().serializeToString(parsed);
}
export function createSvgRenderer(doc:Document):SvgRenderer {
 return {
  serialize(output,plan){
   if(plan.unit==='css-px'&&!plan.background&&plan.outputSize.width===output.sourceSize.width&&plan.outputSize.height===output.sourceSize.height)return output.svg;
   return compose(output,plan,doc);
  },
  async render(output,context,plan){
   context.checkpoint();const view=doc.defaultView;if(!view)throw new CaptureError('UNSUPPORTED_ENVIRONMENT','output');
   const shrinking=plan.unit==='px'&&plan.scaleX<=1&&plan.scaleY<=1&&(plan.scaleX<1||plan.scaleY<1);
   const direct=shrinking&&Boolean(directHtmlWrapper(new view.DOMParser().parseFromString(output.svg,'image/svg+xml').documentElement,Boolean(view.CSS?.supports?.('zoom','2'))));
   if(direct){
    // Fix original line layout into pixels before shrinking; CSS zoom can reshape tight text.
    const sourceSize={width:Math.ceil(output.sourceSize.width),height:Math.ceil(output.sourceSize.height)};
    checkCanvasSize(plan.outputSize);checkCanvasSize(sourceSize);
    const sourceRect={x:0,y:0,...output.sourceSize};
    const sourcePlan:LayoutPlan={outputSize:sourceSize,clipRect:sourceRect,drawRect:sourceRect,contentRect:sourceRect,scaleX:1,scaleY:1,unit:'px',background:null};
    const image=new view.Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(compose(output,sourcePlan,doc));
    await image.decode();context.checkpoint();
    const source=doc.createElement('canvas');let canvas:HTMLCanvasElement|undefined;
    try{
     source.width=sourceSize.width;source.height=sourceSize.height;
     const sourceContext=source.getContext('2d');if(!sourceContext)throw new CaptureError('UNSUPPORTED_ENVIRONMENT','output');
     sourceContext.drawImage(image,0,0);context.checkpoint();
     canvas=doc.createElement('canvas');canvas.width=plan.outputSize.width;canvas.height=plan.outputSize.height;
     const ctx=canvas.getContext('2d');if(!ctx)throw new CaptureError('UNSUPPORTED_ENVIRONMENT','output');
     if(plan.background){ctx.fillStyle=plan.background;ctx.fillRect(0,0,canvas.width,canvas.height);}
     ctx.save();ctx.beginPath();ctx.rect(plan.clipRect.x,plan.clipRect.y,plan.clipRect.width,plan.clipRect.height);ctx.clip();
     ctx.drawImage(source,0,0,output.sourceSize.width,output.sourceSize.height,plan.drawRect.x,plan.drawRect.y,plan.drawRect.width,plan.drawRect.height);ctx.restore();
     context.checkpoint();return canvas;
    }catch(error){if(canvas){canvas.width=0;canvas.height=0;}throw error;}
    finally{source.width=0;source.height=0;}
   }
   const image=new view.Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(compose(output,plan,doc));
   await image.decode();context.checkpoint();
   const canvas=doc.createElement('canvas');canvas.width=plan.outputSize.width;canvas.height=plan.outputSize.height;
   try{const ctx=canvas.getContext('2d');if(!ctx)throw new CaptureError('UNSUPPORTED_ENVIRONMENT','output');ctx.drawImage(image,0,0);context.checkpoint();return canvas;}
   catch(error){canvas.width=0;canvas.height=0;throw error;}
  },
 };
}
