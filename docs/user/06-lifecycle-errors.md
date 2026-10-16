# Lifecycle and Errors

[한국어](../ko/06-lifecycle-errors.md) · [Documentation index](../README.md)

Await capture and each snapshot output. A document permits one capture at a
time; a snapshot permits one output at a time. Concurrency returns BUSY.
Cancellation-ignoring work can keep its lease until it actually settles.

```js
import {capture, CaptureError} from 'comins-capture';

async function createPng(target, signal) {
  let snapshot;
  try {
    snapshot = await capture(target, {signal});
    return await snapshot.toBlob({format:'png', signal});
  } catch (error) {
    if (error instanceof CaptureError) console.error(error.code, error.stage);
    throw error;
  } finally {
    snapshot?.dispose();
  }
}
```

The application connects an AbortController to page/component teardown.
Pass its signal through ready/resolver work. Capture and output accept a
positive timeoutMs up to 2147483647 ms, default 30000. Use a fresh controller
for a new request. Disposal is idempotent, releases owned capture resources,
and cancels output; it does not revoke application-created Blob URLs.

## Error reference

| Code | Check or action |
| --- | --- |
| INVALID_TARGET | Connected positive-size HTMLElement in the current document |
| INVALID_OPTIONS | Supported keys, units, sizes and format-specific options |
| UNSUPPORTED_ENVIRONMENT | Run capture in a browser after rendering |
| UNSUPPORTED_CONTENT | Use the supported static input subset |
| NETWORK_DISABLED | Resolve trusted bytes or explicitly allow their origin |
| RESOURCE_FAILED | Check loading, decode, CORS/CSP, resolver and signal handling |
| RESOURCE_UNVERIFIABLE | Make declarations and resource bytes verifiable |
| SOURCE_CHANGED | Stabilize the target's DOM, computed styles and geometry |
| OUTPUT_LIMIT | Reduce requested dimensions or input size |
| FORMAT_UNSUPPORTED | Select a supported native encoder; no automatic fallback |
| OUTPUT_MISMATCH | Treat inconsistent size/MIME/decode as a failure |
| ABORTED | Handle caller cancellation |
| TIMEOUT | Investigate slow preparation/resources/output before increasing timeout |
| BUSY | Await the previous operation, including cancellation-ignoring work |
| DISPOSED | Create a new snapshot |
| ENGINE_FAILED | Reproduce with a minimal static fixture |

CaptureError exposes code and prepare/capture/output stage without retaining
source DOM, full resource URLs, or an internal cause. When reporting a problem,
include package version/artifact hash, actual browser version, OS, DPR, sanitized
fixture/options, expected result, and code/stage. Keep credentials and user data
out of reports. See [browser support](08-browser-support.md).
