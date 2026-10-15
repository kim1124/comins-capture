import {createSession,cardStyle} from './session.mjs';
export function mountExample(host,{ready,onSession=()=>{}}={}){
 const session=createSession();onSession(session);
 const target=document.createElement('div');target.style.cssText=cardStyle;target.textContent='Vanilla capture';
 const button=document.createElement('button');button.textContent='캡처';const status=document.createElement('p');status.setAttribute('role','status');const image=new Image();image.alt='Vanilla 출력';
 button.onclick=async()=>{button.disabled=true;try{const r=await session.run(target,ready);if(!session.closed){image.src=r.url;status.textContent=`완료 ${r.meta.width}×${r.meta.height}`;}}catch(e){if(!session.closed)status.textContent=e.code??'FAILED';}finally{button.disabled=false;}};
 host.replaceChildren(target,button,status,image);
 return ()=>{session.dispose();host.replaceChildren();};
}
