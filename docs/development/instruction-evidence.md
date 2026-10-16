> 2026-10-15: 이 문서는 정리 이전의 설계·구현 기록입니다. crop·타일·partial 및 실험 어댑터는 현재 코드에서 제거했습니다. 현재 계약은 docs/guide, 차기 재개 정보는 docs/development/next-version-memory.md를 따릅니다.

# Capture implementation evidence

Recorded 2026-10-12 by moving the prior root Module Guidance here. This snapshot
preserves implementation and experiment notes; it is not execution policy or a
current API/support guarantee. Verify relevant source, tests, and release gates
before relying on a recorded observation.

At the time of this guidance update, `src/index.ts` already exports `capture`,
`CaptureError`, geometry helpers, and related types, while README/guide claims
still describe the earlier geometry-only surface. Preserve ongoing source work;
resolve that public-documentation drift in its separately scoped feature work.
The older export claim recorded below must not override the actual source.

## Prior notes

- Independent package: comins-capture, initially private and unreleased. Preserve research output; do not include it in package files.
- SnapDOM 3.2.0 is conditionally adopted. First release with an external engine takes priority; an engine-independent internal adapter is mandatory.
- Current root exports are paperSize and planTiles plus types. General capture/snapshot is internal only; src/core/dom.ts integrates a bounded static HTML subset. Do not present the internal lab adapter as the public product API.
- Source ownership: src/geometry, engine, resources, output, lifecycle; playground is an authored-fixture development demo. Official guides live in docs/guide.
- Commands: npm run verify; npm run test:research; python3 -m unittest discover -s output/playwright/workbench -p 'test_*.py'; npm run dev (localhost port 6004).
- Engine imports stay inside src/engine. Public declarations do not expose third-party types. G1/G2/G3/G4 remain release conditions despite conditional adoption.
- Browser observations use actual installed Chrome and native Safari via Computer Use; do not substitute WebKit for native Safari evidence. Record limited synthetic results separately from product support.
- The lab raster preview currently upscales a 1x image. Do not claim this proves native high-resolution rendering.
- Local pre-commit Gitleaks hook is configured. No first commit, remote write or publication was performed during scaffold setup.

- Internal integration: src/core/capture.ts requires inspect/prepare/verify stages; src/core/dom.ts provides conservative DOM/resource preparation and SVG validation. Every snapshot output uses the immutable verified SVG through SvgRenderer. Public exposure still requires support and release gates.
- Resource HTTP integration: node --test test/integration/resource-http.test.mjs uses ephemeral localhost servers. Node transport tests do not establish browser CORS/CSP/cookie or engine network compliance.

- Engine supply: npm run build generates a fixed, modified SnapDOM 3.2.0 copy under dist/engine/vendor with upstream LICENSE and provenance; check:licenses verifies the copied distribution and THIRD_PARTY_NOTICES.md. The installed engine and research bundles remain unchanged. The call-owned extension session is wired into the internal DOM adapter, not the lab or public capture API. Input restrictions and SVG validation remain required; it does not control every upstream acquisition path.

- Internal output layout: default scale 1, captured DPR opt-in, ISO/JIS paper with 300 PPI raster default, source-CSS crop before fit/align, mm SVG. Every output uses a frozen LayoutPlan and verified SVG; tiles do not allocate a whole output Canvas. Native Chrome JIS fixture has a recorded one-channel-level antialias variance, not exact tile equality. See docs/guide/output-options.md.
