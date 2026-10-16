# 조건부 채택 이후 초기 프로젝트 작업 기록

일자: 2026-10-04 (Asia/Seoul)

## 승인과 실행 범위

SnapDOM 3.2.0 조건부 채택 확정. 남은 검증 → 프로젝트 구조·README·플레이그라운드·공식 문서·코민스 사이트 작성. 초기 릴리즈 우선, 자체 엔진 교체 경계 필수. 원격 쓰기/publish/배포는 미수행.

## 실행 기록

- 기존 Chrome/Safari 증거를 재사용하고 실패 항목만 후속 검증한다.
- 원격 refs 조회 성공, 광고된 참조 없음. 기존 로컬 docs/output 보존 후 독립 Git 기준선 생성 가능.
- website는 독립 저장소이며 기존 README 변경이 존재한다. 해당 변경은 보존한다.
- Ruling: 기존 G1~G4 전부 통과 후 구현 조건은 최신 조건부 채택 승인으로 대체한다. 검증 실패를 pass로 변경하지 않고 릴리즈 잔여 조건으로 관리한다.
- Ruling: 실행 장부는 Git 기준선 생성 전에도 유지되는 docs/worklogs에 기록한다. 제품 구조와 검증에 필요한 최소 구현만 진행한다.

## 상태

진행 중. 이 기록은 완료 증거가 아니다.

## 변경과 확인

- 로컬 Git branch `codex-capture-initial`, origin 연결. commit/push 없음.
- Governance v1.8 공식 helper로 AGENTS 및 프로젝트 설정 초기화. 설정 효력은 repository trust에 의존하며 파일 존재만으로 현재 모델 설정이 적용됐다고 주장하지 않음.
- 초기 구조: src/types, geometry, engine, resources, output, lifecycle; package/lockfile, private 개발 버전, playground, test/unit·consumer, 개발 서버.
- SnapDOM 3.2.0 MIT와 TypeScript 6.0.3 Apache-2.0 고정. 설치 스크립트 미실행, 제품 빌드에 타사 코드 번들 복사 없음.
- 문서: README, CHANGELOG, LICENSE, docs/guide 및 사이트 ko/en Capture 개발 가이드와 홈페이지 링크. website의 기존 README 변경 보존.
- 기하·정책 테스트는 구현/빌드 파일 부재 실패를 확인한 후 구현하여 7개 통과. consumer 2개 통과. 타입·빌드·라이선스 검사 통과.
- Website 공식 verify:site 전체 통과. 새 Astro 코드 문자열 구문 오류 1회 수정 후 전체 재실행 성공.
- 실제 Safari/Chrome 후속 20건 보존. Safari의 제한된 HTML offset 타일 경로 성공, Chrome에는 그대로 적용 불가. 원본 identity 관찰 가능, 최종 복제본 매핑 미완료.
- 조건부 승인으로 구조 작업은 진행하되 일반 DOM 캡처·공개 snapshot·G1/G3 미완료를 가리지 않도록 public capture를 아직 export하지 않음. 이것은 릴리즈 완료가 아닌 초기 프로젝트 구조임.
- 정식 Codex Security diff scan은 resolvable HEAD가 없어 시작 거부. 별도 정상 scan 완료를 주장하지 않음.
- Mac 잠금으로 추가 Safari 검증 보류. Chrome 확장 재시도도 자동 승인 검토가 거부해 UI 작업 중단. 잠금 해제 안내 요청 후 파일 작업 지속.

## 최종 로컬 검증과 미완료

- 최종 npm run verify 통과: 타입·빌드, unit 9개, consumer 2개, 의존성 라이선스. 연구 Node 25개와 Python 8개 통과.
- Playground HTTP 경계 13개 통과. URL 정규화로 먼저 404가 되는 사례의 테스트 기대값을 수정했으며 인코딩 슬래시 경로 이탈은 403 확인. 제품 서버 수정은 없었음.
- 현재 소스·Playground·scripts·unit/consumer·guide의 Gitleaks 디렉터리 검사 통과. 정식 Codex Security scan이나 출시 artifact scan과 별개임.
- 공식 가이드 상대 링크 16개, 후속 증거 해시 41개, TOML 파싱, source/guide 공백 검사 통과. website README 해시 보존 확인.
- 한 차례 독립 코드 리뷰 완료. SVG에서 잘못된 래스터 크기 입력이 무관하게 실패하던 오류를 RED→GREEN으로 수정. 1배 업스케일 한계는 UI/가이드에 명시; 목표 배율 직접 렌더링은 후속 제품 구현.
- 브라우저: Chrome Playground 640×420 PNG 생성 및 시각 확인. JPEG/A4 실행은 시작했으나 최종 결과 확인 전 잠금이 발생해 통과로 집계하지 않음. SVG 수정 후 새 UI 재검증·실제 Safari Playground·사이트 브라우저 검증은 잠금 해제 후 수행해야 함.
- 사이트 verify:site 통과, 로컬 ko/en 가이드 생성. 배포하지 않음.
- 남은 범위: boundaries-1 Chrome/Safari 실행, G1/G2/G3/G4 전체 수용 조건, 일반 DOM 공개 capture/snapshot 통합, 프레임워크/모바일 소비, 첫 release artifact와 보안 scan. 초기 구조/문서 작성과 제품 완성을 구분함.

## 재개 지점

잠금 해제 확인 후 후속 boundaries 화면을 실제 Chrome·Safari에서 실행하고 Playground 최종 UI를 확인한다. 기존 후속 타일 20개 결과는 다시 실행하지 않는다. 사이트 개발 가이드 ko/en을 브라우저에서 확인한다. 공개 capture 구현은 기존 명세와 현재 내부 구조를 연결하되, 보안 계약을 만족하기 전 lab adapter를 공개 export하지 않는다.

## 잠금 해제 후 후속 — 2026-10-04

### 결과와 참조

- 네이티브 Safari 접근으로 잠금 해제 확인. 기존 경계 probe 4건씩 Chrome/Safari에서 실행, 총 8건·원본 16파일과 해시를 별도 보존. 과거 실패·미실행 기록은 덮어쓰지 않음.
- 두 브라우저 모두 CSS 공개 hook 조합에서 추가 capture 요청 1건. 알려진 SVG 이벤트/링크 제거는 가능하나 일반 sanitizer나 활성 SVG 문서 검증 완료 아님. 자세한 결과는 conditional-adoption-followup.md.
- 참조: governance/COMINS_CONTRACT.md v1.8; sortable README, docs/playground-reference.md, example/src/app/PlaygroundApp.tsx; grid-layout/docs/ko/14-playground.md; website/docs/documentation-contract.md 및 guide-integration.md.

### 변경 파일과 목적

- playground/index.html·style.css·app.mjs: 실행/사용 안내/API 탐색, 기본값·제약 표, 전체 소스 연결, 초기화와 Blob URL 정리. 종전 레이아웃과 내부 lab adapter 유지.
- README.md, CHANGELOG.md, docs/guide/{README,api,playground,support,site-integration}.md: 기능별 연결, 공개 타입 필드, 예정 기능 구분, 신규 관찰 반영.
- examples/geometry.mjs·README.md: 전체 실행 파일과 예상 출력.
- website src/pages/[lang]/capture.astro: 한·영 Playground·API·타입·목차. src/components/BrandHeader.astro: 선택적 languagePath를 추가해 Capture 언어 전환 경로 보존.
- 신규 의존성·lockfile 변경 없음. website 기존 사용자 README 변경의 SHA-256 동일 확인.

### 이번에 실행한 검증

- Capture npm run verify 통과: 타입·빌드·unit 9·consumer 2·라이선스. 기하 예제 실제 실행: A4 2480×3508, 12타일, 마지막 {x:2048,y:3072,width:432,height:436}. app.mjs 구문 검사 통과.
- 사이트 최종 npm run verify:site 통과: packages 3, pages 252, sourceLinks 124. live registry/link 조회는 이 작업에 포함하지 않음.
- Chrome: A4 JPEG, 사용자 크기 WebP, SVG의 무관한 잘못된 너비 회귀, 초기화와 사용 안내 탐색 확인.
- Safari: PNG·SVG 생성 확인. 설치 버전 Chrome 154.0.8037.93 / Safari 27.0.1. 고정 fixture 범위이며 제품 브라우저 인증 아님.
- 공식 사이트: Chrome 한국어/영어 본문과 상단 언어 왕복, API anchor 실제 확인. 사이트 전체 Safari/모바일 검증은 미실행.
- 화면 증거: output/playwright/capture-playground-followup.jpg, capture-safari-followup.jpg, capture-site-followup.jpg.

### 잔여 범위와 다음 구현

이번 범위인 잠금으로 보류된 경계 probe 실행 및 Playground·README·공식 개발 문서 보완을 완료했다. 일반 DOM capture/snapshot, 자원 수집/resolver와 deny 강제, SVG 정제, 복제 대응·타일 회귀, 원본 해상도 직접 렌더링, 프레임워크·모바일 소비는 아직 구현/릴리즈 잔여다. 다음 제품 작업은 자원 준비 계층과 공개 capture/snapshot 수명주기를 기존 명세에 연결하는 단계다. 조건부 엔진 채택을 다시 결정하는 단계로 되돌리지 않는다.

Capture는 아직 첫 commit이 없는 로컬 codex-capture-initial이며 파일은 untracked. 정식 Codex Security diff scan의 HEAD 부재 문제는 해소하지 않았다. 원격 push·태그·publish·배포는 수행하지 않았다.
