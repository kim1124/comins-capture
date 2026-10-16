# 시작하기

0.0.1의 정적 HTML·단일 출력 계약을 설명합니다. Node.js 24 이상과 npm이 필요합니다. [지원 상태](support.md)의 실제 Chrome 검증 범위와 제한을 먼저 확인하십시오.

## 저장소에서 실행

저장소 루트에서 실행합니다.

```sh
npm ci --ignore-scripts
npm run verify
npm run dev
```

기본 주소는 `http://127.0.0.1:6004`입니다. 다른 포트를 사용하려면 `CAPTURE_PORT=6014 npm run dev`를 실행합니다. 소스 수정 후 다시 빌드해야 하며 현재 서버는 HMR을 제공하지 않습니다.

HTML을 file URL로 직접 여는 대신 개발 서버를 사용합니다.

## 샘플 출력

1. 파일 형식에서 PNG·JPEG·WebP·SVG를 선택합니다.
2. 원본·2배·사용자 크기·용지 규격을 선택합니다. 용지는 ISO/JIS와 PPI를 선택할 수 있습니다.
3. 이미지 만들기를 누르고 출력 크기와 미리보기를 확인합니다.
4. 파일 저장 링크로 브라우저에서 결과를 저장합니다.

고정 샘플을 공개 capture API로 캡처합니다. 임의 URL·사용자 HTML 입력은 없습니다. 자원 준비·검증 SVG·목표 크기 렌더링·snapshot 해제를 같은 제품 경로로 실행합니다. [Playground 설정 계약](playground.md)과 [공개 API](api.md)를 참고하십시오.

프레임워크 예제는 `npm run test:frameworks`로 실제 tarball 설치본을 구성합니다. [브라우저 소비 재현](frameworks.md)의 후속 절차가 필요합니다.

## 별도 애플리케이션에 설치

공개 registry에서 해당 버전이 확인되면 소비 애플리케이션에 정확한 버전을 설치합니다. 공개 전이거나 오프라인 후보를 확인하는 경우에는 유지관리자가 전달한 tarball의 실제 경로를 사용합니다.

```sh
npm install --ignore-scripts comins-capture@0.0.1
# 오프라인 후보: npm install --ignore-scripts ./comins-capture-0.0.1.tgz
```

ESM 패키지의 `comins-capture` 루트에서만 import합니다. 브라우저용 bundler가 이 import를 처리해야 합니다. native script에서 bare import를 바로 사용하지 않으며 저장소 Playground는 자체 import map을 제공합니다. 별도 framework adapter 패키지는 없습니다.

패키지 import와 `paperSize`는 DOM 없이 사용할 수 있습니다. `capture`는 클라이언트에서만 실행하고 대상은 현재 document에 연결된 크기가 있는 HTMLElement여야 합니다.

## 첫 캡처와 파일 저장

아래 HTML과 모듈 코드를 소비 애플리케이션에 배치합니다. 버튼과 다운로드 링크는 캡처 대상 밖에 둡니다.

```html
<section id="card" style="width:320px;padding:24px;background:#fff;color:#123">
  <h2>정적 문서</h2>
  <p>Comins Capture 단일 PNG 예제</p>
</section>
<button id="capture-button" type="button">PNG 만들기</button>
<a id="capture-download" hidden>PNG 저장</a>
```

```js
import {capture, CaptureError} from 'comins-capture';

const target = document.querySelector('#card');
const button = document.querySelector('#capture-button');
const download = document.querySelector('#capture-download');
if (!(target instanceof HTMLElement) || !(button instanceof HTMLButtonElement) ||
    !(download instanceof HTMLAnchorElement)) {
  throw new Error('예제 요소를 확인하십시오.');
}

let downloadUrl;
let pending;
const clearDownload = () => {
  download.hidden = true;
  download.removeAttribute('href');
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = undefined;
};

const createPng = async () => {
  button.disabled = true;
  clearDownload();
  const controller = new AbortController();
  pending = controller;
  let snapshot;
  try {
    snapshot = await capture(target, {
      signal:controller.signal,
      ready: async () => { await document.fonts.ready; },
    });
    const {value: blob} = await snapshot.toBlob({format:'png', signal:controller.signal});
    if (controller.signal.aborted) return;
    downloadUrl = URL.createObjectURL(blob);
    download.href = downloadUrl;
    download.download = 'capture.png';
    download.hidden = false;
  } catch (error) {
    if (error instanceof CaptureError) console.error(error.code, error.stage);
    else console.error('예제 실행에 실패했습니다.');
  } finally {
    snapshot?.dispose();
    pending = undefined;
    button.disabled = false;
  }
};

button.addEventListener('click', createPng);
window.addEventListener('pagehide', () => {
  pending?.abort();
  clearDownload();
});
```

모듈은 위 HTML이 렌더된 뒤 실행합니다. 정적 페이지 예제이며 SPA에서는 컴포넌트 해제 때 진행 중 capture를 AbortController로 취소하고 이벤트·Blob URL도 해제해야 합니다. [프레임워크 예제](frameworks.md)는 언마운트 중 결과 반영 방지까지 포함합니다.

snapshot.dispose는 내부 캡처 자원을 정리하며 소비자가 만든 Blob URL을 대신 해제하지 않습니다. 다운로드가 끝나기 전에 URL을 즉시 해제하지 말고 다음 출력·초기화·화면 해제 때 정리하십시오. `toBlob()` 반환값은 `{value, meta}`입니다.

이미지나 웹 폰트를 추가하면 기본 네트워크 deny가 적용됩니다. 대상이 화면에 보이는 것과 캡처용 바이트 확보는 별개입니다. [입력과 자원](dom-integration.md)의 resolver·허용 출처 설정을 사용합니다.

## 출력 크기 변경

같은 snapshot으로 출력을 바꿀 수 있으며 호출은 하나씩 await합니다.

```js
const scaled = await snapshot.toBlob({format:'png', size:{kind:'scale', value:2}});
const custom = await snapshot.toCanvas({size:{kind:'pixels', width:800, height:600}});
const paper = await snapshot.toBlob({format:'jpeg', size:{kind:'paper', name:'A4'}});
const svg = await snapshot.toSvg({size:{kind:'paper', name:'A4'}});
```

위 코드는 해제 전 snapshot을 전제로 한 옵션 발췌입니다. 기본 A4 래스터는2480×3508px, SVG는210×297mm입니다. `paperSize`의 `standard:'JIS'`와 출력 size의 `system:'jis'`는 서로 다른 옵션 이름입니다. 세부 배치·단위·한도는 [출력 옵션](output-options.md)을 따릅니다.

## 기초 함수 실행

```sh
node --input-type=module -e "import { paperSize } from './dist/index.js'; console.log(paperSize('A4'));"
```

예상 결과는 `{ width: 2480, height: 3508 }`입니다.

소비 애플리케이션에서는 `import {paperSize} from 'comins-capture'`를 사용합니다. 캡처 자체의 SSR 실행은 지원하지 않습니다.
