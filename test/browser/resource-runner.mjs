export function waitForResourceFrame(frame,run,{window,origin,timeoutMs=45_000,setTimeout=globalThis.setTimeout,clearTimeout=globalThis.clearTimeout,onStage=()=>{}}){
 return new Promise((resolve,reject)=>{
  let lastStage='navigation-start';
  const stage=value=>{lastStage=value;onStage({stage:value});};
  const cleanup=()=>{window.removeEventListener('message',receive);frame.removeEventListener('load',loaded);frame.removeEventListener('error',failed);clearTimeout(timer);};
  const fail=code=>{cleanup();reject(Object.assign(new Error(code),{code,lastStage,fixtureAssertion:true}));};
  const loaded=()=>{if(lastStage==='navigation-start')stage('load');else onStage({stage:'load'});},failed=()=>fail('runner-navigation-error');
  const receive=event=>{
   if(event.source!==frame.contentWindow||event.origin!==origin||event.data?.run!==run)return;
   if(event.data.type==='resource-check-stage'&&typeof event.data.stage==='string')stage(event.data.stage);
   if(event.data.type==='resource-check-result'){stage('result-received');cleanup();resolve(event.data.report);}
  };
  const timer=setTimeout(()=>{
   const code=lastStage==='navigation-start'?'runner-navigation-timeout':lastStage==='load'?'runner-bootstrap-timeout':lastStage==='import-start'?'runner-import-timeout':'runner-case-timeout';
   fail(code);
  },timeoutMs);
  window.addEventListener('message',receive);
  frame.addEventListener('load',loaded);frame.addEventListener('error',failed);
 });
}
