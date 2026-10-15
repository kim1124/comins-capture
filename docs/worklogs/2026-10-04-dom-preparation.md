# DOM 준비 계층 가능성 검증 작업

작업 일자: 2026-10-04 (Asia/Seoul)

## 범위와 판단

- Ruling: P0-A 연구 resolver를 중복 구현하지 않고 이미 검증된 제품 resolveResources/createOperation을 브라우저에서 재사용한다. 연구와 제품 취득 계약의 분기를 방지한다. 비용: 연구 서버에 해당 dist 파일의 명시 route가 필요하다.
- Ruling: 이번 P0-B/C는 일반 DOM에 대한 제품 지원 판정이 아니라 승인된 제한 입력 가능성 검증이다. pseudo/Shadow/일반 SVG까지 자체 복제 구현을 확대하지 않고 미지원 대조군으로 보고한다. 비용: 공개 capture는 계속 미완료이며 범용 준비 경로의 재사용 경계를 결정해야 한다.
- Ruling: HEAD 없는 기존 독립 개발 브랜치에서 원본 파일을 보존하며 진행한다. commit 기반 skill helper 대신 이 작업 기록과 UUID 증거를 사용한다. 비용: Git diff 기반 정식 보안 스캔은 여전히 불가하다.
- CSS는 계산된 단일 url()의 제한 문법만 읽고 나머지는 명시 실패한다. 정규식 기반 범용 CSS 파서나 범용 SVG sanitizer로 취급하지 않는다.
- 이미지 바이트는 fixture에서 미리 PNG로 제공하며 취득 후 검증한다. 원본 SVG→PNG 변환은 앱 준비 단계의 합성 자원 생성이며 모듈의 일반 SVG 자원 처리 기능이 아니다.

## 검증 진행

- CSS 제한 문법/escape/미지원 grammar와 상대 기하 비교 테스트 3개: 모듈 부재 실패 확인 후 통과.
- Chrome UI에서 DOM 준비 모듈 부재로 검증 시작 실패 확인. 이후 제한 준비 구현 착수.
- Python 기존 서버 테스트 8개 통과. 명시 정적 route 외 서버 정책 변경 없음.
- 브라우저 최종 결과, 제한, 성능 수치, 리뷰 결과는 실행 후 추가한다.

## 최종 실행 및 리뷰

- preparation-1 초기 20건, preparation-2 최종 26건을 각각 새 UUID로 저장했다. 최종 결과: 제한 정상 13건, Chrome 소수 flex 기하 실패 1건, 명시 미지원 6건, 원본 변경 감지 2건, 누락 차단 2건, 취소 차단 2건.
- 26건 모두 관찰 endpoint capture 요청 0·준비 iframe 잔존 0. 의도적 원본 변경 2건 외 원본 상태 불변. 실제 설치 버전 메타데이터와 UI 실행을 각각 확인했다.
- Chrome의 179.1953125→계산 스타일 179.195px→179.1875 차이는 재현되는 준비 경로 한계다. 정수 flex 대조군 통과. 임의 epsilon/지원 범위 축소로 통과시키지 않았다.
- Ruling: 이 제한 변환을 범용 CSS·pseudo·Shadow 복제기로 확대하지 않는다. 외부 엔진 우선 원칙과 계획의 중단 기준을 적용한다. 비용: public capture 완성 전 외부 엔진의 자원 개입/복제 재사용 경계 비교가 추가로 필요하다. 자체 엔진 개발이나 엔진 교체를 확정한 것은 아니다.
- executing-plans의 단일 독립 읽기 전용 리뷰 수행: Critical/Important 없음. 최종 판정은 연구 fixture 범위다.
- Final: minor (deferred): 원격 참조가 포함된 data SVG를 resolver 결과로 주는 브라우저 대조군은 추가하지 않았다. inline SVG 미지원 검사와 구분하여 결과 문서에 한계를 명시했다.
- Final: Ruling: 리뷰가 유보한 브라우저 독립 인증, endpoint 외 네트워크, 일반 DOM/폰트/전체 시각, production SVG 안전성, 지연 resolver·엔진 실행 중 취소는 미입증으로 유지한다. UI/앱 버전은 실행자가 확인했으며 정식 지원 인증은 아니다. 비용: 해당 검증은 릴리즈 전 별도로 필요하다.
- 증거 77개 해시를 집계했고 무결성 테스트 통과. 기존 UUID 자료 덮어쓰기 없음.

## 변경 파일 및 잔여 작업

연구 코드 output/playwright/workbench/preparation-{model,dom}.mjs, preparation.mjs/html 및 server.py 명시 route; test/research/preparation-{model,evidence}.test.mjs; docs/dom-preparation-probe.md; 본 기록과 준비 계획 갱신. 제품 src·의존성·lockfile·Playground·website 변경 없음. commit/push/publish/배포 없음.

자원 누락/취소 시 준비를 시작하지 않는 경로와 안전한 제한 입력 변환의 가능성은 확인했다. 일반 DOM 준비, font face 삽입, 최종 SVG verifier는 완료하지 않았다. 다음 작업은 결과 문서의 외부 엔진 재사용 경계 확인이다.

## 최종 게이트

- npm run verify 통과: typecheck/build, unit 29, consumer 2, 의존성 라이선스.
- 최종 npm run test:research 통과: 30개. 이 중 신규 제한 문법/기하 3개와 기록/해시 2개 포함. 기록 회귀는 브라우저를 새로 실행하지 않는다.
- Python 서버 단위 테스트 8개 통과.
- 변경 연구 코드/테스트/문서 10개를 임시 디렉터리에 복사한 Gitleaks 검사 통과. 원시 stdout/stderr는 폐기했다.
- 변경 문서 상대 링크 11개 및 후행 공백 검사 통과.
- 현재 제품 소스는 변경하지 않아 실제 HTTP integration 재실행은 생략했다. 기존 결과를 이번 실행의 새 증거로 세지 않는다.
