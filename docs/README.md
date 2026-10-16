# Comins Capture Documentation

This directory separates current user references from maintainer operations,
historical implementation plans and dated verification records.

현재 사용자 참조 문서와 저장소 운영·과거 연구·시점별 검증 기록을 구분합니다.

[Comins Brand](https://comins-website.vercel.app/ko/) ·
[Capture introduction](https://comins-website.vercel.app/ko/capture/)

## 0.0.1 scope

This guide describes the 0.0.1 contract. Static connected HTMLElement capture, single
PNG/JPEG/Canvas/foreignObject SVG, conditional native WebP and ISO/JIS paper
presets are implemented. Chrome acceptance is bounded by recorded fixtures;
native Safari remains excluded due to known shadow/clip failures.

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
