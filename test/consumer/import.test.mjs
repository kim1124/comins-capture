import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('package root imports without a browser or eager engine execution',async()=>{
 const api=await import('comins-capture');assert.equal(typeof api.paperSize,'function');assert.equal(typeof api.capture,'function');assert.equal(typeof api.CaptureError,'function');
 assert.equal(typeof globalThis.document,'undefined');
});
test('public declaration and engine contract do not expose SnapDOM types',async()=>{
 for(const p of ['dist/index.d.ts','dist/types.d.ts','dist/engine/contract.d.ts'])assert.doesNotMatch(await readFile(p,'utf8'),/@zumer|Snapdom|CaptureContext/);
});

test('0.0.1 candidate metadata targets the public package without adding deep exports',async()=>{
 const manifest=JSON.parse(await readFile('package.json','utf8'));
 assert.equal(manifest.name,'comins-capture');assert.equal(manifest.version,'0.0.1');
 assert.equal(manifest.private,false);assert.deepEqual(manifest.publishConfig,{access:'public'});
 assert.deepEqual(Object.keys(manifest.exports),['.']);
 assert.equal(manifest.repository.url,'git+https://github.com/kim1124/comins-capture.git');
});

test('public capture rejects invalid targets with typed errors',async()=>{
 const api=await import('comins-capture');
 assert.equal(typeof api.capture,'function');
 await assert.rejects(api.capture(null),e=>e instanceof api.CaptureError&&e.code==='INVALID_TARGET');
 assert.throws(()=>import.meta.resolve('comins-capture/dist/core/dom.js'),{code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
});
