# 0.0.1 최초 게시 사전 확인

확인일: 2026-10-16 KST. 유지관리자의 다음 진행 지시에 따라 최초 npm 게시 준비를 진행했다. 현재 실행 모델·추론 수준은 런타임 메타데이터로 확인하지 못하여 추정하지 않는다. 적용 Comins Contract v1.12는 승인된 로컬 미게시본이다.

## 확인 결과

- 기본 브랜치·PR 병합·성공한 push CI의 소스는 모두 a8278d4fd0775e482da8b3fd00c2be5739a168a9다. 보호 상태를 재확인했다.
- 기존81파일 후보와 현재 배포 입력이 일치한다. SHA-256은 `08bd19ad119e1549f8070904748b8e569cb04dac41628e272ac44b7e63c12abf`다. 재pack·제품 코드·의존성 변경은 하지 않았다.
- 정확한 tarball에 npm publish --dry-run --ignore-scripts --access=public --tag=latest를 실행하여 이름·버전·파일 목록·integrity·shasum이 기존 후보와 일치함을 확인했다. 이는 공개 게시가 아니다.
- package files allow-list, 추출본과 현재 배포 파일의 바이트 동일성, LICENSE·고정 엔진 원문 라이선스·수정 provenance·THIRD_PARTY_NOTICES를 확인했다. 현재 license gate도 통과했다. author·contributors는 비어 있다.
- public registry에서 comins-capture는404로 조회되어0.0.1 공개 버전은 확인되지 않았다. 이는 게시 권한·이름 예약 부재를 보장하지 않는다.
- npm profile get은 E401로 거부됐다. 게시 계정·검증된 이메일·2FA·공개 서비스 신원 일치 여부는 아직 확인하지 못했다. 원문 이메일·토큰·개인정보를 출력하거나 기록하지 않았다.

## 인증과 게시 경계

유지관리자가 아이패드 사용으로 로컬 터미널 입력이 불가능함을 알려 npm CLI의 공식 웹 인증 요청을 시작했다. 로그인·2FA는 유지관리자가 npm 웹사이트에서 직접 완료한다. 비밀번호·OTP·토큰은 채팅으로 받지 않는다. 일회성 로그인 링크는 저장소·리포트에 보존하지 않는다.

최초 공개 대상은 comins-capture@0.0.1, latest, public이며 기존 검증 tarball을 그대로 사용한다. 인증 후 승인된 delivery-capable Comins 서비스 신원을 확인하고 계정 설정·소유권을 고정한 상태에서 게시한다. 새 패키지는 최초 공개 후 exact repository·workflow·npm environment의 trusted publisher 설정과 후속 staged-only 정책을 적용한다. 자동화 토큰으로 우회하지 않는다.

공개 후 registry 버전·dist-tag·게시/maintainer 신원·integrity·서명과 공개 artifact 소비를 확인해야 Closed다. bootstrap의 로컬 수동 게시를 GitHub OIDC provenance로 표현하지 않는다. 태그·GitHub Release·사이트 배포는 미실행이다.

현재 상태는 Candidate·인증 대기이며 Published나 Closed가 아니다. 증거는 output/release-review/2026-10-16-publication-preflight의 account-registry.json, candidate-dry-run.json, source-remote.json에 보존한다. 이 리포트와 HANDOFF 후속 안내는 로컬 미커밋 운영 기록이다.

## 로그인 완료 후 게시 인증 대기

2026-10-16 13:18 KST 공식 웹 로그인이 완료됐다. profile 조회·이메일 검증·auth-and-writes 2FA·기존 Sortable maintainer와의 신원 일치를 값 없는 결과로 확인했다. 공개 신원 원문은 기록하지 않는다.

동일한 tarball·소스 해시와 license gate를 직전에 확인하고 최초 게시를 요청했다. npm이 별도의 게시 2FA를 요구했다. 첫 래퍼 실행은 자식 stdin이 TTY가 아니어서 EOTP로 종료했으며, 실제 TTY에서 공식 웹 인증 응답을 대기하도록 수정했다. 비밀번호·OTP·토큰 입력을 채팅으로 요청하지 않았다. 공개 registry는 아직404이며 게시 완료로 처리하지 않는다. 로그인 성공과 실제 게시 완료를 구분한다. 인증 후 registry·파일 무결성·게시 신원·소비 검증 및 trusted publisher 설정을 이어간다.
