import type {SourceInspection} from '../core/capture.js';
import type {ManagedOperation} from '../lifecycle/operation.js';
import type {ResourceEntry} from '../resources/resolve.js';
import {mapCssUrls} from '../resources/css.js';
import {CaptureError} from '../errors.js';
export const htmlTags=new Set('div span p a b strong i em u s small sub sup br hr h1 h2 h3 h4 h5 h6 header footer main section article aside nav address blockquote pre code ul ol li dl dt dd table caption colgroup col thead tbody tfoot tr td th img figure figcaption time mark abbr cite q del ins label'.split(' '));
export const ignoredTags=new Set(['style','script','link','meta','template','noscript']);
export interface DomNode {element:HTMLElement;ref:string;image?:string;styles:readonly string[];rect:readonly number[]}
export interface DomFont {family:string;style:string;weight:string;stretch:string;range:string;src:string;urls:readonly string[]}
export interface DomInspection extends SourceInspection {root:HTMLElement;nodes:readonly DomNode[];fonts:readonly DomFont[]}
const fail=():never=>{throw new CaptureError('UNSUPPORTED_CONTENT','prepare');};
const family=(s:string)=>s.trim().replace(/^['"]|['"]$/g,'').toLowerCase();
function styles(el:HTMLElement):string[] {
  const view=el.ownerDocument.defaultView!;
  return ['', '::before','::after'].map(p=>{
    const s=view.getComputedStyle(el,p||null);
    if(p&&(s.content==='none'||s.content==='normal'||s.display==='none'))return '';
    let text='';for(const key of Array.from(s))if(!key.startsWith('--'))text+=`${key}:${s.getPropertyValue(key)};`;
    return text;
  });
}
const rect=(el:HTMLElement)=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height,el.scrollLeft,el.scrollTop];};
export async function inspectDom(root:HTMLElement,op:ManagedOperation):Promise<DomInspection> {
  const doc=root.ownerDocument,view=doc.defaultView;
  if(!view||doc!==globalThis.document||!root.isConnected||root===doc.body||root===doc.documentElement)throw new CaptureError('INVALID_TARGET','prepare');
  const box=root.getBoundingClientRect();if(box.width<=0||box.height<=0)throw new CaptureError('INVALID_TARGET','prepare');
  const rootStyle=view.getComputedStyle(root);
  if(rootStyle.transform!=='none'||rootStyle.zoom!=='1'||rootStyle.writingMode!=='horizontal-tb')fail();
  const nodes:DomNode[]=[],resources:ResourceEntry[]=[],byUrl=new Map<string,ResourceEntry>(),families=new Set<string>();
  const add=(value:string,kind:'image'|'font',base=doc.baseURI)=>{
    const url=new URL(value,base).href,key=kind+'|'+url;
    if(!byUrl.has(key)) {const item={resourceRef:`r${resources.length}`,kind,url,dependsOn:[]};resources.push(item);byUrl.set(key,item);}
    return url;
  };
  function visit(el:HTMLElement) {
    op.checkpoint();if(ignoredTags.has(el.localName))return;
    if(el.namespaceURI!=='http://www.w3.org/1999/xhtml'||!htmlTags.has(el.localName)||el.shadowRoot||el.hasAttribute('is')||el.hasAttribute('data-capture'))fail();
    const s=view!.getComputedStyle(el);if(s.display==='none')return;
    if(s.position==='sticky'||s.position==='fixed'||s.backdropFilter!=='none'||el.scrollLeft||el.scrollTop)fail();
    if(el.getAnimations().some(a=>a.playState==='running'))fail();
    const node:DomNode={element:el,ref:`n${nodes.length}`,styles:styles(el),rect:rect(el)};
    for(const css of node.styles)mapCssUrls(css,url=>add(url,'image'));
    for(const pseudo of ['', '::before','::after'])for(const f of view!.getComputedStyle(el,pseudo||null).fontFamily.split(','))families.add(family(f));
    if(el.localName==='img'){
      const img=el as HTMLImageElement;if(!img.complete||!img.naturalWidth)throw new CaptureError('RESOURCE_FAILED','prepare');
      node.image=add(img.currentSrc||img.src,'image');
    }
    nodes.push(node);if(nodes.length>10000)throw new CaptureError('OUTPUT_LIMIT','prepare');
    for(const child of el.children)visit(child as HTMLElement);
  }
  visit(root);
  const fonts:DomFont[]=[],declared=new Set<string>();
  const hasText=!!root.textContent?.trim()||nodes.some(n=>n.styles.slice(1).some(s=>s.includes('content:')));
  if(hasText){
    function rules(sheet:CSSStyleSheet,base:string) {
      let list:CSSRuleList;try{list=sheet.cssRules;}catch{throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');}
      const walk=(items:CSSRuleList)=>{for(const rule of Array.from(items)){
        if(rule.type===3) {const imported=rule as CSSImportRule;if(!imported.styleSheet)throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');rules(imported.styleSheet,imported.href);}
        else if(rule.type===5){
          const s=(rule as CSSFontFaceRule).style,f=s.getPropertyValue('font-family');if(!families.has(family(f)))continue;
          declared.add(family(f));const urls:string[]=[],src=mapCssUrls(s.getPropertyValue('src'),url=>{const u=add(url,'font',base);urls.push(u);return u;});
          if(!urls.length||/\blocal\s*\(/i.test(src))throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');
          fonts.push({family:f,style:s.getPropertyValue('font-style')||'normal',weight:s.getPropertyValue('font-weight')||'normal',stretch:s.getPropertyValue('font-stretch')||'normal',range:s.getPropertyValue('unicode-range'),src,urls});
        }else if('cssRules' in rule)walk((rule as CSSGroupingRule).cssRules);
      }};walk(list);
    }
    for(const sheet of [...Array.from(doc.styleSheets),...Array.from(doc.adoptedStyleSheets)])rules(sheet,sheet.href||doc.baseURI);
    for(const face of Array.from(doc.fonts))if(families.has(family(face.family))&&!declared.has(family(face.family)))throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');
  }
  const html=root.outerHTML;
  return {root,nodes,fonts,documentUrl:doc.URL,resources,sourceSize:{width:box.width,height:box.height},
    assertUnchanged(){
      if(root.outerHTML!==html||!root.isConnected)throw new CaptureError('SOURCE_CHANGED','capture');
      for(const n of nodes)if(JSON.stringify(styles(n.element))!==JSON.stringify(n.styles)||JSON.stringify(rect(n.element))!==JSON.stringify(n.rect))throw new CaptureError('SOURCE_CHANGED','capture');
    },dispose(){nodes.length=0;fonts.length=0;resources.length=0;byUrl.clear();},
  };
}
