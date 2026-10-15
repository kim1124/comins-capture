import {CaptureError} from '../errors.js';
/** Conservative CSS token walk. Unsupported escape/indirection syntax fails closed. */
export function mapCssUrls(css:string,resolve:(url:string)=>string):string {
  const fail=():never=>{throw new CaptureError('UNSUPPORTED_CONTENT','prepare');};
  if(/[\\\x00-\x08\x0b\x0e-\x1f]/.test(css)||css.includes('/*')||/(?:^|[;{])\s*(?:--|behavior\s*:|-moz-binding\s*:)/i.test(css))fail();
  let out='',i=0;
  while(i<css.length) {
    const c=css[i]!;
    if(c==='@')fail();
    if(c==='"'||c==="'") {
      const end=css.indexOf(c,i+1);if(end<0)fail();out+=css.slice(i,end+1);i=end+1;continue;
    }
    if(/[a-z_-]/i.test(c)) {
      const start=i++;while(i<css.length&&/[\w-]/.test(css[i]!))i++;
      const word=css.slice(start,i),lower=word.toLowerCase();
      if(css[i]==='('&&['var','image','image-set','-webkit-image-set','paint','expression','src'].includes(lower))fail();
      if(lower==='url'&&css[i]==='(') {
        i++;while(/\s/.test(css[i]??'')&&i<css.length)i++;
        let value:string;
        if(css[i]==='"'||css[i]==="'") {
          const quote=css[i++]!,end=css.indexOf(quote,i);if(end<0)fail();value=css.slice(i,end);i=end+1;
          while(i<css.length&&/\s/.test(css[i]!))i++;
        }else {const start=i;while(i<css.length&&css[i]!==')')i++;value=css.slice(start,i).trim();if(/[\s('"<>]/.test(value))fail();}
        if(css[i]!==')'||!value!)fail();i++;
        const resolved=resolve(value!);if(/["\\\r\n\f]/.test(resolved))fail();
        out+=`url("${resolved}")`;continue;
      }
      out+=word;continue;
    }
    out+=c;i++;
  }
  return out;
}
