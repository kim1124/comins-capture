import type {SvgRenderer,VerifiedSvg} from '../engine/contract.js';
import type {LayoutPlan} from '../geometry/layout.js';
import {CaptureError} from '../errors.js';
const SVG='http://www.w3.org/2000/svg';
/** Recompose one complete output from validated content without reading the live source. */
function compose(output:VerifiedSvg,plan:LayoutPlan,doc:Document):string {
 const view=doc.defaultView;if(!view)throw new CaptureError('UNSUPPORTED_ENVIRONMENT','output');
 const parsed=new view.DOMParser().parseFromString(output.svg,'image/svg+xml'),root=parsed.documentElement;
 if(parsed.querySelector('parsererror')||root.querySelectorAll('foreignObject').length!==1)throw new CaptureError('OUTPUT_MISMATCH','output');
 const node=(tag:string,attrs:Record<string,string|number>)=>{const n=parsed.createElementNS(SVG,tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));return n;};
 // Preserve the engine's reciprocal SVG group scale and HTML zoom coordinate pair.
 const source=node('svg',{x:plan.drawRect.x-plan.clipRect.x,y:plan.drawRect.y-plan.clipRect.y,width:plan.drawRect.width,height:plan.drawRect.height,viewBox:`0 0 ${plan.drawRect.width} ${plan.drawRect.height}`,preserveAspectRatio:'none',style:'overflow:hidden'});
 const positioned=node('g',{transform:`matrix(${plan.scaleX} 0 0 ${plan.scaleY} 0 0)`});
 while(root.firstChild)positioned.append(root.firstChild);
 source.append(positioned);
 const clip=node('svg',{x:plan.clipRect.x,y:plan.clipRect.y,width:plan.clipRect.width,height:plan.clipRect.height,viewBox:`0 0 ${plan.clipRect.width} ${plan.clipRect.height}`,style:'overflow:hidden'});
 clip.append(source);
 if(plan.background)root.append(node('rect',{x:0,y:0,...plan.outputSize,fill:plan.background}));
 root.append(clip);
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
   const image=new view.Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(compose(output,plan,doc));
   await image.decode();context.checkpoint();
   const canvas=doc.createElement('canvas');canvas.width=plan.outputSize.width;canvas.height=plan.outputSize.height;
   try{const ctx=canvas.getContext('2d');if(!ctx)throw new CaptureError('UNSUPPORTED_ENVIRONMENT','output');ctx.drawImage(image,0,0);context.checkpoint();return canvas;}
   catch(error){canvas.width=0;canvas.height=0;throw error;}
  },
 };
}
