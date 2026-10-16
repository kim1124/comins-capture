# Comins 자원 준비 계층 범위와 검증 계획

> 2026-10-04 P0 실행 갱신: [실행 결과](../../dom-preparation-probe.md)에 Chrome/실제 Safari 26건, 제한 준비 구현, 미지원/실패 및 중복 비용을 기록했다. P0-A는 별도 연구 resolver 대신 제품 resolver를 재사용했다. 아래 원래의 Git/npm 부재·전 항목 미실행·Task 0 전 제품 구현 금지 설명은 계획 작성 당시 상태이며 현재 판단에 적용하지 않는다. 현재는 private 제품 기반이 존재하고 최초 HEAD는 없다. 범용 준비/SVG verifier는 미완료다. P0의 일반 복제 구현을 확대하지 않고 외부 엔진 재사용 경계를 먼저 판단한다.

> 2026-10-04 실행 승인 갱신: 사용자가 SnapDOM 3.2.0 조건부 채택을 확정하고 잔여 검증 후 프로젝트 구조·README·플레이그라운드·코민스 사이트·공식 가이드 작성을 지시했다. 과거의 채택 보류/전체 gate 통과 전 착수 금지는 이 승인으로 대체한다. 실패·미검증 항목은 릴리즈 조건으로 유지하며 공개 배포는 이번 실행에 포함하지 않는다.

> **For agentic workers:** Use superpowers:executing-plans for the next authorized research task, directly and sequentially. 체크박스는 실행 증거가 있을 때만 완료한다. 이 문서는 범위·공수 분석과 다음 연구 단위의 계획이며 제품 구현 완료나 엔진 채택 승인이 아니다.

**Goal:** 외부 엔진에 전달할 입력의 자원 접근을 Comins가 통제하면서 원본 외형을 보존할 수 있는 최소 경계를 찾는다.

**Architecture:** 원본 읽기와 실행 가능한 준비 DOM 생성을 분리한다. 자원 목록·바이트·삽입 증거·수명주기는 Comins가 소유하고, 검증된 준비 DOM만 내부 엔진 adapter에 전달한다. 범용 레이아웃 계산기나 Canvas 페인터를 이 단계에서 만들지 않는다.

**Tech Stack:** 기존 연구 도구의 ESM JavaScript·Node test runner·Python localhost 서버·고정 SnapDOM 3.2.0·Computer Use Chrome/실제 Safari. 제품 단계에서는 기존 TypeScript ESM 계획을 따른다. 새 패키지 도입은 이번 계획에 포함하지 않는다.

**Spec:** [API 명세](../../api-spec.md), [Core 계획](2026-10-02-capture-core.md), [단계적 전환 계획](2026-10-04-engine-transition.md), [CSS·SVG 경계 결과](../../g1-css-svg-boundaries.md), [Safari 증거](../../../output/research/engine-contract/2026-10-04-g1-safari/report.json).

## 적용 우선순위 — 사용자 재확인

범용 엔진으로 기능을 완성하고 첫 릴리즈를 진행하는 것이 1순위다. 자체 엔진으로 교체 가능한 내부 계약·adapter·공통 테스트는 최초 구현에 필수지만 자체 엔진 수준의 준비 계층은 선행 목표가 아니다. 아래 책임 표는 Comins가 보장할 계약과 후보 구현 범위이며, 모든 처리 기능을 직접 구현하라는 의미가 아니다. 계약을 충족하는 외부 엔진 기능은 adapter 내부에서 재사용한다.

P0는 현재 후보에 필요한 최소 보완의 가능성을 확인하는 제한된 연구로만 사용한다. 복제·스타일 처리의 중복 구현이 커지면 P0-B의 범위를 확대하지 않고 대안 범용 엔진과 비교한다. 아래 24–40인일(여유 포함 29–52인일)은 전체 준비 계층을 직접 맡을 경우의 조건부 추정이다. 이를 필수 릴리즈 일정이나 승인된 구현 범위로 사용하지 않는다. 네트워크·원본 보존·SVG 안전성 계약을 임의로 완화하지 않는다.

## 확정 사실과 판단

2026-10-04 기준 두 브라우저에서 준비 자원 7개와 경계 8개의 요청·처리 판정이 일치했다. CSS 원격 주소가 원본에 남으면 복제본을 afterClone/resolveNode로 바꾸어도 요청이 발생했다. 엔진 입력 자체가 data URL인 CSS는 요청 없이 표본이 일치했다. 중첩 data SVG는 추가 요청 없이도 내용이 누락됐다. 폰트 픽셀 동등성·일반 DOM 복제·G2/G3·Safari G4는 입증되지 않았다.

**판단:** 단순 wrapper 수준의 구현으로 견적 내지 않는다. 현재 필요한 것은 원본과 분리된 자원 준비 계층이며, 그 과정에서 외부 엔진의 DOM·스타일 복제를 얼마나 중복하게 되는지 먼저 측정해야 한다. 자체 엔진 선행 개발로 방향을 바꾸는 결정은 하지 않는다.

## Global Constraints

- 기존 공개 API·지원 목표·단일 내부 엔진 원칙을 유지한다. 소비자에게 엔진 선택·자동 fallback을 추가하지 않는다.
- `failure:'error'`, `resources.network:'deny'`, credentials omit, 취득 순서 인메모리→소비자 resolver→명시 허용 네트워크를 유지한다. 자동 redirect는 거부한다.
- 원본 DOM·style·focus·selection·폼 값·scroll을 변경하지 않는다. 식별자/marker 삽입 금지. 준비 DOM 생성·URL 설정부터 암묵 요청을 검증한다.
- 정책 거부는 네트워크 허용으로 바꾸지 않는다. 명시적 partial도 기존 진단·동일 박스 대체·크기 계약을 따른다.
- capture/출력 timeout 30,000ms 및 기존 출력 한도를 유지한다. 이번 계획에서 새로운 공개 메모리·자원 한도를 확정하지 않는다.
- 제품 엔진 의존성·Task 3~7 통합은 Task 0 통과 후다. 연구 코드의 성공이 제품 구현 완료를 뜻하지 않는다.
- 현재 Git/package/src 기준선이 없다. 기존 UUID 증거를 보존하고 연구를 위해 Git 초기화·commit·원격 쓰기·publish를 하지 않는다.

## 책임과 재사용 경계

| 영역 | Comins 책임 | 외부 엔진의 재사용 후보 | 현재 상태 |
|---|---|---|---|
| 원본 관찰 | 소유 Document, 폼·scroll·selection·변경 감지, 안정화 | 보조 기능은 adapter 내부에서만 검토 | 전체 상태 보존 미검증 |
| 자원 목록 | 실제 사용 이미지/CSS/폰트 face/SVG 참조와 baseURI, 수집 불가 진단 | 엔진 경고는 보조 증거 | 범용 수집 미구현 |
| 취득 정책 | origin·credentials·redirect·abort, resolver, 오류 정제 | 엔진 fetch에 위임하지 않음 | 정책 행렬 잔여 |
| 준비 DOM | 원본→준비 노드 대응, URL 적용 전 해결, 스타일·기하 보존 | 준비 DOM에 대한 엔진 복제·직렬화 | 합성 수동 구성만 검증 |
| 폰트/SVG | face별 바이트·삽입 추적, 중첩 참조, 최종 활성 내용 정제 | 공개 hook·SVG 생성 | G3 미완료 |
| 렌더링 | 공개 계약·해상도·MIME·타일 기하·오류 | SVG/Canvas 변환·인코딩·검증된 crop | Safari crop 내용 문제 잔여 |
| 수명주기 | snapshot 고정, 취소·늦은 결과 폐기, dispose·정리 | 실행 내부의 공개 cleanup만 사용 | 제품 통합 미구현 |

DOM 복제와 스타일 수집의 중복은 실제 비용이다. 외부 엔진을 쓰므로 이 작업이 없어지는 것은 아니다. 엔진은 준비된 입력의 직렬화·렌더링 후보로 남지만, 그 재사용 이익이 충분한지는 다음 연구에서 판단한다.

## 내부 처리 순서

1. 소비자 ready 종료 후 원본 Document·root·기하·SourceState를 읽는다. 캡처 준비 과정에서 앱을 변형하지 않는다.
2. 원본에서 ResourceManifest를 수집한다. 준비 DOM을 먼저 연결해 자원을 발견하지 않는다.
3. 사용할 바이트와 의존 참조를 해결한다. 필수 수집 불가·취득 실패는 기존 오류 계약으로 처리한다.
4. 원본→준비 노드 대응을 별도 보유하고 안전한 준비 DOM을 만든다. URL을 무조건 복사한 다음 지우는 방식은 사용하지 않는다. 비연결 상태가 암묵 요청·사용자 코드 실행을 막는다고 가정하지 않는다.
5. 준비 DOM의 실제 계산 스타일·기하와 자원 사용 지점을 확인한 뒤 엔진에 전달한다. 원본의 외부 CSS 주소가 다시 적용되는 경로도 검증한다.
6. manifest와 실제 삽입 증거를 비교하고 최종 SVG의 중첩 참조·활성 내용을 검사한다. 원본 재접근 없이 출력 가능한 artifact를 고정한다.
7. 성공·실패·취소에 맞춰 준비 DOM과 URL 소유권을 정리/이전한다. 네트워크 0건, decode 성공, data URI 존재는 각각 완전성 증거를 대체하지 못한다.

기존 Core 계획의 `collectResources(PreparedSource)` 순환 의존을 내부 타입으로 분리한다. `ResourceSource={document,root}`는 읽기 대상 원본이다. `SourceInspection`은 여기에 원본 기하·상태·진단을 더한 읽기 결과이며, `PreparedSource.root`는 해결된 자원이 적용된 별도 입력이다. 공개 타입은 변경하지 않는다.

## 자원별 구현 범위

| 대상 | 필요한 처리 | 실패/미검증 조건 |
|---|---|---|
| img/picture/srcset | 선택된 currentSrc와 사용 지점 연결, 박스 보존, 준비 입력의 중복 선택 방지 | 읽을 바이트가 없고 resolver/네트워크로 해결 불가 |
| CSS 이미지 | background·여러 레이어·image-set·border-image·mask·content/pseudo 참조 및 URL 기준 추적 | CSS 접근 제한, 해석 못한 필수 구문·참조 |
| 웹폰트 | family만이 아닌 weight/style/stretch/subset·실사용 face 연결, 삽입 검증 | 한 face 성공으로 다른 누락을 가림, 필수 CSS/face 수집 불가 |
| SVG | inline·외부 파일·중첩 data/blob·href/CSS 참조 그래프, 내부 fragment 구분 | 미해결 외부 참조·순환/검증 범위 불명, 활성 내용 |
| Canvas/미디어 | 원본 상태와 origin-clean 여부에 따른 데이터/오류 경계 | 읽기 실패·고정할 수 없는 동적 상태를 성공 처리 |
| Shadow/custom element/iframe | 원본 소유권·지원 진단 유지, 준비 과정의 부작용과 스타일 격리 검증 | 생성/연결 부작용 또는 지원 계약 재현 불가 |

이 표는 필요 범위이며 지원 완료 선언이 아니다. 알 수 없는 입력을 전부 제외해 초기 지원 목표를 축소하지 않는다. 기존 명세상 진단 가능한 오류와, 구현 미완료 때문에 아직 지원할 수 없는 상태를 구분한다. 범용 CSS/SVG 파싱을 단순 정규식이나 data URL 접두부 검사로 대체하지 않는다. 별도 parser가 필요하면 구현 시 라이선스·의존성·번들 영향부터 검토한다.

## Review Focus

1. 비연결 img/srcset·CSS URL을 설정하는 순간 요청 발생: P0-B에서 준비 생성 전부터 서버 장부 기록.
2. 동일 Document의 상위 selector·CSS 변수·상대 단위·container query가 준비 위치에서 달라짐: P0-B 기하·스타일 표본과 P0-C 원본 비교.
3. 중첩 data SVG에 원격 참조가 숨고 정상 decode되는 경우: P0-A 미해결 의존 노드를 거부하고 P0-C 누락 대조군 확인.
4. custom element 생성/연결과 원본 폼·focus·scroll 부작용: P0-B 상태/생성 횟수 기록. 안전한 범용 처리로 확대하지 않음.
5. resolver가 취소 이후 늦게 성공하여 준비 DOM을 만드는 경우: P0-A 취소 회귀·P0-C 정리 및 후속 실행 확인.

## 다음 연구 P0: 실제 원본에서 준비 입력을 만드는 최소 경로

**범위:** 기존 Task 0 안의 대표 가능성 검증. 기존 수동 합성 DOM 제작에서 한 단계 나아가 원본을 읽어 변환한다. 범용 제품 구현과 구분하며 모든 단계는 아직 미실행이다. 직접 순차 진행하며 추가 에이전트나 새 실행 환경을 요구하지 않는다.

### P0-A — 자원 manifest와 해결 순서

**예정 파일:** `output/playwright/workbench/preparation-model.mjs`, `test/research/preparation-model.test.mjs`.

**연구 인터페이스:** `resolveProbeManifest(entries, {resolve,signal}) → Promise<Map<resourceId, Blob>>`. entries는 `{id,kind,absoluteUrl,uses,dependsOn}`이며 URI/노드 참조는 외부 보고에 복사하지 않는다. P0는 소비자 제공 메모리 resolver만 사용한다. 네트워크 정책 구현은 후속 별도 행렬이다.

- [ ] 사용 지점 두 개가 동일 자원을 공유하는 사례, 중첩 의존성 누락/순환, resolver 거부/undefined, 취소 후 늦은 완료의 기대 동작을 먼저 테스트한다. 미해결일 때 준비 DOM 생성/엔진 호출은 0회여야 한다.
- [ ] `node --test test/research/preparation-model.test.mjs`로 예상 동작 실패를 확인한다.
- [ ] 최소 manifest 해결 순서를 구현하고 같은 테스트를 통과시킨다. P0에는 숨은 fetch fallback을 두지 않는다.

### P0-B — 원본 읽기와 준비 DOM 생성

**예정 파일:** 생성 `output/playwright/workbench/{preparation-dom.mjs,preparation.html,preparation.mjs}`; 수정 `output/playwright/workbench/server.py`에 정적 route 추가.

**연구 인터페이스:** `inspectProbe(root) → inspection`; `prepareProbe(inspection,resolved,context) → Promise<{root,map,dispose}>`. inspection은 원본 요소 참조·기하·상태와 P0-A에 전달할 entries를 포함한다. entries.uses는 원본 노드·속성/스타일 사용 지점, dependsOn은 참조 자원 ID이며 map은 원본→준비 노드 대응이다. 제품 타입/엔진 opaque map에 의존하지 않는다.

- [ ] 레이아웃 영향이 다른 실제 원본 fixture를 먼저 만든다: 일반 img/CSS 배경, 상위 selector+CSS 변수, pseudo 이미지, flex/grid와 상대 크기, 중첩 SVG, open Shadow/custom element 부작용 대조군. 기대 이미지·기하·원본 상태를 엔진 출력 전에 기록한다.
- [ ] 안전한 현재 경로가 없음을 실패 사례로 확인한 뒤, 제한된 요소/스타일 범위의 준비 변환을 구현한다. 원본 전체 `cloneNode(true)` 후 URL 제거를 안전한 순서로 가정하지 않는다.
- [ ] 준비 생성부터 요청 장부를 계측한다. resource는 이미 해결한 데이터만 적용하고 앱의 별도 합성 요청은 유지한다. unsupported 범위는 명시적으로 보고한다.
- [ ] 기하·폼·focus·scroll·selection·custom element 횟수·준비 DOM 잔존을 확인한다. 일반 CSS 전체를 복사하거나 pseudo/shadow를 직접 다시 구현해야 하면 범위와 이유를 기록하고 연구를 확대하지 않는다.

### P0-C — 두 브라우저 비교와 진행 판단

**예정 파일:** `output/research/engine-contract/<new-run-id>/report.json` 및 PNG·원본 기준 자료, 본 문서/채택 보고서. 기존 JSON을 덮어쓰지 않는다.

- [ ] Chrome 확장과 실제 Safari 네이티브 Computer Use로 같은 fixture를 실행한다. 새 실행의 method 기록은 일반 `computer-use`와 실제 경로로 구분해 이전 고정 문자열 오기를 반복하지 않는다.
- [ ] 원본→준비 DOM의 기하를 먼저 비교하고 준비 DOM→엔진 출력도 별도로 비교한다. 고정 정수 fixture의 박스 좌표는 동일해야 하며 색상 표본만으로 글꼴·전체 시각 pass를 선언하지 않는다. 브라우저별 원본 기준을 사용한다.
- [ ] 성공/누락/취소/재출력에서 요청·내용·진단·정리 기록을 남긴다. 관찰 대상 endpoint 밖 요청과 계측 한계를 명시한다.
- [ ] `node --test test/research/*.test.mjs output/playwright/workbench/*.test.mjs`, Python 서버 단위/실행 HTTP 경계를 변경 영향에 맞춰 확인한다. 현재 제품 npm 명령은 존재하지 않는다.
- [ ] 단계별 DOM 수·스타일 읽기·소요 시간·중복 보관 바이트 등 측정 가능한 항목을 보고한다. 브라우저/GPU 전체 메모리를 계측했다고 주장하지 않는다. 연구 fixture 100/1,000 노드는 비교 입력일 뿐 공개 한도가 아니다.
- [ ] 아래 계속/중단 기준으로 채택 가능성과 공수를 갱신한다. P0 완료만으로 G1~G4 전체 pass를 부여하지 않는다.

## 공수 추정 — 실측 전 가정

숙련된 브라우저/TypeScript 개발자 1명이 전담하고 실제 Chrome·Safari를 사용할 수 있다는 가정이다. 1인일은 한 사람의 실작업일이며 AI 실행 횟수·토큰·실제 납기를 뜻하지 않는다. 고정 견적·예산 승인·진행 보장이 아니다.

| 작업 묶음 | 추정 인일 | 포함 범위 |
|---|---:|---|
| P0 대표 가능성·중복 비용 확인 | 3–5 | 위 제한된 연구, 중간 중단 가능 |
| manifest·취득 정책·resolver 수명주기 | 3–5 | deny/origin/credentials/redirect/오류 |
| CSS·폰트·중첩 SVG 수집/삽입 추적 | 5–8 | 정상·누락·접근 불가 대표 경로 |
| 원본 상태·준비 DOM·스타일 보존 | 6–10 | 매핑·레이아웃·부작용 격리, 가장 불확실 |
| adapter·snapshot 자원 소유권 연결 | 3–5 | 공개 hook, 고정 artifact, 취소·dispose |
| 자원 계층 브라우저 회귀·보안 검토 | 4–7 | 두 데스크톱 브라우저의 해당 경로 |
| 합계 | **24–40** | P0 포함, 이 준비 계층과 연결 범위만 |

통합 불확실성 20–30%를 별도로 고려하면 약 **29–52인일(1명 전담 시 약 6–11주)**의 계획 여유가 필요하다. 통계적 예측은 아니며 P0 실측 뒤 다시 산정한다. 금액은 단가·인력 계획이 없어 계산하지 않는다. 2명 투입 시 기간이 절반이 된다고 가정하지 않는다.

이 추정은 기존 Task 3·4·6의 자원 준비 관련 작업을 분해한 것이다. 기존 전체 제품 견적에 그대로 더하면 중복 계산이다. 패키지 기초·용지/geometry·Safari G4 해결·4개 프레임워크·모바일/전체 브라우저·출시 검증·자체 엔진 개발은 제외한다. 의존성 채택이나 브라우저 제약이 바뀌면 상한도 달라질 수 있다.

## 계속/중단 기준

**다음 연구를 계속할 근거:** 대표 실제 DOM을 원본 변형 없이 준비할 수 있고, 수집 범위를 설명할 수 있으며, 준비 입력이 두 브라우저에서 금지 요청 없이 외형·기하를 보존한다. 이때 G1 잔여 정책 행렬 및 G2→G3→G4를 이어간다.

**해당 후보의 보완을 멈추고 재판단할 조건:** 엔진 fork/전역 patch/opaque 변경이 필요함, 준비 입력의 부작용을 통제할 수 없음, 지원 목표를 크게 제외해야만 성공함, 핵심 DOM·스타일·자원·렌더링을 사실상 중복 구현해야 함. 이 경우 재사용 가능한 기능과 중복 구현량을 보고하고 대안 범용 엔진의 계약 적합성·릴리즈 비용을 먼저 비교한다. 자체 개발 선행이나 지원 범위 변경으로 자동 전환하지 않는다.

이 기준은 기존 전환 계획의 중단 조건을 구체화한 것이며 새 제품 범위·보안 예외를 확정하지 않는다. 이번 산출물은 계획 문서이고 P0 코드/브라우저 실행은 아직 하지 않았다.

## 문서 작성 검증 기록

2026-10-04 (Asia/Seoul): 본 계획과 Core·전환 계획, implementation-readiness·research-guidelines·g1-css-svg-boundaries의 총 6개 문서를 작성/갱신했다. 상대 링크 48개의 파일 존재, 이전 순환 인터페이스 제거, P0 미실행 체크 상태를 확인했다. 기존 G1 Chrome·경계·Safari 증거 해시 67개가 일치했다. 기준 동작 실험의 별도 해시 목록은 과거 소스/임시 배포본도 포함하므로 이번 증거 보존 집계에 포함하지 않았다. 제품 코드·의존성·공개 API 변경과 새 브라우저/제품 테스트는 없으며, G1~G4 및 범용 준비 가능성은 계속 미완료다.
