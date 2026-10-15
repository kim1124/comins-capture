import {capture,CaptureError} from 'comins-capture';
const $=id=>document.getElementById(id);let previousUrl,controller,snapshot;
function clearPreview(){if(previousUrl)URL.revokeObjectURL(previousUrl);previousUrl=undefined;$('download').hidden=true;$('download').removeAttribute('href');$('output').replaceChildren();$('dimensions').textContent='아직 생성되지 않음';}
function outputOptions(){
 const format=$('format').value,choice=$('size').value,svg=format==='svg';
 const options={format,fit:$('fit').value,background:$('background').value==='transparent'?null:$('background').value};
 if(choice==='double')options.size=svg?{kind:'css',width:1280,height:840}:{kind:'scale',value:2};
 else if(choice==='device')options.size={kind:'scale',value:'device'};
 else if(choice==='custom')options.size={kind:svg?'css':'pixels',width:Number($('width').value),height:Number($('height').value)};
 else if(choice!=='source'){
  const margin=Number($('margin').value);options.size={kind:'paper',name:choice,system:$('standard').value.toLowerCase(),orientation:$('orientation').value,marginMm:{top:margin,right:margin,bottom:margin,left:margin}};
  if(!svg)options.size.ppi=Number($('ppi').value);
 }
 // JPEG uses its default opaque white unless an opaque background was selected.
 if(format==='jpeg'&&options.background===null)delete options.background;
 return options;
}
function sync(){
 const svg=$('format').value==='svg';$('size').querySelector('[value=device]').disabled=svg;
 if(svg&&$('size').value==='device')$('size').value='source';
 $('ppi').disabled=svg;const custom=$('size').value==='custom',paper=['A3','A4','A5','B3','B4','B5'].includes($('size').value);
 for(const id of ['width','height'])$(id).disabled=!custom;
 for(const id of ['standard','orientation','margin'])$(id).disabled=!paper;
 $('ppi').disabled=svg||!paper;
 $('code').textContent=`import { capture } from 'comins-capture';\n\nconst snapshot = await capture(target);\ntry {\n  const result = await snapshot.toBlob(${JSON.stringify(outputOptions(),null,2)});\n  // result.value: Blob, result.meta: 실제 크기·단위·진단\n} finally {\n  snapshot.dispose();\n}`;
}
for(const input of document.querySelectorAll('aside input,aside select'))input.addEventListener('input',sync);
$('capture').onclick=async()=>{
 if(controller)return;const active=new AbortController();controller=active;
 $('capture').disabled=$('reset').disabled=true;$('cancel').disabled=false;clearPreview();$('status').textContent='이미지를 준비하고 있습니다.';
 try{
  const options=outputOptions();snapshot=await capture($('target'),{signal:active.signal,ready:async()=>{await document.fonts.ready;}});
  const result=await snapshot.toBlob({...options,signal:active.signal});if(active.signal.aborted)return;
  const url=URL.createObjectURL(result.value);previousUrl=url;const image=new Image();image.alt='Comins Capture 출력 미리보기';image.src=url;await image.decode();if(active.signal.aborted)return;
  $('output').replaceChildren(image);$('dimensions').textContent=`${result.meta.width} × ${result.meta.height} ${result.meta.unit} · ${options.format.toUpperCase()}`;
  $('status').textContent=`생성 완료 · ${(result.value.size/1024).toFixed(1)} KB · ${result.meta.diagnostics.some(d=>d.code==='SYSTEM_FONT')?'시스템 폰트는 실행 환경에 따라 달라집니다.':'출력 준비 완료'}`;
  $('download').href=url;$('download').download=`comins-capture.${options.format==='jpeg'?'jpg':options.format}`;$('download').hidden=false;
 }catch(error){clearPreview();$('status').textContent=error instanceof CaptureError?`출력 실패 · ${error.code}`:'출력 미리보기를 생성하지 못했습니다.';}
 finally{snapshot?.dispose();snapshot=undefined;if(active.signal.aborted){clearPreview();$('status').textContent='작업을 취소했습니다.';}controller=undefined;$('capture').disabled=$('reset').disabled=false;$('cancel').disabled=true;}
};
$('cancel').onclick=()=>controller?.abort();
addEventListener('pagehide',()=>{controller?.abort();snapshot?.dispose();clearPreview();});
$('reset').onclick=()=>{
 clearPreview();for(const [id,value] of Object.entries({format:'png',size:'source',width:'800',height:'600',standard:'ISO',ppi:'300',orientation:'portrait',margin:'0',fit:'contain',background:'transparent'}))$(id).value=value;
 sync();$('output').textContent='이미지 만들기를 누르면 결과를 표시합니다.';$('status').textContent='초기화 완료 · 출력을 기다리고 있습니다.';
};
sync();
