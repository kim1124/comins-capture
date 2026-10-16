import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeTiles} from '../../scripts/analyze-engine-tiles.mjs';
test('right-side tile repeating blue origin fails even with correct dimensions',()=>{
  const tile={x:2048,y:3072,width:452,height:428,centerPixel:[32,71,189,255]};
  assert.equal(analyzeTiles([tile],2500).mismatches.length,1);
  assert.equal(analyzeTiles([{...tile,centerPixel:[255,205,68,255]}],2500).status,'unverified');
});
