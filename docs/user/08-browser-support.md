# Browser Support and Verification

[한국어](../ko/08-browser-support.md) · [Documentation index](../README.md)

0.0.1 remains unpublished. Implementation, bounded browser evidence and public
release closure are separate states. Chrome technical quality is conditionally
accepted for the supported static, single-output scope.

## Measured candidate

The 2026-10-15 packed development runtime was checked in actual Chrome
154.0.8037.98 on macOS at DPR 2. Installed Chrome 155 metadata is not runtime
evidence. Results cover authored fixtures, not arbitrary pages.

| Check | Recorded result |
| --- | --- |
| Single-output/lifecycle/errors | 15/15 passed |
| Resources/SVG | 15/15 passed |
| 30 sequential statement captures | 0 failures; one PNG hash; no unreleased Blob URLs or DOM growth |
| Simple 5-node capture → PNG | 10 samples; p50 23.8 ms; p95 26.2 ms |
| Statement 64-node capture → PNG | 10 samples; p50 183.6 ms; p95 198.9 ms |
| Dense 145-node capture → PNG | 10 samples; p50 306.7 ms; p95 438.0 ms |

p95 uses nearest-rank across these ten samples; it is not a production traffic
percentile. Source/default/2×/custom/A4/JIS B4/SVG comparisons found no visible
layout damage within this fixture. Exact full-image pixel equality is not a
release claim. The four-framework check used Chrome UA 154 without an exact
patch identification; it is a separate recorded run.

## Dimensions and release boundary

On 2026-10-16 public TAKEO and FUJIFILM tables matched all six JIS presets.
RICOH independently matched A3/A4/A5/B4/B5. ISO/JIS × six sizes × two
orientations passed 24 mm/300-PPI-pixel and raster/SVG-layout cases.
JISC login and direct original-standard viewing are not required for this
dimension check. The JIS normative original was not directly reviewed;
this does not certify the entire standard. See [paper sources](04-output-options.md).

Publishing still requires final artifact/source identification, remote CI and
required-check confirmation, and explicit publication approval. Public package
metadata alone does not establish publication or release closure.

## Unsupported or unverified

Native Safari remains excluded because known shadow/clip failures are unresolved.
Edge, Firefox, physical mobile devices, low-end systems and broad CSS support
have not been verified for this candidate. WebKit or older authored Safari
fixtures do not establish native Safari support.

Forced-GC, native/GPU and long-duration memory behavior were not measured.
The 30-run check does not prove absence of all leaks. Historical crop/tiles and
stateful/full-page capture are outside this release. Reuse recorded evidence
only while the relevant runtime, configuration and dependencies are identical.
