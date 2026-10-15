# 검증 SVG 출력 및 내부 DOM 자원 통합

작업 기록: 2026-10-12 10:26 KST. 로컬 `codex-capture-initial`, 첫 commit/HEAD 없음. 중지 전 작업을 재개해 내부 통합을 마무리했다. 원격 쓰기·commit·publish는 수행하지 않았다.

## 결과

- verify 반환값에 정제·검증된 SVG를 필수화하고, snapshot은 고정된 SVG와 별도 SvgRenderer만 사용하도록 연결했다. 엔진 원본 SVG와 raster exporter를 다시 사용하는 경로를 제거했다.
- 일반 정적 HTML에서 IMG/currentSrc, 계산 CSS/pseudo 이미지, 선언된 font-face를 수집하고 resolver/명시 네트워크 정책, 파일별 decode, data URI 치환, 복제본 대응과 최종 SVG 검증을 연결했다.
- 원본 DOM 보존, 고정 snapshot, 미지원·손상 자원의 명시적 오류를 유지한다. 소비자에게 외부 엔진 타입을 노출하지 않고 공개 export는 그대로 유지했다.
- Safari의 font-width 직렬화, 엔진의 소수 CSS 크기 반올림, 타일 wrapper에 적용된 엔진 공통 display 규칙, raster와 타일의 서로 다른 좌표 배율을 보완했다.
- `<base>`의 자원 URL 해석과 Document URL의 네트워크 출처 판정을 분리했다.
- `.gitignore`의 `output/`을 `/output/`으로 좁혀 `src/output` 구현 파일이 실수로 제외되지 않도록 했다. 연구 출력은 계속 제외한다.

## 변경 파일

- `src/core/capture.ts`, `src/core/snapshot.ts`, `src/core/dom.ts`, `src/engine/contract.ts`, `src/engine/dom-adapter.ts`
- `src/dom/inspect.ts`, `src/dom/prepare.ts`, `src/resources/css.ts`
- `src/output/verify-svg.ts`, `src/output/svg-renderer.ts`, `src/output/tile.ts`
- `test/unit/capture-pipeline.test.mjs`, `test/unit/dom-resources.test.mjs`, `test/browser/*`, `test/fixtures/create-font.py`
- `.gitignore`, `AGENTS.md`, `README.md`, `CHANGELOG.md`, `docs/core-lifecycle.md`, `docs/guide/architecture.md`, `docs/guide/support.md`, `docs/guide/dom-integration.md`
- 로컬 연구 서버 및 증거: `output/playwright/workbench/dom-integration-server.py`, `output/research/dom-integration-final/`

새 npm 의존성이나 lockfile 변경은 없다. 폰트 fixture는 직접 작성한 사각형 글리프다. fontTools는 로컬 재생성 도구이며 제품에 포함하지 않는다. 고정 SnapDOM 공급본의 기존 원문 라이선스·고지·생성 검증을 유지한다.

## 재현과 검증

| 검사 | 최종 결과 |
|---|---|
| `npm run verify` | typecheck/build, unit 42, consumer 2, license 통과 |
| `npm run test:research` | 41 통과 |
| 실제 Chrome 154.0.8037.98 Computer Use | 10/10 시나리오 통과 |
| 네이티브 Safari 27.0.1 Computer Use | 10/10 시나리오 통과, WebP는 native 미지원/명시 오류 확인 |
| PNG ↔ Canvas, tiles 재조합 ↔ Canvas | 텍스트·이미지/pseudo·소수 크기·font 모두 픽셀 차이 0 |
| fixture 캡처 구간 추가 요청 | 각 실행 0건 |
| Gitleaks src/dist/test | 모두 통과, detector 출력 비보존 |
| npm pack dry-run | 58개 파일; 연구/test/src 제외, 검증기·엔진 LICENSE 포함 |
| Git 무시 규칙 | root output은 제외, src/output은 포함 대상 |

실제 tarball을 만들거나 npm에 배포하지 않았다. dry-run은 정식 출시 artifact 검사 대신이 아니다.

실패 증거를 삭제하지 않았다. 최종 `dom-integration-3` 기록은 `output/research/dom-integration-final/manifest.json`과 `runs/`에 보존했다. 소스 해시·실행 소스 복사본·verify/research 로그·pack 목록 및 Chrome/Safari 화면을 같은 폴더에 보존했다. 이전 UUID 보고서는 workbench results에 유지한다.

의미 있는 RED→GREEN 항목:

1. 원본 엔진 SVG와 다른 검증 SVG를 넣어 모든 출력이 검증본만 사용하는 회귀 검사.
2. 외부 폰트 규칙이 삽입되는 검증 누락 재현 후 최종 CSSOM/URL 검사 추가.
3. Safari의 소수 크기/폰트 alias/타일 재조합 실패를 단계별 진단한 뒤 수정.
4. 첫 src는 정상이고 두 번째 src는 손상된 폰트를 통과시키는 사례 재현 후 파일별 FontFace 검사.
5. 외부 baseURI를 문서 출처로 반환하는 오류 재현 후 실제 Document URL 사용.

## 잔여 범위와 다음 조치

- 완료 범위는 제한된 정적 HTML의 **내부** 통합이다. 공개 capture export, Playground의 제품 API 전환, size/crop/paper/PPI 전체 연결은 후속이다.
- 이번 픽셀 검사는 같은 검증 SVG의 출력 간 일관성이다. 원본 페이지 전체 시각 충실도, 대형/G4, 전체 네트워크/CORS/CSP/쿠키/G1, SVG 별도 활성 문서/G3, 여러 폰트 fallback, 복잡한 CSS/Shadow/폼 상태 및 모바일 지원은 완료 판정하지 않았다.
- native Safari WebP 인코딩 미지원은 FORMAT_UNSUPPORTED로 유지한다. JPEG/PNG/SVG/Canvas/tile은 해당 사례에서 검증했다.
- 정식 Codex Security diff scan은 resolvable HEAD가 없어서 실행하지 않았다. 첫 기준 commit 확보 후 고정 변경 범위로 수행해야 하며, Gitleaks 및 테스트 통과를 취약점 검토 완료로 대체하지 않는다.
- 다음 구현 단위는 내부 snapshot의 출력 크기·crop·용지 옵션 연결과 해당 경계 검사다. 이후 공개 capture API·프레임워크 소비·Playground 연결 및 출시 게이트를 진행한다.
