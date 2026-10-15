# SnapDOM 보완 구현 검토

작업·검증일: 2026-10-02 (Asia/Seoul). 대상: `@zumer/snapdom@3.2.0`, 연구용 workbench-2. 이전 [실제 브라우저 검증](browser-workbench.md)의 결과와 파일은 보존했다.

## 결론

**SnapDOM을 단일 엔진의 우선 후보로 유지하되, 제품 엔진 채택 완료로 처리하지 않는다.** 중첩 sticky 보정과 감지된 자원 누락 시 출력 중단은 제한된 fixture에서 구현 가능했다. Safari의 브라우저 기본 폼 외형은 계산 스타일 전체를 복사해도 차이가 남았다.

다중 엔진 제공이나 자동 전환을 추가할 근거는 이번 실험에서 확보하지 못했다. 현재 권고는 지원 범위·실패 계약을 먼저 명세하고, 그 계약을 충족하는 엔진 어댑터를 설계하는 것이다. 사용자 확정 사항으로 승격한 결정은 아니다.

## 변경 범위

`output/playwright/workbench/`의 연구 도구만 변경했다. npm 모듈·프레임워크 어댑터·패키지 설정·Git 초기화·원격 작업은 수행하지 않았다.

- `repair.mjs`: 복제본 계산 스타일 보정, sticky 측정·위치 보정, 자원 삽입 검사, PNG 출력 전 엄격 검사.
- `fixture.mjs`, `fixture.html`: 기본/보완 모드, CSS로 외형을 지정한 폼, 중첩 스크롤·복수 sticky, 부모 경계 sticky, 두 폰트 중 하나의 재요청 실패를 추가했다.
- `index.html`, `app.mjs`: 모드 선택과 명시적 캡처 중단 표시를 추가했다.
- `server.py`, `test_server.py`: 실행별 모드·두 번째 폰트 장애 처리, PNG 없는 실패 보고서 저장 검증을 추가했다.
- `assess.mjs`, `assess.test.mjs`, `repair.test.mjs`: 필요한 폰트별 판정과 출력 중단 회귀 검증을 추가했다.

신규 패키지를 설치하지 않았다. 기존 SnapDOM(MIT) 배포 파일과 Liberation Sans(OFL-1.1)를 외부 경로에서 읽었다. 엔진·폰트 파일을 작업 폴더에 복사하지 않았으며, 폰트가 삽입된 SVG도 저장하지 않았다.

## 실행 환경과 증거 수준

실제 설치 정보에서 Chrome 154.0.8037.93, Safari 27.0(build 22625.1.29.11.27)을 확인했다. 설치 버전 확인과 공식 최신 안정 버전 대조는 별개이며, 이번 추가 실험에서는 공식 배포 채널의 최신성을 다시 조회하지 않았다.

Chrome은 브라우저 UI, Safari는 macOS 앱 UI를 직접 조작했다. headless·Playwright WebKit으로 Safari 결과를 대체하지 않았다. 공통 출력은 640 × 420 PNG, CSS 크기 1배, `dpr: 1`, `scale: 1`이며 실제 장치 DPR은 2였다.

새 실행 기록 23건(Chrome 17, Safari 6)을 저장했다. 모든 기록에서 측정한 원본 상태는 유지되었다. 이는 전체 DOM·모든 포커스 상태·시스템 UI의 무변경 보증이 아니다. 원본 대상 바깥에 임시 측정 DOM을 삽입하고 정리하는 방식이다.

PNG가 생성된 것은 17건, 엄격 검사로 중단된 것은 6건이다. 중단된 6건에는 `RESOURCE_INCOMPLETE` 보고서만 있으며 PNG 파일이 없음을 확인했다. 기대한 오류 중단을 제품 결함과 구분한다. 시각 검토를 하지 않은 실행은 보고서의 `unreviewed`를 유지했다.

원본과 결과의 직접 화면 관찰을 수행했으나 원본 브라우저 스크린샷은 파일로 저장하지 않았다. 저장된 `capture.png`는 엔진 출력이며, 브라우저 원본 기준 이미지가 아니다. 시각적 일치 관찰을 픽셀 단위 동일성으로 해석하지 않는다.

## 항목별 결과

| 항목 | 확인한 결과 | 제품 적용 조건 |
|---|---|---|
| Safari 기본 폼 | 계산 스타일 전체 복사 후에도 input 테두리, checkbox 색상, select 배경 차이 관찰 | 네이티브 외형 보존 미해결. CSS 강제 변경을 원본 재현 성공으로 처리하지 않는다. |
| CSS로 외형을 지정한 폼 | Safari 보완 모드의 관찰 범위에서 배치·색·테두리 유지 | 별도 입력 fixture의 결과이며 기존 네이티브 폼을 자동 변환한 결과가 아니다. |
| 중첩 스크롤·복수 sticky | Chrome·Safari 보완 모드에서 머리글 3개와 스크롤 행 배치 유지 관찰 | 일반 DOM 대응과 추가 배치 유형 검증이 필요하다. |
| sticky 부모 끝 경계 | Safari에서 부모 경계에 의해 일부만 보이는 머리글 유지 관찰. Chrome도 보정 좌표 잔차 0 | 잔차는 복제본 위치 측정값이며 최종 PNG의 픽셀 오차가 아니다. |
| 폰트 2개 중 1개 누락 | 엔진 경고가 없어도 두 번째 폰트 삽입 실패 감지. Chrome·Safari 엄격 모드는 출력 중단 | 폰트 family별 합성 manifest 검사. weight·style·subset별 일반 검증은 미구현이다. |
| 이미지·폰트 장애 | Chrome의 이미지 CORS 미허용·CSP, 폰트 재요청 실패에서 출력 중단 | CSS background·pseudo-element·외부 SVG 등 모든 자원 유형을 검사하지 않는다. |
| 정상 자원 | Chrome CORS 허용 이미지·정상 폰트에서 PNG 생성 허용 | 출력 허용은 전체 시각적 일치 판정과 별개다. |

### 폼 보완의 한계

복제본의 input·textarea·select에 원본의 전체 계산 스타일을 복사했다. Safari 기본 컨트롤의 렌더링 차이는 남았다. 브라우저 고유 컨트롤 표시를 CSS 속성 복사만으로 해결할 수 있다는 가정은 이번 실험으로 지지되지 않는다.

`appearance: none`과 명시적 테두리·배경을 적용한 별도 fixture는 관찰 범위에서 재현되었다. 이를 사용자의 원본 DOM에 자동 적용하면 원래 화면을 바꾸므로 기본 해결책으로 채택하지 않는다. 초기 지원 범위에 네이티브 컨트롤 외형 제한을 명시하고, 감지 가능한 경우 진단을 제공하는 방안을 권고한다. 정확한 지원·오류 정책은 아직 확정하지 않았다.

### sticky 보완의 한계

실제 화면의 요소 좌표와 복제본 좌표를 비교하여 복제본에 `translate`를 적용했다. 중첩 fixture의 세 요소는 각각 Y 방향 64, 64, 96px, 부모 끝 경계는 148px 보정되었다. 저장된 모든 sticky 보완 실행에서 측정 잔차 X/Y는 0이었다.

현재는 합성 fixture의 고정 ID와 `data-repair`를 사용한다. 임의 페이지 요소 매핑, 가로 스크롤, RTL, 동적 레이아웃, 복잡한 clipping·stacking, 큰 문서 성능을 검증하지 않았다. 검사 범위의 transform·CSS zoom·세로 쓰기는 거부한다. 이 제한 밖의 모든 변형을 탐지한다고 보증하지 않는다.

SnapDOM의 `beforeRender` hook을 사용하되, 임시 측정에는 opaque 성격의 `ctx.baseCSS`, `ctx.classCSS`, `ctx.fontsCSS`도 참조한다. 공개 hook 사용만으로 버전 독립적인 어댑터가 된 것은 아니다. 제품 구현 전 안정적인 확장 계약 또는 고정 버전·회귀 검증 전략이 필요하다.

### 자원 검사에서 발견한 회귀

이전 판정은 폰트 data URI가 하나 이상 있으면 필수 폰트가 삽입되었다고 볼 수 있었다. 폰트 두 개 중 하나만 삽입된 Chrome 실행에서 이 검사가 잘못 통과했다. 해당 실행을 삭제·수정하지 않고 보존했다.

필요한 폰트 family별 `loaded`·`embedded` 검사를 판정에 반영한 후 Chrome 재실행과 Safari 실행에서 누락을 실패로 분류했다. 엄격 모드에서는 PNG 인코딩 호출 전에 중단한다. SVG 구성 자체가 전혀 실행되지 않는다는 의미는 아니다.

- [수정 전 잘못된 통과 기록](../output/playwright/workbench/results/cca7114a-9192-4a20-ac5d-67bc971e2aa3/report.json)
- [Chrome 수정 후 누락 판정](../output/playwright/workbench/results/15bf3ba2-8465-4868-80a6-87755610c7c8/report.json)
- [Chrome 수정 후 엄격 중단](../output/playwright/workbench/results/5577178d-c887-4de6-be13-fd245a01d8bd/report.json)
- [Safari 대체 폰트 관찰 및 누락 판정](../output/playwright/workbench/results/5798de60-9e4d-4eae-9e85-4131aff7496b/report.json)
- [Safari 엄격 중단](../output/playwright/workbench/results/31272e39-12bc-4f53-ad8f-366df1c5a9b8/report.json)

## 대표 시각 검토 기록

- [Safari 기본 폼 보완 후 차이](../output/playwright/workbench/results/d71d79fe-3f51-4627-b4e2-d25c2f321ce2/report.json)
- [Safari CSS 지정 폼](../output/playwright/workbench/results/8de46fdc-327f-46ec-b373-4e0e39faac39/report.json)
- [Chrome 중첩 sticky](../output/playwright/workbench/results/de8ebcdc-5fbf-47dc-820a-18adc82f304d/report.json)
- [Safari 중첩 sticky](../output/playwright/workbench/results/fe524b42-ffe1-4036-acba-d6f83374fb1f/report.json)
- [Safari 부모 끝 경계](../output/playwright/workbench/results/318960ac-c275-464a-b915-ae3a6a0f6082/report.json)

## 검증 결과

```sh
python3 -m unittest discover -s output/playwright/workbench -p 'test_*.py'
node --test output/playwright/workbench/assess.test.mjs output/playwright/workbench/repair.test.mjs
node --check output/playwright/workbench/app.mjs
node --check output/playwright/workbench/fixture.mjs
node --check output/playwright/workbench/repair.mjs
node --check output/playwright/workbench/assess.mjs
python3 -m py_compile output/playwright/workbench/server.py
python3 output/playwright/workbench/verify_http.py
```

Python 8개, JavaScript 7개 테스트 통과. HTTP 경계·장애 격리 12개 확인 통과. JavaScript 4개 모듈과 Python 문법 확인 통과. 저장된 23건의 원본 상태, 6건의 오류 시 PNG 부재, sticky 좌표 잔차도 재확인했다. 전체 npm 패키지 테스트나 정식 보안 스캔을 수행한 결과는 아니다.

## 남은 검증과 다음 단계

Edge·Firefox는 시스템 및 사용자 Applications 경로에서 설치된 앱을 찾지 못했다. 설치나 환경 변경은 수행하지 않았으며, 정식 브라우저 검증 확장은 미완료다. 실제 Android Chrome·iOS Safari도 미검증이다. 과거 번들 Firefox·WebKit 실험을 해당 검증으로 대체하지 않는다.

다음 산출물은 **초기 API·지원 범위 명세**를 권고한다. 기존 확정 사항을 유지하면서 다음 계약을 구체화한다.

1. 네이티브 폼·외부 자원·sticky의 지원 조건과 진단 범위. 화면과 다를 수 있는 조건을 숨기거나 원본 스타일을 자동 변경하지 않는다.
2. 캡처 준비 → 원본 상태 수집 → 엔진 복제·보완 → 자원 검사 → 출력 변환 → 정리의 책임과 취소·실패 계약.
3. 이미지·SVG·Canvas 반환 타입, CSS 크기·배율·용지 PPI·crop·고정 분할의 우선순위와 출력 한도.
4. 안정적인 엔진 어댑터 경계와 브라우저별 필수 통과 시나리오. 미검증 환경은 출시 검증 항목으로 남긴다.

이 명세와 남은 브라우저 검증 결과를 근거로 SnapDOM의 조건부 채택 여부를 결정한다. 이번 연구 코드 자체를 제품 구현으로 옮기거나 지원 완료로 선언하지 않는다.
