# SnapDOM 보완 검증: sticky와 외부 자원

SnapDOM 3.2.0은 계속 우선 후보로 유지할 수 있으나, 엔진만 호출하는 형태로는 확정한 품질·실패 처리 계약을 충족하지 못한다. 단순 sticky는 복제본 보정의 가능성을 확인했고, 폰트 취득 실패는 엔진 경고 외의 검출이 필요함을 확인했다. 이번 단계에서 제품 엔진 채택이나 제품 구현을 확정하지 않았다.

2026-10-02 KST에 [1차 실증](capture-engine-comparison.md)의 후속으로 실행했다. [이미지 비교 화면](../output/playwright/snapdom-followup/viewer.html)에서 결과를 확인할 수 있다. 같은 작업에서 사용자가 확정한 브라우저 목표·용지 체계·분할 범위는 [리서치 결정 기록](research.md)에 반영했다.

## 실행 범위

| 항목 | 조건 |
| --- | --- |
| 엔진 | `@zumer/snapdom@3.2.0`, 기본 SVG 엔진 |
| 환경 | macOS 27.0 arm64, Playwright 1.62.1 headless |
| 브라우저 | Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5 |
| 화면 | viewport 1000×800, DPR 1, 캡처 요소 640×420 |
| 자원 | 서로 다른 localhost 포트 두 개로 같은 출처·다른 출처 구분, 직접 작성한 SVG 그림, 기존 Liberation Sans Regular 폰트 |
| 옵션 | `cache: false`, `invalidate: true`, `dpr: 1`, `scale: 1`; 시나리오별 `reconcile`, `embedFonts`, 복제본 훅 변경 |
| 실행 수 | 12개 시나리오 × 3개 브라우저 = 36회, 각 조합 1회 |

36회 모두 640×420 PNG 생성에 성공했다. 확인한 원본 DOM 직렬화·스크롤·요소 크기·포커스 대상 태그는 캡처 전후 동일했다. 개별 처리 시간은 원시 기록에 남겼지만 각 1회이며 비교용 성능 수치로 해석하지 않는다. 실제 Safari·모바일 기기 검증은 수행하지 않았다.

## sticky 보정 가능성

기존 복합 화면의 영향을 줄이기 위해 열린 Shadow DOM이 없는 단일 세로 스크롤 화면을 사용했다. 내부 scrollTop은 160px이고 상단 sticky 머리글이 현재 화면에 보이는 조건이다.

| 처리 | 결과 |
| --- | --- |
| 기본 캡처 | 세 브라우저 모두 머리글 누락. 엔진 경고 없음 |
| `reconcile: true` | 머리글 누락 유지. 엔진 경고 없음 |
| 복제본 훅에서 위치 보정 | 세 브라우저 모두 머리글과 행 배치 복원 |

보정 실험은 `beforeRender`에서 해당 sticky 복제본만 `position: relative`와 `translateY(scrollTop)`으로 바꾸었다. 원본 DOM은 변경하지 않았다. Chromium·Firefox에서는 이 fixture의 전체 PNG 픽셀이 해당 브라우저의 원본 screenshot과 같았다. WebKit은 RGB 채널 차이 24를 초과하는 픽셀은 없었지만 완전한 픽셀 일치는 아니었다.

이는 단일 수직 스크롤·top 0·고정 높이 머리글이라는 제한된 조건의 실험이다. 중첩 스크롤, 가로 스크롤, transform, sticky의 하단 정지 경계, 여러 머리글, stacking context, fixed 요소에는 일반화하지 않는다. `reconcile`은 이 문제의 해결 옵션으로 사용할 근거가 없지만, 다른 레이아웃 문제에도 무효하다는 뜻은 아니다.

다음 설계에서는 현재 화면에 보이는 좌표를 복제본에서 보존하는 방법을 검증할 수 있다. 단순히 모든 sticky에 scrollTop을 더하는 코드를 제품에 도입해서는 안 된다.

## 이미지·CORS·CSP

| 조건 | 원본 화면 | 캡처 결과·경고 |
| --- | --- | --- |
| 같은 출처 이미지 | 정상 | 정상 출력, 경고 없음 |
| 다른 출처 + CORS 허용 | 정상 | 정상 출력, 경고 없음 |
| 다른 출처 + CORS 미허용 | 정상 | 대체 이미지, `image-fallback` |
| 존재하지 않는 이미지 | 로딩 실패 | 대체 이미지, `image-fallback` |
| 이미지 표시는 허용하고 `connect-src 'self'`로 교차 출처 연결 차단 | 정상 | 대체 이미지, `image-fallback` |

정상 이미지도 캡처 중 취득을 위한 재요청이 발생했다. CSP 연결 차단은 요청이 전송되기 전에 발생하므로 네트워크 요청 목록이 비어 있어도 브라우저 콘솔에 차단이 기록된다. 모든 실패 조건에서 엔진은 예외 대신 PNG를 반환했다.

따라서 확정된 기본 오류 정책을 적용하려면 Comins가 `image-fallback` 같은 실제 누락 경고를 오류로 승격해야 한다. 소비자가 부분 결과를 명시적으로 허용한 경우에만 경고와 함께 반환한다. 재요청도 네트워크 opt-in의 대상이며 임의 프록시를 자동 활성화하지 않는다.

존재하지 않는 자원 응답은 HTTP 404와 CORS 허용 헤더 부재가 함께 있는 조건이다. 이번 실험으로 순수 HTTP 실패와 CORS 실패의 내부 경로를 분리했다고 주장하지 않는다. 쿠키·인증·서명 URL·리다이렉트·실제 CDN은 미검증이다.

## 웹폰트와 조용한 대체

라틴 문구 `CAPTURE iii WWW 012345`에 다른 출처의 Liberation Sans Regular를 적용하고 `document.fonts.ready` 이후 캡처했다. 한글 웹폰트 검증은 아니다.

| 조건 | 원본의 폰트 준비 | SVG 내부 폰트 데이터 URI | 엔진 경고 | 결과 |
| --- | --- | --- | --- | --- |
| CORS 허용, 기본 폰트 삽입 | 로드 완료 | 1개 | 없음 | 웹폰트 형태 보존 |
| `embedFonts: false` | 로드 완료 | 0개 | 없음 | 다른 글꼴로 출력 |
| 폰트 URL 로딩 실패 | 준비 대기는 종료됐지만 폰트 로드 실패 | 0개 | 없음 | 실패한 원본 자체가 fallback 상태 |
| 원본 로드 완료 후 재요청만 차단 | 원본 폰트는 로드 완료 유지 | 0개 | 없음 | 원본과 다른 글꼴로 출력 |

마지막 조건이 핵심이다. 세 브라우저 모두 `document.fonts.check()`는 true였지만 캡처에 폰트가 삽입되지 않았고, PNG 생성과 경고 배열만으로 누락을 알 수 없었다. 비교 영역 전체에서 RGB 채널 차이 24를 초과하는 픽셀 비율은 Chromium 1.9245%, Firefox 2.0692%, WebKit 1.9237%였다. 이는 글꼴 차이를 보조 설명하는 값이며 품질 통과 기준은 아니다.

웹폰트 URL이 처음부터 실패한 조건에서는 원본도 이미 대체 글꼴이므로 “원본 일치”와 “의도한 폰트 로드 성공”을 구분해야 한다. `document.fonts.ready`가 끝났다는 사실만으로 두 조건을 보장할 수 없다. 폰트가 선언되지 않은 이미지·sticky 시나리오의 `fontLoaded` 값은 해당 진단 대상이 아니므로 폰트 검증에 사용하지 않는다.

## 채택 조건에 미치는 영향

1. **경고 분류가 필요하다.** 실제 자원 누락, 크기 축소, 잠재적인 레이아웃 위험을 구분한다. 모든 경고를 동일한 의미로 처리하지 않는다.
2. **폰트 검증 경로가 필요하다.** 명시된 필수 폰트의 취득 결과와 캡처 결과에 반영됐는지를 검증해야 한다. 엔진의 빈 경고 배열에만 의존할 수 없다. 이 단계에서는 제품용 검출기를 구현하지 않았다.
3. **현재 배치 보정의 적용 범위를 정해야 한다.** 단일 sticky 보정 가능성은 확인했지만 중첩·변형·하단 경계 검증을 통과하기 전에는 일반 지원으로 표시하지 않는다.
4. **네트워크 정책을 캡처 전에 적용해야 한다.** 자원이 화면에 이미 보이더라도 추가 요청이 생긴다. 이번 비교는 localhost 합성 자원의 접근을 명시적으로 허용한 실험이다.

SnapDOM 단독 호출은 확정된 기본 오류 처리와 시각적 보존 요구에 충분하지 않다. Comins 어댑터에서 위 조건을 안정적으로 충족할 수 있는지 확인한 뒤 기본 엔진을 선정한다. 이번 결과만으로 다른 엔진 도입이 필요하다고 결정하지 않는다.

## 자료와 재현

- [fixture](../output/playwright/snapdom-followup/fixture.html), [서버](../output/playwright/snapdom-followup/server.py), [실행기](../output/playwright/snapdom-followup/run.mjs), [분석기](../output/playwright/snapdom-followup/analyze.py).
- [Chromium 기록](../output/playwright/snapdom-followup/results/chromium-summary.json), [Firefox 기록](../output/playwright/snapdom-followup/results/firefox-summary.json), [WebKit 기록](../output/playwright/snapdom-followup/results/webkit-summary.json), [비교 지표](../output/playwright/snapdom-followup/results/metrics.json).

서버의 `--snapdom`에 고정 버전 `dist/snapdom.mjs`, `--font`에 LiberationSans-Regular.ttf를 전달한다. 브라우저 실행기는 `PLAYWRIGHT_MODULE`로 설치된 Playwright 1.62.1의 `index.mjs`를 지정하고 chromium·firefox·webkit을 각각 실행한다. 분석기는 NumPy·Pillow를 사용한다. 동일 이름의 결과는 재실행 때 갱신되므로 기존 증거가 필요하면 먼저 보존한다.

폰트는 기존 pdfjs-dist의 `standard_fonts`에 포함된 파일과 동봉 `LICENSE_LIBERATION`의 OFL-1.1을 확인하여 변경 없이 로컬 실험에 사용했다. 타사 엔진·폰트 파일이나 폰트가 삽입된 SVG 원문을 프로젝트에 복사하지 않았고 PNG 결과만 저장했다. 실험용 fixture·복제본 보정·로컬 서버·문서만 작성했으며 제품 구현·원격 쓰기·배포는 수행하지 않았다.
