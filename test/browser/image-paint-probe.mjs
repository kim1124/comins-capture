import {capture} from '/dist/index.js';
import {describeSvg,serializeRaster,saveBrowserEvidence} from '/image-boundary-tools.mjs';
const nativeImage=globalThis.Image,points=[[25,25],[75,25],[25,75],[75,75]],colors=[[224,40,60],[30,160,80],[40,70,220],[230,180,30]];
const sample=canvas=>points.map(([x,y])=>[...canvas.getContext('2d').getImageData(x,y,1,1).data]);
const draw=image=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=100;canvas.getContext('2d').drawImage(image,0,0);return canvas;};
const hash=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(value=>value.toString(16).padStart(2,'0')).join('');
async function sourceBlob(order){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1000;
 const context=canvas.getContext('2d'),pixels=context.createImageData(1000,1000);let seed=7;
 for(let i=0;i<pixels.data.length;i+=4){for(let c=0;c<3;c++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;pixels.data[i+c]=seed>>>24;}pixels.data[i+3]=255;}context.putImageData(pixels,0,0);
 points.forEach(([x,y],index)=>{context.fillStyle=`rgb(${colors[index].join(',')})`;context.fillRect(x*10-100,y*10-100,200,200);});
 // A separate non-sampled corner prevents nested-image byte cache reuse between orders.
 const corner=crypto.getRandomValues(new Uint8Array(3));context.fillStyle=`rgb(${corner.join(',')})`;context.fillRect(0,0,100,100);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));canvas.width=canvas.height=0;return blob;
}
document.getElementById('run').onclick=async()=>{
 document.getElementById('run').disabled=true;
 const control=new URLSearchParams(location.search).get('control');
 const report={kind:'image-paint-diagnosis',userAgent:navigator.userAgent,scope:'authored-png-root-1x',control:control??'order',results:[]};
 try{
  const orders=control==='sync'?['public-first','sync-first']:control==='predecode'?['public-first','predecode-first']:control==='nested-sync'?['nested-auto-first','nested-sync-first']:['public-first','independent-first'];
  for(const order of orders){
   const blob=await sourceBlob(order),url=URL.createObjectURL(blob),target=new nativeImage();target.src=url;target.style.cssText='display:block;width:100px;height:100px';await target.decode();document.getElementById('fixtures').append(target);
   const row={order,outputs:[],readback:'synchronous-after-each-draw'},files={},retained=[],copies=[];let snapshot,actual;
   const record=(name,canvas,release=true)=>{
    const pixels=sample(canvas);row.outputs.push({name,pixels,matchesReference:pixels.every((pixel,index)=>pixel[3]===255&&pixel.slice(0,3).every((value,channel)=>Math.abs(value-colors[index][channel])<=12))});
    const copy=document.createElement('canvas');copy.width=copy.height=100;copy.getContext('2d').putImageData(canvas.getContext('2d').getImageData(0,0,100,100),0,0);copies.push({name,copy});
    if(release)canvas.width=canvas.height=0;
   };
   try{
    snapshot=await capture(target,{resources:{network:'deny',resolve:()=>blob}});const raw=(await snapshot.toSvg()).value,current=serializeRaster(raw);files['raw.svg']=raw;files['current-1.svg']=current;row.structure=describeSvg(raw);
    if(order==='independent-first'){
     const image=new nativeImage();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(current);await image.decode();record('before',draw(image));
    }
    if(order==='predecode-first'){
     const nested=[...new DOMParser().parseFromString(raw,'image/svg+xml').querySelectorAll('img')].map(image=>image.getAttribute('src'));
     row.nestedPredecode=[];
     for(const uri of nested){
      if(!uri?.startsWith('data:image/png;base64,'))throw Error('unexpected-authored-nested-image');
      const image=new nativeImage();image.src=uri;await image.decode();
      row.nestedPredecode.push({width:image.naturalWidth,height:image.naturalHeight,uriLength:uri.length});
     }
    }
    globalThis.Image=class extends nativeImage{
     constructor(...args){super(...args);if(order==='sync-first')this.decoding='sync';retained.push(this);}
     get src(){return super.src;}
     set src(value){
      const prefix='data:image/svg+xml;charset=utf-8,';
      if(control==='nested-sync'&&value.startsWith(prefix)){
       const parsed=new DOMParser().parseFromString(decodeURIComponent(value.slice(prefix.length)),'image/svg+xml'),images=[...parsed.querySelectorAll('img')];
       // Force both arms so the negative control remains valid after the product fix.
       const decoding=order==='nested-sync-first'?'sync':'auto';for(const image of images)image.setAttribute('decoding',decoding);
       value=prefix+encodeURIComponent(new XMLSerializer().serializeToString(parsed));
       this.probeNestedControl={images:images.length,decoding};
      }
      super.src=value;
     }
    };
    try{actual=(await snapshot.toCanvas()).value;}finally{globalThis.Image=nativeImage;}
    record('original',actual,false);
    const image=retained.find(value=>value.src.startsWith('data:image/svg+xml;charset=utf-8,'));
    if(!image)throw Error('public-renderer-image-not-retained');
    record('immediate',draw(image));await new Promise(resolve=>setTimeout(resolve,0));record('original-task',actual,false);record('task',draw(image));await new Promise(resolve=>setTimeout(resolve,250));record('original-delayed',actual,false);record('delayed',draw(image));
    const used=decodeURIComponent(image.src.slice('data:image/svg+xml;charset=utf-8,'.length));
    row.svg={publicLength:used.length,serializedLength:current.length,equal:used===current,publicHash:await hash(used),serializedHash:await hash(current)};
    if(image.probeNestedControl)row.nestedControl=image.probeNestedControl;
    files['public-1.svg']=used;row.retainedImages=retained.length;
   }catch(error){row.error=error.code??error.message;}
   finally{globalThis.Image=nativeImage;if(actual)actual.width=actual.height=0;snapshot?.dispose();target.remove();URL.revokeObjectURL(url);}
   for(const {name,copy} of copies){files[`public-${name}.png`]=copy.toDataURL();copy.width=copy.height=0;}
   if(new URLSearchParams(location.search).get('save')==='1')try{row.evidence=await saveBrowserEvidence('image-boundary',row,files);}catch(error){row.evidenceError=error.message;}
   report.results.push(row);
  }
 }catch(error){report.error=error.code??error.message;}
 globalThis.imagePaintProbeResults=report;document.getElementById('results').textContent=JSON.stringify(report,null,2);document.body.dataset.imagePaintProbe='complete';document.getElementById('run').disabled=false;
};
