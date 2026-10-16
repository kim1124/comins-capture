import {readFile} from 'node:fs/promises';
import {createEngineSupply,validateEngineSupply} from './engine-supply.mjs';
const expected=new Map([['@zumer/snapdom','MIT'],['typescript','Apache-2.0']]);
const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url)));
for(const [path,pkg] of Object.entries(lock.packages)){
 if(!path)continue;
 const name=path.replace(/^node_modules\//,'');
 if(!expected.has(name)||pkg.license!==expected.get(name))throw Error('LICENSE_REVIEW_REQUIRED');
 const manifest=JSON.parse(await readFile(new URL(`../${path}/package.json`,import.meta.url)));
 if(manifest.license!==pkg.license)throw Error('LICENSE_METADATA_MISMATCH');
 console.log(`${name}@${pkg.version}: ${pkg.license}; ${name==='@zumer/snapdom'?'installed dependency and modified internal copy':'development-only, not bundled'}`);
}
const root=new URL('../',import.meta.url),load=path=>readFile(new URL(path,root),'utf8');
const inputManifest=JSON.parse(await load('node_modules/@zumer/snapdom/package.json'));
const expectedEngine=createEngineSupply(await load('node_modules/@zumer/snapdom/dist/snapdom.mjs'),await load('node_modules/@zumer/snapdom/LICENSE'),inputManifest.version);
validateEngineSupply({
 code:await load('dist/engine/vendor/snapdom.mjs'),license:await load('dist/engine/vendor/LICENSE'),
 provenance:JSON.parse(await load('dist/engine/vendor/provenance.json')),
 notices:await load('THIRD_PARTY_NOTICES.md'),packageFiles:JSON.parse(await load('package.json')).files,
},expectedEngine);
await load('dist/engine/snapdom-extension.js');
console.log('Modified engine source, distribution and legal notice verified.');
