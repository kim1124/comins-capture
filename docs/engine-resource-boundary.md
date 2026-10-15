# 외부 엔진 복제 재사용과 자원 요청 제어 경계

조사일: 2026-10-04 (Asia/Seoul). 기준: 현재 설치한 SnapDOM 3.2.0, 공식 npm에서 임시 디렉터리로 취득한 modern-screenshot 4.7.0, html-to-image 공식 main 소스. 제품 의존성·lockfile·공개 API는 변경하지 않았다.

## 현재 판단

**공개 `needs: 'clone'`만으로 무요청·무부작용 계약을 충족하지 못한다.** 설치된 Chrome 154.0.8037.93과 실제 Safari 27.0.1에서 각각 5개 사례를 실행했다. 두 브라우저 모두 pseudo 배경 이미지의 캡처 단계 요청 1건과 custom element 생성자 추가 실행 1회를 관찰했다.

일반 이미지·CSS 배경·폰트의 후속 삽입 단계는 건너뛰지만 복제 내부의 동작까지 막지는 못한다. 따라서 이 경로를 곧바로 production DOM preparer로 승격하지 않는다. 외부 엔진 우선 출시와 SnapDOM 조건부 채택은 유지한다. 준비 DOM 전체 자체 구현 또는 다른 엔진 채택으로 전환한 것은 아니다.

## SnapDOM 3.2.0 확인 사항

설치 배포본과 공개 타입을 직접 확인했다.

1. 공개 plugin의 `needs`를 clone으로 지정하면 `afterClone` 다음의 stage 검사에서 반환한다. 일반 image inlining, 원본 계산 스타일 기반 CSS 이미지 취득, 일반 font embedding은 그 뒤에 있어 이 경로에서는 실행하지 않는다.
2. `afterClone`의 `clone`은 공개 타입에 선언되어 있다. 이를 관찰/변환할 수 있다. `styleCache`/`nodeMap`은 opaque이므로 직접 수정하는 해결책은 제외한다. 생성 CSS인 `classCSS`도 타입상 내부 cache 그룹에 놓여 있으므로 안정된 자원 재사용 API로 의존하기 전에 계약 확인이 필요하다.
3. clone-only result는 렌더링 결과가 아니다. URL·기본 이미지 export를 사용할 수 없으며, 일반 capture 결과처럼 취급하면 안 된다. 안전한 자원 삽입·SVG 직렬화·render 연결 가능성은 후속 과제다.
4. 일반 clone 경로에는 원본 `cloneNode(false)`와 IMG 후처리가 존재한다. clone-only라고 브라우저의 암묵 로드나 custom constructor 실행까지 차단된다고 단정할 수 없다.
5. `resolveNode`는 완성된 노드를 반환하면 해당 subtree를 대체한다. 자원별 fetch hook이 아니며, 예외를 던져도 엔진이 경고 후 정상 복제로 계속하는 경로가 있다. 정책 거부를 이 hook의 throw에만 맡기지 않는다.
6. 기본 이미지·CSS·폰트 취득을 소비자의 ResourceManifest resolver로 대체하는 공개 callback은 확인한 옵션/타입에 없다. `fallbackURL`은 실패 후 이미지 대체용이다. 원본 변형·전역 fetch patch·opaque cache 조작을 적용하지 않았다.

공식 문서의 stage/plugin 계약: [Plugin spec](https://github.com/zumerlab/snapdom/blob/main/PLUGIN_SPEC.md). 설치 버전의 실제 분기는 별도로 배포본에서 확인했으므로 공식 main 문서만으로 3.2.0 동작을 추정하지 않았다.

## 대안 비교

| 후보 | 재사용 가능한 공개 경계 | 계약상 남는 문제 | 이번 판단 |
|---|---|---|---|
| SnapDOM 3.2.0 | clone-only stage, afterClone, resolveNode | 복제 도중 pseudo 요청·custom 생성 실측, 생성 CSS의 안정된 접근, 자원 삽입·최종 SVG verifier | 조건부 채택 유지, clone-only 단독 경로는 불충분 |
| modern-screenshot 4.7.0 | 이미지 fetchFn, 준비된 font.cssText, clone 후 callback | font/CSS는 fetchFn 밖, clone 후 callback 이전 URL·custom 생성, 오류 누락 경로 | 비교 후보 유지. 교체만으로 해결된다고 볼 수 없음 |
| html-to-image 공식 main | fetchRequestInit, 준비된 font CSS 등 | 자원별 resolver 대체점 확인 못함, 실패 시 빈 문자열/placeholder, clone 경계 | 이번 제어 요구에 뚜렷한 우위 확인 못함 |

modern-screenshot 배포본의 `contextFetch`는 requestType이 image일 때만 fetchFn을 호출한다. false 반환은 기본 fetch로 이어진다. 폰트나 import CSS는 별도 경로다. `font.cssText`에 준비한 CSS를 넣어 discovery를 피할 수 있으나, face별 수집·검증 책임은 남는다. CSS 자원 취득 실패를 catch한 뒤 원래 CSS를 반환하는 경로도 있으므로 Promise 성공을 완전한 캡처로 해석하지 않는다. [공식 fetch 소스](https://github.com/qq15725/modern-screenshot/blob/main/src/fetch.ts), [옵션](https://github.com/qq15725/modern-screenshot/blob/main/src/options.ts)

modern-screenshot은 일반 요소와 이미지를 먼저 복제하고 이후 callback/embedding을 수행한다. 따라서 이미지 fetch callback만으로 clone 생성 시점까지 제어됐다고 할 수 없다. 이 부분은 정적 위험 분석이며 이번 실제 브라우저 재현 결과가 아니다. [복제 소스](https://github.com/qq15725/modern-screenshot/blob/main/src/clone-node.ts), [이미지 복제](https://github.com/qq15725/modern-screenshot/blob/main/src/clone-image.ts)

html-to-image의 확인한 main 소스는 fetchRequestInit을 fetch에 전달하며, 실패 시 imagePlaceholder 또는 빈 문자열을 반환한다. AbortSignal이나 redirect 설정 전달과 자원별 바이트 주입/완전성 보장은 별개다. 이번에는 이 엔진의 고정 배포본·브라우저 비교를 추가하지 않았다. [공식 자원 취득 소스](https://github.com/bubkoo/html-to-image/blob/master/src/dataurl.ts)

## 실제 브라우저 실증

새 연구 fixture는 `needs: 'clone'`과 공개 afterClone만 사용한다. CSS 배경 / IMG / 웹폰트 / Shadow custom element / pseudo 이미지 5개를 독립 UUID로 실행하고 다음을 기록한다.

- clone 관찰 여부, result.needs, render hook 호출과 URL 접근 가능 여부.
- 캡처 전후 endpoint 요청 장부 및 원본 markup 변화.
- custom constructor 증가 횟수와 shadow 텍스트 존재.
- clone·생성 CSS의 원격 주소 리터럴 잔존. 리터럴 검사는 안전성 증명으로 사용하지 않는다.

사용자 잠금 해제 후 Computer Use로 Chrome과 native Safari에서 실행했다. 앞선 잠금·자동 승인 거부로 인한 미실행 상태는 해소됐다. **이번 결과는 새 UUID 10건이며, 이전 P0 26건과 별개다.** 실행 시각은 2026-10-04 20:59 KST다.

| 사례 | Chrome 캡처 단계 요청 | Safari 캡처 단계 요청 | 생성자 추가 실행 Chrome / Safari |
|---|---:|---:|---:|
| CSS 배경 | 0 | 0 | 0 / 0 |
| IMG | 0 | 0 | 0 / 0 |
| 웹폰트 | 0 | 0 | 0 / 0 |
| Shadow custom element | 0 | 0 | 1 / 1 |
| pseudo 배경 이미지 | 1 | 1 | 0 / 0 |

10건 모두 clone이 관찰됐고 `result.needs`는 clone, render hook은 0회, URL 접근은 불가였다. 원본 outerHTML은 동일했다. 그러나 custom constructor가 증가했으므로 markup 동일성을 애플리케이션 상태 보존으로 해석할 수 없다. custom clone에 Shadow 텍스트가 있어도 무부작용 통과는 아니다.

pseudo의 서버 장부에는 준비 단계 이미지 요청과 arm 이후 캡처 단계 이미지 요청이 각각 존재한다. Chrome은 11:59:04.340222Z / 11:59:04.354999Z, Safari는 11:59:50.740108Z / 11:59:50.773126Z다. 설치 배포본의 pseudo 처리 함수 `We`는 배경 이미지에 `xe`를 호출하고, `xe`는 내부 `dt(..., {as: 'dataURL', ...})`로 자원을 취득한다. 일반 embedding 이전에 복제 중 자원 취득 경로가 남는다는 소스 분석과 일치한다. 함수명은 해당 해시의 배포본 식별용이며 공개 API가 아니다.

요청 0건은 해당 fixture endpoint와 관찰 시간 내의 결과다. 전체 네트워크 무요청, 다른 CSS 구문, 모바일 지원, 출력 품질, 지연 요청 차단을 입증하지 않는다. clone-only는 raster/SVG 렌더를 수행하지 않았으며 고해상도·폰트 픽셀 정확도 검증도 아니다.

[원시 기록 10건과 SHA-256 집계](../output/research/engine-contract/2026-10-04-clone-boundary/report.json), [Chrome 화면](../output/playwright/clone-boundary-chrome.jpg), [Safari 화면](../output/playwright/clone-boundary-safari.jpg). 원시 기록·fixture·기존 server.py·설치 엔진·화면 18개 파일을 해시로 고정했다. 기록 상태의 `observed`는 관찰 완료를 뜻하며 계약 통과 표시가 아니다.

실행 페이지: 로컬 연구 서버의 `/clone-boundary`. 파일은 `output/playwright/workbench/clone-boundary.{html,mjs}`와 별도 `clone-boundary-server.py`다. 기존 해시로 고정한 server.py·이전 UUID 증거는 수정하지 않았다.

## 다음 실행 순서와 분기

후속 실행 결과: [최소 확장 실증](engine-extension-probe.md)에서 원본 대조군 4건과 연구 변경본 24건을 검증했다. 두 부작용의 제어 지점을 확인했지만 생성 CSS의 원격 주소 잔존과 최종 출력 검증은 남아 있다. 아래 순서는 해당 후속 검증의 출발점이며 제품 채택 승인을 뜻하지 않는다.

이번 5개 사례의 판정은 종료한다. 다음 작업은 외부 엔진을 유지하는 제한된 확장 지점을 구체화하는 것이다.

1. **복제 이전 자원 제어:** pseudo 배경·content·mask를 포함한 자원 취득이 ResourceManifest를 거치도록 resolver/deny 경계를 마련한다. afterClone에서 제거하는 방식은 이미 발생한 요청을 취소하지 못한다. 거부·실패 시 기본 fetch로 이어지지 않아야 한다.
2. **custom element 복제 제어:** 원본 클래스 생성자를 다시 실행하지 않고 계산 스타일과 열린 Shadow subtree를 보존할 수 있는지, 엔진 내부의 최소 변경 범위를 확인한다. `resolveNode`만으로 전체 subtree를 직접 복제하면 자체 복제 구현 비용이 돌아오므로 그 비용을 명시한다.
3. **유지보수 범위 판정:** 위 두 지점과 생성 CSS의 안정된 전달 계약을 기준으로 소규모 upstream 변경 제안의 파일·테스트·유지 비용을 산정한다. 비교 엔진은 같은 요구를 충족하는 구체적 경계가 확인될 때만 검토한다. 엔진 fork·새 의존성 채택·원격 제안 게시를 자동 실행하지 않는다.

이는 자체 캡처 엔진 개발 전환을 뜻하지 않는다. 미지원 입력을 조용히 누락하거나 요청 정책을 완화해 일반 지원을 선언하지 않는다. production preparer, SVG verifier 및 G1–G4 전체 완료는 여전히 별도 릴리즈 조건이다.

## 취득·검증 증거

- modern-screenshot 4.7.0: 공식 npm `npm pack --ignore-scripts`, MIT metadata와 배포본 LICENSE 확인. 런타임 dependencies 없음. 임시 위치에서 소스만 읽었고 제품에 복사·번들·설치하지 않았다.
- SnapDOM bundle SHA-256: `b95213d41b0b0a5bf66a042ec889672e2ff2aadd510b242362844ef5091b30b2`.
- SnapDOM 공개 타입 SHA-256: `955a3adb820fd140f78ebf30dbf9438d78551b9359f482e0a40c5cbbe76657fd`.
- modern-screenshot bundle SHA-256: `d6ce0ad42851eb3c6a56b89ab15839f5eaee512df6b27845c42e58d3605dd945`.
- 새 JS 구문·Python 컴파일 검사 통과. 기존 Python 서버 테스트 8개 및 새 localhost route/Host/경로 경계 4개 통과.
- 이번 브라우저 결과의 두 차단 사유와 18개 파일 해시를 research 회귀 검증에 추가했다. 전체 research 실행 결과는 작업 기록에 남긴다.
- 이번 제품 unit/build/consumer 재실행은 하지 않았다. 제품 소스 변경이 없으며 연구 소스/서버 검증과 구분한다.
- [앞선 DOM 준비 결과](dom-preparation-probe.md), [기존 CSS 요청 경계](g1-css-svg-boundaries.md).
