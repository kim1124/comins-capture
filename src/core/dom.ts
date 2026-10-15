import {createCapturePipeline,type CaptureOptions} from './capture.js';
import {inspectDom,type DomInspection} from '../dom/inspect.js';
import {prepareDom,type PreparedDom} from '../dom/prepare.js';
import {createDomAdapter} from '../engine/dom-adapter.js';
import {createSvgRenderer} from '../output/svg-renderer.js';
import {verifySvg} from '../output/verify-svg.js';
import {CaptureError} from '../errors.js';
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
      for(const n of (inspection as DomInspection).nodes){
        const matches=parsed.querySelectorAll(`[data-comins-node="${n.ref}"]`);
        if(matches.length!==1)throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
        if(n.image&&matches[0]!.getAttribute('src')!==prepared.urls.get(n.image))throw new CaptureError('RESOURCE_UNVERIFIABLE','capture');
      }
      return {svg,status:'complete',diagnostics:[{code:'SYSTEM_FONT',stage:'capture',message:'SYSTEM_FONT'}]};
    },
  });
  return capture(source,options);
}
