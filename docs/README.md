# Comins Capture Documentation

This directory separates current user references from maintainer operations,
historical implementation plans and dated verification records.

현재 사용자 참조 문서와 저장소 운영·과거 연구·시점별 검증 기록을 구분합니다.

[Comins Brand](https://comins-website.vercel.app/ko/) ·
[Capture introduction](https://comins-website.vercel.app/ko/capture/)

## Single-output scope and local 0.0.2 candidate

The October 23 plain-block extension passed 51/51 focused cases per configuration
and all 30 Chrome/WebKit suites. Types/build, 73 unit/6 consumer, licenses and all
46 distinct research checks passed. The initial docs failure was fixed and the
affected docs check passed; a loopback environment failure was resolved by an
affected-only rerun. Runtime hashes stayed unchanged. Independent review confirmed
float and paint-order fixes. Native Safari and general fidelity remain pending.
Earlier absolute-only
SVG text correction: final verify passed 66 unit/6 consumer
tests, type/build/licenses/docs; 46 distinct research tests and 27 Chrome/WebKit
suites passed. One research server test was rerun after an environment permission
failure. Native Safari and general SVG fidelity remain pending. The October 21
numbers below belong to the earlier runtime.


This guide describes the 0.0.1 contract. Static connected HTMLElement capture, single
PNG/JPEG/Canvas/foreignObject SVG, conditional native WebP and ISO/JIS paper
presets are implemented. The unpublished 0.0.2 candidate preserves this API.
Chrome acceptance is bounded by recorded fixtures. The recorded 2026-10-21
candidate passed type/build, 59 unit and 6 consumer tests, licenses/docs and 46
research tests. Installed Chrome 155.0.8059.85 at DPR1/2 and WebKit 26.5 at DPR2
each passed seven suites: engine 6/6, cold images 6/6, resources 15/15,
output/lifecycle 7/7, automatic visual 7/7, paper clipping 15/15 and raster
downscale 19/17/19 respectively.

The direct foreignObject/CSS-zoom raster path uses a per-operation original-size
Canvas before shrinking, preserving the representative normal-text label,
shadows and clipping together. Existing reciprocal rendering remains intact.
The October 23 local change adds a limited SVG correction for eligible absolute
single text leaves without PNG embedding. General HTML text fidelity and existing
WebKit external-enlargement clip defects remain unresolved. The current SVG
change and final gate status are described in the [support guide](guide/support.md).
The intermediate ceil-sized Canvas has the same 8192-side/32-million-area limits,
so a small final output may still return OUTPUT_LIMIT on this path.

Historical Safari 27.0.1 DPR2 results on the previous renderer include 49 automatic
passes and an actual A4 text-wrap defect. Native Safari has not run on the new
revision because of CUA contention and disabled SafariDriver remote automation.
Chrome UI source/output comparison and human review are also unperformed.
Historical Safari and framework results do not establish support for this
revision. Final package creation, remote CI, publication and deployment remain
pending. See the support guide for browser versions and exact limits.

JIS 치수는 공개 업체 자료와 ISO/JIS·방향별24조합 기하 검증으로 확인했습니다.
JISC 로그인·원문 열람은 필수 조건이 아닙니다. 최종 artifact·소스 revision·
원격 CI·게시 승인은 별도 확인 대상입니다.

## User guides

| English | 한국어 | Playground / API |
| --- | --- | --- |
| [01 Quick Start](user/01-quick-start.md) | [01 빠른 시작](ko/01-quick-start.md) | First PNG and download |
| [02 Core Concepts](user/02-core-concepts.md) | [02 핵심 개념](ko/02-core-concepts.md) | Capture → snapshot → output |
| [03 Framework Integration](user/03-frameworks.md) | [03 프레임워크 연동](ko/03-frameworks.md) | Vanilla / React / Vue / Svelte |
| [04 Output Options](user/04-output-options.md) | [04 출력 옵션](ko/04-output-options.md) | Scale, custom, paper and fit |
| [05 Input and Resources](user/05-resources.md) | [05 입력과 자원](ko/05-resources.md) | Static input, images and fonts |
| [06 Lifecycle and Errors](user/06-lifecycle-errors.md) | [06 수명주기와 오류](ko/06-lifecycle-errors.md) | Abort, dispose and typed errors |
| [07 Playground](user/07-playground.md) | [07 Playground](ko/07-playground.md) | Generate / save / reset |
| [08 Browser Support](user/08-browser-support.md) | [08 지원과 검증](ko/08-browser-support.md) | Evidence and limitations |
| [09 Public API Reference](user/09-public-api.md) | [09 공개 API](ko/09-public-api.md) | capture / paperSize / CaptureError |
| [10 Site Integration](user/10-site-integration.md) | [10 사이트 연동](ko/10-site-integration.md) | Separate website synchronization |

Run `npm run dev` and open <http://127.0.0.1:6004>. The Playground uses one
public Core API; it has no framework-specific routes.

`docs/guide` remains the implementation-contract source. `docs/user` provides
English references; `docs/ko` is generated from the Korean source with numbered
cross-links. After editing docs/guide, run `npm run docs:sync`.
`npm run check:docs` verifies generated copies, links, examples and API facts.
English reference changes must be reviewed against the same Korean contract.

## Maintainer documents

These are checkout-only documents. Repository links become current when the
reviewed source revision is pushed; local preparation is not remote publication.

- [Contribution guide](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/CONTRIBUTING.md).
- [Repository guide](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/development/repository-guide.md).
- [Release preparation](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/development/releasing.md).
- [Release conditions](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/release-readiness.md).
- [Handoff](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/HANDOFF.md).
- [Next-version memory](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/development/next-version-memory.md).

## Verification records

- [Scope cleanup](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/worklogs/2026-10-15-initial-scope-cleanup.md).
- [Chrome benchmark](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/worklogs/2026-10-15-0.0.1-benchmark.md).
- [Runtime dependency follow-up](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/worklogs/2026-10-15-release-followup.md).
- [Earlier local candidate](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/worklogs/2026-10-15-0.0.1-candidate-preparation.md).
- [Git and CI preparation](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/worklogs/2026-10-15-sequential-preparation.md).
- [Paper-dimension corroboration](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/worklogs/2026-10-16-paper-dimension-corroboration.md).
- [Reference docs and next candidate](https://github.com/kim1124/comins-capture/blob/codex-governance-v111/docs/worklogs/2026-10-16-reference-docs-candidate.md).
- [Preview provenance](assets/README.md).

Worklogs describe their recorded time and artifact. Older tarballs do not
contain later documentation. Raw local logs and captures stay in output and
are excluded from Git and the package.

## Historical records

Engine adoption, earlier API designs, research and docs/superpowers are
checkout-only historical decisions. They may include removed crop/tiles/partial
APIs. Current references and exports take precedence.

User references in guide/user/ko, this index and preview assets are packaged.
Development documents, handoff, worklogs and research remain checkout-only.
