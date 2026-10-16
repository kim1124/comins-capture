import {createHash} from 'node:crypto';
import ts from 'typescript';
export const upstreamHash='b95213d41b0b0a5bf66a042ec889672e2ff2aadd510b242362844ef5091b30b2';
export const licenseHash='c5fbd8d2221c17ff18fc7f3fee7ecf3346fb5a3f5bb2dbd3eb08f1c0397ed1a2';
const digest=value=>createHash('sha256').update(value).digest('hex');

/** Fixed-version build transform. Never patches installed code or downloads an input. */
export function createEngineSupply(original,license,version) {
  if(version!=='3.2.0'||digest(original)!==upstreamHash||digest(license)!==licenseHash)throw Error('ENGINE_INPUT_CHANGED');
  const file=ts.createSourceFile('snapdom.mjs',original,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
  function replace(source,before,after,count) {
    if(source.split(before).length-1!==count)throw Error('ENGINE_PATCH_CHANGED');
    return source.replaceAll(before,after);
  }
  function visit(node) {
    if(ts.isFunctionDeclaration(node)) {
      const name=node.name?.text,source=node.getText(file);let updated=source;
      if(name==='Qt')updated=replace(source,'t.cloneNode(!1)','__cominsShallow(t,n)',3);
      if(name==='xe')updated=replace(source,'if(L.background.has(s))','{let a=await __cominsRead(o,e);return `url("${a.data}")`}if(L.background.has(s))',1);
      if(name==='We')updated=replace(source,'await dt(Vt(U),{as:"dataURL",useProxy:r.useProxy})','await __cominsRead(Vt(U),r)',1);
      // Keep prepared text/fonts intact; stock icon rasterization loads its own font.
      if(name==='Nn')updated='async function Nn(){return 0}';
      if(updated!==source)edits.push({start:node.getStart(file),end:node.end,updated,name});
    }
    ts.forEachChild(node,visit);
  }
  visit(file);
  if(edits.length!==4)throw Error('ENGINE_PATCH_CHANGED');
  let code=original;
  for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.updated+code.slice(e.end);
  code='// Comins modified SnapDOM 3.2.0. See LICENSE and provenance.json.\nimport {shallowClone as __cominsShallow,resolveImage as __cominsRead} from "../snapdom-extension.js";\n'+code;
  return {code,license,provenance:{component:'@zumer/snapdom',version,source:'https://registry.npmjs.org/@zumer/snapdom/-/snapdom-3.2.0.tgz',license:'MIT',
    use:'Modified internal engine component behind the restricted static DOM public capture API.',modifiedFunctions:['Qt','We','xe','Nn'],
    modifications:['Three shallow clone sites use a call-owned factory.','CSS background/mask and pseudo content image lookup uses a call-owned prepared resource session.','Material icon rasterization is disabled to preserve prepared text and prevent implicit font acquisition.','No stock fallback at these patched lookup sites; other original acquisition paths require adapter restrictions and verification.'],
    originalSHA256:upstreamHash,licenseSHA256:licenseHash,candidateSHA256:digest(code),obligations:'Preserve the upstream copyright and permission notice with the distributed copy.'}};
}

export function validateEngineSupply(actual,expected) {
  if(actual.code!==expected.code||actual.license!==expected.license||
    JSON.stringify(actual.provenance)!==JSON.stringify(expected.provenance)||
    !['@zumer/snapdom','3.2.0','MIT','dist/engine/vendor/LICENSE'].every(value=>actual.notices.includes(value))||
    !actual.packageFiles.includes('dist')||!actual.packageFiles.includes('THIRD_PARTY_NOTICES.md'))throw Error('ENGINE_DISTRIBUTION_INVALID');
}
