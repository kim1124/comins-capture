# npm OIDC 요청·교환 경계의 안전한 진단 모드

- 작업일: 2026-10-24 (Asia/Seoul)
- 상태: 로컬 진단 기능 준비. 실제 OIDC 요청·교환·stage·publish는 이 구현 단계에서 실행하지 않았다.
- 기준 HEAD: `dd32b1765e18f01f0aa0a698bd85d9048815b42a`. 기존 병합 제품 tree와 Governance dirty15파일을 보존한다.
- 모델: 구현 Sol 6.1/medium, 독립 검토·보안 변경분 검사 Sol/high로 배정. 실제 런타임 모델 식별 메타데이터는 제공되지 않았다.
- 승인 경계: 로컬 수정·선택 검증만 수행한다. 원격 반영·workflow dispatch·실제 staging은 운영 담당자의 별도 범위다. 적용 local-only Comins Contract v1.12는 미게시 상태다.

## 목적과 확인된 경계

기존 stage run40071240886은 E401로 실패했다. 기본 로그에는 GitHub OIDC 요청이나 npm token exchange의 성공/실패를 확정할 HTTP 근거가 없었다. 이후 profile·trust 설정 확인과 이전 로컬 path 수정은 이 실행의 실제 token exchange 성공을 증명하지 않는다. 확인되지 않은 원인을 설정 변경이나 재시도로 추정하지 않고 broker HTTP/token presence와 registry exchange HTTP/token presence를 구분하는 진단 경로를 준비했다. 기존 분석은 `output/verification/2026-10-24-oidc-diagnostic/operator-handoff.json`과 `existing-run-log-analysis.json`에 보존한다.

실제 설치된 공식 npm11.17.0의 `lib/utils/oidc.js`를 읽어 truthy NPM_ID_TOKEN 우선, GitHub GET의 npm audience, package별 exchange POST와 Bearer 전달·body 없음 경계를 확인했다. 토큰을 파싱하거나 JWT claim·서명을 판정하지 않는다. GitHub가 제공한 repo/ref/workflow 환경 metadata의 기대값 비교는 token claim 검사와 별개다.

## 변경 파일과 동작

- `.github/workflows/publish.yml`: choice mode의 기본값 stage와 diagnose-oidc 선택을 추가했다. 기존 verify-and-pack/stage는 mode=stage와 정확한 보호 ref를 요구한다. 기존 needs·identity/digest·1 pack·npm stage·권한·action pinning은 유지했다. 별도 diagnose-oidc job은 같은 보호 ref·npm environment·contents read/id-token write에서 pinned checkout/setup-node24 뒤 진단 script만 실행한다. 진단 mode에서는 verify/pack/stage job이 실행되지 않는다.
- `scripts/diagnose-npm-oidc.mjs`: 외부 의존성 없이 builtin fetch를 사용한다. package name/version 및 REQUESTED_VERSION0.0.2와 공식 GitHub 환경 metadata를 확인한다. override가 없으면 GitHub 환경의 HTTPS actions.githubusercontent.com broker 경계를 검사하여 고정 npm audience GET을 수행하고, 받은 opaque token으로 고정 registry.npmjs.org의 comins-capture 전용 exchange POST만 수행한다. truthy NPM_ID_TOKEN이 있으면 공식 npm의 우선 규칙대로 broker를 생략한다. 다른 npm config/token fallback은 추가하지 않았다.
- 요청은 redirect:error·단계별 최대1회·기본10초 timeout/AbortController이며 transport JSON은64KiB로 제한한다. 오류 HTTP body는 읽어 출력하지 않는다. 토큰은 임시 메모리에만 두고 진단 결과나 파일에 보존하지 않으며 npm 설정을 쓰지 않는다.
- stdout는 고정 JSON schema의 stage/reason/source enum, HTTP status/null, presence와 기대 환경 metadata 비교 bool만 출력한다. 토큰/JWT/header/body/raw error·URL/query·ID·메일·fingerprint를 출력하지 않는다. 외부 오류와 최상위 실패는 고정 reason으로 정리한다.
- User-Agent는 정직한 고정 진단값이며 Accept JSON과 Bearer/POST 경계만 정합시켰다. 필수 근거 없는 npm-command/stage 위장 헤더는 추가하지 않았다. 실제 npm CLI의 optional header·기본 옵션 차이는 남으므로 이 모드는 현재 ref의 직접 API 관측이며 과거 CLI E401의 동일 원인 재현이 아니다.
- `test/security/oidc-diagnostic.test.mjs`와 기존 `release-controls.test.mjs`: fake fetch로 성공·override·preflight·URL 경계·HTTP 거부·invalid JSON·토큰 누락·비밀 포함 응답/오류·body/fetch timeout·JSON 한도·CLI stdout/stderr·모드 분리를 검사한다. 실제 token exchange는 로컬 테스트에서 실행하지 않는다.

## 검증과 불변성

증거: `output/verification/2026-10-24-oidc-diagnostic/implementation/`.

- before.json과 기존 workflow/test 원문을 고정하고 신규 계약을 먼저 실행하여 RED를 기록했다(`regression-before.log`). 구현 후 focused 계약16/16 PASS를 확인했다(`focused-after.log`).
- 최종 `node --test test/security/*.test.mjs` 1회18/18 PASS, `npm run verify` 1회PASS(unit84/consumer6/typecheck/build/licenses/docs), 문서·diff·문법 검사PASS를 확인했다. 각 로그와 최종 파일 해시는 같은 경로 handoff.json을 따른다. 이는 fake/로컬 gate 결과이며 실제 OIDC 성공이 아니다.
- 기존 배포83파일 bytes가 전후 일치함을 별도 확인했다. script/test/worklog/workflow는 배포 allow-list 밖이며 제품 src/dist/package·사이트·Governance를 수정하지 않는다.
- 이번 단계에서 새 pack·artifact 교체·브라우저/research·실제 registry 요청·stage 재시도·공개 승인·publish·원격 Git/workflow 변경은0회다.

## 잔여 위험과 다음 단계

독립 고정 diff 검토와 필수 보안 변경분 검사를 거친 후 운영 담당자가 승인된 범위에서만 원격 반영·diagnose mode 실행을 처리한다. script 준비와 fake 검사의 성공은 실제 token 발급·교환 성공을 의미하지 않는다. 향후 exchange200/token presence도 stage 권한·provenance·identity 또는 게시 성공을 확정하지 않는다. 현재 ref의 직접 API HTTP 거부를 과거 CLI 실패의 동일 원인으로 단정하지 않는다. 토큰 서명·claim 검사나 fallback credential 취득·권한 확대·설정 우회는 제공하지 않는다. `releaseReady=false`를 유지한다.
