import {planLayout,type LayoutPlan,type LayoutOptions,type RasterSize,type SvgSize} from '../geometry/layout.js';
import type { SvgRenderer, VerifiedSvg } from '../engine/contract.js';
import { CaptureError } from '../errors.js';
import { createOperation, type ManagedOperation, type OperationOptions } from '../lifecycle/operation.js';
import type { Diagnostic, Rect } from '../types.js';
export interface Verification { status: 'complete'; diagnostics: readonly Diagnostic[] }
export interface SnapshotMeta extends Verification {
  readonly snapshotId: string;
  readonly capturedDpr: number;
  readonly sourceRect: Readonly<Rect>;
  readonly startedAt: number;
  readonly completedAt: number;
}
export interface OutputMeta extends SnapshotMeta {
  readonly width: number; readonly height: number; readonly unit: 'px' | 'css-px' | 'mm';
  readonly mime: string | null; readonly contentRect: Readonly<Rect>;
}
export interface CaptureOutput<T> { readonly value: T; readonly meta: OutputMeta }
export type RasterOptions = OperationOptions & LayoutOptions<RasterSize>;
export type SvgOptions = OperationOptions & LayoutOptions<SvgSize>;
export type BlobOptions = (SvgOptions & {format:'svg';quality?:never}) | (RasterOptions & (
 {format?:'png';quality?:never} | {format:'jpeg'|'webp';quality?:number}
));
export interface InternalSnapshot {
  readonly meta: SnapshotMeta;
  toSvg(options?: SvgOptions): Promise<CaptureOutput<string>>;
  toCanvas(options?: RasterOptions): Promise<CaptureOutput<HTMLCanvasElement>>;
  toBlob(options?: BlobOptions): Promise<CaptureOutput<Blob>>;
  dispose(): void;
}
const diagnosticCodes = new Set(['UNSUPPORTED_CONTENT','RESOURCE_FAILED','RESOURCE_UNVERIFIABLE','SYSTEM_FONT']);
export function sanitizedDiagnostics(values: readonly Diagnostic[]): readonly Diagnostic[] {
  return Object.freeze(values.map(value=> {
    const code=diagnosticCodes.has(value.code)?value.code:'RESOURCE_UNVERIFIABLE';
    const stage=['prepare','capture','output'].includes(value.stage)?value.stage:'capture';
    return Object.freeze({code,stage,message:code}) as Diagnostic;
  }));
}
export function safelyDispose(owner: {dispose():void} | undefined): void {
  try { owner?.dispose(); } catch { /* release other owners even when a foreign cleanup throws */ }
}
function discardCanvas(canvas: HTMLCanvasElement) { canvas.width=0;canvas.height=0; }
function checkOptions(options: object, allowed: string[]) {
  if (!options || typeof options!=='object' || Array.isArray(options) || Object.keys(options).some(key=>!allowed.includes(key))) throw new CaptureError('INVALID_OPTIONS','output');
}
function blobFormat(options: {format?:string;quality?:number}) {
  const format=options.format??'png', quality=options.quality??0.92;
  if (!['png','jpeg','webp','svg'].includes(format) ||
      (options.quality!==undefined && !['jpeg','webp'].includes(format)) ||
      typeof quality!=='number' || !Number.isFinite(quality) || quality<0 || quality>1)
    throw new CaptureError('INVALID_OPTIONS','output');
  return {format,mime:format==='svg'?'image/svg+xml':`image/${format}`,quality};
}
/** Every output plans layout against the immutable verified snapshot. */
export function createSnapshot(artifact: VerifiedSvg, engine: SvgRenderer, meta: SnapshotMeta, release: ()=>void): InternalSnapshot {
  const source=artifact.sourceSize;
  const layoutKeys=['size','fit','align','background'];
  let disposed=false, released=false, active:ManagedOperation|undefined;
  const abortHandlers=new WeakMap<ManagedOperation,()=>void>();
  const releaseOnce=()=>{if(!released){released=true;release();}};
  const begin=(options:OperationOptions)=>{
    if(disposed)throw new CaptureError('DISPOSED','output');
    if(active)throw new CaptureError('BUSY','output');
    const op=createOperation('output',options);active=op;
    const aborted=()=>finish(op);abortHandlers.set(op,aborted);
    op.signal.addEventListener('abort',aborted,{once:true});return op;
  };
  const finish=(op:ManagedOperation)=>{
    op.close();
    const aborted=abortHandlers.get(op);if(aborted)op.signal.removeEventListener('abort',aborted);abortHandlers.delete(op);
    const unlock=()=>{if(active===op)active=undefined;if(disposed)releaseOnce();};
    if(op.pending)void op.drained().then(unlock);else unlock();
  };
  const outputMeta=(mime:string|null,plan:LayoutPlan):OutputMeta=>Object.freeze({...meta,...plan.outputSize,mime,unit:plan.unit,contentRect:plan.contentRect});
  const serialize=(plan:LayoutPlan)=>engine.serialize(artifact,plan);
  async function raster(op:ManagedOperation,plan:LayoutPlan):Promise<HTMLCanvasElement> {
    const area=plan.outputSize;
    if(![area.width,area.height].every(n=>Number.isSafeInteger(n)&&n>0&&n<=8192)||area.width*area.height>32_000_000)
      throw new CaptureError('OUTPUT_LIMIT','output');
    let canvas:HTMLCanvasElement;
    try { canvas=await op.wait(()=>engine.render(artifact,op,plan),discardCanvas); }
    catch {op.checkpoint();throw new CaptureError('ENGINE_FAILED','output');}
    if(canvas.width!==area.width||canvas.height!==area.height){discardCanvas(canvas);throw new CaptureError('OUTPUT_MISMATCH','output');}
    return canvas;
  }
  async function encode(encoding:{format:string;mime:string;quality:number},op:ManagedOperation,plan:LayoutPlan):Promise<Blob> {
    const {mime,quality}=encoding,canvas=await raster(op,plan);
    try {
      const blob=await op.wait(()=>new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,mime,quality)));
      if(!blob||blob.type!==mime)throw new Error();return blob;
    } catch {op.checkpoint();throw new CaptureError('FORMAT_UNSUPPORTED','output');}
    finally {if(op.pending)void op.drained().then(()=>discardCanvas(canvas));else discardCanvas(canvas);}
  }
  async function output<T>(options:OperationOptions,run:(op:ManagedOperation)=>Promise<CaptureOutput<T>>,discard?:(value:T)=>void) {
    const op=begin(options);
    try {
      op.checkpoint();const result=await run(op);
      try{op.checkpoint();}catch(error){discard?.(result.value);throw error;}
      return result;
    } finally {finish(op);}
  }
  return Object.freeze({
    meta,
    async toSvg(options:SvgOptions={}) {
      checkOptions(options,['signal','timeoutMs',...layoutKeys]);
      const plan=planLayout(source,options,'svg');
      return output(options,async()=>({value:serialize(plan),meta:outputMeta('image/svg+xml',plan)}));
    },
    async toCanvas(options:RasterOptions={}) {
      checkOptions(options,['signal','timeoutMs',...layoutKeys]);
      const plan=planLayout(source,options,'raster',meta.capturedDpr);
      return output(options,async op=>({value:await raster(op,plan),meta:outputMeta(null,plan)}),discardCanvas);
    },
    async toBlob(options:BlobOptions={}) {
      checkOptions(options,['signal','timeoutMs','format','quality',...layoutKeys]);const {format,mime,quality}=blobFormat(options);
      const plan=planLayout(source,options,format==='svg'?'svg':'raster',meta.capturedDpr,format);
      return output(options,async op=>format==='svg' ?
        {value:new Blob([serialize(plan)],{type:mime}),meta:outputMeta(mime,plan)} :
        {value:await encode({format,mime,quality},op,plan),meta:outputMeta(mime,plan)});
    },
    dispose() {if(disposed)return;disposed=true;if(active){active.cancel('DISPOSED');if(!active.pending)releaseOnce();}else releaseOnce();},
  });
}
