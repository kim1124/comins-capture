# 참조 문서 구조 정리와 다음 후보 준비

작업일: 2026-10-16 KST. 현재 실행 모델은 gpt-6.1-sol/high이며 하위 에이전트는 사용하지 않았다. 승인된 로컬 미게시 Comins Contract v1.12를 적용한다.

## 범위와 변경

사용자 요청에 따라 독립 Sortable·Layout 모듈의 실제 문서 구성을 확인했다. 영문 README의 섹션 순서와 영문 docs/user·국문 docs/ko의 번호별 대응 구조를 Capture에 적용한다. Capture는 네 프레임워크가 동일 루트 API를 사용하므로 프레임워크 연동을 한 문서에서 설명한다.

docs/guide의 구현 계약 원본을 유지하며, docs/ko 10개는 scripts/reference-docs.mjs가 원본과 링크 매핑으로 생성한다. docs/user의 영문10개는 같은 주제의 참조 문서다. docs/README.md에서 한영 문서·저장소 운영·검증·과거 기록을 연결한다. scripts/check-docs.mjs는 생성본 일치·링크·앵커·JS/TS 문법·API 타입·오류 코드·용지 표·현재 JIS 상태와 패키지 내부 링크를 검사한다.

README는 브랜드 링크·실제 캡처 PNG·기능·설치·빠른 시작·프레임워크·API·Playground·후보 상태·지원·라이선스 순서다. 미게시 npm 설치를 안내하지 않는다. docs/assets의 미리보기는 자체 작성 fixture의 기존 Chrome 출력이며 새 브라우저 실행이나 Playground 영상으로 표시하지 않는다.

README·CONTRIBUTING·docs/README·docs/guide·docs/development/repository-guide·배포·인계·출시 문서·CHANGELOG·package.json·test/consumer/import.test.mjs, 새 docs/user·docs/ko·docs/assets와 문서 명령이 변경 대상이다. 이전 JIS 문서 변경과 기존 AGENTS/.codex 작업을 보존한다. 제품 runtime은 변경하지 않는다.

## 검증과 다음 단계

문서 정합성41문서·10언어쌍·219링크·8앵커·JS26/TS6 문법·공개 타입·오류16종·용지표를 통과한 뒤 로컬 공개용 설정으로 전환했다. private:false·publishConfig.access:public과 홈페이지·이슈·키워드를 준비하고 package files에 한영 참조·목차·미리보기를 추가했다. verify에 문서 정합성 검사를 포함했으며 consumer의 비공개 후보 전용 기대값을 공개 메타데이터 계약 검사로 교체했다. package-lock의 버전0.0.1·의존성은 변경하지 않았다. 전체 verify·artifact 검증 결과는 아래에 갱신한다. 원격 쓰기·publish·태그·사이트 배포는 이 로컬 준비에 포함하지 않는다.

## 최종 검증과 고정 후보

- PASS: npm run verify의 typecheck·build·unit52/52·consumer6/6·license·check:docs 전체 순서. 최종 문서41개·한영10쌍·앵커8개·JS26/TS6 문법·공개 타입·오류16종·용지표·패키지 내부 링크를 확인했다. 예제 문법 확인을 전체 UI 동작 검증으로 확대하지 않는다.
- PASS: 별도 detector 회귀2/2, 용지24조합. src21/dist43 총64파일은 벤치마크와 byte동일하며 의존성도 같아 기존 Chrome·framework 결과와 알려진 런타임 취약점0건 기록을 해당 범위에서 재사용한다.
- PASS: 새 후보81파일의 package files 허용 목록·파일별 원본 해시·필수 LICENSE/제3자 고지/엔진 LICENSE·provenance, 실제 추출본 Gitleaks, 계정 경로 부재, 배포 문서 상대 링크를 확인했다.
- PASS: 현재 제품·문서와 기존에 commit된 지침으로 구성한 공개 소스 트리181파일 Gitleaks. 기존 작업의 AGENTS/.codex 변경은 이 후보와 commit에 포함하지 않는다. 최종 상대 링크는221개이며 앵커8개를 확인했다.
- PASS: 동일 tarball을 별도 소비 프로젝트에 offline·ignore-scripts로 설치하여 runtime export3개·DOM 없는 import·A4/JIS 계산·잘못된 대상 오류·deep import 차단·엔진 타입 비노출과 공개 출력 타입 계약을 확인했다. 새 브라우저 실행은 하지 않았다.
- 검사 스크립트의 최초 기대 경로 upstream이 실제 검증된 vendor 경로와 달라 실패했다. 기존 라이선스 검사와 실제 tarball 목록을 대조해 검사 계약만 수정한 후 동일 artifact에서 통과했다. 제품·라이선스 파일·tarball은 변경하지 않았다.

후보: output/release-candidate/2026-10-16-0.0.1/comins-capture-0.0.1.tgz. SHA-256은 `83a229d24e2b71032d6e0876c3de58a9cdd684c5d4e767f9244d6e25a1bbd3c7`이다. package 파일 수81개이며 이전57파일 후보는 보존했다. 검사 원본은 같은 디렉터리의 pack.json·inspect.py·candidate-manifest.json이며 제품/문서별 해시·npm integrity·재사용/미실행 범위를 포함한다. 이번 후보를 다시 pack한 다른 파일로 바꿔 게시하지 않는다.

## 소스 고정과 잔여 단계

이 작업 범위만 로컬 commit으로 고정하고 candidate-manifest.json에 실제 commit을 연결한다. 기존 AGENTS/.codex 변경은 commit에서 제외한다. Git 신원은 승인된 공개 handle/noreply를 명령별 적용하며 전역/저장소 설정을 바꾸지 않는다.

NOT RUN: 원격 push·PR·hosted CI·필수 체크 활성화·새 브라우저 벤치마크·Safari/Edge/Firefox/물리 모바일·범용 보안 스캔·npm 게시·사이트 배포. Chrome 한정 조건부 품질 판정과 Safari 미해결 경계는 유지한다. 현재 완료는 문서와 로컬 후보 준비이며, 공개 배포 완료가 아니다. 다음 원격 소스 반영·CI 확인·게시 단계는 명시 승인 범위에서 진행한다.
