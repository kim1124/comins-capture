import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const required={G1:['cold','warm','css-background','font','external-svg','error','cancel','reexport','application-request'],G2:['idless','duplicate-ids','siblings','open-shadow','nested-sticky','container-boundary'],G3:['font-faces','inaccessible-css','svg-static','svg-document','svg-image'],G4:['small-tiles','large-tiles','allocation','seams']};
function check(change=()=>{}) {
  const dir=mkdtempSync(join(tmpdir(),'capture-evidence-'));
  try {
    writeFileSync(join(dir,'proof.json'),'{}');
    const report={engine:'@zumer/snapdom',version:'3.2.0',fixtureRevision:'contract-1',
      browsers:['Chrome','Safari'],gates:Object.fromEntries(['G1','G2','G3','G4'].map(id=>[id,{status:'pass',cases:['Chrome','Safari'].flatMap(browser=>required[id].map(caseId=>({id:caseId,browser,status:'pass',evidence:'proof.json'})))}]))};
    change(report,dir);writeFileSync(join(dir,'report.json'),JSON.stringify(report));
    return spawnSync(process.execPath,['scripts/check-engine-evidence.mjs',join(dir,'report.json')],{encoding:'utf8'});
  } finally {rmSync(dir,{recursive:true,force:true});}
}
test('accepts a structurally complete synthetic record without certifying engine behavior',()=>assert.equal(check().status,0));
test('rejects absent, unknown and unverified gates',()=>{
  for(const change of [r=>delete r.gates.G3,r=>r.gates.G1.status='unknown',r=>r.gates.G2.status='unverified'])assert.equal(check(change).status,1);
});
test('rejects missing evidence and paths outside the report directory',()=>{
  for(const value of ['missing.json','../proof.json','/tmp/proof.json'])assert.equal(check(r=>r.gates.G4.cases[0].evidence=value).status,1);
});
test('rejects missing Safari evidence and contradictory case failures',()=>{
  assert.equal(check(r=>r.gates.G1.cases=r.gates.G1.cases.filter(c=>c.browser!=='Safari')).status,1);
  assert.equal(check(r=>r.gates.G1.cases[0].status='fail').status,1);
});

test('rejects incomplete mandatory case coverage even when each browser is present',()=>{
  for(const gate of Object.keys(required))assert.equal(check(r=>r.gates[gate].cases.shift()).status,1);
});
