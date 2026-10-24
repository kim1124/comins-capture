# 2026-10-23 CSS boundary local candidate

## Scope and cause

- Local, unpublished implementation under the approved local-only Comins Contract v1.12. No remote writes, releases, deployment, dependency changes, public API changes, renderer changes, or site changes.
- Recorded pre-change reproduction: `output/playwright/2026-10-23-site-css-reproduction/summary.json`. Document-global SnapDOM `Vf` collection inserted unrelated Table scrollbar CSS containing `var()` into SVG; strict CSS/SVG validation rejected capture. This recorded evidence is not a fresh execution in this implementation stage.
- Existing dirty files and the 80-file baseline under `output/verification/2026-10-23-css-boundary/baseline` were preserved.

## Implementation

- `src/engine/scrollbar-css.ts`: session-local CSSOM traversal with source-context `Element.matches` against inspected source nodes. Only definitely unrelated rules are removed. Mixed lists and unknown syntax retain the complete original CSS rule.
- A bounded selector-list scan accounts for strings, escapes, comments, parentheses, brackets, and top-level commas. Only recognized terminal vendor pseudo-elements are separated from a host selector. Only exact trailing `:hover` / `:active` tokens after a recognized native pseudo-element may be removed to prove a host superset. Matching hosts keep the entire original rule regardless of current state. Functions, escaped hosts, comments, host pseudo states and other following states remain unknown.
- The original SnapDOM Hf family includes scrollbar, meter, progress and slider rules. This retains that collection boundary and does not establish general support for all vendor pseudo-elements.
- Original import recursion, media wrappers and CSS-text deduplication are preserved. Unreadable sheets are skipped as upstream does. Cyclic imports terminate; excessive depth/work/CSS bytes fail with OUTPUT_LIMIT. There is no document-global cache in the new path.
- `src/engine/snapdom-extension.ts` / `src/dom/prepare.ts`: call-owned collector binding, cancellation/checkpoint checks, failure poisoning and callback release on dispose.
- `scripts/engine-supply.mjs`: exactly one fixed-version `Vs` collector call is replaced; hash/version/count guards and generated provenance remain enforced. Upstream `yo`/`Vf` bodies are preserved but `Vs` no longer calls document-global `Vf`.
- Existing `mapCssUrls`, SVG validation and URL allowlists remain unchanged. Related `var()`, unknown unsafe rules and media syntax can still be rejected. This is not new CSS-variable or arbitrary stylesheet support.
- Regression files: `test/unit/scrollbar-css.test.mjs`, extension/supply unit additions, `test/browser/css-boundary-regression.html` and `.mjs`, with two resource-server routes.

## Fresh verification

- Initial `npm run verify`: PASS, including typecheck, build, unit 82/82, consumer 6/6, license and documentation gates. Initial log: `output/verification/2026-10-23-css-boundary/implementation/verify.log`.
- Final `npm run verify` after the hover regression fix: PASS, including unit 84/84, consumer 6/6, typecheck/build/licenses/docs. Final log: `output/verification/2026-10-23-css-boundary/implementation/verify-after-hover.log`.
- Focused initial unit regression: 18/18 PASS. Independent Chrome/WebKit actual Table CSS subsequently exposed a thumb:hover unknown-rule failure in both browsers (46/48 matrix conditions passed). The actual two-host Table hover selector was added as a focused failing regression before correction: `implementation/hover-regression-before.log` (7 PASS / 1 FAIL), then `hover-regression-after.log` (9/9 PASS). Root cause: trailing hover forced unknown retention, leaving unrelated var() CSS in SVG. Only exact trailing hover/active tokens are now ignored for conservative host-superset relevance; related/mixed/unknown unsafe CSS still rejects. Recorded browser failures: `verification/css-matrix-real-table-failing.json` and `verification/css-real-table-failing/`. The authored Table fixture is explicitly an excerpt with hover, not the complete installed stylesheet.
- License evidence: generated modified engine retains upstream MIT license and component/version/source/original/license/candidate hashes; license gate PASS.
- Independent browser and security verification are delegated separately. This implementation-stage report does not claim their results. New browser fixture exposes `cssBoundaryRegressionResults` / `cssBoundaryRegressionFiles` and checks clean/plain/Table/var/empty, related and mixed rules, original ancestor context, conservative unknown/media rejection, hidden URL exclusion, ordinary pseudo content and sequential target sessions in both directions.

## Limits and remaining work

- Native Safari was not rerun because its existing authentication/automation blocker remains. WebKit evidence cannot establish native Safari support.
- Browser network interception and actual site UI/export verification belong to the independent final verification stage; not passed by unit tests or fixture authorship.
- The conservative unknown path deliberately retains rules and can reject a capture that a general CSS interpreter might support. Budget exhaustion rejects instead of silently omitting styles.
- No release readiness or general browser support claim is made.

## 최종 독립 검증 및 인수 결과

- 계획 Sol/high, 구현 Sol/medium, 독립 기능·보안 검증 Sol/high로 배정했다. 명시적 모델 인자로 역할을 실행했으며 실제 런타임 모델 메타데이터는 노출되지 않았다. Git·PR·배포 작업을 수행할 경우 Sol/medium을 적용하며 이번 작업에서는 수행하지 않았다.
- 최종 후보의 `npm run verify` PASS: unit 84/84, consumer 6/6, typecheck/build/licenses/docs. 로그: `output/verification/2026-10-23-css-boundary/implementation/verify-after-hover.log`.
- 최초 독립 실제 Table CSS 검사에서 thumb:hover 규칙 유입을 발견했다. 수정 전 집중 회귀 7 PASS/1 FAIL, 수정 후 9/9 PASS를 기록했다. 알려진 native pseudo 뒤 정확한 hover/active 상태만 host 상위집합으로 선별하고 관련·unknown 규칙은 기존 검증에 남겼다.
- 최종 Chrome 155 DPR1/DPR2 및 WebKit 26.5 DPR2에서 영향받는 8 suite × 3 환경 = 24/24 PASS. 독립 CSS 조건은 56/56 PASS이며 unsafe CSS URL capture 단계 취득은 0건이다.
- clean/plain/unrelated-var/실제 Table CSS 조건의 PNG는 Chrome 및 WebKit 각 브라우저 안에서 바이트가 동일했다. 일반 CSS 전체의 시각적 보증은 아니다.
- 사이트 한영 quick-start/single-output 4개 UI PASS. 정적 Astro 번들의 확인된 export 경계에서 검증 브라우저 응답만 최종 후보 모듈로 연결했다. 경로별 실제 후보 JS 20개 응답의 SHA를 dist manifest와 대조했고 320×240 PNG preview decode·원본 DOM 불변을 확인했다. 원본 사이트에 설치된 0.0.1을 업그레이드하거나 배포하지 않았다.
- 후보 모듈을 실행하지 못했던 첫 사이트 응답 대체 시도는 검증 방법 실패로 별도 보존했다. 원래 사이트 0.0.1의 실패를 수정 후보의 제품 실패로 집계하지 않았다.
- 최종 검증 대상 src/dist/scripts/test/package 1,764개 해시는 전후 동일했다. 사이트 src 373개·설치본 81개·후보 dist 45개도 전후 동일했다. 독립 검증 증거: `output/verification/2026-10-23-css-boundary/verification/summary.json`, `review.md`, `site-ui.json`, `png-identity.json`.
- 보안 변경분 검사 `143dfad2-6ebd-4819-a7a1-008e6394d2c0` 완료: 고정 snapshot `ceb846e67c5547c062570977a1c9a277c85969cf55de217b977d64695007be2c`, authoritative source/config/tooling 24개 직접 검토, 후보·확정 취약점 0건. 전체 저장소·vendor·신규 advisory 감사나 런타임 공격 검증을 의미하지 않는다. 앞선 snapshot 검사는 hover 수정으로 대상이 바뀌어 partial/deferred로 보존했으며 최종 인수 근거로 사용하지 않았다.
- 검증 소유 6070/6071/6073/6074 서버와 브라우저를 종료하고 기존 사이트 4328 서버는 보존했다.
- 네이티브 Safari는 기존 OS 인증/automation 차단으로 미실행이다. WebKit을 Safari 인수 근거로 대체하지 않았다. 원격 CI·운영 확인·commit/push/PR·publish/deploy도 미실행이며 release readiness를 주장하지 않는다.

## 로컬 후속 문서 정리 · 2026-10-23

- 0.0.1 게시 역사를 보존하고 HANDOFF·release-readiness 상단에 현재 0.0.2 로컬 후보의 인수 요약과 미실행 게이트를 구분했다. 지원 guide·영문 browser08·생성 국문 browser08은 최종 CSS 증거와 좁은 SVG flow 한계를 반영했다. 국문은 기존 koreanReference 함수로 해당 파일만 동기화했다.
- 배포 범위 밖 `output/verification/2026-10-23-css-boundary/follow-up/`에 실제 PR이 아닌 제품 변경 PR 초안·완료 기준표를 작성했다. 읽기 전용 GitHub 조회(2026-10-23)의 default branch를 따라 PR base는 codex-governance-v111로 적고, head는 아직 미생성 제안으로 구분했다. 기존 Governance/모델 설정 dirty는 별도 취급한다.
- final-summary·독립 summary/review·최종 verify 로그와 SVG flow/CSS worklog를 근거로 재사용했다. 새 전체 verify·브라우저·보안 scan·최종 pack artifact는 실행하지 않는다. 이번 문서 단계의 check:docs·diff hygiene·배포예정 목록 dry-run 결과와 runtime 해시 비교는 follow-up 증거를 따른다. dry-run은 추출/설치/Gitleaks/registry/OIDC 또는 최종 artifact 인수가 아니다.
- 최종 후보 native Safari/대표 native UI·최종 package artifact/provenance/보안 조건·원격 CI·명시적 게시 승인과 운영 반영은 미실행이다. releaseReady=false를 유지하며 기존 source/test/package/dist/.codex 및 사이트는 변경하지 않는다. 변경 resource-server의 독립 후속 research는 전체45 PASS·환경 차단1(listen EPERM)을 보존하고 해당 항목만 허용 환경에서1/1 PASS했다. 전체 명령의46/46 PASS로 표현하지 않는다.

- 문서 후속의 `check:docs`와 `git diff --check` PASS. package 파일목록 dry-run은 기본 npm cache의 EPERM 환경 실패 뒤 task-owned cache로 재시도하여 PASS했다. 오류 경로는 placeholder로 정리했고, 재시도 cache 디렉터리는 저장소 밖 임시 위치로 옮겼다. `.tgz`는 생성하지 않았다. 배포예정 83파일에서 AGENTS/.codex/test/output/development/worklogs 제외, 공개 dist·vendor LICENSE/provenance·THIRD_PARTY_NOTICES·제품 LICENSE 포함을 확인했다. source/dist/scripts/test/package 1,764파일은 문서 후속 전후 모두 동일했다. 문서 후속 로그와 해시는 follow-up에 보존한다.
