import type {PaperName,Rect,Size} from '../types.js';
import {paperMillimeters} from './paper.js';
import {CaptureError} from '../errors.js';
export interface Margins {top:number;right:number;bottom:number;left:number}
interface PaperSize {kind:'paper';name:PaperName;system?:'iso'|'jis';orientation?:'portrait'|'landscape';marginMm?:Margins}
export type RasterSize = {kind:'scale';value:number|'device'}|{kind:'pixels';width:number;height:number}|(PaperSize&{ppi?:number});
export type SvgSize = {kind:'css';width:number;height:number}|PaperSize;
export interface LayoutOptions<S=RasterSize|SvgSize> {size?:S;fit?:'contain'|'cover'|'stretch';align?:{x:number;y:number};background?:string|null}
export interface LayoutPlan {
 readonly outputSize:Readonly<Size>;readonly clipRect:Readonly<Rect>;
 readonly drawRect:Readonly<Rect>;readonly contentRect:Readonly<Rect>;readonly scaleX:number;readonly scaleY:number;
 readonly unit:'px'|'css-px'|'mm';readonly background:string|null;
}
const fail=():never=>{throw new CaptureError('INVALID_OPTIONS','output');};
function fields(value:unknown,keys:readonly string[]):void {
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))fail();
}
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=Number.MAX_SAFE_INTEGER;
const positive=(n:unknown):n is number=>finite(n)&&n>0;
const round=(n:number)=>{const result=Math.floor(n+.5);if(!Number.isSafeInteger(result)||result<=0)fail();return result;};
function color(value:unknown,jpeg:boolean):string|null {
 if(value===undefined)return jpeg?'#ffffff':null;
 if(value===null||value==='transparent'){if(jpeg)fail();return null;}
 if(typeof value!=='string')return fail();
 const names:Record<string,string>={black:'#000000',white:'#ffffff',red:'#ff0000',green:'#008000',blue:'#0000ff',yellow:'#ffff00',gray:'#808080',silver:'#c0c0c0',maroon:'#800000',purple:'#800080',fuchsia:'#ff00ff',lime:'#00ff00',olive:'#808000',navy:'#000080',teal:'#008080',aqua:'#00ffff'};
 const c=Object.hasOwn(names,value)?names[value]!:value.toLowerCase();
 if(!/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(c))fail();
 if(jpeg&&((c.length===5&&c[4]!=='f')||(c.length===9&&c.slice(7)!=='ff')))fail();
 return c;
}
export function planLayout(source:Readonly<Size>,options:LayoutOptions,mode:'raster'|'svg',capturedDpr=1,format?:string):LayoutPlan {
 if(!positive(source.width)||!positive(source.height))fail();
 fields(options,['size','fit','align','background','signal','timeoutMs','format','quality']);
 let width=source.width,height=source.height,unit:LayoutPlan['unit']=mode==='raster'?'px':'css-px';
 let margins:Margins={top:0,right:0,bottom:0,left:0};
 const size:RasterSize|SvgSize|undefined=options.size===undefined?(mode==='raster'?{kind:'scale',value:1}:undefined):options.size;
 if(size){
  fields(size,mode==='raster'?['kind','value','width','height','name','system','orientation','ppi','marginMm']:['kind','width','height','name','system','orientation','marginMm']);
  if(size.kind==='paper'){
   fields(size,['kind','name','system','orientation','marginMm',...(mode==='raster'?['ppi']:[])]);
   if(size.system!==undefined&&!['iso','jis'].includes(size.system)||size.orientation!==undefined&&!['portrait','landscape'].includes(size.orientation))fail();
   let mm:Size;try{mm=paperMillimeters(size.name,{standard:size.system==='jis'?'JIS':'ISO',orientation:size.orientation});}catch{return fail();}
   let factor=1;
   if(mode==='raster'){const suppliedPpi=(size as PaperSize&{ppi?:number}).ppi;const ppi=suppliedPpi===undefined?300:suppliedPpi;if(!positive(ppi))fail();factor=ppi/25.4;}
   else unit='mm';
   width=mode==='raster'?round(mm.width*factor):mm.width;height=mode==='raster'?round(mm.height*factor):mm.height;
   if(size.marginMm!==undefined){fields(size.marginMm,['top','right','bottom','left']);
    for(const key of ['top','right','bottom','left'] as const){const value=size.marginMm[key];if(!finite(value)||value<0)fail();margins[key]=mode==='raster'?Math.floor(value*factor+.5):value;}
   }
  }else if(mode==='raster'&&size.kind==='scale'){
   fields(size,['kind','value']);const scale=size.value==='device'?capturedDpr:size.value;if(!positive(scale))fail();width=round(source.width*scale);height=round(source.height*scale);
  }else if(mode==='raster'&&size.kind==='pixels'||mode==='svg'&&size.kind==='css'){
   fields(size,['kind','width','height']);const s=size as Size;
   if(!positive(s.width)||!positive(s.height)||(mode==='raster'&&(!Number.isSafeInteger(s.width)||!Number.isSafeInteger(s.height))))fail();width=s.width;height=s.height;
  }else fail();
 }else if(options.size!==undefined)fail();
 const fit=options.fit===undefined?'contain':options.fit,align={...(options.align??{x:.5,y:.5})};
 if(!['contain','cover','stretch'].includes(fit))fail();
 if(options.align!==undefined)fields(options.align,['x','y']);
 if(![align.x,align.y].every(n=>finite(n)&&n>=0&&n<=1))fail();
 const clipRect={x:margins.left,y:margins.top,width:width-margins.left-margins.right,height:height-margins.top-margins.bottom};
 if(!positive(clipRect.width)||!positive(clipRect.height))fail();
 const sx=clipRect.width/source.width,sy=clipRect.height/source.height,s=fit==='cover'?Math.max(sx,sy):Math.min(sx,sy);
 const scaleX=fit==='stretch'?sx:s,scaleY=fit==='stretch'?sy:s;
 const drawRect={x:clipRect.x+(clipRect.width-source.width*scaleX)*align.x,y:clipRect.y+(clipRect.height-source.height*scaleY)*align.y,width:source.width*scaleX,height:source.height*scaleY};
 if(![scaleX,scaleY,drawRect.width,drawRect.height].every(positive)||![drawRect.x,drawRect.y].every(finite))fail();
 const x=Math.max(clipRect.x,drawRect.x),y=Math.max(clipRect.y,drawRect.y);
 const contentRect={x,y,width:Math.min(clipRect.x+clipRect.width,drawRect.x+drawRect.width)-x,height:Math.min(clipRect.y+clipRect.height,drawRect.y+drawRect.height)-y};
 return Object.freeze({outputSize:Object.freeze({width,height}),clipRect:Object.freeze(clipRect),drawRect:Object.freeze(drawRect),contentRect:Object.freeze(contentRect),scaleX,scaleY,unit,background:color(options.background,format==='jpeg')});
}
