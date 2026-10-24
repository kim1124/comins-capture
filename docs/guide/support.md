# 지원 범위와 검증 상태

0.0.2 로컬 미게시 후보와 이전 0.0.1 검증 기록을 구분합니다. 기능 구현·브라우저 검증과 실제 registry 게시·출시 종료 상태는 별도입니다.

## 2026-10-23 · 최종 CSS 경계 후보의 제한적 검증

최신 0.0.2 로컬 미게시 후보는 무관한 문서 전역 vendor scrollbar 계열 CSS가 SVG에 유입되던 문제를 보완했습니다. 원본 inspection 노드와 조상 문맥에서 무관함이 확정된 규칙만 제외합니다. 관련·혼합·판정 불가 규칙은 원문을 유지하므로 관련 `var()`·unknown CSS·지원하지 않는 media 직렬화 등의 strict 거부는 남습니다. 일반 스타일 격리나 모든 CSS 지원을 의미하지 않습니다. 아래 SVG flow 보완과 이전 이력은 각 검증 리비전의 기록입니다.

| 최종 후보의 기록된 검증 | 결과 및 한계 |
|---|---|
| `npm run verify` | unit 84/84·consumer 6/6·typecheck/build/licenses/docs PASS |
| 설치 Chrome 155.0.8059.86 DPR1·DPR2, WebKit 26.5 DPR2 | 영향받는 기존 7개 suite와 신규 CSS 1개 suite를 환경별 실행하여 총 24/24 PASS |
| 독립 CSS 조건 | 56/56 PASS. capture 단계 unsafe CSS URL 취득 0건. clean/plain/unrelated-var/실제 Table CSS의 PNG는 각 브라우저 안에서 byte 동일 |
| 사이트 한영 quick-start/single-output UI | 4/4 PASS. 검증 브라우저 응답만 후보 모듈로 대체하고 경로별 실제 후보 JS 20개 SHA 대조·320×240 PNG preview decode·원본 DOM 불변 확인. 설치 0.0.1 교체·사이트 배포는 미실행 |
| 검증 대상 불변성 | src/dist/scripts/test/package 1,764파일 전후 해시 동일. 사이트 src 373개·설치본 81개·후보 dist 45개도 불변 |
| 보안 변경분 검토 | scan `143dfad2-6ebd-4819-a7a1-008e6394d2c0` 완료. authoritative source/config/tooling 24개 직접 검토에서 후보·확정 취약점 0건. 전체 저장소·vendor·신규 advisory·런타임 공격 감사 아님 |

위 결과는 기록된 최종 소스·dist에 대한 한정 증거입니다. 문서 후속 정리에서 전체 검사를 새로 실행한 결과는 아닙니다. native Safari는 기존 OS 인증/automation 차단으로 미실행이고 WebKit을 대체 증거로 사용하지 않습니다. 아래 제한적 일반 block SVG 보완은 모든 줄 배치·배율 또는 전체 SVG 외부 재확대 clip/shadow 문제를 해결한 것이 아닙니다. 최종 후보의 대표 native UI 인수·최종 package artifact/provenance/보안 조건·원격 CI·명시적 게시 승인이 남아 `releaseReady=false`를 유지합니다. 0.0.1 게시 이력과 이번 후보의 로컬 검증을 구분합니다.

## 2026-10-23 일반 block 텍스트 확장 — 제한적 수정 검증

원본 단일 Text로 된 일반 block의 한 줄·여러 줄 문단으로 보정 범위를 확장하고, CSSOM 배율 직렬화와 내부 Float32 역배율의 정밀도 문제를 보완한 로컬 후보입니다. 아래 절대 배치 후보의 검증 수치는 이 증분의 전체 gate 결과가 아닙니다. 초기 42개 집중 회귀 이후 독립 검토에서 float 형제의 줄폭 제한 누락과 static 승격의 paint-order 회귀를 재현했습니다. 보수적 제외 조건을 추가한 동결 후보는 Chrome/WebKit 각각 51/51의 새 회귀를 통과했습니다. 기존 텍스트 23/23 및 비대상·기존 단일 단계 출력 9종의 byte/래스터 동일성도 각 브라우저에서 확인했습니다. 동결한 runtime 1,924파일의 검증 전후 해시는 같았습니다. 타입·빌드·unit 73·consumer 6·라이선스를 통과했고, verify의 마지막 문서 단계에서 배포 제외 파일 링크가 실패하여 링크 수정 후 해당 문서 검사를 통과했습니다. 전체 verify 명령을 반복하지 않았습니다. research의 서로 다른 46개는 PASS이며 초기 listen EPERM 1개만 허용 환경에서 재실행했습니다. 설치 Chrome 155.0.8059.86 DPR1·DPR2와 WebKit 26.5 DPR2의 각 10개, 총 30/30 suite를 통과했습니다. 독립 검토는 확정 회귀 2건의 수정과 현재 소스·테스트 해시를 확인했고 추가 actionable 결함을 발견하지 못했습니다.

flex/grid 기준선·table·inline·flow-root·float·다단·패딩/테두리·혼합 인라인·RTL·pseudo 등의 비적격 구조는 기존 경로를 유지합니다. 일반 block은 캡처 내부의 음수 margin·박스 밖 효과·겹침·가시 overflow 위험과 검사 예산 초과도 제외합니다. fallback은 구조·페인트 회귀 방지를 의미하며, 기존 CSS zoom의 줄 재배치를 해결했다는 뜻이 아닙니다. 캡처 바깥 float가 원본 줄폭에 영향을 주는 경우에는 기본 1배 캡처부터 차이가 나는 기존 경계도 확인했습니다. 숫자 보정은 모든 배율의 완전한 상쇄를 보장하지 않습니다. 기존 CSS zoom의 박스 양자화 오차는 새 텍스트 보정이 추가한 배치 변화와 구분하여 기록합니다. PNG 내장·강제 nowrap·폰트 변경은 없으며, native Safari 및 전체 SVG 외부 재확대 clip/shadow 문제는 미해결입니다. 아래 이전 검증과 이번 후보의 검증 범위를 구분합니다.

## 2026-10-23 · SVG 텍스트 부분 보완 후보

적격한 절대 배치 단일 텍스트의 원본 배치·글꼴 속성을 불변 데이터로 보관하고 SVG 축소 시 텍스트와 컨테이너 효과를 분리하는 부분 수정을 진행했습니다. 최종 리비전은 verify(unit 66·consumer 6·타입·빌드·라이선스·문서), research의 서로 다른 46개 검사 및 Chrome DPR1·2/WebKit DPR2의 27개 suite를 통과했습니다. research 중 서버 검사 1개는 listen EPERM 환경 실패 후 해당 항목만 허용 환경에서 재실행했습니다. 신규 SVG 7개와 적격·비적격 텍스트 23개를 각 브라우저 설정에서 확인했으며, 독립 검토의 미해결 actionable finding은 없습니다. 아래 이전 리비전 결과와 구분합니다. 당시 절대 배치 후보에서는 일반 flow·혼합 인라인·여러 줄·RTL·pseudo 등이 보정 대상이 아니었습니다. PNG 내장·폰트 속성 변경·강제 nowrap은 적용하지 않았습니다.

단일 run 실험에서는 라벨 밖 그림자·clip 픽셀이 기존 출력과 같았고, 분리된 텍스트의 4배 확대는 원본 기하 렌더링의 선명도에 가까웠습니다. 이 진단 결과를 전체 SVG의 재확대 품질 보증으로 확대하지 않습니다. WebKit의 기존 외부 확대 shadow/clip 오류와 일반 HTML 전체의 축소 fidelity는 남아 있으며, 새 코드의 native Safari 검증도 아직 수행하지 않았습니다. 최신 SafariDriver 27.0.1의 session 생성 요청은 원격 자동화 비활성화로 거부됐으며 설정을 변경하지 않았습니다. 기술 수용·출시 준비 완료로 판정하지 않습니다.

## 2026-10-21 · 이전 0.0.2 후보

현재 direct foreignObject/CSS zoom 래스터 축소 경로는 원본 배율1 Canvas를 확정한 뒤 축소하여 대표 normal text 라벨·그림자·clip을 함께 보존합니다. 새 리비전의 독립 자동 검증은 통과했으나 native Safari는 미실행이며 SVG 축소 줄 배치도 미해결입니다. 후보 수용·출시 준비 완료로 판정하지 않습니다. 아래 수정은 npm의 0.0.1 설치물에 적용된 내용이나 정식 Safari 지원 선언이 아닙니다.

| 이번 동결 후보 검증 | 실제 결과 |
|---|---|
| `npm run verify` | typecheck·build·unit 59/59·consumer 6/6·license·docs PASS |
| `npm run test:research` | 46/46 PASS |
| 설치 Chrome 155.0.8059.85 headless · DPR1 | engine 6/6·cold image 6/6·resource 15/15·output/lifecycle 7/7·visual automatic 7/7·paper clip 15/15·새 래스터 축소 19/19 PASS |
| 같은 Chrome · DPR2 | 기존 6개 suite와 새 래스터 경로 회귀 17/17 PASS. 기존 reciprocal 경로 유지 |
| WebKit 26.5 · DPR2 | 기존 6개 suite와 새 래스터 축소 19/19 PASS. native Safari 대체 증거 아님 |
| 새 래스터 리비전 native Safari | CUA 화면 경합·SafariDriver 원격 자동화 비활성으로 미실행 |
| 현재 Chrome UI 원본/출력 CUA 비교·사용자 직접 검수 | 미실행 |

새 회귀는 장식 표식 없는 원본 문자의 Range 줄 분할·실제 글자 잉크와 같은 브라우저 public 1배 출력의 독립 축소를 기준으로 라벨·두 그림자 영역을 정확히 비교합니다. A5 cover의 흰색·투명 clip 밖 53,704픽셀씩을 전수 검사했고 위반은 0개였습니다. 실제 renderer Canvas를 추적하여 성공·그리기 실패·원본 draw 직후 취소·decode 대기 중 취소/timeout/dispose·10회 반복의 해제를 확인했습니다. 10회는 새 중간 Canvas의 제한된 소유권 관찰이며 기존 lifecycle 40회와 구분하고 장기 heap/native/GPU 누수 부재로 해석하지 않습니다.

새 분기는 두 축 모두 1 이하이고 적어도 한 축이 1 미만인 기존 direct foreignObject/XHTML div·CSS zoom 래스터 경로에만 적용합니다. 원본의 소수 크기를 올림한 중간 Canvas와 최종 Canvas는 각각 한 변8192·면적32,000,000 이내인지 할당 전에 검사합니다. 따라서 최종 크기가 작아도 중간 원본이 한도를 넘으면 OUTPUT_LIMIT이며, capture 입력 전체에 새 제한을 추가한 것은 아닙니다. 임시 Canvas는 작업별 finally에서 해제합니다. 1배 bitmap 축소의 샘플링·선명도 차이는 있을 수 있고 전체 원본 픽셀 동등을 보증하지 않습니다.

집중 비교 기록에서 기존 Chrome DPR2 reciprocal 경로의 PNG 7개와 비대상 SVG/1배/확대/혼합 배율 출력 21개는 이전 renderer와 byte가 같았습니다. 독립 검증자는 해당 해시가 일치함을 확인하고 이 집중 비교는 재사용했으며, 새 전체 gate 결과와 구분합니다. SVG 직렬화·공개 mm 치수와 같은 수치 viewBox·보관 SVG·기본 SVG 반환 경로는 유지합니다. SVG 축소의 글자 줄 배치 문제는 남아 있고 PNG를 SVG에 내장하는 변경은 적용하지 않았습니다.

이전94c19 renderer의 실제 native Safari27.0.1·DPR2는 engine6·cold6·resource15·visual automatic7·paper RGB/기하15, 합계49개 그룹을 통과했지만 A4 라벨 두 줄 재배치는 실제로 재현됐습니다. 이는 현재 수정 전의 역사적 증거이며 새 renderer의 native 통과로 재사용하지 않습니다. 그보다 앞선 A4/JIS 중첩 clip 소실·위치 오류는 출력 좌표 HTML clip/position wrapper와 mm reciprocal viewport로 보완했고 기존15회귀로 유지합니다. Chrome DPR2 cover 경계 바로 밖 한 열의 기존18픽셀·최대RGB2/255 관찰도 넓은 내용 유출과 구분하며 과거 기록으로 보존합니다.

이번 전체 gate 동안 1,770개 파일의 변경·추가는 없었습니다. 새 native Safari·Chrome UI·사용자 직접 검수와 SVG 줄 배치가 남아 있으며 최종 pack은 생성하지 않았습니다. releaseReady는 false이고 원격 CI·게시 승인·G1/G2/G3/G4 조건을 닫지 않습니다. iOS·다른 Safari 버전·범용 CSS·장기 메모리·임의 전역 CSS 격리를 보증하지 않습니다.

## 2026-10-19 · 이전 0.0.2 후보 기록

추가 엔진 경계 검사에서 Chrome UA154는 6/6, native Safari 27.0.1은 4/6을 통과했습니다. Safari의 1000px PNG/JPEG를 100px 루트 img로 캡처한 두 사례에서 출력 중앙 alpha가 0으로 나타나 실제 이미지가 누락됐습니다. CSS 배경 두 사례와 아이콘 두 사례는 통과했습니다. 이는 해당 fixture 순서에서의 관찰이며 루트 img에만 한정된 결함임을 확정하지 않습니다.

후속 WebKit 26.5 진단에서도 같은 누락이 재현됐습니다. SVG decode 완료 후 내부 XHTML img paint가 준비되기 전에 raster를 읽는 경계이며, 서로 다른 PNG byte를 사용하는 cold 대조에서 내부 img의 `decoding="sync"`만 추가하면 최초 public 출력의 네 RGB 영역이 보존됐습니다. 이 근거로 raster 출력용 검증 SVG 복사본에만 해당 속성을 설정했습니다. 원본 DOM·보관한 검증 SVG·SVG 출력·URL·의존성·대기 시간은 바꾸지 않습니다. 수정 뒤 전체·브라우저 회귀 결과는 worklog의 현재 후보 기록과 구분하여 확인합니다.

후속 native Safari probe는 Mac 잠금으로 실행하지 못했습니다. WebKit 진단과 수정은 native Safari 재검증을 대신하지 않으므로 Safari 호환성과 후보 출시 준비는 계속 차단 상태입니다. 기존 Chrome UA154 resource 검사는 첫 사례 후 iframe timeout으로 완주하지 못했습니다. 설치된 Chrome 155.0.8059.80의 변경 전 재검사는 15/15 PASS였으나 과거 timeout의 원인 해결로 단정하지 않습니다. 아래 그림자·clip 개선과 과거 통과 결과도 현재 후보의 재검증을 대신하지 않습니다.

해제한 snapshot의 검증 SVG·렌더러·정리 콜백 참조 유지와 동기 SVG 출력 중 dispose의 TypeError를 수정했습니다. 강제 GC를 사용한 V8 객체 도달성 회귀는 통과했으며 모든 브라우저 heap·native/GPU 메모리 누수 부재를 보증하지 않습니다.

native macOS Safari 27.0.1·DPR2에서 SVG 배율로 발생하던 2배 그림자 손상·중첩 clip 내부 소실을 재현하고 HTML zoom을 적용해 보완했습니다. 후보의 출력 크기·포맷·custom contain/cover/stretch·용지·SVG mm·투명도·거부/취소/해제·40회 반복의 제한된 fixture 검사 7/7이 통과했습니다. 대표 명세서의 2배 원본/출력 CUA 비교에서 카드 그림자와 clip 내부 라벨·사선·원 보존을 확인했습니다. 전체 픽셀 exact 동등, iOS Safari 또는 다른 Safari 버전을 보증하지 않습니다.

이번 image decoding 수정 전 동결한 0.0.2 후보의 전체 verify는 type/build·unit 56/56·consumer 6/6·license/docs를 통과했습니다. 공개 타입·DOM 없는 SSR·소비 bundle과 실제 Chrome UA154(정확 patch 미확인)·native Safari 27.0.1의 Vanilla·React StrictMode·Vue·Svelte 소비를 각각 4/4 통과했습니다. 출력·dispose·URL revoke·진행 중 언마운트 취소·재마운트를 포함합니다. 당시 고정한 source/dist/test/scripts/package/fixture 130개 항목의 변경은 없었습니다.

보안 기준 HEAD의 Standard scan은 확정 보고 0건·coverage partial입니다. 변경한 snapshot/renderer는 별도 focused source review에서 추가 확정 결함·보안 회귀를 보고하지 않았습니다. 두 검토를 수정 후보 전체의 완전 보안 감사로 해석하지 않습니다. 원격 CI·npm 게시·배포는 이 후보에서 수행하지 않았습니다. 아래 0.0.1 결과는 해당 시점의 역사이며 수정한 후보 전체의 새 검증을 대신하지 않습니다.

## 2026-10-16 리뷰 수정 후 최신 검증

Material Symbols의 엔진 자체 폰트 로딩을 제거하고 준비 이미지 재압축을 비활성화했습니다. 대용량 Base64의 반복 그룹 검사에서 발생한 Chrome 스택 초과도 수정했습니다. 변경한 런타임에 과거 byte동일 조건의 검증 결과를 재사용하지 않습니다.

실제 Chrome 155.0.8059.80(headless·macOS·DPR2)에서 기능15/15·자원/SVG15/15·엔진 회귀6/6을 새로 통과했습니다. 엔진 회귀는 기본 deny에서 아이콘 폰트 요청0건, 약3.44MB PNG와 축소 PNG/JPEG 이미지·배경을 포함합니다. 반복30회 실패0·PNG 해시1종·미해제 URL0·DOM 증가0이며 전체 verify는 unit54·consumer6·타입·빌드·라이선스·문서 통과입니다.

10표본 capture→PNG의 p50/p95는 단순5노드16.6/18.1ms, 명세서64노드42.2/47.3ms, 표145노드71.0/76.2ms입니다. 단일 기기 headless 측정이며 SLA나 과거 Chrome154 대비 개선율을 뜻하지 않습니다. 원본·기본·2배·custom·A4·JIS B4 화면 대조에서 텍스트·색·그림자·clip의 눈에 띄는 손상은 관찰하지 않았습니다. SVG mm·Canvas/PNG 일관성도 통과했습니다. 아래 항목은 이전 후보의 역사로 보존합니다. Safari·기타 브라우저 지원과 게시 승인은 계속 별도입니다.

동일한 Chrome155에서 Vanilla·React StrictMode·Vue·Svelte의 출력·dispose·URL revoke·진행 중 언마운트 취소·재마운트4/4를 새로 통과했습니다. 별도 공개 타입·DOM 없는 React/Vue/Svelte SSR·소비 bundle 검사도 통과했습니다.

## 0.0.1 범위

연결된 정적 HTMLElement의 단일 PNG/JPEG·Canvas·foreignObject SVG와 네이티브 지원 시 WebP를 제공합니다. 배율·사용자 크기·ISO/JIS 용지·방향·여백·fit·align·배경을 유지합니다. 자원 준비·SVG 검증 불충족은 오류로 종료합니다.

crop·타일·partial·전체 페이지·Shadow DOM·sticky/fixed·폼/스크롤 상태·PDF·녹화·WebView는 제공하지 않습니다. Edge/Firefox·실제 모바일과 자체 엔진은 후속 검증·개발 범위입니다.

## 과거 증거

2026-10-13 기록에는 verify(type/build/unit 48/consumer 4/license), research 41, Vanilla/React/Vue/Svelte의 실제 Chrome 154·native Safari 27.0.1 소비 8조합, 제한된 자원/SVG 기대 계약 30/30 통과가 있습니다. 정상 캡처 8개와 거부·환경·취소 22개를 구분합니다.

Chrome 원본/2배 출력의 육안 비교는 통과했으나 crop·타일의 과거 strict 실패는 보존합니다. 당시 Safari는 그림자·clip 재현 실패로 정식 지원에서 제외했습니다. 현재 후보의 한정 검증 상태는 상단 기록을 따릅니다. 설치 Chrome 155 정보는 실제 실행 Chrome 154의 증거를 대신하지 않습니다. 정확 runtime patch는 과거 기록에서 미확인입니다.

과거 성공은 해당 소스·설정·의존성·fixture의 증거입니다. 이번 API·출력 정리 이후의 브라우저 검증이나 일반 보안 감사 완료를 뜻하지 않습니다.

## 현재 후보 수용

실제 실행 Chrome 버전을 기록하고 대표 원본·기본·2배·800×600 custom·A4 300 PPI·JIS B4 landscape에서 PNG/JPEG·Canvas·SVG의 치수·내용·그림자·clip을 확인합니다. 전체 형식·브라우저 조합으로 확대하지 않습니다.

코드·타입·패키지 변경 후 verify를 실행합니다. 프레임워크 명령의 타입·SSR·bundle 통과와 실제 브라우저 실행을 구분합니다. 장기 메모리·모바일·범용 CSS·모든 자원 취득 경로는 실행 증거 없이 보증하지 않습니다.

정식 브라우저 지원·최종 패키지 수용·원격 CI 확인과 publish 승인은 별도 출시 조건입니다. 용지 치수는 공개 업체 자료 교차 대조와 mm·방향·픽셀 변환 검증으로 확인하며 JISC 로그인은 필수 조건이 아닙니다.

## 2026-10-15 고정 후보 벤치마크

정리 후 개발 tarball을 실제 Google Chrome 154.0.8037.98·macOS·DPR2에서 확인했습니다. 대표 정적 fixture의 단일 출력·오류·수명주기15/15, 자원/SVG15/15를 통과했습니다. 단순5노드·명세서64노드·표145노드의 capture→PNG 전체 p50은 각각23.8·183.6·306.7ms, p95는26.2·198.9·438.0ms입니다. 각10표본의 nearest-rank p95로 서비스 트래픽의 백분위를 뜻하지 않습니다.

명세서30회 반복에서 실패0·PNG 해시1종·미해제 Blob URL0·DOM 노드 증가0을 확인했습니다. 강제GC·native/GPU 메모리·장기 누수와 저사양 성능은 확인하지 않았습니다. 기본·2배·custom·A4·JIS B4·SVG의 원본/출력 비교에서 눈에 띄는 레이아웃 손상을 관찰하지 않았으며 전체 픽셀 exact 일치는 보증하지 않습니다.

0.0.1 로컬 후보는 이 개발 후보의 런타임을 유지합니다. 기존 framework4종·SSR/type 결과는 dist43파일의 byte동일 범위만 재사용합니다. npm 런타임 감사의 알려진 취약점은0건이며 범용 보안 감사 완료를 뜻하지 않습니다. ISO6개 치수의 기존 원문 대조 값을 재사용하고, 2026-10-16 TAKEO·후지필름의 공개 표에서 JIS6개 치수 일치를 확인했습니다. 리코 표도 A3/A4/A5/B4/B5를 동일하게 제시합니다. ISO/JIS·방향별24조합의 mm·300PPI px 및 실제 raster/SVG 배치 검증을 통과하여 용지 확인 항목은 완료했습니다. JIS 원문은 직접 열람하지 않았으며 규격 전체 적합성이나 인증을 의미하지 않습니다. 공개 출처는 [출력 옵션](output-options.md)을 따릅니다. Chrome 한정 기술 품질 조건부 합격이며 최종 artifact·소스 고정·원격 CI·게시 승인은 남아 있습니다.

## 2026-10-15 정리 검증

최종 코드의 verify는 unit 48/48·consumer 5/5·타입·빌드·라이선스 통과입니다. 보존된 연구 도구 41/41도 통과했습니다. 최종 tarball의 타입·DOM 없는 React/Vue/Svelte SSR·소비 번들을 검사했고 실제 실행 UA Chrome 154에서 네 프레임워크 모두 custom 480×240·SVG·dispose·URL revoke·언마운트 취소·재마운트, React StrictMode를 통과했습니다. 정확 runtime patch는 UA에서 확인하지 못했습니다.

같은 Chrome에서 Playground 기본 640×420·2배 1280×840·custom 800×600 PNG, A4 2480×3508 JPEG, JIS B4 가로 4299×3035 JPEG·364×257 mm SVG를 확인했습니다. 정적 명세서의 노드 대응·PNG/Canvas 기본/2배 일관성·원본 보존·미지원 상태 거부 7개도 통과했습니다. 원본/2배 화면의 육안 비교에서 눈에 띄는 손상은 관찰하지 않았습니다. 원본 전체 픽셀 exact 일치는 판정하지 않습니다.

이 결과는 정리 범위의 회귀 확인이며 Safari·전체 브라우저·최종 출시 수용 선언은 아닙니다. 최종 증거와 적용 범위는 저장소의 2026-10-15 정리 worklog에 기록합니다.
