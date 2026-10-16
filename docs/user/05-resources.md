# Input and Resources

[한국어](../ko/05-resources.md) · [Documentation index](../README.md)

The target must be a positive-size HTMLElement connected to the current
document. Detached nodes, other documents, and whole body/documentElement
targets are rejected. Finish rendering, image decode, and framework flushes
before capture; keep the target stable until capture completes.

## Supported input boundary

Ordinary static text, flex, table, IMG, CSS/pseudo images, and declared web
fonts are processed within the validation boundary. This is not a guarantee
for every CSS property or element.

| Content | Contract |
| --- | --- |
| IMG / CSS / pseudo images | Loaded image and supported PNG/JPEG/WebP bytes |
| Web fonts | Readable font-face declarations and supported file bytes |
| SVG image resources | Supply a consumer-validated raster Blob through resolve |
| Forms, video, canvas, iframe, inline SVG, custom elements, open Shadow DOM | UNSUPPORTED_CONTENT |
| fixed/sticky, moved scroll state, backdrop-filter, active animation | UNSUPPORTED_CONTENT |
| Capture-root transform/zoom, vertical writing | UNSUPPORTED_CONTENT |
| Closed Shadow DOM | Unsupported; platform detection cannot be guaranteed |

## Network policy

Defaults are `network:'deny'` and `credentials:'omit'`. Already visible assets
may still need bytes for capture. This policy does not control the application's
own requests or side effects performed by its resolver.

```js
const snapshot = await capture(target, {
  resources:{network:'same-origin'},
});
try {
  const {value} = await snapshot.toBlob({format:'png'});
} finally {
  snapshot.dispose();
}
```

Alternatively allow exact origins with
`network:{origins:['https://assets.example.com']}`. Paths, queries and wildcards
are not allowlist entries. CORS, CSP, response and decode checks still apply;
redirects are rejected. `credentials:'same-origin'` never sends credentials to
cross-origin resources.

## Resolver ownership

```js
async function captureWithResources(target, cache) {
  return capture(target, {
    resources:{
      network:'deny',
      resolve:async ({url, signal}) => {
        if (signal.aborted) throw signal.reason;
        return cache.get(url);
      },
    },
  });
}
```

Here cache is an application-populated `Map<string, Blob>` keyed by absolute
URL. Resolve receives `{resourceRef, kind, url, signal}` with image/font kind,
and returns Blob or undefined. Undefined applies network policy; it does not
skip the resource successfully. Honor signal in any asynchronous work.
The caller must dispose the returned snapshot.

Unreadable stylesheets, unverifiable FontFace declarations, and local() font
sources are rejected. SYSTEM_FONT diagnostics flag environment-dependent
system/fallback fonts; matching glyphs across browsers are not guaranteed.

## Limits and validation

| Resource | Limit |
| --- | --- |
| One prepared resource | 16,000,000 bytes |
| All prepared resources | 64,000,000 bytes |
| Input image / output Canvas | 8192 px per side; 32,000,000 px total |
| Inspected HTML nodes | 10,000 |

Being within a numeric limit does not guarantee memory availability or supported
content. SVG validation rejects scripts, event handlers, external references,
DOCTYPE/entities, and unverifiable CSS. It is not a general-purpose sanitizer
for arbitrary SVG input. See [errors](06-lifecycle-errors.md).
