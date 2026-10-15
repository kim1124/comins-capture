# SnapDOM 최소 확장 실증

후속: [2026-10-11 최종 SVG·출력 경계 실증](output-boundary-probe.md)에서 제한 도형 14건의 자원 치환·렌더·표시 기하·픽셀 비교를 완료했다. 아래 기록은 당시 clone-only 결과로 보존한다.

작업일: 2026-10-04 (Asia/Seoul). 기준 엔진: 설치된 SnapDOM 3.2.0. [앞선 clone-only 검증](engine-resource-boundary.md)에서 발생한 두 문제에 대한 후속 실증이다.

## 판단

**외부 엔진의 복제 기능을 유지하면서 두 문제를 제어할 수 있는 제한된 확장 지점을 확인했다.** Computer Use로 설치된 Chrome 154.0.8037.93과 native Safari 27.0.1에서 각각 14개, 총 28개 사례를 실행했고 기대 결과와 모두 일치했다. 그중 4개는 원본 엔진의 실패를 다시 확인한 대조군이며, 24개는 연구용 변경본의 사례다. 28개를 제품 계약 통과로 집계하지 않는다.

설치 엔진과 제품 src, package.json, lockfile은 변경하지 않았다. 연구용 복사본의 세 함수에서 다섯 지점을 변경했고 별도 resolver·복제 함수와 afterClone 오류 검사를 연결했다. 이 실험은 제품 fork 채택이나 정식 upstream API 확보를 뜻하지 않는다.

## 변경 범위와 원인

| 지점 | 연구용 변경 | 이유와 남는 범위 |
|---|---|---|
| 일반 복제 `Qt`의 얕은 복제 3곳 | custom tag를 일반 div로 대체한 뒤 엔진의 스타일·Shadow·자식 복제를 계속 사용 | 생성자 실행 방지. 숨김/placeholder/일반 경로에 적용. tag 의미와 출력 레이아웃 보존은 별도 검증 필요 |
| CSS 이미지 처리 `xe` 1곳 | 엔진 cache 조회·기본 fetch 전에 호출별 resolver로 데이터 URI 취득 | pseudo 배경·mask 처리. 전역 fetch나 opaque cache를 수정하지 않음 |
| pseudo 처리 `We` 1곳 | content URL 취득을 동일 resolver로 전달 | background 경로만 변경해서는 content URL이 누락됨 |
| 연구 plugin의 afterClone | 수집된 자원 오류·취소가 있으면 결과 반환 전 throw | 엔진이 내부 예외를 catch하므로 요청 차단만으로 완전성을 보장할 수 없음 |

`Qt`, `xe`, `We`는 고정 배포본의 식별자이며 공개 API가 아니다. `__probe`도 실험에서만 추가한 호출별 상태다. AST로 해당 함수 범위를 찾고 원본 SHA-256 및 교체 횟수가 맞을 때만 복사본을 생성한다. 원본 node_modules에는 쓰지 않는다. 해시 검사는 다른 엔진 버전에 자동 적용하는 방법이 아니라 잘못된 적용을 막는 제한이다.

`resolveNode`는 완성 subtree를 반환하는 계약이라 엔진의 자식 순회를 이어 쓰는 얕은 복제 대체점으로 충분하지 않다. 이번 실험은 엔진 내부에 그 대체점을 추가할 수 있는지 확인했다. 원본 요소에 style/속성을 임시 적용하는 방식은 사용하지 않았다.

## 실제 결과

다음 결과는 두 브라우저에서 동일했다. 요청 수는 arm 이후 로컬 시험 asset endpoint 장부이며, 엔진 완료 뒤 250ms까지 관찰했다.

| 사례 묶음 | 브라우저별 개수 | 결과 |
|---|---:|---|
| 원본 pseudo background 대조군 | 1 | 캡처 요청 1건 재현 |
| 원본 custom element 대조군 | 1 | 생성자 추가 실행 1회 재현 |
| 확장 background/content/mask 허용 | 3 | resolver 각 1회, 캡처 요청 0건, clone에 PNG 데이터 URI 존재 |
| 확장 background/content/mask 거부 | 3 | 요청 0건, `PROBE_RESOURCE_DENIED`, 결과 반환 없음 |
| resolver 예외 | 1 | 요청 0건, `PROBE_RESOURCE_DENIED`, 결과 반환 없음 |
| resolver 내부 취소 후 데이터 반환 | 1 | 요청 0건, `PROBE_ABORT`, 결과 반환 없음 |
| custom visible/hidden/slot/nested | 4 | 요청 0건, 생성자 추가 실행 0회, 일반/숨김/slot 1회·중첩 2회 대체 복제 |

24개 확장 사례에서 원본 outerHTML과 관찰한 light DOM mutation 기록은 변하지 않았다. 보이는 custom 사례의 Shadow 텍스트, slot 할당 텍스트, 중첩 텍스트는 clone에 남았다. MutationObserver는 Shadow 내부 상태까지 관찰하지 않으며 생성자 counter도 해당 fixture의 부작용만 확인한다.

모든 사례는 clone 단계에서 종료했고 render hook은 0회였다. resolver 허용값은 시험용으로 만든 2×2 PNG다. URL별 메모리 바이트 주입 지점의 검증이며, 실제 이미지 시각 일치 또는 제품 ResourceManifest 연결 검증은 아니다. 화면에 보이는 파란 영역도 원본 시험 DOM이며 캡처 결과 미리보기가 아니다.

## 확인된 잔여 문제

**허용된 pseudo 6건 모두 clone 또는 생성 CSS에 원격 URL 리터럴이 남았다.** 이번에는 뒤의 렌더링을 실행하지 않았다. 이 산출물을 그대로 직렬화·렌더하면 재요청 가능성이 있으므로 안전한 출력으로 반환할 수 없다. 이 미해결 상태도 회귀 검증에 고정했다.

- 생성 CSS를 정식으로 전달받고 모든 참조를 ResourceManifest의 검증된 자원으로 대체할 경계가 필요하다. 현재 `classCSS`는 공개 타입에서도 opaque cache 그룹에 있다.
- custom tag를 div로 바꾸면 tag selector, inline/block 기본 동작, 접근성/폼 의미가 달라질 수 있다. 텍스트 보존은 레이아웃·픽셀 보존 증거가 아니다. 닫힌 Shadow, customized built-in, custom 루트, placeholder, 타 문서 입력은 미검증이다.
- 일반 IMG·폰트·SVG·iframe·video 등 엔진의 다른 취득 경로는 이번 확장 대상이 아니다. 다중 CSS 레이어·image-set 선택·동시 캡처·공유 cache 격리도 미검증이다.
- 취소 사례는 resolver가 반환할 때 폐기되는지 확인했다. 끝나지 않는 resolver를 즉시 중단하거나 엔진 전체 작업이 배수되는지 입증하지 않았다.
- 전체 브라우저 네트워크, 모바일, 고해상도, 최종 SVG 검사, G1–G4 전체는 완료하지 않았다.

## 구현으로 이어갈 최소 범위

다음 검증 단위는 **검증된 자원 삽입 → 최종 SVG의 잔여 외부 참조 검사 → 원본과 출력의 기하·픽셀 비교**다. 시험 대상은 이번 pseudo 3종과 custom 4종으로 한정할 수 있다. 이를 통과해야 제품 어댑터 연결 판단이 가능하다.

제품 도입안에는 호출별 resource resolver, 얕은 clone factory, 실패 전파, 생성 CSS 전달이라는 네 계약이 필요하다. 이번 수정량이 작다고 전체 도입 비용이 작다고 추정하지 않는다. 실제 유지 비용은 버전별 호출 경로 재검토, 위 자원 종류별 회귀, surrogate 시각 호환성, 최종 SVG 검증에서 발생한다. 아직 일정·인원 추정치를 확정할 근거는 부족하다.

자체 엔진 개발로 전환할 근거는 추가되지 않았다. 외부 엔진 우선과 향후 교체 가능한 Comins 어댑터 방침을 유지한다. 제품 fork/patch 배포나 upstream 원격 제안 게시의 채택 결정은 별도이며 이번 검증에서 실행하지 않았다.

## 증거와 재현

- [원시 기록 28건·해시 집계](../output/research/engine-contract/2026-10-04-clone-extension/report.json)
- [Chrome 결과 화면](../output/playwright/clone-extension-chrome.jpg), [Safari 결과 화면](../output/playwright/clone-extension-safari.jpg)
- [복사본 생성기](../output/playwright/workbench/build-clone-extension.mjs), [연구용 확장 함수](../output/playwright/workbench/clone-extension-runtime.mjs), [실행 fixture](../output/playwright/workbench/clone-extension.mjs)
- [원본·변경본 출처/해시](../output/research/clone-extension-engine/provenance.json), [보존한 MIT LICENSE](../output/research/clone-extension-engine/LICENSE)
- 생성 명령: `node output/playwright/workbench/build-clone-extension.mjs`
- 시험 서버: `python3 output/playwright/workbench/clone-extension-server.py`, localhost 8845의 `/extension`
- 기록 검증: `npm run test:research`. 원본/변경본·라이선스·fixture·원시 기록·화면 40개 파일의 해시를 보존한다.

원시 기록 상위 `engine`은 기반 버전이고 `report.engineVariant`가 stock/research-extension을 구분한다. 정확한 변경본은 집계의 provenance와 candidateSHA256으로 식별한다. 연구용 변경본에는 출처·버전·수정 표시와 원문 LICENSE를 함께 보존하며 npm package files에는 포함하지 않는다.
