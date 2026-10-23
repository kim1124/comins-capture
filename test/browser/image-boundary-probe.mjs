import {capture} from '/dist/index.js';
import {describeSvg,serializeRaster,serializePrevious,saveBrowserEvidence} from '/image-boundary-tools.mjs';
const colors=[[224,40,60],[30,160,80],[40,70,220],[230,180,30]];
const points=[[.25,.25],[.75,.25],[.25,.75],[.75,.75]];
const sample=canvas=>points.map(([x,y])=>[...canvas.getContext('2d').getImageData(Math.floor(canvas.width*x),Math.floor(canvas.height*y),1,1).data]);
const matches=pixels=>pixels.every((pixel,index)=>pixel[3]===255&&pixel.slice(0,3).every((value,channel)=>Math.abs(value-colors[index][channel])<=12));
const draw=(image,size,explicit=true)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const context=canvas.getContext('2d');if(explicit)context.drawImage(image,0,0,size,size);else context.drawImage(image,0,0);return canvas;};
async function compareDecode(svg,size,sync,unique){
 const image=new Image();if(sync)image.decoding='sync';
 // Distinct inert comments avoid sharing a decoded SVG cache entry across modes.
 image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(unique?svg.replace('</svg>',`<!-- authored-probe-${crypto.randomUUID()} --></svg>`):svg);await image.decode();
 const output=[];
 const render=timing=>{for(const [method,explicit] of [['three',false],['five',true],['three-again',false]])output.push({timing:`${timing}-${method}`,canvas:draw(image,size,explicit)});};
 render('immediate');await new Promise(resolve=>setTimeout(resolve,250));render('delayed');return output;
}
document.getElementById('run').onclick=async()=>{
 document.getElementById('run').disabled=true;
 const report={kind:'image-boundary-diagnosis',scope:'authored-loopback-only',userAgent:navigator.userAgent,dpr:devicePixelRatio,diagnosticDelayMs:250,results:[]};
 try{
  const source=document.createElement('canvas');source.width=source.height=1000;
  const context=source.getContext('2d'),pixels=context.createImageData(1000,1000);let seed=7;
  for(let i=0;i<pixels.data.length;i+=4){for(let c=0;c<3;c++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;pixels.data[i+c]=seed>>>24;}pixels.data[i+3]=255;}context.putImageData(pixels,0,0);
  points.forEach(([x,y],index)=>{context.fillStyle=`rgb(${colors[index].join(',')})`;context.fillRect(x*1000-100,y*1000-100,200,200);});
  for(const mime of ['image/png','image/jpeg']){
   const blob=await new Promise(resolve=>source.toBlob(resolve,mime,.8)),url=URL.createObjectURL(blob),reference=new Image();reference.src=url;await reference.decode();
   try{
    const direct=draw(reference,100),referencePixels=sample(direct);direct.width=direct.height=0;
    for(const rootKind of ['root-img','div-img']){
     const image=new Image();image.src=url;image.style.cssText='display:block;width:100px;height:100px';await image.decode();
     const target=rootKind==='root-img'?image:document.createElement('div');if(target!==image)target.append(image);target.style.cssText='display:block;width:100px;height:100px';document.getElementById('fixtures').append(target);
     let snapshot;const row={mime,rootKind,referencePixels,referenceMatch:matches(referencePixels),outputs:[]},files={};
     try{
      snapshot=await capture(target,{resources:{network:'deny',resolve:()=>blob}});const raw=(await snapshot.toSvg()).value;files['raw.svg']=raw;row.structure=describeSvg(raw);
      for(const scale of [1,2]){
       const actual=(await snapshot.toCanvas({size:{kind:'scale',value:scale}})).value;
       const actualPixels=sample(actual);row.outputs.push({name:`public-${scale}`,pixels:actualPixels,matchesReference:matches(actualPixels)});files[`public-${scale}.png`]=actual.toDataURL();actual.width=actual.height=0;
       for(const [mode,svg] of [['raw',raw],['current',serializeRaster(raw,scale)],['previous',serializePrevious(raw,scale)]]){
        if(mode==='raw'&&scale===2)continue;
        files[`${mode}-${scale}.svg`]=svg;
        for(const sync of mode==='current'?[false,true]:[false])for(const unique of mode==='current'?[true,false]:[true]){
         const output=await compareDecode(svg,100*scale,sync,unique);
         for(const {timing,canvas} of output){
          const name=`${mode}-${scale}${sync?'-sync':''}${unique?'':'-plain'}-${timing}`,pixels=sample(canvas);
          row.outputs.push({name,pixels,matchesReference:matches(pixels)});files[`${name}.png`]=canvas.toDataURL();canvas.width=canvas.height=0;
         }
        }
       }
      }
     }catch(error){row.error=error.code??error.message;}
     finally{snapshot?.dispose();target.remove();}
     if(new URLSearchParams(location.search).get('save')==='1')try{row.evidence=await saveBrowserEvidence('image-boundary',row,files);}catch(error){row.evidenceError=error.message;}
     report.results.push(row);document.getElementById('results').textContent=JSON.stringify(report,null,2);
    }
   }finally{URL.revokeObjectURL(url);}
  }
  source.width=source.height=0;
 }catch(error){report.error=error.code??error.message;}
 globalThis.imageBoundaryProbeResults=report;document.getElementById('results').textContent=JSON.stringify(report,null,2);document.body.dataset.imageProbe='complete';document.getElementById('run').disabled=false;
};
