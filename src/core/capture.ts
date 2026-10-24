import type { EngineAdapter, EngineArtifact, SvgRenderer, PlainTextRun } from '../engine/contract.js';
import { CaptureError, type CaptureErrorCode } from '../errors.js';
import { createOperation, type ManagedOperation, type OperationOptions } from '../lifecycle/operation.js';
import { resolveResources, resourceOptions, type ResourceEntry, type ResourceOptions, type ResolvedResources } from '../resources/resolve.js';
import type { Size } from '../types.js';
import { createSnapshot, sanitizedDiagnostics, safelyDispose, type Verification, type InternalSnapshot } from './snapshot.js';
export interface SourceInspection {
  readonly documentUrl: string;
  readonly resources: readonly ResourceEntry[];
  readonly sourceSize: Size;
  assertUnchanged(): void | Promise<void>;
  dispose(): void;
}
export interface PreparedSource { readonly root: HTMLElement; dispose(): void }
export interface CaptureStages {
  inspect(source: HTMLElement, context: ManagedOperation): Promise<SourceInspection>;
  prepare(inspection: SourceInspection, resources: ResolvedResources, context: ManagedOperation): Promise<PreparedSource>;
  engine: EngineAdapter;
  renderer: SvgRenderer;
  /** Must verify every resource insertion and sanitize/validate active SVG content. No default pass. */
  verify(artifact: EngineArtifact, inspection: SourceInspection, resources: ResolvedResources, context: ManagedOperation): Promise<Verification & {readonly svg: string;readonly textRuns?:readonly PlainTextRun[]}>;
}
export interface CaptureOptions extends OperationOptions {
  ready?: (context: {signal: AbortSignal})=>Promise<void>;
  resources?: ResourceOptions;
}
const documents=new WeakSet<Document>();
function immutableTextRuns(runs:readonly PlainTextRun[]|undefined):readonly PlainTextRun[]|undefined {
  if(runs===undefined)return undefined;
  const fail=():never=>{throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');};
  if(!Array.isArray(runs))return fail();
  return Object.freeze(runs.map(run=>{
    if(!run||typeof run.ref!=='string'||!/^n\d+$/.test(run.ref)||typeof run.text!=='string'||!run.text||![run.width,run.height].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0)||!Array.isArray(run.styles))return fail();
    if(run.position!==undefined&&!['absolute','static','relative'].includes(run.position))return fail();
    const styles=run.styles.map((pair:readonly [string,string])=>{
      if(!Array.isArray(pair)||pair.length!==2||pair.some(v=>typeof v!=='string'))return fail();
      return Object.freeze([pair[0],pair[1]] as const);
    });
    return Object.freeze({ref:run.ref,text:run.text,width:run.width,height:run.height,...(run.position?{position:run.position}:{}),styles:Object.freeze(styles)});
  }));
}
/** Internal coordinator used by the restricted static DOM factory; wider G1/G3 gates remain. */
export function createCapturePipeline(stages: CaptureStages) {
  return async function capture(source:HTMLElement,options:CaptureOptions={}):Promise<InternalSnapshot> {
    if(typeof stages.renderer?.render!=='function')throw new CaptureError('UNSUPPORTED_ENVIRONMENT','prepare');
    try {
      if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(key=>!['signal','timeoutMs','ready','resources'].includes(key)))throw new Error();
      options={...options,resources:resourceOptions(options.resources??{})};
      if(options.ready!==undefined&&typeof options.ready!=='function')throw new Error();
    } catch {throw new CaptureError('INVALID_OPTIONS','prepare');}
    const document=source?.ownerDocument;
    if(!document||typeof document!=='object')throw new CaptureError('INVALID_TARGET','prepare');
    if(documents.has(document))throw new CaptureError('BUSY','prepare');
    const op=createOperation('prepare',options),startedAt=Date.now();documents.add(document);
    let inspection:SourceInspection|undefined,prepared:PreparedSource|undefined,resources:ResolvedResources|undefined,artifact:EngineArtifact|undefined,transferred=false;
    const cleanup=()=>{if(!transferred){safelyDispose(artifact);safelyDispose(prepared);safelyDispose(resources);}safelyDispose(inspection);documents.delete(document);};
    async function run<T>(code:CaptureErrorCode,work:()=>Promise<T>|T,discard?:(value:T)=>void):Promise<T> {
      try{return await op.wait(work,discard);}catch(error){op.checkpoint();throw new CaptureError(error instanceof CaptureError?error.code:code,op.stage);}
    }
    try {
      op.checkpoint();
      if(options.ready)await run('RESOURCE_FAILED',()=>options.ready!({signal:op.signal}));
      inspection=await run('RESOURCE_UNVERIFIABLE',()=>stages.inspect(source,op),safelyDispose);
      const size={...inspection.sourceSize};
      const capturedDpr=document.defaultView?.devicePixelRatio??1;
      if(![size.width,size.height].every(n=>Number.isFinite(n)&&n>0))throw new CaptureError('INVALID_TARGET','prepare');
      resources=await resolveResources(inspection.resources,inspection.documentUrl,options.resources??{},op);
      prepared=await run('RESOURCE_UNVERIFIABLE',()=>stages.prepare(inspection!,resources!,op),safelyDispose);
      op.stage='capture';
      artifact=await run('ENGINE_FAILED',()=>stages.engine.capture(prepared!.root,op),safelyDispose);
      if(artifact.sourceSize.width!==size.width||artifact.sourceSize.height!==size.height)throw new CaptureError('OUTPUT_MISMATCH','capture');
      const verification=await run('RESOURCE_UNVERIFIABLE',()=>stages.verify(artifact!,inspection!,resources!,op));
      if(!verification||typeof verification.svg!=='string'||!verification.svg.trim()||verification.status!=='complete'||!Array.isArray(verification.diagnostics))throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
      const textRuns=immutableTextRuns(verification.textRuns);
      const verified=Object.freeze({svg:verification.svg,sourceSize:Object.freeze({...size}),...(textRuns?{textRuns}:{})});
      await run('SOURCE_CHANGED',()=>inspection!.assertUnchanged());
      op.checkpoint();
      const meta=Object.freeze({snapshotId:crypto.randomUUID(),capturedDpr,sourceRect:Object.freeze({x:0,y:0,...size}),startedAt,completedAt:Date.now(),status:verification.status,diagnostics:sanitizedDiagnostics(verification.diagnostics)});
      const ownedArtifact=artifact,ownedPrepared=prepared,ownedResources=resources;
      const snapshot=createSnapshot(verified,stages.renderer,meta,()=>{safelyDispose(ownedArtifact);safelyDispose(ownedPrepared);safelyDispose(ownedResources);});
      op.checkpoint();
      transferred=true;return snapshot;
    } finally {
      op.close();
      // Never overlap a new capture with work that ignored cancellation.
      if(op.pending)void op.drained().then(cleanup);else cleanup();
    }
  };
}
