<script>
 import {tick,onDestroy} from 'svelte';
 import {createSession,cardStyle} from './session.mjs';
 let {ready,onSession=()=>{}}=$props();
 let target=$state(),result=$state(),status=$state('대기'),busy=$state(false);
 const session=createSession();onSession(session);onDestroy(()=>session.dispose());
 async function run(){busy=true;try{await tick();if(session.closed)return;const r=await session.run(target,ready);if(!session.closed){result=r;status=`완료 ${r.meta.width}×${r.meta.height}`;}}catch(e){if(!session.closed)status=e.code??'FAILED';}finally{if(!session.closed)busy=false;}}
</script>
<section><div bind:this={target} style={cardStyle}>Svelte capture</div><button onclick={run} disabled={busy}>캡처</button><p role="status">{status}</p>{#if result}<img src={result.url} alt="Svelte 출력"/>{/if}</section>
