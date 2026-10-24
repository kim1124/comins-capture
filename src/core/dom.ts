import {createCapturePipeline,type CaptureOptions} from './capture.js';
import {inspectDom,type DomInspection} from '../dom/inspect.js';
import {prepareDom,type PreparedDom} from '../dom/prepare.js';
import {createDomAdapter} from '../engine/dom-adapter.js';
import {createSvgRenderer} from '../output/svg-renderer.js';
import {verifySvg} from '../output/verify-svg.js';
import {CaptureError} from '../errors.js';
import type {PlainTextRun} from '../engine/contract.js';
/** Verify source identity before primitive text geometry can reach output. */
export function verifiedDomText(inspection:DomInspection,parsed:Document,urls:ReadonlyMap<string,string>):readonly PlainTextRun[] {
  const textRuns:PlainTextRun[]=[];
  for(const n of inspection.nodes){
    const matches=parsed.querySelectorAll(`[data-comins-node="${n.ref}"]`),match=matches[0];
    if(matches.length!==1)throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
    if(n.image&&match!.getAttribute('src')!==urls.get(n.image))throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
    if(n.textRun){
      if(match!.childNodes.length!==1||match!.firstChild?.nodeType!==3||match!.textContent!==n.textRun.text)throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
      textRuns.push(n.textRun);
    }
  }
  return textRuns;
}
/** Restricted static DOM integration used by the public capture API. */
export async function captureDom(source:HTMLElement,options:CaptureOptions={}) {
  if(!source?.ownerDocument?.defaultView||!(source instanceof source.ownerDocument.defaultView.HTMLElement))throw new CaptureError('INVALID_TARGET','prepare');
  let prepared:PreparedDom|undefined;
  const capture=createCapturePipeline({
    inspect:inspectDom,
    async prepare(inspection,resources,context){prepared=await prepareDom(inspection as DomInspection,resources,context);return prepared;},
    engine:{async capture(root,context){if(!prepared)throw new CaptureError('ENGINE_FAILED','capture');return createDomAdapter(prepared).capture(root,context);}},
    renderer:createSvgRenderer(source.ownerDocument),
    async verify(artifact,inspection){
      if(!prepared)throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
      const svg=verifySvg(artifact.svg,source.ownerDocument,prepared.urls,prepared.allowed,prepared.fonts,inspection.sourceSize);
      const parsed=new source.ownerDocument.defaultView!.DOMParser().parseFromString(svg,'image/svg+xml');
      const textRuns=verifiedDomText(inspection as DomInspection,parsed,prepared.urls);
      return {svg,textRuns,status:'complete',diagnostics:[{code:'SYSTEM_FONT',stage:'capture',message:'SYSTEM_FONT'}]};
    },
  });
  return capture(source,options);
}
