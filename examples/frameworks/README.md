# 공개 API 소비 예제

모든 예제는 `comins-capture` 루트의 capture/CaptureError만 import합니다. 공통 session helper는 캡처·출력·Blob URL의 수명주기를 관리하는 애플리케이션 코드이며 제품 export가 아닙니다.

- vanilla.mjs: mountExample(host, props) → cleanup 함수
- react.jsx: CaptureExample, React StrictMode 대응
- vue.mjs: CaptureExample, nextTick/onUnmounted
- SvelteCapture.svelte: tick/bind:this/onDestroy
- session.mjs: run(target, ready), snapshot/closed, dispose()

전체 실행 환경은 test/frameworks의 고정 package/lockfile과 scripts/framework-consumer.mjs가 구성합니다. 루트에서 `npm run test:frameworks` 후 표시된 run을 framework-server.mjs에 전달하고 localhost:6005의 버튼을 실행합니다. 상세 절차와 검증 범위는 docs/guide/frameworks.md를 참고하십시오.
