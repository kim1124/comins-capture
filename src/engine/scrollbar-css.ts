import {CaptureError} from '../errors.js';

// SnapDOM 3.2.0 yo/Hf의 수집 범위는 유지하며, 확실히 무관한 host만 제외한다.
const enginePattern=/::-(?:webkit-(?:scrollbar|meter|progress|slider)|moz-(?:meter|progress))/i;
const terminalPseudo=/::-(?:webkit-(?:scrollbar(?:-button|-thumb|-track|-track-piece|-corner)?|resizer|meter(?:-bar|-inner-element|-optimum-value|-suboptimum-value|-even-less-good-value)?|progress(?:-bar|-value|-inner-element)?|slider(?:-thumb|-runnable-track)?)|moz-(?:meter-bar|progress-bar))(?::(?:hover|active))*$/i;

/** Deliberately incomplete selector analysis: unknown always retains the original rule. */
export function scrollbarHosts(selector:string):readonly string[]|undefined {
  if(selector.length>16_384)return;
  const parts:string[]=[];let start=0,quote='',comment=false,escaped=false;
  const stack:string[]=[];
  for(let i=0;i<selector.length;i++){
    const c=selector[i]!,next=selector[i+1];
    if(comment){if(c==='*'&&next==='/'){comment=false;i++;}continue;}
    if(escaped){escaped=false;continue;}
    if(c==='\\'){escaped=true;continue;}
    if(quote){if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='/'&&next==='*'){comment=true;i++;continue;}
    if(c==='('||c==='[')stack.push(c);
    if(c===')'||c===']'){if(stack.pop()!==(c===')'?'(':'['))return;}
    if(c===','&&!stack.length){parts.push(selector.slice(start,i));start=i+1;}
  }
  if(quote||comment||escaped||stack.length)return;
  parts.push(selector.slice(start));
  const hosts:string[]=[];
  for(const part of parts){
    const value=part.trim(),match=terminalPseudo.exec(value);
    if(!match)return;
    const host=value.slice(0,match.index);
    // hover/active are stripped only after a known native pseudo-element. The
    // host is a superset across those states: a matching host keeps the entire
    // original rule even when not currently hovered. Other pseudo syntax stays
    // unknown; matches() must never evaluate pseudo-element state on the host.
    if(/[():\\]|\/\*/.test(host))return;
    hosts.push(host.trim()?(/[\s>+~]$/.test(host)?host+'*':host):'*');
  }
  return hosts;
}

/** Call-owned traversal; no document cache or retained DOM references. */
export function collectScrollbarCss(root:Element,nodes:readonly Element[],checkpoint:()=>void):string {
  let work=0,bytes=0;
  const seen=new Set<string>(),active=new Set<CSSStyleSheet>();
  const tick=()=>{checkpoint();if(++work>250_000)throw new CaptureError('OUTPUT_LIMIT','capture');};
  const relevant=(selector:string)=>{
    const hosts=scrollbarHosts(selector);if(!hosts)return true;
    for(const host of hosts)for(const node of nodes){tick();try{if(node.matches(host))return true;}catch{return true;}}
    return false;
  };
  const rulesOf=(sheet:CSSStyleSheet):CSSRuleList|undefined=>{try{return sheet.cssRules;}catch{return;}};
  const visit=(rules:CSSRuleList,depth:number):string=>{
    if(depth>64)throw new CaptureError('OUTPUT_LIMIT','capture');
    let result='';
    for(let index=0;index<rules.length;index++){
      tick();const rule=rules[index]!;
      if(rule.type===3){
        const sheet=(rule as CSSImportRule).styleSheet;
        if(sheet&&!active.has(sheet)){const nested=rulesOf(sheet);if(nested){active.add(sheet);try{result+=visit(nested,depth+1);}finally{active.delete(sheet);}}}
      }else if(rule.type===4){
        const media=rule as CSSMediaRule,css=visit(media.cssRules,depth+1);
        if(css)result+=`@media ${media.conditionText}{${css}}`;
      }else if(rule.type===1){
        const style=rule as CSSStyleRule,selector=style.selectorText||'';
        if(enginePattern.test(selector)&&relevant(selector)){
          const css=style.cssText;if(css&&!seen.has(css)){seen.add(css);bytes+=css.length;if(bytes>4_000_000)throw new CaptureError('OUTPUT_LIMIT','capture');result+=css;}
        }
      }
    }
    return result;
  };
  let css='';
  for(const sheet of Array.from(root.ownerDocument.styleSheets)){
    tick();const rules=rulesOf(sheet);if(rules){active.add(sheet);try{css+=visit(rules,0);}finally{active.delete(sheet);}}
  }
  return css;
}
