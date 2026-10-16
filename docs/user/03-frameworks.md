# Framework Integration

[한국어](../ko/03-frameworks.md) · [Documentation index](../README.md)

Vanilla, React, Vue, and Svelte import `capture` from `comins-capture`.
There are no framework adapters, hooks, actions, or optional framework peers
in the package. The application supplies its own framework runtime.

| Framework | Render readiness | Cleanup |
| --- | --- | --- |
| Vanilla JavaScript | Connected HTMLElement after rendering | Abort active work, dispose snapshot, revoke application URLs |
| React | ref and user event after commit | Effect-owned session; fresh owner for each StrictMode effect setup |
| Vue | ref after `nextTick()` | `onUnmounted` aborts and releases the session |
| Svelte | `bind:this` after `tick()` | `onDestroy` aborts and releases the session |

## Vanilla JavaScript

Use the complete [quick-start example](01-quick-start.md). In a mounted
application, return a cleanup function that aborts active capture, unregisters
listeners, disposes the snapshot, and revokes application-owned Blob URLs.

## React

Store the target in a ref. Call capture from a user event after the target is
mounted. Keep the button outside the target. Create a new lifecycle owner in
each effect setup, and abort it in cleanup. Do not reuse a disposed owner during
StrictMode's setup → cleanup → setup, or update state after unmounting.

## Vue

Use a template ref and wait for `nextTick()` before capture. The same wait can
be supplied through `ready`. Abort and release resources in `onUnmounted`,
and prevent results from changing reactive state after teardown.

## Svelte

Use `bind:this` to obtain the target and await `tick()` before passing it to
capture. Cleanup in `onDestroy` must abort work and release snapshot/URL
ownership. There is no `comins-capture/svelte` export.

## Repository examples and checks

The checkout contains `examples/frameworks/vanilla.mjs`, `react.jsx`, `vue.mjs`,
`SvelteCapture.svelte`, and a shared `session.mjs`. The session helper is example
code, not a package export. Read it when adopting the same ownership pattern.

```sh
npm run test:frameworks
node scripts/framework-server.mjs output/framework-consumer/<run-id>
```

The first command installs a packed candidate in a separate consumer and checks
types, bundles, and DOM-free React/Vue/Svelte SSR imports. Browser execution is
a separate step in the reported local page, usually port 6005. Import-safe SSR
does not mean server-side capture is supported.

The post-cleanup four-framework fixture passed in actual Chrome UA 154 on
2026-10-15. Its exact patch version was not identified by that UA. Native Safari
was not rerun for the cleaned candidate and remains excluded due to known
shadow/clip failures. See [browser evidence](08-browser-support.md).
