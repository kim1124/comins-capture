import test from 'node:test';
import assert from 'node:assert/strict';
import {networkVerdict,svgVerdict} from '../../output/playwright/workbench/engine-contract-model.mjs';
test('capture resource requests reject the deny contract but application requests do not prove failure',()=>{
  assert.equal(networkVerdict([{phase:'prepare',asset:'image'},{phase:'capture',asset:'app'}]),'unverified');
  assert.equal(networkVerdict([{phase:'capture',asset:'font'}]),'fail');
});
test('active SVG content rejects admission while a clean static scan never certifies execution safety',()=>{
  assert.equal(svgVerdict({scripts:1,handlers:0,externalReferences:0}),'fail');
  assert.equal(svgVerdict({scripts:0,handlers:1,externalReferences:0}),'fail');
  assert.equal(svgVerdict({scripts:0,handlers:0,externalReferences:1}),'fail');
  assert.equal(svgVerdict({scripts:0,handlers:0,externalReferences:0}),'unverified');
});
