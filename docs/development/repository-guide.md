# 저장소 구조와 개발 명령

0.0.1 로컬 후보 기준입니다. 구현·패키지 원본은 이 독립 저장소가 소유하며, website는 별도 저장소입니다. 새 작업은 [인계](../HANDOFF.md)와 [출시 조건](../release-readiness.md)에서 현재 범위·후보·잔여 조건을 확인한 뒤 진행합니다.

## 디렉터리

| 경로 | 책임 |
|---|---|
| src/index.ts | 공개 runtime export와 타입의 기준 |
| src/capture.ts·src/core | 공개 진입점·캡처 및 snapshot 수명주기 |
| src/dom·src/resources | 정적 DOM 검사·자원 준비·네트워크 정책 |
| src/engine | 고정 외부 엔진과 모듈 소유 adapter. 공개 타입에 엔진 타입 노출 금지 |
| src/geometry·src/output·src/lifecycle | 크기·용지·배치·렌더링·오류/취소 경계 |
| playground | 공개 API를 사용하는 고정 데모 |
| examples | DOM 없는 용지 예제·프레임워크 소비 예제 |
| test | unit·consumer·타입·HTTP 통합·브라우저 fixture·연구 도구 검사 |
| scripts | 빌드·라이선스·로컬 서버·프레임워크/연구 보조 명령 |
| docs/guide | 배포되는 사용자 가이드 원본 |
| docs/development·docs/worklogs | 저장소 운영·이월 요구·시점별 증거 요약 |
| dist | 빌드 산출물. 직접 편집하지 않음 |
| output | 로컬 연구·벤치마크·후보 tarball과 원본 증거. Git 및 npm 배포 제외 |
| .githooks | staged 파일 Gitleaks pre-commit 검사 |
| .github/workflows/verify.yml | 권한 contents:read인 Sensitive data·Package CI. 원격 실행·필수 체크 활성화는 별도 |
| .gitleaks.toml | 기본 secret 검사와 공개 신원·민감 파일/경로 규칙 |

## 명령과 판정 범위

| 명령 | 확인하는 것 |
|---|---|
| npm ci --ignore-scripts | lockfile 기준 의존성 설치. 빌드는 별도 |
| npm run typecheck | 소스 타입 검사 |
| npm run build | TypeScript dist 및 고정 엔진·라이선스·provenance 생성 |
| npm run test:unit | 모듈 계산·정책·수명주기 등의 단위 검사 |
| npm run test:consumer | 공개 import·exports·SSR import·출력 타입 계약 |
| npm run check:licenses | lockfile과 설치 패키지 license 및 내부 수정 엔진 공급 정합성 |
| npm run verify | typecheck→build→unit→consumer→license 전체 순서 |
| npm run dev | 빌드 후 loopback Playground. 기본6004, CAPTURE_PORT로 변경 |
| npm run test:frameworks | tarball 기반 소비 타입·SSR·브라우저 bundle 구성. 실제 브라우저 실행은 별도 |
| node --test test/integration/resource-http.test.mjs | loopback HTTP 자원 정책·취소/회복 통합 검사 |
| npm run test:research | 연구 판정 도구의 mechanics 검사. 제품 브라우저 지원 판정 아님 |
| node --test test/security/*.test.mjs | 설치된 Gitleaks로 package 표기 허용·개인 정보 형태 거부 확인 |
| node scripts/check-public-identities.mjs | 현재 Git 신원이 공개 handle+noreply 또는 허용 service identity인지 확인 |

`npm run dev`는 HMR을 제공하지 않습니다. 소스 수정 후 다시 빌드하고 새로고침합니다. 이미지·폰트·브라우저 검사는 [입력과 자원](../guide/dom-integration.md), [프레임워크](../guide/frameworks.md), [지원 상태](../guide/support.md)의 실제 범위를 따릅니다.

Python workbench 동작을 바꾼 경우에만 아래 검사를 추가합니다. 로컬 연구 도구가 존재하는 checkout에서 실행합니다.

```sh
python3 -m unittest discover -s output/playwright/workbench -p 'test_*.py'
```

## 검증 선택과 증거

소스·타입·빌드·패키지가 바뀌면 전체 verify를 실행합니다. 문서만 수정했다면 링크·명령·예제 문법과 실제 API 정합성을 확인하며 관계없는 브라우저 벤치마크를 반복하지 않습니다. 배포 문서가 바뀌면 이전 tarball의 문서 해시는 달라지므로 다음 후보를 만들 때 artifact 검사를 다시 수행합니다.

실행 명령·시각·버전·대상 revision/artifact·pass/fail/skipped/not-run과 한계를 구분해 기록합니다. 원본 로그·화면은 새 `output/` 실행 디렉터리에 두고 이전 증거를 덮어쓰지 않습니다. 공개 가능한 요약만 worklog에 적습니다. 개인 경로·연락처·토큰·DOM 원문은 기록하지 않습니다.

검증 CI workflow는 pull_request·현재 기본 브랜치 codex-governance-v111/main push·수동 실행에 대응합니다. Actions는 commit SHA, Gitleaks는 버전·archive SHA256으로 고정합니다. author·committer와 변경 commit·현재 소스 트리를 검사하고 detector 출력은 폐기합니다. 원격 실행 및 branch protection의 필수 체크 활성화는 로컬 성공으로 대신하지 않습니다. 배포 및 첫 PR 준비는 [출시 준비](releasing.md)와 [기여 안내](../../CONTRIBUTING.md)를 확인합니다.

## 문서 갱신 기준

사용자 계약은 `docs/guide`, 현재 출시 범위는 `docs/release-readiness.md`, 재개 위치는 `docs/HANDOFF.md`, 이월 요구는 `docs/development/next-version-memory.md`에 기록합니다. 과거 `docs/api-spec.md`·연구·계획을 현재 API 설명으로 복사하지 않습니다. 배포 guide에서 저장소 전용 파일을 상대 링크로 참조하지 않습니다.
