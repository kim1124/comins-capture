import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectDom} from '../../dist/dom/inspect.js';
import {verifiedDomText} from '../../dist/core/dom.js';
import {createCapturePipeline} from '../../dist/core/capture.js';
import {reciprocalTextZoom,textZoomPair} from '../../dist/output/svg-renderer.js';

test('text reciprocal preserves exact effective Float32 zoom without arbitrary epsilon',()=>{
 for(const zoom of [2/3,.665625,539/620]){
  const inverse=1/zoom;
  if(Math.fround(Math.fround(zoom)*Math.fround(inverse))===1)assert.equal(reciprocalTextZoom(zoom),inverse);
  assert.equal(Math.fround(Math.fround(zoom)*Math.fround(reciprocalTextZoom(zoom))),1);
 }
 const zoom=28/360*96/25.4,inverse=1/zoom;
 assert.notEqual(Math.fround(Math.fround(zoom)*Math.fround(inverse)),1,'retained mm reproduction must exercise Float32 mismatch');
 const selected=reciprocalTextZoom(zoom),bits=value=>new Uint32Array(new Float32Array([value]).buffer)[0];
 assert.equal(Math.fround(Math.fround(zoom)*Math.fround(selected)),1);
 assert.equal(Math.abs(bits(selected)-bits(inverse)),1,'only an immediately adjacent IEEE754 value may be selected');
 const unresolved=3793/10001;
 assert.notEqual(Math.fround(Math.fround(unresolved)*Math.fround(1/unresolved)),1);
 const candidate=new Float32Array([1/unresolved]),encoding=new Uint32Array(candidate.buffer),original=encoding[0];
 for(const direction of [-1,1]){encoding[0]=original+direction;assert.notEqual(Math.fround(Math.fround(unresolved)*candidate[0]),1);}
 assert.equal(reciprocalTextZoom(unresolved),1/unresolved,'when no adjacent exact cancellation exists, retain the original inverse');
 // When Float32 cannot represent either operand, retain the original inverse;
 // this helper does not broaden output limits or invent a numeric tolerance.
 assert.equal(reciprocalTextZoom(Number.MIN_VALUE),Infinity);
});
test('a second primitive zoom stage cancels sampled ratios while preserving all single-stage choices',()=>{
 for(const zoom of [2/3,.665625,539/620,28/360*96/25.4])assert.deepEqual(textZoomPair(zoom),{intermediate:1,inverse:reciprocalTextZoom(zoom)});
 const pair=textZoomPair(3793/10001);
 assert.equal(pair.intermediate,0.9999999403953552);assert.ok(Number.isFinite(pair.inverse)&&pair.inverse>0);
 assert.equal(Math.fround(Math.fround(Math.fround(3793/10001)*pair.intermediate)*Math.fround(pair.inverse)),1);
 for(let index=1;index<=10000;index++){
  const zoom=index/10001,pair=textZoomPair(zoom);assert.equal(Math.fround(Math.fround(Math.fround(zoom)*pair.intermediate)*Math.fround(pair.inverse)),1);
  if(Math.fround(Math.fround(zoom)*Math.fround(reciprocalTextZoom(zoom)))===1)assert.equal(pair.intermediate,1);
 }
 for(const zoom of [Number.MIN_VALUE,0,-1,NaN,Infinity]){
  const pair=textZoomPair(zoom);assert.equal(pair.intermediate,1);assert.ok(Object.is(pair.inverse,reciprocalTextZoom(zoom)));
 }
});

const defaults={position:'static',display:'block',visibility:'visible','overflow-x':'visible','overflow-y':'visible',transform:'none',translate:'none',rotate:'none',scale:'none',perspective:'none',zoom:'1','writing-mode':'horizontal-tb',direction:'ltr','unicode-bidi':'normal','text-shadow':'none','text-decoration-line':'none','text-emphasis-style':'none','-webkit-text-stroke-width':'0px','white-space':'normal','text-align':'start','text-indent':'0px','text-overflow':'clip','-webkit-line-clamp':'none','font-family':'system-ui','font-size':'12px','font-weight':'400','font-variant-ligatures':'common-ligatures','line-height':'16.8px',color:'rgb(20, 36, 59)','box-shadow':'none','background-image':'none','background-color':'rgba(0, 0, 0, 0)',content:'normal',width:'95.125px',height:'16.796875px','backdrop-filter':'none'};
for(const side of ['top','right','bottom','left'])for(const prefix of ['padding-','margin-','border-'])defaults[prefix+side+(prefix==='border-'?'-width':'')]='0px';
function css(values){return new Proxy({}, {get(_,key){if(key===Symbol.iterator)return function*(){yield* Object.keys(values);};if(key==='getPropertyValue')return name=>values[name]??'';return values[String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]??'';}});}
function fixture(){
 const doc={URL:'https://fixture.invalid/',baseURI:'https://fixture.invalid/',styleSheets:[],adoptedStyleSheets:[],fonts:[]};
 function element(name,text='office ffi · A',changes={}){
  const el={localName:name,namespaceURI:'http://www.w3.org/1999/xhtml',isConnected:true,ownerDocument:doc,scrollLeft:0,scrollTop:0,shadowRoot:null,_style:{...defaults,...changes},_pseudos:{},_rect:{x:20,y:20,width:95.125,height:16.796875},_textRect:{x:20,y:21,width:94.75,height:15},_lines:1,
   childNodes:[{nodeType:3,data:text,get textContent(){return this.data;}}],nodeType:1,parentElement:null,hasAttribute(){return false;},getAnimations(){return [];},getBoundingClientRect(){return {...this._rect};},
   get firstChild(){return this.childNodes[0]??null;},get children(){return this.childNodes.filter(child=>child.nodeType===1);},get textContent(){return this.childNodes.map(child=>child.textContent).join('');},get outerHTML(){return `<${name}>${this.textContent}</${name}>`;}};
  return el;
 }
 const root=element('div','',{position:'relative',width:'620px',height:'560px'}),leaf=element('span','office ffi · A',{position:'absolute'});root._rect={x:0,y:0,width:620,height:560};root.childNodes=[leaf];leaf.parentElement=root;
 doc.defaultView={getComputedStyle(el,pseudo){if(!pseudo)return css(el._style);if(el._pseudos[pseudo])return css({...el._style,...el._pseudos[pseudo]});return css({...el._style,position:'static',display:'inline',...(['::before','::after'].includes(pseudo)?{content:'none'}:{})});}};
 doc.createRange=()=>{let target;return {selectNodeContents(el){target=el;},getClientRects(){return (target._textRects??Array.from({length:target._lines},()=>target._textRect)).map(rect=>({...rect}));},getBoundingClientRect(){return {...target._textRect};}};};
 return {doc,root,leaf,element};
}
async function inspect(update,work){
 const previous=globalThis.document,f=fixture();globalThis.document=f.doc;
 try{update?.(f);const inspection=await inspectDom(f.root,{checkpoint(){}});try{await work(inspection,f);}finally{inspection.dispose();}}
 finally{globalThis.document=previous;}
}

test('absolute single text captures fractional native content size and complete run typography without DOM state',async()=>{
 await inspect(null,(inspection,{leaf})=>{
  const run=inspection.nodes.find(node=>node.element===leaf).textRun;
  assert.deepEqual({ref:run.ref,text:run.text,width:run.width,height:run.height},{ref:'n1',text:'office ffi · A',width:95.125,height:16.796875});
  assert.ok(run.styles.some(([key,value])=>key==='font-variant-ligatures'&&value==='common-ligatures'));
  assert.ok(run.styles.some(([key,value])=>key==='white-space'&&value==='normal'));
  assert.deepEqual(Object.keys(run).sort(),['height','position','ref','styles','text','width']);
  assert.equal(run.position,'absolute');
  assert.ok(run.styles.every(pair=>pair.every(value=>typeof value==='string')));
 });
});

test('unsupported text geometry and effects retain existing capture without run metadata',async()=>{
 const cases=[
  ['empty text',f=>f.leaf.firstChild.data='   '],
  ['hidden text',f=>f.leaf._style.visibility='hidden'],
  ['hidden contents',f=>f.leaf._style['content-visibility']='hidden'],
  ['scrollable overflow',f=>f.leaf._style['overflow-x']='auto'],
  ['clipped overflow',f=>f.leaf._style['overflow-y']='hidden'],
  ['obscured text',f=>f.leaf._style['-webkit-text-security']='disc'],
  ['padding',f=>f.leaf._style['padding-left']='1px'],
  ['border',f=>f.leaf._style['border-bottom-width']='1px'],
  ['mixed inline',f=>{const child=f.element('strong','bold');child.parentElement=f.leaf;f.leaf.childNodes.push(child);}],
  ['two direct texts',f=>f.leaf.childNodes.push({nodeType:3,data:'more',textContent:'more'})],
  ['generated before',f=>f.leaf._pseudos['::before']={content:'"generated"'}],
  ['first-letter',f=>f.leaf._pseudos['::first-letter']={'font-weight':'700'}],
  ['first-line',f=>f.leaf._pseudos['::first-line']={color:'rgb(255, 0, 0)'}],
  ['text shadow',f=>f.leaf._style['text-shadow']='1px 1px red'],
  ['decoration',f=>f.root._style['text-decoration-line']='underline'],
  ['stroke',f=>f.leaf._style['-webkit-text-stroke-width']='1px'],
  ['RTL',f=>f.leaf._style.direction='rtl'],
  ['bidi',f=>f.leaf._style['unicode-bidi']='bidi-override'],
  ['Hebrew text',f=>f.leaf.firstChild.data='abc עברית'],
  ['Arabic text',f=>f.leaf.firstChild.data='abc العربية'],
  ['supplementary RTL text',f=>f.leaf.firstChild.data='abc \u{1e900}'],
  ['bidi control',f=>f.leaf.firstChild.data='abc\u202edef'],
  ['vertical writing',f=>f.leaf._style['writing-mode']='vertical-rl'],
  ['preformatted',f=>f.leaf._style['white-space']='pre'],
  ['multiline',f=>f.leaf._lines=2],
  ['unknown used width',f=>f.leaf._style.width='auto'],
  ['box mismatch',f=>f.leaf._style.width='120px'],
  ['own transform',f=>f.leaf._style.transform='matrix(1, 0, 0, 1, 1, 0)'],
  ['ancestor transform',f=>{const host=f.element('div','',{transform:'matrix(1, 0, 0, 1, 1, 0)'});f.root.parentElement=host;}],
  ['ancestor zoom',f=>{const host=f.element('div','',{zoom:'2'});f.root.parentElement=host;}],
  ['ancestor content visibility',f=>{const host=f.element('div','',{'content-visibility':'auto'});f.root.parentElement=host;}],
 ];
 for(const [name,update] of cases)await inspect(update,(inspection,{leaf})=>{
  assert.equal(inspection.nodes.find(node=>node.element===leaf).textRun,undefined,name);
  assert.doesNotThrow(()=>inspection.assertUnchanged(),`${name} must remain capturable`);
 });
});
test('plain block flow retains native used size, position category and every source line',async()=>{
 for(const position of ['static','relative'])await inspect(f=>{
  f.leaf._style.position=position;f.leaf._style['unicode-bidi']='isolate';f.leaf._lines=3;
 },(inspection,{leaf})=>{
  const node=inspection.nodes.find(node=>node.element===leaf);
  assert.equal(node.textRun.position,position);assert.equal(node.textRects.length,3);
  assert.equal(node.textRun.width,95.125);assert.equal(node.textRun.height,16.796875);
 });
});
test('flow text excludes baseline and intrinsic formatting consumers without rejecting capture',async()=>{
 const cases=[
  ...['flex','grid','inline','inline-block','table','table-cell','ruby','list-item','flow-root'].map(display=>[display,f=>f.root._style.display=display]),
  ['float ancestor',f=>f.root._style.float='left'],['float leaf',f=>f.leaf._style.float='left'],
  ['multicolumn count',f=>f.root._style['column-count']='2'],['multicolumn width',f=>f.root._style['column-width']='120px'],
 ];
 for(const [name,update] of cases)await inspect(f=>{f.leaf._style.position='static';update(f);},(inspection,{leaf})=>{
  assert.equal(inspection.nodes.find(node=>node.element===leaf).textRun,undefined,name);assert.doesNotThrow(()=>inspection.assertUnchanged());
 });
});
test('ordinary LTR ancestor isolation retains the same independent absolute text run',async()=>{
 await inspect(f=>{f.root._style['unicode-bidi']='isolate';},(inspection,{leaf})=>{
  assert.equal(inspection.nodes.find(node=>node.element===leaf).textRun.text,'office ffi · A');
 });
});
test('any captured sibling or ancestor-sibling float excludes flow while retaining absolute text',async()=>{
 for(const nested of [false,true])await inspect(f=>{
  f.leaf._style.position='static';const floating=f.element('div','',{float:'left'}),absolute=f.element('span','absolute',{position:'absolute'});floating.parentElement=f.root;absolute.parentElement=f.root;
  if(nested){const parent=f.element('div','');parent.parentElement=f.root;parent.childNodes=[f.leaf];f.leaf.parentElement=parent;f.root.childNodes=[floating,parent,absolute];}
  else f.root.childNodes=[floating,f.leaf,absolute];
 },(inspection,{leaf})=>{
  assert.equal(inspection.nodes.find(node=>node.element===leaf).textRun,undefined);
  assert.equal(inspection.nodes.find(node=>node.element.textContent==='absolute').textRun.position,'absolute');
 });
});

test('capture final unchanged assertion also detects text geometry drift inside an unchanged border box',async()=>{
 await inspect(null,(inspection,{leaf})=>{
  inspection.assertUnchanged();leaf._textRect.width-=.5;
  assert.throws(()=>inspection.assertUnchanged(),{code:'SOURCE_CHANGED',stage:'capture'});
 });
 await inspect(null,(inspection,{leaf})=>{leaf.firstChild.data='mutated';assert.throws(()=>inspection.assertUnchanged(),{code:'SOURCE_CHANGED'});});
 await inspect(f=>{f.leaf._style.position='static';f.leaf._style.height='40px';f.leaf._rect.height=40;f.leaf._textRects=[{x:20,y:21,width:94.75,height:15},{x:20,y:38,width:80,height:15}];},(inspection,{leaf})=>{
  inspection.assertUnchanged();
  // The whole text bounding rectangle and border box remain unchanged while
  // the widest line changes. Fingerprinting only their union misses this.
  leaf._textRects[0].width=80;leaf._textRects[1].width=94.75;
  assert.throws(()=>inspection.assertUnchanged(),{code:'SOURCE_CHANGED',stage:'capture'});
 });
});
test('paint effects, negative margins and visible outsets keep normal flow unchanged',async()=>{
 const cases=[
  ['static z-index',f=>f.leaf._style['z-index']='-1'],
  ['negative margin',f=>f.root._style['margin-left']='-1px'],
  ['box shadow',f=>f.root._style['box-shadow']='1px 1px 2px black'],
  ['filter',f=>f.root._style.filter='blur(1px)'],
  ['outline',f=>{f.root._style['outline-style']='solid';f.root._style['outline-width']='1px';}],
  ['text outset',f=>f.leaf._textRect.x=19],
  ['child outset',f=>{const sibling=f.element('div','');sibling.childNodes=[];sibling._rect={x:615,y:30,width:20,height:10};sibling.parentElement=f.root;f.root.childNodes.push(sibling);}],
  ['overlap peer',f=>{const sibling=f.element('div','');sibling.childNodes=[];sibling._rect={x:90,y:20,width:20,height:10};sibling.parentElement=f.root;f.root.childNodes.push(sibling);}],
  ['generated peer',f=>{const sibling=f.element('div','');sibling.childNodes=[];sibling._rect={x:300,y:300,width:20,height:10};sibling._pseudos['::before']={content:'""'};sibling.parentElement=f.root;f.root.childNodes.push(sibling);}],
  ['peer text stroke',f=>{const sibling=f.element('div','',{'-webkit-text-stroke-width':'1px'});sibling.childNodes=[];sibling._rect={x:300,y:300,width:20,height:10};sibling.parentElement=f.root;f.root.childNodes.push(sibling);}],
 ];
 for(const [name,update] of cases)await inspect(f=>{f.leaf._style.position='static';update(f);},(inspection,{leaf})=>{
  assert.equal(inspection.nodes.find(node=>node.element===leaf).textRun,undefined,name);assert.doesNotThrow(()=>inspection.assertUnchanged());
 });
});
test('flow guard comparison budget only disables optional metadata and still captures the tree',async()=>{
 for(const count of [63,64])await inspect(f=>{
  f.root.childNodes=Array.from({length:count},(_,index)=>{const leaf=f.element('div','text'),x=20+(index%6)*99,y=20+Math.floor(index/6)*20;leaf.parentElement=f.root;leaf._rect.x=x;leaf._rect.y=y;leaf._textRect.x=x;leaf._textRect.y=y+1;return leaf;});
 },inspection=>{
  assert.equal(inspection.nodes.length,count+1);assert.equal(inspection.nodes.filter(node=>node.textRun).length,count===63?63:0);
 });
});

test('verified text must match exactly one identified leaf and original text, including nonempty structure',()=>{
 const run={ref:'n7',text:'unchanged',width:90.5,height:16,styles:[['font-size','12px']]},node={ref:'n7',textRun:run},leaf={childNodes:[{nodeType:3}],firstChild:{nodeType:3},textContent:'unchanged'};
 const inspection={nodes:[node]},parsed={querySelectorAll(selector){assert.equal(selector,'[data-comins-node="n7"]');return [leaf];}};
 assert.deepEqual(verifiedDomText(inspection,parsed,new Map()),[run]);
 for(const matches of [[],[leaf,leaf],[{...leaf,textContent:'changed'}],[{...leaf,childNodes:[{},{}]}],[{...leaf,firstChild:{nodeType:1}}]])assert.throws(()=>verifiedDomText(inspection,{querySelectorAll:()=>matches},new Map()),{code:'RESOURCE_UNVERIFIABLE',stage:'capture'});
});

function pipeline(textRuns){
 const doc={},source={ownerDocument:doc},released=[],run={svg:'<svg>verified</svg>',status:'complete',diagnostics:[],textRuns},stages={
  async inspect(){return {documentUrl:'https://fixture.invalid/',resources:[],sourceSize:{width:200,height:80},assertUnchanged(){},dispose(){released.push('inspection');}};},
  async prepare(){return {root:source,dispose(){released.push('prepared');}};},engine:{async capture(){return {svg:'raw',sourceSize:{width:200,height:80},diagnostics:[],dispose(){released.push('engine');}};}},async verify(){return run;},
  renderer:{serialize(output){stages.seen=output;return output.svg;},async render(){throw Error('unexpected raster');}},
 };
 return {capture:()=>createCapturePipeline(stages)(source),stages,released};
}
test('verification payload is copied and deeply frozen without live references or public metadata additions',async()=>{
 const owner={ownerDocument:{}},run={ref:'n1',text:'original ffi',width:95.125,height:16.796875,position:'static',styles:[['font-size','12px'],['white-space','normal']],owner},runs=[run],f=pipeline(runs),snapshot=await f.capture();
 run.text='mutated';run.width=999;run.position='relative';run.styles[0][1]='90px';runs.push({...run});await snapshot.toSvg();
 const output=f.stages.seen;
 assert.ok(Object.isFrozen(output));assert.ok(Object.isFrozen(output.textRuns));assert.equal(output.textRuns.length,1);
 const retained=output.textRuns[0];assert.equal(retained.text,'original ffi');assert.equal(retained.width,95.125);assert.equal(retained.position,'static');assert.equal(retained.styles[0][1],'12px');
 assert.ok(Object.isFrozen(retained));assert.ok(Object.isFrozen(retained.styles));assert.ok(Object.isFrozen(retained.styles[0]));assert.equal('owner' in retained,false);assert.equal('textRuns' in snapshot.meta,false);
 assert.throws(()=>{retained.styles[0][1]='99px';},TypeError);snapshot.dispose();assert.deepEqual(f.released,['inspection','engine','prepared']);
});
test('nonprimitive or invalid text payload cannot create an output snapshot',async()=>{
 const valid={ref:'n1',text:'text',width:20,height:15,styles:[['font-size','12px']]};
 for(const run of [{...valid,ref:{}},{...valid,text:{}},{...valid,width:Infinity},{...valid,height:0},{...valid,position:{}},{...valid,position:'fixed'},{...valid,styles:[['font-size',{}]]}]){
  const f=pipeline([run]);await assert.rejects(f.capture(),{code:'RESOURCE_UNVERIFIABLE',stage:'capture'});assert.deepEqual(f.released,['engine','prepared','inspection']);
 }
});
