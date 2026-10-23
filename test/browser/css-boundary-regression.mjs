import {capture} from '/dist/index.js';
import {collectScrollbarCss} from '/dist/engine/scrollbar-css.js';
const results=[],files={},expect=(value,message)=>{if(!value)throw Error(message);};
const cases=[
 {name:'clean',css:''},
 {name:'plain-css',css:'.else {background:var(--table-panel,red)}'},
 {name:'unrelated-var',css:'.else::-webkit-scrollbar-corner {background:var(--table-panel,red)}'},
 {name:'table-css-excerpt-with-hover',css:'.comins-table__scroll::-webkit-scrollbar-corner {background:var(--comins-table-bg,white)} .comins-table__scroll::-webkit-scrollbar {width:8px} .comins-table__body-viewport::-webkit-scrollbar-thumb:hover,.comins-table__horizontal-scrollbar::-webkit-scrollbar-thumb:hover {background:var(--comins-table-accent-strong)}'},
 {name:'empty-rule',css:'.else::-webkit-scrollbar-corner {}'},
 {name:'related-literal',css:'.target::-webkit-scrollbar-corner {background:rgb(11,22,33)}',retain:'rgb(11, 22, 33)'},
 {name:'ancestor-literal',css:'.external .target::-webkit-scrollbar-corner {background:rgb(11,22,33)}',retain:'.external .target'},
 {name:'mixed-literal',css:'.else::-webkit-scrollbar-corner,.target::-webkit-scrollbar-corner {background:rgb(11,22,33)}',retain:'.else'},
 {name:'related-hover-var',css:'.target::-webkit-scrollbar-thumb:hover {background:var(--table-panel,red)}',error:'UNSUPPORTED_CONTENT'},
 {name:'related-var',css:'.target::-webkit-scrollbar-corner {background:var(--table-panel,red)}',error:'UNSUPPORTED_CONTENT'},
 {name:'mixed-var',css:'.else::-webkit-scrollbar-corner,.target::-webkit-scrollbar-corner {background:var(--table-panel,red)}',error:'UNSUPPORTED_CONTENT'},
 {name:'unknown-following-state',css:'.else::-webkit-scrollbar-thumb:not(:hover) {background:var(--table-panel,red)}',error:'UNSUPPORTED_CONTENT'},
 {name:'related-media',css:'@media all {.target::-webkit-scrollbar-corner {background:red}}',error:'UNSUPPORTED_CONTENT'},
 {name:'unrelated-media',css:'@media all {.else::-webkit-scrollbar-corner {background:var(--table-panel,red)}}'},
 {name:'unrelated-hidden-url',css:'.else::-webkit-scrollbar-corner {background:url("/css-boundary-hidden-probe")}'},
 {name:'pseudo-before-after',css:'.target p::before {content:"BEFORE"}.target p::after {content:"AFTER"}',text:['BEFORE','AFTER']},
];
for(const fixture of cases){
 const style=document.createElement('style');style.textContent=fixture.css;document.head.append(style);
 const parent=document.createElement('div');parent.className='external';
 const source=document.createElement('div');source.className='source target';source.innerHTML='<p>CSS boundary</p><div class="hidden else">Hidden</div>';parent.append(source);document.querySelector('#fixture').append(parent);
 const original=source.outerHTML,row={name:fixture.name,status:'failed'};let snapshot;
 try{
  snapshot=await capture(source);expect(!fixture.error,'Expected conservative rejection');
  const svg=(await snapshot.toSvg()).value;files[fixture.name+'.svg']=svg;
  if(fixture.retain)expect(svg.includes(fixture.retain),'Related original CSS was lost');
  for(const text of fixture.text??[])expect(svg.includes(text),'Ordinary pseudo content was lost');
  if(fixture.name==='unrelated-hidden-url')expect(!svg.includes('css-boundary-hidden-probe'),'Unrelated URL entered SVG');
  const png=await snapshot.toBlob({format:'png'});expect(png.value.size>0,'Empty raster');
  row.svgLength=svg.length;row.pngBytes=png.value.size;row.status='pass';
 }catch(error){row.error=error.code??error.message;if(fixture.error&&row.error===fixture.error)row.status='pass';}
 finally{snapshot?.dispose();expect(source.outerHTML===original,'Source changed');style.remove();parent.remove();}
 results.push(row);
}
// Same-document captures in both directions must not reuse a document CSS cache.
for(const reverse of [false,true]){
 const style=document.createElement('style');style.textContent='.alpha::-webkit-scrollbar-corner {background:var(--panel,red)}';document.head.append(style);
 const sources=['alpha','beta'].map(name=>{const node=document.createElement('div');node.className='source '+name;node.textContent=name;document.querySelector('#fixture').append(node);return node;});
 const row={name:reverse?'session-beta-alpha':'session-alpha-beta',status:'failed'};
 try{for(const source of reverse?[...sources].reverse():sources){let snapshot;try{snapshot=await capture(source);expect(source.classList.contains('beta'),'Related var unexpectedly succeeded');}catch(error){expect(source.classList.contains('alpha')&&error.code==='UNSUPPORTED_CONTENT','Session outcome changed');}finally{snapshot?.dispose();}}row.status='pass';}catch(error){row.error=error.message;}finally{style.remove();sources.forEach(node=>node.remove());}results.push(row);
}
// Verify source-context selector evaluation directly, including hidden nodes excluded by inspection.
const style=document.createElement('style');style.textContent='.external .target::-webkit-scrollbar-corner {background:red}';document.head.append(style);
const parent=document.createElement('div'),node=document.createElement('div');parent.className='external';node.className='target';parent.append(node);document.body.append(parent);
try{expect(collectScrollbarCss(node,[node],()=>{}).includes('.external .target'),'Original ancestor context missing');results.push({name:'collector-source-context',status:'pass'});}catch(error){results.push({name:'collector-source-context',status:'failed',error:error.message});}finally{style.remove();parent.remove();}
const report={revision:'css-boundary-regression-1',status:results.every(row=>row.status==='pass')?'pass':'failed',userAgent:navigator.userAgent,dpr:devicePixelRatio,results,completedAt:new Date().toISOString(),scope:'Target-scoped original scrollbar CSS; existing strict URL/SVG rejection retained; no native Safari support claim'};
globalThis.cssBoundaryRegressionResults=report;globalThis.cssBoundaryRegressionFiles=files;document.body.dataset.cssBoundaryRegression=report.status;document.querySelector('#results').textContent=JSON.stringify(report,null,2);
