# 기여 및 변경 안내

Comins Capture는 독립 저장소의 미배포0.0.1 후보입니다. 최초 범위는 연결된 정적 HTMLElement와 단일 출력입니다. [출시 조건](docs/release-readiness.md)을 확인하고, 기능 확대와 버그 수정을 구분해 요청합니다.

## 준비

Node.js 24 이상과 npm을 사용합니다. 저장소 루트에서 다음 명령을 실행합니다.

```sh
npm ci --ignore-scripts
npm run verify
```

화면 확인은 `npm run dev`, 디렉터리와 선택 검증은 [저장소 안내](docs/development/repository-guide.md)를 따릅니다. 이 저장소를 다른 Comins 모듈의 workspace 하위 패키지로 취급하지 않습니다.

## 변경 순서

1. 문제의 재현 조건·기대 결과·현재 결과와 영향을 받는 공개 API를 정리합니다. 브라우저 문제는 실제 실행 버전과 fixture를 기록합니다.
2. `src/index.ts`와 [현재 API](docs/guide/api.md)를 확인하고 범위 안에서 최소 변경합니다. 엔진 import는 `src/engine`에 격리합니다.
3. 버그를 구분하는 회귀 검증과 관련 gate를 실행합니다. 소스·타입·빌드·패키지 변경은 `npm run verify`가 기준입니다.
4. 사용자 계약이 바뀌면 `docs/guide`·README·CHANGELOG를 함께 갱신합니다. 의미 있는 구현·설정·검증 계약 변경은 `docs/worklogs`에 일시·변경 파일·검증·잔여 이슈를 기록합니다.
5. 변경 목적·결과·검증한 revision 또는 artifact·실패 및 미실행 항목을 리뷰 자료에 포함합니다. 프레임워크 번들 성공을 브라우저 실행 성공으로 표시하지 않습니다.

성공한 증거는 소스·관련 설정·의존성·fixture가 동일한 범위만 재사용합니다. 실패는 제품·테스트 계약·환경으로 분류한 뒤 영향을 받은 검증을 재실행합니다.

## 범위와 파일 보존

- 기존 변경·untracked 파일·로컬 연구 증거를 덮어쓰지 않습니다.
- crop·타일·partial·전체 페이지·Safari/모바일 확장은 [차기 버전 memory](docs/development/next-version-memory.md)의 검토 항목입니다. 과거 코드를 그대로 복원하지 않습니다.
- 신규 의존성·번들 엔진 변경은 license·원문 고지·재현 가능한 공급 경계를 함께 검토합니다.
- 원격 push·PR·태그·Release·publish·비용 발생·파괴적 정리는 유지관리자의 명시 승인 범위에서 수행합니다.

## Git 및 민감정보

새 개발 브랜치는 `codex-<작업명>` 형식을 사용하며 기존 브랜치는 임의로 바꾸지 않습니다. commit 제목과 본문은 한국어로 작성하고 API 이름은 유지합니다.

첫 commit 전 Gitleaks가 설치되어 있어야 하며 저장소 hook을 설정하고 실행합니다. 아래 hook은 실제 staged 파일을 검사하므로 staging 후 실행해야 합니다.

```sh
git config core.hooksPath .githooks
sh .githooks/pre-commit
```

개인 연락처·로컬 계정 경로·토큰·사용자 DOM 원문을 문서·fixture·로그·PR에 넣지 않습니다. Gitleaks 실패 출력·탐지값을 공유하지 않고 상수 형태의 결과만 기록합니다. scanner 부재·실패를 우회하지 않습니다. `.github/workflows/verify.yml`에 Sensitive data·Package 검사를 정의합니다. 첫 PR 전 원격 실행을 확인하고 Sensitive data를 필수 검사로 구성해야 합니다. workflow 파일의 로컬 검증과 원격 보호 설정 완료를 구분합니다.

공개 게시 절차와 후보 증거는 [출시 준비](docs/development/releasing.md)를 따릅니다. 기여 검증 통과만으로 배포 권한이나 정식 브라우저 지원이 확정되지는 않습니다.
