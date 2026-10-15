import {readFileSync,realpathSync,statSync} from 'node:fs';
import {dirname,resolve,relative,isAbsolute} from 'node:path';

const required={G1:['cold','warm','css-background','font','external-svg','error','cancel','reexport','application-request'],G2:['idless','duplicate-ids','siblings','open-shadow','nested-sticky','container-boundary'],G3:['font-faces','inaccessible-css','svg-static','svg-document','svg-image'],G4:['small-tiles','large-tiles','allocation','seams']};

try {
  const filename=realpathSync(process.argv[2]);
  const root=dirname(filename),r=JSON.parse(readFileSync(filename,'utf8'));
  if(r.engine!=='@zumer/snapdom'||r.version!=='3.2.0'||!r.fixtureRevision)throw Error();
  for(const id of ['G1','G2','G3','G4']) {
    const gate=r.gates?.[id];
    if(gate?.status!=='pass'||!Array.isArray(gate.cases)||!gate.cases.length)throw Error();
    for(const browser of ['Chrome','Safari'])for(const caseId of required[id])if(!gate.cases.some(c=>c.browser===browser&&c.id===caseId))throw Error();
    for(const c of gate.cases){
      if(c.status!=='pass'||!c.id||typeof c.evidence!=='string'||isAbsolute(c.evidence))throw Error();
      const file=realpathSync(resolve(root,c.evidence)),rel=relative(root,file);
      if(rel.startsWith('..')||isAbsolute(rel)||!statSync(file).isFile())throw Error();
    }
  }
  console.log('Evidence structure complete; this does not independently certify visual or engine behavior.');
} catch {
  console.error('Engine adoption evidence incomplete or failed.');
  process.exitCode=1;
}
