# Comins Capture

<a href="https://comins-website.vercel.app/ko/"><img src="https://comins-website.vercel.app/brand/comins-symbol.svg" width="64" height="64" alt="Comins 웹사이트" /></a>

[Comins 웹사이트](https://comins-website.vercel.app/ko/) · [Capture 소개](https://comins-website.vercel.app/ko/capture/) · [사용 가이드](docs/guide/README.md) · [공개 API](docs/guide/api.md)

브라우저에 연결된 정적 HTML 요소를 이미지·Canvas·foreignObject SVG로 출력하는 프레임워크 독립 모듈입니다. 하나의 TypeScript Core를 Vanilla JavaScript·React·Vue·Svelte에서 사용하며, 기본 크기·배율·사용자 크기와 ISO/JIS 용지 출력을 제공합니다.

**0.0.1 로컬 후보 · private:true · npm 미배포.** Comins 웹사이트의 Capture 소개는 개발 중 안내입니다. 현재 구현 계약은 이 저장소의 가이드를 기준으로 하며 공개 배포 준비 완료를 뜻하지 않습니다.

## 주요 기능

| 기능 | Playground 또는 API에서 확인할 내용 |
| --- | --- |
| 단일 이미지 출력 | PNG·JPEG·SVG를 선택하고 생성 결과를 저장합니다. WebP는 브라우저 네이티브 인코더 지원 시 제공합니다. |
| 배율과 크기 | CSS 원본1배·2배·캡처 당시 DPR·사용자 지정 크기를 비교합니다. |
| 용지 출력 | ISO/JIS A3·A4·A5·B3·B4·B5와 방향을 선택합니다. 래스터 기본300 PPI, SVG는mm입니다. |
| 배치와 배경 | contain·cover·stretch·배경을 비교합니다. API에서는 여백·정렬·JPEG/WebP 품질을 지정합니다. |
| 같은 snapshot 재사용 | 검증 SVG에서 PNG/JPEG/WebP·Canvas·SVG를 생성합니다. 출력마다 원본을 다시 캡처하지 않습니다. |
| 자원과 수명주기 | 기본 네트워크 deny, 명시 허용·resolver, 취소·timeout·dispose를 사용합니다. |

일반 정적 HTML이 지원 대상입니다. crop·타일·부분 성공·전체 페이지·Shadow DOM·폼/스크롤 상태·PDF는 제공하지 않습니다. 미지원 입력·자원·포맷·한도 초과는 오류로 종료합니다. [입력과 자원 정책](docs/guide/dom-integration.md)을 확인하십시오.

## 설치

현재 공개 registry 설치는 제공하지 않습니다. 유지관리자가 전달한 tarball을 소비 프로젝트에 복사한 뒤 설치합니다.

```sh
npm install --ignore-scripts ./comins-capture-0.0.1.tgz
```

Node.js 24 이상과 ESM을 사용합니다. 브라우저용 bundler 또는 import map이 패키지 루트 import를 처리해야 합니다. 프레임워크별 별도 adapter 패키지나 deep import는 제공하지 않습니다. [설치 및 첫 캡처](docs/guide/getting-started.md)에 전체 예제가 있습니다.

## 빠른 시작

렌더와 자원 준비가 끝난 클라이언트 이벤트에서 실행합니다. 버튼·입력·다운로드 링크는 캡처 대상 밖에 둡니다.

```js
import {capture} from 'comins-capture';

const target = document.querySelector('#card');
if (!(target instanceof HTMLElement)) throw new Error('캡처 대상을 확인하십시오.');
const snapshot = await capture(target);
try {
  const {value: blob, meta} = await snapshot.toBlob({
    format: 'png',
    size: {kind: 'paper', name: 'A4', ppi: 300},
    background: '#fff',
  });
  // blob과 실제 출력 크기 meta.width/meta.height를 사용합니다.
} finally {
  snapshot.dispose();
}
```

`toBlob()` 반환값은 `{value, meta}`입니다. 앱이 만든 Blob URL은 앱에서 해제해야 합니다. 이미지·웹 폰트가 있으면 resolver 또는 허용 출처가 필요할 수 있습니다. [파일 저장·해제 예제](docs/guide/getting-started.md)와 [자원 정책](docs/guide/dom-integration.md)을 따르십시오.

## 프레임워크 선택

| 환경 | 렌더와 정리 시점 | 가이드 |
| --- | --- | --- |
| Vanilla JavaScript | 연결된 HTMLElement를 전달하고 화면 해제 때 취소·정리 | [Vanilla](docs/guide/frameworks.md#vanilla-javascript) |
| React | ref·사용자 이벤트·effect cleanup, StrictMode setup마다 새 session | [React](docs/guide/frameworks.md#react) |
| Vue | ref·nextTick·onUnmounted | [Vue](docs/guide/frameworks.md#vue) |
| Svelte | bind:this·tick·onDestroy | [Svelte](docs/guide/frameworks.md#svelte) |

모든 환경에서 같은 `capture`를 사용합니다. 패키지 import와 용지 계산은 DOM 없이 가능하지만 캡처 자체는 클라이언트 전용입니다. 소비 예제의 session helper는 애플리케이션 코드이며 제품 export가 아닙니다.

## 가이드와 API

- [시작하기](docs/guide/getting-started.md) · [사용 가이드 목차](docs/guide/README.md)
- [공개 함수·타입·오류](docs/guide/api.md) · [출력 옵션](docs/guide/output-options.md)
- [입력·이미지·폰트](docs/guide/dom-integration.md) · [프레임워크 연동](docs/guide/frameworks.md)
- [Playground](docs/guide/playground.md) · [문제 해결](docs/guide/troubleshooting.md)
- [지원 상태](docs/guide/support.md) · [엔진과 출력 구조](docs/guide/architecture.md)

용지 계산은 동기·순수 함수입니다.

```js
import {paperSize} from 'comins-capture';
paperSize('A4'); // {width: 2480, height: 3508}, ISO·300 PPI
paperSize('B4', {standard: 'JIS', orientation: 'landscape'});
```

출력 size의 `system:'jis'`와 용지 함수의 `standard:'JIS'`는 서로 다른 옵션입니다. PPI는 픽셀 수 계산용이며 파일 DPI 메타데이터를 재작성하지 않습니다. SVG는 foreignObject를 포함하며 순수 벡터·디자인 도구 호환을 보증하지 않습니다.

## Playground 로컬 실행

저장소 루트에서 실행합니다.

```sh
npm ci --ignore-scripts
npm run verify
npm run dev
```

[로컬 Playground](http://127.0.0.1:6004)를 열고 형식·크기·배치를 변경한 뒤 이미지 만들기→파일 저장을 실행합니다. `CAPTURE_PORT`로 포트를 변경할 수 있습니다. 개발 서버는 HMR을 제공하지 않으므로 소스 변경 후 다시 빌드합니다. `node examples/geometry.mjs`는 DOM 없이 용지 계산을 실행합니다.

## 0.0.1 후보와 검증

현재 후보는 정적 HTMLElement의 단일 출력에 집중합니다. crop·타일·부분 성공 및 미완성 실험 경로는 제거했으며 후속 검토는 저장소 문서에 보존합니다.

2026-10-15 실제 Chrome154.0.8037.98·macOS·DPR2에서 제한된 정적 fixture의 기능15/15·자원/SVG15/15를 통과했습니다. 명세서64노드의 capture→PNG는10표본 p50 183.6ms·p95 198.9ms이며 반복30회 실패0을 확인했습니다. 0.0.1 후보 런타임은 해당 벤치마크 대상과 동일합니다. 문서 보완 뒤 기존 tarball은 현재 문서 전체를 포함하지 않습니다.

`npm run verify`는 타입·빌드·unit·consumer·라이선스를 확인합니다. `npm run test:frameworks`는 실제 tarball의 타입·SSR·소비 bundle을 구성하며 브라우저 실행 성공을 자동 판정하지 않습니다. `npm run test:research`는 보존된 연구 판정 도구를 검사합니다.

## 브라우저와 제한

Chrome 한정 기술 품질은 조건부 합격입니다. Safari는 알려진 그림자·clip 실패로 정식 지원에서 제외하며 Edge/Firefox·실제 모바일은 미검증입니다. 저사양·범용 CSS·장기 메모리·원본 화면과의 전체 픽셀 일치는 보증하지 않습니다. 단일 Canvas 한도는 한 변8192px·면적32,000,000px입니다.

JIS 공식 원문 대조·최종 공개 설정·Git revision 고정 및 배포 승인이 남아 있습니다. [지원 상태](docs/guide/support.md)에 실제 실행·재사용·미검증 범위를 구분합니다.

## 저장소 안내

저장소 checkout 전용 문서입니다. npm 패키지에는 포함하지 않습니다.

- [전체 문서 목차](docs/README.md) · [기여 안내](CONTRIBUTING.md)
- [저장소 구조·개발·검증](docs/development/repository-guide.md) · [출시 준비](docs/development/releasing.md)

Comins 사이트의 개발 중 안내와 현재 저장소 가이드를 구분하는 기준은 [사이트 연동](docs/guide/site-integration.md)을 따릅니다.

## 라이선스와 지원

[MIT](LICENSE) · [변경 이력](CHANGELOG.md) · [Comins 웹사이트](https://comins-website.vercel.app/ko/)

빌드는 고정 SnapDOM3.2.0 최소 수정본과 원문 라이선스·출처·수정 기록을 내부 엔진으로 생성합니다. 공개 타입에 엔진 타입을 노출하지 않습니다. [제3자 고지](THIRD_PARTY_NOTICES.md)를 참고하십시오.

패키지는 dist·README·LICENSE·THIRD_PARTY_NOTICES·docs/guide를 포함합니다. 연구 코드·검증 증거·개발 이월 기록·복구본은 배포 대상에서 제외합니다. 오류 보고 시 [문제 해결](docs/guide/troubleshooting.md)의 재현 정보 항목을 사용하십시오.
