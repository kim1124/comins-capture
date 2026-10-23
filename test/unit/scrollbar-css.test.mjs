import test from 'node:test';
import assert from 'node:assert/strict';
import {scrollbarHosts,collectScrollbarCss} from '../../dist/engine/scrollbar-css.js';
const style=(selectorText,cssText=selectorText+'{background:red}')=>({type:1,selectorText,cssText});
const collect=(rules,nodes=[{matches:s=>s==='.target'}])=>collectScrollbarCss({ownerDocument:{styleSheets:[{cssRules:rules}]}},nodes,()=>{});
test('selector lists split only at top level; uncertain syntax remains unknown',()=>{
 assert.deepEqual(scrollbarHosts('.a::-webkit-scrollbar, [data-x="a,b"]::-webkit-scrollbar-corner'),['.a','[data-x="a,b"]']);
 assert.deepEqual(scrollbarHosts('.a ::-webkit-scrollbar'),['.a *']);
 assert.deepEqual(scrollbarHosts('::-webkit-scrollbar'),['*']);
 for(const selector of ['.a::-webkit-scrollbar:unknown',':is(.a,.b)::-webkit-scrollbar','.a:hover::-webkit-scrollbar','.a::before, .b::-webkit-scrollbar','[x="a,b"::-webkit-scrollbar','.a/* comment, */::-webkit-scrollbar','.a\\,b::-webkit-scrollbar',':is(::-webkit-scrollbar)'])assert.equal(scrollbarHosts(selector),undefined,selector);
});
test('unrelated CSS is removed; mixed, unknown and throwing matches preserve entire rule',()=>{
 assert.equal(collect([style('.else::-webkit-scrollbar-corner','unsafe')]),'');
 assert.equal(collect([style('.else::-webkit-scrollbar, .target::-webkit-scrollbar','mixed')]),'mixed');
 assert.equal(collect([style('.else::-webkit-scrollbar:unknown','unknown')]),'unknown');
 assert.equal(collect([style('.else::-webkit-scrollbar','throw')],[{matches(){throw Error();}}]),'throw');
 assert.equal(collect([style('.target::before','before')]),'');
});
test('original ancestor context, all included nodes, original CSS and document-local sessions are used',()=>{
 const rule=style('.outside .target::-webkit-scrollbar','original var(--value)');
 const node={matches:s=>s==='.outside .target'};
 assert.equal(collect([rule],[node]),rule.cssText);
 assert.equal(collect([rule],[]),'');
 assert.equal(collect([rule],[node]),rule.cssText);
});
test('import recursion, media wrappers, global dedup and inaccessible sheets retain upstream semantics',()=>{
 const target=style('.target::-webkit-scrollbar','literal'),sheet={cssRules:[target]};
 assert.equal(collect([{type:3,styleSheet:sheet},{type:4,conditionText:'not all',cssRules:[target,style('.target::-webkit-scrollbar-thumb','thumb')]}]),'literal@media not all{thumb}');
 const blocked={get cssRules(){throw Error('cross-origin');}};
 assert.equal(collectScrollbarCss({ownerDocument:{styleSheets:[blocked,sheet]}},[{matches:()=>true}],()=>{}),'literal');
});
test('bounded traversal propagates cancellation and limit failures rather than dropping CSS',()=>{
 assert.throws(()=>collectScrollbarCss({ownerDocument:{styleSheets:[{cssRules:[style('.target::-webkit-scrollbar')]}]}},[],()=>{throw Object.assign(Error(),{code:'ABORTED'});}),{code:'ABORTED'});
 let nested=[style('.target::-webkit-scrollbar')];for(let i=0;i<66;i++)nested=[{type:4,conditionText:'all',cssRules:nested}];
 assert.throws(()=>collect(nested),{code:'OUTPUT_LIMIT'});
});
test('original meter/progress/slider pattern is preserved conservatively',()=>{
 for(const pseudo of ['::-webkit-meter-bar','::-webkit-progress-value','::-webkit-slider-thumb','::-moz-meter-bar','::-moz-progress-bar']){
  assert.equal(collect([style('.target'+pseudo,'kept')]),'kept',pseudo);
  assert.equal(collect([style('.else'+pseudo,'dropped')]),'',pseudo);
 }
 assert.equal(collect([style('.else::-webkit-scrollbar-unknown','unknown')]),'unknown');
});
test('oversized CSS rejects and cyclic import traversal terminates without a cache',()=>{
 assert.throws(()=>collect([style('.target::-webkit-scrollbar','x'.repeat(4_000_001))]),{code:'OUTPUT_LIMIT'});
 const sheet={cssRules:[]};sheet.cssRules.push({type:3,styleSheet:sheet},style('.target::-webkit-scrollbar','once'));
 assert.equal(collectScrollbarCss({ownerDocument:{styleSheets:[sheet]}},[{matches:()=>true}],()=>{}),'once');
});
test('actual Table scrollbar thumb hover hosts prove unrelatedness without changing original related CSS',()=>{
 const css='.comins-table__body-viewport::-webkit-scrollbar-thumb:hover,.comins-table__horizontal-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--comins-table-accent-strong); }';
 const selector=css.slice(0,css.indexOf('{')).trim();
 assert.equal(collect([style(selector,css)]),'');
 assert.equal(collect([style(selector,css)],[{matches:host=>host==='.comins-table__horizontal-scrollbar'}]),css);
});

test('only bounded hover/active suffix tokens broaden host relevance; related state CSS remains unchanged',()=>{
 assert.deepEqual(scrollbarHosts('.target::-webkit-scrollbar-thumb:hover:active'),['.target']);
 for(const suffix of [':hovering',':active-state',':hover(.x)',':not(.x)',':hover > .x',':hover::before',':hover\\31'])assert.equal(scrollbarHosts('.else::-webkit-scrollbar-thumb'+suffix),undefined,suffix);
 const css='original var(--panel)';
 assert.equal(collect([style('.target::-webkit-scrollbar-thumb:hover',css)]),css);
 assert.equal(collect([style('.else::-webkit-scrollbar-thumb:hover,.target::-webkit-scrollbar-thumb:active',css)]),css);
 assert.equal(collect([style('.else::-webkit-scrollbar-thumb:hover,.unknown::-webkit-scrollbar-thumb:unknown',css)]),css);
});
