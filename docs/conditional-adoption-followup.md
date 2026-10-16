# 조건부 채택 후속 검증

일자: 2026-10-04. SnapDOM 3.2.0 조건부 채택 승인 후 남은 항목을 검증했다. 연구 전반을 다시 시작하지 않고 기존 증거를 유지했다.

## G4: Safari 최소 보완 경로

최종 `followup-3`은 실제 Chrome·Safari 각각 4개 사례다. 앞선 탐색 실행까지 총 20개 JSON/PNG 실행 기록을 [통합 증거](../output/research/engine-contract/2026-10-04-conditional-followup/report.json)에 보존했다.

| 경로 | Chrome | Safari |
|---|---|---|
| 엔진 crop, 12타일 | 5개/타일 표본 일치 | 8개 타일 불일치 |
| HTML 컨테이너 left/top 이동, 12타일 | 8개 타일 불일치 | 표본 전부 일치 |
| HTML 컨테이너 left/top 이동, 50타일 | 30개 타일 불일치 | 표본 전부 일치 |

Safari는 외부 SVG의 viewBox/transform에만 의존하는 경로에서 타일 내용이 틀렸고, foreignObject 내부 HTML 컨테이너 이동 경로에서 제한된 표본이 일치했다. 브라우저 내부 원인을 규명한 것은 아니다. 탐색 중 첫 HTML 이동 코드는 첫 자식이 style인 구조를 놓쳐 두 브라우저 모두 실패했다. 실제 직렬화 구조가 style+div임을 확인한 뒤 전체 자식을 감싼 컨테이너로 비교했다. 실패 기록은 보존했다.

최대 계측 Canvas 픽셀은 작은 사례 1,048,576, 큰 사례 4,194,304였다. 계측은 capture 이후 export 단계에 한정하며 전체 브라우저 메모리나 engine capture 중 할당을 보증하지 않는다. 각 타일의 중앙·4개 안쪽 표본을 검사했으며 텍스트·경계 전체 시각 비교는 남는다. 따라서 G4 전체 pass로 변경하지 않는다.

## G2: 공개 hook의 원본 identity

ID 없음·중복 ID·동일 형제·open Shadow 원본을 WeakMap에 기록했다. 두 브라우저 모두 모든 원본이 resolveNode에서 관찰됐고 복제본 텍스트가 보존됐다. 원본 marker나 opaque map을 사용하지 않았다. 최종 복제본과 일대일 대응은 아직 없으므로 일반 sticky 적용 완료를 뜻하지 않는다.

## G1/G3 후속

기존 자원 7개·CSS/SVG 8개 증거는 재실행하지 않았다. 취득 정책의 deny·origin 정확 비교·credentials omit·redirect error·비 HTTP 거부에 대한 새 단위 테스트를 작성했다. 브라우저 엔진 요청 경로 전체의 통제 증거는 아니다.

공개 excludeStyleProps와 afterClone을 조합하는 CSS 사례 및 SVG 이벤트/링크 제거 전후의 제한된 probe를 `boundaries.html/.mjs`에 추가했다. 앞선 실행은 Mac 잠금으로 중단됐다. 사용자의 잠금 해제 안내 후 네이티브 Safari 접근을 확인하고 실제 Chrome·Safari에서 각각 4건을 실행했다. [후속 증거](../output/research/engine-contract/2026-10-04-boundaries/report.json)와 원본 파일 해시를 보존했다.

두 브라우저 모두 CSS direct와 excludeStyleProps+afterClone 경로에서 capture 단계 추가 요청 1건이 발생했다. 픽셀 표본은 일치했지만 이 공개 hook 조합만으로 default deny를 달성하지 못했다. SVG direct에는 이벤트 속성과 HTTP 링크가 각각 1개 남았고, 알려진 fixture의 제거 hook에서는 0개였다. 8건 모두 원본 DOM은 보존됐다. SVG 사례의 imageSampleMatch=false는 CSS 전용 파랑/노랑 표본을 공통 기록한 값이며 SVG 정제 실패 판정이 아니다. 활성 문서 실행 여부는 모두 미검증으로 유지한다.

SVG 활성 문서·중첩 자원·폰트 face 전체 검증은 계속 릴리즈 조건이다. 개발 Playground는 직접 작성한 고정 샘플만 받으며, 일반 입력을 받을 공개 capture API는 아직 export하지 않는다.
