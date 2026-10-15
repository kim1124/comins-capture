import {capture, CaptureError, type CaptureSnapshot, type CaptureOptions, type ResourceOptions} from 'comins-capture';
declare const snapshot:CaptureSnapshot;
const options:CaptureOptions={resources:{network:'deny'}};
const resources:ResourceOptions={resolve:async()=>undefined};
void resources;void CaptureError;capture(document.createElement('div'),options);
// @ts-expect-error Unimplemented partial fallback is not a public option.
capture(document.createElement('div'),{failure:'allow-partial'});
// @ts-expect-error viewport targets are not implemented.
capture({kind:'viewport',document});
snapshot.toCanvas({size:{kind:'scale',value:'device'}});
snapshot.toCanvas({size:{kind:'paper',name:'A4',ppi:300}});
snapshot.toSvg({size:{kind:'paper',name:'B4',system:'jis'}});
snapshot.toBlob({format:'jpeg',quality:.9,size:{kind:'pixels',width:100,height:200}});
// @ts-expect-error Crop is deferred beyond 0.0.1.
snapshot.toCanvas({crop:{x:0,y:0,width:50,height:50}});
// @ts-expect-error Tile output is deferred beyond 0.0.1.
snapshot.tiles({tile:{width:100,height:100}});
// @ts-expect-error Tile planning is not a 0.0.1 export.
import {planTiles} from 'comins-capture';
// @ts-expect-error Tile types are not 0.0.1 exports.
import type {CaptureTile,TileOptions} from 'comins-capture';
const status:'complete'=snapshot.meta.status;void status;
// @ts-expect-error Tile-only metadata is removed.
snapshot.meta.totalWidth;
// @ts-expect-error SVG has physical dimensions, not a raster PPI option.
snapshot.toBlob({format:'svg',size:{kind:'paper',name:'A4',ppi:300}});
// @ts-expect-error SVG does not accept raster pixel size.
snapshot.toSvg({size:{kind:'pixels',width:100,height:100}});
// @ts-expect-error PNG has no lossy quality parameter.
snapshot.toBlob({format:'png',quality:.8});
// @ts-expect-error The unused failure option is removed entirely.
capture(document.createElement('div'),{failure:'error'});

// @ts-expect-error Standalone SVG/CSS resource preparation is deferred.
const deferredResourceKind:import('comins-capture').ResourceKind='svg';
