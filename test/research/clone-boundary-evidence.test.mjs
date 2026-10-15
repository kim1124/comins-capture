import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('../../', import.meta.url);
const evidence = JSON.parse(await readFile(new URL('output/research/engine-contract/2026-10-04-clone-boundary/report.json', root), 'utf8'));

test('recorded clone-only evidence retains both blockers instead of claiming safe completion', () => {
  assert.equal(evidence.conclusion, 'clone-only-insufficient');
  assert.equal(evidence.records.length, 10);
  for (const browser of ['Chrome 154.0.8037.93', 'Safari 27.0.1']) {
    const records = evidence.records.filter(d => d.report.browserVerifiedByOperator === browser);
    assert.deepEqual(records.map(d => d.report.case).sort(), ['css', 'custom', 'font', 'image', 'pseudo']);
    for (const d of records) {
      const r = d.report;
      assert.equal(d.engine, '@zumer/snapdom@3.2.0');
      assert.equal(r.fixtureRevision, 'clone-boundary-1');
      assert.equal(r.status, 'observed');
      assert.equal(r.resultNeeds, 'clone');
      assert.equal(r.cloneObserved, true);
      assert.equal(r.renderHookCalls, 0);
      assert.equal(r.urlReadable, false);
      assert.equal(r.sourceUnchanged, true);
      assert.equal(r.constructorDelta, r.case === 'custom' ? 1 : 0);
      assert.equal(r.captureRequests, r.case === 'pseudo' ? 1 : 0);
      assert.deepEqual(r.requests, d.requests);
      assert.equal(d.requests.filter(request => request.phase === 'capture').length, r.captureRequests);
      if (r.case === 'custom') assert.equal(r.cloneTextPresent, true);
      if (r.case === 'pseudo') {
        assert.deepEqual(d.requests.map(request => request.phase), ['prepare', 'capture']);
        assert.ok(Date.parse(d.requests[0].at) < Date.parse(d.armedAt));
        assert.ok(Date.parse(d.requests[1].at) >= Date.parse(d.armedAt));
      }
    }
  }
});

test('recorded clone-only raw reports, fixture, engine and screenshots retain their hashes', async () => {
  assert.equal(Object.keys(evidence.sha256).length, 18);
  for (const [path, hash] of Object.entries(evidence.sha256)) {
    assert.equal(createHash('sha256').update(await readFile(new URL(path, root))).digest('hex'), hash, path);
  }
});
