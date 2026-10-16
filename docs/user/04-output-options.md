# Output Options

[한국어](../ko/04-output-options.md) · [Documentation index](../README.md)

All output methods return `{value, meta}` and reuse the same validated SVG.
Call methods sequentially before disposing the snapshot.

| Output | Size option | Default |
| --- | --- | --- |
| PNG/JPEG/WebP/Canvas | `{kind:'scale', value:number \| 'device'}` | CSS 1×; device uses the captured DPR |
| Raster | `{kind:'pixels', width, height}` | Positive integer pixels |
| Raster paper | `{kind:'paper', name, system?, orientation?, ppi?, marginMm?}` | ISO, portrait, 300 PPI, zero margins |
| SVG | `{kind:'css', width, height}` | Source CSS dimensions |
| SVG paper | `{kind:'paper', name, system?, orientation?, marginMm?}` | mm dimensions and matching numeric viewBox; no PPI |

## Paper dimensions

Portrait dimensions below are in mm. Landscape swaps the two sides.

| Name | ISO (mm) | JIS (mm) |
| --- | --- | --- |
| A3 | 297×420 | 297×420 |
| A4 | 210×297 | 210×297 |
| A5 | 148×210 | 148×210 |
| B3 | 353×500 | 364×515 |
| B4 | 250×353 | 257×364 |
| B5 | 176×250 | 182×257 |

JIS values were corroborated against the public
[TAKEO JIS P0138 table](https://takeopaper.com/knowledge/specific) and
[FUJIFILM table](https://www.fujifilm.com/fb/ja/support/colorprint/howto/paper/size).
ISO values use the earlier comparison with the
[ISO 216:2007 preview](https://preview.sist.si/sist-preview/36631/c0883203ea25445c9992bb09343620c5/ISO-216-2007.pdf).
These are output-size presets, not certification of the entire paper standard.

Use lowercase `system:'jis'` for output options and uppercase `standard:'JIS'`
for the `paperSize()` helper. Raster pixels are rounded from mm×PPI÷25.4:
A4 at 300 PPI is 2480×3508 px. PPI does not rewrite file DPI metadata.
`marginMm` requires top/right/bottom/left; 10 mm at 300 PPI rounds to 118 px.

```js
const result = await snapshot.toBlob({
  format:'jpeg',
  size:{kind:'paper', name:'B4', system:'jis', orientation:'landscape'},
  background:'#fff',
});
// result.meta.width === 4299; result.meta.height === 3035
const svg = await snapshot.toSvg({size:{kind:'paper', name:'A4'}});
// svg.meta.width === 210; svg.meta.height === 297; svg.meta.unit === 'mm'
```

## Layout, formats, and limits

Layout applies the output dimensions, margins, then fit and alignment.
`fit` defaults to contain; cover clips overflow and stretch scales each axis.
`align` defaults to `{x:0.5,y:0.5}` and accepts values from 0 to 1.

Background is transparent by default, except JPEG defaults to white. Explicit
transparent JPEG is rejected. Accepted colors are hex, the 16 lowercase basic
CSS color names, transparent, or null; arbitrary CSS functions/URLs are rejected.

JPEG/WebP quality defaults to 0.92. Do not specify quality for PNG/SVG.
WebP requires native support for the requested MIME. Unsupported encoders return
FORMAT_UNSUPPORTED without fallback. SVG contains foreignObject.

Canvas output is limited to 8192 px per side and 32,000,000 px total. Larger
requests fail with OUTPUT_LIMIT; there is no automatic downscaling or tiling.
The caller owns returned Canvases and application-created Blob URLs.
