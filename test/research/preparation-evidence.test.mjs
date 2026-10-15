import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
const evidence=JSON.parse(await readFile(new URL('output/research/engine-contract/2026-10-04-dom-preparation/report.json',root),'utf8'));
test('recorded preparation probe preserves request, cleanup and explicit negative results',()=>{
 const rows=evidence.records.map(d=>d.report);assert.equal(rows.length,26);
 for(const browser of ['Chrome 154.0.8037.93','Safari 27.0.1']){
  const reports=rows.filter(r=>r.browserVerifiedByOperator===browser);assert.equal(reports.length,13);assert.equal(new Set(reports.map(r=>r.case)).size,13);
  for(const r of reports){assert.equal(r.captureRequests,0);assert.equal(r.remainingPreparedFrames,0);assert.equal(r.customConstructorsUnchanged,true);assert.equal(r.sourceUnchanged,r.case!=='changed');assert.equal(r.svgSafeForActiveDocument,false);}
  for(const kind of ['pseudo','nested-svg','shadow-custom']){const r=reports.find(r=>r.case===kind);assert.equal(r.status,'unsupported-observed');assert.equal(r.engineCalls,0);}
  for(const kind of ['resolver-missing','cancel']){const r=reports.find(r=>r.case===kind);assert.equal(r.prepareCalls,0);assert.equal(r.engineCalls,0);assert.equal(r.status,kind==='cancel'?'abort-rejected':'missing-rejected');}
  const image=reports.find(r=>r.case==='images');assert.equal(image.resolverCalls,1);assert.equal(image.metrics.resourceCount,1);assert.equal(image.imageSamplesMatch,true);assert.equal(image.repeatedOutputEqual,true);
 }
 const failure=rows.filter(r=>r.status==='failed');assert.equal(failure.length,1);assert.equal(failure[0].case,'flex');assert.equal(failure[0].browserVerifiedByOperator,'Chrome 154.0.8037.93');assert.equal(failure[0].code,'PROBE_GEOMETRY_MISMATCH');assert.equal(failure[0].engineCalls,0);
});
test('recorded preparation evidence files retain their hashes',async()=>{
 for(const [path,hash]of Object.entries(evidence.sha256))assert.equal(createHash('sha256').update(await readFile(new URL(path,root))).digest('hex'),hash,path);
});
