import {capture} from '/dist/index.js';

const $=id=>document.getElementById(id);
const expect=(condition,message)=>{if(!condition){const error=new Error(message);error.fixtureAssertion=true;throw error;}};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const post=(path,value)=>fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Resource-Check':'1'},body:JSON.stringify(value)}).then(async response=>{expect(response.ok,'fixture API failed');return response.json();});
const cases=['same-origin','resolver-deny','deny','origin-denied','origin-allowed','cors-blocked',
 'cssom-cross-origin','missing','invalid-image','redirect','abort','csp-connect-blocked','svg-image-rejected','inline-svg-rejected','svg-isolation'];
const params=new URLSearchParams(location.search),runId=params.get('run');
const readRun=id=>fetch(`/api/runs/${id}`).then(response=>response.json());
const phase=(id,value)=>post(`/api/runs/${id}/phase`,{phase:value});
const assetRequests=(ledger,value)=>ledger.requests.filter(item=>item.phase===value&&item.path.startsWith('/assets/'));
const probeRequests=(ledger,value)=>ledger.requests.filter(item=>item.phase===value&&item.path.startsWith('/probe/'));
async function until(check,message){
 const deadline=performance.now()+5000;
 while(performance.now()<deadline){const value=await check();if(value)return value;await delay(30);}
 throw Object.assign(new Error(message),{fixtureAssertion:true});
}
async function imageBytes(){
 const canvas=document.createElement('canvas');canvas.width=40;canvas.height=20;
 const context=canvas.getContext('2d');context.fillStyle='#e32636';context.fillRect(0,0,40,20);
 context.fillStyle='#1b75bc';context.fillRect(20,0,20,20);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 return Array.from(new Uint8Array(await blob.arrayBuffer()));
}
async function loadSheet(href){
 const link=document.createElement('link');link.rel='stylesheet';link.href=href;
 const loaded=new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=()=>reject(Object.assign(new Error('stylesheet setup failed'),{fixtureAssertion:true}));});
 document.head.append(link);await loaded;return link;
}
async function decoded(src){const image=new Image();image.src=src;await image.decode();return image;}
async function assertRaster(snapshot,report){
 const result=await snapshot.toCanvas(),canvas=result.value;
 expect(canvas.width===240&&canvas.height===120,'raster geometry mismatch');
 const context=canvas.getContext('2d'),pixel=Array.from(context.getImageData(30,10,1,1).data);
 // All source variants use the same two-colour authored PNG at the top left.
 expect(pixel[2]>120&&pixel[0]<100&&pixel[3]===255,'embedded image pixel missing');
 report.raster={width:canvas.width,height:canvas.height,pixel};$('preview').replaceChildren(canvas);
 const png=(await snapshot.toBlob({format:'png'})).value;
 expect(png.type==='image/png'&&png.size>0,'PNG output missing');
 const url=URL.createObjectURL(png);
 try{const image=await decoded(url);expect(image.naturalWidth===240&&image.naturalHeight===120,'PNG geometry mismatch');}finally{URL.revokeObjectURL(url);}
}
async function inspectSvgDocument(run,svg,report){
 await post(`/api/runs/${run.id}/svg`,{svg});
 let active=0;const frames=[];
 const onMessage=event=>{
  if(frames.some(frame=>event.source===frame.contentWindow)&&event.data?.type==='resource-svg-active'&&event.data.run===run.id)active++;
 };
 window.addEventListener('message',onMessage);
 async function frame(url){
  const element=document.createElement('iframe');element.setAttribute('sandbox','allow-scripts');frames.push(element);
  const loaded=new Promise(resolve=>{element.onload=resolve;});element.src=url;$('frames').append(element);await loaded;return element;
 }
 try{
  await phase(run.id,'control');await frame(`/svg/${run.id}/control.svg`);
  await until(async()=>active>0&&probeRequests(await readRun(run.id),'control').length>0,'SVG active-document control sensor failed');
  report.activeControl={executions:active,requests:probeRequests(await readRun(run.id),'control').length};
  for(const item of frames)item.remove();frames.length=0;active=0;
  await phase(run.id,'isolation');await frame(`/svg/${run.id}/safe.svg`);
  const image=await decoded(`/svg/${run.id}/safe.svg`);$('preview').append(image);
  expect(image.naturalWidth===240&&image.naturalHeight===120,'SVG img dimensions mismatch');
  await delay(400);const isolated=await readRun(run.id);
  expect(active===0,'generated SVG executed active content');
  expect(probeRequests(isolated,'isolation').length===0&&assetRequests(isolated,'isolation').length===0,'generated SVG fetched external resources');
  report.svgIsolation={document:true,img:true,executions:active,externalRequests:0,cspOnSvgDocument:false,sandbox:'allow-scripts'};
 }finally{window.removeEventListener('message',onMessage);for(const item of frames)item.remove();}
}
async function execute(run){
 const report={case:run.kind,status:'failed',userAgent:navigator.userAgent,scope:'authored-loopback-public-api'};
 const root=$('fixture'),withFont=['same-origin','resolver-deny','svg-isolation'].includes(run.kind);
 const cross=['origin-denied','origin-allowed','cors-blocked','csp-connect-blocked'].includes(run.kind);
 const resourceOrigin=cross?run.assetOrigin:run.origin;
 const imageUrl=`${resourceOrigin}/assets/${run.id}/${run.kind==='svg-image-rejected'?'asset.svg':'image.png'}`;
 const cspEvents=[];
 const onCsp=event=>{if(event.effectiveDirective==='connect-src')cspEvents.push({directive:event.effectiveDirective,disposition:event.disposition});};
 document.addEventListener('securitypolicyviolation',onCsp);
 let snapshot,sheet,abortController;const localAssets=new Map();
 try{
  root.replaceChildren();root.style.backgroundImage='none';
  if(run.kind==='inline-svg-rejected')root.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20"/></svg>';
  else{
   const image=await decoded(imageUrl);root.append(image);
   if(withFont){
    sheet=await loadSheet(`${run.origin}/assets/${run.id}/style.css`);
    // Remove the initial inline reset so the authored external sheet takes effect.
    root.style.removeProperty('background-image');
    const text=document.createElement('p');text.textContent='Resource fixture';root.append(text);
    await document.fonts.load('16px "Comins Resource Fixture"');await document.fonts.ready;
    report.sourceWebfontLoaded=document.fonts.check('16px "Comins Resource Fixture"');
    expect(report.sourceWebfontLoaded,'webfont setup failed');
   }
   if(run.kind==='cssom-cross-origin'){
    sheet=await loadSheet(`${run.assetOrigin}/assets/${run.id}/style.css`);
    const text=document.createElement('p');text.textContent='Cross-origin CSSOM boundary';root.append(text);
    await document.fonts.ready;
   }
   if(run.kind==='svg-isolation'){
    // Parser-inserted innerHTML scripts stay inert in the source fixture. The
    // separate SVG control below proves execution detection independently.
    root.insertAdjacentHTML('beforeend',`<script>parent.postMessage({type:'resource-svg-active',run:'${run.id}'},'*')</script>`);
    const link=document.createElement('a');link.textContent='Static label';link.href=`javascript:fetch('${run.assetOrigin}/probe/${run.id}/source-link')`;
    link.setAttribute('onclick',`fetch('${run.assetOrigin}/probe/${run.id}/source-event')`);root.append(link);
    image.setAttribute('onload',`fetch('${run.assetOrigin}/probe/${run.id}/source-load')`);
   }
   if(run.kind==='resolver-deny'){
    for(const name of ['image.png','background.png','font.ttf']){
     const url=`${run.origin}/assets/${run.id}/${name}`;localAssets.set(url,await (await fetch(url)).blob());
    }
   }
  }
  await delay(80);const setupLedger=await readRun(run.id);report.setupRequests=setupLedger.requests.length;
  if(run.kind!=='inline-svg-rejected')expect(report.setupRequests>0,'HTTP setup sensor did not observe source image');
  if(run.kind==='svg-image-rejected'){
   expect(probeRequests(setupLedger,'setup').length===0,'SVG source image unexpectedly activated external content');
   report.sourceSvgImageBoundary='native-image-inactive';
  }
  const before=root.outerHTML;await phase(run.id,'capture');
  const options={timeoutMs:10_000,resources:{network:'same-origin'}};
  if(run.kind==='deny')options.resources={network:'deny'};
  if(run.kind==='resolver-deny'){
   report.resolvedKinds=[];
   options.resources={network:'deny',resolve:async request=>{report.resolvedKinds.push(request.kind);return localAssets.get(request.url);}};
  }
  if(['origin-allowed','cors-blocked','csp-connect-blocked'].includes(run.kind))options.resources={network:{origins:[run.assetOrigin]}};
  const expected={deny:'NETWORK_DISABLED','origin-denied':'NETWORK_DISABLED','cors-blocked':'RESOURCE_FAILED',
   'cssom-cross-origin':'RESOURCE_UNVERIFIABLE',missing:'RESOURCE_FAILED','invalid-image':'RESOURCE_UNVERIFIABLE',
   redirect:'RESOURCE_FAILED',abort:'ABORTED','csp-connect-blocked':'RESOURCE_FAILED','svg-image-rejected':'RESOURCE_UNVERIFIABLE','inline-svg-rejected':'UNSUPPORTED_CONTENT'}[run.kind];
  let result;
  if(run.kind==='abort'){
   abortController=new AbortController();options.signal=abortController.signal;
   // Install the rejection handler before polling, including fixture failures.
   result=capture(root,options).then(value=>({value}),error=>({error}));
   await until(async()=>assetRequests(await readRun(run.id),'capture').length===1,'slow fetch did not reach server');abortController.abort();
  }else result=capture(root,options).then(value=>({value}),error=>({error}));
  const outcome=await result;
  if(outcome.error){report.code=outcome.error.code;report.stage=outcome.error.stage;expect(expected===report.code,'unexpected capture rejection');}
  else{snapshot=outcome.value;expect(!expected,'capture unexpectedly accepted unsupported input');}
  expect(root.outerHTML===before,'capture modified original source');report.sourceUnchanged=true;
  if(snapshot){
   const svg=(await snapshot.toSvg()).value;
   expect(!svg.includes('/assets/')&&!svg.includes('/probe/'),'SVG retained network references');
   expect(!/<script\b|\son[a-z]+\s*=|javascript:/i.test(svg),'SVG retained active source content');
   expect(svg.includes('data:image/png;base64,'),'SVG did not embed raster image');
   if(withFont)expect(svg.includes('@font-face')&&svg.includes('data:font/ttf;base64,'),'SVG did not embed webfont');
   report.embedded={image:true,cssImage:withFont,font:withFont};await assertRaster(snapshot,report);
   if(run.kind==='svg-isolation')await inspectSvgDocument(run,svg,report);
  }
  if(run.kind==='abort'){
   await until(async()=>assetRequests(await readRun(run.id),'capture').some(item=>item.closed),'aborted HTTP body did not close');
   await phase(run.id,'recovery');await delay(60);
   snapshot=await capture(root,{resources:{network:'same-origin'}});await assertRaster(snapshot,report);report.recovery=true;
  }
  await delay(120);const ledger=await readRun(run.id),requests=assetRequests(ledger,'capture');
  const expectedCount=['deny','origin-denied','resolver-deny','cssom-cross-origin','csp-connect-blocked','inline-svg-rejected'].includes(run.kind)?0:withFont?3:1;
  expect(requests.length===expectedCount,'capture HTTP request count mismatch');
  expect(probeRequests(ledger,'capture').length===0,'capture reached a probe or redirect destination');
  report.captureRequests=requests.length;report.expectedCaptureRequests=expectedCount;report.captureProbeRequests=0;
  if(run.kind==='resolver-deny')expect(report.resolvedKinds.filter(value=>value==='font').length===1&&report.resolvedKinds.filter(value=>value==='image').length===2,'resolver manifest mismatch');
  if(run.kind==='csp-connect-blocked'){
   expect(cspEvents.length>0,'CSP sensor did not observe blocked connect');report.boundary='environment-csp-block';report.cspEvents=cspEvents;
  }else if(run.kind==='cors-blocked')report.boundary='environment-cors-block';
  else if(run.kind==='cssom-cross-origin')report.boundary='cssom-unverifiable';
  else if(['deny','origin-denied','resolver-deny'].includes(run.kind))report.boundary='product-network-policy';
  else report.boundary='product-resource-or-svg';
  report.status='pass';
 }catch(error){
  report.error=error.fixtureAssertion?error.message:error.code??'UNCLASSIFIED_FIXTURE_FAILURE';
  if(error.stage)report.stage=error.stage;
 }finally{abortController?.abort();snapshot?.dispose();sheet?.remove();document.removeEventListener('securitypolicyviolation',onCsp);}
 await post(`/api/runs/${run.id}/save`,{report});return {...report,id:run.id};
}
if(runId){
 $('run').hidden=true;$('runner-note').textContent='개별 검사 실행 중';
 const report=await execute(await readRun(runId));$('results').textContent=JSON.stringify(report,null,2);
 parent.postMessage({type:'resource-check-result',run:runId,report},location.origin);
}else{
 $('run').onclick=async()=>{
  $('run').disabled=true;$('results').textContent='검사 시작';const results=[];
  try{
   const image=await imageBytes();
   for(const kind of cases){
    const run=await post('/api/runs',{kind,image});const frame=document.createElement('iframe');
    const result=new Promise((resolve,reject)=>{
     const cleanup=()=>{window.removeEventListener('message',receive);clearTimeout(timer);};
     const receive=event=>{if(event.source===frame.contentWindow&&event.origin===location.origin&&event.data?.type==='resource-check-result'&&event.data.run===run.id){cleanup();resolve(event.data.report);}};
     const timer=setTimeout(()=>{cleanup();reject(Object.assign(new Error('runner result timeout'),{fixtureAssertion:true}));},45_000);
     window.addEventListener('message',receive);
    });
    frame.src=`/runner?run=${run.id}`;$('frames').replaceChildren(frame);
    try{results.push(await result);}finally{frame.remove();}
    const passed=results.filter(item=>item.status==='pass').length;
    $('results').textContent=`${passed}/${results.length} PASS; 전체 ${cases.length} 사례\n증거: output/research/resource-acceptance/${run.batchId}\n`+results.map(item=>`${item.case}: ${item.status.toUpperCase()} | capture HTTP ${item.captureRequests??'?'} | ${item.boundary??''}${item.code?` | ${item.code}`:''}${item.error?` | ${item.error}`:''}`).join('\n');
   }
   document.body.dataset.resourceCheck=results.every(item=>item.status==='pass')?'pass':'failed';
   $('results').textContent+=`\n최종: ${document.body.dataset.resourceCheck.toUpperCase()}`;
  }catch(error){$('results').textContent+=`\n검사 중단: ${error.fixtureAssertion?error.message:'UNCLASSIFIED_FIXTURE_FAILURE'}`;document.body.dataset.resourceCheck='failed';}
  finally{$('run').disabled=false;}
 };
}
