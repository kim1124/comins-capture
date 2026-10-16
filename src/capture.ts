import type {CaptureOptions as PipelineOptions} from './core/capture.js';
import type {InternalSnapshot} from './core/snapshot.js';
/** Initial public surface: a connected static HTML subtree, with fail-closed preparation. */
export type CaptureTarget = HTMLElement;
export type CaptureOptions = PipelineOptions;
export type CaptureSnapshot = InternalSnapshot;
/** Import-safe in SSR; DOM inspection and the engine load only when called. */
export async function capture(target:CaptureTarget,options:CaptureOptions={}):Promise<CaptureSnapshot> {
 const {captureDom}=await import('./core/dom.js');
 return captureDom(target,options);
}
