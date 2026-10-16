# 최종 출력 경계 검증 기록

작업일: 2026-10-11 (Asia/Seoul). 최종 브라우저 실행 기록: 14:45:09–14:45:12 KST.

요약: 기존 SnapDOM 3.2.0 연구용 변경본으로 pseudo 3종·custom 4종을 실제 렌더했다. Chrome 154.0.8037.98 및 native Safari 27.0.1에서 각 7건 모두 제한된 기준과 일치했다. pseudo의 잔여 URL은 최종 SVG 단계에서 검증된 PNG 데이터 URI로 치환했다. 알려진 endpoint 요청·생성자 증가·관찰한 원본 변경은 0이었다.

변경 파일: output/playwright/workbench/output-boundary.html, output-boundary.mjs, output-boundary-svg.mjs, output-boundary-model.mjs, output-boundary-model.test.mjs, output-boundary-server.py; test/research/output-boundary-evidence.test.mjs; output/research/engine-contract/2026-10-11-output-boundary의 최종·중간 원시 결과와 해시 집계; output/research/output-boundary-attempt-1~4의 실행 소스 사본; Chrome·Safari 결과 화면; docs/output-boundary-probe.md; 이전 최소 확장 보고서의 후속 링크; 본 작업 기록.

제품 src·설치 엔진·기존 연구용 엔진·package.json·lockfile은 변경하지 않았다. commit·push·태그·Release·publish도 수행하지 않았다. 연구 산출물은 기존 package files 범위 밖이다.

검증 결과: 마지막 의미 있는 테스트 계약 수정 뒤 `npm run test:research` 전체 41개 통과. 최종 결과 14개, 중간 결과 42개, 관련 111개 파일 해시를 확인했다. `npm run check:licenses` 통과. 별도 회귀 검사에서 연구용 LICENSE와 설치 원문 일치를 확인했다. JS 구문·Python 서버 컴파일 통과. HTTP 정상 경로·잘못된 Host·경로 이탈·미사용 font 경로 등 5개 확인 통과. 제품 소스 변경이 없어 제품 verify는 재실행하지 않았다.

문서 상대 링크 21개와 공백 검사 통과. 관련 소스·기록·문서 85개 파일의 Gitleaks 검사 통과(원시 stdout/stderr 폐기). 이는 비밀정보 검사이며 범용 SVG 보안 검토 완료를 뜻하지 않는다. 정식 Git diff 보안 스캔은 수행하지 않았다.

실패 분류: 정상 font-size 미허용과 scroll-behavior 오탐은 시험 검사기 결함으로 수정했다. 숨김 자식 생략은 픽셀 불일치가 아닌 구조 차이였으므로 비교 계약을 표시 기하와 구조 기록으로 분리했다. 해당 회귀 검사를 실패→통과로 확인하고 중간 실행 결과를 보존했다. localhost bind/HTTP 접근의 최초 sandbox 거부는 실행 환경 문제로, 같은 로컬 명령을 허용 환경에서 실행하여 완료했다.

잔여 범위: 기준 Canvas는 원본 DOM 기하와 도형 색상에 기반하며 독립 원본 스크린샷이 아니다. 이번 검사기는 범용 sanitizer가 아니고, 전체 네트워크·실사용 페이지·폰트·모바일·고해상도·성능·G1–G4 전체는 미완료다. hidden의 원본 2개/출력 1개 구조 차이도 유지한다. 다음은 엔진 확장 공급 계약과 제품 자원 수집·출력 검증·공개 API 통합이다. 상세 근거는 [출력 경계 보고서](../output-boundary-probe.md)에 기록했다.
