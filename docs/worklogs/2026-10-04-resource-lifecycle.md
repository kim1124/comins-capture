# 자원 취득·수명주기 내부 통합 작업

작업 일자: 2026-10-04 (Asia/Seoul)

## 범위와 판단

사용자의 다음 진행 지시에 따라 자원 준비 기반과 capture/snapshot 수명주기를 구현했다. 범용 엔진 우선·엔진 독립 내부 계약·네트워크 기본 deny·원본 보존 방침을 유지했다.

- Ruling: 일반 DOM prepare와 SVG verify가 없는 상태에서 공개 capture를 노출하지 않는다. 필수 단계 주입 방식의 내부 coordinator를 먼저 구현했다. 비용/제약: 이번 단계만으로 소비자가 일반 DOM을 캡처할 수 없으며 실제 수집/준비/검증 구현이 계속 필요하다.
- Ruling: 기존 계획의 연구 전용·Git/npm 부재 설명은 과거 상태다. 최신 조건부 채택/구현 승인과 현재 TypeScript·Node test 구조를 적용했다. 과거 미실행 체크를 완료로 바꾸지 않았다.
- Ruling: 취소를 무시한 작업이 남으면 문서 잠금과 소유 자원을 유지한다. 비용: 영원히 완료되지 않는 callback/engine은 해당 Document를 BUSY 상태로 남긴다. 진행 중 작업 위에 다음 실행을 겹치는 것보다 안전하다.
- 로컬 변경이며 새 의존성·설정·lockfile·website·Playground 변경은 없다. 첫 commit/push/배포 미수행.

## 변경 파일

- src/errors.ts: 정제 오류 코드와 진단.
- src/lifecycle/operation.ts: managed operation, timeout/abort/checkpoint, pending/drained/late discard.
- src/resources/resolve.ts: manifest 그래프 검증, 메모리/resolver/명시 네트워크, 옵션 고정, 정확한 origin·credentials·redirect 정책.
- src/core/capture.ts: ready→검사→취득→준비→엔진→검증→snapshot, Document lease와 소유권 이전.
- src/core/snapshot.ts: 원본 크기 출력, partial/meta 유지, 출력 lease, Canvas/Blob 검증, 타일 iterator와 dispose.
- test/unit/{lifecycle,resource-resolver,capture-pipeline}.test.mjs 및 test/integration/resource-http.test.mjs.
- docs/core-lifecycle.md, README.md, docs/guide/architecture.md, CHANGELOG.md, AGENTS.md의 현재 구현 상태/명령 보완.

## 검증 기록

1. 신규 구현 부재에 대한 실패 확인 후 lifecycle 3·resolver 5·coordinator 7건을 구현해 통과.
2. 실제 localhost HTTP 검증 2건 통과: 기본 deny 요청 없음, 허용 요청, redirect 대상 요청 없음, HTTP 404, 응답 중 abort, 다음 독립 취득 성공.
3. executing-plans/requesting-code-review 기준 독립 읽기 전용 리뷰 1회 수행. Critical 없음. 종료 직전 abort와 동기 작업 deadline 누락 Important 2건 재현.
4. 두 Important 및 yield 대기 잠금·잘못된 옵션 문제에 대한 회귀 5건을 먼저 추가: 5건 실패 확인 → 수정 후 모두 통과. 재리뷰로 반복하지 않음.
5. 최종 npm run verify 통과: typecheck/build, unit 29, consumer 2, license 검사. 최종 HTTP integration 2건 재실행 통과.
6. src·unit·integration의 Gitleaks 디렉터리 검사 통과. 원시 결과는 폐기하고 상수 결과만 출력.
7. Codex Security diff scan 시작 시도는 HEAD 부재로 거부됨. scanId 없음, 정식 스캔 완료 주장 없음.

## 리뷰 보류 범위에 대한 판단

리뷰가 판정하지 않은 실제 DOM 수집/삽입, SVG 정제, 엔진 암묵 요청, 실제 Chrome/Safari, 전체 크기/crop/paper는 이번 내부 단위·HTTP 검증으로 대체할 수 없다. 해당 내용은 제품 구현과 G1~G4 릴리즈 조건에 남긴다. 공개 API 미노출과 미배포 상태를 유지하므로 검사되지 않은 경로를 제품 지원으로 제공하지 않는다.

## 결과와 다음 단계

자원 바이트 취득 및 내부 수명주기 통합 완료. 일반 DOM 자원 수집·준비와 최종 SVG 검증은 미완료이며 공개 capture/snapshot 완성이 아니다. 다음 단계는 실제 원본을 읽어 ResourceManifest를 만들고 안전한 PreparedSource를 생성하는 구현이다. 이후 필수 verify와 외부 엔진을 연결하여 브라우저에서 요청·원본 상태·출력 삽입을 검증한다.
