import type { PaperName, PaperOptions, Size } from '../types.js';
const ISO = {A3:[297,420],A4:[210,297],A5:[148,210],B3:[353,500],B4:[250,353],B5:[176,250]} as const;
const JIS = {...ISO,B3:[364,515],B4:[257,364],B5:[182,257]} as const;
export function paperMillimeters(name: PaperName, options: Pick<PaperOptions,'standard'|'orientation'> = {}): Size {
  const table=options.standard==='JIS'?JIS:ISO;
  if(!Object.hasOwn(table,name))throw new RangeError('Unknown paper size');
  const mm=table[name];
  return options.orientation==='landscape'?{width:mm[1],height:mm[0]}:{width:mm[0],height:mm[1]};
}
export function paperSize(name: PaperName, options: PaperOptions = {}): Size {
  const ppi = options.ppi ?? 300, standard = options.standard ?? 'ISO';
  const orientation = options.orientation ?? 'portrait';
  if (!Number.isFinite(ppi) || ppi <= 0 || !['ISO','JIS'].includes(standard) || !['portrait','landscape'].includes(orientation)) throw new RangeError('Invalid paper options');
  const mm = (standard === 'JIS' ? JIS : ISO)[name];
  if (!mm) throw new RangeError('Unknown paper size');
  const width = Math.round(mm[0] * ppi / 25.4), height = Math.round(mm[1] * ppi / 25.4);
  if (![width,height].every(n=>Number.isSafeInteger(n)&&n>0)) throw new RangeError('Invalid paper output');
  return orientation === 'landscape' ? {width:height,height:width} : {width,height};
}
