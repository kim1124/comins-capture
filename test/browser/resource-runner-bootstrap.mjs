const run=new URLSearchParams(location.search).get('run');
const diagnostics=[];
function record(stage,details={}){
 if(!run)return;
 const event={stage,elapsedMs:Math.round(performance.now()),...details};
 if(diagnostics.length<80)diagnostics.push(event);
 parent.postMessage({type:'resource-check-stage',run,stage},location.origin);
 // Persist finite authored-fixture stage metadata even when the result never arrives.
 void fetch(`/api/runs/${run}/diagnostic`,{method:'POST',headers:{'Content-Type':'application/json','X-Resource-Check':'1'},body:JSON.stringify(event)}).catch(()=>{});
}
globalThis.resourceRunnerDiagnostic=record;
globalThis.resourceRunnerDiagnostics=diagnostics;
addEventListener('error',()=>record('window-error'));
addEventListener('unhandledrejection',()=>record('unhandled-rejection'));
document.addEventListener('securitypolicyviolation',event=>record('csp-violation',{directive:event.effectiveDirective}));
for(const level of ['error','warn']){
 const original=console[level].bind(console);
 console[level]=(...args)=>{record(`console-${level}`);original(...args);};
}
record('bootstrap-ready');
try{
 record('import-start');
 await import('/resource-acceptance.mjs');
 record('import-complete');
}catch{
 const error=diagnostics.some(event=>event.stage==='import-ready')?'runner-case-failed':'runner-import-failed';
 record(error==='runner-case-failed'?'case-failed':'import-failed');
 if(run){
  const report={status:'failed',error,diagnostics};
  await fetch(`/api/runs/${run}/save`,{method:'POST',headers:{'Content-Type':'application/json','X-Resource-Check':'1'},body:JSON.stringify({report})}).catch(()=>{});
  parent.postMessage({type:'resource-check-result',run,report},location.origin);
 }
 document.getElementById('results').textContent=error;
 document.body.dataset.resourceCheck='failed';
}
