# Browser Support and Verification

[한국어](../ko/08-browser-support.md) · [Documentation index](../README.md)

This document covers the 0.0.1 runtime. Implementation, bounded browser evidence and public
release closure are separate states. Chrome technical quality is conditionally
accepted for the supported static, single-output scope.

## Measured candidate

The reviewed runtime was checked on 2026-10-16 in actual Chrome 155.0.8059.80,
headless on macOS at DPR 2. This is a fresh run after the engine boundary fixes;
the older Chrome 154 result is historical. Results cover authored fixtures,
not arbitrary pages.

| Check | Recorded result |
| --- | --- |
| Single-output/lifecycle/errors | 15/15 passed |
| Resources/SVG | 15/15 passed |
| Engine boundaries | 6/6 passed; no implicit icon-font acquisition; large PNG and downscaled PNG/JPEG |
| 30 sequential statement captures | 0 failures; one PNG hash; no unreleased Blob URLs or DOM growth |
| Simple 5-node capture → PNG | 10 samples; p50 16.6 ms; p95 18.1 ms |
| Statement 64-node capture → PNG | 10 samples; p50 42.2 ms; p95 47.3 ms |
| Dense 145-node capture → PNG | 10 samples; p50 71.0 ms; p95 76.2 ms |

p95 uses nearest-rank across these ten samples; it is not a production traffic
percentile. Source/default/2×/custom/A4/JIS B4/SVG comparisons found no visible
layout damage within this fixture. Exact full-image pixel equality is not a
release claim. These timings are a single-machine sample with no latency SLA
and are not directly comparable to the older browser/runtime measurement.

The reviewed runtime also passed a fresh four-framework browser run in the same
Chrome version: Vanilla, React StrictMode, Vue and Svelte output, disposal,
URL revocation, pending unmount cancellation and remounting. Public types and
DOM-free React/Vue/Svelte server rendering passed separately.

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
