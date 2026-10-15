import type {EngineAdapter} from './contract.js';
import type {PreparedDom} from '../dom/prepare.js';
import {ignoredTags} from '../dom/inspect.js';
import {mapCssUrls} from '../resources/css.js';
import {CaptureError} from '../errors.js';
/** The engine serializes only. Its original image exporters are never retained. */
export function createDomAdapter(prepared:PreparedDom):EngineAdapter {
  return {
    async capture(source,context){
      context.checkpoint();
      // A literal specifier lets consumer bundlers include the fixed engine chunk.
      const {snapdom}=await import('./vendor/snapdom.mjs');
      const session=prepared.session;
      const result=await snapdom(source,{cache:false,invalidate:true,embedFonts:false,dpr:1,scale:1,reconcile:false,
        plugins:[{name:'comins-prepared-dom',needs:'render',
          beforeClone(ctx){(ctx as unknown as {__comins:typeof session}).__comins=session;session.assertComplete();},
          resolveNode(node){
            if(ignoredTags.has(node.localName))return null;
            if(node.localName==='img')return session.shallowClone(node);
          },
          afterClone(ctx){
            session.assertComplete();if(!ctx.clone)throw new CaptureError('ENGINE_FAILED','capture');
            for(const el of [ctx.clone,...Array.from(ctx.clone.querySelectorAll('*'))]){
              const style=el.getAttribute('style');if(style)el.setAttribute('style',mapCssUrls(style,url=>{const data=prepared.urls.get(url)??url;if(!prepared.allowed.has(data))throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');return data;}));
            }
          },beforeRender(){session.assertComplete();},afterRender(){session.assertComplete();},
        }],
      });
      session.assertComplete();context.checkpoint();
      if(result.warnings.some(w=>w.code!=='reconcile-risk'))throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
      if(!result.url.startsWith('data:image/svg+xml'))throw new CaptureError('ENGINE_FAILED','capture');
      const box=source.getBoundingClientRect();
      const view=source.ownerDocument.defaultView!;
      const parsed=new view.DOMParser().parseFromString(decodeURIComponent(result.url.slice(result.url.indexOf(',')+1)),'image/svg+xml');
      const root=parsed.documentElement,objects=root.querySelectorAll('foreignObject');
      if(parsed.querySelector('parsererror')||objects.length!==1)throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
      // SnapDOM rounds its viewport; retain measured fractional CSS geometry.
      for(const el of [root,objects[0]!]){el.setAttribute('width',String(box.width));el.setAttribute('height',String(box.height));}
      root.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
      return {svg:new view.XMLSerializer().serializeToString(parsed),sourceSize:{width:box.width,height:box.height},diagnostics:[],dispose(){}};
    },
  };
}
