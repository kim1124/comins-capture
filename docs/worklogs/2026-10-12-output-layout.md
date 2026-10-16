# 출력 크기·crop·용지 통합 및 실제 브라우저 검증

작업 기록: 2026-10-12 11:21 KST. 로컬 `codex-capture-initial`, 첫 commit/HEAD 없음. 중지했던 작업을 재개했다. commit·원격 쓰기·publish는 수행하지 않았다.

## 결과

- 모든 내부 snapshot 출력에 하나의 불변 LayoutPlan을 연결했다. 기본 1배, 캡처 당시 DPR 선택, 픽셀 크기, ISO/JIS 용지·방향·300 PPI·여백, CSS 좌표 crop, contain/cover/stretch·align, 배경을 처리한다.
- SVG는 CSS 크기 또는 물리 mm 크기를 사용하며 PPI를 받지 않는다. 타일은 같은 가상 출력의 고정 영역이고 전체 크기의 Canvas를 만들지 않는다. output meta에 단위·가상 전체 크기·crop·콘텐츠 교차 영역을 제공한다.
- 실패한 통합 검사는 정규화한 PNG 기본 quality를 다시 사용자 입력으로 검사한 것이 원인이었다. 이미 검증한 인코딩 설정을 직접 전달해 수정했다.
- Chrome의 엔진 SVG는 reciprocal group scale과 HTML zoom을 함께 사용한다. 이 안에 새 HTML 출력 래퍼를 넣으면 좌표·클리핑 배율이 달라졌다. 엔진 구조를 보존하는 SVG 변환으로 분리했다. Safari는 검증된 HTML 이동·배율 경로를 사용한다.
- null size/fit/PPI와 SVG/raster 옵션 혼합을 거부한다. 새로운 의존성·lockfile 변경과 공개 export 추가는 없다. 기존 Playground는 lab 경로를 유지한다.

## 변경 파일

- `src/geometry/layout.ts`, `src/geometry/paper.ts`
- `src/core/capture.ts`, `src/core/snapshot.ts`, `src/engine/contract.ts`, `src/output/svg-renderer.ts`
- `test/unit/layout.test.mjs`, `test/unit/capture-pipeline.test.mjs`
- `test/browser/output-layout.html`, `test/browser/output-layout.mjs`
- `test/types/output-options.ts`, `test/consumer/output-types.test.mjs`
- `README.md`, `AGENTS.md`, `CHANGELOG.md`, `docs/guide/{README,architecture,support,dom-integration,output-options}.md`
- 로컬 연구 서버 `output/playwright/workbench/dom-integration-server.py`와 `output/research/output-layout-final/`의 실행 증거

## 최종 검증

| 검사 | 결과 |
|---|---|
| npm run verify | 타입·빌드·unit 47·consumer 3·license 통과 |
| npm run test:research | 41 통과 |
| Python workbench tests | 8 통과 |
| resource-http integration | 실제 localhost 서버에서 2 통과 |
| Chrome 154.0.8037.98, Computer Use | 출력 11건 중 10 통과·JIS 1건 미세 차이 별도 판정, 대형 50타일 통과, 기존 DOM 10건 통과 |
| native Safari 27.0.1, Computer Use | 출력 11건·대형 50타일·기존 DOM 10건 통과 |
| 모든 최종 44개 브라우저 실행의 fixture 캡처 요청 장부 | 추가 요청 0건 |
| Gitleaks src/test/dist | 탐지 없음; 보안 diff scan 대체 아님 |
| npm pack dry-run | 61 files, 연구/test 제외·layout 및 엔진 고지 포함; 실제 tarball/배포 없음 |

최초 pack dry-run은 기본 npm cache 쓰기 EPERM으로 실패했다. 캐시 소유권을 변경하지 않고 `/tmp/comins-capture-layout-npm-cache`를 지정한 재실행이 통과했다. 제품 결함으로 분류하지 않는다.

PNG↔Canvas는 두 브라우저에서 신규 raster 9건 및 기존 DOM 4건 모두 채널 차이 0이었다. 기존 DOM의 tile 비교도 0이다. 신규 Safari tile 9건, Chrome tile 8건은 차이 0이다.

Chrome JIS B4 가로 72 PPI의 1032×729 출력만 y=364 경계행에서 RGB 채널 2580개가 최대 1/255 차이를 보였다. 알파는 동일했다. SVG viewport 이동과 명시적 matrix에서도 같은 차이가 재현되어 반 픽셀 경계의 rasterization 차이로 판단했다. 이를 제거했다고 주장하지 않는다. 해당 사례·행·최대 차이만 제한적으로 `pass-with-aa-difference`로 분류한다. 일반 허용 오차를 늘리지 않았으며 다른 위치/알파/큰 차이는 실패한다. G4 범용 정확 일치는 후속이다.

대형 검사는 20,000×10,000 가상 출력을 2000×2000 타일 50개로 생성하고 각 타일의 내부 색상을 검사했다. 캡처 이후 Canvas width/height setter에서 관찰한 최대 크기는 2000×2000이었다. 전체 프로세스·GPU 메모리의 상한은 측정하지 않았다.

## 증거와 잔여 범위

`output/research/output-layout-final/manifest.json`에 최종 44개 run UUID, 판정, 실행 파일 101개의 SHA-256을 기록했다. 같은 폴더의 `executed/`, `runs/`, 로그, Chrome/Safari 화면을 보존했다. 중간 실패 기록은 기존 workbench results에 유지한다. 이전 DOM 통합 최종 증거는 변경하지 않았다.

- Chrome JIS 경계 차이 및 브라우저 분기 범용성, 복잡한 실제 입력의 원본 화면 비교는 미완료다.
- Safari native WebP 인코딩은 기존과 같이 미지원이며 FORMAT_UNSUPPORTED로 명시한다.
- foreignObject SVG Blob URL을 img→Canvas로 옮기면 SecurityError가 발생한 경로가 있다. SVG decode 검사는 제품 renderer와 같은 data URI를 사용했다. 모든 SVG 소비 방식의 안전성·호환성을 보증하지 않는다.
- G1/G2/G3/G4 전체, Edge/Firefox·Android/iOS, 정식 보안 검증과 공개 API·프레임워크 소비·Playground 제품 API 연결은 후속이다. HEAD가 없어 정식 security diff scan을 실행하지 않았다.
- 다음 구현 단계는 내부 snapshot의 공개 소비 계약과 Playground 연결을 정리하는 것이다. 조건부 엔진 채택을 전체 출시 승인으로 확대하지 않는다.
