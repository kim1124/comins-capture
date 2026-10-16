import test from 'node:test';
import assert from 'node:assert/strict';

test('0.0.1 exposes only capture, errors, and paper sizing at runtime',async()=>{
 const api=await import('comins-capture');
 assert.deepEqual(Object.keys(api).sort(),['CaptureError','capture','paperSize']);
});
