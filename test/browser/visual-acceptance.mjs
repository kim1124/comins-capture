import {capture} from '/dist/index.js';

const $=id=>document.getElementById(id);
const source=document.querySelector('.invoice');
const images=new Map();
let latestRun;
const expect=(condition,message)=>{if(!condition)throw Error(message);};
const canvas=(width,height)=>Object.assign(document.createElement('canvas'),{width,height});
const context=value=>{const ctx=value.getContext('2d');expect(ctx,'2D context missing');return ctx;};

async function post(path,body){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Visual-Acceptance':'1'},body:JSON.stringify(body)});
  if(!response.ok)throw Error(`Evidence save failed: HTTP ${response.status}`);
  return response.json();
}

function difference(left,right){
  expect(left.width===right.width&&left.height===right.height,'Comparison dimensions differ');
  const a=context(left).getImageData(0,0,left.width,left.height).data;
  const b=context(right).getImageData(0,0,right.width,right.height).data;
  let changedPixels=0,changedChannels=0,maxChannelDelta=0,alphaChannels=0,totalDelta=0;
  let minX=left.width,minY=left.height,maxX=-1,maxY=-1;
  for(let p=0;p<a.length;p+=4){
    let changed=false;
    for(let c=0;c<4;c++){
      const delta=Math.abs(a[p+c]-b[p+c]);
      if(delta){changed=true;changedChannels++;totalDelta+=delta;maxChannelDelta=Math.max(maxChannelDelta,delta);if(c===3)alphaChannels++;}
    }
    if(changed){changedPixels++;const x=p/4%left.width,y=Math.floor(p/4/left.width);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  return {changedPixels,changedChannels,maxChannelDelta,alphaChannels,meanChannelDelta:totalDelta/a.length,
    bounds:changedPixels?{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}:null};
}

async function decode(blob){
  const url=URL.createObjectURL(blob);
  try{const image=new Image();image.src=url;await image.decode();const result=canvas(image.naturalWidth,image.naturalHeight);context(result).drawImage(image,0,0);return result;}
  finally{URL.revokeObjectURL(url);}
}

function show(){
  const view=$('view').value;
  $('screens').classList.toggle('single',view!=='both');
  $('source-panel').hidden=view==='capture';$('capture-panel').hidden=view==='source';
  const value=images.get($('output').value);
  $('capture-stage').replaceChildren(...(value?[value]:[]));
}

async function check(report,name,work){
  const result={name,status:'failed'};
  try{Object.assign(result,await work());result.status='pass';}
  catch(error){result.error=error.code??error.message;result.stage=error.stage;}
  report.checks.push(result);
  $('results').textContent=report.checks.map(row=>`${row.name}: ${row.status}${row.error?` | ${row.error}`:''}`).join('\n');
}

function identityEvidence(svg){
  const parsed=new DOMParser().parseFromString(svg,'image/svg+xml');
  expect(!parsed.querySelector('parsererror'),'SVG parse failed');
  const originals=[source,...source.querySelectorAll('*')];
  const clones=[...parsed.querySelectorAll('[data-comins-node]')];
  const refs=clones.map(node=>node.getAttribute('data-comins-node'));
  expect(clones.length===originals.length,'Captured node count differs');
  expect(new Set(refs).size===refs.length,'Duplicate internal node reference');
  for(let i=0;i<originals.length;i++){
    const clone=clones.find(node=>node.getAttribute('data-comins-node')===`n${i}`);
    expect(clone?.localName===originals[i].localName,`Node tag mismatch n${i}`);
    expect(clone.textContent===originals[i].textContent,`Node text mismatch n${i}`);
  }
  expect(parsed.querySelectorAll('[id="duplicate-fixture"]').length===2,'Duplicate consumer IDs lost');
  const siblings=[...source.querySelectorAll('.notes li')];
  expect(siblings.length===3&&new Set(siblings.map(node=>node.textContent)).size===3,'Distinct sibling payloads missing');
  return {nodes:originals.length,nodesWithoutId:originals.filter(node=>!node.id).length,duplicateIdCount:2,
    identicalSiblingStructures:siblings.map(node=>[node.localName,...[...node.children].map(child=>child.localName)].join('/')),
    coverage:'restricted-static-html-node-correspondence; not entire G2'};
}

async function run(){
  $('run').disabled=true;$('save-review').disabled=true;latestRun=undefined;
  for(const image of images.values())image.width=image.height=0;
  images.clear();
  $('view').value='both';show();
  const report={revision:'visual-single-acceptance-1',startedAt:new Date().toISOString(),browser:$('browser').value,
    userAgent:navigator.userAgent,dpr:devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},
    fixture:{width:620,height:560,features:['flex','table','nested-clip','border','shadow','Korean-English-system-font','no-ID','duplicate-ID','same-structure-siblings']},
    checks:[],automaticStatus:'failed',screenComparison:{status:'pending',method:'actual-browser-CUA-screenshots-and-human-review'},
    limitations:['Internal output equality does not prove source screenshot equality.','System font resolution is OS/browser dependent.','Sticky/fixed/scrolled content remain unsupported.']};
  let snapshot;
  const initial=source.outerHTML;
  try{
    await document.fonts.ready;
    const box=source.getBoundingClientRect();expect(box.width===620&&box.height===560,'Fixture size differs');
    report.fixture.rect={x:box.x,y:box.y,width:box.width,height:box.height};
    report.fonts=[...new Set([source,source.querySelector('.english'),source.querySelector('td')].map(node=>getComputedStyle(node).fontFamily))];
    snapshot=await capture(source);
    const svg=(await snapshot.toSvg()).value;
    report.snapshotMeta=snapshot.meta;
    await check(report,'G2 restricted node correspondence',()=>identityEvidence(svg));

    await check(report,'Canvas and PNG exact equality',async()=>{
      const rendered=(await snapshot.toCanvas()).value;
      expect(rendered.width===620&&rendered.height===560,'Default output dimensions');images.set('default',rendered);
      const png=await decode((await snapshot.toBlob({format:'png'})).value);
      const diff=difference(rendered,png);report.pngDifference=diff;expect(diff.changedPixels===0,'PNG differs from Canvas');return {difference:diff};
    });

    await check(report,'2x direct output dimensions and PNG equality',async()=>{
      const rendered=(await snapshot.toCanvas({size:{kind:'scale',value:2}})).value;
      expect(rendered.width===1240&&rendered.height===1120,'2x output dimensions');images.set('highResolution',rendered);
      const png=await decode((await snapshot.toBlob({format:'png',size:{kind:'scale',value:2}})).value);
      const diff=difference(rendered,png);report.highResolutionPngDifference=diff;expect(diff.changedPixels===0,'2x PNG differs');
      if(images.has('default')){
        const nearest=canvas(1240,1120);context(nearest).imageSmoothingEnabled=false;context(nearest).drawImage(images.get('default'),0,0,1240,1120);
        report.highResolutionVersusNearestUpscale=difference(rendered,nearest);
      }
      return {width:rendered.width,height:rendered.height,difference:diff,qualityJudgment:'pending CUA review; this check establishes output consistency'};
    });

    await check(report,'Immutable snapshot and original DOM',async()=>{
      expect((await snapshot.toSvg()).value===svg,'Snapshot SVG changed');
      expect(source.outerHTML===initial,'Original DOM changed');return {unchanged:true};
    });
  }catch(error){report.checks.push({name:'capture preparation',status:'failed',error:error.code??error.message,stage:error.stage});}
  finally{snapshot?.dispose();}

  for(const [name,target] of [['sticky',document.querySelector('.sticky-example')],['fixed',document.querySelector('.fixed-example')],['scrolled',document.querySelector('.scroll-example')]]){
    await check(report,`Unsupported boundary: ${name}`,async()=>{
      if(name==='scrolled')target.scrollTop=20;
      let result,code,stage;
      try{result=await capture(target);}catch(error){code=error.code;stage=error.stage;}finally{result?.dispose();if(name==='scrolled')target.scrollTop=0;}
      expect(code==='UNSUPPORTED_CONTENT'&&stage==='prepare',`${name}: expected UNSUPPORTED_CONTENT/prepare, got ${code}/${stage}`);
      return {expectedCode:code,stage,coverage:'explicit rejection; support not added'};
    });
  }
  report.automaticStatus=report.checks.every(row=>row.status==='pass')?'pass':'failed';
  report.completedAt=new Date().toISOString();
  const savedImages=Object.fromEntries([...images].map(([key,value])=>[key,value.toDataURL('image/png')]));
  try{
    const saved=await post('/results',{report,images:savedImages});latestRun=saved.id;
    $('results').textContent=JSON.stringify({...report,evidenceDirectory:saved.directory},null,2);$('save-review').disabled=false;
  }catch(error){$('results').textContent=JSON.stringify(report,null,2)+`\nSAVE FAILED: ${error.message}`;}
  $('run').disabled=false;show();
}

$('run').onclick=run;$('view').onchange=show;$('output').onchange=show;
$('save-review').onclick=async()=>{
  try{
    const status=$('decision').value,sourceScreenshot=$('source-screenshot').value.trim(),captureScreenshot=$('capture-screenshot').value.trim(),notes=$('review-notes').value.trim();
    if(status!=='pending')expect(sourceScreenshot&&captureScreenshot&&notes,'Actual comparison requires both CUA screenshot paths and inspection notes');
    const saved=await post('/reviews',{runId:latestRun,status,sourceScreenshot,captureScreenshot,notes,output:$('output').value,method:'actual-browser-CUA-screenshots-and-human-review'});
    $('results').textContent+=`\n실제 화면 비교 기록 저장: ${saved.directory}`;
  }catch(error){$('results').textContent+=`\nREVIEW SAVE FAILED: ${error.message}`;}
};
