import {defineComponent,h,ref,nextTick,onUnmounted} from 'vue';
import {createSession,cardStyle} from './session.mjs';
export const CaptureExample=defineComponent({
 props:{ready:Function,onSession:Function},
 setup(props){
  const target=ref(),result=ref(),status=ref('대기'),busy=ref(false),session=createSession();props.onSession?.(session);onUnmounted(()=>session.dispose());
  async function run(){busy.value=true;try{const r=await session.run(target.value,async context=>{await nextTick();await props.ready?.(context);});if(!session.closed){result.value=r;status.value=`완료 ${r.meta.width}×${r.meta.height}`;}}catch(e){if(!session.closed)status.value=e.code??'FAILED';}finally{if(!session.closed)busy.value=false;}}
  return ()=>h('section',[h('div',{ref:target,style:cardStyle},'Vue capture'),h('button',{onClick:run,disabled:busy.value},'캡처'),h('p',{role:'status'},status.value),result.value?h('img',{src:result.value.url,alt:'Vue 출력'}):null]);
 },
});
