import type { LayoutPlan } from '../geometry/layout.js';
import type { Size, Diagnostic } from '../types.js';
/** Internal contract; engine-specific objects must not cross this boundary. */
export interface EngineArtifact {
  readonly svg: string;
  readonly sourceSize: Size;
  readonly diagnostics: readonly Diagnostic[];
  dispose(): void;
}
export interface OperationContext {
  readonly signal: AbortSignal;
  checkpoint(): void;
}
export interface EngineAdapter {
  capture(source: HTMLElement, context: OperationContext): Promise<EngineArtifact>;
}
/** Primitive source text geometry; no live DOM owner crosses verification. */
export interface PlainTextRun {
  readonly ref:string;readonly text:string;readonly width:number;readonly height:number;
  readonly position?:'absolute'|'static'|'relative';
  readonly styles:readonly (readonly [string,string])[];
}
/** Output rendering accepts only the immutable value returned by verification. */
export interface VerifiedSvg { readonly svg: string; readonly sourceSize: Readonly<Size>;readonly textRuns?:readonly PlainTextRun[] }
export interface SvgRenderer {
  serialize(output: VerifiedSvg, layout: LayoutPlan): string;
  render(output: VerifiedSvg, context: OperationContext, layout: LayoutPlan): Promise<HTMLCanvasElement>;
}
