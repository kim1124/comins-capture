import {useEffect,useRef,useState} from 'react';
import {createSession} from './session.mjs';
const noop=()=>{};
export function CaptureExample({ready,onSession=noop}){
 const target=useRef(null),owner=useRef(null);const [result,setResult]=useState(null),[status,setStatus]=useState('대기'),[busy,setBusy]=useState(false);
 // A new owner per effect setup remains valid through StrictMode setup/cleanup/setup.
 useEffect(()=>{const session=createSession();owner.current=session;onSession(session);return ()=>session.dispose();},[onSession]);
 async function run(){const session=owner.current;setBusy(true);try{const r=await session.run(target.current,ready);if(!session.closed){setResult(r);setStatus(`완료 ${r.meta.width}×${r.meta.height}`);}}catch(e){if(!session.closed)setStatus(e.code??'FAILED');}finally{if(!session.closed)setBusy(false);}}
 return <section><div ref={target} style={{width:240,height:120,background:'rgb(20, 80, 160)',color:'white',padding:16,boxSizing:'border-box',font:'16px Arial'}}>React capture</div><button onClick={run} disabled={busy}>캡처</button><p role="status">{status}</p>{result&&<img src={result.url} alt="React 출력"/>}</section>;
}
