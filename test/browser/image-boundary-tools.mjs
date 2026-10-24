import {createSvgRenderer} from '/dist/output/svg-renderer.js';
import {planLayout} from '/dist/geometry/layout.js';
const SVG='http://www.w3.org/2000/svg';
export function describeSvg(svg){
 const root=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement,object=root.querySelector('foreignObject');
 const chain=[];for(let node=object;node;node=node.parentElement)chain.push({tag:node.localName,transform:node.getAttribute('transform'),width:node.getAttribute('width'),height:node.getAttribute('height')});
 const wrapper=object&&[...object.children].find(node=>node.namespaceURI==='http://www.w3.org/1999/xhtml'&&node.localName==='div');
 return {chain,wrapperZoom:wrapper?.style?.zoom??'',imageCount:root.querySelectorAll('img').length};
}
export function serializeRaster(svg,scale=1){
 return createSvgRenderer(document).serialize({svg,sourceSize:{width:100,height:100}},planLayout({width:100,height:100},{size:{kind:'scale',value:scale}},'raster'));
}
// Reproduce the previous outer renderer while preserving all engine-owned scale/zoom pairs.
export function serializePrevious(svg,scale=1){
 const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),root=doc.documentElement;
 const node=(tag,attrs)=>{const element=doc.createElementNS(SVG,tag);for(const [key,value] of Object.entries(attrs))element.setAttribute(key,String(value));return element;};
 const size=100*scale,source=node('svg',{x:0,y:0,width:size,height:size,viewBox:`0 0 ${size} ${size}`,preserveAspectRatio:'none',style:'overflow:hidden'});
 const group=node('g',{transform:`matrix(${scale} 0 0 ${scale} 0 0)`});while(root.firstChild)group.append(root.firstChild);source.append(group);
 const clip=node('svg',{x:0,y:0,width:size,height:size,viewBox:`0 0 ${size} ${size}`,style:'overflow:hidden'});clip.append(source);root.append(clip);
 root.setAttribute('width',size);root.setAttribute('height',size);root.setAttribute('viewBox',`0 0 ${size} ${size}`);root.setAttribute('preserveAspectRatio','none');
 return new XMLSerializer().serializeToString(doc);
}
export async function saveBrowserEvidence(kind,report,files){
 const response=await fetch('/api/browser-evidence',{method:'POST',headers:{'Content-Type':'application/json','X-Resource-Check':'1'},body:JSON.stringify({kind,report,files})});
 if(!response.ok)throw Error('authored-evidence-save-failed');return response.json();
}
