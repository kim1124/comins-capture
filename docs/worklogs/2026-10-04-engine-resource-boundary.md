# 외부 엔진 자원 경계 후속

작업 일자: 2026-10-04 (Asia/Seoul).

SnapDOM 3.2.0 공개 옵션/배포본 실행 순서와 modern-screenshot 4.7.0 고정 배포본·공식 소스를 비교했다. clone-only 조기 종료 경로를 확인했고 DOM 복제 재사용 가능성을 검증할 5개 fixture를 작성했다. 엔진 변경·새 제품 의존성·자체 복제 확대는 수행하지 않았다.

변경 파일: docs/engine-resource-boundary.md, 본 기록, output/playwright/workbench/clone-boundary.html, clone-boundary.mjs, clone-boundary-server.py. 기존 증거 파일과 해시 대상 server.py는 보존했다.

검증: JS 구문/Python 컴파일 통과, Python 서버 단위 8개 통과, localhost route·Host·경로 경계 4개 통과. 실제 브라우저 실행은 Mac 잠금 및 자동 해제 실패로 미실행이며, 자동 승인 검토가 Chrome 탭 생성을 거부했다. 우회 실행하지 않았다.

결과: clone-only는 후속 자원 embedding을 건너뛰지만 복제 자체의 부작용까지 안전하다고 입증하지 못했다. modern-screenshot의 fetchFn은 이미지 경로에 한정되어 자동 교체 근거가 되지 않는다. 다음은 잠금 해제 후 Chrome·실제 Safari의 clone-only 실증이다. 공개 capture·G1–G4 완료 또는 릴리즈 승인으로 간주하지 않는다.

추가 검증: 전체 research 회귀 30개 통과(기존 P0 증거 해시 포함), 변경 5개 파일 Gitleaks 검사 통과(원시 출력 폐기), 문서 상대 링크·후행 공백 검사 통과. 정식 Git diff 스캔은 최초 HEAD 부재로 미실행 상태를 유지한다.

## 잠금 해제 후 재개 — 2026-10-04 20:59 KST

위 미실행 기록은 초기 상태다. 사용자 잠금 해제 후 Computer Use로 Chrome 154.0.8037.93과 native Safari 27.0.1에서 각 5개, 총 10개 새 UUID 사례를 완료했다. 이번 실행에서 잠금·승인 거부는 발생하지 않았다.

두 브라우저 모두 CSS 배경·IMG·웹폰트는 관찰한 캡처 단계 endpoint 요청 0건이었다. pseudo 배경은 준비 요청과 별개로 캡처 단계 요청 1건, custom element는 생성자 추가 실행 1회였다. 10건 모두 clone-only 종료/render hook 0회/URL 사용 불가/원본 outerHTML 동일을 관찰했다. 원본 markup 동일성은 전체 상태 보존을 뜻하지 않는다.

결론을 clone-only 단독 경로 불충분으로 갱신했다. 외부 엔진 우선·SnapDOM 조건부 채택을 유지하면서 복제 이전 자원 제어와 custom 생성 제어의 최소 엔진 확장 범위를 다음 과제로 한정한다. 제품 소스·의존성·lockfile·공개 API는 변경하지 않았다.

추가 파일: 원시 report.json 10건, Chrome/Safari 화면 2개, output/research/engine-contract/2026-10-04-clone-boundary/report.json, test/research/clone-boundary-evidence.test.mjs. docs/engine-resource-boundary.md와 본 기록을 갱신했다. 집계에서 원시 기록·실행 fixture·엔진 등 18개 파일의 해시를 보존한다.

재개 후 검증: `npm run test:research` 32개 통과(새 기록 판정 1개·18개 파일 해시 검증 1개 포함). 이전 P0 증거 해시도 통과했다. 변경 문서 상대 링크·후행 공백과 관련 문서·시험·원시 기록·연구 실행 소스의 Gitleaks 검사 통과(원시 출력 폐기). 제품 소스 변경이 없어 제품 verify는 재실행하지 않았다. 정식 Git diff 보안 스캔은 최초 HEAD 부재로 여전히 미실행이다.

잔여 사항: 전체 네트워크 관찰·출력 품질·모바일·production preparer·SVG verifier는 이번 검증 범위 밖이다. public capture와 G1–G4 전체 통과로 보고하지 않는다. 원격 쓰기·commit·publish는 수행하지 않았다.
