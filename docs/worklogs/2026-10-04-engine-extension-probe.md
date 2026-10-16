# 외부 엔진 최소 확장 검증 기록

작업일: 2026-10-04 (Asia/Seoul).

실제 브라우저 실행: 21:14:48–21:15:23 KST.

요약: 앞선 pseudo 요청·custom constructor 재실행을 대상으로 SnapDOM 3.2.0 연구용 복사본을 만들고 Chrome 154.0.8037.93·native Safari 27.0.1에서 각 14개 사례를 Computer Use로 검증했다. 원본 대조군 4건은 기존 문제를 재현했고 변경본 24건은 해당 요청/생성자 증가 0건, 거부·예외·취소 시 결과 반환 차단을 확인했다. 모든 사례가 시험 기대와 일치했으나 제품 지원 승인으로 간주하지 않는다.

변경: output/playwright/workbench의 clone-extension.html, clone-extension.mjs, clone-extension-runtime.mjs, clone-extension-server.py, build-clone-extension.mjs; output/research/clone-extension-engine 연구 복사본과 출처·LICENSE; 원시 보고서 28개와 결과 화면 2개; output/research/engine-contract/2026-10-04-clone-extension/report.json; test/research/clone-extension-evidence.test.mjs; docs/engine-extension-probe.md; 본 작업 기록. 이전 경계 보고서에는 후속 결과 링크만 추가한다.

제품 src·설치 엔진·package.json·lockfile은 변경하지 않았다. 연구용 복사본은 npm 배포 범위 밖이며 fork 채택이 아니다. 원격 쓰기·commit·publish는 수행하지 않았다.

환경: 기본 sandbox에서 localhost bind가 거부되어 동일 서버 명령을 허용된 실행 환경으로 재실행했다. 실제 브라우저 조작은 정상 완료했다. 소스 조사 도중 TypeScript printer 호출 인자를 잘못 지정한 읽기 전용 보조 명령 1회가 실패했고 올바른 EmitHint로 다시 확인했다. 제품 오류로 분류하지 않았다.

결과와 제한: 변경본 pseudo 허용 6건에서 원격 URL 리터럴이 clone/생성 CSS에 남았다. 최종 SVG 검증·렌더·픽셀 비교·모바일·전체 네트워크·완전한 취소 배수는 미검증이다. custom div 대체는 텍스트 보존을 확인했으며 시각·의미 동등성을 확인하지 않았다. 다음은 같은 제한 fixture의 자원 삽입과 최종 출력 검증이다.

검증: 연구 JS와 변경본 구문 검사·Python 서버 컴파일 통과. `npm run test:research` 전체 34개 통과(원시 결과와 40개 파일 해시 포함). `npm run check:licenses` 통과, 별도로 변경본 LICENSE와 설치 원문 일치 검증 통과. HTTP 정상 경로·Host·경로 이탈·사용하지 않는 font 경로 5개 확인 통과. 문서 상대 링크·공백 검사 및 관련 소스/기록/변경본 Gitleaks 통과(원시 출력 폐기). 제품 소스 변경이 없어 제품 verify는 재실행하지 않았다. 최초 HEAD 부재에 따른 정식 Git diff 보안 스캔 미실행 상태는 유지한다.
