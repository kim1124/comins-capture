# 구현 준비 상태와 추가 검증

> 2026-10-04 실행 승인 갱신: 사용자가 SnapDOM 3.2.0 조건부 채택을 확정하고 잔여 검증 후 프로젝트 구조·README·플레이그라운드·코민스 사이트·공식 가이드 작성을 지시했다. 과거의 채택 보류/전체 gate 통과 전 착수 금지는 이 승인으로 대체한다. 실패·미검증 항목은 릴리즈 조건으로 유지하며 공개 배포는 이번 실행에 포함하지 않는다.

확인일: 2026-10-02 (Asia/Seoul). 요청 범위는 추가 검증 필요성 확인과 구현 계획 작성이다. 이번 확인으로 제품 구현이나 새 브라우저 실험을 수행한 것은 아니다.

> 2026-10-04 후속: [Task 0 기준 동작 검증](engine-adoption.md)을 수행했다. Chrome·Safari 10건에서 G1/G3 기본 경로 부적합과 Safari G4 내용 불일치를 확인했고 G2는 미검증이다. 아래 2026-10-02의 실행 경계는 당시 기록이다.

> 같은 날 추가 검증: 준비 자원 7개와 CSS·SVG 경계 8개를 Chrome·실제 Safari에서 비교했다. [경계 보고서](g1-css-svg-boundaries.md)에 한계를 기록했고, [자원 준비 계층 계획](superpowers/plans/2026-10-04-resource-preparation.md)에 책임·추정 공수·다음 P0 연구를 정리했다. 일반 DOM의 준비 가능성은 미검증이며 G1~G4 전체 미통과 상태를 유지한다.

## 판단

2026-10-04 사용자가 [외부 엔진 우선·자체 엔진 후속 전환](superpowers/plans/2026-10-04-engine-transition.md)을 승인했다. 현재 준비 작업은 이 순서에 맞춰 진행한다. 기존 G1~G4 및 출시 검증은 유지하며 자체 엔진을 먼저 구현하는 방향으로 진행하지 않는다.

**구현 계획 작성은 가능하다. 엔진 독립 Core의 타입·크기 계산부터 진행할 수 있지만, SnapDOM 채택과 엔진 통합은 추가 검증을 통과해야 한다.** 모든 출시 검증을 구현 전에 끝내거나, 기존 제한된 실험을 제품 검증으로 확대하지 않는다.

사용자의 “보고서 확인 완료. 추가 검증이 있는지 확인하고 구현 계획 작성 시작” 요청을 명세 검토 이후의 계획 작성 지시로 기록한다. [명세](api-spec.md)의 Q1/Q2 권고값을 계획 기준으로 유지한다. 별도의 선택 응답을 받은 것으로 기록하지 않으며, 실제 공개 API·엔진 채택·출시 승인과도 구분한다.

## 이번에 재확인한 자료

- `docs/api-spec.md`, `docs/research-guidelines.md`, `docs/snapdom-repair-review.md`와 연구용 `repair.mjs`, `fixture.mjs`.
- 저장된 workbench-1 보고서 14건, workbench-2 보고서 23건. 보완 실행의 측정 대상 원본 보존 상태와 엄격 중단 6건의 PNG 부재를 파일로 재확인했다. 브라우저 재실행은 아니다.
- 고정 배포본 `@zumer/snapdom@3.2.0`의 `package.json`, `types/snapdom.d.ts`, `dist/snapdom.mjs`. 라이브 최신 버전의 주장과 혼합하지 않는다.
- 상위 `governance/COMINS_CONTRACT.md` v1.8 및 모듈 템플릿. 인접 독립 저장소의 package 설정은 도구 선택 참고로만 읽었다.
- 현재 capture 폴더에는 `.git`, `package.json`, 제품 `src` 기준선이 없다. 원격 저장소 내용·기본 브랜치는 이번에 조회하지 않았다. 실제 Node 24.19.0·npm 11.17.0을 확인했으며 지원 최소 버전 확정과는 별개다.

배포본 타입의 `CaptureContext`는 `classCSS`, `styleCache`, `nodeMap`, `fontsCSS`, `baseCSS`를 내부·opaque 자료로 설명한다. `resolveNode`는 원본 요소를 받아 대체 노드를 반환하는 공개 hook이지만, 모든 원본과 완성된 복제본 쌍을 제공하는 범용 콜백은 아니다. 공개 타입에서 모든 자원 요청을 중재하는 fetch 주입 옵션이나 일반 AbortSignal 옵션은 찾지 못했다. bundle에는 자체 fetch·타임아웃 경로가 존재한다. **이는 계약 충족 불가 확정이 아니라, 단순 wrapper만으로 충분하다는 근거가 없다는 뜻이다.**

## 엔진 통합 전 필수 검증

| ID | 질문·현재 공백 | 통과 기준 | 실패 시 영향 |
|---|---|---|---|
| G1 | 기본 네트워크 차단을 엔진·임시 DOM까지 관철할 수 있는가 | 원본 준비 이후 캡처·재출력·실패·취소에서 금지된 추가 요청 0건. 자원 없는 페이지뿐 아니라 원격 이미지·CSS 이미지·폰트·SVG 입력 포함. 허용 origin과 credentials도 분리 검증 | 엔진 통합 보류. 앱 전역 fetch 교체·CSP 완화로 우회하지 않음 |
| G2 | fixture ID와 opaque 캐시 없이 원본·복제본·스타일 대응을 확보할 수 있는가 | ID 없음·중복 ID·동일 구조 형제·open Shadow DOM의 식별, nested sticky·경계 clip을 원본 변경 없이 재현. 지원하지 못하는 조합은 호출 전에 진단 | 해당 통합 설계 재검토. 원본에 marker를 쓰거나 모든 sticky를 미지원으로 처리하여 필수 지원을 회피하지 않음 |
| G3 | 자원별 검증과 안전한 SVG 고정이 가능한가 | 폰트 face별 누락·CSS/SVG 참조를 검출하고, 정상 자원이 통과. 반환 SVG를 img 및 별도 document로 열어도 스크립트·추가 외부 요청이 없음. 필수 수집 불가 시 명시적 오류 | SVG·자원 어댑터 채택 보류. 정식 보안 검토는 별도로 남음 |
| G4 | 요청 크기 그대로 타일만 렌더링할 수 있는가 | 최종 2500×3500/1024 타일 12개 및 가상 20000×10000/2048 타일 50개. 전체 크기 Canvas 할당·암묵 축소 없음, 타일 치수·접합 일치 | 분할 엔진 경로 보류. 전체 Canvas를 만든 뒤 자르는 방식으로 대체하지 않음 |

2026-10-02 계획 작성 시 G1~G4는 미실행이었다. 2026-10-04 기준 **부분 실행·전체 미통과**이며 현재 증거는 [엔진 채택 검증](engine-adoption.md)에 기록한다. [구현 계획 Task 0](superpowers/plans/2026-10-02-capture-core.md#task-0-엔진-계약-검증)의 산출물로 닫는다. Chrome과 실제 Safari를 우선 사용하고 브라우저·버전·fixture·원본 관찰·결과·요청 기록을 함께 저장한다. 테스트 도구가 요청을 막아 성공한 것을 모듈의 차단 기능으로 보고하지 않는다.

G2는 완성된 제품 수준의 전 유형 지원을 선행 요구하지 않는다. 채택할 공개 확장 경로로 대표 사례가 가능함을 확인하고, 전체 회귀 범위는 구현 Task 4·6에서 확장한다. G3 역시 검증 구조의 가능성 확인이며 정식 보안 스캔을 대체하지 않는다.

## 구현과 함께 검증할 항목

| ID | 범위 | 계획상 책임 |
|---|---|---|
| V1 | 판별 union·잘못된 옵션·오류 정제·SSR import·엔진 lazy load | Task 1 |
| V2 | 소수 crop·PPI·여백·contain/cover/stretch·출력 한도·ISO/JIS 치수 | Task 2 |
| V3 | URL 기준·상대 경로·redirect·credentials·취소·CSS 접근 불가·폰트 face 검사 | Task 3 |
| V4 | 원본 상태·Document별 소유 window·viewport/document·fixed/sticky·네이티브 폼 지원 진단 | Task 4·6 |
| V5 | PNG/JPEG/WebP/SVG·배경·MIME·실제 크기·partial 상속·출력 시 추가 요청 없음 | Task 5 |
| V6 | 타일별 생성·iterator 중단·부분 전달 후 오류·dispose·동시 호출·timeout 후 지연 결과 폐기 | Task 6·7 |
| V7 | Vanilla·React·Vue·Svelte의 실제 소비·SSR·언마운트 | Task 8 |

명세에 직접 적힌 happy path 외에 다음 회귀를 우선 추가한다: `ready`가 끝나지 않거나 늦게 끝남, same-origin iframe 안의 별도 Document를 입력으로 전달함, font family는 같고 weight/subset만 다름, 상대 URL과 CSS baseURI가 다름, iterator가 생성됐으나 시작되지 않거나 중간에 종료됨.

## 출시·지원 선언 전 검증

- 정식 Chrome·Edge·Firefox·실제 Safari와 Android Chrome·iOS Safari. 설치 버전·공식 기준 버전·OS/기기를 기록한다. 기존 번들 Firefox/WebKit은 정식 브라우저 또는 Safari 증거를 대체하지 않는다. 현재 기록의 Edge·Firefox·모바일 공백은 해소되지 않았다.
- 모바일의 A4 300 PPI, A3/JIS B3 300 PPI, 한도 근처 반복 실행·취소. 32M 픽셀 정책 한도는 실기기 안정성 보증이 아니다. 실패 시 조용히 해상도를 줄이지 않는다.
- build된 공개 exports·타입·외부 엔진 의존성·라이선스·패키지 파일 목록·정식 보안 경로. Git 초기화 후 첫 commit 전 Gitleaks hook, 첫 PR 전 필수 보안 CI, 실제 배포 전 단일 artifact 검증을 각 시점에 적용한다.

환경이 없으면 해당 검증을 미실행으로 남긴다. 데스크톱 성공으로 모바일 지원을 발표하거나, 계획 작성만으로 remote push·브라우저 설치·서비스 비용·npm publish 권한을 추론하지 않는다.

## 용지 출처 확인의 잔여 항목

2026-10-02에 [Epson 공식 규격](https://support.epson-europe.com/onlineguides/en/wf7015/html/spec_4.htm)에서 A3/A4/A5와 일본식 B4 치수를, [NEC 공식 용지 표](https://jpn.nec.com/printer/laser/support/paper/index.html)에서 일본식 B3를 다시 확인했다. [HP ISO 표](https://support.hp.com/us-en/document/bpp03634)는 본문 요청이 403으로 실패했다. ISO B3의 접근 가능한 공식 전체 표 또는 원 규격 대조는 Task 2의 preset 확정 조건으로 유지한다. 검색 색인과 원문 확인을 동일하게 처리하지 않는다.

## 이번 작업의 검증 경계

이번에는 자료·저장 파일·고정 배포본을 읽고 문서의 범위·링크·일관성을 점검했다. G1~G4와 V1~V7을 실행하지 않았으며 기존 자동 테스트·실제 브라우저 검증을 재실행하지 않았다. 결과는 구현 착수 조건을 구분한 계획 입력이다.
