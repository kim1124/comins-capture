import test from 'node:test';
import assert from 'node:assert/strict';
import {paperSize} from '../../dist/index.js';
test('ISO A4 PPI conversion and orientation',()=>{
 assert.deepEqual(paperSize('A4'),{width:2480,height:3508});
 assert.deepEqual(paperSize('A4',{ppi:150,orientation:'landscape'}),{width:1754,height:1240});
});
test('ISO and JIS B4 remain distinct',()=>{
 assert.deepEqual(paperSize('B4',{ppi:254}),{width:2500,height:3530});
 assert.deepEqual(paperSize('B4',{standard:'JIS',ppi:254}),{width:2570,height:3640});
});
test('invalid paper names, PPI, and orientation reject',()=>{
 for(const ppi of [0,-1,NaN,Infinity])assert.throws(()=>paperSize('A4',{ppi}));
 assert.throws(()=>paperSize('unknown'));assert.throws(()=>paperSize('A4',{orientation:'diagonal'}));
});
