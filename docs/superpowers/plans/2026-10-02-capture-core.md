# Comins Capture Core Implementation Plan

> 2026-10-04 실행 승인 갱신: 사용자가 SnapDOM 3.2.0 조건부 채택을 확정하고 잔여 검증 후 프로젝트 구조·README·플레이그라운드·코민스 사이트·공식 가이드 작성을 지시했다. 과거의 채택 보류/전체 gate 통과 전 착수 금지는 이 승인으로 대체한다. 실패·미검증 항목은 릴리즈 조건으로 유지하며 공개 배포는 이번 실행에 포함하지 않는다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. If the maintainer explicitly chooses delegation, use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking. 실행 방식 권고는 동일 세션 직접 순차 수행이며, 이 계획 작성은 구현 실행 승인이 아니다.

**Goal:** 브라우저 DOM의 고정 상태를 PNG/JPEG/WebP/SVG·Canvas와 지정 크기·용지·타일로 내보내는 프레임워크 독립 Core를 구현한다.

**Architecture:** Comins가 입력·좌표·자원·출력·수명주기 계약을 소유하고 단일 외부 엔진을 내부 adapter 뒤에 둔다. capture는 고정 snapshot을 만들고, 출력은 원본을 다시 읽지 않으며 snapshot을 재사용한다. 엔진 채택 전 검증이 실패하면 엔진 의존 작업만 중단하고 공개 API·기하 계산 작업은 진행할 수 있다.

**Tech Stack:** TypeScript ESM, npm lockfile, tsc 타입·선언 생성, esbuild 브라우저 번들, Node test runner, Playwright 자동 회귀 및 실제 Safari 직접 조작. 연구 대상 엔진은 `@zumer/snapdom@3.2.0`이며 G1~G4 통과 후에만 제품 runtime dependency로 추가한다. Core에 프레임워크 runtime을 넣지 않는다.

**Spec:** [초기 API·지원 범위 명세](../../api-spec.md). [추가 검증·준비 상태](../../implementation-readiness.md)와 함께 읽는다.

**승인된 추진 방향(2026-10-04):** [외부 엔진 기반 완성과 자체 엔진 전환 계획](2026-10-04-engine-transition.md)을 따른다. 이 문서의 Task 0~8은 첫 제품 완성 단계의 상세 실행 계획이다. 외부 엔진 기반 제품·회귀 자료를 먼저 확보한 뒤, 동일한 계약을 충족한 자체 엔진으로 교체한다. SnapDOM 채택 조건은 그대로 유지한다.

**자원 준비 상세화(2026-10-04):** [책임·공수·P0 검증 계획](2026-10-04-resource-preparation.md)에 따라 원본 읽기→자원 수집·해결→준비 DOM→엔진 호출을 분리한다. 아래 내부 타입·Task 3·4·6에 반영했으며 공개 API와 엔진 채택 조건은 변경하지 않는다.

**최우선 수용 기준:** 범용 엔진 기반 초기 기능 완성·첫 릴리즈와 향후 자체 엔진으로 교체 가능한 구조를 함께 충족한다. 내부 계약·adapter·공통 테스트는 필수이며, 미래 교체만을 위한 범용 준비 계층이나 두 번째 엔진 구현은 초기 릴리즈 조건이 아니다. 자원 준비 상세 계획은 현재 계약을 충족하는 최소 보완에 한정하며 전체 공수 추정을 필수 구현 범위로 취급하지 않는다.

## Global Constraints

- 계획 기준일은 2026-10-02. 사용자 명세 검토 완료 후 작성했다. 2026-10-04에 Task 0을 부분 실행했으며 실제 완료한 항목만 체크한다.
- 단일 엔진, 브라우저 내부 실행, foreignObject SVG 허용. PDF·녹화·WebView·의미 단위 분할·reflow는 범위 밖이다.
- 일반 래스터 기본 CSS 1배, paper 기본 ISO·portrait·300 PPI, DPR 명시 선택. `contain`·중앙 정렬·여백 0, 감지된 미지원은 기본 오류를 계획 기준으로 사용한다.
- 기본 `failure: 'error'`, `resources.network: 'deny'`, credentials omit. allow-partial은 네트워크 권한·형식·크기 계약을 완화하지 않는다.
- capture/각 출력 timeout 30,000ms, JPEG/WebP quality 0.92. 래스터 단일 32,000,000px/8192px, 분할 가상 합계 256,000,000px/100타일. 실기기 검증 전 정책 수치이며 자동 축소하지 않는다.
- 원본 변경·전역 fetch 교체·CSP/CORS 완화·공유 캐시·자동 엔진 fallback 금지. DOM 없는 import는 안전하고 엔진 로딩은 capture 시점으로 미룬다.
- 공통 정책은 Governance가 소유한다. `AGENTS.md`에는 이 모듈의 명령·API·검증만 추가한다. 제품 구현 시 `comins-reference`를 적용한다.
- 현재 `.git`·package 기준선 없음. 기존 docs와 output 증거를 보존한다. 원격 저장소가 비어 있다고 가정하지 않는다.
- 계획의 npm 명령·파일은 **새로 만들 예정**이다. 현재 실행 가능하거나 테스트를 통과했다고 보고하지 않는다.
- 제품 구현 승인 후 로컬 작업만 수행한다. remote write·PR 생성·태그·Release·publish·파괴 작업은 별도 명시 승인이 필요하다. 첫 commit 전 필수 hook을 준비하며 Git 미준비 시 commit 단계만 보류한다.

## Review Focus

1. 준비 콜백이 영원히 끝나지 않거나 취소 후 늦게 완료되어 capture·Document lock이 남는 경우: Task 6의 `ready-abort.test.ts`.
2. 다른 same-origin Document/iframe의 요소에 현재 window의 DPR·생성자를 잘못 적용하는 경우: Task 4의 `owner-document.spec.ts`.
3. 폰트 family 하나의 정상 face가 같은 family의 다른 weight/subset 누락을 가리는 경우: Task 3의 `font-faces.spec.ts`.
4. 스타일시트 baseURI·상대 URL·redirect 때문에 허용 origin 판단과 실제 요청 목적지가 달라지는 경우: Task 3의 `resource-policy.spec.ts`.
5. iterator 미시작·break·오류·dispose 조합이 다음 출력까지 BUSY로 남기는 경우: Task 7의 `tiles-lifecycle.test.ts`.

## 작업 의존성과 완료 수준

`Task 0`은 엔진 채택 가능성 검증이다. `Task 1 → Task 2`는 G1~G4 결과와 독립적으로 진행 가능하다. 제품 엔진을 호출하는 `Task 3 → Task 4 → Task 5 → Task 6 → Task 7`은 Task 0 통과 후 진행한다. `Task 8`은 소비·브라우저·패키지 확인으로 마무리한다. 순서는 같은 작업자의 진행 순서이며 병렬 에이전트를 자동 생성하지 않는다.

Task 2 완료는 순수 계약 기반 Core이며 캡처 가능 제품이 아니다. Task 6 완료는 단일 출력의 통합 경로, Task 7 완료는 초기 기능 경로, Task 8 완료는 검증한 조합에서 배포 준비 상태다. npm 배포는 이 계획에 포함하지 않는다.

## 예정 파일과 책임

| 경로 | 책임 |
|---|---|
| `src/index.ts`, `src/types.ts`, `src/errors.ts` | 공개 API·판별 union·정제된 오류 |
| `src/geometry/{paper,layout,tiles}.ts` | 용지 표·crop/fit·공유 타일 경계, DOM 접근 없음 |
| `src/resources/{manifest,policy,resolve,verify}.ts` | 자원 identity·요청 허용·해결·삽입 증거 |
| `src/dom/{target,state,capabilities,prepare}.ts` | 원본 관찰·지원 진단·해결된 자원으로 별도 준비 DOM 구성 |
| `src/engine/{contract,snapdom-adapter}.ts` | 내부 인터페이스·조건부 채택한 엔진 통합 |
| `src/output/{raster,svg,tiles}.ts` | 정확한 크기·형식 검증·수동 타일 생성 |
| `src/lifecycle/{operation,locks}.ts`, `src/{capture,snapshot}.ts` | 취소·시간 제한·동시성·공개 흐름·dispose |
| `test/unit`, `test/types`, `test/browser`, `test/fixtures` | 순수 로직·타입·브라우저·합성 입력 |
| `examples/{vanilla,react,vue,svelte}` | 각 프레임워크 소비·언마운트·빌드 검증 |
| `scripts/{build,test-unit,verify-consumer,check-licenses,check-engine-evidence}.mjs` | 정해진 로컬 작업 실행·라이선스 경계·증거 판정 |
| `docs/engine-adoption.md`, `docs/support-matrix.md` | 엔진 결정과 실제 환경별 지원 증거 |

Task 0의 임시 실험은 기존 `output/playwright/workbench/`에 추가하되 기존 UUID 결과를 덮어쓰지 않는다. product src는 이 연구 도구를 import하지 않는다. 타사 배포 코드·폰트·번들 전체를 src로 복사하지 않는다.

## 공통 내부 타입과 명령 계약

Task 1에서 정의하고 이후 task가 이름을 바꾸지 않는다.

- `Rect = { x:number; y:number; width:number; height:number }`, `Size = { width:number; height:number }`.
- `OperationContext = { signal:AbortSignal; deadline:number; checkpoint():void; onCleanup(fn:()=>void):void }`. deadline은 작업 시간 기준의 절대 시각이며 performance.now 계열을 한 컨텍스트에서 일관되게 사용한다.
- `LayoutPlan = { sourceRect:Rect; outputSize:Size; contentRect:Rect; scaleX:number; scaleY:number; clipRect:Rect; background:string|null; paper?:PaperMeta }`.
- `ResourceManifest = { entries:readonly ResourceEntry[]; unverifiable:readonly Diagnostic[] }`. `ResourceEntry`는 ID·종류·해결 전 절대 URL·baseURI·사용 노드 참조·font face 키를 내부적으로 보유하며 public metadata로 노출하지 않는다.
- `ResolvedResources = ReadonlyMap<string, { blob:Blob; mime:string }>`; 인메모리 참조별 URL 해제는 operation/snapshot 소유자가 수행한다.
- `ResourceSource = { document:Document; root:HTMLElement }`는 읽기 대상 원본이며 변경 권한을 뜻하지 않는다.
- `SourceInspection = ResourceSource & { rect:Rect; state:SourceState; diagnostics:readonly Diagnostic[] }`는 준비 전 원본 관찰 결과다.
- `PreparedSource = { document:Document; root:HTMLElement; rect:Rect; state:SourceState; manifest:ResourceManifest; diagnostics:readonly Diagnostic[] }`. root는 해결된 자원이 적용된 별도 입력이며 rect/state는 원본 기준이다. 원본 참조는 SourceInspection에 보존하고 준비 DOM과 혼용하지 않는다.
- `SourceState` 타입은 Task 1에서 정의한다. 필드는 내부 전용 `domRevision:number`, `rootRect:Rect`, `activeElement:Element|null`, `documentScroll:{x:number;y:number}`, 요소 참조별 `controls`(value/checked/selectedIndex/selectionStart/selectionEnd), `scrollPositions`(x/y), 문서 selection의 anchor/focus 참조·offset이다. Task 4가 이 타입을 실제로 수집·비교한다.
- `EngineArtifact = { svg:string; sourceSize:Size; evidence:readonly EmbeddedResourceEvidence[]; dispose():void }`. SVG 문자열만으로 실제 자원 manifest를 재구축했다고 가정하지 않는다.
- `EngineAdapter.capture(source:PreparedSource, resources:ResolvedResources, context:OperationContext):Promise<EngineArtifact>`; `renderTile(artifact:EngineArtifact, layout:LayoutPlan, outputRect:Rect, context:OperationContext):Promise<HTMLCanvasElement>`.
- `EmbeddedResourceEvidence`는 manifest ID와 해당 face/source가 출력에서 사용 가능한 상태인지 연결한다. engine warning을 증거의 전부로 삼지 않는다.

공개 `CaptureOptions`, 출력별 옵션 union, `CaptureSnapshot`, `CaptureOutput<T>`, metadata·Diagnostic는 명세 3~10절의 필드를 Task 1에서 완전한 타입으로 작성한다. PaperMeta·ResourceEntry·EmbeddedResourceEvidence 등 참조 타입도 같은 단계에서 선언하여 후속 구현 파일이 없어도 타입 검사가 가능해야 한다. raw DOM 내용은 내부에서만 유지한다. callback의 원시 error/cause는 public error에 직렬화하지 않는다.

Task 1이 정의할 명령:

| 명령 | 동작 |
|---|---|
| `npm run typecheck` | 제품 및 타입 소비 테스트의 tsc noEmit |
| `npm run test:unit -- <filter>` | TypeScript 테스트를 `.test-build`에 컴파일 후 Node test runner로 해당 파일 실행; 인자 없으면 전체 unit |
| `npm run build` | ESM dist 및 declaration 생성; runtime engine은 external, 테스트·연구 파일 제외 |
| `npm run test:consumer` | dist exports·선언·SSR import 검증, Task 8에서 구현 |
| `npm run check:licenses` | `scripts/check-licenses.mjs`로 dependency/배포 대상 자료의 라이선스 증거를 확인, Task 8에서 최종 연결 |
| `npm run test:browser -- <file>` | Playwright의 특정 회귀 파일. Task 3에서 구현 |
| `npm run verify` | 라이선스 경로 확인·typecheck·전체 unit·build·consumer; Task 8에서 최종 조합 |

현재 관찰한 Node 24/npm 11을 개발 기준으로 시작하고 정확한 도구 버전·lockfile을 Task 1에서 기록한다. 인접 저장소의 버전을 최신 버전으로 단정하거나 `latest` 범위를 그대로 고정하지 않는다. 후보 도구는 TypeScript·esbuild·@playwright/test뿐이며 타입 패키지와 프레임워크 예제 의존성은 해당 task에서 추가한다. 변경 전 라이선스·번들·lockfile 영향을 확인한다.

## Task 0: 엔진 계약 검증

**2026-10-04 상태: 진행 중·채택 보류.** [중간 보고서](../../engine-adoption.md). Chrome/Safari 각 5건 실행. G1/G3 기본 호출 부적합, Safari G4 타일 내용 불일치, G2 미검증. 사례 행렬·시각 증거는 미완료이며 Task 3~7 착수 조건을 충족하지 못했다.

**후속 상태와 다음 실행 순서:** Chrome·실제 Safari의 준비 자원 7개/경계 8개 비교는 완료했으나 범용 수집·준비는 미검증이다. [P0 연구](2026-10-04-resource-preparation.md)에서 실제 원본→준비 DOM의 외형·자원·부작용을 먼저 확인하고 G1 잔여 행렬→G2→G3→G4를 진행한다. 미검증 체크박스를 완료 처리하거나 자체 엔진 개발을 선행하지 않는다.

**Files:** 수정 `output/playwright/workbench/{server.py,index.html,app.mjs,fixture.mjs}`; 생성 `output/playwright/workbench/engine-contract.mjs`, `scripts/check-engine-evidence.mjs`, `test/research/engine-evidence.test.mjs`, `docs/engine-adoption.md`. 결과는 `output/research/engine-contract/<run-id>/`.

**Interfaces:** 입력은 SnapDOM 3.2.0 고정 배포본과 [G1~G4](../../implementation-readiness.md). 출력 보고서는 `{ engine, version, browser, fixtureRevision, gates: { G1,G2,G3,G4 }, artifacts }`; 각 gate 상태는 `pass | fail | unverified`, 각 증거 경로는 실제 파일이어야 한다. checker는 환경·필수 사례·증거가 모두 갖춰진 결과만 pass한다.

- [x] `engine-evidence.test.mjs`에 필수 gate 없음·미검증·누락된 증거 파일을 거부하고, 완전한 합성 fixture만 통과하는 검사부터 작성한다. `node --test test/research/engine-evidence.test.mjs`의 초기 실패 원인을 확인한다.
- [x] `check-engine-evidence.mjs`를 구현하여 임의 입력을 성공으로 정규화하지 않게 한다. 같은 테스트가 통과하는지 확인한다. 합성 pass는 실제 엔진 채택 증거로 사용하지 않는다.
- [ ] G1 fixture에 cold/warm 이미지·CSS background·폰트·외부 SVG, 오류·취소·재출력과 동시 앱 요청을 구성한다. 원본 준비와 capture 사이의 요청 장부를 구분한다. 앱의 요청은 유지하면서 엔진발 금지 요청만 0건이어야 한다.
- [ ] G2 fixture에 ID 없음·중복 ID·형제·open Shadow DOM·nested sticky·컨테이너 끝 경계를 구성한다. 공개 hook 또는 Comins 소유 매핑으로 결과를 얻고 원본 marker·opaque nodeMap/캐시 의존이 없는지 확인한다.
- [ ] G3 fixture에서 같은 family의 다른 face 누락·CSS 접근 불가·SVG 외부 참조 및 활성 콘텐츠를 검사한다. 소비자에게 반환할 SVG를 별도 문서와 img로 열어 요청·실행을 확인한다. 변환 자체가 임의 내용을 실행하지 않아야 한다.
- [ ] G4 fixture에 작은 타일 접합과 20000×10000 가상 출력을 넣는다. 연구 전용 계측으로 생성 Canvas의 최대 크기를 기록한다. 모든 타일 반환, 치수 일치, 전체 크기 Canvas 없음·축소 없음이 통과 기준이다.
- [ ] Chrome과 실제 Safari에서 동일 사례를 실행하고 `node scripts/check-engine-evidence.mjs <report.json>`으로 기록 완전성을 확인한다. 시각 비교는 원본 기준 화면과 결과를 보존하고 비교 범위를 적는다. checker pass와 시각 pass를 분리한다.
- [ ] `docs/engine-adoption.md`에 adapter 확장 경로·공개 API 의존·실패 조건을 기록한다. G1~G4가 모두 통과하면 명세 적합성에 근거해 SnapDOM 채택 권고를 제출한다. 원본 훼손·전역 patch·엔진 fork가 필요하면 해당 통합을 중단하고 대안 또는 범위 변경을 검토한다. 조용히 다른 엔진으로 바꾸지 않는다.

**완료:** 채택 가능성에 대한 증거 기반 pass/fail. 불가능 결론도 연구 task 결과지만, 후속 엔진 통합의 완료나 진행 허가로 취급하지 않는다.

## Task 1: 독립 패키지 경계와 공개 계약

**Files:** 생성 `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.build.json`, `tsconfig.test.json`, `scripts/{build,test-unit}.mjs`, `.gitignore`, `src/{index,types,errors}.ts`, `src/engine/contract.ts`, `test/unit/errors.test.ts`, `test/types/options.test.ts`, `AGENTS.md`. Governance 채택 파일은 공식 skill 결과에 따른다.

**Interfaces:** 명세의 공개 타입·CaptureError 및 위 내부 타입. 아직 capture 성공을 반환하는 가짜 공개 함수를 배포하지 않는다. Task 6 전에는 구현 미완료 상태로 유지한다.

- [ ] 의도한 GitHub 저장소의 존재·기본 브랜치·파일 유무를 read-only로 확인하고 로컬 docs/output 보존 방법을 기록한다. remote에 이력이 있으면 독립 checkout과 보존 파일 통합을 우선하고 무조건 `git init`하지 않는다.
- [ ] 구현 승인 범위에서 저장소·로컬 브랜치 `codex-capture-core`·Governance 채택을 준비한다. 기존 브랜치가 있으면 충돌 없이 접미사를 사용한다. 첫 commit 전 Gitleaks hook을 준비한다. 원격 push는 하지 않는다.
- [ ] 개발 의존성과 npm scripts를 위 명령 계약대로 구성한다. ESM `.` export는 dist JS/types만 공개하고 CSS 없는 Core는 `sideEffects:false`로 선언한다. `files`는 dist·공개 문서·LICENSE·필수 notices로 한정한다. Task 0 통과 전 제품 엔진 의존성을 추가하지 않는다.
- [ ] 타입 소비 테스트에 SVG+ppi, Canvas+quality, size kind 필드 혼용의 `@ts-expect-error`와 허용 조합을 작성한다. 오류 테스트는 합성 URL·입력값을 가진 내부 예외가 public message/diagnostics/cause/JSON에 새지 않는지 확인한다.
- [ ] `npm run typecheck`와 `npm run test:unit -- errors`의 실패를 확인한 뒤 타입·정제된 CaptureError를 최소 구현한다. 타입 오류가 환경 미설치 때문이면 제품 RED와 구분한다.
- [ ] 같은 검증과 `npm run build`를 통과시킨다. public 타입은 엔진 타입을 import하지 않으며 DOM 없는 import에서 예외·엔진 eager import가 없도록 소비 smoke를 준비한다. 변경 파일만 검토한 후 로컬 commit 단위로 정리한다.

**완료:** 빌드·검사 가능한 독립 타입/오류 경계. npm 이름 가용성·출시 버전은 출판 판단이며 이 단계에서 등록·공개하지 않는다.

## Task 2: 크기·용지·타일 기하

**Files:** `src/geometry/{paper,layout,tiles}.ts`, `test/unit/geometry/{layout,paper,tiles}.test.ts`, `docs/paper-presets.md`.

**Interfaces:** `planRaster(source:Size, options:RasterOutputOptions, capturedDpr:number):LayoutPlan`; `planSvg(source:Size, options:SvgOutputOptions):LayoutPlan`; `planTiles(layout:LayoutPlan, tile:Size):readonly Rect[]`. SVG outputSize는 선택한 논리 단위이며 viewBox 변환을 metadata와 함께 정의한다.

- [ ] A4 300→2480×3508, 150→1240×1754, 사방10mm→content2244×3272, 640×420→800×800 contain의 y=137.5, cover 잘림·stretch 축별 배율을 테스트로 고정한다.
- [ ] crop 소수·경계 밖·NaN/Infinity·0px 반올림·안전 정수 초과·한도 초과를 오류로, DPR2 명시 선택만 1280×840으로 검증한다. `device`는 출력 시 현재 DPR이 아니라 capturedDpr를 사용한다.
- [ ] 2500×3500/1024 분할의 12개·마지막 Rect(2048,3072,452,428)·전체 면적 8,750,000·중복 0을 검증한다. 20000×10000/2048은 50개·가상200M로 허용하고, 256M/100타일 초과는 거부한다.
- [ ] `npm run test:unit -- geometry`가 `test/unit/geometry/`의 세 파일을 선택하도록 하고 RED를 확인한다.
- [ ] 접근 가능한 공식 원문으로 용지 표를 대조하여 `docs/paper-presets.md`에 조회일·치수·출처를 기록한다. 특히 ISO B3 원문 대조가 실패하면 그 preset 검증을 미완료로 남긴다. 다른 기하 구현은 진행한다.
- [ ] 순수 함수로 구현하고 같은 테스트를 통과시킨다. 표의 mm 값을 직접 저장하고 연속 절반 계산으로 반올림 오차를 누적시키지 않는다. DOM·엔진 import가 없는지 확인하고 로컬 commit 단위로 정리한다.

**완료:** 엔진과 독립적인 정확한 출력 계획. 아직 렌더링·실물 프린트 검증은 아니다.

## Task 3: 자원 수집·허용 정책·삽입 증거

**선행:** Task 0 통과, Task 1. **Files:** `src/resources/{manifest,policy,resolve,verify}.ts`, `test/unit/resource-policy.test.ts`, `test/browser/{resource-policy,font-faces}.spec.ts`, `test/fixtures/resources/*`, `scripts/serve-fixtures.mjs`, `playwright.config.ts`.

**Interfaces:** `collectResources(source:ResourceSource, context:OperationContext):Promise<ResourceManifest>`; `resolveResources(manifest:ResourceManifest, options:ResourceOptions, document:Document, context:OperationContext):Promise<ResolvedResources>`; `verifyResources(manifest:ResourceManifest, evidence:readonly EmbeddedResourceEvidence[]):readonly Diagnostic[]`. 수집 입력은 원본 document/root이며 준비 DOM 생성에 의존하지 않는다. Task 3 fixture도 원본 ResourceSource를 사용하고 Task 4의 prepareSource를 먼저 호출하지 않는다.

- [ ] 서버 요청 장부로 default deny와 소비자 resolve만 사용한 capture의 추가 네트워크 0건을 검증한다. HTTP·HTTPS URL만 네트워크 허용 경로로 받고, 상대 URL은 실제 소유 stylesheet/Document baseURI로 해석한다. data/blob 경로와 HTTP 요청을 분리한다.
- [ ] origin allowlist·same-origin credentials·교차 출처 credentials omit·redirect error·404/CORS/CSP·타임아웃·취소를 테스트한다. 테스트 request interception으로 금지 요청을 막아 생산 코드 성공처럼 보이게 하지 않는다.
- [ ] 같은 family의 normal/bold·서로 다른 unicode-range 중 한 face만 누락, 사용하지 않은 face, CSS import 읽기 불가, pseudo/background/image-set 및 SVG 참조를 fixture로 작성한다. 필요한 face별 누락이 실패하고 정상·미사용 face는 잘못 실패하지 않아야 한다.
- [ ] `npm run test:unit -- resource-policy` 및 `npm run test:browser -- resource-policy.spec.ts` / `font-faces.spec.ts`의 RED를 확인한다. TypeScript가 요구하는 나머지 내부 타입의 최소 정의를 먼저 맞추되 dummy pass를 만들지 않는다.
- [ ] G1/G3에서 채택한 경로로 수집·해결·검증을 구현한다. 이미지 박스 삭제 대신 지정된 partial 처리, font fallback 진단, 안전하게 검증할 수 없는 필수 자원 오류를 구현한다. 취득 순서는 재사용 데이터→소비자 resolve→허용 fetch다.
- [ ] 동일 테스트 GREEN과 요청 기록을 확인한다. 오류에 URL·입력값을 넣지 않는다. 동작·보안 영향에 맞는 diff 보안 경로를 수행한 뒤 로컬 commit 단위로 정리한다.

**완료:** 자원별 manifest와 요청 통제가 검증됨. 엔진 경고 또는 data URI 개수만으로 완전성을 판정하지 않는다.

## Task 4: 대상 상태와 엔진 adapter

**선행:** Task 0·2·3. **Files:** `src/dom/{target,state,capabilities,prepare}.ts`, `src/engine/snapdom-adapter.ts`, `test/browser/{owner-document,layout,source-state}.spec.ts`, `test/fixtures/layout/*`.

**Interfaces:** `inspectSource(target:CaptureTarget, context:OperationContext):Promise<SourceInspection>`; `prepareSource(source:SourceInspection, manifest:ResourceManifest, resources:ResolvedResources, context:OperationContext):Promise<PreparedSource>`; `readSourceState(source:ResourceSource):SourceState`; `compareSourceState(before:SourceState, after:SourceState):readonly Diagnostic[]`; Task 1의 EngineAdapter 구현. SourceState는 원본의 요소 순서·값/체크/선택·focus·scroll·경계·관찰 변경 revision을 내부적으로 기록한다.

- [ ] 다른 same-origin Document의 HTMLElement를 전달해 생성자 instanceof 오판·전역 window DPR·document.fonts 오사용이 없는지 테스트한다. target.document와 ownerDocument가 일치하고 접근 불가 Document는 정제된 오류여야 한다.
- [ ] border box clip·소수 위치·현재 내부 scroll·nested sticky·끝 경계·fixed·viewport·document·open shadow를 fixture로 테스트한다. full document에서 현재 fixed/sticky를 중복 배치하지 않는다.
- [ ] 네이티브 폼은 기본 오류·명시 partial, 검증된 CSS 폼은 값·외형 보존을 테스트한다. `appearance:none` 하나만으로 pass하지 않는다. unsupported iframe/닫힌 shadow 등 감지 범위와 감지 불가 범위도 진단 문서에 기록한다.
- [ ] 자원 해결 후에만 준비 DOM을 생성하고 미해결 필수 자원이 있으면 엔진을 호출하지 않는다. 원본→준비 노드 대응·기하·계산 스타일을 비교하고 생성/연결 때 암묵 요청·custom element 부작용이 없는지 확인한다. 구현 범위는 P0에서 검증한 경로를 근거로 하며 원본 외부 CSS가 다시 적용되지 않아야 한다.
- [ ] `npm run test:browser -- owner-document.spec.ts` / `layout.spec.ts` / `source-state.spec.ts` RED를 확인한다. 원본 marker 없음, 입력값·selection·focus·scroll·스타일 보존을 원본 reference와 비교한다.
- [ ] G2에서 검증한 매핑으로 adapter를 구현한다. 크기·형식 옵션은 Comins가 정규화하고 엔진 자동 축소·fallback·공유 캐시를 허용하지 않는다. 엔진 import는 browser capture 내부에서 지연한다.
- [ ] GREEN과 실제 Safari 대표 폼·sticky 관찰을 저장한다. source 변경은 SOURCE_CHANGED, 변환된 원시 엔진 예외는 ENGINE_FAILED로 정제한다. 라이선스/엔진 의존성/lockfile 검토 후 로컬 commit 단위로 정리한다.

**완료:** 지원한 입력에서 고정 EngineArtifact 획득. placeholder PNG 하나 생성으로 완료 판정하지 않는다.

## Task 5: 단일 출력과 SVG

**Files:** `src/output/{raster,svg}.ts`, `test/browser/{output-formats,svg-isolation}.spec.ts`, `test/unit/output-options.test.ts`.

**Interfaces:** `renderRaster(adapter:EngineAdapter, artifact:EngineArtifact, layout:LayoutPlan, context:OperationContext):Promise<HTMLCanvasElement>`; `encodeBlob(canvas:HTMLCanvasElement, options:RasterBlobOptions, context:OperationContext):Promise<Blob>`; `serializeSvg(artifact:EngineArtifact, layout:LayoutPlan, context:OperationContext):Promise<string>`.

- [ ] PNG/WebP alpha·JPEG 흰색/명시 배경·quality 유효 범위·MIME fallback 거부·실제 치수 불일치 거부를 테스트한다. null Blob과 tainted Canvas도 정제된 오류여야 한다.
- [ ] SVG crop/viewBox·CSS/mm 크기·PPI 거부·script/event handler/외부 이미지·스타일 URL 제거/삽입 완료를 검증한다. SVG를 새 document와 img로 열 때 엔진발 추가 요청·실행 0건을 확인한다.
- [ ] `npm run test:unit -- output-options`와 `npm run test:browser -- output-formats.spec.ts` / `svg-isolation.spec.ts` RED를 확인한다.
- [ ] LayoutPlan을 사용하여 엔진 width/height 의미를 그대로 노출하지 않는 출력 경로를 구현한다. 전체 출력 한도 이내일 때만 단일 Canvas를 만들고, raster와 SVG의 metadata 단위를 구분한다. SVG toBlob은 문자열을 image/svg+xml Blob으로 변환한다. 브라우저 native 직렬화의 실제 MIME·decode 결과를 검증하며 임의 바이너리 파서를 만들지 않는다.
- [ ] GREEN과 Chrome·Safari 출력 표본을 확인한다. PPI는 픽셀 계산 메타데이터로 기록하고 파일 DPI 재작성은 하지 않는다. partial은 모든 형식에 상속한다. SVG 변경의 정식 보안 diff 검토와 로컬 commit 단위를 정리한다.

**완료:** 요청 형식·크기의 단일 출력. 동일 snapshot을 다른 형식으로 출력하면서 원본 DOM·네트워크를 다시 읽지 않는다.

## Task 6: capture·snapshot·수명주기 통합

**Files:** `src/lifecycle/{operation,locks}.ts`, `src/{capture,snapshot,index}.ts`, `test/unit/{operation,ready-abort}.test.ts`, `test/browser/{lifecycle,capture}.spec.ts`.

**Interfaces:** 공개 capture/CaptureSnapshot 완성. `runOperation<T>(options:{signal?:AbortSignal;timeoutMs:number}, work:(context:OperationContext)=>Promise<T>):Promise<T>`; `acquireDocument(document:Document):()=>void`; `createSnapshot(artifact:EngineArtifact, source:PreparedSource, adapter:EngineAdapter):CaptureSnapshot`.

- [ ] ready가 끝나지 않음·throw·취소 후 지연 resolve를 제어 가능한 promise/clock으로 재현한다. timeout/abort 이후 엔진을 시작하지 않고 Document lock이 해제되며 cleanup이 한 번만 호출됨을 단정한다. 30초 실대기로 검사하지 않는다.
- [ ] 같은 Document 동시 capture, 같은 snapshot 동시 output, 다른 Document, repeated dispose, dispose 중 인코딩, snapshot 획득 전 언마운트, 반환 Blob/Canvas 소비자 소유를 테스트한다.
- [ ] `npm run test:unit -- operation` / `ready-abort`, `npm run test:browser -- lifecycle.spec.ts` / `capture.spec.ts` RED를 확인한다.
- [ ] ready 이후 `inspectSource → collectResources → resolveResources → prepareSource → adapter.capture` 순서로 연결한다. 자원 대기 전 원본 상태를 보존하고 각 비동기 경계와 artifact 확정 전에 원본 SourceInspection을 기준으로 변경을 검사한다. 준비 DOM 상태를 원본 상태로 오인하지 않는다.
- [ ] 각 단계에 checkpoint와 finally 정리를 연결하고 늦은 callback 결과를 폐기한다. 취소 불가능한 동기 인코딩은 종료 후 폐기한다. capture signal은 생성 완료까지 적용하고 이후 output signal과 dispose를 사용한다.
- [ ] snapshot 생성 시 필요한 artifact 자원의 소유권을 operation에서 snapshot으로 이전한다. 생성 성공 직후 operation cleanup이 살아 있는 snapshot의 URL/자원을 해제하지 않고, 실패 경로에는 이전되지 않은 자원이 남지 않는지 테스트한다. 최종 SVG는 소비자에게 반환하기 전에 수명이 한정된 내부 blob URL 의존을 제거한다.
- [ ] 오류·status·진단을 공개 메타데이터로 변환한다. 변환 성공이 partial을 complete로 바꾸지 않게 하고 단위·snapshotId 일관성을 확인한다.
- [ ] 같은 테스트 GREEN 후 typecheck·전체 unit·build 및 해당 브라우저 묶음을 한 번 실행한다. 성공·실패·취소 후 임시 DOM·URL·listeners 누적이 없는지 확인하고 로컬 commit 단위로 정리한다.

**완료:** 공개 API로 단일 캡처/출력·취소·정리 가능. 타일 API는 다음 task까지 미완료다.

## Task 7: 순차 타일 출력

**Files:** `src/output/tiles.ts`, `src/snapshot.ts`, `test/unit/tiles-lifecycle.test.ts`, `test/browser/tiles.spec.ts`.

**Interfaces:** `iterateTiles(adapter:EngineAdapter, artifact:EngineArtifact, layout:LayoutPlan, options:TileOutputOptions, context:OperationContext):AsyncGenerator<CaptureTile>`; 공개 tiles 메서드는 이 iterator를 소유하며 next 첫 호출부터 완료/return까지 snapshot output lock을 유지한다.

- [ ] iterator만 만들고 next하지 않았을 때 lock을 잡지 않음, 1개 요청하면 1개만 렌더링, break/return/throw/dispose 후 lock 해제, 늦은 render 결과 폐기를 검증한다. 30초 timeout은 첫 next부터 전체 iterator 수명 기준이며 소비자 대기 시간도 포함한다.
- [ ] Task 2의 12/50타일 치수·순서·접합을 실제 렌더링으로 검증한다. partial 진단 상속, 중간 실패 시 이미 전달한 조각만 남고 다음 next가 throw함을 단정한다.
- [ ] `npm run test:unit -- tiles-lifecycle`와 `npm run test:browser -- tiles.spec.ts` RED를 확인한다.
- [ ] 전체 Canvas·전체 결과 배열 없이 per-tile render를 연결한다. 첫 결과 전 자원 검증 완료, 다음 요청에만 다음 타일 생성, 반환 영역은 정수 경계로 자른다. 소비자가 모든 타일을 보관하는 메모리를 내부 누수와 구분한다.
- [ ] GREEN 후 최대 Canvas 크기와 반복 종료 후 잔여 자원을 계측한다. 단일 Canvas와 분할 총합 한도를 서로 혼동하지 않는다. 실제 Safari 접합 결과와 중단 동작을 기록하고 로컬 commit 단위로 정리한다.

**완료:** 전체 iterator 정상 종료 때만 전체 출력 성공. 초기 고정 분할은 trim 마지막 조각이며 의미 단위 페이지 나눔이 아니다.

## Task 8: 소비 예제·실제 브라우저·배포 준비 검증

**Files:** `examples/{vanilla,react,vue,svelte}/*`, `scripts/{verify-consumer,check-licenses}.mjs`, `test/consumer/*`, `test/browser/frameworks.spec.ts`, `docs/{support-matrix,usage}.md`, `README.md`, `CHANGELOG.md`, 라이선스상 필요한 notices, `.github/workflows/ci.yml`.

**Interfaces:** 모든 예제는 package의 공개 import만 사용한다. snapshot/error 타입이나 엔진 내부 모듈을 deep import하지 않는다. examples의 프레임워크 의존성을 Core runtime 의존성에 넣지 않는다.

- [ ] 각 framework에서 렌더 후 capture·외부 자원 opt-in·오류 표시·크기 변경·crop·분할·언마운트 정리 흐름을 작성한다. 관련 framework stable 버전은 실행 시 공식 자료와 registry로 확인해 dev 의존성/lockfile 및 환경표에 기록한다. 다른 모듈의 peer 범위를 복사해 지원을 주장하지 않는다.
- [ ] SSR import에 DOM 모의 객체가 없어도 성공, capture 호출만 UNSUPPORTED_ENVIRONMENT, 브라우저 build 소비에서 ESM exports/types 해석 성공을 먼저 실패 테스트로 작성한다.
- [ ] `npm run test:consumer`와 `npm run test:browser -- frameworks.spec.ts`를 구현·실행해 GREEN으로 만든다. 공개 소비 예제만 빌드하고 research/output 파일은 package files에 포함하지 않는다.
- [ ] `check-licenses.mjs`는 npm dependency 목록·패키지 license metadata·실제 동봉 자료를 Governance 기준과 대조한다. 모호하거나 수동 검토가 필요한 항목은 실패로 남기고 알려진 라이선스처럼 간주하지 않는다. artifact 내부를 자체 Git/tar/바이너리 parser로 읽지 않는다. 기존 모듈 checker를 재사용할 때도 현재 패키지 경계와 분배 형태에 맞는지 검토한다.
- [ ] 정식 Chrome/Edge/Firefox의 자동화 가능 범위는 회귀 suite로, 실제 Safari는 동일 fixture의 직접 UI 조작으로 확인한다. 실제 Android Chrome/iOS Safari에서 기본·A4/A3/JIS B3·반복·취소·SVG·분할을 확인한다. 설치·기기·권한이 없으면 정확한 미실행 항목을 기록하고 지원 완료로 처리하지 않는다.
- [ ] 공식 지원 기준일 2026-10-02의 버전과 실제 설치 버전·OS·기기를 대조한다. 나중 실행되는 최신 버전을 이 날짜의 기준 버전으로 소급 기록하지 않는다. 시각 기준 화면과 엔진 출력·진단·요청 장부를 연결한다.
- [ ] 명세 1~13절 coverage와 Review Focus 5건의 테스트 연결을 점검한다. `npm run verify` 및 영향을 받는 전체 browser suite를 마지막 의미 있는 변경 후 한 번 실행한다. 보안·라이선스·public artifact 검증을 구분하고 실제 publish 시 적용할 단일 artifact 절차를 별도로 남긴다.
- [ ] 외부 엔진 import가 adapter에 한정되고 공개 선언·출력·수명주기·프레임워크 소비가 엔진 타입에 결합되지 않는지 확인한다. 공통 EngineAdapter 계약 테스트와 제어 가능한 대역으로 경계를 검증한다. 두 번째 실동작 엔진 없이 교체 구조를 확보하고 첫 릴리즈 후보에 반영한다.
- [ ] 제품 동작·한계·검증한 환경·미검증·변경 파일을 README/CHANGELOG와 저장소 리포트 관례에 반영한다. 타입·테스트·bundle·법적 필수 notices·공통 지침을 최종 검토하고 로컬 commit 단위로 정리한다. remote/PR/release/publish는 실행하지 않는다.

**완료:** 증거가 있는 범위에서 배포 준비 상태를 보고한다. 미검증 브라우저·모바일·보안/라이선스 필수 항목이 남으면 전체 완료 또는 전체 브라우저 지원을 선언하지 않는다.

## 명세 추적표와 실행 인계

| 명세 | 계획 |
|---|---|
| 1~3 목적·접근·API/metadata | Task 1·6 |
| 4 대상·좌표 | Task 2·4 |
| 5 자원·준비 | Task 0·3·6 |
| 6 형식·SVG | Task 0·5 |
| 7 크기·용지 | Task 2·5 |
| 8 분할 | Task 0·2·7 |
| 9 오류·부분 결과 | Task 1·3·5·6 |
| 10 수명주기·한도 | Task 2·6·7·8 |
| 11 프레임워크·브라우저 | Task 4·8 |
| 12 소비 예제 | Task 8 |
| 13 채택·수용 기준 | Task 0 및 Task 8 최종 검토 |

직접 순차 수행을 권고한다. 자원 manifest·adapter·수명주기 사이의 의존성이 높고 엔진 채택 결과에 따라 후속 구현 방식이 달라지므로, 먼저 Task 0의 질문을 해결하고 결과에 맞게 다음 task를 진행한다. 계획 검토 후 구현 실행 방식과 첫 범위를 정한다. 이번 작업은 문서 작성과 read-only 확인으로 종료하며 어떤 체크박스도 완료로 바꾸지 않는다.
