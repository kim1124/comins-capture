# Comins Capture 1차 리서치 초안

Comins Capture는 브라우저의 DOM을 이미지·SVG·Canvas로 출력하고, 사용자 지정 크기와 용지 규격을 지원하는 프레임워크 독립 npm 모듈을 목표로 한다. 이 문서는 기존 모듈 조사, 배포본 정적 분석, 녹화 가능성 및 벤치마킹 결과를 정리한 검토용 초안이다.

조사 결론은 기존 캡처 엔진을 활용할 가능성을 우선 검증하고, Comins가 출력 규격·실패 처리·브라우저 및 프레임워크별 동작 계약을 소유하는 방향이 적합하다는 것이다. 아래의 사용자 확정 결정 외에는 권고안이며, 특정 엔진 선정이나 제품 구현 승인을 의미하지 않는다.

| 항목 | 상태 |
| --- | --- |
| 작성일 및 조사 기준일 | 2026-10-02 KST |
| 문서 상태 | 1차 검토용 초안 |
| 대상 패키지 | `comins-capture` 예정 |
| 대상 저장소 | [kim1124/comins-capture](https://github.com/kim1124/comins-capture) |
| 근거 | 같은 날짜에 진행한 공식 문서·npm registry 조회 및 일부 배포본 정적 분석 |
| 실행 검증 | 초안 작성 당시 미실행. 후속 PNG 비교는 [1차 실증 결과](capture-engine-comparison.md) 참조 |
| 후속 작업 지침 | [리서치 및 설계 검토 지침](research-guidelines.md) |

후속 근거: [SnapDOM sticky·외부 자원 보완 검증](snapdom-followup.md)에서 3개 브라우저·36회 출력을 확인했다. 단일 sticky 복제본 보정의 가능성과 경고 없는 폰트 누락을 발견했으며, 채택 조건 검증은 계속 필요하다.

## 2026-10-04 단계적 엔진 추진 방향 확정

사용자는 ‘외부 엔진 기반 제품 완성 → 회귀 자료 축적 → 자체 엔진 검증 → 교체’ 제안에 “적절하다 판단됨 그대로 계획 진행”으로 승인했다. [단계별 전환 계획](superpowers/plans/2026-10-04-engine-transition.md)을 현재 추진 순서로 사용한다. 자체 엔진 프로토타입을 먼저 개발하자는 중간 권고는 이 결정으로 대체한다.

외부 엔진은 Comins 소유 adapter에 격리하고 공개 API·자원 정책·좌표·출력·오류·수명주기를 유지한다. SnapDOM의 채택은 G1~G4 통과가 선행 조건이다. 자체 엔진 전환도 실제 브라우저 원본과 Comins 계약에 대한 비교 검증을 거쳐 수행한다. 이번 결정은 엔진 검증 면제나 원격 쓰기·npm publish 승인이 아니다.

## 확정 요구사항과 미결정 범위

### 사용자 확정 요구사항

- 브라우저 DOM 페이지 또는 대상 요소를 여러 출력 형식으로 캡처한다.
- 브라우저에 표시된 스타일과 시각적 상태를 보존하는 것을 목표로 한다.
- 사용자 지정 크기와 A3·A4·A5·B3·B4 등의 용지 규격을 지원한다.
- 지정한 크기 또는 영역으로 잘라 출력할 수 있어야 한다.
- Vanilla·React·Vue·Svelte에서 사용할 수 있어야 한다.
- 사용자 브라우저 안에서 실행하는 npm 모듈을 우선한다.
- SVG는 브라우저에서 재현되는 `foreignObject` 방식을 허용한다.
- 상위 Comins Governance 정책을 따른다.

### 2026-10-02 사용자 확정 결정

근거는 엔진 선택 방식·초기 출시 범위·실패 처리에 대한 사용자의 “권고안 확정” 응답, 지원 브라우저·용지 체계·분할 범위에 대한 “세 항목 모두 권고안으로 확정” 응답, 지원 버전·해상도에 대한 “현재 시점 최신 버전을 기준으로 잡는다. 기본값 권고대로 진행” 응답이다. 이번 결정은 제품 방향을 확정하며 특정 엔진 채택이나 제품 구현 착수를 포함하지 않는다.

| 결정 | 확정 내용 | 설계 및 검증 영향 |
| --- | --- | --- |
| 엔진 선택 방식 | 초기에는 기본 엔진 하나로 제공한다. 보완 효과가 검증된 경우에만 소비자 선택 기능을 추가한다 | 초기 다중 엔진 공개·자동 선택·자동 전환을 범위에 넣지 않는다. SnapDOM 채택은 후속 품질 검증 후 결정한다 |
| 초기 출시 범위 | 정지 캡처의 이미지·SVG·Canvas 출력, 사용자 지정 크기·용지 규격·영역 자르기를 우선한다. PDF·녹화는 후속 단계로 둔다 | 초기 완료 기준에 PDF 생성이나 녹화를 포함하지 않는다. Vanilla·React·Vue·Svelte 지원 요구는 유지한다 |
| 실패 처리 | 감지된 리소스 누락이나 요청 크기·형식 불충족은 기본 오류로 종료한다. 소비자가 명시적으로 허용한 경우만 부분 결과·축소·형식 대체를 제공한다 | 누락·축소·형식 대체를 조용히 수행하지 않는다. 감지하지 못한 시각적 차이까지 판별하거나 완전 일치를 보장하는 정책은 아니다 |
| 지원 브라우저 목표 | 데스크톱 Chrome·Edge·Firefox·Safari와 Android Chrome·iOS Safari를 초기 지원 목표로 한다. 앱 내 WebView는 후속 단계로 둔다 | 목표 선언과 실제 호환성 검증 완료를 구분한다. 실제 모바일·Safari 검증은 별도로 남는다 |
| 지원 버전 기준 | 2026-10-02 현재 일반 배포 최신 안정 버전을 초기 기준으로 한다. 최신·직전 메이저 동시 지원 제안은 채택하지 않는다 | 공식 버전 기록과 실제 검증 환경을 대조한다. 구버전 전체 호환성을 약속하지 않으며 이후 기준 갱신은 새 검증 기록과 함께 관리한다 |
| 용지 체계 | ISO와 JIS를 명시적으로 제공하고, 체계를 생략하면 ISO를 사용한다 | B 계열의 서로 다른 치수를 구분한다 |
| 초기 분할 수준 | 지정 영역 자르기와 고정 크기 분할을 제공한다. 문단·표 행 보존을 고려하는 분할은 후속 단계로 둔다 | 초기에는 의미 단위 페이지 나눔이나 반복 헤더·푸터를 약속하지 않는다. 분할 결과는 이미지·Canvas 등이며 PDF는 후속 범위를 유지한다 |
| 출력 해상도 | 일반 DOM 이미지·Canvas는 CSS 크기 기준 1배, 용지 규격의 래스터 출력은 300 PPI를 기본값으로 한다. 소비자가 배율·출력 픽셀 또는 PPI를 변경할 수 있게 한다 | 장치 DPR은 자동 기본값이 아닌 명시적 선택으로 제공한다. 용지 PPI로 계산한 픽셀에 DPR을 중복 적용하지 않는다. SVG는 크기·viewBox를 기준으로 하고 래스터 변환 시 해상도를 적용한다 |

### 최신 안정 버전 기준 기록

2026-10-02 KST에 공식 자료를 조회한 기록이다. 여기서 최신은 일반 Stable 정식 배포를 뜻하며 Beta·Dev·Nightly·Technology Preview와 소수 사용자 대상 Early Stable은 기준에서 제외한다. 이는 지원 목표의 기준 버전이며 아래 환경에서 Comins가 검증을 통과했다는 뜻은 아니다.

| 지원 대상 | 기준일의 공식 버전 기록 | 근거 |
| --- | --- | --- |
| 데스크톱 Chrome | 154.0.8037.97/.98 Windows·macOS, 154.0.8037.97 Linux | [Google 공식 릴리스 목록](https://chromereleases.googleblog.com/?hl=de)의 2026-10-01 Desktop Stable 공지 |
| 데스크톱 Edge | 154.0.4258.53 | [Microsoft Stable 릴리스 노트](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-relnote-stable-channel), 2026-10-01 |
| 데스크톱 Firefox | 157.0 | [Mozilla 공식 버전 데이터](https://product-details.mozilla.org/1.0/firefox_versions.json)의 `LATEST_FIREFOX_VERSION`, 릴리스일 2026-09-29 |
| 데스크톱 Safari | Safari 27 | [Apple 공식 릴리스 목록](https://support.apple.com/en-us/100100), 2026-09-14 |
| Android Chrome | 154.0.8037.126 | [Google 공식 릴리스 목록](https://chromereleases.googleblog.com/?hl=de)의 2026-10-01 Android 공지 |
| iOS Safari | iOS 27.0.1에 포함된 Safari, 실제 브라우저 빌드 미확인 | [Apple 공식 릴리스 목록](https://support.apple.com/en-us/100100), iOS 27.0.1은 2026-09-28. 실제 Safari 세부 빌드는 기기 검증 때 기록 |

Google 목록에는 Chrome 155 Early Stable도 존재하므로 일반 Stable 154와 구분했다. 단계적 배포에 따라 설치 가능한 세부 빌드가 다를 수 있다. 데스크톱 Chrome의 OS별 버전 표기는 공식 공지의 구분을 옮긴 것이며 모든 데스크톱 OS 조합을 이미 지원한다는 선언은 아니다.

기존 비교 실증의 Chromium 151.0.7922.34·Firefox 153.0·WebKit 26.5는 엔진 비교 근거로 보존한다. 해당 결과를 위 최신 정식 브라우저 기준의 호환성 검증 완료로 승격하지 않는다. Chrome 154.0.8037.93 예비 실행도 이번 기준의 최신 패치 및 전체 시나리오 검증을 대신하지 않는다.

### 출력 해상도 적용 지침

- 일반 화면 캡처의 1배는 CSS px와 출력 px를 1:1로 대응시키는 기준이다. 예를 들어 800×600 CSS px은 기본 800×600px, 소비자가 2배를 선택하면 1600×1200px이다.
- 용지 출력은 물리 크기와 PPI로 픽셀을 계산한다. A4 210×297mm, 300 PPI는 반올림 기준 약 2480×3508px이다. 150·600 PPI 등은 소비자가 선택할 수 있으나 출력 한도를 초과하면 기본 오류 정책을 따른다.
- SVG의 크기·viewBox와 래스터 해상도를 구분한다. SVG 안의 이미지·Canvas 같은 기존 래스터 자원의 세부 정보가 해상도 설정만으로 늘어나는 것은 아니다.
- 출력 픽셀 수와 DPI 메타데이터는 별개이다. Canvas `toBlob()`은 메타데이터를 지원하는 형식에 96dpi를 기록하므로, 의도한 물리 출력 크기를 파일에 전달할 때 별도 처리가 필요하다. [MDN toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- 엔진의 DPR 기본값에 의존하지 않는다. 장치 DPR 적용은 명시적 선택이며, 용지 PPI와 중복 곱하지 않는다. 여러 크기 옵션을 함께 전달할 때의 우선순위·오류 규칙은 API 명세에서 정한다.

### 후속 후보와 미결정 기능

PDF·동영상 녹화·WebView·문단 및 표 행 보존 분할은 초기 출시에서 제외하고 후속 단계로 확정했다. 후속 도입 시점과 녹화 대상·오디오·포맷·지원 환경은 미결정이다. 실제 프린터 출력은 확정 범위가 아니다.

순수 벡터 SVG, 서버·헤드리스 실행, 임의 URL 캡처, HTML 문자열 실행, 세션 리플레이, 영상 편집은 현재 확정 요구에 포함되지 않는다. 후속 검토 없이 기본 기능으로 추가하지 않는다.

### 정책과 현재 프로젝트 상태

공통 실행 정책의 원본은 [Comins Contract v1.8](https://github.com/kim1124/comins-governance/blob/main/COMINS_CONTRACT.md)이다. 로컬 원본은 형제 저장소의 [Contract](../../governance/COMINS_CONTRACT.md)이며, 이 문서가 공통 정책을 대체하지 않는다.

초기 조사에서 GitHub 저장소는 커밋이 없는 상태였고 로컬 프로젝트에도 Git·패키지·구현·검증 명령이 없었다. 후속 작업으로 문서와 별도 실증 자료를 추가했다. npm 이름의 사용 가능 여부, 패키지 매니저, 패키지 버전 정책, 실제 OS·기기 검증 조합은 별도 확정이 필요하다.

## 근거의 해석 기준

| 근거 유형 | 확인한 내용 | 확인하지 못하는 내용 |
| --- | --- | --- |
| 공식 문서 | 제공 API, 문서상 동작과 제한 | 실제 서비스 화면에서의 품질 |
| npm 메타데이터 | 조회 시점의 배포 버전, 날짜, 라이선스 선언 | 라이선스 의무의 최종 충족, 패키지 안전성 |
| 배포본 정적 분석 | 고정 버전의 코드 경로와 타입 선언 | 실행 성공, 브라우저별 재현 여부 |
| 공식 이슈 | 보고된 증상과 조회 시점의 상태 | 현재 배포본의 재현 가능한 결함 |
| 설계 권고 | Comins 적용 방향과 우선순위 | 승인된 제품 명세 |

버전 표는 2026-10-02에 조회한 `latest`의 기록이다. 이후에도 최신이라는 의미가 아니며, 라이브 문서와 고정 배포본의 기능 차이는 채택 전에 다시 대조한다. 자체 벤치마크·별 수·다운로드 수를 성능이나 품질의 증거로 사용하지 않았다.

## DOM 캡처 엔진 비교

| 후보 | 확인 버전 | 문서상 특징 또는 확인된 제한 | 조사 판단 |
| --- | --- | --- | --- |
| [html-to-image](https://github.com/bubkoo/html-to-image) | 1.11.13 | DOM 복제·스타일·폰트 삽입과 `foreignObject` 방식. 여러 출력 API 제공 | 비교 기준으로 유지 |
| [modern-screenshot](https://github.com/qq15725/modern-screenshot) | 4.7.0 | 컨텍스트 재사용, Worker 활용, 리소스 로딩 옵션. CSS counter 관련 TODO 존재 | 우선 실증 후보 |
| [SnapDOM](https://github.com/zumerlab/snapdom) | 3.2.0 | 재사용 결과, 경고·좌표 정보, 분할 출력, 확장 플러그인 | 우선 실증 후보 |
| [html2canvas](https://html2canvas.hertzen.com/documentation) | 1.4.1 | DOM 정보를 해석하여 다시 그림. 실제 화면과의 차이를 공식적으로 명시 | 다른 렌더링 방식의 비교 기준 |
| [html2canvas-pro](https://yorickshan.github.io/html2canvas-pro/features.html) | 2.5.0 | 현대 CSS 지원 확장. 필터·마스크 등 세부 제약 존재 | 보완 비교 후보 |
| [dom-to-image-more](https://github.com/IDisposable/dom-to-image-more) | 3.11.0 | 복제·리소스 처리 확장. 공식 문서에서 Safari를 지원 대상으로 보지 않음 | 브라우저 요구상 우선순위 낮음 |

위 여섯 패키지의 라이선스 메타데이터는 MIT였다. 특정 엔진의 채택은 결정하지 않았다. 초기에 여러 엔진을 자동 전환하면 크기·리소스·누락 처리까지 달라질 수 있으므로, 내부 어댑터 경계를 두되 기본 엔진은 검증 후 선정하는 것을 권고한다.

## 추가 모듈과 인접 기능 비교

| 후보 | 확인 버전 | 역할 | Comins에 참고할 부분 |
| --- | --- | --- | --- |
| [rasterizehtml](https://github.com/cburgmer/rasterizeHTML.js) | 1.4.1 | HTML·문서의 Canvas 렌더링 | HTML 문자열 렌더링과 현재 DOM 상태 캡처의 구분 |
| [dom-to-svg](https://github.com/felixfbecker/dom-to-svg) | 0.12.2 | `foreignObject` 없는 SVG 변환 | 텍스트·링크·접근성 보존. 순수 벡터가 필요할 때 재검토 |
| [Satori](https://github.com/vercel/satori) | 0.34.0 | JSX·객체 입력을 자체 레이아웃으로 SVG 생성 | 템플릿 생성 용도. 현재 화면 캡처와 구분 |
| [Canvg](https://github.com/canvg/canvg) | 4.0.3 | SVG를 Canvas에 렌더링 | 캡처 이후 변환 계층 |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | 0.14.0 | DOM·Canvas 기반 PDF 생성 | 용지·페이지 분할. 전체 Canvas를 먼저 만드는 구조에 주의 |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | PDF 문서 조립 | 캡처 엔진과 PDF 출력의 분리 |
| [Paged.js](https://github.com/pagedjs/pagedjs) | 0.4.3 | 인쇄용 페이지 배치 | 의미 단위 페이지 나눔과 CSS Paged Media |
| [react-to-print](https://github.com/MatthewHerbst/react-to-print) | 3.3.0 | React 콘텐츠를 인쇄용 iframe으로 복제 | 비동기 준비·폰트·인쇄 상태 처리 |
| [dom-to-image](https://github.com/tsayen/dom-to-image) | 2.6.0 | 후속 DOM 캡처 모듈의 기반 구현 | 구조 참고. 기록된 최신 npm 배포는 2017년 |
| [Tearline 배포본](https://www.npmjs.com/package/@compoundlabs/tearline/v/0.2.0) | 0.2.0 | 영수증 Web Component와 PNG 출력 | 단계별 이벤트·제약 안내. 범용 엔진으로 보지 않음 |

Satori의 라이선스 선언은 MPL-2.0이고, 나머지 위 후보는 MIT였다. Satori와 아래의 Mediabunny를 채택할 경우 [Comins 라이선스 정책](https://github.com/kim1124/comins-governance/blob/main/OSS_LICENSE_POLICY.md)의 수동 검토 절차가 적용된다. 메타데이터 확인은 배포물·의존성 전체 검토를 대신하지 않는다.

## 배포본 정적 분석의 주요 발견

### SnapDOM의 결과 재사용과 출력 경로 차이

3.2.0 배포본의 `types/snapdom.d.ts`와 README에서 `warnings`, `meta`, `toCanvas({ crop })` 및 대형 PNG 출력 설명을 확인했다. 한 번 캡처한 상태를 여러 형식과 영역으로 출력할 수 있다.

대형 PNG 파일 출력은 `CompressionStream` 조건 아래 영역별 렌더링과 인코딩을 사용한다. `toCanvas()`, `toPng()`, JPEG/WebP 출력은 단일 Canvas 제한에 따른 축소 경로가 있다. 또한 `download()`는 DPR 1을 사용하지만 `toBlob()`은 별도로 지정하지 않으면 캡처의 DPR을 따른다. 이러한 차이는 Comins의 공개 크기 계약에서 정규화할 필요가 있다. [공식 대형 출력 설명](https://snapdom.dev/blog/huge-page-mosaic/)

### modern-screenshot의 DPI와 대기 정책

4.7.0 배포본의 `dist/index.mjs`에서 PNG/JPEG 출력의 DPI 메타데이터 처리 코드를 확인했다. `dist/index.d.ts`에서는 `restoreScrollPosition` 기본값이 false로 기재되어 있다. 미디어 대기 함수는 timeout에 resolve하는 경로가 있어, 대기 종료와 자원 준비 성공을 동일하게 취급하면 안 된다. [배포 버전](https://www.npmjs.com/package/modern-screenshot/v/4.7.0)

### html-to-image의 캐시와 누락 정책

1.11.13 배포본 `src/dataurl.ts`는 기본 캐시 키에서 URL query string을 제거한다. 리소스 요청 실패 시 placeholder 또는 빈 문자열과 경고를 사용하는 경로가 있다. 따라서 query로 변형·버전을 구분하는 자원의 캐시와 부분 누락을 별도 검증해야 한다. 이는 소스 기반 위험 분석이며 실행 재현 결과는 아니다. [배포 버전](https://www.npmjs.com/package/html-to-image/v/1.11.13)

### html2pdf.js의 전체 Canvas와 페이지 분할

0.14.0 배포본 `src/worker.js`는 전체 Canvas를 생성한 후 페이지별 Canvas로 잘라 PDF에 넣는다. `src/plugin/pagebreaks.js`는 페이지 경계를 조정하기 위해 복제된 DOM에 공간을 삽입한다. 페이지 분할 지원이 낮은 메모리 사용이나 원래 화면 배치 보존을 보장하지는 않는다. [공식 제한 설명](https://github.com/eKoopmans/html2pdf.js#known-issues)

### 공식 이슈의 해석

[html-to-image의 Safari 이미지 누락 보고](https://github.com/bubkoo/html-to-image/issues/361)와 [modern-screenshot의 iPhone JPEG 품질 보고](https://github.com/qq15725/modern-screenshot/issues/161)는 조회 시점에 열려 있었다. [SnapDOM의 iframe 폰트 이슈](https://github.com/zumerlab/snapdom/issues/441)는 완료 상태로 닫혀 있었다. 모두 회귀 시나리오의 참고 근거이며, 현재 버전의 결함 여부는 직접 검증해야 한다.

## 초안 보강 권고

### 캡처 범위와 시각적 일치

현재 브라우저에서 렌더링된 원본을 비교 기준으로 삼는 것을 권고한다. 브라우저·OS 간 결과를 동일하게 만드는 요구와 해당 환경의 화면을 충실히 재현하는 요구는 구분해야 한다.

| 항목 | 보강할 계약 |
| --- | --- |
| 대상 | 요소, viewport, 전체 문서, 내부 스크롤 전체를 구분 |
| 경계 | 루트 그림자·outline·overflow·transform의 포함 범위 |
| 상태 | 입력값·체크 상태·스크롤·sticky·fixed·애니메이션 시점 |
| 준비 | 프레임워크 렌더링, 폰트·이미지·차트 준비 대기와 timeout |
| 완전성 | 감지 가능한 누락에 대한 엄격 실패 또는 경고 포함 결과 |
| 원본 보존 | DOM·스타일·포커스·스크롤 변경 방지 또는 복원 |

교차 출처 iframe, 닫힌 Shadow DOM, DRM 콘텐츠, 가상화로 DOM에 없는 데이터는 일반 DOM 복제만으로 캡처할 수 있다고 약속하지 않는다. Canvas·WebGL·동영상·열린 Shadow DOM·외부 SVG는 엔진별로 검증한다. CORS 승인이 없는 이미지로 오염된 Canvas는 내보내기가 제한된다. [Canvas 보안 제약](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)

### 형식과 반환 타입

PNG/JPEG/WebP/SVG는 출력 형식이고, Blob·Data URL·Canvas·이미지 요소는 반환 형태이다. 두 축을 분리하고 요청 MIME과 실제 MIME, 투명도, 배경색, 품질 옵션을 정의한다. `foreignObject` SVG는 브라우저용 HTML 포함 SVG이며 순수 벡터 path 변환이나 모든 디자인 도구 호환을 뜻하지 않는다.

경고가 없다는 사실도 완벽한 시각적 일치를 증명하지 않는다. 감지하지 못하는 스타일 차이는 별도 이미지 비교로 확인해야 한다.

### 크기와 용지 규격

| 모드 | 의미 |
| --- | --- |
| contain | 비율을 유지하여 출력 영역 안에 배치하고 여백 허용 |
| cover | 비율을 유지하여 출력 영역을 채우고 넘친 부분 자름 |
| crop | 명시한 좌표계의 영역을 추출 |
| reflow | 출력 너비에 맞춰 줄바꿈과 배치를 다시 계산하는 별도 후보 |

화면 보존이 우선인 기본 모드는 원래 레이아웃을 유지하는 방향을 권고한다. 출력 크기, DOM 레이아웃 크기, DPR, 배율의 우선순위와 crop 좌표 기준을 명시해야 한다.

A4는 210×297mm이며 300ppi 출력에 필요한 크기는 반올림 기준 약 2480×3508px이다. 출력 픽셀 수와 파일의 DPI 메타데이터는 별도이며 장치 DPR과도 구분한다. ISO B4는 250×353mm, JIS B4는 257×364mm이므로 B 계열의 규격 체계도 구분해야 한다. A3·A4·A5·B3·B4 프리셋의 완전한 치수표는 명세 단계에서 원본 규격과 대조한다. [용지 규격](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@page/size), [Canvas 출력 메타데이터](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

방향·여백·단위·반올림 규칙과 페이지보다 큰 단일 요소의 처리도 결정해야 한다. 고정 높이 자르기, 표 행·문단 보존, 반복 헤더·푸터는 서로 다른 기능이다.

### 대형 출력과 실행 수명주기

최대 출력 픽셀 수, 메모리 예산, 축소 허용 여부, 영역별 렌더링 전략을 정의한다. 전체 초대형 Canvas를 만든 뒤 자르는 방식과 처음부터 영역별로 렌더링하는 방식을 구분한다.

취소·timeout·진행 이벤트·동시 요청·캐시 무효화·결과 해제도 계약에 포함하는 것을 권고한다. 취소 Promise 반환만으로 내부 작업과 네트워크가 중지되었다고 보지 않는다. 캐시는 URL query, 사용자 상태, 원본 변경, 세션 경계를 고려한다.

### 프레임워크와 네트워크 경계

Vanilla TypeScript Core가 DOM을 입력받고 프레임워크 연동은 렌더링 준비·참조·언마운트·중복 요청을 담당하는 구조를 권고한다. React·Vue·Svelte 각각의 실제 소비 예제와 SSR import 안전성 검증이 필요하다. Portal·Teleport처럼 루트 밖에 있는 콘텐츠의 포함 규칙도 정해야 한다.

Comins Contract에 따라 외부 엔진은 모듈 소유 어댑터 뒤에 둔다. 네트워크·원격 자원·텔레메트리·오류 보고는 소비자 opt-in 경계를 지킨다. 엔진이 이미지·폰트를 다시 요청하는 동작도 포함하며 프록시나 업로드를 기본으로 활성화하지 않는다.

## 동영상 녹화 조사

### 실행 방식과 난이도

다음 난이도는 설계 판단이며 구현·성능 측정 결과가 아니다.

| 방식 | 구성 | 장점 | 제약 및 판단 |
| --- | --- | --- | --- |
| 화면 녹화 | `getDisplayMedia`와 `MediaRecorder` | 실제 탭·창·화면의 움직임 | 사용자 선택·권한·환경 제한. 중간 난도 |
| DOM 반복 캡처 | DOM 캡처를 반복하여 Canvas 스트림 생성 | 특정 요소와 기존 캡처 엔진 재사용 | 프레임마다 복제·렌더링 비용. 높은 난도 |
| Canvas 녹화 | `captureStream`과 `MediaRecorder` | 차트·Canvas 애니메이션에 적합 | 일반 DOM 입력은 별도 변환 필요. 낮음에서 중간 난도 |
| Element Capture | 탭 스트림을 특정 요소로 제한 | 브라우저 렌더링 기반 요소 녹화 | 브라우저·요소 조건 제한. 중간에서 높은 난도 |

화면 공유는 사용자 동작과 권한이 필요하며 임의 대상을 무인으로 확정할 수 없다. Element Capture의 Chrome 공식 문서는 데스크톱 Chrome 132부터의 지원과 stacking context 조건을 명시하므로 전체 브라우저의 공통 기반으로 가정하지 않는다. [화면 캡처](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia), [Canvas 스트림](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream), [Element Capture](https://developer.chrome.com/docs/web-platform/element-capture)

30fps의 프레임 간격은 약 33.3ms, 60fps는 약 16.7ms이다. 이는 시간 예산의 산술값이며 Comins나 후보 엔진의 달성 성능이 아니다. DOM 크기와 스타일에 따라 캡처가 느려지거나 프레임이 누락될 수 있다.

### 녹화 모듈의 참고 기능

| 모듈 | 확인 버전 | 참고 기능 | 적용 시 주의 |
| --- | --- | --- | --- |
| [RecordRTC](https://github.com/muaz-khan/RecordRTC) | 5.6.2 | 상태 이벤트, 일시정지·재개, 자동 종료, 주기적 Blob 전달 | 최신 npm 배포 기록은 2021년. 현재 호환성 별도 확인 |
| [CCapture](https://github.com/spite/ccapture.js) | 2.0.0 | 가상 시간과 고정 프레임 출력 | 제어 가능한 애니메이션용. 실제 사용자 조작 녹화와 구분 |
| [Mediabunny](https://mediabunny.dev/) | 1.61.0 | 코덱 조회, 출력 스트림, backpressure | DOM 캡처 엔진이 아님. MPL-2.0 검토 필요 |
| [rrweb](https://github.com/rrweb-io/rrweb) | 2.1.6 | 이벤트 기반 재생, 입력값·텍스트·영역 마스킹 | 일반 영상 파일 녹화와 다른 제품 범위 |
| [SnapDOM 공식 플러그인](https://snapdom.dev/docs/plugins/) | 3.0.0 | GIF·영상 출력, 마스킹, 타임스탬프 | 코어 v3 peer 요구. 실제 출력 포맷과 시간 확인 필요 |

Mediabunny를 제외한 위 패키지의 라이선스 선언은 MIT였다.

SnapDOM 플러그인 3.0.0의 `video-export.js`, `gif-export.js`, 타입 선언 및 README를 정적으로 확인했다. 기본 fps 10, duration 2000ms, 프레임 수·배율 옵션과 Canvas 스트림 기반 녹화가 존재한다. 이 기본값은 성능 보증이 아니다. `toMp4()`는 환경에 따라 WebM을 반환하며 느린 캡처에서는 시간이 늘어날 수 있다. Comins는 요청 포맷·실제 포맷·대체 허용 여부를 분리하는 방향을 권고한다.

분할 데이터와 독립 재생 가능한 분할 파일도 구분해야 한다. Mediabunny의 일반 StreamTarget은 청크 위치를 제공하며 단순 이어붙이기가 항상 유효하지 않다. 실시간 녹화에서 처리량이 부족할 때는 프레임 누락·품질 변경·중단 정책이 필요하다. [출력 스트림](https://mediabunny.dev/guide/writing-media-files), [코덱 조회](https://mediabunny.dev/guide/supported-formats-and-codecs)

녹화를 포함한다면 별도 진입점, 시작·중지·일시정지·재개, 최대 시간, 자원 해제, 실제 MIME 반환을 검토한다. 초기 무음 녹화는 권고안일 뿐 확정하지 않았다. 탭 소리·시스템 소리·마이크는 권한과 지원 조건을 각각 검증해야 한다.

## 벤치마킹 우선순위

우선순위와 부담은 Comins에 적용할 때의 판단이다. 참고 모듈의 기능 존재가 도입 승인이나 구현 품질 보증을 뜻하지 않는다.

| 기능 | 참고 대상 | 사용자 가치 | 권고 우선순위 |
| --- | --- | --- | --- |
| 캡처 결과 재사용 | SnapDOM | 같은 상태로 미리보기와 여러 출력 제공 | 높음 |
| 복제본 전용 변환 | html2canvas·SnapDOM | 원본 변경 없이 버튼 제외·출력 스타일 적용 | 높음 |
| 비동기 준비 훅 | react-to-print·modern-screenshot | 렌더링·자원 준비 이후 캡처 | 높음 |
| 마스킹과 영역 제외 | SnapDOM·rrweb | 민감 콘텐츠가 있는 업무 화면 출력 | 높음 |
| 용지·좌표·분할 계약 | SnapDOM·html2pdf.js·Paged.js | 리포트와 긴 표를 예측 가능한 규격으로 출력 | 높음 |
| 경고·실제 크기·MIME 정보 | SnapDOM·미디어 도구 | 결과 검증과 장애 분석 | 높음 |
| 녹화 상태와 분할 데이터 | RecordRTC·Mediabunny | 녹화 UI 연동과 장시간 처리 | 녹화 범위 확정 시 높음 |
| 타임스탬프·워터마크 | SnapDOM 오버레이 | 보고서 생성 시각·사용자 로고 표시 | 후속 |
| GIF와 오프라인 프레임 출력 | SnapDOM·CCapture | 짧은 데모·제어 가능한 애니메이션 | 후속 |

마스킹은 공간 유지·제거·대체를 구분하고, SVG의 텍스트·속성까지 검토한다. 단순 시각적 덮개로 원본 데이터 제거를 보장하지 않는다. 화면 공유 영상의 마스킹은 DOM 복제본 마스킹과 다른 처리이므로 정책만 공유하고 구현을 동일시하지 않는다.

Comins 로고·폰트·마케팅 문구를 소비자 결과물에 자동 삽입하지 않는다. 워터마크를 도입한다면 소비자가 선택한 콘텐츠를 명시적으로 요청한 경우에만 적용하는 방향이다. [Comins Brand](https://github.com/kim1124/comins-governance/blob/main/BRAND.md)

## 미결정 사항

| 결정할 사항 | 현재 상태 | 결정에 필요한 정보 |
| --- | --- | --- |
| 기본 캡처 엔진의 실제 선정 | 단일 기본 엔진 제공은 확정. SnapDOM 우선 추가 검증 권고 | sticky·외부 자원 등 남은 품질·정책 적합성 |
| 실제 OS·기기 검증 조합 | 현재 시점 최신 안정 버전 기준은 확정. WebView 후속 | 최신 브라우저의 OS 조합과 실제 Safari·모바일 기기 결과 |
| 크기 세부 계약 | 일반 1배·용지 300 PPI 및 사용자 조정, ISO/JIS·기본 ISO 확정 | 여백·반올림·옵션 우선순위·최대 출력 한도 |
| 분할 결과의 세부 계약 | 영역 자르기·고정 크기 분할은 초기 포함, 의미 단위 분할은 후속 | 마지막 조각·여백·좌표·결과 반환 규칙 |
| 실제 인쇄 | 미확정. PDF는 후속 단계로 확정 | 인쇄 흐름의 필요성 |
| PDF·녹화의 후속 세부 범위 | 초기 제외 확정. 후속 도입 시점·세부 동작 미결정 | 별도 단계에서 파일 생성·녹화 대상·길이·음성·포맷 검토 |
| 실패 처리의 세부 API | 기본 오류 종료와 명시적 대체 허용은 확정 | 오류 분류, 누락 감지 범위, 대체 결과 메타데이터 |
| 공개 API·프레임워크 래퍼 | 미확정 | 소비 예제와 수명주기 검증 |
| 패키지 기준선 | 미확정 | 이름 가용성·패키지 매니저·Git 및 Governance 초기화 |

## 후속 검증 제안

구현 계획을 확정하기 전에 후보의 고정 버전과 동일한 입력을 사용하여 비교하는 것을 권고한다. 아래는 제안이며 실행된 테스트가 아니다.

| 검증 영역 | 시나리오 | 기록할 결과 |
| --- | --- | --- |
| 시각 품질 | 한글·폰트·아이콘·필터·가상 요소·폼 상태 | 원본 대비 차이와 누락 |
| 영역 | 스크롤·sticky·transform·DPR·그림자·crop | 좌표 오차·잘림·경계 |
| 리소스 | CORS·CSP·실패 이미지·폰트·timeout | 요청 정책·오류·부분 결과 |
| 크기 | 용지·여백·방향·고해상도·긴 표 | 실제 픽셀·MIME·PPI·페이지 경계 |
| 수명주기 | 취소·언마운트·반복·동시 캡처 | 작업 중단·원본 복원·자원 해제 |
| 성능 | 작은 카드·복잡한 화면·긴 문서 | 첫 실행과 캐시 실행의 시간·메모리·UI 지연 |
| 프레임워크 | Vanilla·React·Vue·Svelte·SSR import | 렌더링 준비와 소비 흐름 |
| 녹화 | 지원 포맷·정지·공유 종료·부하·장시간 | 실제 fps·시간·누락·탐색·메모리·자원 해제 |

Chromium·Firefox·WebKit 자동화와 실제 Safari/iOS 검증을 구분한다. OS·브라우저 버전·viewport·DPR·폰트·엔진 버전을 기록하고 허용 오차는 fixture 특성에 맞춰 정한다. 단일 기기나 작은 DOM의 결과를 전체 지원 보장으로 일반화하지 않는다.

## 이 초안의 완료 범위

초안 작성 단계에서는 사용자 확정 요구, 공식 자료 조사, npm 버전·라이선스 선언, 배포본 정적 발견, 벤치마킹 권고 및 미결정 항목을 정리했다. 이후 2026-10-02에 두 엔진의 3개 브라우저·7개 시나리오·168회 PNG 캡처를 수행했으며, 결과와 제한은 [1차 실증 비교](capture-engine-comparison.md)에 분리했다. 녹화·프레임워크 소비·전체 지원 범위의 검증이나 엔진 채택 완료를 뜻하지 않는다.

상세 코드 증거는 임시 분석 환경의 경로에 의존하지 않도록 패키지 버전과 내부 파일명을 기록했다. 재검증 시 해당 npm 배포본을 다시 확보하고 공식 문서·라이선스·이슈 상태를 갱신한다. 이 초안을 최종 명세로 전환할 때 미결정 사항의 결정 근거와 검증 결과를 반영한다.
