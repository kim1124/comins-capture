# OIDC 진단 URL 처리의 공식 client 정합성

- 작업일: 2026-10-24 (Asia/Seoul)
- 로컬 기준 HEAD: `84949e3eaa1555fe76bfc8cdd0221fdc820fd22f`.
- 범위: 진단 script·해당 보안 test·본 worklog의 로컬 변경3파일. 제품·workflow·Governance·원격은 변경하지 않는다.
- 모델: 구현 Sol 6.1/medium, 독립 검토·보안 변경분 검사 Sol/high로 배정. 실제 런타임 모델 식별 메타데이터는 노출되지 않았다.
- 적용 정책: 승인된 local-only Comins Contract v1.12는 미게시 상태다. 실제 진단 재실행·token exchange·stage·pack·공개 게시 권한을 이번 로컬 구현으로 확대하지 않는다.

## 관측과 원인 경계

승인된 진단 run40075283532는 환경 metadata 기대값이 모두 일치하고 request URL/token presence=true, override=false인 상태에서 `invalid_broker`로 HTTP 요청 전에 차단됐다. broker/exchange attempted=false였으므로 이 결과는 GitHub token 발급 실패나 npm 교환 거부의 증거가 아니다. 기존 reason은 URL guard 여러 조건을 하나로 합쳤기 때문에 어느 조건이 실제로 일치하지 않았는지는 확정할 수 없다. 실제 URL·query·토큰을 수집하거나 조회·출력하지 않았으며, 기존 audience·다른 경로·다른 호스트가 실제 사용됐다고 단정하지 않는다.

설치된 공식 npm11.17.0의 oidc helper는 환경 URL을 표준 URL로 해석한 뒤 고정 npm audience를 append한다. GitHub [core OIDC source](https://github.com/actions/toolkit/blob/main/packages/core/src/oidc-utils.ts)도 runner 환경 URL에 audience를 추가하며 [runner ScriptHandler source](https://github.com/actions/runner/blob/main/src/Runner.Worker/Handlers/ScriptHandler.cs)는 서버 GenerateIdTokenUrl을 환경으로 전달한다. GitHub [OIDC 문서](https://docs.github.com/en/actions/reference/security/oidc)는 해당 환경 변수를 provider URL로 설명한다. 2026-10-24에 읽은 이 자료는 고정 `/idtoken` suffix 또는 기존 audience query의 부재를 보장하지 않는다. 이 대조는 과도한 진단 도구 가정을 확인한 것이며 실제 실패 URL의 형태를 밝힌 것은 아니다.

## 최소 수정

- `scripts/diagnose-npm-oidc.mjs`: `/idtoken` suffix 필수와 기존 audience 존재 시 거부하는2개 검사만 제거했다. provider URL의 경로·기존 query를 보존하고 공식 npm처럼 고정 `npm:registry.npmjs.org` audience를 append한다. 기존 audience 값이 있더라도 지우거나 덮어쓰지 않는다.
- URL parse 실패와 남은 HTTPS·기존 host allow-list·userinfo·port·fragment 거부는 값이 없는 닫힌 reason enum으로 구분했다: broker_url_invalid, broker_protocol, broker_host, broker_userinfo, broker_port, broker_fragment. raw URL·부분문자열·query·error.message는 출력하지 않는다. 이 추가 안전 경계는 공식 provider의 모든 합법 endpoint를 완전하게 열거한 선언이 아니다.
- 기존 redirect:error, 요청별 timeout/AbortController, transport JSON64KiB, 요청 최대2회, opaque token·override 우선 처리, 고정 package exchange POST, 고정 stdout schema·비밀 비보존은 유지했다. 토큰 파싱/claim 검사·npm config fallback·헤더 위장은 추가하지 않았다.
- `test/security/oidc-diagnostic.test.mjs`: 합성 임의 경로·기존 query 보존과 getAll audience의 append 순서, 각 잔여 guard의0 HTTP·닫힌 reason, 비밀을 포함한 합성 query의 출력 누출0을 검증한다. 기존 HTTP/JSON/timeout/CLI stderr·mode 계약은 유지한다. userinfo는 표준 URL API로 명확한 placeholder를 런타임에만 합성한다.

## 검증과 불변성

증거 위치: `output/verification/2026-10-24-oidc-diagnostic-compatibility/implementation/`.

- before.json과 기존 script/test 원문을 보존했다. 새 계약을 먼저 실행한 regression-before.log에서 기존 broad reason과 경로/query 거부로 RED를 확인하고, 구현 뒤 focused-after.log에서 GREEN을 확인했다.
- focused9/9 PASS, 최종 보안 전체 gate19/19 PASS와 module verify1회PASS(unit84/consumer6/typecheck/build/licenses/docs)를 확인했다. 문법·문서·diff 검사PASS 및 배포83파일 bytes 불변은 handoff.json과 해당 실행 로그를 따른다. 실제 registry 요청을 수행한 검사는 없다.
- 기존 진단 mode workflow·제품 src/dist/package·기존 artifact·사이트·Governance는 변경하지 않는다. 새 pack·stage·공개 승인·remote Git·workflow dispatch·추가 실제 OIDC 진단은0회다.

## 잔여 위험과 다음 조치

로컬 fake 검증은 변경한 도구 계약만 검증한다. 기존 실제 차단 조건이 제거한2개 중 하나였다는 증거는 없고 이 수정으로 실제 진단이 통과한다고 보장하지 않는다. 남은 guard에서 다시 차단된다면 raw URL 없이 닫힌 reason으로 분류할 수 있다. 기존 host allow-list를 임의로 확대하거나 자격 정보를 다른 목적지로 전달하지 않는다.

독립 고정 diff·보안 검사와 privacy gate를 거친 후 실제 진단 재실행이나 원격 반영은 운영 담당자가 별도로 승인된 범위에서 처리한다. 향후 HTTP/token presence 결과도 과거 npm CLI E401과 동일 원인·staging 권한·provenance/identity·게시 성공을 확정하지 않는다. canonical artifact를 교체하거나 재생성하지 않으며 `releaseReady=false`를 유지한다.
