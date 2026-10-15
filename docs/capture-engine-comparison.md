# 캡처 엔진 1차 실증 비교

SnapDOM 3.2.0을 다음 검증의 우선 후보로 유지한다. 이번 합성 화면에서 변경된 폼 값과 CSS 카운터 보존, 반복 캡처 시간은 modern-screenshot 4.7.0보다 유리했다. 다만 두 엔진 모두 스크롤·sticky 조합을 원본대로 재현하지 못했으므로 기본 엔진 채택이나 “화면 그대로” 보장은 아직 확정하지 않는다.

작성·검증일은 2026-10-02 KST이다. [1차 리서치](research.md)의 후속 실증이며 제품 구현이나 출시 검증이 아니다. 원본과 결과는 [비교 화면](../output/playwright/comparison/viewer.html)에서 확인할 수 있다.

## 범위와 환경

| 항목 | 실행 조건 |
| --- | --- |
| 대상 | `@zumer/snapdom@3.2.0`, `modern-screenshot@4.7.0` |
| OS | macOS 27.0, build 26A428, arm64 |
| 자동화 런타임 | Playwright 1.62.1, headless |
| 브라우저 | Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5 |
| 화면 | viewport 1280×900, DPR 1, 밝은 테마, ko-KR |
| 입력 | 직접 작성한 합성 DOM, 시스템 폰트, Canvas, 인라인 SVG, 열린 Shadow DOM |
| 출력 | PNG Blob, 네트워크 전송 전 캡처·인코딩 시간을 측정 |
| 반복 | 7개 시나리오 × 2개 엔진 × 3개 브라우저 × 4회 = 168회 |
| 원본 기준 | 같은 브라우저의 요소 screenshot, CSS 픽셀 기준 |

168회 모두 예외 없이 PNG를 생성했다. 점검한 원본 상태인 DOM 직렬화, 입력값·체크 상태·textarea·select, 내부 스크롤, 포커스 대상 태그, 문서 스크롤은 캡처 전후 동일했다. 이 제한된 상태 비교가 전체 애플리케이션의 무변경·메모리 안전성을 증명하지는 않는다.

제품 패키지·lockfile·Git 설정은 생성하지 않았다. 기존에 확보한 npm 배포본을 localhost에서 읽었으며 프로젝트에 타사 엔진 소스를 복사하지 않았다. 두 배포본의 MIT 선언 및 LICENSE 파일 존재를 확인했다. 신규 의존성 채택·번들링·배포의 라이선스 검토는 별도이다.

CLI 예비 실행은 Chrome 154 계열에서 수행했고 `cli-pilot/`에 분리했다. CLI가 요구하는 Firefox 빌드는 설치되어 있지 않아, 설치된 브라우저와 버전이 맞는 Playwright 1.62.1로 세 브라우저를 다시 비교했다. 아래 수치에는 예비 실행을 포함하지 않는다. 최초의 캐시 접근·localhost 바인딩 EPERM은 허용된 실행 환경에서 해결된 환경 제약이다.

## 시나리오

| 식별자 | 내용 |
| --- | --- |
| basic | 800px 카드, 한글, 그라데이션·그림자, 현재 상태를 변경한 폼 |
| complex | 기본 화면 + transform·CSS counter·Canvas·인라인 SVG·열린 Shadow DOM·스크롤 컨테이너 |
| scroll | 복합 화면에서 내부 scrollTop을 160px로 설정, sticky 머리글 포함 |
| scroll-restored | 같은 조건에서 modern-screenshot의 `features.restoreScrollPosition: true` 적용 |
| long | 기본 화면 아래 160개 데이터 행, 자손 요소 664개, 약 5748px 높이 |
| scale2 | 기본 화면을 두 배 픽셀로 출력. 장치 DPR 변경 실험은 아님 |
| width640 | 두 엔진에 `width: 640`을 전달하여 옵션 의미의 차이 확인 |

각 엔진은 새 페이지에서 처음 1회와 이어서 3회를 실행했다. 처음 측정은 페이지 내 첫 캡처이며 OS·브라우저 전체 캐시가 비어 있는 상태는 아니다. 반복 중앙값은 같은 페이지에서 수행한 3회의 중앙값이다. 엔진 순서는 SnapDOM 이후 modern-screenshot으로 고정했으며 무작위 순서나 다중 장비 성능 실험은 수행하지 않았다. modern-screenshot의 컨텍스트 재사용·Worker 최적화는 적용하지 않았다.

## 확인된 화면 차이

| 항목 | SnapDOM | modern-screenshot | 설계에 반영할 점 |
| --- | --- | --- | --- |
| 현재 폼 상태 | 입력값·체크·textarea·select 값 보존 | 텍스트 input은 보존. 체크·textarea·select는 현재 상태와 다름 | DOM 속성뿐 아니라 live property를 기준으로 검증 |
| CSS 카운터 | `항목 1`, `항목 2` 표현 보존 | 번호가 빠져 `항목 —`로 표현 | 가상 요소의 존재와 내용 재현을 별도 확인 |
| 내부 스크롤 | 스크롤된 행은 보이나 sticky 머리글이 사라짐 | 기본값에서는 맨 위 행 출력. 복원 옵션을 켜면 스크롤된 행은 나오지만 sticky 머리글이 사라짐 | 스크롤 복원 옵션만으로 원본 일치를 보장하지 않음 |
| 스크롤 컨테이너 경계 | Shadow DOM 다음 영역의 위치·스크롤바 표현 차이 | 위치·너비·경계 표현 차이 | 영역별 좌표·경계 비교 필요 |
| Canvas·인라인 SVG·열린 Shadow DOM | 샘플 콘텐츠가 출력됨 | 샘플 콘텐츠가 출력됨 | 외부 SVG·WebGL·닫힌 Shadow DOM 지원 증거는 아님 |
| WebKit 기본 스타일 | 폼의 native 외관은 원본과 다름 | 폼 상태 외에 badge 텍스트·줄바꿈·간격 차이도 관찰 | 실제 Safari 및 폰트별 추가 검증 |
| 폭 640px | 640×347, 원본을 비율 축소 | 640×433, 이 fixture에서는 우측 콘텐츠 잘림 | 크기 옵션을 외부 엔진에 그대로 전달하지 않음 |

스크롤 결과는 세 브라우저의 원본과 출력 이미지를 직접 열어 확인했다. 폼 값 보존과 폼 컨트롤의 OS별 native 외관 일치는 서로 다른 기준이다. 이번 결과를 모든 스타일·문서에 대한 결함 또는 지원 범위로 일반화하지 않는다.

SnapDOM은 `reconcile-risk` 경고를 반환했다. 권고된 `reconcile: true`의 효과와 비용은 아직 검증하지 않았다. modern-screenshot 결과 JSON의 `warnings: []`는 비교 도구가 넣은 빈 필드이며 엔진이 누락 없음을 진단했다는 뜻이 아니다. 두 엔진 모두 예외가 없더라도 시각적 차이가 남았다.

## 출력 크기

세 브라우저에서 아래 픽셀 크기가 동일하게 관찰됐다.

| 조건 | SnapDOM | modern-screenshot |
| --- | --- | --- |
| 기본 | 800×434 | 800×433 |
| 복합·스크롤 | 800×688 | 800×687 |
| 긴 문서 | 800×5748 | 800×5747 |
| 두 배 해상도 | 1600×868 | 1600×867 |
| 폭 640 | 640×347 | 640×433 |

기본 DOM의 실제 높이는 Chromium·WebKit 약 433.8125 CSS px, Firefox 약 433.8333 CSS px였다. 따라서 소수 CSS 크기의 출력 반올림 규칙도 Comins가 명시해야 한다. 폭 옵션 실험은 같은 이름의 옵션이 같은 출력 계약을 뜻하지 않는다는 증거이다. 모든 화면에서 modern-screenshot이 자르기만 한다는 의미는 아니다.

## 처리 시간

단위는 ms이며 각 칸은 **페이지 첫 캡처 / 반복 3회 중앙값**이다. 폰트 준비 이후 DOM 캡처부터 PNG Blob 완성까지를 측정했다. 원본 screenshot, 결과 이미지 decode, Base64 변환, 파일 저장은 제외했다.

| 브라우저 | 기본 SnapDOM | 기본 modern | 긴 문서 SnapDOM | 긴 문서 modern |
| --- | --- | --- | --- | --- |
| Chromium | 44.4 / 2.2 | 19.0 / 10.7 | 67.8 / 15.6 | 170.1 / 160.4 |
| Firefox | 27.0 / 3.0 | 128.0 / 120.0 | 86.0 / 19.0 | 301.0 / 307.0 |
| WebKit | 67.0 / 5.0 | 121.0 / 119.0 | 109.0 / 37.0 | 282.0 / 268.0 |

이번 반복 측정은 SnapDOM에 유리했지만 첫 실행은 Chromium 기본 카드에서 modern-screenshot이 더 빨랐다. 엔진별 품질·대기·캐시 정책이 다르므로 속도만으로 우열을 확정하지 않는다. 프레임당 처리 시간으로 녹화 fps를 보장할 수도 없다. 메모리·UI 지연·백그라운드 탭·모바일·열 상태는 측정하지 않았다.

## 이미지 차이 수치의 해석

보조 지표는 원본과 출력의 공통 영역에서 RGB 채널 중 하나라도 절대 차이가 24를 넘는 픽셀의 비율이다. 알파는 흰색 위에 합성했다. 크기 차이가 1px인 경우 겹치는 높이만 계산했고 크기 차이는 위 표에 별도로 기록했다. 리사이즈가 필요한 scale2·width640은 이 지표에서 제외했다. 통과 임계값이나 사람의 지각 품질 점수는 아니다.

| 브라우저 | 기본 SnapDOM / modern | 스크롤 SnapDOM / modern |
| --- | --- | --- |
| Chromium | 0.004% / 2.924% | 4.972% / 9.677% |
| Firefox | 0.166% / 4.546% | 5.056% / 10.955% |
| WebKit | 0.519% / 10.191% | 5.316% / 14.359% |

폰트 안티앨리어싱·native 폼 스타일·스크롤바도 차이에 포함된다. 긴 문서는 넓은 동일 배경이 일부 오류를 희석하므로 전체 픽셀 비율만으로 품질을 판단하면 안 된다. 반올림 후 0.000%도 픽셀 완전 일치를 뜻하지 않는다. 전체 수치는 [metrics.json](../output/playwright/comparison/results/metrics.json)에 기록했다.

## 초안에 추가할 권고

1. **출력 크기를 Comins가 계산한다.** 원본 CSS 크기, 출력 픽셀, 비율 유지, crop, reflow를 구분하고 반올림 규칙을 정한다.
2. **폼과 스크롤은 별도 검증 항목으로 둔다.** 현재 값·선택 상태, 내부 스크롤, sticky·fixed, Shadow DOM 경계를 포함한다.
3. **출력 성공과 충실도를 분리한다.** PNG 생성 성공과 원본 일치 여부를 다른 결과로 보고한다. 엔진 경고를 수집하되 경고 없음도 품질 보증으로 삼지 않는다.
4. **SnapDOM을 우선 추가 검증한다.** sticky 보존과 `reconcile` 효과, 웹폰트·이미지·CORS·CSP를 확인한 뒤 채택을 결정한다. modern-screenshot은 비교 후보로 유지한다.
5. **빠른 반복 캡처 수치를 녹화 보장으로 전환하지 않는다.** 녹화는 프레임 스케줄링·인코딩·부하·시간 정확도를 별도로 검증한다.

## 미실행 범위와 다음 판단

실제 Safari/iOS·Android·WebView, 외부 웹폰트·이미지, 인증 리소스·CORS·CSP, iframe, WebGL·동영상, SVG/JPEG/WebP 및 Canvas 직접 반환, 용지·crop·페이지 분할, 취소·동시 실행·언마운트·누수, 4개 프레임워크 소비 예제, 녹화는 미검증이다. 약 5748px 문서 결과는 초대형 출력 한계 검증이 아니다.

다음 단계는 SnapDOM의 스크롤·sticky 재현 가능성과 외부 자원 정책을 집중 확인하여 기본 엔진의 채택 조건을 정하는 것이다. 근거 없이 sticky 보존을 지원한다고 명세에 넣거나 별도 엔진 자동 전환을 추가하지 않는다.

## 산출물과 재현

- [비교 화면](../output/playwright/comparison/viewer.html): 브라우저·시나리오별 원본과 두 결과 이미지.
- [합성 fixture](../output/playwright/comparison/fixture.html), [측정 절차](../output/playwright/comparison/compare.js), [실행기](../output/playwright/comparison/run.mjs), [로컬 서버](../output/playwright/comparison/server.py), [분석기](../output/playwright/comparison/analyze.py).
- [Chromium 기록](../output/playwright/comparison/results/chromium-summary.json), [Firefox 기록](../output/playwright/comparison/results/firefox-summary.json), [WebKit 기록](../output/playwright/comparison/results/webkit-summary.json).

서버의 `--packages`에는 두 고정 버전 배포본을 각각 `@zumer_snapdom/package`, `modern-screenshot/package`로 푼 디렉터리를 전달한다. 원본은 [SnapDOM 3.2.0](https://www.npmjs.com/package/@zumer/snapdom/v/3.2.0), [modern-screenshot 4.7.0](https://www.npmjs.com/package/modern-screenshot/v/4.7.0)이다. `PLAYWRIGHT_MODULE`에는 설치한 Playwright 1.62.1의 `index.mjs` 경로를 지정한다. 프로젝트 루트에서 서버를 실행하고 다른 터미널에서 `node output/playwright/comparison/run.mjs chromium`을 실행한다. firefox·webkit도 순서대로 실행한다. 분석기는 NumPy와 Pillow를 사용한다.

재실행은 `results/`의 동일 이름 파일을 갱신하므로 기존 결과가 필요하면 먼저 보존한다. 브라우저 버전·OS·폰트·실행 모드가 달라지면 새 실험으로 기록한다. 이번 작업은 로컬 산출물만 작성했으며 원격 저장소 쓰기·npm 게시를 수행하지 않았다.
