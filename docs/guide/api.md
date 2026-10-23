# API

0.0.1 공개 API 계약입니다. 패키지 루트 `comins-capture`만 공개하며 deep import는 지원하지 않습니다.

## capture(target, options?)

```ts
capture(target: HTMLElement, options?: CaptureOptions): Promise<CaptureSnapshot>
```

연결된 정적 HTMLElement를 준비·직렬화·검증하여 snapshot을 반환합니다. 렌더·자원 준비가 끝난 클라이언트에서 호출합니다. DOM 없는 import·프레임워크 SSR은 가능하지만 SSR 캡처는 제공하지 않습니다.

| 옵션 | 기본값 | 계약 |
|---|---|---|
| signal | 없음 | AbortSignal, 취소 시 ABORTED |
| timeoutMs | 30000 | 양수, 최대 2147483647 ms |
| ready | 없음 | `async ({signal}) => {}`로 앱 렌더·자원 준비 대기 |
| resources.network | deny | deny, same-origin 또는 `{origins: ['https://example.com']}` |
| resources.credentials | omit | omit 또는 same-origin |
| resources.resolve | 없음 | `async ({resourceRef,kind,url,signal}) => Blob \| undefined`; undefined면 네트워크 정책 적용 |

자원 kind는 image/font이며 CSS 이미지도 image로 준비합니다. 독립 CSS/SVG 자원 취득은 제공하지 않습니다.

부분 성공과 `failure` 옵션은 없습니다. 준비·검증 불충족은 오류입니다. 한 Document의 capture는 동시에 하나만 실행합니다. 취소를 무시한 작업이 남으면 완료될 때까지 BUSY를 유지하므로 ready/resolver는 signal을 존중해야 합니다. 기본 deny는 앱 자체 요청이나 resolver의 외부 동작을 통제하지 않습니다.

## CaptureSnapshot

| 멤버 | 역할 |
|---|---|
| meta | snapshotId, capturedDpr, sourceRect, startedAt/completedAt, status:'complete', diagnostics |
| toSvg(options?) | `Promise<CaptureOutput<string>>` |
| toCanvas(options?) | `Promise<CaptureOutput<HTMLCanvasElement>>` |
| toBlob(options?) | `Promise<CaptureOutput<Blob>>`. 기본 PNG, JPEG/WebP/SVG 선택 |
| dispose() | 내부 자원 해제·출력 취소. 반복 호출 가능 |

결과는 `{value, meta}`이며 출력 meta에는 width/height/unit, mime, contentRect가 추가됩니다. 캡처 당시 검증 SVG를 재사용합니다. crop·타일 및 전용 메타데이터는 없습니다.

출력은 snapshot마다 순차 실행합니다. 중첩 호출은 BUSY, dispose 이후에는 DISPOSED입니다. 출력별 signal/timeoutMs를 받습니다. 반환 Canvas와 생성한 Blob URL은 소비자가 해제합니다.

dispose는 진행 중인 SVG·SVG Blob 출력도 DISPOSED로 취소하며 반복 호출할 수 있습니다. 취소를 무시하는 렌더·인코딩 작업이 남아 있으면 종료 후 내부 소유권을 해제합니다. 해제된 snapshot 객체를 보관해도 내부 SVG·렌더러·정리 콜백의 참조를 유지하지 않습니다. 이미 반환한 출력값과 meta는 유지합니다.

```js
import {capture, CaptureError} from 'comins-capture';
let snapshot;
try {
  snapshot = await capture(element, {ready: async () => { await document.fonts.ready; }});
  const {value: blob, meta} = await snapshot.toBlob({format: 'png'});
} catch (error) {
  if (error instanceof CaptureError) console.error(error.code, error.stage);
  else throw error;
} finally {
  snapshot?.dispose();
}
```

옵션은 [출력 계약](output-options.md)을 따릅니다. 루트에서 CaptureTarget, CaptureOptions, CaptureSnapshot, SnapshotMeta, OutputMeta, CaptureOutput, RasterOptions, SvgOptions, BlobOptions, RasterSize, SvgSize, Margins, ResourceOptions, ResourceKind, Size, Rect, PaperName, PaperOptions, NetworkPolicy, Diagnostic, CaptureErrorCode, CaptureStage 타입을 가져올 수 있습니다. 엔진 타입·캐시·플러그인은 노출하지 않습니다.

## paperSize(name, options?)

```ts
paperSize(name: PaperName, options?: PaperOptions): Size
```

동기·순수 계산이며 DOM이 필요 없습니다. 이름은 A3/A4/A5/B3/B4/B5입니다. standard 기본 ISO(또는 JIS), orientation 기본 portrait(또는 landscape), ppi 기본 300입니다. mm÷25.4×PPI를 정수로 반올림합니다.

```js
paperSize('A4'); // {width: 2480, height: 3508}
paperSize('B4', {standard:'JIS', ppi:254}); // {width:2570, height:3640}
```

잘못된 입력은 RangeError입니다. 실제 출력 가능 크기나 인쇄 품질을 보증하지 않습니다. 용지 치수는 공개 자료 교차 대조와 출력 기하 검증으로 확인했습니다. 근거와 ISO/JIS 차이는 [출력 옵션](output-options.md)을 따릅니다.

## CaptureError

code와 stage(prepare/capture/output)로 분기합니다. 원본 DOM·전체 URL·내부 cause는 오류 메시지에 노출하지 않습니다.

- 입력: INVALID_TARGET, INVALID_OPTIONS
- 지원: UNSUPPORTED_CONTENT, UNSUPPORTED_ENVIRONMENT, FORMAT_UNSUPPORTED
- 자원·원본: NETWORK_DISABLED, RESOURCE_FAILED, RESOURCE_UNVERIFIABLE, SOURCE_CHANGED
- 출력: OUTPUT_LIMIT, OUTPUT_MISMATCH
- 수명주기: ABORTED, TIMEOUT, DISPOSED, BUSY
- 엔진: ENGINE_FAILED

오류별 원인과 조치는 [문제 해결](troubleshooting.md)을 따릅니다. 첫 캡처·다운로드·Blob URL 해제 예제는 [시작하기](getting-started.md), 이미지·폰트 허용 및 resolver는 [입력과 자원](dom-integration.md)에 있습니다.
