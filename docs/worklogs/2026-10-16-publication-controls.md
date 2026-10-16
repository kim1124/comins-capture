# 최초 게시 통제 및 최종 후보

갱신: 2026-10-16T06:03:43.126228+00:00. Contract v1.12는 승인된 로컬 미게시본입니다.

## 원격 반영

- PR https://github.com/kim1124/comins-capture/pull/3
- 코드 보안 검토 고정 head: bf065017d804b53ba30d7c95bf48a32256becd13, base: 19a24db4d4785786fb7390044c6cc4b26e7f6111. primary4개·신규 보고 대상0건. 소스4개와 회귀 test는 최종 문서 head에서도 byte동일.
- 최종 문서 head: cc9e8a3096711feb9f79116be95be22086f85512. 보호 병합: 6c161e3985a8be9fa11317f4e25bde0a26ee245c.
- PR CI https://github.com/kim1124/comins-capture/actions/runs/38858628417 성공.
- merge CI https://github.com/kim1124/comins-capture/actions/runs/38858758991 성공.
- 실제 provider Secrets 검사 https://github.com/kim1124/comins-capture/actions/runs/38858829876 성공. bootstrap-preflight의 공용 Comins 계정 참조 연결이며 Capture 게시 후 identity 검증과 구분.
- npm Environment는 protected_branches:true/custom_branch_policies:false. Workflow도 고정 기본 브랜치만 허용.
- 원격·로컬 기본 브랜치 동일. fast-forward로 반영하고 기존 dirty19파일을 전후 해시로 보존.

## 검증과 후보

전체 verify(unit54/consumer6/type/build/license/docs42)·security9·YAML2개·Gitleaks·hook·공개 Git 신원 통과. 기존 tarball의 --existing 경로를 실제 검사했고, 이후 공개 설치 문서 보완으로 새 최종 후보를 한 번 생성하여 같은 artifact의 파일/bytes/법적 증거·추출 Gitleaks·격리 설치/SSR/API/타입 소비를 실제 통과했습니다. 두 후보의 범위를 섞지 않습니다.

새 후보: output/release-candidate/2026-10-16-0.0.1-publication/comins-capture-0.0.1.tgz
SHA-256: cdfc63775504db04ee976f3593fd432b2a5059e754eaeb45b31d5e0fe1ff0acd
81파일이며 src/dist64파일은 기존 실제 Chrome155 검증본과 동일합니다. 브라우저는 재실행하지 않았습니다. 이전 merge 후보는 그대로 보존합니다.

게시 dry-run은 성공했습니다. 증거 기록 중 원본 manifest의 runtimeHashes/sourceHashes 구분과 npm11의 publish JSON이 package name key로 감싸진 구조를 반영하지 못한 보조 명령이 실패했습니다. 실제 manifest 필드·설치 CLI 소스·캐시된 성공 JSON으로 원인을 확인하고 기록만 정정했습니다. 제품/보안 코드나 성공한 전체 gate는 수정·재실행하지 않았습니다.

## 현재 게시 상태

게시 직전 source/CI·provider 신원 검사·현재 profile의 이메일 검증/auth-and-writes2FA/개인 fullname 부재·PVR·dependency alerts·npm Environment·tarball digest·registry404를 확인했습니다. 자동화 토큰 없이 정확한 새 tarball의 대화형 npm publish를 시작했고 현재 웹2FA 승인을 기다립니다. 일회성 인증 링크·OTP·토큰·원시 신원은 이 기록에 저장하지 않습니다. 아직 게시 성공으로 판정하지 않습니다.

승인 뒤 exact0.0.1 registry 확인, npm trust github의 repo kim1124/comins-capture/file publish.yml/environment npm/allow-publish=false/allow-stage-publish=true 등록, npm access set mfa=publish, 정확한 bootstrap-version identity, integrity/서명/provenance·공개 consumer 검증을 진행합니다. 실제 실행·provider readback 전에는 해당 항목 완료를 주장하지 않습니다. OIDC stage 실사용도 별도 운영 결과입니다.

## 게시 후 확인 — 2026-10-16 KST

유지관리자의 승인 뒤 이전 게시 프로세스가 남아 있지 않음과 exact0.0.1의404를 확인했습니다. 같은 최종 tarball의 SHA-256을 다시 확인하고 자동화 토큰 환경 변수를 제외한 대화형 npm publish를 실행했습니다. CLI가 성공했고 정확한0.0.1과 latest를 공식 npm CLI로 확인했습니다. 계정 설정과 기존 캐시가 없는 빈 user/global 설정·별도 캐시의 익명 조회도 통과했습니다. 초기 익명 urllib 조회의404 원인은 확정하지 않으며 게시 성공은 CLI·공개 tarball·실제 소비 결과를 함께 근거로 합니다.

- 공개 tarball SHA-256: cdfc63775504db04ee976f3593fd432b2a5059e754eaeb45b31d5e0fe1ff0acd. 최종 후보와 동일하며 후보를 다시 pack하지 않았습니다.
- 정확한 registry integrity도 후보와 일치합니다. 공개 tarball의81파일 allow-list·소스 bytes·법적 고지·Gitleaks·격리 설치/SSR/API/타입 검사가 통과했습니다.
- 별도 소비 프로젝트에서 `npm install --ignore-scripts --save-exact comins-capture@0.0.1`과 실제 공개 API·SSR·오류·deep import 차단 검사가 통과했습니다.
- 공개 버전에는 registry 서명2개가 있으며 `npm audit signatures --json`이 exit0, invalid0/missing0으로 통과했습니다.
- 실제 bootstrap-version 게시자·maintainer 기대 신원 대조가 https://github.com/kim1124/comins-capture/actions/runs/38860004476 에서 성공했습니다. head는 보호 병합6c161e3985a8be9fa11317f4e25bde0a26ee245c입니다. 원시 신원은 저장하지 않았습니다.
- repo kim1124/comins-capture·file publish.yml·environment npm·stage publish 전용 trusted publisher 생성 명령은 성공했습니다. 별도 `npm trust list` 재조회는 EOTP여서 설정 재조회까지 완료로 표시하지 않습니다.
- `npm access set mfa=publish`는 웹2FA 승인을 대기 중입니다. 토큰 우회 차단 적용 완료를 주장하지 않으며 일회성 인증 URL은 저장하지 않습니다.
- 공개0.0.1의 dist.attestations는 없습니다. 대화형 bootstrap 게시를 OIDC provenance로 표시하지 않습니다. 후속 trusted publishing 실행도 아직 미실행입니다.

판정: **published, not closed**. 추가 npm 웹 인증·trusted publisher 재조회·토큰 게시 차단 적용 확인과 provenance 항목의 명시적 처리가 남았습니다. 최초 버전을 덮어쓰거나 승인 없이 다음 버전을 게시하여 증거를 맞추지 않습니다. root SECURITY.md 지원 버전만 실제 게시 결과에 맞게 로컬 갱신했으며 미커밋·미게시 상태입니다. 원격·로컬 코드와 고정 배포 후보는 변경하지 않았습니다.

보조 검증에서 같은 `/dev/null`을 user/global 설정으로 중복 지정한 익명 조회가 실패했습니다. 각각 별도의 빈 파일로 분리한 동일 검증은 성공했습니다. 제품·배포 파일 변경은 없었습니다. 기존 전체 verify·Chrome155 결과는 앞 절의 고정 입력 범위에서 재사용하며 이 후속 확인에서 전체 테스트나 브라우저를 새로 실행한 것으로 보고하지 않습니다.

후속 문서 정합성은42문서·한영10쌍·로컬 링크235개에서 통과했습니다. 변경한 지원 정책·인계·운영 기록3개의 Gitleaks 검사와 git diff --check도 통과했습니다. 원격 기본 브랜치를 실제 fetch한 뒤 로컬/원격이 모두6c161e3985a8be9fa11317f4e25bde0a26ee245c임을 확인했습니다. 이 지원 정책과 운영 기록은 로컬 미커밋이며 기존 사용자 변경은 보존했습니다. 브랜치·임시 checkout 삭제, 태그·GitHub Release·웹사이트 배포는 수행하지 않았습니다.

## 후속 보안 설정과 정책 정합성 확인 — 2026-10-16 KST

이전 게시 보안 설정의 대기 프로세스가 종료되었고 남은 동일 프로세스가 없음을 확인했습니다. 승인된 `mfa=publish` 설정을 다시 실행하여 새 npm 웹2FA 인증을 대기 중입니다. npm 웹페이지는 실제0.0.1·Public을 표시하며 Settings 접근도 Security key 인증으로 이동했습니다. 사용자 보안 키·비밀번호·OTP를 대신 취급하지 않으며 인증 대기를 설정 성공으로 기록하지 않습니다.

현재 [npm staged publishing 공식 안내](https://docs.npmjs.com/staged-publishing/)는 신규 패키지도 staging할 수 있고 공개0.0.0-stage placeholder 뒤에 유지관리자가 실제 버전을 승인하는 방식을 설명합니다. 따라서 적용 중인 로컬 미게시 Governance RELEASE_POLICY의 신규 패키지는 stage할 수 없다는 전제는 현재 npm 동작과 다릅니다. 이미 승인·실행된 대화형 최초 게시의 이력을 바꾸지 않습니다. Governance는 독립 저장소의 공통 정책 소유자이므로 이 작업에서 해당 정책을 임의 수정하지 않았습니다.

[npm provenance 공식 안내](https://docs.npmjs.com/generating-provenance-statements/)는 지원되는 hosted CI 게시에서 증명을 생성하도록 설명합니다. 설치된 npm11.17.0도 게시 요청에 provenance attachment를 포함합니다. 현재 공개0.0.1에 증명이 없다는 사실은 확정되지만 기존 버전에 증명을 사후 추가하는 검증된 공식 경로는 확보하지 못했습니다. 증명이 있다고 표현하거나 새 버전·재게시·삭제로 기존0.0.1 증거를 대체하지 않습니다.

### 유지관리자 판단용 한정 예외안 — 미승인

대상은 comins-capture@0.0.1, SHA-256 cdfc63775504db04ee976f3593fd432b2a5059e754eaeb45b31d5e0fe1ff0acd의 최초 대화형 게시에만 한정합니다. provenance 부재를 명시적으로 수용하되 source/CI·정확한 공개 bytes·registry 서명·기대 게시자 신원·공개 consumer 검증은 기존 통과 증거를 유지하고, 게시2FA·토큰 우회 차단·정확한 trusted publisher 재조회도 완료해야 종료할 수 있습니다. 후속 버전의 OIDC provenance 요구와 공통 Governance 정책은 완화하지 않습니다. 승인 전에는 계속 published, not closed로 유지합니다.

잔여 위험은 이0.0.1의 build/source 연결에 대한 npm provenance 증명이 없다는 점입니다. 대안은 예외를 승인하지 않고 published, not closed 상태를 유지하는 것입니다. 다음 버전 게시 자체는 이번 예외안의 승인 대상에 포함하지 않습니다.

후속 확인 일시: 2026-10-16T07:39:35.742793+00:00。출시 준비 문서의 현재 상태를 published, not closed로 맞췄습니다. 문서42개·한영10쌍·링크236개의 정합성, 변경 문서4개 Gitleaks, diff hygiene, 기존 후보/공개 tarball 해시 불변을 확인했습니다. 저장소 PUBLIC·기본 브랜치 codex-governance-v111을 재확인했고 trusted publisher 재조회는 여전히 EOTP입니다. 제품·패키지·공통 정책은 변경하지 않았고 전체 verify·브라우저는 재실행하지 않았습니다.

후속 결과: `npm access set mfa=publish comins-capture`가 exit0으로 성공했습니다. 설치된 공식 libnpmaccess의 이 모드는 publish_requires_tfa=true와 automation_token_overrides_tfa=false를 전송합니다. 적용 명령 성공과 별도 provider 재조회는 구분합니다. 이후 `npm trust list comins-capture --json`을 실제 실행했으며 별도 웹2FA 승인을 대기 중입니다. JSON 모드의 인증 URL은 출력에서 마스킹되어 공식 브라우저의 실제 인증 이동에서 확인하고 사용자에게 전달했으며, 일회성 URL·OTP는 기록하지 않았습니다.

## 유지관리자 한정 예외 승인 — 2026-10-16T07:44:09.429523+00:00

유지관리자가 제시된 npm 인증 및0.0.1 한정 예외안에 대하여 “승인완료”라고 응답했습니다. 이에 따라 위 검토안의 정확한0.0.1·고정 SHA-256에 한하여 최초 대화형 게시의 provenance 부재를 수용합니다. 증명이 존재한다는 판정이 아니며 후속 버전·다른 패키지·공통 Governance 정책을 완화하지 않습니다.

게시2FA 강제·토큰 우회 차단은 앞서 실행한 공식 명령 exit0을 근거로 합니다. 기존 trusted publisher 조회 프로세스는 여전히 인증 결과를 기다리고 있어 같은 요청을 유지합니다. 유지관리자의 승인 응답과 실제 provider 조회 성공을 구분하며 현재 상태는 published, not closed입니다.

인증 경로 진단(2026-10-16T07:45:55.091872+00:00): 유지관리자의404 보고에 따라 기존 읽기 요청만 중단했습니다. 이전 공식 링크의 HTTP404를 재현했고 새 공식 CLI 링크는 HTTP302로 /escalate/webauthn에 정상 이동함을 확인했습니다. 이전 요청이 유효하지 않다는 점은 확인했지만 만료 시점·원인은 단정하지 않습니다. 새 요청의 실제 인증 결과를 대기하며 일회성 URL은 저장하지 않습니다. 로컬 브랜치 codex-capture-initial, codex-governance-v111 및 등록 worktree 1개는 삭제하지 않았습니다.

추가 원인 구분(2026-10-16T07:47:32.387991+00:00): 현재 인증 URL은 반복한 익명 초기 요청에서도302를 유지했습니다. 과거 URL의404만으로 세션과 무관한 만료를 확정하지 않습니다. [npm/cli 공식 저장소의 동일 증상 보고](https://github.com/npm/cli/issues/6242)에는 npm 웹 로그인이 없는 브라우저에서404가 발생하고 같은 웹 UI에 로그인한 뒤 해결한 사례가 있습니다. 현재 상황의 원인이라고 단정하지 않고, 유지관리자에게 로그인한 같은 Safari에서 현재 공식 링크를 열도록 안내했습니다. 인증·보안 설정을 우회하거나 OTP·비밀번호를 요구하지 않았습니다.

한정 예외 승인 반영 뒤 문서42개·한영10쌍·링크236개 검사와 변경 문서4개 Gitleaks·diff hygiene를 통과했습니다. 소스·workflow·의존성과 고정 후보 SHA-256은 그대로여서 기존 전체 verify·실제 브라우저·공개 consumer·서명 검증 증거를 해당 범위에서 재사용했습니다.

## 최종 npm 인증 및 운영 확인 — 2026-10-16 KST

유지관리자의 후속 “승인됨” 응답 뒤 기존 요청이 exit0으로 종료되었습니다. 실제 `npm trust list comins-capture` 결과는 type github, repo kim1124/comins-capture, file publish.yml, environment npm, permissions stage publish입니다. 직접 publish 권한은 없고 설정은 승인된 대상과 일치합니다. 읽기 요청의 성공을 확인했으며 새 등록이나 재게시는 수행하지 않았습니다.

정확한 공개0.0.1·latest·integrity·서명2개·후보 SHA-256 불변을 다시 확인했습니다. 실제 bootstrap-version identity workflow38860004476은 보호 병합6c161e3985a8be9fa11317f4e25bde0a26ee245c에서 성공 상태입니다. 게시2FA 강제·토큰 우회 차단은 공식 mfa=publish 설정의 성공 결과를 근거로 하며, 후속 OIDC stage 실행은 아직 미실행입니다. provenance는 없고 정확한 최초 게시 artifact에 대한 유지관리자 예외 승인으로 처리합니다.

운영 확인 항목은 완료했습니다. 공개 SECURITY.md의 미게시 지원 문구와 원격 인계·출시 상태를 실제 게시 결과에 맞추는 문서 마감을 준비합니다. 대상은 SECURITY.md·docs/HANDOFF.md·docs/release-readiness.md와 인계에서 참조하는 운영 worklog4개입니다. 제품·패키지·workflow·의존성·README·공통 정책은 변경하지 않습니다. 원격 push·PR·보호 병합은 별도 명시 승인 대상이므로 검토 가능한 로컬 커밋을 준비한 뒤 승인받습니다. 원격 문서 마감 전에는 published, not closed로 유지합니다.

## 원격 문서 마감

유지관리자가 준비된 문서 마감 커밋의 원격 push·PR·필수CI·보호 병합 진행을 승인했습니다. [PR #4](https://github.com/kim1124/comins-capture/pull/4)에 지원 정책·인계·출시 상태·운영 기록7개를 반영합니다. 이전 published, not closed 판정은 각 기록 시점의 상태이며 실제 최종 Git 반영은 해당 PR의 병합 및 CI 결과를 함께 확인합니다. 제품·패키지·workflow·의존성과 고정0.0.1 tarball은 그대로입니다.

격리 checkout의 첫 Git 신원 검사는 기본 설정을 거부하여 커밋 전에 중단했습니다. 승인된 기존 공개 소스 커밋의 handle·noreply 신원을 해당 격리 checkout에만 설정한 뒤 신원 검사와 hook을 통과했습니다. 사용자 기본 설정과 기존 작업 파일은 변경하지 않았고 원시 신원 값은 이 기록에 남기지 않습니다.
