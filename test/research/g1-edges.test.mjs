import test from 'node:test';
import assert from 'node:assert/strict';
import {assessEdges} from '../../output/playwright/workbench/g1-edges-model.mjs';
test('zero requests cannot certify a blank image',()=>{
  assert.equal(assessEdges({requests:[],contentMatches:false}),'content-missing');
});
test('correct content cannot hide a capture resource request',()=>{
  assert.equal(assessEdges({requests:[{phase:'capture',asset:'image'}],contentMatches:true}),'request-observed');
});
test('prepared resource and app requests do not invalidate bounded content match',()=>{
  assert.equal(assessEdges({requests:[{phase:'prepare',asset:'image'},{phase:'capture',asset:'app'}],contentMatches:true}),'bounded-match');
});
