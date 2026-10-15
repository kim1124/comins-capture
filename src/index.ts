// Import-safe foundation. No DOM access or engine import at module evaluation.
export type { Size, Rect, PaperName, PaperOptions, NetworkPolicy, Diagnostic } from './types.js';
export { paperSize } from './geometry/paper.js';
export {capture} from './capture.js';
export type {CaptureTarget,CaptureOptions,CaptureSnapshot} from './capture.js';
export {CaptureError} from './errors.js';
export type {CaptureErrorCode,CaptureStage} from './errors.js';
export type {SnapshotMeta,OutputMeta,CaptureOutput,RasterOptions,SvgOptions,BlobOptions} from './core/snapshot.js';
export type {RasterSize,SvgSize,Margins} from './geometry/layout.js';
export type {ResourceOptions,ResourceKind} from './resources/resolve.js';
