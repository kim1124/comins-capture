# 최초 게시 후 릴리스 통제 준비

작업일: 2026-10-16 KST. 적용 Contract v1.12는 승인된 로컬 미게시본입니다.

## 변경

기존0.0.1은 미게시이며 trusted publisher에 연결할 workflow와 신원 checker가 없었습니다. 이후 staged publish 경로를 완성하고 최초 게시 전/후의 신원을 구분합니다.

- scripts/check-npm-public-identity.mjs: 기존 Comins Sortable의 의존성 없는 검사기를 재사용하고 공식 registry 고정·profile 이메일 검증/게시용2FA/개인 fullname 검사를 추가.
- scripts/verify-release-artifact.mjs: 단일 pack·정확한 파일 목록/법적 증거/bytes·Gitleaks·실제 tarball 소비·전송 digest 검사.
- .github/workflows/publish.yml: 수동·고정 브랜치·읽기 전용 검증 job과 npm Environment/OIDC stage job 분리. 동일 tarball만 stage하며 직접 게시하지 않음.
- .github/workflows/verify-npm-identity.yml: 읽기 전용 bootstrap 사전 참조·정확한 bootstrap 게시 버전·trusted 게시 버전·현재 owner 확인.
- test/security/release-controls.test.mjs: 신원·메타데이터·package 경계·전송 변조·workflow 권한 회귀7개.
- docs/development/releasing.md·trusted-publishing.md: 절차·실제 확인 경계·미확인 closure 기록.

런타임·공개 API·package.json·의존성·lockfile·배포 docs는 변경하지 않습니다. 최초0.0.1 후보를 재pack하지 않습니다. 재사용 코드는 같은 Comins MIT 소유 범위이며 새 외부 의존성이나 배포 제3자 자산은 없습니다. 실제 release license gate는 계속 적용합니다.

## 검증 상태

신규 회귀7개·workflow2개 YAML 파싱·수동 실행과 전역 contents:read 확인은 통과했습니다. 전체 verify·정확한 기존 후보의 실제 소비·보안 diff 검토·원격 CI는 각 실행 뒤 기록합니다. staging·provider 등록·npm 게시는 아직 실행하지 않았습니다.

## 제한

최초 참조 검사는 기존 승인된 공용 Comins 계정에 대한 기대값 연결입니다. npm 계정·패키지 소유권·기대값은 사전 확인부터 게시 후 검증까지 유지관리자가 동결해야 합니다. 참조 패키지 상태를 Capture의 게시 성공으로 표시하지 않습니다.

bootstrap의 provenance, 실제 OIDC stage, 유지관리자2FA 승인과 게시 후 closure는 구현·정적 테스트와 별개의 실제 운영 결과입니다. 알려진 Safari 지원 제외와 미검증 브라우저·장기 메모리 범위를 유지합니다.

## 로컬 실행 결과

- 전체 npm run verify 통과: type/build·unit54·consumer6·license·문서42개/한영10쌍.
- node --test test/security/*.test.mjs: 신규7개와 detector2개 모두 통과.
- workflow2개 YAML 표준 파싱·수동 실행·읽기 전용 전역 권한 확인 통과.
- 기존 정확한0.0.1 tarball의 --existing 검사 성공: SHA-256·files 전체/법적 증거/bytes·추출 Gitleaks·격리 npm 설치·SSR/API·타입 소비를 실제 수행. 새 artifact를 만들지 않음.
- 로컬 build 출력은 분리 디렉터리에 두며 원래 작업 폴더의 dist에 쓰지 않음.
- 실제 npm pack 분기와 GitHub upload/download/OIDC stage는 bootstrap 전에는 실행하지 않았으며 정적 구현·단위/기존 artifact 실행 검증과 구분함.

## 공개 설치 안내 보완

최종 공개 전 README·시작/API/지원/Playground 문서에서 현재 미배포·설치 불가라고 단정하던 문구를0.0.1 계약과 공개 버전 설치 안내로 바꿉니다. 공개 전 tarball 설치 경로는 보존하며 게시 완료를 미리 주장하지 않습니다. 국문 참조를 원본에서 재생성합니다. README의 버전 범위 heading에 맞춰 check-docs의 해당 문자열만 변경하며 나머지 검증은 유지합니다.

이는 배포 문서 변경이므로 기존81파일 후보는 보존하고 새 최종 후보를 한 번 생성합니다. 기존 Chrome155 증거는 src/dist 런타임64파일의 byte동일성을 확인한 범위에서만 재사용합니다. 보안 검토한 게시 scripts/workflows4개와 security tests는 bf065017 고정본과 동일합니다.

공개 설치 안내 보완 뒤에도 full verify(unit54/consumer6/type/build/license/docs42)와 security9가 통과했습니다. 보안 diff 검토는19a24db..bf065017의 primary4개이며 신규 보고 대상 취약점0건으로 완료했습니다. 최종 문서 checkout의 해당 scripts/workflows와 회귀 tests는 고정 검토본과 byte동일합니다. 변경한 docs checker는 버전 범위 heading 문자열만 대응하며 검사 범위를 줄이지 않았습니다.
