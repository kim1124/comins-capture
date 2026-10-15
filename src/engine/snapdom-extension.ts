import {CaptureError, type CaptureErrorCode} from '../errors.js';
import type {OperationContext} from './contract.js';

/** Internal bridge for the fixed modified bundle. This is not a DOM preparer or image decoder. */
export interface ExtensionBindings {
  readonly images: readonly {readonly url: string; readonly dataUrl: string}[];
  readonly cloneShallow: (source: Node) => Node;
}
export interface ExtensionSession {
  shallowClone(source: Node): Node;
  resolveImage(url: string): Promise<{ok: true; data: string}>;
  assertComplete(): void;
  dispose(): void;
}
export function createExtensionSession(bindings: ExtensionBindings, context: OperationContext): ExtensionSession {
  const images=new Map<string,string>();
  let clone: ExtensionBindings['cloneShallow'] | undefined=bindings.cloneShallow;
  let disposed=false, failure: CaptureErrorCode | undefined;
  const fail=(code:CaptureErrorCode):never=>{failure??=code;throw new CaptureError(failure,'capture');};
  const check=()=>{
    if(disposed)throw new CaptureError('DISPOSED','capture');
    if(context.signal.aborted)fail('ABORTED');
    try{context.checkpoint();}catch(error){fail(error instanceof CaptureError?error.code:'ENGINE_FAILED');}
    if(failure)throw new CaptureError(failure,'capture');
  };
  check();
  try {
    if(typeof clone!=='function')throw Error();
    for(const entry of bindings.images) {
      if(typeof entry.url!=='string'||!entry.url||images.has(entry.url)||typeof entry.dataUrl!=='string'||
        !/^data:image\/(?:png|jpeg|webp);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(entry.dataUrl)||entry.dataUrl.endsWith(','))throw Error();
      images.set(entry.url,entry.dataUrl);
    }
  }catch{images.clear();fail('RESOURCE_UNVERIFIABLE');}
  return Object.freeze({
    shallowClone(source:Node) {
      check();let result:Node;
      try{result=clone!(source);}catch{check();return fail('ENGINE_FAILED');}
      check();
      if(!result||result===source||result.parentNode!==null)fail('ENGINE_FAILED');
      return result;
    },
    async resolveImage(url:string) {
      check();const data=images.get(url);if(data===undefined)return fail('RESOURCE_UNVERIFIABLE');
      return {ok:true as const,data};
    },
    assertComplete:check,
    dispose(){disposed=true;images.clear();clone=undefined;},
  });
}
interface EngineContext {readonly __comins?: ExtensionSession}
function session(context:EngineContext):ExtensionSession {
  if(!context.__comins)throw new CaptureError('ENGINE_FAILED','capture');
  return context.__comins;
}
/** Names imported only by the generated engine. No global hooks or default network fallback here. */
export function shallowClone(source:Node,context:EngineContext):Node {return session(context).shallowClone(source);}
export async function resolveImage(url:string,context:EngineContext):Promise<{ok:true;data:string}> {return session(context).resolveImage(url);}
