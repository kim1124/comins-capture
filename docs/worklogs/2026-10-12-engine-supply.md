# 외부 엔진 수정본 공급 경로

작업일: 2026-10-12 (Asia/Seoul).

## 승인과 정책 확인

유지관리자가 “comins 가버넌스 확인해서 만약에 정책에 위배되지 않는다면 권고대로 진행”으로 고정 버전 최소 수정본의 내부 포함을 조건부 승인했다. Comins Contract v1.8, OSS_LICENSE_POLICY, SENSITIVE_DATA_STANDARD를 확인했다. MIT인 SnapDOM 3.2.0의 출처·버전·수정 상태가 명확하고 원문 라이선스와 변경 고지를 보존하는 방식은 해당 정책의 copied/distributed material 경로에 부합한다. 별도 제한 라이선스나 불명확한 출처에 대한 예외 승인을 사용하지 않았다. 법적 분쟁 부재를 보증한 것은 아니다.

## 구현

- scripts/engine-supply.mjs, scripts/build-engine.mjs: 고정 upstream·LICENSE 해시 및 함수별 변경 횟수를 확인하고 dist/engine/vendor에 수정본·LICENSE·provenance 생성. 설치 엔진과 과거 연구용 복사본은 변경하지 않는다.
- src/engine/snapdom-extension.ts: 호출별 준비 이미지 목록과 얕은 복제 함수 연결, 미등록 자원 거부·실패 고정·취소·dispose. 네트워크 취득은 수행하지 않는다.
- scripts/check-licenses.mjs, package.json, THIRD_PARTY_NOTICES.md: 빌드에 생성 단계를 연결하고 실제 생성물·원문 LICENSE·provenance·package files 고지를 검사한다. lockfile과 의존성 버전은 변경하지 않았다.
- test/unit/engine-extension.test.mjs, engine-supply.test.mjs: 새 검사 9개. README, CHANGELOG, AGENTS, 구조 가이드와 공급 명세를 갱신했다.

`src/index.ts`의 공개 export와 기존 lab adapter는 그대로다. 수정본은 제품 내부 공급 구성요소이며 아직 capture에 연결되지 않았다. 연구용 코드가 자동으로 제품 검증을 통과한 것으로 취급하지 않는다.

## 검증

새 검사 8개를 미구현 상태에서 실패 확인 후 구현하여 통과시켰다. 고지·생성물 검사 1개도 별도 실패→통과를 확인했다. 마지막 코드 변경 뒤 `npm run verify` 전체 통과: typecheck·build·unit 38개·consumer 2개·license 검사. `npm run test:research` 41개 통과로 기존 연구 원본과 해시 보존도 확인했다.

생성 JS 구문과 상대 runtime import를 확인했다. `npm pack --dry-run --json --ignore-scripts`의 예상 파일 43개에서 엔진·LICENSE·provenance·제3자 고지 포함 및 연구/테스트/스크립트 제외를 확인했다. 실제 릴리즈 tarball은 만들지 않았다. 새 소스와 문서의 Gitleaks, dist 디렉터리 Gitleaks, 문서 링크·공백 검사도 통과했다. [검증·해시 기록](../../output/research/engine-contract/2026-10-12-engine-supply/report.json)을 보존했다.

기본 npm cache 경로 접근은 sandbox에서 EPERM으로 실패했다. 시스템 권한이나 소유권을 바꾸지 않고 임시 cache를 지정해 해당 dry-run만 재실행하여 완료했다. 제품 오류로 분류하지 않는다.

## 미실행·잔여 항목

- 저장소는 codex-capture-initial의 최초 커밋 전 상태다. 기존 작업과 이번 변경 모두 로컬이며 commit·push·fork 게시·publish를 수행하지 않았다. 최초 HEAD가 없어 worktree 생성과 정식 Git diff 보안 스캔을 수행하지 않았다. Gitleaks 통과를 해당 보안 스캔 완료로 대신하지 않는다.
- 새 수정본의 실제 브라우저 실행은 미실행이다. 과거 14건은 다른 연구용 bundle/runtime의 기록이며 새 생성물의 통과 증거가 아니다.
- 이번 이미지 형식 검사는 준비 계층이 제공한 데이터 URI의 제한 문법만 검사한다. 실제 이미지 decode·MIME·바이트 한도·일반 자원 수집은 후속이다.
- 얕은 복제와 pseudo 이미지 지점 이외의 엔진 취득 경로, G1–G4, SVG 안전성·고해상도·프레임워크 소비와 성능 검증은 남아 있다.
- 다음 통합에서는 raw artifact와 검증 완료된 output artifact를 분리해야 한다. 현재 verify는 진단만 반환하며 lab nativeTile은 원본 엔진 결과를 참조하므로 정제된 SVG를 모든 출력에서 사용하는 계약을 아직 충족하지 않는다.

다음 실행 단위와 공급 제한은 [공급 계약](../superpowers/specs/2026-10-12-engine-supply.md)에 기록했다.
