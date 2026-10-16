> 2026-10-15: 이 문서는 정리 이전의 설계·구현 기록입니다. crop·타일·partial 및 실험 어댑터는 현재 코드에서 제거했습니다. 현재 계약은 docs/guide, 차기 재개 정보는 docs/development/next-version-memory.md를 따릅니다.

# Comins Capture 초기 API·지원 범위 명세 검토안

작성일: 2026-10-02 (Asia/Seoul). 상태: **검토안·제품 미구현**. 이 문서는 기존 확정 요구사항을 구체적인 소비자 계약으로 제안한다. API 이름·타입·수치 제한은 아직 공개 API나 구현 완료 사실이 아니다. 엔진 선정·패키지 초기화·원격 작업·출시는 포함하지 않는다.

근거: [리서치 및 확정 결정](research.md), [연구 지침](research-guidelines.md), [SnapDOM 보완 검토](snapdom-repair-review.md), [Comins Contract v1.8](../../governance/COMINS_CONTRACT.md).

후속 상태(2026-10-02): 사용자가 보고서 확인 완료 후 추가 검증 확인과 구현 계획 작성을 요청했다. 아래 권고값을 [Core 구현 계획](superpowers/plans/2026-10-02-capture-core.md)의 기준으로 사용한다. 개별 Q1/Q2 선택 응답을 받은 것으로 소급 기록하지 않으며, 엔진 채택·구현 실행·출시 승인은 구분한다.

## 1. 목적과 결정 상태

브라우저에 렌더링된 DOM 상태를 소비자 코드에서 캡처하고, 원본 레이아웃을 유지한 이미지·SVG·Canvas를 지정한 크기로 얻는 것이 목적이다. 성공 기준은 해당 브라우저의 원본 상태 보존, 명시한 출력 계약 준수, 감지된 결손의 명확한 보고다. 브라우저·OS 사이의 픽셀 동일성을 요구하지 않는다.

| 구분 | 내용 |
|---|---|
| 사용자 확정 | 브라우저 내부 실행, 단일 기본 엔진, foreignObject SVG 허용, Vanilla·React·Vue·Svelte 지원 목표 |
| 사용자 확정 | 일반 출력 CSS 1배, 용지 래스터 300 PPI, DPR 명시적 선택, ISO·JIS 제공·기본 ISO |
| 사용자 확정 | crop·고정 분할 초기 포함, 감지된 자원 누락·크기·형식 불충족 기본 오류 |
| 사용자 확정 | PDF·녹화·WebView·문단 및 표 행 보존 분할은 후속 |
| 확인된 한계 | SnapDOM 보완 실험에서 Safari 네이티브 폼 외형 차이가 남았고, sticky 및 자원 보완은 제한된 fixture에서만 검증됨 |
| 이번 설계 제안 | 아래 API, 좌표계, 수명주기, 자원 정책 세부 계약, 한도 및 검증 기준 |

질문한 두 항목은 응답 반영 전의 **권고 가정**이다. 본문과 예제는 다음 값을 사용하되 사용자 확정으로 기록하지 않는다.

- Q1: 감지된 재현 미지원 조건은 기본 중단하고, 명시적 `allow-partial`에서만 제한 결과를 허용한다.
- Q2: 크기 비율이 다르면 기본 `contain`, 중앙 정렬, 여백 0을 적용한다. `cover`·`stretch`는 명시적으로 선택한다.

## 2. 접근 방식

| 방식 | 장점 | 비용·한계 |
|---|---|---|
| 단일 함수가 매번 DOM을 읽고 한 형식 출력 | 단순한 호출 | 여러 포맷·분할 간 원본 시점과 자원 요청이 달라질 수 있음 |
| **스냅샷 생성과 출력 변환 분리 — 권고** | 한 번 고정한 상태에서 형식·크기·분할 재사용, 정리 책임 명확 | 소비자가 결과 수명을 관리해야 함 |
| 여러 엔진 공개 및 자동 전환 | 엔진별 실험 자유도 | 현재 확정된 단일 엔진 방침과 맞지 않으며 성공 판정·일관성 부담 증가 |

공개 API는 Comins가 소유하고 엔진 옵션·플러그인·경고 객체를 그대로 노출하지 않는다. SnapDOM은 이 계약을 만족하는지 평가할 후보이며 채택 확정이 아니다.

## 3. API 구성

```ts
// 제안 시그니처. 설치 가능한 패키지·배포 타입 선언이 아니다.
capture(target: CaptureTarget, options?: CaptureOptions): Promise<CaptureSnapshot>

type CaptureTarget =
  | HTMLElement
  | { kind: 'viewport'; document: Document }
  | { kind: 'document'; document: Document };

interface CaptureSnapshot {
  readonly meta: SnapshotMeta;
  toBlob(options?: BlobOutputOptions): Promise<CaptureOutput<Blob>>;
  toCanvas(options?: RasterOutputOptions): Promise<CaptureOutput<HTMLCanvasElement>>;
  toSvg(options?: SvgOutputOptions): Promise<CaptureOutput<string>>;
  tiles(options: TileOutputOptions): AsyncIterable<CaptureTile>;
  dispose(): void;
}
```

초기 외부 진입점은 `capture`와 `CaptureError`를 권고한다. `download`, 클립보드, 파일 업로드, UI 위젯, Data URL·이미지 요소 전용 헬퍼는 넣지 않는다. 소비자는 반환된 Blob으로 Object URL을 만들어 표시·다운로드할 수 있다. 실패는 `Promise` reject 또는 iterator throw이며, 조용히 빈 결과를 반환하지 않는다.

### 반환 메타데이터

`CaptureOutput<T>`는 `{ value: T, meta: OutputMeta }`다. 아래 필드는 생성 시점의 읽기 전용 데이터로 제공한다.

| 필드 | 의미 |
|---|---|
| `snapshotId` | 한 번 캡처한 상태의 식별자. 동일 스냅샷의 모든 출력에 유지 |
| `sourceRect` | 스냅샷 좌표계의 원본 영역 `{ x, y, width, height }`, CSS px |
| `width`, `height`, `unit` | 래스터는 정수 `px`, SVG는 문서 크기와 `css-px` 또는 `mm` |
| `mime` | 실제 반환 형식. Canvas는 `null`, SVG는 `image/svg+xml` |
| `status` | `complete` 또는 `partial`; 검사한 범위 내의 결손 상태이며 시각적 동일성 인증이 아님 |
| `diagnostics` | 구조화한 진단 `{ code, stage, severity, nodeRef?, resourceRef? }[]` |
| `paper` | 해당할 때 용지 체계·이름·방향·mm 치수·요청 PPI. 인쇄 보증이나 파일 DPI 인증이 아님 |
| `contentRect` | 여백·contain/cover 배치 후 출력 좌표계의 콘텐츠 사각형 |

`SnapshotMeta`에는 `snapshotId`, 루트 CSS 크기, 수집 시작·종료 시각, `status`, 진단, 검사한 자원 종류와 검사 불가 항목을 기록한다. `visualVerified: true` 같은 자동 인증 필드는 만들지 않는다. 진단에는 DOM 텍스트·입력값·전체 URL·인증정보를 넣지 않고 실행 내 식별자를 사용한다. 네트워크나 로그 전송은 하지 않는다.

부분 스냅샷에서 만든 모든 출력은 `partial`과 원래 진단을 상속한다. 출력 변환에 성공했다는 이유로 `complete`로 승격하지 않는다. `toBlob` 옵션 타입은 format에 따른 union으로 설계하여 SVG에 래스터 전용 옵션을 전달하지 못하게 한다.

## 4. 캡처 대상과 좌표

- `HTMLElement`: 연결되어 있고 레이아웃 박스가 있는 대상 루트와 자손의 현재 상태. 기본 경계는 루트 border box다. 루트 밖으로 나가는 그림자·outline·overflow는 자른다. `display:none`, 분리된 노드, 0 크기는 `INVALID_TARGET`이다.
- `viewport`: 지정 문서의 현재 layout viewport 사각형. 스크롤 위치를 유지한다. 브라우저 도구 모음·OS UI는 포함하지 않는다. 모바일 pinch zoom 등 visual viewport와의 차이를 정규화하지 못하면 지원 불가로 판정한다.
- `document`: 현재 레이아웃의 문서 스크롤 영역. 폭을 바꾸거나 스크롤하며 이어 붙이지 않는다. 현재 fixed·sticky의 문서 기준 위치를 한 번만 반영한다. 화면 밖 콘텐츠와 fixed/sticky 결합은 별도 필수 검증 대상이다.
- 내부 스크롤 컨테이너는 현재 scrollTop/scrollLeft와 clipping을 보존한다. 감춰진 내부 전체 내용을 자동 펼치지 않는다. 소비자가 펼친 내보내기용 DOM을 준비하면 그 DOM을 입력으로 사용할 수 있다.
- 루트 바깥의 Portal·Teleport·팝업은 자동 포함하지 않는다. 전체 viewport/document 캡처에 실제 포함되는 DOM은 해당 범위 규칙을 따른다.

스냅샷 좌상단을 `(0,0)`으로 하고 crop은 이 좌표계의 **CSS px**다. 화면 절대 좌표·스크롤 좌표·출력 픽셀을 섞지 않는다. 루트 좌표를 안정적으로 산출할 수 없는 transform·zoom·세로 쓰기 조합은 진단 후 기본 중단한다. 자손의 일반 transform까지 모두 미지원으로 단정하지 않으며 검증된 조합을 지원 표에 등록한다.

가상화로 존재하지 않는 항목, 닫힌 Shadow DOM 내부, 별도 브라우저 탭·URL은 이 API로 생성하거나 수집하지 않는다. DOM에 없는 내용의 누락을 언제나 자동 감지할 수 있다고 약속하지 않는다.

## 5. 캡처 옵션·준비·자원

| 옵션 | 제안 기본값 | 계약 |
|---|---|---|
| `signal` | 없음 | 소비자 취소 신호 |
| `timeoutMs` | 30,000 | 준비부터 스냅샷 검증까지의 시간 한도. 0·음수·무한대 금지 |
| `ready` | 없음 | `({ signal }) => Promise<void>`; 프레임워크·차트 준비를 소비자가 대기 |
| `failure` | `'error'` | `'error' \| 'allow-partial'`; 허용 가능한 콘텐츠 결손에만 적용 |
| `resources.network` | `'deny'` | `'deny' \| 'same-origin' \| { origins: string[] }` |
| `resources.credentials` | `'omit'` | `'omit' \| 'same-origin'`; 인증된 동일 출처 재요청도 명시적 선택 |
| `resources.resolve` | 없음 | 수집된 자원 요청을 소비자 제공 Blob으로 해결하는 콜백 |

`ready` 완료 후 필요한 이미지·폰트 준비와 현재 폼·스크롤 상태를 수집한다. 무한 스크롤·lazy loading·웹앱 데이터 로딩을 모듈이 자동 실행하지 않는다. `document.fonts.ready` 또는 이미지의 `complete`만으로 출력 내 삽입 성공을 판단하지 않는다.

자원 해결 순서는 안전하게 재사용 가능한 인메모리 데이터 → `resources.resolve` → 명시적으로 허용한 네트워크다. `resolve`는 `{ resourceRef, kind, url, signal }`을 받고 `Promise<Blob | undefined>`를 반환한다. URL은 콜백 안에서만 제공하고 진단·로그에 복사하지 않는다. 콜백이 실행한 외부 부작용은 소비자 책임이며 모듈이 해당 작업을 강제로 취소한다고 보장하지 않는다.

동일하게 `ready` 내부의 앱 데이터 요청은 소비자 코드의 동작이다. 모듈의 네트워크 기본 차단이 이미 실행 중인 앱 또는 소비자 콜백의 요청까지 차단한다는 뜻은 아니다.

`network: 'deny'`는 이미지·폰트·CSS·SVG의 **추가 요청과 엔진 재요청**, 임시 DOM에 의한 암묵 요청까지 포함한다. 이미 화면에 로드된 자원도 읽을 수 있는 바이트가 없으면 기본 오류가 날 수 있다. same-origin은 대상 document의 origin 기준이며 목록은 정확한 origin만 허용한다. 리다이렉트로 허용되지 않은 목적지에 접근하지 않도록 초기 구현에서는 자동 리다이렉트를 거부한다. 원격 프록시·업로드·텔레메트리는 제공하지 않는다.

삽입 검사는 `<img>`, CSS 이미지, 사용한 웹폰트 face(weight·style·subset 포함), 외부 SVG 참조를 자원별로 추적해야 한다. 하나의 data URI가 존재한다는 검사로 대체하지 않는다. CSS 접근 제한 등으로 필수 자원의 수집·검증 범위를 확인할 수 없으면 `RESOURCE_UNVERIFIABLE`이다. 시스템 폰트는 원본 환경에 의존한다는 정보 진단을 남기며 웹폰트 누락과 구분한다.

## 6. 출력 형식

| API | 형식·기본값 | 세부 계약 |
|---|---|---|
| `toBlob()` | PNG 기본, JPEG·WebP·SVG 명시적 선택 | 요청 MIME과 실제 MIME 불일치 시 오류 |
| `toCanvas()` | `HTMLCanvasElement` | PNG 등 형식·quality 옵션을 받지 않음 |
| `toSvg()` | SVG 문자열 | `foreignObject` 허용. 순수 path 변환·편집 도구 호환·폰트 outline 변환을 약속하지 않음 |
| `tiles()` | PNG Blob 기본 또는 Canvas | 초기에는 래스터 고정 분할. SVG 분할·PDF·ZIP은 포함하지 않음 |

`format`은 `'png' | 'jpeg' | 'webp' | 'svg'`다. JPEG/WebP의 `quality`는 0~1이며 기본 0.92를 제안한다. PNG·SVG·Canvas에 quality를 주면 잘못된 옵션으로 처리한다. 래스터 배경은 기본 투명, JPEG는 기본 흰색이며 JPEG에 명시적 투명 배경을 요구하면 오류다. `background`는 출력에 합성하는 배경이며 원본 CSS를 바꾸지 않는다.

브라우저가 미지원 형식을 PNG로 돌려주는 경우가 있으므로 실제 형식을 검사한다. Canvas 직렬화의 해상도 메타데이터는 픽셀 계산용 PPI와 별개다. 초기에는 파일 DPI를 임의로 재작성하지 않는다. [HTML Standard: 직렬화](https://html.spec.whatwg.org/multipage/canvas.html#serialising-bitmaps-to-a-file)

SVG는 수집한 상태를 고정한 출력으로 만들며 실행 스크립트·이벤트 핸들러·활성 외부 임베드를 제거해야 한다. 자원 URL은 승인된 취득 단계에서 해결하여 출력 열기만으로 새 네트워크 요청을 발생시키지 않는다. 이는 별도의 보안 검증 항목이며 현재 연구 코드가 충족했다는 뜻이 아니다. 원본을 DOM으로 다시 삽입하기 위한 범용 HTML sanitizer API도 아니다.

## 7. 크기·crop·용지

출력은 `crop → 목적 크기 결정 → 여백 → fit·정렬 → 래스터화/직렬화` 순서다. 출력 너비는 CSS 레이아웃 너비를 변경하지 않는다. reflow 옵션은 초기 API에서 제공하지 않는다.

### 상호 배타적인 size

```ts
type RasterSize =
  | { kind: 'scale'; value: number | 'device' }
  | { kind: 'pixels'; width: number; height: number }
  | {
      kind: 'paper'; name: 'A3' | 'A4' | 'A5' | 'B3' | 'B4';
      system?: 'iso' | 'jis'; orientation?: 'portrait' | 'landscape';
      ppi?: number;
      marginMm?: { top: number; right: number; bottom: number; left: number };
    };
```

래스터 size 생략은 `{ kind: 'scale', value: 1 }`이다. `device`는 capture 시점 대상 window의 DPR을 스냅샷에 저장해 사용한다. `pixels`는 양쪽 치수를 정수로 명시한다. `paper`는 기본 ISO·세로·300 PPI·여백 0이다. 서로 다른 kind의 필드 혼용은 오류이며 우선순위로 조용히 무시하지 않는다.

SVG에는 별도 size 타입을 사용한다. 생략은 crop의 CSS 크기, 명시 크기는 `{ kind:'css', width, height }` 또는 PPI 없는 paper다. SVG에 scale·DPR·픽셀 해상도·PPI를 주면 오류다. SVG의 width/height는 CSS px 또는 mm, viewBox는 논리 좌표로 기록한다.

`crop: { x, y, width, height }`의 좌표와 치수는 유한한 CSS 수치이며 width·height는 양수다. x·y는 0 이상, 영역은 스냅샷 안에 있어야 한다. 범위 밖 crop은 자동 clamp·padding하지 않고 `INVALID_OPTIONS`로 종료한다. 소수 crop 좌표는 유지하고 최종 출력 경계에서만 반올림한다.

양수 치수 반올림은 `floor(value + 0.5)`다. 결과가 0 또는 안전한 정수 범위 밖이면 오류다. scale의 래스터 크기는 `round(crop.width × scale)`, `round(crop.height × scale)`다. paper는 `round(mm / 25.4 × ppi)`를 각 축에 적용하며 DPR을 다시 곱하지 않는다.

### 초기 용지 프리셋

| 체계·이름 | 세로 mm | 300 PPI 출력 px |
|---|---|---|
| ISO/JIS A3 | 297 × 420 | 3508 × 4961 |
| ISO/JIS A4 | 210 × 297 | 2480 × 3508 |
| ISO/JIS A5 | 148 × 210 | 1748 × 2480 |
| ISO B3 | 353 × 500 | 4169 × 5906 |
| ISO B4 | 250 × 353 | 2953 × 4169 |
| JIS B3 | 364 × 515 | 4299 × 6083 |
| JIS B4 | 257 × 364 | 3035 × 4299 |

A 계열은 두 system에서 같은 치수로 해석하는 API 제안이다. A3/A4/A5·B4 치수는 [W3C CSS Paged Media 초안](https://www.w3.org/TR/css-page-3/#page-size-prop), ISO/JIS B3는 [Canon 공식 용지 표](https://downloads.canon.com/cpr/software/ipf/iPF610_UserManual.pdf)의 검색 색인, JIS 치수는 [NEC 공식 용지 표](https://jpn.nec.com/printer/laser/support/paper/index.html)로 대조했다. Canon PDF 본문 취득은 실패했으므로 ISO/JIS 원 규격 전문을 직접 대조했다고 주장하지 않는다. 제품 preset 확정 전 원 규격 또는 접근 가능한 공식 전체 표를 추가 대조한다. 조회일: 2026-10-02.

가로 방향은 표의 너비·높이를 교환한다. marginMm은 방향 변환 후 페이지의 top/right/bottom/left 기준이다. 각 여백을 PPI로 반올림하고, 콘텐츠 너비는 `전체 너비 − left − right`로 구한다. 콘텐츠 영역이 0 이하이면 오류다. A4 300 PPI·사방 10mm 예는 2480×3508 출력, 여백 각각 118px, 콘텐츠 2244×3272px다.

`fit`은 contain/cover/stretch, `align`은 `{ x, y }`의 0~1 값이며 기본값은 Q2에 의존한다. 원본 `w,h`, 콘텐츠 영역 `W,H`에서 contain은 `min(W/w,H/h)`, cover는 `max(...)`로 균일 배율을 구한다. 남는 공간 또는 넘치는 영역에 align을 적용한다. stretch는 축별 배율을 사용한다. 640×420을 800×800 contain으로 내보내면 콘텐츠 800×525, 세로 여백은 위아래 137.5px다.

## 8. 고정 크기 분할

`tiles({ output: 'blob' | 'canvas', format?, size?, crop?, fit?, align?, background?, tile: { width, height }, signal?, timeoutMs? })`를 제안한다. size·crop을 먼저 전체 가상 출력에 적용하고 **tile 치수는 출력 픽셀**로 해석한다. 문단·표 행을 보존하거나 조각마다 다시 fit하지 않는다.

tile width·height는 양의 정수다. 왼쪽에서 오른쪽, 위에서 아래 순으로 0부터 번호를 부여한다. 마지막 열·행은 남은 크기만 반환한다. 기본 padding은 없고 빈 타일은 만들지 않는다. `CaptureTile`에는 `index`, `row`, `column`, `outputRect`, 전체 `totalWidth/totalHeight`, 출력 value·meta가 들어간다. outputRect는 가상 출력 안의 정수 픽셀 좌표다.

2500×3500 출력을 1024×1024로 나누면 3열×4행 12개이며, 마지막 조각은 `(2048,3072,452,428)`이다. 픽셀 경계를 공유하여 타일 간 누락·중복이 없게 한다. 엔진이 렌더링 경계 처리를 위해 겹쳐 그려도 반환 영역은 겹치지 않는다.

전체 거대 Canvas를 먼저 만들지 않고 타일별로 렌더링한다. SVG/DOM 스냅샷 자체의 메모리는 여전히 필요하다. iterator의 다음 요청에 맞춰 순차 생성하며 내부에서 전체 결과를 배열로 쌓지 않는다. 소비자가 모든 결과를 보관하면 그 메모리는 소비자 책임이다.

자원 검증은 첫 조각 반환 전에 완료한다. 중간 렌더링 실패·취소 시 이후 조각을 중단하고 throw한다. 이미 소비자에게 전달한 조각은 회수할 수 없으므로 iterator의 정상 종료 전에는 전체 분할 성공으로 취급하지 않는다. `break`·iterator.return도 현재 내부 작업을 정리한다.

## 9. 오류·부분 결과

`CaptureError`는 안정적인 `code`, 발생 `stage`, 정제된 `diagnostics`를 가진다. 원시 엔진 예외·전체 URL·DOM 텍스트를 기본 메시지로 전달하지 않는다.

| 코드 | 처리 |
|---|---|
| `INVALID_TARGET`, `INVALID_OPTIONS` | 호출 인자 오류. 항상 중단 |
| `UNSUPPORTED_ENVIRONMENT` | DOM 환경 또는 필수 기능 없음. 항상 중단 |
| `UNSUPPORTED_CONTENT` | 감지된 native appearance·iframe·렌더링 조합 등. Q1 정책 적용 |
| `NETWORK_DISABLED`, `RESOURCE_FAILED`, `RESOURCE_UNVERIFIABLE` | 필수 자원 취득·삽입·검사 실패. 기본 중단 |
| `OUTPUT_LIMIT`, `FORMAT_UNSUPPORTED`, `OUTPUT_MISMATCH` | 크기 한도, 형식, 실제 결과 불일치. 항상 중단 |
| `SOURCE_CHANGED` | 수집 중 감지한 원본 변경으로 상태 일관성 확보 실패. 항상 중단 |
| `ABORTED`, `TIMEOUT`, `DISPOSED`, `BUSY` | 수명주기 오류. 항상 중단 |
| `ENGINE_FAILED` | 정규화할 수 없는 엔진 실패. 항상 중단 |

`allow-partial`은 네트워크 허용·CORS·CSP를 우회하지 않는다. 누락 이미지는 동일 박스의 투명 영역으로, 누락 폰트는 캡처한 CSS font stack의 다음 후보로 처리하고 `partial`·진단을 반환하는 안이다. 복제 가능한 미지원 컨트롤은 best-effort 외형으로 남길 수 있으나 진단을 숨기지 않는다. 안전하게 고정할 수 없는 미지원 subtree는 같은 기하 박스의 빈 영역으로 대체한다. 이 처리가 불가능하거나 크기·형식 계약을 충족하지 못하면 명시적 허용 중에도 오류다.

초기에는 자동 축소·MIME 대체 옵션을 추가하지 않는다. 소비자는 실패 후 size 또는 format을 명시적으로 바꾸어 다시 출력할 수 있다. 재출력은 같은 스냅샷을 사용하며 원본 DOM을 다시 캡처하지 않는다.

## 10. 수명주기·한도

흐름은 인자·환경 검증 → 소비자 ready → 자원 준비·상태 수집 → 엔진 복제·보완 → 자원 삽입 검증 → 스냅샷 고정 → 출력 변환 → 임시 자원 정리다. 원본 DOM·스타일·입력·포커스·스크롤을 변경하지 않으며 원본에 임시 ID를 쓰지 않는다. 임시 측정 DOM은 캡처 대상 밖에서 격리하고 성공·실패·취소 모두 정리한다.

스냅샷은 하나의 논리적 상태를 재사용하지만 브라우저 렌더러의 원자적 스크린샷은 아니다. capture 동안 변화하는 앱은 소비자가 먼저 안정화해야 한다. 감지한 DOM·배치·스크롤 변경은 오류로 처리하되, 감지되지 않는 애니메이션·Canvas 변화까지 검출한다고 약속하지 않는다. 초기 CSS animation·transition·재생 중 영상은 검증된 고정 상태가 아니면 미지원 조건으로 취급한다.

동일 Document의 동시 capture와 동일 스냅샷의 동시 출력은 초기에는 `BUSY`로 거부한다. 자동 대기열·자동 재시도는 제공하지 않는다. 출력마다 `signal`·`timeoutMs`를 받으며 기본 출력 timeout도 30초다. 동기 브라우저 인코딩은 즉시 선점할 수 없으므로 종료 후 결과를 폐기하고 다음 내부 단계를 시작하지 않는다. timeout은 최대 응답 지연 보장이 아니다.

capture의 signal은 capture가 완료될 때까지 적용한다. 반환된 스냅샷을 나중에 취소하려면 진행 중 출력의 signal 또는 dispose를 사용한다. 언마운트 정리는 capture 중이면 abort하고, 스냅샷이 이미 있으면 dispose하는 방식으로 수행한다.

`dispose()`는 멱등이며 진행 중 출력을 취소하고 내부 DOM·캐시·Object URL을 해제한다. 이후 출력은 `DISPOSED`다. 반환된 Blob·문자열·Canvas는 소비자 소유이며 dispose로 지우지 않는다. 소비자가 만든 Object URL은 소비자가 revoke한다. 캡처 간 공유 캐시는 초기 비활성이다.

초기 검토용 정책 한도는 단일 래스터 32,000,000px·한 변 8192px, 분할 가상 출력 합계 256,000,000px·최대 100타일을 제안한다. 각 타일에도 단일 래스터 한도를 적용한다. 단일 SVG는 이 래스터 한도를 적용하지 않지만 입력 복잡도·자원 크기에 따른 실패는 가능하다. 이 수치는 브라우저 하드웨어 한계 측정값이 아니며 모바일 메모리 검증 후 조정해야 한다. 소비자의 size/PPI 조정 권한이 엔진·브라우저 한도를 우회하는 것은 아니다.

32M RGBA 버퍼 하나만으로도 약 128MB가 필요하므로 한도 이내 성공을 보장하지 않는다. 자동 축소 대신 오류로 종료한다. 별도의 총 메모리 상한을 완벽히 계측한다고 약속하지 않으며 큰 페이지 지원 여부는 타일별 렌더링 및 실제 모바일 검증으로 판정한다.

## 11. 지원 범위와 프레임워크

지원 목표 버전 기준은 기존 결정인 2026-10-02의 일반 배포 최신 안정 버전이다. 이번 문서는 브라우저 최신 버전을 재조회하거나 지원 완료로 선언하지 않는다.

| 대상 | 초기 계약·검증 조건 |
|---|---|
| 일반 HTML/CSS·현재 폼 값 | 필수 지원 목표. native appearance와 시각적 일치 판정은 분리 |
| 네이티브 폼 외형 | Safari 차이 확인. 검증된 조합만 지원 등록, 나머지는 Q1 적용 |
| CSS로 외형 지정한 폼 | 후보 지원 범위. `appearance:none` 하나만으로 지원 성공 판정하지 않음 |
| 스크롤·sticky·fixed | 현재 위치·clip 보존. 일반화된 요소 매핑·nested·부모 경계·document 모드 검증 필요 |
| 이미지·웹폰트 | 허용된 취득과 자원별 결과 삽입 검증이 필수 |
| Canvas 2D·인라인 SVG·open Shadow DOM | 별도 브라우저 검증을 통과해야 지원. 아직 전체 보장 없음 |
| iframe·closed Shadow DOM·WebGL·영상·DRM | 초기 보장 범위에서 제외하는 제안. 감지 가능하면 진단; 누락 전체 탐지는 보장하지 않음 |
| Chrome·Safari | 제한된 fixture 기록 존재. 모듈 전체 검증 미완료 |
| Edge·Firefox·Android Chrome·iOS Safari | 지원 목표 유지. 현재 실제 환경 검증 공백 |

Core는 framework-independent TypeScript API로 설계한다. Vanilla와 세 프레임워크 모두 DOM 참조를 넘기는 동일한 capture 계약을 사용한다. 초기에는 별도 hook·directive·action 패키지를 필수로 만들지 않고 공식 소비 예제로 통합을 검증하는 안이다. 분리 래퍼가 필요해지면 별도 API로 검토한다.

React는 DOM ref가 준비된 이후 호출하고 cleanup에서 AbortController와 snapshot을 정리한다. Vue는 mounted/nextTick 이후, Svelte는 mounted/tick 이후 준비된 요소를 전달한다. 렌더링 완료가 차트·이미지 준비까지 의미하지 않으므로 ready와 결합한다. SSR에서 import는 안전해야 하며 DOM이 없는 환경의 capture 호출만 명시적으로 실패한다. import 시 window/document를 읽거나 자원을 요청하지 않는다. 프레임워크별 버전 범위·빌드 소비 검증은 패키지 기준선 수립 시 기록한다.

## 12. 소비 예제

아래 코드는 제안 API의 사용 예이며 현재 설치·실행 가능한 예제가 아니다.

첫 예제의 `element`는 연결된 DOM 참조이고 크기가 최소 320×200 CSS px라고 가정한다. 분할 예제의 `consumeTile`은 애플리케이션이 제공하며 저장·전송 여부를 모듈이 결정하지 않는다.

```ts
import { capture } from 'comins-capture';

const controller = new AbortController();
const snapshot = await capture(element, {
  signal: controller.signal,
  // 소비자가 동일 출처 자원 재요청을 허용하는 예.
  resources: { network: 'same-origin', credentials: 'omit' },
});

try {
  const png = await snapshot.toBlob(); // PNG, CSS 크기 1배
  const paper = await snapshot.toBlob({
    format: 'png',
    size: { kind: 'paper', name: 'A4', ppi: 300 },
    background: '#fff',
  });
  const cropped = await snapshot.toCanvas({
    crop: { x: 0, y: 0, width: 320, height: 200 },
    size: { kind: 'pixels', width: 640, height: 400 },
  });
  const svg = await snapshot.toSvg();
  // value와 meta를 소비자 화면·저장 흐름에 전달한다.
} finally {
  snapshot.dispose();
}
```

```ts
const snapshot = await capture(element); // 추가 네트워크 기본 차단
try {
  for await (const part of snapshot.tiles({
    output: 'blob', format: 'png',
    size: { kind: 'pixels', width: 2500, height: 3500 },
    tile: { width: 1024, height: 1024 },
  })) {
    await consumeTile(part); // 애플리케이션이 제공하는 처리 함수
  }
  // 여기까지 도달해야 전체 분할 성공이다.
} finally {
  snapshot.dispose();
}
```

## 13. 엔진 채택·구현 수용 기준

단일 엔진은 아래 계약을 충족해야 한다. 지원하지 못하는 필수 계약을 경고 하나로 통과시키지 않는다.

| 검증 묶음 | 필수 사례 |
|---|---|
| 네트워크 | 기본 0건 추가 요청, same-origin·origin 목록·credentials·redirect 경계, 엔진 및 임시 DOM 우회 요청 없음 |
| 자원 | 정상/404/CORS/CSP/타임아웃, 두 폰트 중 하나 누락, weight·style·subset 누락, CSS·SVG 참조 수집 불가 |
| 크기 | 640×420 기본·DPR 2 선택·소수 경계, A4 300/150 PPI, ISO/JIS B 차이, margin·landscape·혼용 옵션 오류 |
| 출력 | Blob MIME·실제 치수, JPEG 배경, 미지원 형식 반환 거부, SVG 크기·능동 콘텐츠·외부 참조 검사 |
| 분할 | 2500×3500을 1024 타일 12개, 마지막 452×428, 경계 누락·중복 없음, 중간 실패·break 정리, 전체 Canvas 선할당 없음 |
| 원본 | 값·체크·selection·focus·scroll·스타일 보존, 변경 중 capture 오류, 실패·취소 후 임시 DOM 제거 |
| 배치 | nested sticky·부모 끝 경계·fixed·document/viewport·루트 clip, transform·zoom·미지원 진단 |
| 수명주기 | timeout·abort·dispose 멱등·동시 호출 BUSY, 늦게 완료된 결과 폐기, 반복 사용 시 내부 자원 누적 없음 |
| 소비 환경 | Vanilla·React·Vue·Svelte 실제 앱 및 SSR import, 언마운트 중 캡처, 정식 브라우저·실물 모바일 |

SnapDOM의 공개 hook 외에 opaque 스타일 필드를 읽는 연구 보정은 현재 채택 장애 요인이다. 네트워크 통제·필요한 자원 manifest·안정적인 clone 매핑·분할 렌더링 계약을 어댑터에서 충족할 수 있어야 한다. 버전 고정만으로 구조적 제약이 사라지지는 않는다.

문서 검토 이후의 권고 순서는 Q1/Q2 및 명세 검토 → 필수 계약 중심의 엔진 채택 검증 → 패키지 기준선·구현 계획 → 승인 범위의 Core 구현이다. 연구용 고정 ID 보정 코드를 그대로 제품으로 복사하지 않는다.

## 14. 이번 문서 검증과 미실행 항목

실행한 확인은 기존 확정 결정 대조, 관련 로컬 증거 문서 확인, 공식 자료의 용지 치수·Canvas 직렬화 동작 조회, 별도 계산을 통한 PPI·여백·contain·타일 경계 확인이다. 문서 링크·개인 로컬 경로 포함 여부를 점검한다.

제품 코드·의존성·설정은 변경하지 않았다. 위 타입은 개념 시그니처이며 완전한 `.d.ts`와 컴파일 검증 대상 예제로 아직 제공하지 않는다. 브라우저·단위 테스트를 이번 문서 작업에서 재실행하지 않았고 과거 통과 기록을 신규 검증으로 보고하지 않는다. 정식 보안 스캔·npm 빌드·프레임워크 소비 테스트·최신 브라우저 인증은 미실행이다.
