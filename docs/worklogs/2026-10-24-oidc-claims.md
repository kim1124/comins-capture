# GitHub OIDC 서명·claims의 제한된 진단

- 작업일: 2026-10-24 (Asia/Seoul).
- 기준 HEAD: `483b9b31594cf247651bdf8afaf6d302d1ad2c3f`.
- 변경 범위: 신규 claims 진단 script·상시 주입형 security test·기존 publish workflow와 release-controls 계약·본 worklog의5파일. 제품 package/lock/src/dist와 기존 Governance 변경은 보존한다.
- 모델: 구현 Sol 6.1/medium, 독립 검토·변경분 보안 검사는 Sol/high로 분리한다. 실제 런타임 모델 식별 메타데이터는 별도로 노출되지 않았다.
- 승인된 local-only Comins Contract v1.12는 미게시 상태다. 로컬 구현·검증과 승인된 공개 tooling 읽기만 수행하며 실제 JWT 발급·registry exchange·제품 pack·stage는 이번 구현에서 수행하지 않는다.

## 관측과 목적

genuine npm11.17 CLI run40078914660은 broker200/exchange404/ENEEDAUTH를 재현했고 fresh pending0으로 신규 stage 등록이 관측되지 않았다. fresh trust 설정의 repository/workflow/environment 및 stage allow/publish deny는 운영 담당자가 일치한다고 확인했다. 그러나 actual signed token claims와 기대 context의 일치 여부는 아직 확인하지 않았다. HTTP404만으로 존재·권한·trust·audience 중 원인을 확정하지 않는다.

본 변경은 실제 GitHub issuer의 서명·issuer·audience·시간 조건을 표준 라이브러리로 검증한 후, 필요한 claims의 presence/match boolean만 관측하는 별도 진단 경로다. registry token 교환이나 stage를 수행하지 않으며 기존 stage/교환 진단 경로도 대체하지 않는다.

## 최소 구현과 경계

- `scripts/verify-github-oidc.mjs`는 표준 `jose.jwtVerify`에 고정 GitHub issuer, npm audience, RS256, 필수 iss/aud/exp/nbf/iat/sub 검사를 지정한다. JWKS는 GitHub discovery에 기재된 고정 `https://token.actions.githubusercontent.com/.well-known/jwks`만 사용한다. token의 iss/jku/x5u/kid로 URL을 만들거나 직접 split/base64/JSON으로 JWT를 해석하지 않는다.
- verification 성공 전에는 custom claim presence/match를 보고하지 않는다(null). 성공 후 repository/workflow_ref/ref/environment의 presence와 기대값 일치 boolean을 보고한다. `subExpectedDefault`는 GitHub 기본 subject 형식과의 정합성 정보이며 npm trust 조건이 아니다. 이 값이 다르다는 이유만으로 진단을 실패시키지 않는다. 오류는 고정 library code/claim enum만 이유에 매핑하고 raw Error·payload·JWT·header·kid·개인정보·값 유래 hash를 출력하지 않는다.
- provider URL의 기존 audience 값은 읽거나 출력하지 않는다. `requestAudienceParameterPresent` boolean만 보고하며 공식 npm과 같은 audience append를 유지한다. actual audience mismatch는 표준 verifier의 닫힌 `jwt_audience` 결과로 분류한다.
- broker 최대1회 및 고정 JWKS 최대1회, HTTPS/기존 provider host/userinfo/port/fragment 경계, redirect 거부·요청별 timeout·64KiB 응답 한도를 적용한다. broker credential은 broker에만 전달하며 JWKS 요청에는 전달하지 않는다. token/payload는 처리 수명 내에서만 유지한다.
- `publish.yml`은 mutually exclusive `verify-oidc-claims` job을 추가한다. exact protected ref와 npm environment·contents read/id-token write를 사용하며 stage/verify-and-pack/기존 exchange job과 동시에 실행하지 않는다. 새 경로는 제품 artifact를 생성·다운로드·교환·업로드하지 않는다.

## CI-only tooling

jose6.2.12는 공식 npm registry metadata의 MIT·runtime dependencies0을 확인했다. 공식 고정 tarball을 다운로드하고 승인된 고정 SHA512 SRI와 일치한 경우에만 fresh prefix에서 표준 npm으로 local tgz를 offline/ignore-scripts/package-lockfalse 설치한다. 제품 dependency·lockfile에 추가하지 않고 새 배포 파일도 없다. 설치된 원본 LICENSE.md를 유지하며 version/license/dependencies와 해당 법적파일을 production loader에서도 확인한다. routine MIT의 비배포 CI 도구이며 별도 제품 notice 추가는 요구되지 않는 것으로 정책을 적용했다.

GitHub [discovery](https://token.actions.githubusercontent.com/.well-known/openid-configuration), [OIDC reference](https://docs.github.com/en/actions/reference/security/oidc), [jose6.2.12 source](https://github.com/panva/jose/tree/v6.2.12)를 읽었다. exact tooling SRI는 workflow에 고정했으며 실제 token의 fingerprint는 생성하거나 보관하지 않는다.

## 검증

증거: `output/verification/2026-10-24-oidc-claims/implementation/`.

- 신규 module 부재 상태의 RED를 `red.log`에 기록하고 repository 경로 placeholder로 정리했다. 상시 주입형 test는 고정 verifier 옵션/URL, 성공 이후 bool 비교, default-subject 정보 경계, 실패 enum, audience append/presence, HTTP/JSON/timeout/size/비밀 누출0, 독립 workflow 경로를 검증한다.
- 실제 암호검증은 상시 주입형 test와 구분한다. 고정 SRI를 확인해 격리 설치한 표준 jose로 런타임에만 ephemeral key/JWT를 만들었다. production loader의 실제 설치 prefix·package metadata·LICENSE.md·dynamic import 경로와 실제 createRemoteJWKSet customFetch를 사용한9조건이 PASS다: 정상, token key URL 무시, 잘못된 서명, 만료, issuer 불일치, audience 불일치, 비허용 알고리즘, repository 불일치, default-subject 정보 경계. 합성 private key/JWT 원문은 파일에 기록하지 않았다(`crypto-summary.json`). 실제 broker/JWKS/registry 요청은 이 회귀에서0회다.
- source 검토 중 법적파일명을 LICENSE로 가정한 부분을 실제 pinned package의 LICENSE.md로 바로잡은 후 production loader smoke를 수행했다. initial 연구 harness의 import 상대경로 오류도 제품 결함과 구분해 바로잡았다.
- 최종 focused14/14 PASS, security 전체30/30 PASS, module verify1회PASS(unit84/consumer6/typecheck/build/licenses/docs)를 확인했다. REQUESTED_VERSION 고정 guard는 이 source 검증 전에 포함됐으며 이후 wrong-version broker0 test만 명시적으로 보완하여 security 전체를 다시 확인했다. 제품·script 실행코드는 불변이므로 기존 verify84/6을 재사용한다. 문법·docs·diff 및 배포83파일/src22파일 SHA256 불변은 handoff와 실행 로그를 따른다.

## 잔여 위험과 다음 조치

로컬 검증은 도구 계약 및 합성 token의 표준 검증 경계를 확인한 것이다. 실제 token claims의 일치·registry404 원인 해결·staging 성공·공개 게시를 입증하지 않는다. 진단이 모두 일치하더라도 npm 서버 trust 평가나 registry 권한을 보증하지 않는다. GitHub 기본 subject 비교는 서버 trust 조건과 혼동하지 않는다.

독립 diff/security/privacy 확인 후 운영 담당자가 승인된 별도 claims 진단을 수행한다. 검증된 claims도 원문으로 저장하거나 조회하지 않고 고정 bool/enum만 확인한다. 제품83파일·기존 artifact를 보존하고 실제 pack/stage/approve/publish를 추가 실행하지 않는다. releaseReady=false를 유지한다.
