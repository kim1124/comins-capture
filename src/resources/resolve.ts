import { CaptureError } from '../errors.js';
import type { ManagedOperation } from '../lifecycle/operation.js';
import type { NetworkPolicy } from '../types.js';
import { requestPolicy } from './policy.js';
export type ResourceKind = 'image' | 'font';
export interface ResourceEntry {
  readonly resourceRef: string;
  readonly kind: ResourceKind;
  readonly url: string;
  readonly dependsOn: readonly string[];
  readonly memory?: Blob;
}
export interface ResourceOptions {
  network?: NetworkPolicy;
  credentials?: 'omit' | 'same-origin';
  resolve?: (request: {resourceRef: string; kind: ResourceKind; url: string; signal: AbortSignal}) => Promise<Blob | undefined>;
}
/** Transport injection is internal and never exposed as a consumer option. */
export interface ResourceTransportOptions extends ResourceOptions { fetch?: typeof globalThis.fetch }
/** Copy policy before invoking consumer code; never admit the internal transport through capture options. */
export function resourceOptions(input: ResourceTransportOptions, transportAllowed=false): ResourceTransportOptions {
  try {
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error();
    const allowed=['network','credentials','resolve',...(transportAllowed?['fetch']:[])];
    if(Object.keys(input).some(key=>!allowed.includes(key)))throw new Error();
    const options={...input};
    if(options.resolve!==undefined&&typeof options.resolve!=='function')throw new Error();
    if(options.fetch!==undefined&&typeof options.fetch!=='function')throw new Error();
    if(options.credentials!==undefined&&!['omit','same-origin'].includes(options.credentials))throw new Error();
    const network=options.network;
    if(network!==undefined&&network!=='deny'&&network!=='same-origin') {
      if(!network||typeof network!=='object'||Object.keys(network).some(key=>key!=='origins')||!Array.isArray(network.origins))throw new Error();
      const origins=[...network.origins];
      for(const origin of origins){const url=new URL(origin);if(typeof origin!=='string'||!['http:','https:'].includes(url.protocol)||url.origin!==origin)throw new Error();}
      options.network={origins};
    }
    return options;
  } catch {throw new CaptureError('INVALID_OPTIONS','prepare');}
}
export interface ResolvedResources {
  get(resourceRef: string): Blob;
  dispose(): void;
}
function blobCopy(value: Blob): Blob {
  // Native brand check accepts a Blob from another window, unlike instanceof.
  try { return Blob.prototype.slice.call(value, 0, value.size, value.type); }
  catch { throw new CaptureError('RESOURCE_FAILED', 'prepare'); }
}
/** Resolves bytes only. Collecting/replacing CSS, fonts and SVG references is a separate mandatory stage. */
export async function resolveResources(
  input: readonly ResourceEntry[], base: string, options: ResourceTransportOptions, operation: ManagedOperation,
): Promise<ResolvedResources> {
  operation.checkpoint();
  options=resourceOptions(options,true);
  const network = typeof options.network === 'object' ? { origins: [...options.network.origins] } : options.network ?? 'deny';
  const credentials = options.credentials ?? 'omit', resolver = options.resolve, transport = options.fetch;
  if (!['omit','same-origin'].includes(credentials)) throw new CaptureError('INVALID_OPTIONS','prepare');
  const entries = new Map<string, ResourceEntry>();
  try {
    // Copy the manifest before invoking any asynchronous consumer code.
    for (const item of input) {
      if (!/^r\d+$/.test(item.resourceRef) || entries.has(item.resourceRef) || !['image','font'].includes(item.kind))
        throw new Error();
      entries.set(item.resourceRef, { ...item, url: new URL(item.url, base).href, dependsOn: [...item.dependsOn] });
    }
  } catch { throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare'); }
  const order: ResourceEntry[] = [], remaining = new Map([...entries].map(([id,item]) => [id,new Set(item.dependsOn)]));
  const dependents = new Map<string, string[]>();
  for (const [id,deps] of remaining) for (const dependency of deps) {
    if (!entries.has(dependency)) throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');
    dependents.set(dependency,[...dependents.get(dependency) ?? [],id]);
  }
  const ready = [...remaining].filter(([,deps])=>deps.size===0).map(([id])=>id);
  for (let index=0; index<ready.length; index++) {
    const id=ready[index]!; order.push(entries.get(id)!);
    for (const dependent of dependents.get(id) ?? []) {
      const deps=remaining.get(dependent)!;deps.delete(id);if (!deps.size) ready.push(dependent);
    }
  }
  if (order.length!==entries.size) throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');
  const cache = new Map<string,Blob>(), resolved = new Map<string,Blob>();
  const key = (entry: ResourceEntry) => JSON.stringify([entry.kind,entry.url]);
  let disposed = false;
  try {
    for (const entry of entries.values()) if (entry.memory !== undefined) cache.set(key(entry),blobCopy(entry.memory));
    for (const entry of order) {
      operation.checkpoint();
      let bytes=cache.get(key(entry));
      if (!bytes && resolver) {
        try {
          const candidate=await operation.wait(()=>resolver({resourceRef:entry.resourceRef,kind:entry.kind,url:entry.url,signal:operation.signal}));
          if (candidate!==undefined) bytes=blobCopy(candidate);
        } catch { operation.checkpoint(); throw new CaptureError('RESOURCE_FAILED','prepare'); }
      }
      if (!bytes) {
        let request: ReturnType<typeof requestPolicy>;
        try { request=requestPolicy(entry.url,base,network); }
        catch { throw new CaptureError('NETWORK_DISABLED','prepare'); }
        const requestCredentials=credentials==='same-origin' && new URL(request.url).origin===new URL(base).origin ? 'same-origin' : 'omit';
        try {
          const response=await operation.wait(()=> (transport ?? globalThis.fetch)(request.url, {
            credentials:requestCredentials,redirect:'error',signal:operation.signal,referrerPolicy:'no-referrer',
          }),response=>{ void response.body?.cancel().catch(()=>{}); });
          if (!response.ok || response.redirected || response.type==='opaque' || response.type==='opaqueredirect' ||
            (response.url && new URL(response.url).origin!==new URL(request.url).origin)) {
            void response.body?.cancel().catch(()=>{});throw new Error();
          }
          bytes=await operation.wait(()=>response.blob());
        } catch { operation.checkpoint();throw new CaptureError('RESOURCE_FAILED','prepare'); }
      }
      operation.checkpoint();cache.set(key(entry),bytes);resolved.set(entry.resourceRef,bytes);
    }
    return {
      get(ref) { if(disposed) throw new CaptureError('DISPOSED','prepare');const value=resolved.get(ref);if(!value)throw new CaptureError('RESOURCE_UNVERIFIABLE','prepare');return value; },
      dispose() { disposed=true;resolved.clear();cache.clear(); },
    };
  } catch(error) { resolved.clear();cache.clear();throw error; }
}
