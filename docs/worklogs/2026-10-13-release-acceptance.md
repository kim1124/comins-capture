# 최초 출시 수용 기준·자원/SVG·화면 재현 작업

작업일: 2026-10-13 KST. **범위 정리·검증은 완료, 화면 품질 해결은 미완료**. 로컬 작업이며 commit·원격 쓰기·publish·배포는 수행하지 않았다. 브랜치는 시작 기록 `codex-capture-initial`과 후속 관찰 `codex-governance-v111`을 구분하며 HEAD는 `a35dbe2`다. 제품 파일은 미커밋/untracked이고 별도 AGENTS/.codex 변경은 보존한다. 적용 Contract v1.12는 승인된 로컬 미게시본이다.

## 요약과 범위

승인된 세 작업인 최초 출시 범위 정리, 자원/SVG 검증, 실제 화면 재현 품질 검증을 병행했다. Sol이 문서·검증 fixture를 작성하고 Astra가 실행·판정했다. 이번 제품 src 변경은 없으며 대체 인코더를 추가하지 않았다. 자원/SVG 기대 계약은 30/30 통과했으나 Chrome 타일 및 Safari crop·타일·그림자 재현은 실패했다. 세 번째 단계의 제품 품질 해결과 최초 출시는 미완료다. 문서 담당자는 테스트·브라우저를 실행하지 않았다.

현재 구현, 최초 요구의 미충족 항목, 확정된 후속 범위를 [완료 기준표](../release-readiness.md)에 구분했다. 미지원 포맷을 강제로 지원하거나 대체 인코더를 추가하지 않는 사용자 결정을 반영했다. 네이티브 MIME 미지원은 `FORMAT_UNSUPPORTED`이며 Safari WebP 미지원 기록을 유지한다.

## 변경 파일과 검사 준비

| 영역 | 파일 | 준비한 내용 |
|---|---|---|
| 범위·공식 가이드 | `docs/release-readiness.md`, `docs/guide/{support,output-options,dom-integration,frameworks}.md` | G1~G4 사례·수용 조건, 기존 필수 요구와 현재 입력 제한, 네이티브 포맷 정책·실행 버전 정정 |
| 자원/SVG | `test/browser/resource-acceptance.{html,mjs}`, `scripts/resource-acceptance-server.mjs` | same-origin, resolver-deny, deny, origin-denied/allowed, CORS, 접근 불가 CSSOM, missing, invalid-image, redirect, abort/recovery, CSP, SVG image/inline SVG 거부, SVG isolation의 15개 사례 |
| 화면 재현 | `test/browser/visual-acceptance.{html,mjs}`, `scripts/visual-acceptance-server.mjs` | 620×560 정적 명세서, 노드 대응·기본/2배 PNG 일관성·정수 crop·30타일 접합·원본 DOM·sticky/fixed/scrolled 거부와 별도 CUA 원본 화면 비교 |
| 통합 기록 | `docs/HANDOFF.md`, 이 문서, `docs/worklogs/2026-10-13-public-api-consumers.md`의 상단 정정 | 기존 완료 증거와 후속 증거, 최종 결과·잔여 조건·설치/실행 버전 분리 |

서버 기본 포트는 resource 6006/asset 6007, visual 6007이다. 동시 실행 시 visual 포트 변경 또는 순차 실행이 필요하다. 작성 fixture와 로컬 결과는 npm 배포 파일에 포함하지 않는다.

## 검증 결과 — Astra 실행·판정

| 검사 | 결과 | 범위와 한계 |
|---|---|---|
| `npm run verify` | 통과: typecheck/build, unit 48/48, consumer 4/4, license | 최종 고정 대상과 로그는 manifest에 연결 |
| `npm run test:research` | 41/41 통과 | 연구 검사이며 브라우저 제품 지원 보증과 구분 |
| fixture JS 구문·diff hygiene | 구문 4개 및 diff check 통과 | diff check는 tracked 변경 대상이며 untracked 제품 전체 검사가 아님 |
| 자원/SVG, 실행 UA Chrome 154 | 15/15 기대 계약 통과 | 정상 캡처 4개, 거부·환경 차단·취소 11개 |
| 자원/SVG, native Safari 27.0.1 | 15/15 기대 계약 통과 | 정상 캡처 4개, 거부·환경 차단·취소 11개 |
| 시각 fixture 자동 검사, Chrome | 8pass / 1fail | 30타일 접합 strict 실패: 398픽셀, RGB 최대 1, 알파 차이 0 |
| 시각 fixture 자동 검사, Safari | 7pass / 2fail | 정수 crop 4픽셀·최대 1, 30타일 314픽셀·최대 3 차이, 알파 차이 0 |
| 원본/2배 출력 CUA 비교, Chrome | 육안 기준 통과 | 정밀 원본 픽셀 exact 일치는 선언하지 않음 |
| 원본/2배 출력 CUA 비교, Safari | 실패 | 카드 drop-shadow 직사각형 경계·inset shadow 차이 |
| 작업용 서버·탭 정리 | Astra 확인 완료 | 서버 세션 종료·6006/6007 listener 없음·본인 탭 종료; 사용자 탭 보존 |

기존 공개 API·프레임워크 소비의 8조합과 tarball 증거는 [기존 리포트](2026-10-13-public-api-consumers.md)에 있다. 새 fixture나 가이드 작성만으로 해당 기록을 현재 전체 Gate 결과로 변경하지 않는다.

## 고정 증거와 실행 버전 정정

최종 증거 manifest: `output/research/release-acceptance-2026-10-13/manifest.json`. src/dist/fixture/config/dependency의 aggregate SHA-256은 `5929bc58823d2db9c048b3bcd252445c7ef9958c8a2bef9862e3829181702d8a`이다. Astra가 확인한 변경 0은 `output/research/public-api-final/manifest.json`에 열거된 기존 제품·예제·설정·의존성 해시의 비교 결과다. 새 진단 fixture는 중간에 변경되었으며 candidate-initial과 final의 전체 aggregate가 같다는 의미가 아니다. 통합 폴더에는 verify/research 로그, `resource-summary.json`, `visual-summary.json`, `browser-version-errata.json`, CUA screenshot과 보조 화면 차이 측정이 있다.

- 자원 30개: `output/research/resource-acceptance/9a761764-c4c1-424b-9974-878499ae05f2/*.json`. 8개 정상 캡처와 22개 거부/환경/취소 사례이며 각 요청 장부와 기대 오류를 보존한다. resolver-deny 캡처 요청 0건, 두 SVG 격리의 외부 요청·실행 0건을 확인했다. 활성 제어 SVG의 실행/probe 감지로 센서 작동을 확인했다. SVG 문서는 CSP 차단에 의존하지 않았으나 `sandbox="allow-scripts"` 작성 환경이므로 일반 활성 문서 전체를 인증하지 않는다.
- 기본 시각: `output/visual-acceptance/67344415-e766-4ff5-b453-bd787241d7c0/`. Chrome run `c5be0b1b-3e9b-4f7c-9cd4-e634f2de572b`는 2026-10-13 14:32 KST, Safari run `27331e48-5b6f-4e8b-a4bb-2aeec5371522`는 14:37 KST에 시작했다. 각 report·출력 PNG·별도 screen-review를 보존한다.
- 제한된 G2 양쪽 성공은 64노드 대응(62개 ID 없음·중복 ID 2개·동일 구조 형제 3개)과 outerHTML 보존이다. 폼·scroll·focus 전체 상태 보존을 검증한 결과가 아니다.
- 설치 Chrome 정보는 155.0.8059.40이지만 이번 및 과거 프레임워크 결과 JSON의 실행 UA는 `Chrome/154.0.0.0`이다. 정확 runtime patch는 미확인이다. 155 실행 지원 주장은 철회하고 원본 JSON은 보존한다. 실제 native Safari UA는 Version/27.0.1이다. 기존 소비 worklog에 날짜 있는 정정문을 추가했고 공식 가이드·HANDOFF의 현재 표기를 수정했다.
- `screen-pixel-measurements.json`의 원본/출력 screenshot RGB 보조 측정은 window compositing과 서로 다른 screenshot 해상도를 포함한다. Chrome 25,935픽셀·최대 17, Safari 324,892픽셀·최대 228 차이는 육안 판단의 참고 자료이며 허용 오차 기반 통과나 정밀 exact 동등성 판정이 아니다.

## 실패 진단과 다음 조치

Chrome 접합 차이는 반복 출력에서도 같았고 origin-zero 단일 타일·정렬한 4타일·회전 제거 30타일 대조에서는 차이가 0이었다. 회전 경계와 viewport 이동의 AA 가설을 지지하지만 제품 수정·원인 확정·일반 허용 오차 적용은 하지 않았다. 증거는 `output/visual-acceptance/9c859e28-99cf-406c-b117-eeca0289f102/0fa86b1b-53c9-436d-b77c-3d22a8032f71/`이다.

Safari HTML transform을 제거하고 같은 SVG의 viewport를 2배로 확대한 대조군도 그림자 차이와 clip 내부 라벨·사선·원 소실로 실패했다. HTML transform만이 원인이라는 가설을 기각하며 해당 대조 경로를 제품에 적용하지 않았다. 증거는 `output/visual-acceptance/edc93728-d30f-4b47-8e7f-629665a077d8/3e129fce-e64e-4feb-a947-ecd7e60f4486/`이다.

다음 조치는 Safari foreignObject의 drop-shadow/inset/clip 최소 재현과 지원 품질 수정 검토다. Chrome 타일 및 Safari crop/타일 strict 실패도 유지한다. unsafe fallback, 기본 해상도 축소 또는 최초 지원 범위 축소는 승인받은 상태가 아니다.

## 잔여 조건과 판정 한계

- Astra 최종 Gate 판정은 G1/G2/G3 partial, G4 failed다. G1의 credentials·cold/warm·currentSrc·동시 앱 요청, G3의 face별·전체 중첩 CSS/SVG 누락 검증이 남아 있다. loopback 작성 사례 성공은 일반 모든 취득 경로 및 모든 브라우저 환경의 증명이 아니다.
- G2의 open Shadow DOM·nested sticky·컨테이너 끝 경계·폼/scroll/fixed 표시 상태 및 페이지 범위 입력은 기존 요구의 미충족 항목이다. 해당 입력 거부 테스트는 재현 성공을 대신하지 않는다.
- 시각 fixture는 실제 앱 형태로 작성한 단일 정적 화면이다. 자동 검사는 같은 SVG 출력끼리의 일관성이고 CUA 비교는 육안 검사다. 원본 screenshot과 출력의 정밀 전체 픽셀 일치·모든 CSS/실제 앱·시스템 폰트 동일성·일반 고해상도 품질을 보장하지 않는다.
- Edge/Firefox·실제 Android/iOS, 전체 12/50타일 복잡 콘텐츠, 알려진 Chrome JIS B4 경계 차이와 UA 보완의 범용성은 해당 실행 증거 없이 완료 처리하지 않는다.
- 빠른 UI 취소 timing, 장기 메모리 leak, 전체 브라우저/GPU 메모리 상한, 정식 취약점 감사·최종 출시 artifact·website 동기화는 별도 잔여 조건이다.
- 적용한 새 포맷 결정 이외의 최초 요구 축소는 이번 문서 작업으로 승인되지 않는다. commit·push·PR·태그·Release·publish·배포는 별도 승인 경계다.
