# 차기 버전 memory

기록: 2026-10-15 KST. 사용자 승인: 중단·미구현 기능을 현재 코드에서 제거하고 차기 버전으로 이월. 특정 후속 버전 번호나 구현·배포 승인은 없습니다.

## 현재 제품에서 제거

| 항목 | 이전 위치 | 재개 조건 |
|---|---|---|
| CSS crop·소수 crop·전용 meta | geometry/layout, core/snapshot, Playground | 원본 영역·단위 계약 재설계와 정수/소수 crop 회귀. Safari의 과거 4픽셀 차이 재현 |
| planTiles·snapshot.tiles·타일 타입/가상 전체 meta | geometry/tiles, core/snapshot, index | 복잡 DOM의 정확한 접합·반복 중단/취소·전체 Canvas 미할당 검증 |
| 원본 엔진 lab adapter·tileSvg | engine/snapdom-adapter, output/tile | 제품 엔진 경계와 자원/SVG 검증을 우회하지 않는 연구 경로로 별도 재검토 |
| allow-partial·failure·partial 상태 | core/capture, core/snapshot, capture | fallback DOM·누락/진단/소유권 계약을 먼저 설계. 불완전 결과 성공 반환 금지 |
| Safari 전용 출력 wrapper·viewport 대조군 | output/svg-renderer, visual-acceptance fixture | drop-shadow/inset/clip 최소 재현과 원본 대비 품질 해결 후 native Safari 재검증 |

타일·crop/그림자 진단 호출은 현재 browser/framework fixture·Playground에서 제거했습니다. 기존 연구 분석 도구와 원본 output 증거는 보존하며 제품 API가 아닙니다. 미지원 입력 거부·default deny·SVG 검증·원본 보존·취소·해제·한도는 현재 제품에 남깁니다.

ResourceKind의 미래 예약값 css/svg와 미사용 단순 operation helper도 제거했습니다. 현재 resolver 콜백 kind는 image/font이며 CSS 이미지도 image로 준비합니다. SVG 입력 정규화·독립 stylesheet 취득을 재개할 때 타입·바이트 검증·기본 deny 계약을 함께 설계합니다.

## 미구현·미보증 이월

- 전체 body/document/viewport, Shadow DOM, sticky/fixed/컨테이너 경계, 폼·scroll·focus·선택 등 화면 상태 보존.
- 복잡한 12/50타일·회전 경계 AA, 큰 출력의 메모리·장기 leak 검증.
- Safari·Edge·Firefox·실제 Android/iOS의 정식 지원과 광범위한 자원/CORS/CSP/credentials·nested SVG/font 검증.
- 자체 엔진·PDF·녹화·WebView·문단/표 행 보존 분할.

미구현 입력 처리기는 추가하지 않았습니다. 기존 명시 거부 검사는 안전한 제한으로 유지합니다. 0.0.1 자체의 Chrome 대표 single 수용·용지 규격 공식 대조·최종 패키지/라이선스 확인을 차기 과제로 미루지 않습니다.

## 재개 근거와 복구

2026-10-13 strict 실패: Chrome 30타일 398픽셀·최대 RGB 1, Safari crop 4픽셀·최대 1 및 30타일 314픽셀·최대 3. 알파 차이 0. Safari 원본/2배 shadow/clip CUA 비교 실패. 이 수치는 해결·오차 허용 승인으로 변경하지 않습니다.

증거: docs/worklogs/2026-10-13-release-acceptance.md, output/research/release-acceptance-2026-10-13/manifest.json, output/visual-acceptance/. Chrome 실행 UA 154와 설치 155를 구분하고 정확 patch 미확인은 보존합니다.

정리 전 제품·테스트·예제·문서 원본 전체는 output/maintenance/2026-10-15-initial-scope/before-cleanup.tgz에 보존했습니다. SHA-256: ea50a339851e8f72a28fa1b399ea4f887140dab1d682bf5ae80dd035ee106da8. 기존 output 연구 증거는 삭제하지 않았습니다. 별도 디렉터리에 추출해 필요한 코드만 검토하고 현재 checkout에 통째로 복원하지 않습니다.

당시 root 저장소 루트, branch codex-governance-v111, HEAD a35dbe2. 제품은 untracked/uncommitted라 HEAD만으로 복구할 수 없습니다. 외부 memory note는 이 파일·복구본·정리 worklog를 가리킵니다.
