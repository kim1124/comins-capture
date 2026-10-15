# 엔진 채택 검증 — Task 0 중간 결과

> 2026-10-04 실행 승인 갱신: 사용자가 SnapDOM 3.2.0 조건부 채택을 확정하고 잔여 검증 후 프로젝트 구조·README·플레이그라운드·코민스 사이트·공식 가이드 작성을 지시했다. 과거의 채택 보류/전체 gate 통과 전 착수 금지는 이 승인으로 대체한다. 실패·미검증 항목은 릴리즈 조건으로 유지하며 공개 배포는 이번 실행에 포함하지 않는다.

검증일: 2026-10-04 (Asia/Seoul). 대상은 고정 배포본 `@zumer/snapdom@3.2.0`이다. 최신 패키지 또는 전체 지원 브라우저 검증을 의미하지 않는다.

## 결론

**SnapDOM 직접 채택은 보류한다.** 실제 Chrome·Safari에서 기본 엔진 호출의 네트워크 재요청, SVG 이벤트 속성 보존, Safari 타일 내용 불일치를 확인했다. 이는 Comins 어댑터로 해결할 수 없다는 결론이 아니다. 이번 작업은 Task 0의 기준 동작 측정이며, 전체 G1~G4 완료나 제품 구현 완료로 처리하지 않는다.

엔진 통합 Task 3~7은 계속 보류한다. 엔진과 독립적인 Task 1~2는 계획상 별도로 진행할 수 있다. 이번에는 패키지·Git 기준선을 만들지 않았다.

2026-10-04 후속: [G1 준비 자원 실험](g1-resource-control.md)을 Chrome 확장 경로와 실제 Safari 네이티브 조작으로 실행해 각각 7개 사례의 기대 동작과 캡처 단계 자원 요청 0건을 확인했다. Safari는 잠금 해제 후 실행했다. 준비된 합성 입력의 성공이며 일반 DOM 자원 수집의 증명이 아니므로, 아래 기본 호출 기준 측정과 전체 gate 판정은 유지한다.

## 환경과 증거

추가 [CSS·SVG 경계 검증](g1-css-svg-boundaries.md): Chrome·Safari의 최종 8개 사례에서 요청 수·내용 표본 판정이 같았다. CSS는 `afterClone`·`resolveNode` 치환에도 원본 스타일 기반 요청이 남았다. 준비된 CSS 입력과 단순 inline SVG 치환은 제한된 성공이며, 중첩 data SVG의 자원 누락도 확인했다. 단순 hook wrapper만으로 G1을 해결할 수 있다고 가정하지 않는다. 기존 Safari G4 타일 실패는 이번에 재검증하지 않았다.

- Chrome 154.0.8037.93, 실제 Safari 27.0.1 / build 22625.1.29.11.28. 설치 정보와 UA를 확인했다. Safari 27.0의 이전 기록과 분리한다. 당일 공식 최신 버전 여부는 재조회하지 않았다.
- Computer Use로 각 브라우저에서 5개 사례를 실행·저장했다. Chrome 확장 연결을 사용할 수 없어 두 브라우저 모두 네이티브 앱을 조작했다. WebKit 대체 실행이 아니다.
- npm 고정 tarball을 임시 디렉터리에 풀어 사용했다. 제품 의존성 설치는 하지 않았다. 배포본의 MIT LICENSE를 확인했으며 타사 코드·폰트를 제품 소스로 복사하지 않았다.
- [통합 판정](../output/research/engine-contract/2026-10-04-baseline/report.json), [fixture·배포본 SHA-256](../output/research/engine-contract/2026-10-04-baseline/sha256.json), [타일 픽셀 분석](../output/research/engine-contract/2026-10-04-baseline/tile-analysis.json).
- 통합 판정의 상대 경로에서 원본 JSON 10건을 확인할 수 있다. 기존 workbench UUID 결과를 보존하고 새 증거 디렉터리로 복사했다. PNG·전체 SVG·원본 기준 스크린샷은 이번 결과 파일에 저장하지 않았으므로 시각 비교 완료로 간주하지 않는다.
- Safari 첫 자원 사례의 수동 버전 입력은 입력창 길이 제한으로 build 뒷부분이 잘렸다. 원본 기록을 수정하지 않았으며, `Version/27.0.1` UA와 별도 설치 정보로 버전을 확인했다. 이후 사례에는 `Safari 27.0.1`을 기록했다.

## 관찰과 판정

| Gate | Chrome | Safari | 해석 |
|---|---|---|---|
| G1 자원 요청 통제 | 캡처 단계 이미지 2·폰트 1 요청 | 동일 | 기본 호출은 요청 0건 계약에 부적합 |
| G2 원본·복제본 대응 | 공개 hook에서 원본 9·복제 노드 10 관찰 | 동일 | 범용 대응·sticky 보정 미구현, 미검증 |
| G3 안전한 SVG | script 0·이벤트 속성 1·외부 참조 1 | 동일 | 반환 전 정제 필요, 기본 출력 부적합 |
| G4 타일 | 치수 일치·중앙 픽셀 표본 일치 | 치수 일치·중앙 픽셀 불일치 | Safari crop 경로 실패, 전체 gate 미통과 |

### G1: 준비된 자원도 다시 취득함

원본 준비 요청과 캡처 요청을 서버 장부로 분리했다. 캡처 전에 이미지 decode·해당 font load를 기다렸으며, 장부상 이미지·CSS background·폰트의 준비 요청이 모두 기록됐다. 캡처 단계에서 이 자원에 대한 요청이 다시 3건 발생했다. 합성 앱 요청 1건은 별도 분류해 엔진 요청 수에서 제외했다. 같은 결과의 두 번째 PNG 출력에서는 추가 요청이 0건이었다.

`cache:false`, `invalidate:true`, `burst:false`, `embedFonts:'auto'`, `dpr:1`, `scale:1`을 사용했다. 이 실험은 이미 로드된 입력의 기준 동작이며 cold/warm 전체 캐시 조합은 아니다. default-deny 어댑터·외부 SVG·오류·취소·동시 앱 요청의 전체 행렬은 미실행이다. 서버는 요청을 차단하지 않았으므로 이번 실패를 제품 차단 구현의 실패로 확대하지 않는다.

### G2: 공개 확장 지점 관찰만 완료

ID 없는 요소, 중복 ID, 형제, open Shadow DOM과 단일 sticky/scroll 사례에서 `resolveNode`·`afterClone`을 관찰했다. opaque cache/nodeMap을 읽거나 원본에 marker를 쓰지 않았다. 원본 9개와 복제 노드 10개의 수는 Shadow DOM을 포함한 변환 구조 차이를 보여줄 뿐, 잘못된 대응의 증명은 아니다.

보고서의 `publicOriginalClonePairAvailable:false`는 이번 probe가 대응 쌍을 확보하지 않았다는 기록이다. 공개 API로 구현 불가능하다는 검출 결과가 아니다. nested sticky·컨테이너 끝 경계·Comins 소유 매핑은 미검증이다.

### G3: 정적 검사에서 정제 필요성 확인

두 브라우저 모두 합성 버튼의 `onclick`이 SVG에 남았다. 외부 참조 1개는 합성 하이퍼링크이며, 수동 탐색 주소의 존재를 실제 외부 요청 발생으로 보고하지 않는다. script 0은 `application/json` 합성 script가 제거됐다는 관찰이다.

SVG를 활성 문서로 실행하지 않았다. 이번 검사는 CSS URL·모든 SVG 참조를 포괄하는 sanitizer가 아니며, 폰트 face별 누락·CSS 접근 불가·SVG document/img 실행 및 요청 격리 확인은 남아 있다. 정식 보안 검토도 수행하지 않았다.

### G4: Safari는 치수 성공과 내용 성공이 다름

| 입력 / 타일 | 반환 개수 | 마지막 타일 | 최대 계측 Canvas 픽셀 | Chrome 중앙 표본 불일치 | Safari 중앙 표본 불일치 |
|---|---:|---|---:|---:|---:|
| 2500×3500 / 1024 | 12 | (2048,3072), 452×428 | 1,048,576 | 0/12 | 8/12 |
| 20000×10000 / 2048 | 50 | (18432,8192), 1568×1808 | 4,194,304 | 0/50 | 25/50 |

합성 입력은 왼쪽 파랑·오른쪽 노랑이며 각 타일의 실제 중앙 RGBA를 저장했다. Safari의 오른쪽 표본은 노랑 대신 파랑이었다. 채널 오차 2를 허용해도 불일치한다. **원인은 아직 규명하지 않았으며 엔진 crop 좌표 처리·SVG 렌더링 중 어느 단계인지 단정하지 않는다.**

연구 페이지에서 Canvas width/height setter를 일시 계측하고 finally에서 복원했다. 8192px 또는 32Mpx 초과 시 할당 전에 중단하도록 했으나 이번에는 guard가 작동하지 않았다. 전체 입력 크기의 Canvas 할당 요청은 관찰되지 않았다. 이 계측은 setter 경로의 관찰이며 브라우저 내부 SVG 표면·GPU 메모리·OffscreenCanvas 전체를 측정한 것은 아니다. `allocations`는 실제 Canvas 객체 수가 아니라 setter 호출 기록 수다.

원본 JSON의 `dimensions-pass`/`unverified`는 실행 시 치수 판정이다. 이후 중앙 픽셀 분석으로 Safari G4를 fail로 판정해 통합 보고서에 반영했다. 원본 JSON은 덮어쓰지 않았다. Chrome도 전체 타일 접합과 텍스트·경계 비교가 남아 있어 G4 pass로 올리지 않았다.

10건 모두 probe가 측정한 원본 outerHTML·자식 scroll·문서 scroll은 동일했다. 폼 값·selection·focus·Shadow DOM 내부 전체를 포함한 제품 SourceState 검증은 아니다.

## 다음 검증 순서와 어댑터 설계

1. **G1 우선:** Comins가 자원을 수집·해결한 준비 DOM을 구성하고, 네트워크 URL을 모두 제거/삽입한 이후 엔진에 전달하는 경로를 연구한다. 같은 resolver 데이터만 사용한 성공 사례와 해결 불가 시 엔진 호출 전 오류 사례를 구분한다. 임시 DOM 삽입 자체가 요청을 일으키지 않는지도 서버 장부로 확인한다.
2. **G2:** 준비 DOM을 만들 때 원본→Comins 복제본을 직접 연결한다. 공개 `resolveNode`/`afterClone`으로 가능한 범위를 확인하고, 엔진이 추가로 복제한 노드와의 대응을 별도로 검증한다. ID 순서 추측·opaque nodeMap·원본 marker를 채택하지 않는다. nested sticky/경계 비교를 통과해야 한다.
3. **G3:** 준비 자원 manifest와 실제 삽입 증거를 face/source별로 연결한다. 최종 SVG의 이벤트·활성 노드·외부 참조를 정제한 뒤 img/별도 문서에서 요청과 실행을 측정한다. 출력만 정제하는 것으로 캡처 중 G1 요청을 해결했다고 간주하지 않는다.
4. **G4:** Safari 실패를 좌표 표식이 있는 최소 fixture로 재현해 엔진 crop과 Comins 소유 viewBox/clip 경로를 비교한다. 원본 기준·타일 PNG·접합 결과를 보존하고 내용 일치와 전체 Canvas 미할당을 함께 검증한다. 조용한 해상도 축소로 해결하지 않는다.

공개 API만으로 계약을 충족하기 어렵거나 엔진 fork/전역 fetch patch가 필요해지면 통합을 중단하고 대안 또는 명세 변경안을 보고한다. 현재 단일 엔진 원칙·기본 해상도·오류 계약은 변경하지 않는다.

## 수행한 검증

- Node 연구·기존 판정 테스트 **15개 통과**. 필수 사례 누락과 잘못된 타일 색상에 대한 RED→GREEN 포함.
- Python 기존 서버 단위 테스트 **8개 통과**; 실행 중 서버 HTTP 경계·요청 격리 **12개 확인 통과**.
- 연구 JS 구문 검사·Python 컴파일 검사 통과.
- `node scripts/check-engine-evidence.mjs output/research/engine-contract/2026-10-04-baseline/report.json`: **exit 1**, 미통과/미검증 증거를 거부하는 기대 결과. 제품 테스트 실패와 구분한다.
- checker는 G1~G4별 필수 case ID·Chrome/Safari·pass 상태·실존하는 내부 증거 경로를 확인한다. 파일 내용의 진위나 시각 적합성까지 자동 인증하지 않는다. 합성 pass fixture는 제품 채택 증거가 아니다.
- npm build·제품 테스트·Edge/Firefox/모바일·배포 검증은 미실행이다.
