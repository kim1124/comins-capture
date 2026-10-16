# G1 준비 자원 경로 검증

작업일: 2026-10-04, Asia/Seoul. 상태: **Chrome·실제 Safari 각각 준비 자원 7개 사례 실행·증거 확인 완료. G1 전체는 보류**.

후속 [CSS·SVG 경계 검증](g1-css-svg-boundaries.md)에서 최종 8개 비교를 추가했다. CSS는 공개 hook 치환만으로 재요청이 사라지지 않았고 중첩 data SVG는 요청 0건이어도 내용이 누락됐다. 아래 준비된 합성 입력의 성공과 구분한다.

## 결론

SnapDOM 3.2.0에 메모리 자원만 전달한 제한된 실험에서 **Chrome 7개 사례 모두 기대 조건을 충족했다.** 준비 DOM 삽입 이후 알려진 합성 자원 endpoint의 추가 요청은 0건이었다. 이는 공개 hook과 준비된 입력을 사용하는 경로의 가능성 증거이며, 임의 DOM에 대한 G1 전체 통과는 아니다. 기존 기본 호출의 자원 재요청 실패와 G2~G4 상태도 유지한다. 제품 의존성·공개 API·지원 범위는 변경하지 않았다.

초기에는 네이티브 Computer Use의 잠금 오류를 보고 전체 브라우저 실행을 보류했다. 재확인 결과 **Mac 잠금 상태에서도 Chrome 확장 경로는 사용 가능**했고 이 경로로 실행을 완료했다. 실제 Safari의 네이티브 접근은 다시 같은 잠금·자동 해제 실패 오류를 반환했다. 이 제한은 Safari 제품 실패로 집계하지 않는다. 보안 설정을 변경하거나 별도 자동화 도구로 잠금을 우회하지 않았다.

이후 사용자가 잠금을 해제한 뒤 **19:06 KST에 실제 Safari 27.0.1(build 22625.1.29.11.28)**에서 동일 준비 자원 7개와 경계 8개를 실행했다. 네이티브 Computer Use로 조작했으며 WebKit 대체 실행이 아니다. 설치 정보·UA를 확인했고 공식 최신 버전은 재조회하지 않았다.

## Safari 비교 결과

준비 자원 7개 모두 기대 조건을 충족했다. 자원 추가 요청은 0건, cold/warm은 각각 PNG 두 번 출력·동일 결과·재출력 요청 증가 없음, missing/resolver-error/pre-abort는 엔진 미호출, late-abort/engine-error는 PNG 미출력이었다. 원본 outerHTML 보존과 준비 DOM 정리 결과도 Chrome과 같았다.

정상 PNG는 320×420이며 이미지 색상 표본이 Chrome과 일치했다. 텍스트 어두운 픽셀은 Safari 1,137개, Chrome 1,111개로 달랐다. 텍스트 존재를 확인한 것이며 글꼴의 픽셀 동등성을 입증하지 않는다. Safari 화면과 출력의 도형·텍스트를 시각 확인했으나 정밀 비교용 원본 스크린샷 파일은 보존하지 않았다.

[Safari 통합 증거](../output/research/engine-contract/2026-10-04-g1-safari/report.json)와 [파일 해시](../output/research/engine-contract/2026-10-04-g1-safari/sha256.json)에 준비 7건·경계 8건의 원본 JSON 15개와 PNG 10개를 연결했다. fixture와 엔진 해시를 대조했으며 기존 Chrome·탐색·준비 기록은 변경하지 않았다.

## 실제 Chrome 결과

실행 시각: 2026-10-04 18:53 KST. Chrome 설치 버전 `154.0.8037.93`을 다시 확인하고 브라우저 UA와 함께 기록했다. 공식 최신 버전 재조회는 하지 않았다. fixture `g1-1`과 엔진 bundle 해시는 준비 단계와 동일하다.

| 사례 | 결과 | 엔진 호출 | PNG 출력 횟수 | capture 자원 요청 | 합성 앱 요청 |
|---|---|---:|---:|---:|---:|
| cold | 성공 | 1 | 2 | 0 | 1 |
| warm | 성공 | 1 | 2 | 0 | 1 |
| missing | `RESOURCE_UNRESOLVED` | 0 | 0 | 0 | 0 |
| resolver-error | `RESOLVER_FAILED` | 0 | 0 | 0 | 0 |
| pre-abort | `CANCELLED` | 0 | 0 | 0 | 0 |
| late-abort | `CANCELLED` | 1 | 0 | 0 | 1 |
| engine-error | `ENGINE_FAILED` | 1 | 0 | 0 | 1 |

- 정상 2개 사례: 320×420 PNG 치수, 이미지 3개 슬롯의 파랑·노랑 표본 일치, 텍스트 어두운 픽셀 1,111개, 폰트 data URL 존재를 확인했다. 같은 캡처의 두 PNG는 바이트 기준 동일했고 재출력에서 요청은 늘지 않았다. 각 사례의 첫 PNG만 파일로 저장했다.
- 합성 앱 요청은 실제 엔진이 호출된 4개 사례에서 모두 성공했다. 네트워크 전체를 막아 0건을 만드는 검증 방식은 사용하지 않았다.
- 7개 모두 원본 outerHTML 보존·임시 DOM 잔존 0건을 확인했다. 준비 DOM을 만든 4개 사례는 정리 완료이며, 나머지는 준비 자체를 하지 않았다.
- clone hook 오류는 엔진 밖으로 전달되었고, late-abort 결과는 wrapper가 폐기하여 PNG를 출력하지 않았다. 내부 연산 즉시 중단의 증거는 아니다.
- Chrome 확장의 화면 캡처로 원본과 마지막 정상 PNG의 세 이미지·텍스트가 표시됨을 관찰했다. 원본은 마지막 오류 사례, PNG는 warm 사례의 동일 합성 내용이다. 이 화면은 별도 파일로 저장하지 않았고 정밀 픽셀 비교로 취급하지 않는다.

[통합 기록](../output/research/engine-contract/2026-10-04-g1-chrome/report.json)에 원본 UUID JSON 7건·PNG 2개의 경로를 연결했고, [SHA-256](../output/research/engine-contract/2026-10-04-g1-chrome/sha256.json)을 보존했다. 기존 준비 기록과 기준 측정 기록은 덮어쓰지 않았다. 원본의 `fixturePass:true`와 `status:unverified`는 제한된 사례 성공과 전체 채택 보류를 구분한다.

## 이번 실험의 질문과 구현

기존 [기준 측정](engine-adoption.md)에서는 캡처 전에 읽힌 이미지·배경·폰트를 다시 요청했다. 이번 실험은 소비자가 이미 해결해 제공한 자원 데이터를 사용하면 공개 hook만으로 재요청을 제거할 수 있는지 확인한다.

- 합성 이미지 SVG와 OFL 폰트를 localhost에서 미리 읽어 data URL로 보관한다. 이 준비 요청은 명시적으로 허용한 fixture 데이터 공급이며, 제품의 기본 네트워크 deny 구현이 아니다.
- 요청 장부를 capture 단계로 전환한 **뒤** 임시 DOM을 삽입한다. `<img>`, CSS background, 외부 SVG 파일을 이미지로 사용하는 슬롯, 단일 폰트 face를 포함한다.
- 임시 DOM에는 먼저 data URL을 설정한다. SnapDOM의 `embedFonts:false`와 공개 `afterClone`을 사용해 폰트 CSS를 넣는다. `afterRender`에서는 폰트 데이터 존재와 알려진 원격 자원 주소 잔존 여부만 기록한다.
- 전역 fetch patch·CSP 변경·opaque cache/nodeMap·타사 엔진 수정은 사용하지 않는다. 기존 서버에는 연구용 정적 경로 3개만 추가했다.
- 한 번의 캡처에서 PNG를 두 번 만들고, 요청 수·PNG 동일 여부·320×420 치수·이미지 슬롯별 색상 표본·텍스트 픽셀 존재를 기록한다. PNG와 JSON만 저장하며 폰트 원문·폰트가 포함된 SVG는 저장하지 않는다.

**중요한 한계:** 이는 알려진 합성 DOM을 직접 구성하는 실험이다. 임의 DOM을 복제하고 모든 CSS/URL을 수집·차단하는 제품 어댑터가 아니다. data URL 접두부 검사는 일반 SVG 안전성 검사가 아니며 SVG 내부 외부 참조는 이번 fixture에 없다. 서버 장부는 알려진 합성 endpoint 요청만 관찰한다. 폰트 데이터 존재·텍스트 픽셀 존재는 정확한 글꼴 렌더링 증명이 아니며 G3 face별 검증이 남는다.

## 사례 정의

| 사례 | 조건 | 기대 관찰 |
|---|---|---|
| cold | 원본·준비 DOM 모두 공급된 데이터 사용 | 준비 DOM 삽입 이후 자원 요청 0, PNG 2개 동일 |
| warm | 원본은 원격 합성 자원을 먼저 로드, 준비 DOM은 데이터 사용 | 기존 로드 여부와 무관하게 추가 자원 요청 0 |
| missing | 메모리 resolver 결과에서 이미지 누락 | 임시 DOM·엔진 호출 전에 `RESOURCE_UNRESOLVED` |
| resolver-error | resolver가 명시적으로 실패 | 엔진 호출 없이 실패 |
| pre-abort | resolver 시작 전 signal 취소 | resolver·임시 DOM·엔진 호출 없음 |
| late-abort | 공개 clone hook에서 signal 취소 | 엔진 반환 후 결과 폐기, PNG 출력 없음, 임시 DOM 정리 |
| engine-error | clone hook에 오류 주입 | 엔진의 오류 전달 여부와 임시 DOM 정리 확인 |

여기서 cold/warm은 **fixture의 원본 자원 로드 상태** 구분이다. 브라우저 전체 캐시·OS 캐시 초기화를 수행하지 않으므로 완전한 cold-start 성능 측정이 아니다. 사전 취소 사례도 소비자가 시험 데이터를 마련한 준비 요청은 이미 존재한다.

실제 엔진 호출이 발생한 사례에서는 `beforeClone`에서 별도의 합성 앱 요청을 시작한다. 앱 요청 성공 1건을 확인하고 자원 요청 수에서는 제외한다. 오류 hook을 엔진이 삼키면 해당 사례는 실패로 남긴다.

취소는 wrapper의 checkpoint 확인과 늦은 결과 폐기이다. SnapDOM 내부 연산의 즉시 중단·CPU 작업 취소를 보장하지 않는다. 원본 보존 검사는 합성 root의 outerHTML에 한정하며 폼·focus·selection·Shadow DOM 전체의 보존 검증은 아니다.

## 실행 방법과 증거

기존 workbench 서버와 충돌하지 않도록 이번 서버는 localhost `8785`/`8786` 포트를 사용한다. [서버](../output/playwright/workbench/server.py)에 기존 고정 SnapDOM bundle과 승인된 로컬 연구 폰트 경로를 전달한다.

```sh
python3 output/playwright/workbench/server.py \
  --snapdom <local-snapdom-3.2.0-bundle> \
  --font <local-LiberationSans-Regular.ttf> \
  --port 8785 --asset-port 8786
```

1. 서버가 실행 중인지 확인하고 Computer Use의 Chrome 확장 경로에서 `http://127.0.0.1:8785/g1`을 연다. 네이티브 앱 잠금 오류가 나더라도 확장 연결 상태는 별도로 확인한다.
2. 확인한 브라우저 버전을 입력하고 `전체 7개 사례 실행 및 저장`을 누른다.
3. 네이티브 접근이 가능한 상태에서 같은 절차를 실제 Safari에서 반복한다. WebKit 결과로 대체하지 않는다.
4. `output/playwright/workbench/results/<UUID>/`의 JSON·성공 시 PNG를 분석한다. 실패 기록을 수정하지 않는다.
5. 원본과 PNG를 비교하고 요청 장부·출력·정리를 확인한다. 준비된 입력의 성공과 일반 자원 수집의 잔여 공백을 구분해 G1 판정을 갱신한다.

새 결과에는 `fixtureRevision:g1-1`을 기록한다. fixture 조건이 만족되어도 `status:unverified`를 유지하도록 구성했다. 전체 채택 판정은 필수 범위와 증거를 검토한 후 별도로 수행한다.

## 준비 단계의 검증과 변경 파일

- 신규 수명주기 테스트 7개: 빈 구현에서 7개 실패 확인 후 최소 구현으로 7개 통과.
- 기존 항목을 포함한 Node 연구 테스트 **22개 통과**, Python 서버 테스트 **8개 통과**.
- 신규 서버의 기존 HTTP 경계·격리 검사 **12개**, 추가 경로 응답 **3개** 통과. 기존 HTTP 검증 스크립트의 포트만 실행 시 치환했다.
- 신규 JS 구문 검사와 서버 Python 컴파일 검사 통과.
- 기존 기준 보고서는 채택 checker에서 exit 1로 거부된다. 미통과 증거를 거부하는 기대 결과이다.
- 준비 단계에서는 브라우저 실행이 0건이었다. 이후 Chrome과 실제 Safari 각 7건은 별도 증거에 기록한다. 정식 보안 스캔·npm 제품 테스트는 아직 수행하지 않았다.

신규 파일: [연구 화면](../output/playwright/workbench/g1.html), [브라우저 probe](../output/playwright/workbench/g1.mjs), [수명주기](../output/playwright/workbench/g1-model.mjs), [회귀 테스트](../test/research/g1-lifecycle.test.mjs). 기존 서버에 정적 route만 추가하고 채택 문서·진행 장부에 현재 상태를 연결했다. 제품 소스와 엔진 배포본은 수정하지 않았다.

[준비 상태 기록 및 해시](../output/research/engine-contract/2026-10-04-g1-preparation/report.json)는 당시 상태로 유지한다. 이번 Chrome 실행 후에는 원본/복사본 일치, 기대 오류·호출 횟수·요청 장부·정리·PNG 헤더 치수·fixture/엔진 해시를 다시 대조했다. 코드·테스트 계약은 변경하지 않아 기존 Node/Python 전체 테스트를 반복하지 않았다.

다음 조치는 일반 입력의 자원 준비 계층 범위·비용 확정과 잔여 G1 검증이다. nested SVG 참조, CSS URL 수집, 허용 origin·credentials, 폰트 수집 범위를 보완해야 한다. 이번 두 브라우저의 제한된 사례 실행만으로 G1을 닫거나 Task 3~7 통합을 시작하지 않는다. Safari 타일 G4 문제는 이번에 재검증하지 않았다.
