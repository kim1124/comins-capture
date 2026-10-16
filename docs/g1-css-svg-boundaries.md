# G1 CSS·SVG 자원 경계 검증

검증일: 2026-10-04, Asia/Seoul. SnapDOM 3.2.0 / Chrome 154.0.8037.93 / Computer Use Chrome 확장. **G1 전체 판정은 미검증 상태를 유지한다.**

19:06 KST 후속으로 실제 Safari 27.0.1(build 22625.1.29.11.28)에서 동일 최종 8개를 실행했다. **8개 모두 아래 Chrome의 요청 수·내용 표본 판정과 같았다.** 잠금 해제 후 네이티브 Computer Use로 수행했다.

## 결론

**원본 DOM을 엔진에 넘긴 뒤 복제본의 주소만 교체하는 방식은 CSS 배경 요청을 통제하기에 부족하다.** `afterClone`과 `resolveNode` 두 경로 모두 추가 요청 1건이 남았다. 고정 bundle에서 hook 이후 원본의 계산 스타일로 CSS 배경 자원을 처리하는 경로를 확인했다.

반면 엔진 입력 자체를 data URL로 준비한 CSS 배경은 요청 0건과 내용 표본 일치를 확인했다. 앞선 [준비 자원 실험](g1-resource-control.md)과 일치한다. 외부 엔진 기반 제품 완성 방향은 유지하되, Comins의 준비 책임을 최종 SVG 정제나 복제본 속성 변경으로 축소할 수 없다.

제품 어댑터·범용 DOM 복제기는 구현하지 않았다. 엔진 fork·전역 fetch patch·opaque 자료의 런타임 읽기/변경도 하지 않았다.

## 최종 8개 사례

19:00 KST 실행한 `g1-edges-2` 결과다. 앞선 `g1-edges-1` 탐색 7건도 별도 보존했다. 반복 기록을 독립 기능 15개로 계산하지 않는다.

| 사례 | capture 자원 요청 | 의도한 이미지 표본 | 관찰 |
|---|---:|---|---|
| CSS 배경 직접 캡처 | 1 | 일치 | 기본 호출 재요청 |
| CSS `afterClone` 치환 | 1 | 일치 | 복제본 style 교체만으로 요청 제거 실패 |
| CSS `resolveNode` 대체 노드 | 1 | 일치 | 공개 대체 노드 경로도 요청 제거 실패 |
| CSS를 data URL 입력으로 준비 | 0 | 일치 | 제한된 준비 입력 성공 |
| inline SVG 외부 `<image>` 직접 캡처 | 1 | 일치 | 기본 호출 재요청 |
| inline SVG의 href를 `afterClone`에서 치환 | 0 | 일치 | 이 단순 SVG 구조에서는 치환 성공 |
| 외부 `<image>`를 포함한 data SVG | 0 | 불일치 | PNG 생성 성공, 이미지 내용 누락 |
| 내부 `<image>`까지 data URL로 해결 | 0 | 일치 | 내부 자원 해결 후 표본 일치 |

요청/내용 기준 실패 관찰 5개와 제한된 일치 3개이다. 직접 호출 등 대조군을 의도적으로 포함했으므로 제품 결함 5건이나 연구 도구의 단위 테스트 실패로 해석하지 않는다.

8개 모두 256×128 PNG를 저장했다. 원본 outerHTML 보존·준비 DOM 잔존 0건·합성 앱 요청 성공 1건을 각 사례에서 확인했다. 내용 비교는 알려진 파랑·노랑 위치의 RGBA 표본이며 정밀 시각 동등성 검증은 아니다.

## CSS 원인 분석

CSS 두 hook 사례 모두 `afterClone` 진입 시 자원 요청이 0건이었고 출력 완료 후에는 1건이었다. `resolveNode` 사례의 실제 대체 노드 반환도 기록했다.

동일 해시의 고정 bundle 정적 분석에서 다음 흐름을 확인했다. 함수명은 minified 배포본의 분석 식별자이며 제품에서 의존할 API가 아니다.

1. `resolveNode`의 대체 노드에도 원본 기반 스타일 적용 함수 `pt`가 호출된다. 그 내부 `ll`은 원본 계산 스타일을 대체 노드에 적용한다.
2. `afterClone` 이후 `Xn`이 원본/복제본 대응을 순회한다.
3. `Zf`는 원본에 대한 style cache 또는 계산 스타일에서 `background-image` 등을 가져와 자원을 해결하고 복제본에 반영한다.

이는 런타임 요청 시점과 일치한다. 모든 공개 옵션 조합이 불가능하다는 증명은 아니다. 원본 스타일을 잠시 바꾸거나 내부 nodeMap/styleCache를 수정해 통과시키지 않았다.

## 요청 0건과 자원 완전성의 차이

외부 이미지를 참조하는 data SVG는 추가 요청 없이 PNG 생성에 성공했지만, Chrome PNG에는 깨진 이미지 표시와 흰 표본이 나타났다. Safari PNG는 빈 흰 이미지였다. 두 브라우저 모두 내부 이미지까지 data URL로 준비한 대조군은 정상 도형 표본을 반환했다.

**원본에서는 정상인데 엔진만 누락시켰다는 증거는 아니다.** 원본 화면과 픽셀 동등성을 측정하지 않았으며 입력 자체의 누락 가능성도 포함한다. 입증한 사실은 PNG 생성·요청 0건만으로 필요한 자원이 해결됐다고 보장할 수 없다는 것이다.

전 사례의 `remoteReferenceInSvg:false` 역시 주소의 리터럴 존재만 검사한 값이다. base64 data SVG 내부 주소를 재귀 검사하지 않으므로 안전성 판단에 사용할 수 없다.

## 증거와 검증

- [통합 기록](../output/research/engine-contract/2026-10-04-g1-edges/report.json): 최종 8건·탐색 7건의 JSON/PNG 경로, 정적 분석 위치, 최종 fixture/엔진 해시.
- [보존 파일 해시](../output/research/engine-contract/2026-10-04-g1-edges/sha256.json): 원본 변경 없이 JSON 15건·PNG 15건을 복사했다. 최종 fixture 해시는 `g1-edges-2`에 대응하며 탐색판 파일 해시를 사후 생성하지 않았다.
- 요청 0건+내용 누락, 내용 일치+요청 발생을 잘못 성공 처리하지 않는 테스트 3개의 실패→통과를 확인했다.
- 전체 Node 연구 테스트 **25개**, Python **8개**, HTTP 경계 **12개**·신규 경로 **3개** 통과. JS 구문·Python 컴파일 검사 통과.
- 요청 장부 일치·hook 시점·앱 요청·원본 보존·정리·PNG 헤더 치수를 대조했다. 누락/해결 PNG를 직접 열어 차이도 확인했다.
- 초기 Safari는 잠금 오류로 미실행이었으나, 잠금 해제 후 동일 8개 실행을 완료했다. [Safari 통합 기록](../output/research/engine-contract/2026-10-04-g1-safari/report.json)에서 준비 자원 7개와 함께 총 15건·PNG 10개를 확인할 수 있다.
- 정식 보안 스캔·npm 제품 테스트·원격 쓰기·배포는 미실행. 제품 의존성 추가 없음.

변경 파일: 연구용 [화면](../output/playwright/workbench/g1-edges.html)·[probe](../output/playwright/workbench/g1-edges.mjs)·[판정](../output/playwright/workbench/g1-edges-model.mjs)·[테스트](../test/research/g1-edges.test.mjs) 추가, localhost 서버에 정적 route 3개 추가, 문서·진행 장부 갱신. 타사 코드·폰트는 복사하지 않았다.

Safari 실행 시 probe·테스트 코드는 변경하지 않았다. 새 증거의 요청 장부·PNG 치수·원본 보존·정리·hook 시점·Chrome 대응 필드를 다시 검증했으며 기존 전체 테스트를 반복하지 않았다. **기록 메타데이터 한계:** `g1-edges-2`의 원본 `method` 문자열은 Chrome extension으로 고정되어 있다. Safari 실행 원본은 그대로 보존하고 통합 보고서에 실제 방법을 `Computer Use native Safari`로 정정 기록했다. UA·수동 버전·네이티브 조작 기록으로 실행 브라우저를 확인한다. 이는 판정 로직의 변경이 아니며 차기 probe에서 해당 표시를 일반화해야 한다.

## 다음 조치

1. 자원 준비 계층의 책임·추정 공수는 [상세 계획](superpowers/plans/2026-10-04-resource-preparation.md)에 정리했다. 다음은 P0-A manifest 해결 순서와 P0-B 실제 원본→준비 DOM 검증이다. CSS background 외의 pseudo/content/mask/font/CSS 접근 불가와 중첩 data SVG를 구분하며, 단순 정규식을 범용 수집기로 확장하지 않는다.
2. 허용 origin·credentials·redirect·resolver 취소를 별도 격리 fixture로 확인한다. 이번 same-origin 실험의 검증 범위가 아니다.
3. 자원 준비 방식을 구체화한 뒤 Chrome·Safari에서 새 경로를 함께 검증한다. 기존 Safari G4 타일 문제는 별도 단계에서 다룬다.

준비 DOM 구성에 DOM 복제·스타일 수집의 핵심 경로 재구현이 크게 필요하면 [전환 계획의 중단 기준](superpowers/plans/2026-10-04-engine-transition.md)에 따라 비용과 대안을 먼저 재판단한다. 현재 결과만으로 자체 엔진 선행 개발로 전환하거나 G1을 닫지 않는다.
