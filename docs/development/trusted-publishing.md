# npm 게시 통제

공통 원본은 Governance의 RELEASE_POLICY·SENSITIVE_DATA_STANDARD이며 현재 적용 v1.12는 승인된 로컬 미게시본입니다. 제품 API·배포 파일은 바꾸지 않습니다.

## 최초 게시

새 패키지는 기존0.0.1 tarball로 유지관리자가 npm 웹2FA를 수행하는 대화형 bootstrap을 사용합니다. 자동화 토큰을 사용하지 않으며 게시 직전 이메일 검증·auth-and-writes 2FA·공개 신원을 재확인합니다.

저장소 Secrets의 기대값은 평문으로 재조회하지 않습니다. 첫 게시 전에는 기본 브랜치의 verify-npm-identity.yml을 bootstrap-preflight 모드로 실행하여 기대값이 승인된 공용 Comins 계정의 기존 comins-sortable 유지관리자와 일치하는지 검사합니다. 로컬에서는 같은 공개 참조와 현재 npm profile을 비교하고 scripts/check-npm-public-identity.mjs --profile을 실행합니다. 이 참조는 첫 게시 전 신원 연결용이며 Capture의 게시 후 메타데이터 검증을 대체하지 않습니다. 값·자격 증명·값 파생 fingerprint는 기록하지 않습니다.

게시 직후 같은 read-only workflow를 bootstrap-version 모드·정확한0.0.1로 실행합니다. 정확한 버전의 유지관리자·직접 게시자 일치와 비어 있는 author/contributors를 검사합니다. trusted-version 모드는 이후 OIDC 게시에만 사용하며 직접 bootstrap 게시의 provenance를 만들어 내지 않습니다.

## Trusted publisher 설정

- 저장소: kim1124/comins-capture
- workflow: .github/workflows/publish.yml, npm 입력에는 publish.yml만 사용
- Environment: npm, 보호된 기본 브랜치만 허용
- npm trust github의 allow-publish=false·allow-stage-publish=true
- npm access set mfa=publish: 유지관리자2FA 요구·automation token 우회 차단

등록과 조회는 정확한 패키지 comins-capture에만 수행합니다. 다른 모듈의 계정·신원·trusted publisher 설정을 변경하지 않습니다. 해당 작업의2FA는 유지관리자가 npm 공식 승인 화면에서 직접 완료하며 OTP·비밀번호를 채팅으로 전달하지 않습니다.

## 후속 버전 stage

publish.yml은 workflow_dispatch와 고정 기본 브랜치에서만 실행합니다. 입력 버전이 package.json과 같아야 하고 기존 Capture 패키지와 기대 신원이 없으면 중단합니다.

verify-and-pack job은 contents:read만 가지며 전체 verify·보안 회귀를 실행합니다. verify-release-artifact.mjs가 npm pack을 한 번 실행하고 files 허용 범위·공개 export·필수 법적 증거·정확한 전체 파일 목록·소스 바이트·추출본 Gitleaks·그 tarball의 별도 설치/SSR/API/타입 소비를 검사합니다. scanner 출력과 소비 도구 오류는 공개하지 않습니다.

stage job에만 id-token:write와 npm Environment를 적용합니다. SHA 고정 action으로 같은 tarball을 전달하고 verify job의 SHA-256과 비교한 뒤 현재 npm 신원을 다시 확인하고 npm stage publish --ignore-scripts로 넘깁니다. 직접 npm publish와 npm 자동화 토큰은 사용하지 않습니다. 유지관리자의 npm2FA 승인이 있어야 공개됩니다.

후속 버전은 해당 소스에 필요한 브라우저·성능 검증도 출시 조건에 맞춰 완료해야 합니다. workflow에 포함된 Node 검증만으로 새로운 브라우저 지원을 주장하지 않습니다.

## 게시 후 종료

공개 registry의 정확한 버전·dist-tag·배포 bytes/integrity·게시자·서명/provenance·별도 공개 consumer 검증을 기록합니다. bootstrap에서 자동 provenance가 생겼다고 주장하지 않습니다. 미확인 closure 항목이 있으면 published로 남기며 closed로 표시하지 않습니다.

[공식 trusted publishing](https://docs.npmjs.com/trusted-publishers/) · [staged publishing](https://docs.npmjs.com/staged-publishing/)
