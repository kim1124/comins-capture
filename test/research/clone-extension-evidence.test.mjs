import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root = new URL('../../', import.meta.url);
const evidence = JSON.parse(await readFile(new URL('output/research/engine-contract/2026-10-04-clone-extension/report.json', root), 'utf8'));
test('recorded extension contrasts original defects with bounded candidate behavior and retains output gap', () => {
  assert.equal(evidence.conclusion, 'bounded-extension-feasible-output-safety-unproven');
  assert.equal(evidence.records.length, 28);
  for (const browser of ['Chrome 154.0.8037.93', 'Safari 27.0.1']) {
    const records = evidence.records.filter(d => d.report.browserVerifiedByOperator === browser);
    assert.equal(records.length, 14);
    assert.equal(new Set(records.map(d=>d.report.case)).size, 14);
    for (const d of records) {
      const r=d.report, baseline=r.mode==='baseline', denied=['deny','throw','abort'].includes(r.mode);
      assert.equal(r.fixtureRevision, 'clone-extension-1');
      assert.equal(r.engineVariant, baseline?'stock':'research-extension');
      assert.equal(r.sourceUnchanged, true);
      assert.equal(r.sourceMutationRecords, 0);
      assert.equal(r.renderHookCalls, 0);
      assert.equal(r.captureRequests, r.case==='baseline-background'?1:0);
      assert.equal(d.requests.filter(q=>q.phase==='capture').length, r.captureRequests);
      assert.equal(r.constructorDelta, r.case==='baseline-custom'?1:0);
      assert.equal(r.cloneReturned, !denied);
      assert.equal(r.status, r.mode==='abort'?'PROBE_ABORT':denied?'PROBE_RESOURCE_DENIED':'clone-observed');
      assert.equal(r.expectationMatch, true);
      if (denied) {assert.equal(r.resolverCalls,1);assert.ok(r.resourceErrors.length>0);}
      if (['background-allow','content-allow','mask-allow'].includes(r.case)) {
        assert.equal(r.resolverCalls,1);assert.equal(r.inlineDataPresent,true);
        assert.equal(r.remoteLiteralRemaining,true, 'must not certify safe output');
      }
      if (r.case.startsWith('custom-')) {
        assert.equal(r.customFactoryCalls,r.case==='custom-nested'?2:1);
        if (r.case!=='custom-hidden') assert.match(r.cloneText,/Shadow content/);
        if (r.case==='custom-slot') assert.match(r.cloneText,/Assigned content/);
        if (r.case==='custom-nested') assert.match(r.cloneText,/Nested content/);
      }
    }
  }
});
test('extension evidence preserves original and modified bundles, legal text, fixtures and raw records', async () => {
  assert.equal(Object.keys(evidence.sha256).length,40);
  for (const [path,hash] of Object.entries(evidence.sha256)) assert.equal(createHash('sha256').update(await readFile(new URL(path,root))).digest('hex'),hash,path);
  assert.equal(evidence.provenance.originalSHA256,evidence.sha256['node_modules/@zumer/snapdom/dist/snapdom.mjs']);
  assert.equal(evidence.provenance.candidateSHA256,evidence.sha256['output/research/clone-extension-engine/snapdom.mjs']);
  assert.equal(await readFile(new URL('output/research/clone-extension-engine/LICENSE',root),'utf8'),await readFile(new URL('node_modules/@zumer/snapdom/LICENSE',root),'utf8'));
});
