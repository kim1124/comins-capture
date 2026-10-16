# Public API Reference

[한국어](../ko/09-public-api.md) · [Documentation index](../README.md)

Import only from `comins-capture`. Runtime exports are exactly capture,
CaptureError and paperSize. Internal modules and engine types are not public.

## capture(target, options?)

```ts
capture(target: HTMLElement, options?: CaptureOptions): Promise<CaptureSnapshot>
```

| Option | Default | Contract |
| --- | --- | --- |
| signal | None | AbortSignal; cancellation returns ABORTED |
| timeoutMs | 30000 | Positive number, at most 2147483647 ms |
| ready | None | `async ({signal}) => {}`; await application readiness |
| resources.network | deny | deny, same-origin, or `{origins:['https://assets.example.com']}` |
| resources.credentials | omit | omit or same-origin |
| resources.resolve | None | `async ({resourceRef,kind,url,signal}) => Blob \| undefined` |

Resolve kind is image/font. Undefined applies network policy. See
[resources](05-resources.md) for supported content and limits. Capture requires
a connected static HTMLElement in a browser; DOM-free package import is allowed.
There is no failure/partial-success option.

## CaptureSnapshot

| Member | Result / ownership |
| --- | --- |
| meta | snapshotId, capturedDpr, sourceRect, startedAt/completedAt, complete status, diagnostics |
| toSvg(options?) | `Promise<CaptureOutput<string>>` |
| toCanvas(options?) | `Promise<CaptureOutput<HTMLCanvasElement>>` |
| toBlob(options?) | `Promise<CaptureOutput<Blob>>`; PNG default, JPEG/WebP/SVG selectable |
| dispose() | Idempotent release and output cancellation |

CaptureOutput is `{value, meta}`. Output meta adds width/height/unit, MIME and
contentRect. Methods accept signal/timeoutMs and execute sequentially per
snapshot. BUSY rejects overlap; DISPOSED rejects use after release. The caller
owns returned Canvases and application-created Blob URLs.

Sizing, fit, alignment, background and format-specific quality are defined in
[output options](04-output-options.md). There are no crop, tile or partial APIs.

## paperSize(name, options?)

```ts
paperSize(name: PaperName, options?: PaperOptions): Size
```

Pure DOM-free mm-to-pixel calculation. Names are A3/A4/A5/B3/B4/B5.
Defaults: standard ISO (or JIS), portrait (or landscape), ppi 300.
Invalid inputs throw RangeError. It does not validate the requested size
against a browser's available memory or promise printing quality.

```js
import {paperSize} from 'comins-capture';
paperSize('A4'); // {width:2480, height:3508}
paperSize('B4', {standard:'JIS', ppi:254}); // {width:2570, height:3640}
```

## CaptureError and types

CaptureError exposes code and prepare/capture/output stage. The complete code
list and actions are in [lifecycle and errors](06-lifecycle-errors.md).

Public types: CaptureTarget, CaptureOptions, CaptureSnapshot, SnapshotMeta,
OutputMeta, CaptureOutput, RasterOptions, SvgOptions, BlobOptions, RasterSize,
SvgSize, Margins, ResourceOptions, ResourceKind, Size, Rect, PaperName,
PaperOptions, NetworkPolicy, Diagnostic, CaptureErrorCode and CaptureStage.
