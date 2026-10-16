# Quick Start

[한국어](../ko/01-quick-start.md) · [Documentation index](../README.md)

Comins Capture 0.0.1 is an unpublished candidate. Use the reviewed tarball
provided by the maintainer; registry installation is not available yet.

```sh
npm install --ignore-scripts ./comins-capture-0.0.1.tgz
```

Use Node.js 24 or later and ESM. A browser bundler must resolve the package
import; a native browser script needs an application-owned import map.
All frameworks use the same package root. There are no framework subpath exports.

## Capture a static element

Render this HTML before running the module. Keep buttons and download links
outside the capture target.

```html
<section id="card" style="width:320px;padding:24px;background:#fff;color:#123">
  <h2>Static document</h2><p>Single PNG output</p>
</section>
<button id="capture-button" type="button">Capture PNG</button>
<a id="capture-download" hidden>Download PNG</a>
```

```js
import {capture, CaptureError} from 'comins-capture';

const target = document.querySelector('#card');
const button = document.querySelector('#capture-button');
const download = document.querySelector('#capture-download');
if (!(target instanceof HTMLElement) || !(button instanceof HTMLButtonElement) ||
    !(download instanceof HTMLAnchorElement)) throw new Error('Missing example elements');

let url;
let pending;
function clearDownload() {
  download.hidden = true;
  download.removeAttribute('href');
  if (url) URL.revokeObjectURL(url);
  url = undefined;
}
button.addEventListener('click', async () => {
  button.disabled = true;
  clearDownload();
  const controller = new AbortController();
  pending = controller;
  let snapshot;
  try {
    snapshot = await capture(target, {signal:controller.signal});
    const {value} = await snapshot.toBlob({format:'png', signal:controller.signal});
    if (controller.signal.aborted) return;
    url = URL.createObjectURL(value);
    download.href = url;
    download.download = 'capture.png';
    download.hidden = false;
  } catch (error) {
    if (error instanceof CaptureError) console.error(error.code, error.stage);
    else console.error('Capture failed');
  } finally {
    snapshot?.dispose();
    pending = undefined;
    button.disabled = false;
  }
});
window.addEventListener('pagehide', () => { pending?.abort(); clearDownload(); });
```

`toBlob()` returns `{value, meta}`, not a Blob alone. The application owns its
Blob URLs and must revoke them when replacing a result or removing the page.
For SPA unmount cleanup, use the [framework guide](03-frameworks.md).

## Run the repository Playground

```sh
git clone https://github.com/kim1124/comins-capture.git
cd comins-capture
npm ci --ignore-scripts
npm run verify
npm run dev
```

Open <http://127.0.0.1:6004>. Use `CAPTURE_PORT=6014 npm run dev` for another
port. The server has no HMR; rebuild and refresh after source changes.
See [output options](04-output-options.md), [resources](05-resources.md), and
[current browser evidence](08-browser-support.md) before integrating.
