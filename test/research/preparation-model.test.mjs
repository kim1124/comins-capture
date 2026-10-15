import test from 'node:test';
import assert from 'node:assert/strict';
import {singleCssUrl, compareBoxes} from '../../output/playwright/workbench/preparation-model.mjs';
test('bounded CSS image syntax resolves a single canonical url, including escapes',()=>{
 assert.equal(singleCssUrl('none','https://example.test/path/'),null);
 assert.equal(singleCssUrl('url("../blue.png")','https://example.test/path/'),'https://example.test/blue.png');
 assert.equal(singleCssUrl('url("a\\22 b.png")','https://example.test/'),'https://example.test/a%22b.png');
 assert.equal(singleCssUrl('url("a\\)b.png")','https://example.test/'),'https://example.test/a)b.png');
});
test('unhandled CSS image grammar fails explicitly instead of losing layers',()=>{
 for(const value of ['url(a),url(b)','image-set(url(a) 1x)','linear-gradient(red,blue)','url("a") garbage','url("a)','u\\72l(a)','url(a\\\nb)'])assert.throws(()=>singleCssUrl(value,'https://example.test/'),/PROBE_CSS_UNSUPPORTED/);
});
test('geometry compares every source box in root-relative coordinates',()=>{
 const a=[{x:40,y:20,width:100,height:50},{x:45,y:25,width:20,height:20}];
 const b=[{x:5,y:90,width:100,height:50},{x:10,y:95,width:20,height:20}];
 assert.deepEqual(compareBoxes(a,b),[]);
 b[1].width=19;assert.deepEqual(compareBoxes(a,b),[{index:1,field:'width',expected:20,actual:19}]);
 assert.throws(()=>compareBoxes(a,b.slice(0,1)),/PROBE_MAP_MISMATCH/);
});
