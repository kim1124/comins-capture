import test from 'node:test';
import assert from 'node:assert/strict';
const m=await import('../../dist/resources/css.js').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
test('CSS resource traversal accounts for each URL and leaves quoted text alone',()=>{
 assert.equal(typeof m.mapCssUrls,'function');const urls=[];
 const result=m.mapCssUrls('background:linear-gradient(red,blue),url("/a"),URL(/b);content:"url(/text)";',u=>{urls.push(u);return 'data:image/png;base64,AAAA';});
 assert.deepEqual(urls,['/a','/b']);assert.equal(result.includes('/a'),false);assert.ok(result.includes('"url(/text)"'));
});
test('CSS uncertainty rejects rather than silently retaining a hidden fetch',()=>{
 assert.equal(typeof m.mapCssUrls,'function');
 for(const input of ['u\\72l(/x)','@import "/x"','image-set("/x" 1x)','image("/x")','src("/x")','var(--asset)','url(/*x*/ /x)','url("/x"','behavior:url(/x)'])assert.throws(()=>m.mapCssUrls(input,u=>u),input);
 assert.throws(()=>m.mapCssUrls('url(/unknown)',()=>{throw Error('unregistered');}));
 assert.equal(m.mapCssUrls('scroll-behavior:auto;transform:translate(1px,2px)',u=>u),'scroll-behavior:auto;transform:translate(1px,2px)');
});
