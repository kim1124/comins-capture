# 최초 공개 배포 준비

이 문서는 유지관리자를 위한 저장소 운영 안내입니다. 현재0.0.1은 `private:true`·미배포 후보이며 정식 공개 배포 준비가 끝난 상태가 아닙니다. 승인된 로컬 미게시 Comins Contract v1.12와 일치하는 Governance의 RELEASE_POLICY·OSS_LICENSE_POLICY·SENSITIVE_DATA_STANDARD를 기준으로 정리했습니다. 공통 정책 원본은 Governance가 소유합니다.

## 현재 남은 조건

- JIS P0138:1998 공식 원문에서 A3/A4/A5/B3/B4/B5 치수 대조. 공급업체 표 일치와 계산 테스트는 원문 확인을 대체하지 않습니다.
- 공개용 package 설정·문서·Git revision과 정확한 tarball 고정. 현재 `private:true`를 자동으로 제거하지 않습니다.
- 첫 PR의 Gitleaks 필수 CI 활성화 및 공개 게시 경로 준비. 검증용 workflow는 로컬에 추가했으나 원격 실행·보호 설정은 미확인이고 publish workflow는 없습니다.
- commit·push·PR·태그·Release·npm 게시의 유지관리자 승인.

Safari는 알려진 그림자·clip 실패로 정식 지원에서 제외합니다. Edge/Firefox·실제 모바일·저사양·장기 메모리는 미검증입니다. 구현 완료와 브라우저 검증·공개 배포 완료를 각각 구분합니다.

## 후보 확정 순서

1. [출시 조건](../release-readiness.md)과 [지원 상태](../guide/support.md)의 범위·실행 증거·남은 항목을 확인합니다.
2. version·lockfile·CHANGELOG·README·docs/guide를 같은 후보에 맞춥니다. 미지원 기능을 정식 지원으로 표시하지 않습니다.
3. `npm run verify`를 실행하고 관련 브라우저 증거의 소스·설정·의존성 동일성을 확인합니다. package metadata 변경은 영향을 받는 artifact 검증을 무효화하지만 동일 runtime의 성능 결과까지 자동 무효화하지는 않습니다.
4. 최종 후보마다 한 번 `npm pack --json --ignore-scripts`로 artifact를 만들고 반환 파일 목록을 package.json의 files 허용 범위와 비교합니다. 이 저장소는 현재 release workflow가 없어 로컬 후보를 준비합니다. 이후 workflow가 도입되면 그 workflow가 생성한 정확한 artifact가 기준입니다.
5. 같은 tarball을 임시 디렉터리에 추출해 Gitleaks와 LICENSE·제3자 고지·내부 엔진 공급을 검사합니다. scanner 출력·탐지값은 보존하지 않고 상수 형태의 결과만 기록합니다.
6. 같은 tarball을 별도 소비 프로젝트에 설치해 공개 import·타입·SSR import·필요한 브라우저 소비 검사를 수행합니다. 해시·npm integrity·파일 수·검증 상태를 기록합니다.
7. 승인된 소스 revision과 정확한 후보를 연결해 게시 단계로 넘깁니다. 게시 직전에 다시 pack한 다른 파일로 바꾸지 않습니다.

문서도 배포 내용입니다. README나 docs/guide 변경 뒤에는 이전 후보가 현재 checkout 전체를 포함한다고 보고하지 않습니다. 이전 artifact·해시·검증 기록은 보존하고 새 후보 디렉터리를 사용합니다.

## 첫 게시와 이후 게시

새 npm 패키지는 registry에 존재하기 전 staged publishing/trusted publisher를 등록할 수 없으므로 첫 공개 버전은 유지관리자2FA로 대화형 bootstrap 게시합니다. 자동화 토큰은 사용하지 않습니다. 실제 최초 게시 전 현재 공식 npm 동작과 계정·패키지 준비 상태를 다시 확인해야 합니다.

첫 게시 직후 정확한 GitHub 저장소·workflow 파일·npm environment를 trusted publisher로 등록합니다. 이후에는 trusted publisher의 staged publish와 유지관리자2FA 승인을 사용하고 토큰 게시를 허용하지 않습니다. 해당 identity 검사·workflow는 아직 이 모듈에 구현되지 않았습니다. 그 준비를 완료하기 전 자동 게시가 가능하다고 안내하지 않습니다.

계정 식별 정보는 승인된 공개 handle·GitHub noreply·용도가 정해진 service identity 경계를 따릅니다. 배포용 service identity·권한·인증·소유권을 검증할 때 개인 연락처나 토큰을 로그에 노출하지 않습니다. provenance는 지원되는 GitHub Actions trusted publishing 경로에서 확인합니다.

## 게시 후 종료 조건

registry에 버전이 보이는 상태는 게시 완료 확인의 시작입니다. 정확한 버전·dist-tag·게시자/유지관리자 identity·공개 artifact 무결성·서명·provenance를 확인하고 공개본을 별도 소비 프로젝트에 설치해 검증합니다. 보호된 소스 병합·필수 CI·release run과 로컬/원격 기본 브랜치 상태도 맞춥니다.

모든 해당 확인이 끝난 뒤 종료 시각·버전·artifact·실행 결과·남은 리스크를 추가 기록합니다. 미확인 항목이 있으면 published 상태로 남기고 closed로 표시하지 않습니다. 남은 브랜치·worktree 삭제는 별도 승인 대상입니다.

현 후보의 과거 기록은 [후보 준비 보고서](../worklogs/2026-10-15-0.0.1-candidate-preparation.md), 전체 근거는 [문서 목차](../README.md)에서 찾습니다.
