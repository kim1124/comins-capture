import type {SourceInspection} from '../core/capture.js';
import type {ManagedOperation} from '../lifecycle/operation.js';
import type {ResourceEntry} from '../resources/resolve.js';
import {mapCssUrls} from '../resources/css.js';
import {CaptureError} from '../errors.js';
import type {PlainTextRun} from '../engine/contract.js';
export const htmlTags=new Set('div span p a b strong i em u s small sub sup br hr h1 h2 h3 h4 h5 h6 header footer main section article aside nav address blockquote pre code ul ol li dl dt dd table caption colgroup col thead tbody tfoot tr td th img figure figcaption time mark abbr cite q del ins label'.split(' '));
export const ignoredTags=new Set(['style','script','link','meta','template','noscript']);
export interface DomNode {element:HTMLElement;ref:string;image?:string;styles:readonly string[];rect:readonly number[];textRun?:PlainTextRun;textRects?:readonly (readonly number[])[]}
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
const textProperties=('font-family font-size font-style font-weight font-stretch font-variant font-variant-alternates font-variant-caps font-variant-east-asian font-variant-ligatures font-variant-numeric font-variant-position font-feature-settings font-variation-settings font-kerning font-optical-sizing font-size-adjust font-synthesis font-synthesis-small-caps font-synthesis-style font-synthesis-weight line-height letter-spacing word-spacing white-space white-space-collapse text-wrap-mode text-wrap-style word-break overflow-wrap line-break hyphens text-transform text-rendering tab-size color direction writing-mode text-align text-indent').split(' ');
const value=(s:CSSStyleDeclaration,key:string)=>s.getPropertyValue(key);
const zero=(s:CSSStyleDeclaration,key:string)=>/^0(?:px)?$/.test(value(s,key));
function plainChain(s:CSSStyleDeclaration):boolean {
  return ['transform','translate','rotate','scale','perspective','text-shadow','text-decoration-line','text-emphasis-style'].every(key=>['','none'].includes(value(s,key)))&&
    ['','1','normal'].includes(value(s,'zoom'))&&value(s,'writing-mode')==='horizontal-tb'&&value(s,'direction')==='ltr'&&['normal','isolate'].includes(value(s,'unicode-bidi'))&&
    ['','0px'].includes(value(s,'-webkit-text-stroke-width'))&&['','visible'].includes(value(s,'content-visibility'));
}
function textRects(el:HTMLElement):number[][] {
  const range=el.ownerDocument.createRange();range.selectNodeContents(el);
  return Array.from(range.getClientRects(),r=>[r.x,r.y,r.width,r.height]);
}
function plainFlowStyle(s:CSSStyleDeclaration):boolean {
  // Removing text from normal flow must not remove a baseline or an intrinsic
  // contribution consumed by flex/grid/table/inline or multicolumn layout.
  return s.display==='block'&&['','none'].includes(value(s,'float'))&&
    ['','auto'].includes(value(s,'column-count'))&&['','auto'].includes(value(s,'column-width'));
}
function inspectText(el:HTMLElement,s:CSSStyleDeclaration,node:DomNode,flowPlain:boolean):void {
  const text=el.firstChild;
  const flow=s.position==='static'||s.position==='relative';
  if((s.position!=='absolute'&&!flow)||s.display!=='block'||!['normal','isolate'].includes(s.unicodeBidi)||el.childNodes.length!==1||text?.nodeType!==3||!text.textContent?.trim()||/[\u0590-\u08ff\u200e\u200f\u202a-\u202e\u2066-\u2069\ufb1d-\ufdff\ufe70-\ufeff\u{10800}-\u{10fff}\u{1e800}-\u{1eeff}]/u.test(text.textContent))return;
  if(flow&&!flowPlain)return;
  if(s.position==='static'&&!['','auto'].includes(value(s,'z-index')))return;
  if(s.visibility!=='visible'||!['','visible'].includes(value(s,'content-visibility'))||s.overflowX!=='visible'||s.overflowY!=='visible'||!['','none'].includes(value(s,'-webkit-text-security')))return;
  if(s.whiteSpace!=='normal'||!['start','left'].includes(s.textAlign)||!zero(s,'text-indent')||s.textOverflow!=='clip'||!['','none'].includes(value(s,'-webkit-line-clamp')))return;
  if(['top','right','bottom','left'].some(side=>!zero(s,`padding-${side}`)||!zero(s,`border-${side}-width`))||node.styles.slice(1).some(Boolean))return;
  const view=el.ownerDocument.defaultView!;
  for(const pseudo of ['::first-letter','::first-line']){
    const p=view.getComputedStyle(el,pseudo);
    if(!plainChain(p)||textProperties.some(key=>value(p,key)!==value(s,key))||!['','none'].includes(p.boxShadow)||!['','none'].includes(p.backgroundImage)||!['','rgba(0, 0, 0, 0)','transparent'].includes(p.backgroundColor))return;
    if(['top','right','bottom','left'].some(side=>!zero(p,`padding-${side}`)||!zero(p,`border-${side}-width`)||!zero(p,`margin-${side}`)))return;
  }
  const width=Number.parseFloat(s.width),height=Number.parseFloat(s.height);
  // Computed used sizes are serialized with less precision than layout's 1/64px.
  if(![s.width,s.height].every(v=>/^\d+(?:\.\d+)?px$/.test(v))||![width,height].every(v=>Number.isFinite(v)&&v>0)||Math.abs(width-node.rect[2]!)>1/64||Math.abs(height-node.rect[3]!)>1/64)return;
  const measured=textRects(el);
  if(!measured.length||(!flow&&measured.length!==1)||measured.some(r=>!r.every(Number.isFinite)||r[2]!<0||r[3]!<=0)||!measured.some(r=>r[2]!>0))return;
  node.textRun={ref:node.ref,text:text.textContent,width:node.rect[2]!,height:node.rect[3]!,position:s.position as PlainTextRun['position'],styles:textProperties.map(key=>[key,value(s,key)] as [string,string]).filter(([,v])=>v!=='')};
  node.textRects=measured;
}
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
  let ancestorsPlain=true,ancestorsFlow=true,unsafeFlowContext=false;
  const parents:number[]=[],subtreeEnds:number[]=[],overflowVisible:(readonly [boolean,boolean])[]=[];
  for(let parent=root.parentElement;parent;parent=parent.parentElement){const s=view.getComputedStyle(parent);ancestorsPlain=ancestorsPlain&&plainChain(s);ancestorsFlow=ancestorsFlow&&plainFlowStyle(s);}
  function visit(el:HTMLElement,ancestorPlain:boolean,ancestorFlow:boolean,parentIndex=-1) {
    op.checkpoint();if(ignoredTags.has(el.localName))return;
    if(el.namespaceURI!=='http://www.w3.org/1999/xhtml'||!htmlTags.has(el.localName)||el.shadowRoot||el.hasAttribute('is')||el.hasAttribute('data-capture'))fail();
    const s=view!.getComputedStyle(el);if(s.display==='none')return;
    unsafeFlowContext=unsafeFlowContext||!['','none'].includes(value(s,'float'))||
      ['top','right','bottom','left'].some(side=>Number.parseFloat(value(s,`margin-${side}`))<0)||
      ['box-shadow','filter','text-shadow'].some(key=>!['','none'].includes(value(s,key)))||
      (!['','none'].includes(value(s,'outline-style'))&&Number.parseFloat(value(s,'outline-width'))>0);
    if(s.position==='sticky'||s.position==='fixed'||s.backdropFilter!=='none'||el.scrollLeft||el.scrollTop)fail();
    if(el.getAnimations().some(a=>a.playState==='running'))fail();
    const node:DomNode={element:el,ref:`n${nodes.length}`,styles:styles(el),rect:rect(el)};
    // Generated boxes have no independent cached border box for the paint
    // guards. Their presence keeps this initial normal-flow subset unchanged.
    const ownPlain=plainChain(s);
    unsafeFlowContext=unsafeFlowContext||!ownPlain||node.styles.slice(1).some(Boolean);
    const chainPlain=ancestorPlain&&ownPlain;
    const chainFlow=ancestorFlow&&plainFlowStyle(s);
    if(chainPlain)inspectText(el,s,node,chainFlow);
    for(const css of node.styles)mapCssUrls(css,url=>add(url,'image'));
    for(const pseudo of ['', '::before','::after'])for(const f of view!.getComputedStyle(el,pseudo||null).fontFamily.split(','))families.add(family(f));
    if(el.localName==='img'){
      const img=el as HTMLImageElement;if(!img.complete||!img.naturalWidth)throw new CaptureError('RESOURCE_FAILED','prepare');
      node.image=add(img.currentSrc||img.src,'image');
    }
    const index=nodes.length;nodes.push(node);parents.push(parentIndex);overflowVisible.push([s.overflowX==='visible',s.overflowY==='visible']);if(nodes.length>10000)throw new CaptureError('OUTPUT_LIMIT','prepare');
    for(const child of el.children)visit(child as HTMLElement,chainPlain,chainFlow,index);
    subtreeEnds[index]=nodes.length;
  }
  visit(root,ancestorsPlain,ancestorsFlow);
  const flowCandidates=nodes.map((node,index)=>node.textRun&&node.textRun.position!=='absolute'?index:-1).filter(index=>index>=0);
  // These guards only decide whether to add optional flow metadata. The fixed
  // comparison budget bounds this conservative check without limiting capture.
  if(flowCandidates.length&&flowCandidates.length*nodes.length>4096)unsafeFlowContext=true;
  if(flowCandidates.length&&!unsafeFlowContext){
    const outside=(inner:readonly number[],outer:readonly number[],axes:readonly [boolean,boolean])=>
      (axes[0]&&(inner[0]!<outer[0]!||inner[0]!+inner[2]!>outer[0]!+outer[2]!))||
      (axes[1]&&(inner[1]!<outer[1]!||inner[1]!+inner[3]!>outer[1]!+outer[3]!));
    for(const [index,node] of nodes.entries()){
      const parent=parents[index]!;
      if(parent>=0&&outside(node.rect,nodes[parent]!.rect,overflowVisible[parent]!)){unsafeFlowContext=true;break;}
      if(node.element.childNodes.length&&Array.from(node.element.childNodes).some(child=>child.nodeType===3&&child.textContent?.trim())&&
        textRects(node.element).some(box=>outside(box,node.rect,overflowVisible[index]!))){unsafeFlowContext=true;break;}
    }
  }
  for(const index of flowCandidates){
    const node=nodes[index]!;
    const overlaps=!unsafeFlowContext&&nodes.some((other,peer)=>{
      // Preorder intervals distinguish ancestors/descendants without another
      // DOM traversal or layout read for each candidate/peer comparison.
      if(peer===index||(index<peer&&peer<subtreeEnds[index]!)||(peer<index&&index<subtreeEnds[peer]!))return false;
      const a=node.rect,b=other.rect;
      return Math.max(a[0]!,b[0]!)<Math.min(a[0]!+a[2]!,b[0]!+b[2]!)&&Math.max(a[1]!,b[1]!)<Math.min(a[1]!+a[3]!,b[1]!+b[3]!);
    });
    if(unsafeFlowContext||overlaps){delete node.textRun;delete node.textRects;}
  }
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
      for(const n of nodes)if(n.textRects&&JSON.stringify(textRects(n.element))!==JSON.stringify(n.textRects))throw new CaptureError('SOURCE_CHANGED','capture');
    },dispose(){nodes.length=0;fonts.length=0;resources.length=0;byUrl.clear();},
  };
}
