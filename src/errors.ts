import type { Diagnostic } from './types.js';
export type CaptureStage = Diagnostic['stage'];
export type CaptureErrorCode = 'INVALID_TARGET' | 'INVALID_OPTIONS' | 'UNSUPPORTED_ENVIRONMENT' |
  'UNSUPPORTED_CONTENT' | 'NETWORK_DISABLED' | 'RESOURCE_FAILED' | 'RESOURCE_UNVERIFIABLE' |
  'OUTPUT_LIMIT' | 'FORMAT_UNSUPPORTED' | 'OUTPUT_MISMATCH' | 'SOURCE_CHANGED' |
  'ABORTED' | 'TIMEOUT' | 'DISPOSED' | 'BUSY' | 'ENGINE_FAILED';
/** Public typed failure. Never retains a cause or source content. */
export class CaptureError extends Error {
  readonly diagnostics: readonly Diagnostic[];
  constructor(readonly code: CaptureErrorCode, readonly stage: CaptureStage) {
    super(code);
    this.name = 'CaptureError';
    this.diagnostics = Object.freeze([Object.freeze({ code, stage, message: code })]);
  }
}
