# Browser Support and Verification

[한국어](../ko/08-browser-support.md) · [Documentation index](../README.md)

This document distinguishes the unpublished local 0.0.2 candidate from historical
0.0.1 evidence. Implementation, bounded browser evidence and public release
closure are separate states.

## Final CSS-boundary candidate, 2026-10-23 — bounded evidence

The latest unpublished local 0.0.2 candidate excludes vendor scrollbar-family
rules only when they are definitely unrelated to the inspected source nodes in
their original ancestor context. Related, mixed and unknown rules retain their
original text. Relevant `var()`, unknown CSS and unsupported media serialization
can still fail strict validation. This does not establish arbitrary stylesheet
isolation or general CSS support. The SVG-flow and earlier records below retain
their own revision boundaries.

| Recorded final-candidate check | Result and boundary |
| --- | --- |
| `npm run verify` | 84/84 unit, 6/6 consumer, typecheck/build/licenses/docs passed |
| Installed Chrome 155.0.8059.86 DPR1/DPR2 and WebKit 26.5 DPR2 | Seven affected existing suites plus one new CSS suite per configuration: 24/24 passed |
| Independent CSS cases | 56/56 passed; zero capture-phase unsafe CSS URL acquisitions. Clean/plain/unrelated-var/actual-Table PNG bytes matched within each browser |
| Four English/Korean quick-start/single-output site UIs | 4/4 passed using candidate modules substituted only in verification-browser responses. Each route checked 20 actual candidate JS hashes, 320×240 PNG preview decoding and source DOM preservation. The installed 0.0.1 and deployed site were not upgraded |
| Verification freeze | All 1,764 src/dist/scripts/test/package hashes remained unchanged; 373 site-source, 81 installed-package and 45 candidate-dist files were also unchanged |
| Scoped security diff review | Completed scan `143dfad2-6ebd-4819-a7a1-008e6394d2c0`; direct review of 24 authoritative source/config/tooling files, zero candidate or confirmed vulnerabilities. Not a whole-repository, vendor, new-advisory or runtime-attack audit |

These are recorded results for the frozen source/dist, not new executions during
the documentation follow-up. Native Safari was not run because the existing OS
authentication/automation blocker remains; WebKit is not a substitute. The narrow
plain-block SVG correction below does not solve every structure, scale or external
whole-SVG enlargement clip/shadow issue. Final-candidate native Safari and
representative native UI acceptance, final package-artifact/provenance/security
checks, remote CI and explicit publication approval remain pending.
`releaseReady=false`; the published 0.0.1 history does not establish release
acceptance of this local candidate.

## Plain block extension, 2026-10-23 — bounded verification

The local extension preserves single-Text static/relative block paragraphs,
including multiple lines, and addresses CSSOM zoom serialization and Float32
reciprocal precision. New focused CSS, fractional-size, cover, stretch and mm
cases initially passed 42/42 per browser. Review then reproduced float-sibling
wrapping and static-promotion paint-order regressions. After conservative fallback
exclusions, the frozen candidate passed 51/51 new cases, 23/23 existing text cases
and nine unchanged non-target/single-stage output comparisons per browser.
The 1,924-file runtime freeze was unchanged across checks. Types, build, 73 unit,
6 consumer and license checks passed. The final docs stage of verify failed on a
link to an unpackaged record; after fixing the link, the docs check passed without
repeating all gates. All 46 distinct research checks passed; only the affected
loopback test was rerun after listen EPERM. Installed Chrome 155.0.8059.86 at DPR1
and DPR2 plus WebKit 26.5 at DPR2 passed all 30 suites. Independent review verified
the fixes and current hashes with no further actionable defect. The absolute-only
results below cover the earlier revision.

Baseline/intrinsic contexts, mixed inline, padded/bordered text, RTL and generated
content remain outside the correction. Negative margins, paint/overlap risks,
visible overflow and inspection-budget overflow also exclude normal-flow correction.
Fallback preserves earlier structure and paint behavior; existing CSS-zoom reflow
can remain. External floats can already change the native 1x capture, a separate
existing limitation. Exact cancellation is not guaranteed for
every scale. Existing CSS-zoom box quantization is recorded separately from any
layout change introduced by text projection. Native Safari and whole-SVG external
enlargement clip/shadow limitations remain unresolved. No PNG embedding, forced
nowrap or font change is used. These are local verification observations.

## SVG text partial-fix candidate, 2026-10-23

The local candidate preserves immutable native text geometry and typography for
eligible absolute-positioned single text leaves, separating their text scale
from container effects. Final verify passed type/build, 66 unit and 6 consumer tests, licenses and docs.
All 46 distinct research tests passed: one loopback-permission environment failure
was resolved by rerunning only that affected server test. Chrome DPR1/DPR2 and
WebKit DPR2 passed all 27 suites, including seven SVG cases and 23 text eligibility
cases per configuration. Independent review has no unresolved actionable finding.
These results are separate from the older revision below.
Normal-flow, mixed-inline, multiline, RTL and generated text were outside that
earlier absolute-only correction. No PNG embedding, font attribute change or forced nowrap is used.

The single-run prototype preserved every pixel outside the label, including
shadows and clipping; isolated 4x text remained close to native geometric paint.
This diagnostic observation does not prove quality for arbitrary whole-SVG
re-enlargement. Existing WebKit shadow/clip defects under external enlargement,
general HTML shrinking fidelity, and native Safari validation of this revision
remain unresolved. This candidate is not accepted or release-ready.

## Earlier local 0.0.2 candidate, 2026-10-21

The direct foreignObject/CSS-zoom raster-downscale path now fixes original 1×
layout into a Canvas before shrinking, preserving the representative normal-text
label, shadows and clipping together. Independent automated gates passed on the
new revision. Native Safari has not run on it, and SVG downscale line layout
remains unresolved. Candidate acceptance and release readiness remain withheld.
These changes are not part of the npm 0.0.1 installation and do not establish
general Safari support.

| Frozen candidate check | Recorded result |
| --- | --- |
| `npm run verify` | typecheck/build, 59/59 unit, 6/6 consumer, licenses and docs passed |
| `npm run test:research` | 46/46 passed |
| Installed Chrome 155.0.8059.85 headless, DPR1 | engine 6/6, cold images 6/6, resources 15/15, output/lifecycle 7/7, automatic visual 7/7, paper clipping 15/15 and new raster downscale 19/19 passed |
| Same Chrome, DPR2 | The six existing suites and new raster-path regression 17/17 passed; reciprocal rendering retained |
| WebKit 26.5, DPR2 | The six existing suites and new raster downscale 19/19 passed; not native Safari evidence |
| Native Safari on the new raster revision | Not run: CUA surface contention and disabled SafariDriver remote automation |
| Current Chrome UI source/output CUA comparison and human review | Not run |

The new regression records unmarked source-character Range line partitions and
nonempty source ink, then compares label and two shadow regions exactly against
an independent native downscale of the same browser's public 1× Canvas. A5 cover
checks all 53,704 pixels outside the clip for white and transparent backgrounds;
both had zero violations. Actual renderer Canvas tracking covers success, draw
failure, cancellation immediately after source draw, pending-decode abort,
timeout/dispose and ten repeated downscales. These ten operations observe the new
intermediate's bounded ownership; the existing lifecycle's forty repeats are
separate. Neither establishes long-run heap/native/GPU leak freedom.

The new branch applies only to the existing direct foreignObject/XHTML-div path
with CSS zoom support, both scales at most 1 and at least one below 1. Its
ceil-sized original intermediate and final Canvas are each checked before
allocation against 8192 px per side and 32,000,000 px total. Even a small final
output can return OUTPUT_LIMIT if the intermediate exceeds either bound; this
is not a new global capture-input restriction. Each operation clears its
temporary Canvas in finally. Native 1× bitmap downsampling can change sampling
and softness; exact source-screenshot pixel equality is not guaranteed.

Focused evidence found seven existing Chrome DPR2 reciprocal-path PNGs and 21
unchanged-path SVG/1×/upscale/mixed-scale comparisons byte-identical to the prior
renderer. The independent verifier confirmed matching hashes and reused those
focused comparisons separately from fresh full gates. SVG serialization, public
mm dimensions/numerical viewBox, retained SVG and default SVG fast path remain
unchanged. SVG downscale text line layout is still unresolved; no PNG embedding
was applied to product SVG.

Historical native Safari 27.0.1 DPR2 on renderer94c19 passed engine6, cold6,
resources15, automatic visual7 and paper RGB/geometry15: 49 case groups. Actual
A4 text reflow nevertheless reproduced. These are pre-fix historical results,
not native acceptance of the new renderer. Earlier A4/JIS nested-clip losses
were addressed by output-coordinate HTML clip/position wrappers and reciprocal
mm viewports, retained in the 15-case paper regression. The previous Chrome
DPR2 cover observation of 18 immediately adjacent outer-column pixels with
maximum RGB delta2/255 remains distinct from broad colored-content leakage.

All 1,770 frozen files remained unchanged during the new full gates. Native
Safari, Chrome UI, human review and SVG line fidelity remain pending; no final
package was created and releaseReady remains false. Remote CI, publication
approval and G1/G2/G3/G4 conditions remain open. iOS, other Safari versions,
broad CSS, long-running native/GPU memory and arbitrary global CSS isolation
are not guaranteed.

## Earlier local 0.0.2 candidate, 2026-10-19

An additional engine-boundary check passed 6/6 in Chrome UA 154 but 4/6 in
native Safari 27.0.1. Two root-image cases (1000px PNG/JPEG displayed at 100px)
returned a transparent center pixel, so the images were missing. Both CSS
background and icon cases passed in that fixture order; this does not establish
that the defect affects only root images.

WebKit 26.5 reproduced the missing pixels. Cold PNG controls showed that outer
SVG decode can finish before nested XHTML image paint is ready. Adding only
`decoding="sync"` to those images preserved all four RGB regions in the first
public raster result. The candidate applies this hint only to the parsed SVG
copy used for raster output. Source DOM, retained verified SVG, SVG output,
URLs, dependencies and wait times are unchanged. Current post-fix regression
results are recorded separately in the checkout worklog.

The next native Safari diagnostic could not run while the Mac was locked.
WebKit diagnosis does not substitute for native Safari acceptance, so Safari
compatibility and candidate release readiness remain blocked. The earlier
Chrome UA 154 resource run timed out after its first case; a pre-change rerun
in installed Chrome 155.0.8059.80 passed 15/15 without reproducing the timeout.
This does not establish its root cause. The historical shadow/clip and other
passing results below do not substitute for current-candidate verification.

The candidate releases internal SVG, renderer and cleanup references when a
disposed snapshot remains retained. It also fixes a TypeError when disposal
cancels synchronous SVG or SVG-Blob output. A forced-GC V8 reachability regression
passed; this does not prove absence of all browser, native or GPU memory leaks.

Native macOS Safari 27.0.1 at DPR 2 reproduced the previous 2× shadow/clip defect.
Using HTML zoom instead of SVG scaling for the affected engine shape restores
card shadows and clipped labels, diagonal stripes and circles in the representative
statement comparison. Seven bounded fixture groups passed output dimensions,
formats, contain/cover/stretch, paper, SVG mm, transparency, errors, cancellation,
disposal and 40 sequential captures. Full-image exact pixel equality, iOS and
other Safari versions are not established.

Before this image-decoding change, the frozen candidate passed type/build, 56 unit and 6 consumer tests, licenses
and documentation checks. Public types, DOM-free SSR and consumer bundles passed.
Actual Chrome UA 154 (exact runtime patch unconfirmed) and native Safari 27.0.1
each passed Vanilla, React StrictMode, Vue and Svelte consumers, including output,
disposal, URL revocation, pending-unmount cancellation and remounting. All 130
frozen source/dist/test/scripts/package/fixture items remained unchanged.

The base revision's Standard security scan reported zero confirmed findings with
partial coverage. A separate focused review of the modified snapshot/renderer
reported no additional confirmed defects or security regression; this is not a
complete security audit of the modified candidate. Remote CI, publication and
deployment were not performed. The historical results below do not substitute
for these checks of the modified candidate.

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

Native Safari was excluded from the historical 0.0.1 evidence because of the
shadow/clip failures. The bounded local candidate observation is recorded above.
Edge, Firefox, physical mobile devices, low-end systems and broad CSS support
have not been verified for this candidate. WebKit or older authored Safari
fixtures do not establish native Safari support.

Native/GPU and long-duration browser memory behavior were not measured.
The 30-run check does not prove absence of all leaks. Historical crop/tiles and
stateful/full-page capture are outside this release. Reuse recorded evidence
only while the relevant runtime, configuration and dependencies are identical.
