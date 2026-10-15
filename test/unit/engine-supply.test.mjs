import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const supply=await import('../../scripts/engine-supply.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
const required=()=>assert.equal(typeof supply.createEngineSupply,'function');
const root=new URL('../../',import.meta.url);
const original=await readFile(new URL('node_modules/@zumer/snapdom/dist/snapdom.mjs',root),'utf8');
const license=await readFile(new URL('node_modules/@zumer/snapdom/LICENSE',root),'utf8');
test('engine supply is deterministic and rejects changed upstream or license inputs',()=>{
 required();const a=supply.createEngineSupply(original,license,'3.2.0'),b=supply.createEngineSupply(original,license,'3.2.0');
 assert.deepEqual(a,b);
 for(const args of [[original+' ',license,'3.2.0'],[original,license+' ','3.2.0'],[original,license,'3.2.1']])assert.throws(()=>supply.createEngineSupply(...args));
 assert.equal(a.license,license);assert.equal(a.provenance.candidateSHA256,createHash('sha256').update(a.code).digest('hex'));
 assert.equal(a.code.includes('/clone-extension-runtime.mjs'),false);
 assert.match(a.code,/from "\.\.\/snapdom-extension\.js"/);
});
test('built engine matches reviewed generator and retains license/provenance within dist',async()=>{
 required();const expected=supply.createEngineSupply(original,license,'3.2.0');
 assert.equal(await readFile(new URL('dist/engine/vendor/snapdom.mjs',root),'utf8'),expected.code);
 assert.equal(await readFile(new URL('dist/engine/vendor/LICENSE',root),'utf8'),license);
 assert.deepEqual(JSON.parse(await readFile(new URL('dist/engine/vendor/provenance.json',root),'utf8')),expected.provenance);
});
test('license gate rejects altered generated code, missing legal text or missing package notice',()=>{
 required();assert.equal(typeof supply.validateEngineSupply,'function');
 const expected=supply.createEngineSupply(original,license,'3.2.0');
 const actual={...expected,notices:'@zumer/snapdom 3.2.0 MIT dist/engine/vendor/LICENSE',packageFiles:['dist','THIRD_PARTY_NOTICES.md']};
 supply.validateEngineSupply(actual,expected);
 for(const changed of [{code:expected.code+' '},{license:''},{provenance:{}},{notices:''},{packageFiles:['dist']}]) {
  assert.throws(()=>supply.validateEngineSupply({...actual,...changed},expected));
 }
});
