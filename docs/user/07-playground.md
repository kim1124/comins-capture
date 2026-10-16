# Playground

[한국어](../ko/07-playground.md) · [Documentation index](../README.md)

Run `npm run dev` from the checkout and open <http://127.0.0.1:6004>.
The server builds first and has no HMR. Rebuild after source changes.
Use CAPTURE_PORT for another port. The authored source sample is 640×420 CSS px.

1. Choose format, dimensions, fit and background.
2. Generate the image and inspect its reported size/unit and preview.
3. Save through the download link. Reset restores defaults and clears the result.

| Setting | Default | Try |
| --- | --- | --- |
| Format | PNG | JPEG, conditional WebP, foreignObject SVG |
| Size | CSS 1× | 2×, captured DPR, custom 800×600, paper |
| Paper | ISO portrait, 300 PPI, zero margin | ISO/JIS A3/A4/A5/B3/B4/B5, landscape, margins |
| Fit | contain | cover, stretch |
| Background | transparent | White, dark teal; JPEG defaults to white |
| SVG | CSS dimensions | Paper mm without PPI/DPR |

Controls use the public capture → validated SVG → output path. The displayed
API/code area reflects current options. Run/reset are disabled during work;
cancel is enabled. Success and failure both dispose the snapshot. A new run,
failure, reset or page teardown releases the previous URL, and failure clears
the previous success image.

The demo accepts its fixed sample, not arbitrary site URLs or user HTML.
Source is in playground/index.html, app.mjs and style.css. It does not
demonstrate crop, tiles or partial output. See [output options](04-output-options.md).

The cleaned Playground was checked in actual Chrome UA 154 on 2026-10-15 for
default/2×/custom PNG, A4 JPEG, JIS B4 landscape JPEG and mm SVG. Native Safari
was not rerun for this candidate. See [verification limits](08-browser-support.md).
