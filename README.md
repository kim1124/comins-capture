# Comins Capture

<a href="https://comins-website.vercel.app/ko/"><img src="https://comins-website.vercel.app/brand/comins-symbol.svg" width="64" height="64" alt="Comins brand website" /></a>

[Comins Brand](https://comins-website.vercel.app/ko/)

Browser-side static HTML capture for Vanilla JavaScript, React, Vue, and Svelte,
built on one TypeScript core and a pinned SnapDOM engine. Capture a connected
element once and export PNG, JPEG, Canvas, or foreignObject SVG at a requested
scale, custom size, or ISO/JIS paper size. WebP requires native encoder support.

[English docs](docs/README.md) · [한국어 가이드](docs/ko/01-quick-start.md)
· [Capture website](https://comins-website.vercel.app/ko/capture/)

**0.0.1 — static HTML and single-output capture.**

This checkout prepares an unpublished 0.0.2 quality candidate with the same API.
Recorded local gates passed after image, paper-clipping and raster-downscale
fixes. The 2026-10-23 local change also corrects shrinking SVG text for eligible
absolute-positioned single text leaves and plain block paragraphs without PNG
embedding. The frozen extension passed 73 unit/6 consumer, all 46 distinct research
checks and 30 Chrome/WebKit suites. Docs passed after an unpackaged-link fix; see
[verification details and limits](docs/guide/support.md). General SVG text
fidelity and existing WebKit external-enlargement clip defects remain unresolved.
Native Safari validation of this revision is pending. The registry install
below remains 0.0.1. This candidate is not release-ready.
The Capture website is a development introduction; current contracts are in
this repository's guides.

![PNG of the authored statement fixture including text, table, shadows and clipping](docs/assets/capture-statement.png)

This is a real 620×560 PNG output from the 2026-10-15 Chrome benchmark,
not a screenshot of the Playground. See [preview provenance](docs/assets/README.md)
for its fixture, runtime and evidence limits.

## Features

| Capability | What to try in the Playground |
| --- | --- |
| Single output | Generate and save PNG, JPEG, foreignObject SVG, or native-supported WebP. |
| Scale and custom size | Compare CSS 1×, 2×, captured device DPR and custom 800×600 output. |
| ISO/JIS paper | Select A3/A4/A5/B3/B4/B5, orientation and margins. Raster defaults to 300 PPI; SVG uses mm. |
| Layout and background | Compare contain, cover, stretch and backgrounds. APIs also expose alignment and encoder quality. |
| Snapshot reuse | Export several formats from one validated SVG without recapturing the source. |
| Resources and lifecycle | Use default-deny resources, explicit origins or a Blob resolver, cancellation, timeout and disposal. |

The target is ordinary static HTML. Crop, tiles, partial output, full-page capture,
Shadow DOM, form/scroll state and PDF are outside 0.0.1. See
[input and resources](docs/user/05-resources.md).

## Installation

For the registry release, install the exact version in the consuming application.
Before the version appears on npm, use the reviewed maintainer-provided tarball:

```sh
npm install --ignore-scripts comins-capture@0.0.1
# Offline candidate: npm install --ignore-scripts ./comins-capture-0.0.2.tgz
```

Use Node.js 24 or later and ESM. A browser bundler or application-owned import
map must resolve the package root. There are no framework subpath packages or
framework peer dependencies. Your application supplies its framework runtime.

## Quick Start

Call capture after the target has rendered. Keep controls outside the target.

```js
import {capture} from 'comins-capture';

const target = document.querySelector('#card');
if (!(target instanceof HTMLElement)) throw new Error('Missing capture target');
const snapshot = await capture(target);
try {
  const {value: blob, meta} = await snapshot.toBlob({
    format:'png',
    size:{kind:'paper', name:'A4', ppi:300},
    background:'#fff',
  });
  // Use blob and meta.width/meta.height; A4 is 2480×3508 px at 300 PPI.
} finally {
  snapshot.dispose();
}
```

`toBlob()` returns `{value, meta}`. Applications own and revoke the Blob URLs
they create. Images and web fonts may require a resolver or explicit origin
policy. The [complete quick start](docs/user/01-quick-start.md) includes HTML,
download handling and cleanup.

## Choose a framework

| Framework | Readiness and ownership | Guide |
| --- | --- | --- |
| Vanilla JavaScript | Connected HTMLElement and application cleanup | [Vanilla](docs/user/03-frameworks.md#vanilla-javascript) |
| React | ref, user event, effect cleanup; fresh owner per StrictMode setup | [React](docs/user/03-frameworks.md#react) |
| Vue | ref, nextTick and onUnmounted | [Vue](docs/user/03-frameworks.md#vue) |
| Svelte | bind:this, tick and onDestroy | [Svelte](docs/user/03-frameworks.md#svelte) |

All frameworks import from `comins-capture`. Root import and paper calculation
are DOM-free; capture itself requires a browser. The session helper is example
code, not a public export.

## Guides and API

- [English quick start](docs/user/01-quick-start.md) · [한국어 시작하기](docs/ko/01-quick-start.md)
- [Documentation index](docs/README.md) · [Core concepts](docs/user/02-core-concepts.md)
- [Output and paper options](docs/user/04-output-options.md) · [Input and resources](docs/user/05-resources.md)
- [Lifecycle and errors](docs/user/06-lifecycle-errors.md) · [Playground](docs/user/07-playground.md)
- [Public API reference](docs/user/09-public-api.md) · [한글 API](docs/ko/09-public-api.md)

```js
import {paperSize} from 'comins-capture';
paperSize('A4'); // {width:2480, height:3508}; ISO, 300 PPI
paperSize('B4', {standard:'JIS', orientation:'landscape'});
```

Output options use `system:'jis'`; paperSize uses `standard:'JIS'`. PPI computes
pixels without rewriting file DPI metadata. SVG contains foreignObject and is
not a pure vector or design-tool interchange format.

## Run the Playground locally

```sh
git clone https://github.com/kim1124/comins-capture.git
cd comins-capture
npm ci --ignore-scripts
npm run verify
npm run dev
```

Open [the Capture Playground](http://127.0.0.1:6004). Override the port with
CAPTURE_PORT. The server has no HMR; rebuild after source changes. Reset restores
defaults and clears results. `node examples/geometry.mjs` runs without a DOM.

## 0.0.1 scope

The initial release focuses on static HTML, single output, scale, custom sizes
and ISO/JIS paper. Unfinished crop, tile and partial paths have been removed.
Actual Chrome 155.0.8059.80 (headless, macOS/DPR2) passed 15 single-output/lifecycle/error
and 15 resource/SVG checks on the reviewed runtime. Six engine regressions also
passed, including zero implicit icon-font requests and large/downscaled images.
The 64-node statement's capture-to-PNG measured p50 42.2 ms and p95 47.3 ms across 10 samples; 30
sequential captures had zero failures. Paper dimensions passed 24 ISO/JIS and
orientation cases, with JIS values corroborated from public supplier/manufacturer
tables. JISC login is not required for this dimension check.

Publication, remote CI and release closure remain separate steps. The exact
artifact and source identity are recorded in the checkout's release worklog.
See [browser evidence and limits](docs/user/08-browser-support.md).

## Browser support and limits

The October 23 bounded SVG fix passed final type/build, 66 unit and 6 consumer
tests, licenses/docs, 46 distinct research tests and 27 Chrome/WebKit suites.
One research server test required a permitted-environment retry after listen
EPERM. Native Safari remains untested because fresh SafariDriver session creation
reported remote automation disabled. This does not establish general SVG fidelity
or whole-SVG external-enlargement quality.


Chrome technical quality is conditionally accepted for the recorded static
scope. On 2026-10-21 the unpublished 0.0.2 candidate passed type/build, 59 unit
and 6 consumer tests, licenses/docs and 46 research tests. Installed Chrome
155.0.8059.85 at DPR 1 and 2, and WebKit 26.5 at DPR 2, each passed seven bounded
suites: engine, cold images, resources, output/lifecycle, automatic visual,
15-case paper clipping and raster downscale (19/17/19 case groups respectively).

The direct foreignObject/CSS-zoom raster path now fixes original layout into a
1× Canvas before shrinking. Recorded regressions preserve the normal-text label,
shadows and clipping together. The existing Chrome DPR2 path's seven PNGs and
21 unchanged-path SVG/raster comparisons are byte-identical in focused evidence.
Those byte comparisons belong to the October 21 revision. The October 23 change
adds a bounded native-text SVG correction; normal-flow and complex text remain
outside that correction. See [current support](docs/guide/support.md).

Historical native Safari 27.0.1 at DPR2 passed 49 automated case groups on the
previous renderer but still showed the A4 text-wrap defect. The new raster
revision has not run in native Safari: CUA surface contention and disabled
SafariDriver remote automation blocked it. Current Chrome UI source/output
comparison and human review are also unperformed. Earlier Safari results do not
establish support for this revision. Final package creation, remote CI and
publication remain pending. Edge, Firefox and physical mobile devices are
unverified for this runtime. WebKit tests do not establish native Safari support.
Broad CSS, low-end systems, long-duration memory and full-image pixel equality
are not guaranteed. Each Canvas is limited to 8192 px per side and 32,000,000 px
total. The new direct raster-downscale path also checks its ceil-sized original
Canvas; even a small final output can return OUTPUT_LIMIT when that intermediate
exceeds either limit. This is not a global capture-input limit.

## Repository guidance

The [contribution guide](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/CONTRIBUTING.md), [repository guide](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/development/repository-guide.md)
and [release preparation](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/development/releasing.md) are checkout-only
maintainer documents. User references are distributed with the package.

## License and support

[MIT](LICENSE) · [Changelog](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/CHANGELOG.md) ·
[Issues](https://github.com/kim1124/comins-capture/issues) ·
[Comins Brand](https://comins-website.vercel.app/ko/)

The build supplies a pinned, minimally modified SnapDOM 3.2.0 engine behind an
internal adapter, with upstream license and provenance. See
[third-party notices](THIRD_PARTY_NOTICES.md). Public declarations expose no engine types.
