# 0.0.1 거버넌스 보완

작업 일시: 2026-10-16 14:16 KST. 적용 Comins Contract v1.12는 승인된 로컬 미게시본입니다.

## 요약과 변경 파일

- SECURITY.md: 비공개 신고 경로, 미게시 후보 지원 상태, 브라우저·자원·엔진 보안 경계, 개인정보·배포 통제와 사고 대응.
- .github/ISSUE_TEMPLATE/01-bug-report.yml·02-feature-request.yml·config.yml: Governance 표준 템플릿을 사용하고 환경 항목만 Capture에 맞춤. 구현 범위·완료 판정은 제보자에게 요구하지 않음.
- CONTRIBUTING.md: 일반 제보와 비공개 보안 신고 안내.
- docs/development/releasing.md·docs/HANDOFF.md: 현재 CI·보호 설정과 로컬 보완/원격 미반영을 구분하고 과거 인증 대기 상태를 정정.
- 이 작업 기록: 검증과 잔여 조건 기록.

런타임·타입·패키지·의존성·workflow를 변경하지 않았습니다. 보완 파일은 현재 package files 범위 밖이며 기존 81파일 후보를 덮어쓰거나 새로 pack하지 않았습니다.

## 원격 보완 시도와 경계

설정 직전 read-only 확인에서 repository admin 권한, PVR 비활성, 기대 신원 Secrets 2개 누락을 확인했습니다. npm profile은 이메일 검증·auth-and-writes 2FA·비어 있는 개인 fullname·기존 Comins 유지관리자 신원 일치를 통과했습니다. 원시 이름·이메일·자격 증명은 출력·저장하지 않았습니다.

예정한 변경은 이 저장소의 PVR 활성화, 사용 가능한 dependency alerts 활성화, 검증된 Comins 신원 이름·이메일의 GitHub Actions Secrets 저장입니다. 자동 승인 검토가 정확한 원격 설정 변경·신원값 전송의 구체적 승인 부족으로 명령 실행을 거부했습니다. 해당 명령의 provider 쓰기는 실행되지 않았으며 우회하지 않았습니다. dependency alerts의 API403을 비활성 또는 0건으로 취급하지 않습니다.

## 검증

- npm run check:docs: 41문서·한영10쌍·로컬 링크229개·anchor8개·JS예제26개·TS예제6개·공개 API/오류/용지 정합성 통과.
- npm run check:licenses: SnapDOM MIT·TypeScript Apache-2.0·수정 번들 법적 고지 검증 통과.
- node --test test/security/sensitive-data.test.mjs: 2/2 통과.
- YAML 표준 파서로 Issue Forms3개와 필수 필드·중복 ID 검사 통과. 최초 검사 명령은 설치된 Ruby의 filter_map 미지원으로 실패했으며 호환되는 map/compact 검사로 수정 후 통과. 양식 결함이 아닌 검사 실행 환경 문제.
- 변경8파일 Gitleaks 검사 통과. stdout/stderr·탐지값을 저장하지 않음.
- Security policy resolver가 src/engine 범위에 root SECURITY.md만 적용함을 확인.
- 기존 후보 SHA-256 및 81개 배포 파일의 현재 bytes 일치 확인. artifact 불변이며 재pack하지 않음.
- 변경 파일 공백 검사·git diff --check 통과.
- 소스·타입·패키지·workflow 변경이 없어 전체 제품 verify와 브라우저 검증은 재실행하지 않음. 기존 엔진 코드 보안 검토와 동일 후보의 실행 증거를 재사용.

## 잔여 조건

- 로컬 문서·양식을 원격 기본 브랜치에 반영하고 관련 CI 확인. 유지관리자가 구체적인 원격 변경·신원 저장·PR·보호 병합 범위에 대해 후속 진행을 승인하여 해당 범위만 진행합니다.
- 승인된 기대값과 실제 게시 시점 신원 일치 확인. Secrets 생성 메타데이터만으로 값 검증을 대체하지 않음.
- npm 게시 보류 유지. 이후 bootstrap 직후 trusted publisher·npm Environment·staged-only·token publishing 차단과 게시 후 closure는 별도 단계.
- Safari·미검증 브라우저 범위는 기존 제한 유지.

## 후속 승인과 원격 보완

앞선 거부 이후 유지관리자에게 PVR·Dependabot 활성화, 검증된 Comins 공개 npm 이름·이메일의 해당 저장소 Secrets 전송·저장, 보완 파일의 PR·필수 CI·보호 병합을 구체적으로 제시했습니다. 유지관리자의 후속 진행 승인 뒤 같은 범위를 실행했습니다. npm 게시·태그·Release는 제외합니다.

- PVR 활성화 API 성공, 재조회 enabled:true.
- dependency alerts 활성화 API 성공, 활성 상태 조회와 알림 읽기 모두 성공. 열린 의존성 알림 첫 페이지0건으로 후속 페이지 없음.
- 기존 Comins 유지관리자와 현재 npm profile의 신원 일치, 이메일 검증, auth-and-writes 2FA, 비어 있는 개인 fullname 재확인.
- COMINS_NPM_PUBLIC_NAME·COMINS_NPM_PUBLIC_EMAIL을 검증한 값으로 stdin 전달하여 저장 성공. Secrets 이름 메타데이터 재확인. 원시 신원·자격 증명·값 파생 fingerprint는 저장하지 않음.
- Secrets 평문은 provider에서 재조회하지 않으며 생성 메타데이터를 신원값 재검증으로 표현하지 않음.
- 기본 브랜치 a8278d4·strict·관리자 보호·필수 Sensitive data/Package와 앱 ID15368·승인 리뷰 수0·force push/삭제 금지를 재확인. 보호를 완화하지 않음.
- PR·CI·보호 병합 결과는 완료 뒤 별도 운영 기록에 추가하며, 작성 시점에는 완료로 표현하지 않음.

## 분리된 공개 변경 검증

기존 AGENTS/.codex 변경과 미커밋 운영 기록을 포함하지 않도록 a8278d4 기반 분리 checkout에서 보완8파일만 준비했습니다. HANDOFF는 공개 base에 이번 보완 요약만 추가하여 기존 로컬 운영 메모를 함께 커밋하지 않습니다.

- 분리 checkout check:docs: 41문서·한영10쌍·로컬 링크227개 통과. 기존 로컬 checkout229개와 구분합니다.
- license gate·개인정보 detector2개·YAML3개·변경8파일 Gitleaks·diff 공백 검사 통과.
- 분리 checkout의 초기 Git 신원 검사는 설정 불일치로 실패했으며, 승인된 공개 handle/GitHub noreply를 이 checkout에만 설정한 뒤 통과했습니다. 실패 상태에서 commit하지 않았고 원시 신원은 기록하지 않았습니다.
- 기존 tarball SHA-256과 배포81파일 모두 불변입니다. 소스·타입·의존성·package·workflow 변경은 없습니다.
- PR은 기존 Sensitive data·Package 필수 CI를 그대로 실행하며 통과 전 병합하지 않습니다.
