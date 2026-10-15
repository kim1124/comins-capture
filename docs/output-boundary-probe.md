# 최종 SVG·출력 경계 실증

작업일: 2026-10-11 (Asia/Seoul). [최소 엔진 확장 실증](engine-extension-probe.md)의 후속이다. 같은 SnapDOM 3.2.0 연구용 변경본을 수정 없이 사용했다.

## 결론

**제한된 도형 fixture에서 자원을 내장한 최종 SVG의 렌더링 경로를 확인했다.** 설치된 Chrome 154.0.8037.98과 native Safari 27.0.1을 Computer Use로 조작해 7종씩, 총 14건이 최종 기대와 일치했다. 외부 엔진 우선 방침을 유지할 근거이며, 제품 공개 API나 G1–G4 전체 통과를 의미하지 않는다.

제품 src, 설치 엔진, 의존성, lockfile은 변경하지 않았다. 연구용 엔진은 앞선 실험과 같은 SHA-256 `f89f149ea5823458e8a4a0b35153ca78111c92b01a4b04cd8497f8647d7d4c36`이다. 현재 루트 공개 API는 여전히 `paperSize`, `planTiles`이며 일반 capture/snapshot API는 미구현이다.

## 방법과 결과

1. 240×96 원본 fixture를 준비한다. pseudo 이미지에는 실제 로컬 시험 이미지를 decode한 뒤 만든 PNG 바이트를 사용한다.
2. 원본 DOM의 위치·크기·색상과 해당 이미지를 이용해 기준 Canvas를 만든다.
3. 요청 장부를 arm하고 기존 연구용 resolver·얕은 복제 확장을 연결해 엔진의 render hook까지 실행한다.
4. 엔진이 반환한 SVG에서 알려진 자원 URL을 승인된 PNG 데이터 URI로 치환하고 제한된 문법 검사를 수행한다.
5. 최종 SVG를 Image→Canvas로 렌더링해 기준 Canvas와 비교한다. 별도 SVG 문서 iframe에서는 표시되는 요소의 기하를 비교한다.

기준 이미지는 원본 DOM 기하를 이용한 분석적 도형 이미지다. **원본 페이지를 독립적으로 촬영한 스크린샷과의 자동 픽셀 비교는 아니다.** 결과 화면에서는 원본 DOM·기준 Canvas·최종 Canvas를 함께 제시했다.

| 항목 | Chrome | native Safari |
|---|---:|---:|
| background/content/mask | 3/3 일치 | 3/3 일치 |
| custom visible/hidden/slot/nested | 4/4 일치 | 4/4 일치 |
| 각 23,040픽셀의 변경 픽셀 수·최대 채널 차이 | 모두 0 | 모두 0 |
| 표시 요소 위치·크기 최대 차이 | 모두 0 | 모두 0 |
| arm 이후 시험 자원 endpoint 요청 | 모두 0 | 모두 0 |
| 시험 custom 생성자 증가 | 모두 0 | 모두 0 |
| 원본 outerHTML 변경·light DOM mutation | 모두 0 | 모두 0 |
| 제한 검사기의 거부 사례 | 각 실행 7/7 | 각 실행 7/7 |

거부 사례는 URL을 넣은 font-size, script, 이벤트 속성, 외부 CSS URL, @import, SVG 데이터 URI 이미지, CSS escape다. 정상 숫자 px font-size는 허용하는 대조 조건으로 확인했다.

두 브라우저의 pseudo 6건은 **엔진 원본 SVG에 외부 URL 리터럴이 남아 검사에서 거부**되었다. 알려진 URL을 치환한 최종 SVG에서는 해당 리터럴이 사라졌고 출력이 일치했다. custom 8건에는 해당 외부 참조가 없었다. 원본 SVG와 최종 SVG를 모두 원시 보고서에 보존했다.

숨김 사례는 원본의 기록 대상 요소가 2개, 출력은 1개다. 엔진이 숨김 자식을 생략했으며 표시 영역은 양쪽 모두 0이다. 구조 차이를 원시 기록과 회귀 검사에 유지하고, 시각 비교는 너비·높이가 모두 양수인 요소만 대상으로 한다. 이는 DOM 구조의 동등성 승인이 아니다.

## 보존한 중간 실패

| revision | 실행 수 | 결과와 처리 |
|---|---:|---|
| 1–2 | Chrome 각 7 | 제한 검사기가 엔진의 정상 `font-size="16px"` 속성을 미지원으로 거부. revision 2에서 원본 SVG 진단을 추가하고 숫자 px만 허용 |
| 3 | 두 브라우저 14 | legacy behavior 차단 정규식이 scroll-behavior까지 잘못 거부. 선언 이름 경계를 회귀 검사로 고정하고 수정 |
| 4 | 두 브라우저 14 | 픽셀은 전부 일치. 숨김 2건이 구조 개수 기준으로 불일치하여 표시 기하와 구조 기록을 분리 |
| 5 | 두 브라우저 14 | 최종 14건 일치. 이전 결과를 교체하거나 제품 결함으로 집계하지 않음 |

중간 42건과 실행 당시 세 모듈의 사본을 보존했다. 앞선 실패는 시험 검사기·비교 계약의 문제로 분류한다. 마지막 수정 뒤 두 브라우저의 전체 7종을 다시 실행했다.

## 적용 한계

- 치환/검사기는 작성된 도형 fixture 전용이다. 일반 CSS parser 또는 보안 sanitizer가 아니다. SVG presentation 속성 전체, namespace 변형, 임의 사용자 SVG와 모든 URL 문법을 다루지 않는다. 제품 코드로 그대로 이전하면 안 된다.
- 요청 0은 로컬 시험 endpoint의 arm 이후 장부와 출력 완료 뒤 250ms 관찰에 한정한다. 브라우저 전체 네트워크·지연 요청·CORS/CSP/cookie 계약을 증명하지 않는다.
- SVG 문서 iframe에는 `sandbox="allow-same-origin"`을 적용했다. 활성 콘텐츠의 모든 실행 경로에 대한 안전성 증거로 해석하지 않는다.
- MutationObserver는 light DOM에만 설치했다. 생성자 카운터도 시험 custom element에 한정한다. 실제 앱 전체 부작용과 Shadow 내부 mutation은 미검증이다.
- 텍스트·웹폰트·복합 CSS·일반 이미지 수집·SVG/iframe/video·closed Shadow·custom tag 의미 보존·고해상도·모바일·동시 실행·취소 배수는 이번 대상이 아니다.
- 실행 시간은 단회 진단값이며 대기 시간이 포함된다. 공개 모듈 성능 벤치마크나 속도 목표 충족으로 사용하지 않는다.

## 다음 구현 단위

이번 7종에 대한 추가 반복은 종료하고 다음 제품 통합으로 진행할 수 있다. 조건부 엔진 채택과 교체 가능한 내부 어댑터 원칙을 유지한다.

1. 제품에서 사용하는 resource resolver, 얕은 clone factory, 실패 전파, 생성 CSS/최종 SVG 전달의 계약과 외부 엔진 수정본 공급 방식을 명시한다. 현재 연구용 내부 함수 패치를 공개 API처럼 의존하지 않는다.
2. 제품용 DOM 자원 수집·준비와 SVG 출력 검증을 구현하고 내부 `inspect → prepare → verify`에 연결한다. 처리하지 못하는 입력은 명시적으로 실패시킨다.
3. 공개 capture/snapshot API와 출력·크기·잘라내기 기능을 연결한 뒤 실제 소비자 패키지와 프레임워크 예제를 검증한다.
4. 대표 실사용 페이지·브라우저/모바일·고해상도·성능과 G1–G4 잔여 조건을 검증한다. README·가이드·플레이그라운드를 검증된 지원 범위로 맞춘 후 배포 후보를 만든다.

아직 배포 가능 판정은 아니다. 엔진 공급 방식의 제품 채택과 원격 작업·게시·publish는 별도 승인 범위이며 이번에 수행하지 않았다.

## 증거

- [최종 14건·중간 42건·111개 파일 해시 집계](../output/research/engine-contract/2026-10-11-output-boundary/report.json)
- [Chrome 화면](../output/playwright/output-boundary-chrome.jpg), [native Safari 화면](../output/playwright/output-boundary-safari.jpg)
- [실행 fixture](../output/playwright/workbench/output-boundary.mjs), [제한 SVG 검사](../output/playwright/workbench/output-boundary-svg.mjs), [비교·치환 모델](../output/playwright/workbench/output-boundary-model.mjs)
- [원시 결과·해시 회귀 검사](../test/research/output-boundary-evidence.test.mjs)
- [엔진 출처와 변경 표시](../output/research/clone-extension-engine/provenance.json), [보존한 LICENSE](../output/research/clone-extension-engine/LICENSE)

재현: `python3 output/playwright/workbench/output-boundary-server.py`로 localhost 8855의 `/output`을 열고 설치 브라우저 버전을 입력한 뒤 출력 검증을 실행한다. 실제 브라우저 조작은 Computer Use로 수행했다. `npm run test:research`는 보존된 결과와 모델의 회귀 검사이며 브라우저를 다시 실행하지 않는다.
