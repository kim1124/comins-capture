import {collectScrollbarCss} from '../engine/scrollbar-css.js';
import type {DomInspection,DomNode} from './inspect.js';
import type {ResolvedResources} from '../resources/resolve.js';
import type {ManagedOperation} from '../lifecycle/operation.js';
import {CaptureError} from '../errors.js';
import {mapCssUrls} from '../resources/css.js';
import {createExtensionSession,type ExtensionSession} from '../engine/snapdom-extension.js';
export interface PreparedDom {
  root:HTMLElement;session:ExtensionSession;urls:Map<string,string>;allowed:Set<string>;fonts:readonly string[];
  nodes:WeakMap<Element,DomNode>;dispose():void;
}
async function dataUrl(blob:Blob,doc:Document):Promise<string> {
  return new Promise((resolve,reject)=>{const reader=new doc.defaultView!.FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new CaptureError('RESOURCE_FAILED','prepare'));reader.readAsDataURL(blob);});
}
export async function prepareDom(inspection:DomInspection,resources:ResolvedResources,op:ManagedOperation):Promise<PreparedDom> {
  const doc=inspection.root.ownerDocument,view=doc.defaultView!,urls=new Map<string,string>(),allowed=new Set<string>(),nodes=new WeakMap<Element,DomNode>(),fonts:string[]=[];
  for(const n of inspection.nodes)nodes.set(n.element,n);
  let bytes=0;
  for(const entry of inspection.resources){
    op.checkpoint();const blob=resources.get(entry.resourceRef);bytes+=blob.size;
    if(!blob.size||blob.size>16_000_000||bytes>64_000_000)throw new CaptureError('OUTPUT_LIMIT','prepare');
    if(entry.kind==='image'&&!['image/png','image/jpeg','image/webp'].includes(blob.type))throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');
    if(entry.kind==='font'&&!['font/woff2','font/woff','font/ttf','font/otf','application/font-woff'].includes(blob.type))throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');
    const uri=await dataUrl(blob,doc);op.checkpoint();
    if(entry.kind==='image'){
      const image=new view.Image();image.src=uri;await image.decode();op.checkpoint();
      if(!image.naturalWidth||image.naturalWidth>8192||image.naturalHeight>8192||image.naturalWidth*image.naturalHeight>32_000_000)throw new CaptureError('OUTPUT_LIMIT','prepare');
    }else if(entry.kind==='font'){
      // A face with several src fallbacks loads only the first usable source.
      // Verify each collected resource independently before inserting any rule.
      await new view.FontFace('CominsResourceValidation',`url("${uri}")`).load();op.checkpoint();
    }
    if(urls.has(entry.url)&&urls.get(entry.url)!==uri)throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');
    urls.set(entry.url,uri);allowed.add(uri);
  }
  for(const f of inspection.fonts){
    const src=mapCssUrls(f.src,url=>{const data=urls.get(url);if(!data)throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');return data;});
    const face=new view.FontFace(f.family.replace(/^['"]|['"]$/g,''),src,{style:f.style,weight:f.weight,stretch:f.stretch,...(f.range?{unicodeRange:f.range}:{})});
    await face.load();op.checkpoint();
    // CSSOM serializes descriptors; no string concatenation of consumer CSS.
    const sheet=new view.CSSStyleSheet();sheet.replaceSync('@font-face{}');const rule=sheet.cssRules[0] as CSSFontFaceRule;
    for(const [key,value] of Object.entries({'font-family':f.family,'font-style':f.style,'font-weight':f.weight,'font-stretch':f.stretch,'unicode-range':f.range,src}))if(value)rule.style.setProperty(key,value);
    fonts.push(rule.cssText);
  }
  const session=createExtensionSession({scrollbarCss(source){
    if(source!==inspection.root)throw new CaptureError('ENGINE_FAILED','capture');
    return collectScrollbarCss(source,inspection.nodes.map(node=>node.element),()=>op.checkpoint());
  },images:[...urls].filter(([,data])=>data.startsWith('data:image/')).map(([url,dataUrl])=>({url,dataUrl})),cloneShallow(source){
    if(source.nodeType!==1)throw new CaptureError('UNSUPPORTED_CONTENT','capture');
    const original=source as HTMLElement,clone=doc.createElement(original.localName);
    for(const attr of original.attributes)if(['id','class','title','lang','dir','colspan','rowspan','scope','span','start','reversed','type','alt','width','height'].includes(attr.name))clone.setAttribute(attr.name,attr.value);
    const node=nodes.get(original);if(node)clone.setAttribute('data-comins-node',node.ref);
    if(node?.image){const data=urls.get(node.image);if(!data)throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');clone.setAttribute('src',data);}
    return clone;
  }},op);
  return {root:inspection.root,session,urls,allowed,fonts,nodes,dispose(){session.dispose();urls.clear();allowed.clear();fonts.length=0;}};
}
