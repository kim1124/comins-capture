/** Engine-independent public geometry and resource policy types. */
export interface Size { width: number; height: number }
export interface Rect extends Size { x: number; y: number }
export type PaperName = 'A3' | 'A4' | 'A5' | 'B3' | 'B4' | 'B5';
export interface PaperOptions { standard?: 'ISO' | 'JIS'; orientation?: 'portrait' | 'landscape'; ppi?: number }
export type NetworkPolicy = 'deny' | 'same-origin' | { origins: readonly string[] };
export interface Diagnostic { code: string; stage: 'prepare' | 'capture' | 'output'; message: string }
