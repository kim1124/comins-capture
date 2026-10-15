import {CaptureError} from '../errors.js';
import {mapCssUrls} from '../resources/css.js';
import {htmlTags} from '../dom/inspect.js';
import type {Size} from '../types.js';
const SVG='http://www.w3.org/2000/svg',HTML='http://www.w3.org/1999/xhtml';
export function verifySvg(svg:string,doc:Document,urls:ReadonlyMap<string,string>,allowed:ReadonlySet<string>,fonts:readonly string[],size?:Readonly<Size>):string {
  const fail=():never=>{throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');};
  const view=doc.defaultView!;
  if(svg.length>32_000_000||/<!DOCTYPE|<!ENTITY|<\?/i.test(svg))fail();
  const parsed=new view.DOMParser().parseFromString(svg,'image/svg+xml');
  if(parsed.querySelector('parsererror')||parsed.documentElement.namespaceURI!==SVG||parsed.documentElement.localName!=='svg')fail();
  if(size){
    const root=parsed.documentElement;
    if(Number(root.getAttribute('width'))!==size.width||Number(root.getAttribute('height'))!==size.height||root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number).join(',')!==`0,0,${size.width},${size.height}`)fail();
  }
  const resolve=(url:string)=>{const result=urls.get(url)??url;if(!allowed.has(result))return fail();return result;};
  for(const node of Array.from(parsed.querySelectorAll('*'))){
    if(node.namespaceURI===SVG?!['svg','g','foreignObject','style'].includes(node.localName):node.namespaceURI!==HTML||!(htmlTags.has(node.localName)||node.localName==='style'))fail();
    for(const attr of Array.from(node.attributes)){
      const name=attr.name;
      if(name==='style')node.setAttribute(name,mapCssUrls(attr.value,resolve));
      else if(name==='src'&&node.localName==='img'){const value=resolve(attr.value);if(!value.startsWith('data:image/'))fail();node.setAttribute(name,value);}
      else if(name==='font-size'){if(!/^\d+(?:\.\d+)?px$/.test(attr.value))fail();}
      else if(!['xmlns','id','class','title','lang','dir','colspan','rowspan','scope','span','start','reversed','type','alt','width','height','x','y','viewBox','transform','preserveAspectRatio','role'].includes(name)&&!/^data-[a-z0-9-]+$/.test(name)&&!/^aria-[a-z-]+$/.test(name))fail();
      if(attr.namespaceURI&&attr.namespaceURI!=='http://www.w3.org/2000/xmlns/')fail();
    }
    if(node.localName==='style')node.textContent=mapCssUrls(node.textContent??'',resolve);
  }
  // Recheck prepared rules at the serialization boundary, including all font URLs.
  const verifiedFonts=fonts.map(text=>{
    const sheet=new view.CSSStyleSheet();sheet.replaceSync(text);
    if(sheet.cssRules.length!==1||sheet.cssRules[0]!.type!==5)fail();
    const rule=sheet.cssRules[0] as CSSFontFaceRule;
    for(const key of Array.from(rule.style))if(!['font-family','font-style','font-weight','font-stretch','font-width','unicode-range','src'].includes(key))fail();
    if(!rule.style.getPropertyValue('font-family'))fail();
    let count=0;
    const src=rule.style.getPropertyValue('src');if(/\blocal\s*\(/i.test(src))fail();
    rule.style.setProperty('src',mapCssUrls(src,url=>{
      const value=resolve(url);if(!/^data:(?:font\/(?:woff2?|ttf|otf)|application\/font-woff);base64,/.test(value))fail();count++;return value;
    }));
    if(!count)fail();return rule.cssText;
  });
  if(verifiedFonts.length){const style=parsed.createElementNS(SVG,'style');style.textContent=verifiedFonts.join('\n');parsed.documentElement.prepend(style);}
  const result=new view.XMLSerializer().serializeToString(parsed);
  for(const uri of urls.values())if(!result.includes(uri))fail();
  return result;
}
