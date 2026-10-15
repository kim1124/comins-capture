import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync as reactFlush} from 'react-dom';
import {createApp} from 'vue';
import {mount,unmount} from 'svelte';
import {CaptureError} from 'comins-capture';
import {mountExample} from './examples/vanilla.mjs';
import {CaptureExample as ReactExample} from './examples/react.jsx';
import {CaptureExample as VueExample} from './examples/vue.mjs';
import SvelteExample from './examples/SvelteCapture.svelte';
import {createElement} from 'react';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const $=id=>document.getElementById(id);
const frameworks={
 Vanilla:(host,props)=>mountExample(host,props),
 React:(host,props)=>{const root=createRoot(host);reactFlush(()=>root.render(createElement(StrictMode,null,createElement(ReactExample,props))));return ()=>root.unmount();},
 Vue:(host,props)=>{const app=createApp(VueExample,props);app.mount(host);return ()=>app.unmount();},
 Svelte:(host,props)=>{const app=mount(SvelteExample,{target:host,props});return ()=>unmount(app);},
};
function completed(host){return new Promise((resolve,reject)=>{
 const check=()=>{const s=host.querySelector('[role=status]')?.textContent??'';if(s.startsWith('완료')){done();resolve();}else if(/^[A-Z_]+$/.test(s)){done();reject(Error(s));}};
 const observer=new MutationObserver(check),timer=setTimeout(()=>{done();reject(Error('UI completion timeout'));},15000);const done=()=>{clearTimeout(timer);observer.disconnect();};observer.observe(host,{subtree:true,childList:true,characterData:true});check();
});}
$('run').onclick=async()=>{
 $('run').disabled=true;const reports=[];
 for(const [framework,attach] of Object.entries(frameworks)){
  const report={framework,status:'failed'};const host=$('host');let destroy,release;
  try{
   const sessions=[];destroy=attach(host,{onSession:s=>sessions.push(s)});
   const completion=completed(host);host.querySelector('button').click();await completion;
   const session=sessions.at(-1),snapshot=session.snapshot;assert(snapshot,'snapshot missing');
   if(framework==='React')assert(sessions.length===2&&sessions[0].closed,'StrictMode cleanup did not run');
   const img=host.querySelector('img');await img.decode();assert(img.naturalWidth===240&&img.naturalHeight===120,'preview dimensions');
   const raster=await snapshot.toCanvas({size:{kind:'pixels',width:480,height:240},fit:'stretch'});
   assert(raster.value.width===480&&raster.value.height===240,'public custom-size output');
   assert([...raster.value.getContext('2d').getImageData(400,200,1,1).data].join(',')==='20,80,160,255','raster pixel');
   const svg=await snapshot.toSvg({size:{kind:'paper',name:'A5'}});assert(svg.meta.unit==='mm'&&svg.meta.width===148,'SVG public units');
   raster.value.width=raster.value.height=0;
   const oldUrl=img.src;await destroy();destroy=undefined;assert(session.closed&&host.childElementCount===0,'unmount cleanup');
   let code;try{await snapshot.toCanvas();}catch(e){assert(e instanceof CaptureError,'public error identity');code=e.code;}assert(code==='DISPOSED','snapshot not disposed');
   const revoked=await fetch(oldUrl).then(()=>false,()=>true);assert(revoked,'object URL not revoked');
   let entered;const waiting=new Promise(r=>entered=r),gate=new Promise(r=>release=r);let signal;let pendingSession;
   destroy=attach(host,{onSession:s=>pendingSession=s,ready:async context=>{signal=context.signal;entered();await gate;}});
   host.querySelector('button').click();await waiting;await destroy();destroy=undefined;assert(signal.aborted&&pendingSession.closed,'pending capture not cancelled');release();
   // Drain the cancelled ready callback before remounting; a BUSY result cannot count as success.
   await new Promise(resolve=>setTimeout(resolve,0));
   destroy=attach(host,{});const remounted=completed(host);host.querySelector('button').click();await remounted;await destroy();destroy=undefined;
   Object.assign(report,{status:'pass',preview:'240x120',customSize:'480x240',disposed:true,urlRevoked:true,cancelledOnUnmount:true,remount:true,strictMode:framework==='React'});
  }catch(e){report.error=e.code??e.message;}finally{release?.();await destroy?.();host.replaceChildren();}
  reports.push(report);$('results').textContent=reports.map(r=>`${r.framework}: ${r.status.toUpperCase()}${r.error?' | '+r.error:' | PNG · custom size · SVG · dispose · cancel · remount'}`).join('\n');
 }
 const record={browser:$('browser').value,userAgent:navigator.userAgent,reports};
 const response=await fetch('/results',{method:'POST',headers:{'Content-Type':'application/json','X-Consumer-Check':'1'},body:JSON.stringify(record)});assert(response.ok,'result persistence failed');$('run').disabled=false;
};
