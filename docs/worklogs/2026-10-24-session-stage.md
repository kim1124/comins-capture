# 0.0.2의 명시적 기존-session staging 예외

- 작업일: 2026-10-24 (Asia/Seoul).
- 구현 기준 HEAD: `e5761e95062453400b36db6e0fcceb61acbd96da`.
- 소유 범위: publish workflow, provenance 공용 helper, local-session stage helper, 기존 identity checker, 신규 session 보안 test, 기존 release-controls, 본 worklog의7파일. 기존 Governance 및 타인 변경은 보존한다.
- 모델: 구현 Sol 6.1/medium, 설계·독립 검토·변경분 보안 검사는 Sol/high로 분리한다. 실제 런타임 모델 식별 메타데이터는 별도로 노출되지 않았다.
- 적용 정책: 승인된 local-only Comins Contract v1.12는 미게시 상태다. 사용자는 정확한 comins-capture0.0.2에 한해 정책9/10/20 및 기존 npm 로그인 session staging·manual publisher 검증 대안을 명시 승인했다. 이 승인은 다른 버전·새 token/Secret·subject/계정 설정 변경·공개 approve/publish로 확장하지 않는다. 공개 배포는 사용자가 직접 수행한다.

## 목적과 현재 상태

기존 genuine npm11.17의 broker200/exchange404/ENEEDAUTH와 fresh pending0은 기록된 실패다. 검증된 signed claims 및 fresh trusted-publisher 조건 일치만으로 npm 서버의 거부 원인은 확정하지 못했다. 본 작업은 원인을 숨기거나 임의 인증 헤더를 바꾸는 수정이 아니다. 승인된 별도 경로로 canonical source/run/SHA의 build·단일 artifact·표준 provenance를 먼저 준비하고 기존 로그인으로 정확한 artifact를 staging하기 위한 도구다. 기존 OIDC stage helper·기본 mode·기존 job 권한은 유지한다.

## 구현 경계

- `publish.yml`의 새 `prepare-session-stage` job은 정확0.0.2·보호 ref에서만 실행한다. 이 job 자체가 public-history/current-maintainer·verify/build·security/license·표준 단일 npm pack·추출본/소비 검사를 수행하고 같은 job/run/SHA에서 provenance를 생성한다. 기존 verify-and-pack job의 JWT 권한은 확대하지 않는다. tgz·Sigstore bundle·작은 session-stage.json만 별도 보호 artifact로 전달한다. 기본 stage mode 또는 기존 교환/claims 진단과 동시에 실행하지 않는다.
- `session-stage-provenance.mjs`는 설치 npm11.17의 변경하지 않은 generateProvenance/verifyProvenance·npm-package-arg PURL·pacote manifest parser 및 Sigstore verify/bundleFromJSON을 사용한다. 표준 npm verifier의 exact PURL/SHA512 subject 검증과 Sigstore의 고정 GitHub issuer/certificateIdentityURI 검증이 모두 필요하다. 새 제품 dependency나 custom token/DER/base64 parser를 추가하지 않는다.
- 두 표준 crypto verifier 성공 후, 표준 Sigstore typed DSSE payload의 UTF8/JSON 문서에서 in-toto/SLSAv1/buildType·workflow repository/path/ref·source URI/gitCommit·invocationId(runId+runAttempt)·github-hosted builder를 authoritative 기대값과 비교한다. manifest만 새 run으로 바꾼 동일 tgz의 다른 run/SHA/attempt proof도 거부한다. local 기대 source/run/attempt 및 두 SHA256는 운영 담당자가 실제 canonical API 메타와 job outputs에서 주입한다.
- safe manifest는 name/version/sourceSHA/runId/runAttempt/tgzSHA256/bundleSHA256만 포함한다. bundle 원문과 helper의 내부 값은 로그에 출력하지 않는다. 표준 Sigstore 생성은 공개 Fulcio/Rekor signing metadata 업로드를 수반하며, 이는 실제 실행 단계에 포함된 승인된 provenance 경계다. opaque provider credential은 기록하지 않는다.
- `stage-npm-session-package.mjs`는 CLI opt-in과 환경 opt-in이 모두 있는0.0.2 local 경로만 허용하고 truthy CI/GitHub/GitLab/Circle 환경을 차단한다. 기존 로그인 credential은 표준 npm만 읽는다. helper는 credential 파일을 읽거나 복사하지 않고 새 token을 만들지 않는다. 필요할 때만 검증한 기존 userconfig selector를 보존하며 auth 환경 override·broker URL/token·NPM_ID_TOKEN·SIGSTORE_ID_TOKEN을 child에서 제거한다. fresh owned cwd/cache/logs/tmp와 빈 global config를 사용한다.
- 기존 artifact/proof 및 fresh profile/current-maintainer gate 뒤에 genuine CLI를 한 번 호출한다. `--provenance-file`만 전달하여 이미 검증한 bundle을 공식 npm 경로로 첨부한다. 상호 배타적인 provenance boolean 옵션은 함께 지정하지 않는다. ignore-scripts·공식 registry·public access·기본 latest tag·logs-max0/timingfalse/notifierfalse를 고정한다. raw stdout/stderr/error/config/신원 값은 보관하거나 출력하지 않는다.
- exit0+exact name/version+UUID acknowledgement가 있어도 바로 성공하지 않는다. 공식 stage view의 id/packageName/version을 확인하고 공식 stage download가 기록한 정확 파일의 SHA256를 원본 canonical tgz와 비교한 후에만 success다. timeout/output cap/ack 불능/pending 불일치는 possible side effects/unknown이며 자동 재시도하지 않는다. 공개 approve/publish 명령은 없다.
- identity checker의 새 `--manual-session-version 0.0.2`는 명시 opt-in에서만 승인된 단일 service maintainer와 manual _npmUser·빈 author/contributors를 검사한다. provider-shaped ambiguity를 거부하며 bootstrap mode를 재사용하지 않는다. 기존 default provider 정책과 타버전은 그대로 유지한다. 실제 기대 신원은 승인된0.0.1 baseline에서 운영 담당자가 메모리로만 전달한다.

## 검증과 증거

증거: `output/verification/2026-10-24-session-stage/implementation/`.

- 신규 module 부재 RED 후 provenance/PURL/digest·signed run/SHA/attempt/workflow mismatch·두 verifier 필수 호출·0.0.2 opt-in·identity·기존 config selector·한 번의 CLI·ack/timeout/cap/pending·비밀 누출0 회귀를 고정했다. 실행 환경의 /var→/private 경로 alias는 directory를 표준 realpath로 정규화해 처리했다.
- 별도 official-api regression은 변경하지 않은 설치 npm11.17 generateProvenance/verifyProvenance·표준 Sigstore typed model과 실제 StageView/StageDownload class exec를 실행했다. signing/trust/registry transport만 fake로 대체했고 실제 Sigstore 암호 신뢰를 통과했다고 주장하지 않는다. 표준 tar의 합성 fixture를 사용해 view JSON·download JSON·파일명·다운로드 bytes 등8checks를 확인했다. 초기 harness의 private-method receiver 가정은 실제 class instance로 정정했다. 실제 token 발급·서명 업로드·registry network·제품 pack·stage는0회다(`official-api-summary.json`).
- 최종 focused18/18 PASS, security 전체40/40 PASS, module verify1회PASS(unit84/consumer6/typecheck/build/licenses/docs), 문법·diff PASS를 확인했다. 배포83파일/src22 및 package-lock SHA256는 전후 동일하다. 최종 docs 검사와7파일 hash는 handoff와 로그를 따른다. 새 로컬 제품 tarball은 생성하지 않는다. 기존 canonical artifact와 이전 검증 증거는 보존한다.

## 실행 인수와 잔여 위험

독립 검토·보안·privacy와 운영 GO 이후에만 새 canonical 준비 workflow를 실행한다. 운영 담당자는 실제 run/head/attempt·job outputs와 보호 artifact를 결합하여 다운로드한 묶음을 검증한다. local helper 인자는 `--allow-manual-0.0.2 <absolute-directory> <sourceSHA> <runId> <runAttempt> <tgzSHA256> <bundleSHA256>`이며 실제 기대 신원은 출력/파일 없이 메모리로 주입한다. account email/ownership/trusted-publisher는 승인/closure까지 동결한다.

이번 로컬 검증은 실제 signed bundle의 생성·공개 신뢰 통과나 실제 session staging 성공을 입증하지 않는다. 운영 단계가 실패하면 원인과 부작용 가능성을 분리하고 blind retry하지 않는다. stage 성공 뒤에도 public0.0.2 부재 확인과 사용자의2FA approve가 별도이며, 공개 metadata·registry signature/provenance·정확 소비/closure는 아직 남는다. releaseReady=false를 유지한다. 이 예외는0.0.1 예외의 자동 승계가 아니며0.0.2에 대한 별도 승인이다.

## 독립 검토 후 config-load 경계 보완

최초 동결본은 provenance-file와 명시 provenance=false를 함께 전달했다. npm11.17은 false도 명시된 옵션으로 처리하므로 이 조합은 config load에서 충돌한다. 기존 official API8checks는 이 CLI config-load 경계를 포함하지 못했다. 실제 wrapper가 생성한 exact argv와 fresh 비자격증명 user/global config로 실제 Npm.load만 실행하여 네트워크/exec0의 RED를 확인하고 false 옵션1개를 제거했다. 수정된 exact argv는 같은 공식 loader에서 GREEN이며 provenance는 default 상태로 유지되고 provenance-file만 선택된다(`config-before.json`, `config-after.json`). 영구 회귀에도 provenance boolean의 동시 지정을 금지했다.

기존 사용자 config에 명시 provenance=true/false가 있으면 provenance-file와 여전히 충돌하여 fail closed된다. 합성 selector config의 두 경우도 실제 loader로 확인했다. helper는 원래 config를 읽거나 복사·수정·자동 삭제하지 않으며 다른 인증 경로로 우회하지 않는다. 이 환경 조건에서 실제 stage가 중단되면 원인과 pending 상태를 확인하고 재승인·인증 우회를 자동 추가하지 않는다. 실제 session credential은 이 회귀에서 사용하지 않았다.

최종 수정 뒤 focused18/18·security40/40·module verify1회(unit84/consumer6/typecheck/build/licenses/docs)·문법/diff PASS를 확인했다. 로그는 focused-after-config.log, security-after-config.log, verify-after-config.log를 따른다. 배포83/src22/package-lock은 불변이며 실제 mint/signing/product pack/stage는0회다. 최종 문서 검사와7파일 hash는 재동결 handoff를 따른다.
