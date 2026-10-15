# DOM 준비 계층 P0 결과

검증일: 2026-10-04 (Asia/Seoul). SnapDOM 3.2.0. 설치 앱 메타데이터에서 Chrome 154.0.8037.93·Safari 27.0.1을 재확인했다. Chrome은 확장 Computer Use, Safari는 네이티브 앱 Computer Use로 실행했다.

## 결론

읽기 전용으로 실제 원본을 관찰하고, 해결된 PNG 자원만 별도 문서에 넣어 외부 엔진에 전달하는 제한 경로는 두 브라우저에서 동작했다. 그러나 이를 범용 제품 준비 계층으로 승격할 근거는 부족하다. Chrome의 소수 flex 기하 차이, pseudo·SVG·Shadow/custom·폰트 지원 및 최종 SVG 검증이 남아 있다. 공개 capture는 계속 미노출이다.

**외부 엔진으로 첫 릴리즈를 완성한다는 우선순위는 유지한다.** 이번 프로토타입을 일반 CSS·pseudo·Shadow 복제기로 확대하지 않는다. 엔진 내부의 복제 기능을 재사용하면서 자원 취득을 통제할 수 있는 경계가 다음 구현 판단의 핵심이다. 자체 엔진 개발로 전환하지 않는다.

## 구현한 경로

원본 요소/텍스트·계산 스타일·상대 기하 관찰 → ResourceManifest → 기존 제품 `resolveResources`/`createOperation` → PNG 검증 → 스크립트·외부 요청을 제한한 별도 iframe에 허용 요소 생성 → 원본/준비 기하 비교 → SnapDOM → 이미지 표본·출력 크기·SVG 속성 목록 확인 → 정리.

- 원본 `cloneNode(true)`·원본 marker·원본 style 변경을 하지 않는다. class/id/임의 속성을 준비 문서로 복사하지 않는다.
- CSS 이미지는 계산된 단일 `url()`만 처리한다. escape를 토큰 단위로 읽고 다른 문법은 거부한다. 일반 CSS 파서가 아니다.
- img와 CSS 배경이 같은 URL을 사용하는 사례는 manifest 1개·resolver 1회로 두 곳에 삽입한다. 선택된 currentSrc를 읽지만 반응형 srcset 전체 행렬을 검증한 것은 아니다.
- PNG는 MIME·서명·decode를 확인하고 data URL로 적용한다. 원본 fixture 이미지의 SVG→PNG 변환은 캡처 전 앱이 제공한 합성 자원이다. 일반 SVG 자원 처리 구현으로 계산하지 않는다.
- 폼 값·focus·선택 범위·scroll·원본 markup·custom 생성 횟수는 fixture에서 전후 비교한다. 모든 원본 애플리케이션 상태 보존을 증명하지 않는다.
- 검사/준비의 노드 매핑은 Comins 소유이며 외부 엔진 내부 객체에 의존하지 않는다. 이 프로토타입은 제품 기본 stages로 설치되지 않았다.

## 브라우저 결과

최종 revision `preparation-2`: **26건**. 초기 revision 20건도 별도 UUID로 보존했다.

| 사례 | Chrome | 실제 Safari | 확인 범위 |
|---|---|---|---|
| img + CSS 배경 | 제한 경로 통과 | 제한 경로 통과 | 자원 공유, 4개 RGBA 표본, 두 번 출력 PNG 일치 |
| 상위 selector + CSS 변수 | 제한 경로 통과 | 제한 경로 통과 | 상대 기하·출력 크기, 폰트 픽셀 판정 제외 |
| 상대 크기 flex | **기하 불일치** | 제한 경로 통과 | Chrome 엔진 호출 전 중단 |
| 정수 크기 flex | 제한 경로 통과 | 제한 경로 통과 | 오차 허용 없이 동일 |
| grid | 제한 경로 통과 | 제한 경로 통과 | 상대 기하·출력 크기 |
| 100 / 1,000 자식 요소 | 각 통과 | 각 통과 | root 포함 101/1,001개 기하 비교 |
| pseudo / inline 중첩 SVG / Shadow+custom | 각 명시 미지원 | 각 명시 미지원 | 준비·엔진 호출 전 거부, 지원 완료 아님 |
| 소비자가 원본 변경 | 감지 | 감지 | SOURCE_CHANGED 대조군 |
| resolver 자원 누락 | 차단 | 차단 | prepare 0·engine 0 |
| resolver 반환 직전 취소 | 차단 | 차단 | prepare 0·engine 0 |

26건 모두 관찰 endpoint의 capture 단계 요청 0건, 준비 iframe 잔존 0개, custom 생성 횟수 변화 0회였다. 원본 변경 대조군 2건을 제외한 24건에서 기록한 원본 상태가 유지됐다. 이는 네트워크 계측 endpoint 밖의 모든 요청이 없었다는 주장이 아니다.

Chrome flex에서 원본 width `179.1953125`, 계산 스타일 문자열 `179.195px`, 준비 width `179.1875`를 기록했다. 너비 차이가 뒤 형제의 x 위치에도 전파됐다. 초기/후속 실행 모두 재현됐다. 임의 epsilon으로 통과시키지 않았다. 이 수치는 브라우저 레이아웃 재계산·직렬화 정밀도 문제의 근거이며, 모든 유사 차이의 원인까지 확정하지 않는다.

## 중복 처리 비용

단일 실행의 관찰값이며 성능 보장이나 브라우저 간 순위가 아니다. 검사 시간에는 연구용 로컬 요청 경계와 코드 실행이 포함되고, 브라우저/GPU 전체 메모리는 계측하지 않았다.

| 브라우저 | 자식 수 | 검사 ms | 준비 ms | 엔진·Canvas ms | 계산 스타일 조회 | 보관 스타일 문자열 code units |
|---|---:|---:|---:|---:|---:|---:|
| Chrome | 100 | 7.3 | 8.4 | 53.6 | 303 | 166,476 |
| Chrome | 1,000 | 52.0 | 57.4 | 119.9 | 3,003 | 1,649,227 |
| Safari | 100 | 4 | 3 | 21 | 303 | 166,930 |
| Safari | 1,000 | 13 | 16 | 148 | 3,003 | 1,653,641 |

원본 읽기/별도 노드·스타일 저장 뒤 엔진이 다시 복제한다. 위 수치는 준비 계층의 중복 비용이 존재함을 보여준다. 1,000개 단순 노드의 성공으로 긴 문서·대형 Canvas·메모리 상한을 보장하지 않는다.

## SVG 검증과 남은 조건

생성 SVG에서 이벤트 속성·HTTP(S) href/src 속성은 관찰되지 않았다. **이는 SVG sanitizer가 아니다.** CSS 안의 URL, 중첩 문서, 활성 SVG 문서로 열었을 때의 동작, 실제 font face별 삽입은 검증하지 않았다. `svgSafeForActiveDocument:false`를 모든 보고서에 저장했다.

inline 중첩 SVG 요소를 미지원으로 거부한 결과와, 원격 참조를 가진 data SVG 바이트를 resolver에 넣어 거부하는 테스트는 다르다. 후자는 이번 브라우저 사례에 포함되지 않았다. 지연 resolver·엔진 실행 중 취소의 전체 브라우저 보장도 이번 조기 취소 사례로 대체하지 않는다.

G1–G4 전체 통과, 모바일·Firefox·Edge, 일반 폰트/폼/스크롤 캡처, public capture/snapshot, 고해상도 출력은 이 결과에서 완료로 바꾸지 않는다.

## 다음 구현 경계

1. 이 P0의 일반 복제 확대는 멈추고, 외부 엔진의 자원 취득 직전 개입 지점·안전한 복제 재사용 가능성을 좁혀 확인한다. 기존 SnapDOM hook 시험에서 원본 CSS 요청을 막지 못한 증거와 함께 판단한다.
2. 공개 API/engine adapter/ResourceManifest 계약을 유지한 채, 같은 자원 정책을 충족할 대안 외부 엔진의 통합 비용을 비교한다. 후보 변경·새 의존성 도입은 별도 판단이며 이번 작업에서는 수행하지 않았다.
3. 재사용 경계가 결정된 후 일반 자원 수집·font face·최종 SVG verifier를 제품 단계로 연결한다. 현재 제한 probe를 public capture로 바로 노출하지 않는다.

## 증거와 검증

- [최종 26건·초기 20건·77개 SHA-256](../output/research/engine-contract/2026-10-04-dom-preparation/report.json)
- [Chrome 화면](../output/playwright/preparation-chrome.jpg), [Safari 화면](../output/playwright/preparation-safari.jpg)
- [작업 기록](worklogs/2026-10-04-dom-preparation.md), [준비 계층 계획](superpowers/plans/2026-10-04-resource-preparation.md)
- research 모델 테스트 3건, 증거/해시 테스트 2건. 제품 코드는 이번에 변경하지 않았다.
- 정식 Git diff 보안 스캔은 최초 HEAD 부재로 계속 미실행이다. 로컬 코드 리뷰를 해당 스캔으로 대체했다고 주장하지 않는다.
