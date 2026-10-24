# Genuine npm CLI staging의 제한된 관측

- 작업일: 2026-10-24 (Asia/Seoul).
- 로컬 기준 HEAD: `d34782d6f92df5b42f60f90145f06645a8d8cd94`.
- 범위: stage wrapper·전용 보안 test·workflow 마지막 stage 호출·기존 release-controls 계약·본 worklog의5파일. 타인 변경과 기존 Governance 변경은 보존한다.
- 모델: 구현 Sol 6.1/medium, 독립 검토·보안 변경분 검사는 Sol/high에 인계한다. 실제 런타임 모델 식별 메타데이터는 별도로 노출되지 않았다.
- 승인된 local-only Comins Contract v1.12는 미게시 상태다. 이번 작업은 로컬 구현·검증이며 실제 canonical workflow 실행은 운영 담당자의 승인된 별도 단계다. 공개 approve/publish는 사용자가 수행한다.

## 관측과 원인 경계

직접 API 진단에서는 GitHub broker200/npm exchange404가 관측됐고, 과거 genuine npm stage는 E401로 종료됐다. fresh trusted-publisher 설정은 지정 repository/workflow/environment와 stage allow/publish deny가 일치한다고 운영 담당자가 확인했다. 이 사실만으로 두 HTTP 결과가 같은 원인이거나 권한 설정이 실패 원인이라고 단정하지 않는다.

공식 npm11.17 CLI는 자체 config·User-Agent·npm-command/auth-type 및 전송 구현을 사용한다. 공식 OIDC helper는 exchange 실패를 catch하고 이후 인증 흐름으로 돌아간다. offline 증거에서는 변경하지 않은 공식 Npm.load/exec·OIDC·registry-fetch 요청 구성에 합성 전송만 적용해 이 경계를 확인했으나, 실제 registry404 원인을 밝혀낸 것은 아니다. 임의 헤더를 CLI처럼 가장하거나 버전을 변경하지 않는다.

## 변경

- `scripts/stage-npm-package.mjs`는 설치된 npm11.17.0의 genuine CLI를 shell 없이 child로 한 번 호출한다. 이미 검증된 동일 local tgz의 absolute 경로를 사용한다. wrapper가 별도 pack이나 공개 publish/approve를 호출하지 않는다. 공식 stage 내부 libnpmpack은 기존 tgz를 읽어 dryRun으로 처리하며 새 tgz를 기록하지 않는다.
- exact GitHub Actions repository/workflow/ref와 package0.0.2 및 고정 local artifact 인자를 확인하지 못하면 child를 생성하지 않는다. fresh owned cache/logs/tmp·빈 user/global config·별도 cwd의 private package boundary로 사용자/project npmrc를 읽거나 복사하지 않는다. 대소문자 NPM_CONFIG_*와 기존 npm auth fallback 및 NPM_ID_TOKEN override는 제거하며 실제 GitHub/ACTIONS/Sigstore metadata는 보존한다. registry/access/tag·ignore-scripts·logs-max0/timingfalse/notifierfalse를 고정 argv로 전달한다. provenance는 default를 유지하여 공식 public-CI 자동 활성화 계약을 보존한다.
- raw child stdout/stderr·오류 본문·URL·토큰·config를 파일이나 Actions 출력에 전달하지 않는다. stdout은 총 출력 한도 안에서 메모리에만 유지하고 stderr는 길이가 제한된 행 단위로 고정 공식 marker·HTTP status·닫힌 error code만 집계한다. 보고는 닫힌 schema와 boolean/status/enum 및 검증된 공개 acknowledgement만 포함한다. JWT/credential을 직접 해석하지 않는다.
- exit0, 공식 JSON의 exact package/name/version, UUID 형식 stageId가 모두 있어야 success다. 공식 JSON은 최상위 package name 아래의 객체다. timeout/output cap/중단/JSON 또는 acknowledgement 오류는 부작용 가능 unknown이며 자동 재시도하지 않는다. CLI 비정상 종료도 성공으로 간주하지 않고 stage 부작용 가능성을 보존한다.
- workflow는 기존 digest·현재 identity 직전 검사 뒤의 stage 명령만 wrapper로 바꾼다. 보호 ref/mode/needs, OIDC 권한·environment, verify-and-pack의 단일 artifact 생성·전송은 유지한다. release-controls는 같은 정확 local artifact 인자를 wrapper 경계에서 검사한다.

## 검증

증거: `output/verification/2026-10-24-npm-stage-observability/implementation/`.

- RED는 신규 wrapper module이 없는 상태의 계약 실행으로 확인했다(`red.log`, 경로는 repository placeholder로 정리). 구현 뒤 focused13/13 PASS(wrapper5 + 기존 release-controls8)를 확인했다.
- 합성 child로 성공 JSON·잘못된 name/version/UUID·오류 JSON·HTTP/OIDC/provenance marker·cache skip suffix·출력 한도·timeout·signal·spawn 오류·비밀 sentinel 누출0·환경격리·단일 spawn/재시도0을 검사했다. 실제 registry 요청은 없다.
- 보안 전체 gate24/24 PASS(`security.log`), module verify1회PASS(unit84/consumer6/typecheck/build/licenses/docs, `verify.log`), 문법·diff 검사PASS를 확인했다. 배포83파일 및 src22파일 SHA256는 전후 동일하다(`distribution-before.json`, `distribution-after.json`). 최종 문서 검사와5파일 고정 hash는 handoff를 따른다.

## 잔여 위험과 다음 조치

이 변경은 실제 CLI의 제한된 결과를 안전하게 관측하기 위한 도구 보완이다. genuine CLI가 앞으로 exchange/stage에 성공한다고 보장하지 않으며, 성공하더라도 특정 header가 과거 실패 원인임을 증명하지 않는다. 알려진 debug/timing/notifier 파일 경로를 억제하지만 npm 내부의 모든 종류의 파일쓰기 부재를 보장하는 선언은 아니다. 작업 전용 디렉터리는 종료 시 정리한다.

최종 독립 diff·보안·privacy 확인 후 운영 담당자가 canonical workflow의 one-pack→one-stage를 수행한다. timeout/출력 제한/응답 파싱 불능이면 업로드 여부를 별도로 확인해야 하며 자동 재실행하지 않는다. 실제 stage 성공·404 원인 해결·공개 게시·releaseReady 완료는 이번 로컬 검증 결과에 포함하지 않는다. 제품 src/dist/package와 배포83파일은 보존하고 새 로컬 pack은0회다.

Primary source: [npm11.17 publish](https://github.com/npm/cli/blob/v11.17.0/lib/commands/publish.js), [OIDC helper](https://github.com/npm/cli/blob/v11.17.0/lib/utils/oidc.js), [npm Registry API](https://api-docs.npmjs.com/).
