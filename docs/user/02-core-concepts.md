# Core Concepts

[한국어](../ko/02-core-concepts.md) · [Documentation index](../README.md)

The application owns a connected, static HTMLElement. Capture prepares its
resources, serializes a clone, validates the SVG, checks source stability,
and returns a snapshot. Output calls reuse that validated snapshot.

```text
capture → ready → DOM checks → resource preparation → engine serialization
        → SVG and source checks → snapshot → PNG / JPEG / WebP / Canvas / SVG
```

The engine is a pinned, minimally modified SnapDOM 3.2.0 behind a module-owned
adapter. Public declarations expose no engine types, caches, or plugins.
The build records input hashes, upstream license text, and modifications.

The package root can be imported without a DOM. `paperSize()` is a pure
calculation. `capture()` requires a browser and does not provide server-side
rendering or arbitrary URL capture.

One document permits one capture at a time. A snapshot permits one output at a
time. Await each operation and dispose snapshots when finished. See
[lifecycle and errors](06-lifecycle-errors.md).

All output sizes are planned before rendering. Raster output is rendered at
the requested size, rather than scaling a previously exported bitmap. SVG uses
foreignObject and is not a pure vector drawing or a design-tool interchange
format. See [output options](04-output-options.md).

The first release excludes crop, tiles, partial success, stateful/full-page
capture, Shadow DOM, PDF, video, and automatic engine fallback. Input/resource
validation is described in [input and resources](05-resources.md).
