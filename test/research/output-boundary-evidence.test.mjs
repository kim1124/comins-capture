import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root = new URL('../../', import.meta.url);
const evidence = JSON.parse(await readFile(new URL('output/research/engine-contract/2026-10-11-output-boundary/report.json', root), 'utf8'));

test('recorded shape outputs match in Chrome and native Safari without certifying general DOM support', () => {
  assert.equal(evidence.conclusion, 'bounded-shape-output-match-not-general-product-support');
  assert.equal(evidence.records.length, 14);
  for (const browser of ['Chrome 154.0.8037.98', 'Safari 27.0.1']) {
    const records = evidence.records.filter(d => d.report.browserVerifiedByOperator === browser);
    assert.deepEqual(records.map(d => d.report.case).sort(), ['background','content','hidden','mask','nested','slot','visible']);
    for (const d of records) {
      const r = d.report, resource = ['background','content','mask'].includes(r.case);
      assert.equal(r.fixtureRevision, 'output-boundary-5');
      assert.equal(r.engineVariant, 'research-extension');
      assert.equal(r.method, browser.startsWith('Safari') ? 'computer-use-native-safari' : 'computer-use-chrome-extension');
      assert.equal(r.status, 'output-match');
      assert.equal(r.expectationMatch, true);
      assert.equal(r.renderHooks, 1);
      assert.equal(r.constructorDelta, 0);
      assert.equal(r.sourceUnchanged, true);
      assert.equal(r.sourceMutations, 0);
      assert.equal(r.captureRequests, 0);
      assert.equal(d.requests.filter(q => q.phase === 'capture').length, 0);
      assert.equal(r.resolverCalls, Number(resource));
      assert.equal(r.rawRemoteLiteral, resource);
      assert.equal(r.rawAdmitted, !resource);
      assert.equal(r.finalRemoteLiteral, false);
      assert.ok(r.finalSvg.length > 0);
      assert.deepEqual(r.negativeChecks, Array(7).fill(true));
      assert.deepEqual(r.pixels, {pixels:23040, different:0, ratio:0, maxChannelDelta:0});
      assert.equal(r.document.maxDelta, 0);
      if (r.case === 'hidden') {
        assert.equal(r.document.sourceCount, 2);
        assert.equal(r.document.outputCount, 1, 'retain hidden structural difference');
        assert.equal(r.document.visibleCount, 0);
      } else if (!resource) assert.ok(r.document.visibleCount > 0);
    }
  }
});

test('output evidence preserves final records and superseded attempts with exact source and artifact hashes', async () => {
  assert.deepEqual(Object.values(evidence.supersededAttempts).map(a => a.length), [7,7,14,14]);
  const previous = evidence.supersededAttempts['4'];
  assert.equal(previous.filter(d => d.report.status === 'output-mismatch').length, 2);
  assert.ok(previous.filter(d => d.report.case === 'hidden').every(d => d.report.pixels.different === 0));
  assert.ok(Object.keys(evidence.sha256).length >= 111);
  for (const [path, hash] of Object.entries(evidence.sha256)) {
    assert.equal(createHash('sha256').update(await readFile(new URL(path, root))).digest('hex'), hash, path);
  }
  for (const d of evidence.records) {
    const prefix = `output/research/engine-contract/2026-10-11-output-boundary/final/${d.id}`;
    assert.deepEqual(JSON.parse(await readFile(new URL(`${prefix}/report.json`, root), 'utf8')), d);
    assert.ok(evidence.sha256[`${prefix}/capture.png`]);
  }
  assert.equal(evidence.provenance.candidateSHA256, evidence.sha256['output/research/clone-extension-engine/snapdom.mjs']);
  assert.equal(evidence.provenance.originalSHA256, evidence.sha256['node_modules/@zumer/snapdom/dist/snapdom.mjs']);
  assert.equal(await readFile(new URL('output/research/clone-extension-engine/LICENSE', root), 'utf8'), await readFile(new URL('node_modules/@zumer/snapdom/LICENSE', root), 'utf8'));
});
