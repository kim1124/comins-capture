import {captureDom} from '/dist/core/dom.js';
const $=id=>document.getElementById(id),expect=(c,m)=>{if(!c)throw Error(m);};
async function post(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Workbench':'1'},body:JSON.stringify(body)});if(!r.ok)throw Error('record failed');return r.json();}
async function decode(blob){const url=URL.createObjectURL(blob);try{const img=new Image();img.src=blob.type==='image/svg+xml'?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(await blob.text()):url;await img.decode();return img;}finally{URL.revokeObjectURL(url);}}
const pixel=(c,x,y)=>[...c.getContext('2d').getImageData(x,y,1,1).data];
function equalPixels(a,b){const x=a.getContext('2d').getImageData(0,0,a.width,a.height).data,y=b.getContext('2d').getImageData(0,0,b.width,b.height).data;let diff=0;for(let i=0;i<x.length;i++)if(x[i]!==y[i])diff++;return diff;}
const cases=[
 ['default',{},320,200,[[10,10,[255,0,0,255]],[310,10,[0,0,255,255]]]],
 ['scale2',{size:{kind:'scale',value:2}},640,400,[[620,20,[0,0,255,255]]]],
 ['contain',{size:{kind:'pixels',width:400,height:400},background:'#fff'},400,400,[[10,10,[255,255,255,255]],[390,85,[0,0,255,255]]]],
 ['cover-align',{size:{kind:'pixels',width:200,height:200},fit:'cover',align:{x:1,y:0}},200,200,[[10,10,[255,0,0,255]],[190,10,[0,0,255,255]]]],
 ['stretch',{size:{kind:'pixels',width:500,height:180},fit:'stretch'},500,180,[[490,170,[255,255,0,255]]]],
 ['paper-a4',{size:{kind:'paper',name:'A4',marginMm:{top:10,right:10,bottom:10,left:10}},background:'#fff'},2480,3508,[[0,0,[255,255,255,255]],[2000,1200,[0,0,255,255]]]],
 ['paper-jis',{size:{kind:'paper',name:'B4',system:'jis',orientation:'landscape',ppi:72},background:'#fff'},1032,729,[[0,0,[255,255,255,255]],[1000,100,[0,0,255,255]]]],
];
async function run(){
 $('run').disabled=true;const results=[];let snapshot;
 try{
  snapshot=await captureDom($('fixture'));const frozen=(await snapshot.toSvg()).value;const source=$('fixture').outerHTML;
  const jobs=[...cases,['svg-paper'],['invalid']];
  for(const [name,options,w,h,samples] of jobs){
   const record=await post('/api/runs',{scenario:'engine-contract'});await post(`/api/runs/${record.id}/arm`,{});
   const report={revision:'output-layout-single-1',case:name,browser:$('browser').value,userAgent:navigator.userAgent,status:'failed'};let dataUrl;
   try{
    if(name==='invalid'){
     for(const fn of [()=>snapshot.toCanvas({crop:{x:319,y:0,width:2,height:10}}),()=>snapshot.toSvg({size:{kind:'paper',name:'A4',ppi:300}}),()=>snapshot.toBlob({format:'jpeg',background:null}),()=>snapshot.toCanvas({size:{kind:'pixels',width:20000,height:10000}})]){let code;try{await fn();}catch(e){code=e.code;}expect(['INVALID_OPTIONS','OUTPUT_LIMIT'].includes(code),'expected error missing');}
     report.negativeCount=4;
    }else if(name==='svg-paper'){
     const r=await snapshot.toSvg({size:{kind:'paper',name:'A4',marginMm:{top:10,right:10,bottom:10,left:10}},background:'#fff'}),svg=new DOMParser().parseFromString(r.value,'image/svg+xml').documentElement;
     expect(svg.getAttribute('width')==='210mm'&&svg.getAttribute('height')==='297mm'&&r.meta.unit==='mm','SVG paper units');expect(svg.getAttribute('viewBox')==='0 0 210 297','SVG viewBox');
     const blob=await snapshot.toBlob({format:'svg',size:{kind:'css',width:400,height:250},fit:'stretch'}),img=await decode(blob.value);expect(img.naturalWidth===400&&img.naturalHeight===250,'SVG CSS dimensions');
     const c=document.createElement('canvas');c.width=400;c.height=250;c.getContext('2d').drawImage(img,0,0);expect(JSON.stringify(pixel(c,390,10))==='[0,0,255,255]','SVG custom-size content');report.svg=r.value;report.width=210;report.height=297;report.unit='mm';dataUrl=c.toDataURL();
    }else{
     const r=await snapshot.toCanvas(options),c=r.value;dataUrl=c.toDataURL();expect(c.width===w&&c.height===h,'wrong dimensions');report.meta=r.meta;
     for(const [x,y,color] of samples)expect(JSON.stringify(pixel(c,x,y))===JSON.stringify(color),`wrong pixel ${x},${y}: ${pixel(c,x,y)}`);
     const png=await snapshot.toBlob({...options,format:'png'}),img=await decode(png.value),copy=document.createElement('canvas');copy.width=w;copy.height=h;copy.getContext('2d').drawImage(img,0,0);report.pngDifference=equalPixels(c,copy);expect(report.pngDifference===0,'PNG differs');
     $('preview').replaceChildren(c,copy);dataUrl=c.toDataURL();report.width=w;report.height=h;
    }
    expect((await snapshot.toSvg()).value===frozen&&$('fixture').outerHTML===source,'snapshot or DOM changed');report.status='pass';
   }catch(e){report.error=e.code??e.message;}
   const ledger=await fetch(`/api/runs/${record.id}`).then(r=>r.json());report.captureRequests=ledger.requests.filter(r=>r.phase==='capture').length;if(report.captureRequests)report.status='failed';
   await post(`/api/runs/${record.id}/save`,{report,dataUrl:dataUrl??null});results.push({id:record.id,...report});$('results').textContent=results.map(r=>`${r.case}: ${r.status.toUpperCase()}${r.width?` ${r.width}×${r.height} ${r.unit??'px'}`:''}${r.pngDifference===undefined?'':` | PNG diff ${r.pngDifference}`}${r.error?` | ${r.error}`:''}`).join('\n');
  }
 }catch(e){$('results').textContent=e.code??e.message;}finally{snapshot?.dispose();$('run').disabled=false;}
}
$('run').onclick=run;
