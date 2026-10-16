import {fontData} from '/font-fixture.mjs';
const $=id=>document.getElementById(id);
async function post(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Workbench':'1'},body:JSON.stringify(body)});if(!r.ok)throw Error('record failed');return r.json();}
const expect=(condition,name)=>{if(!condition)throw Error(name);};
async function decode(blob){const url=URL.createObjectURL(blob);try{const img=new Image();img.src=url;await img.decode();return img;}finally{URL.revokeObjectURL(url);}}
const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
function difference(a,b){let count=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])count++;return count;}
$('run').onclick=async()=>{
 $('run').disabled=true;const results=[];
 try{
  const {captureDom}=await import('/dist/core/dom.js');
  const root=$('fixture');
  for(const kind of ['text','resources','fractional','font','invalid-font','deny','invalid-image','unsupported','invalid-target','svg-negative']){
   const record=await post('/api/runs',{scenario:'engine-contract'}),url=new URL(`/asset/${record.id}/image`,location.href).href;
   const report={revision:'dom-integration-single-1',case:kind,browser:$('browser').value,userAgent:navigator.userAgent,status:'failed'};let snapshot,fontStyle,dataUrl,memory;
   try{
    root.className='';root.removeAttribute('style');root.innerHTML='<div style="display:flex;gap:8px"><p>Hello Comins</p><strong>DOM</strong></div><table><tbody><tr><td>One</td><td>Two</td></tr></tbody></table>';

    if(['resources','deny','invalid-image'].includes(kind)){
     root.className='image-case';root.style.setProperty('--asset',`url("${url}")`);const img=document.createElement('img');img.src=url;root.append(img);await img.decode();
     const canvas=document.createElement('canvas');canvas.width=240;canvas.height=96;canvas.getContext('2d').drawImage(img,0,0);memory=await new Promise(r=>canvas.toBlob(r));
     if(kind==='invalid-image')memory=new Blob(['invalid image'],{type:'image/png'});
    }
    if(kind==='fractional')root.style.height='71.375px';
    if(kind==='font'||kind==='invalid-font'){
     fontStyle=document.createElement('style');fontStyle.textContent=`@font-face{font-family:"Comins Fixture";src:url("${fontData}")${kind==='invalid-font'?',url("data:font/ttf;base64,QkFE")':''}} #fixture{font-family:"Comins Fixture",monospace}`;document.head.append(fontStyle);
     await document.fonts.load('15px "Comins Fixture"');memory=await (await fetch(fontData)).blob();
    }
    if(kind==='unsupported')root.innerHTML='<video></video>';
    const before=root.outerHTML;await post(`/api/runs/${record.id}/arm`,{});
    if(kind==='svg-negative'){
     const {verifySvg}=await import('/dist/output/verify-svg.js');
     const shell=content=>`<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1">${content}</svg>`;
     const samples=['<script>void 0</script>','<foreignObject><div xmlns="http://www.w3.org/1999/xhtml" onclick="void 0"/></foreignObject>','<style>g{fill:url(https://unknown.invalid/a)}</style>','<style>@import "https://unknown.invalid/a";</style>','<g xml:base="https://unknown.invalid/"/>'];
     for(const s of samples){let rejected=false;try{verifySvg(shell(s),document,new Map(),new Set(),[]);}catch{rejected=true;}expect(rejected,'unsafe SVG accepted');}
     for(const font of ['@import "https://unknown.invalid/font";', '@font-face{font-family:Test;src:url("https://unknown.invalid/font")}']){
      let rejected=false;try{verifySvg(shell(''),document,new Map(),new Set(),[font]);}catch{rejected=true;}expect(rejected,'unsafe font rule accepted');
     }
     let rejected=false;try{verifySvg(shell(''),document,new Map(),new Set(),[],{width:2,height:1});}catch{rejected=true;}expect(rejected,'dimension mismatch accepted');
     const base=document.createElement('base');base.href='https://base.invalid/';document.head.prepend(base);
     const {inspectDom}=await import('/dist/dom/inspect.js');const {createOperation}=await import('/dist/lifecycle/operation.js');const op=createOperation('prepare',{});let inspected;
     try{inspected=await inspectDom(root,op);expect(inspected.documentUrl===document.URL,'base URL changed network origin');}finally{inspected?.dispose();op.close();base.remove();}
     report.negativeCount=samples.length+4;
    }else {
     const expected={deny:'NETWORK_DISABLED',unsupported:'UNSUPPORTED_CONTENT','invalid-image':'RESOURCE_UNVERIFIABLE','invalid-target':'INVALID_TARGET','invalid-font':'RESOURCE_UNVERIFIABLE'}[kind];
     try{snapshot=await captureDom(kind==='invalid-target'?null:root,{resources:{resolve:memory&&kind!=='deny'?async request=>request.url==='data:font/ttf;base64,QkFE'?new Blob(['BAD'],{type:'font/ttf'}):memory:undefined}});}catch(e){report.code=e.code;if(!expected)throw e;}
     if(expected)expect(!snapshot&&expected===report.code,'expected rejection');
     else{
      expect(!!snapshot,'missing snapshot');const svg=(await snapshot.toSvg()).value;expect(!svg.includes(url),'remote SVG URL');expect(svg.includes('Hello Comins'),'missing text');
      if(kind==='font')expect(svg.includes('@font-face')&&svg.includes(fontData),'font not embedded');
      const canvas=(await snapshot.toCanvas()).value;expect(canvas.width===320&&canvas.height>0,'raster size');$('preview').replaceChildren(canvas);report.width=canvas.width;report.height=canvas.height;dataUrl=canvas.toDataURL();
      const original=pixels(canvas);expect(original.some((n,i)=>i%4===3&&n>0),'blank raster');
      const output=[];for(const format of ['svg','png','jpeg','webp']){
       const native=await new Promise(resolve=>canvas.toBlob(resolve,`image/${format}`));if(format==='webp'&&native?.type!=='image/webp'){let rejected=false;try{await snapshot.toBlob({format});}catch(e){rejected=e.code==='FORMAT_UNSUPPORTED';}expect(rejected,'unsupported encoder not rejected');report.webp='unsupported-native';continue;}const r=await snapshot.toBlob({format});expect(r.value.type===({svg:'image/svg+xml',png:'image/png',jpeg:'image/jpeg',webp:'image/webp'})[format],'MIME mismatch');
       if(format==='svg')expect(await r.value.text()===svg,'different SVG blob');
       else {const img=await decode(r.value);expect(img.naturalWidth===canvas.width&&img.naturalHeight===canvas.height,'encoded dimensions');if(format==='png'){const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(img,0,0);report.pngDifference=difference(original,pixels(copy));expect(report.pngDifference===0,'PNG differs from Canvas');}}
       output.push(format);
      }report.formats=output;
      expect(root.outerHTML===before,'source was modified');report.sourceUnchanged=true;
      root.firstElementChild.textContent='changed after snapshot';expect((await snapshot.toSvg()).value===svg,'snapshot changed');report.frozen=true;
      report.svg=svg;dataUrl=canvas.toDataURL();
     }
    }
    report.status='pass';
   }catch(e){report.error=e.code??e.message;report.stage=e.stage;}finally{snapshot?.dispose();fontStyle?.remove();}
   await new Promise(r=>setTimeout(r,250));const ledger=await fetch(`/api/runs/${record.id}`).then(r=>r.json());report.captureRequests=ledger.requests.filter(r=>r.phase==='capture').length;
   if(report.captureRequests!==0)report.status='failed';await post(`/api/runs/${record.id}/save`,{report,dataUrl:dataUrl??null});results.push({id:record.id,...report,svg:report.svg?'saved':undefined});
   $('results').textContent=results.map(r=>`${r.case}: ${r.status.toUpperCase()} | requests ${r.captureRequests}${r.pngDifference===undefined?'':` | PNG diff ${r.pngDifference}`}${r.webp?' | WebP unsupported':''}${r.error?` | ${r.error}`:''}`).join('\n');
  }
 }catch(e){$('results').textContent=String(e.message);}finally{$('run').disabled=false;}
};
