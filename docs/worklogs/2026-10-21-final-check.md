# 0.0.2 최종 확인 및 Governance v1.12 로컬 적용

작업일: 2026-10-21 KST. 기준 HEAD는 `4168276aff0c8a6fddb2803142bdd02eb86e55ec`다. 기존 dirty tree의 0.0.2 품질 후보와 연구 증거를 보존했다. 승인 범위는 native Safari 최종 확인, 발견한 기존 출력 결함의 로컬 수정과 회귀 검증, Governance v1.12 로컬 적용이다. 새 기능·원격 쓰기·게시·배포는 포함하지 않는다.

현재 상태는 **직접 foreignObject 계열 래스터 축소의 대표 normal text·그림자·clip 복구 및 독립 자동 gate PASS, 새 리비전 native Safari NOT RUN, SVG 축소 줄 배치 미해결**이다. 기술 수용·최종 pack·출시 준비 완료로 판정하지 않으며 releaseReady는 false다. 새 결과는 `output/verification/2026-10-21-scale-resume` 기준이다. 아래 첫 용지 수정·진단 경과는 `output/verification/2026-10-21-final-c5a6d74d` 기준의 역사로 보존하며 [10월19일 기록](2026-10-19-quality-fixes.md)·과거 실패·잠금·tarball을 새 성공으로 대체하지 않는다.

## 새 래스터 축소 수정과 독립 최종 gate

현재 renderer SHA-256은 `d8349ef4a0cba2cfe020c63fade848f891d25d582de6736b1249d38a65630cdd`, snapshot은 `7f32db557003d2e3ca017594b92509941ba971a5913808bfc7358185ca3f854c`, 새 `native-downscale-regression.mjs`는 `30bfacd7e1f88b1d0ca8b6b1774223509b861a1e5b4284dd10b128b18c1ea77b`다. 직접 foreignObject/XHTML div와 CSS zoom 지원이라는 기존 판별을 공유하며 두 축 모두1이하·적어도 한 축1미만인 래스터에만 원본 배율1 Canvas를 먼저 확정한 뒤 최종9인자 drawImage로 축소한다. UA 분기·타이포 override·캐시·의존성을 추가하지 않았다. reciprocal 엔진 경로·실효 배율1·확대·한 축 확대인 혼합 배율·SVG 직렬화는 유지한다.

임시 Canvas는 원본 width/height를 각각 ceil해 할당하지만 배율1 source/draw/clip과 최종 source crop은 실제 소수 크기 그대로다. 중간·최종 Canvas 각각 한 변 8192·면적32,000,000 한도를 할당 전에 검사한다. 따라서 최종 출력이 작아도 이 분기의 중간 원본이 초과하면 OUTPUT_LIMIT이다. capture 입력 전체의 새 제한은 아니며 실제 새 분기에서만 적용한다. core는 checkpoint 뒤 이 OUTPUT_LIMIT만 보존하고 다른 renderer 실패는 ENGINE_FAILED를 유지한다. 중간 Canvas는 작업별 finally에서0×0으로 정리하며 반환 Canvas는 소비자가 소유한다.

표식 없는 tight normal text의 문자별 Range 줄 분할·원본 글자 잉크와 같은 브라우저 public1배 Canvas의 독립 축소를 기준으로 라벨·두 그림자 ROI를 정확히 비교했다. A4 margin 유무·0.869배·500×400 cover·A5 landscape cover·비균등539×360·투명 여백·JPEG를 포함한다. A5 흰색/투명 cover는 clip 밖53,704픽셀씩의 RGBAwhite/alpha0을 전수 검사하여 위반0개였다. 실제 renderer Canvas 추적은 성공·final draw 오류·source draw 직후 abort(중간1개 할당 후 해제)·decode 대기 abort/timeout/dispose(할당0)·10회 반복 해제를 확인한다. 소수620.25×560.5는621×561 할당과620.25×560.5 source crop을 관측하며 반올림된 public1배를 참조로 쓰지 않는다. 중간8192.25×1·8000×4000.25에서 작은 최종 출력의 OUTPUT_LIMIT을 검증했다. 기존 lifecycle40회와 새 분기10회를 구분하고 장기 heap/native/GPU 누수 부재로 확대하지 않는다.

수정 전94c19에서 focused unit3건과 WebKit17개 중13건의 RED를 먼저 보존했다. 구현 후 type/build·focused unit18/18·서버 진입점1/1 및 최종 revision3의 Chrome DPR1 19/19·DPR2 17/17·WebKit DPR2 19/19가 통과했다. [구현 집중 검증 요약](../../output/verification/2026-10-21-scale-resume/diagnostic/raster-implementation-focused-summary.json)에 해시·RED·Canvas 소유권 범위를 보존했다. 초기 시제품 서버의 .mjs MIME=text/plain으로 capture 이전에 막힌 사례는 테스트 환경 오류로 분류·수정했으며 SVG decode 지연의 제품 원인으로 계산하지 않았다.

[독립 최종 gate](../../output/verification/2026-10-21-scale-resume/final-gates/summary.json)는 마지막 소스/테스트 변경 뒤 전체 verify·research를 각각 한 번 실행했다. 1,770개 동결 파일 전후 aggregate는 `6728ac6f3e6985e3bb4bec2179876eef802a09982e4804edaa99bf309b273aec`로 같고 변경·추가0개다. [동결 대조](../../output/verification/2026-10-21-scale-resume/final-gates/freeze-comparison.json)를 원문으로 사용한다.

| 새 리비전 fresh 검증 | 실제 결과 |
|---|---|
| `npm run verify` | exit0 · type/build · unit59/59 · consumer6/6 · license/docs PASS |
| `npm run test:research` | exit0 · 46/46 PASS |
| 설치 Chrome155.0.8059.85 headless DPR1 | 기존 engine6/cold6/resource15/output7/visual7/paper15 + 새 direct 래스터19 =75그룹·7suite PASS |
| 같은 Chrome DPR2 | 기존6suite + reciprocal 경로 회귀17 =73그룹·7suite PASS |
| WebKit26.5 DPR2 | 기존6suite + 새 direct 래스터19 =75그룹·7suite PASS. native Safari 증거 아님 |

총21suite PASS다. WebKit resource의 두 access-control pageerror는 정확한 fixture UUID와 원문 RESOURCE_FAILED로 연결한 의도된 CORS/redirect 거부 사례이며 성공에서 숨기지 않았다. Chrome DPR2 기존 PNG7개 byte동일과 비대상 SVG/1배/확대/혼합 배율21개 byte동일은 구현측 집중 비교의 **재사용 근거**다. 독립 검증자는8파일 해시가 같음을 확인했으며 이 비교를 다시 수행한 것처럼 보고하지 않는다. [비대상 출력 비교](../../output/verification/2026-10-21-scale-resume/diagnostic/unchanged-paths-comparison.json)와 [기존 PNG 비교](../../output/verification/2026-10-21-scale-resume/diagnostic/native-downscale-regression/chrome-dpr2-fallback-comparison.json)를 따로 보존한다. 1배 bitmap 축소의 샘플링·선명도 차이는 있을 수 있으며 전체 원본 픽셀 동등은 주장하지 않는다.

이전94c19의 [실제 native Safari27.0.1 DPR2 재실행](../../output/verification/2026-10-21-final-c5a6d74d/native-postfix-20261021-1/status.json)은 engine6+cold6+resource15+visual automatic7+paper RGB/기하15=49그룹 PASS와 A4 두 줄 재배치 P2의 실제 재현을 함께 기록했다. output/lifecycle7·원본 CUA 비교는 경합 때문에 미실행이었다. 이는 현재 d8349ef 수정 전의 **역사적 근거**이며 새 native 통과가 아니다. 새 d8349ef native는 Mac 잠금 때문이 아니라 다른 thread의 CUA 화면 경합과 SafariDriver 원격 자동화 비활성 때문에 NOT RUN이다. 보안 설정을 바꾸거나 다른 작업의 탭/창을 정리하지 않았다. 새 Chrome UI 원본/출력 비교와 사용자 직접 검수도 NOT RUN이다.

SVG serialize는 변경하지 않았으며 배율1미만 SVG의 원본 줄 배치 보존은 미해결이다. SVG 픽셀/텍스트 구조 보존 기준에 관한 사용자 비동기 질문은 답변 대기이고 PNG를 foreignObject 안에 내장하는 제품 변경은 적용하지 않았다. 다음 조치는 새 renderer의 native Safari 원본/A4 대조, SVG 보존 기준 결정 후 격리된 public SVG의 문자별 Range partition·정규화 기하와 raster 그림자/clip을 함께 보호하는 전용 회귀 및 출력 전략 검토다. 원격 CI·정책·최종 artifact·게시 승인은 별도이며 pack을 만들지 않았다. 문서 단계의 검사와 동결 재확인 원문은 [별도 문서 검증 기록](../../output/verification/2026-10-21-scale-resume/post-documentation-checks.json)에 보존한다.

## 이전94c19 용지 수정과 원인 대조

첫 용지 수정의 `src/output/svg-renderer.ts` SHA-256은 `94c19fec495f0aff2ce926833eb7badb1291e21b821f88bf2eaa22b4675995b2`다. 이번 수정 전 renderer는 `a7ff0b65db3f69314dd157c589f114d1dcb5e04d28d3596ec70e8fc4781aaa5a`이며 `src/core/snapshot.ts`는 `18070b249436e630f61100d8a33d40213ae385609fbeb7b848d26be8129d9432`로 유지한다. 같은 HEAD만으로 dirty tree가 같다고 판단하지 않고 파일 해시를 비교했다.

수정 전 실제 native Safari 27.0.1·DPR2에서 engine 6/6·cold image 6/6·resource 15/15·output/lifecycle 7/7·visual automatic 7/7은 통과했다. 원본·1배·2배·930×840 custom의 CUA 화면 기반 AI 시각 검토는 내용 보존을 확인했다. 그러나 A4 72 PPI·사방 10 mm margin·595×842 PNG에서 중첩 clip의 라벨·사선·원이 소실됐고 JIS B4 landscape 72 PPI·1032×729 PNG에서는 내부 clip 위치가 어긋났다. 원본 PNG에서도 확인하여 미리보기만의 문제와 분리했다. 해당 결과는 이전 renderer의 증거이며 새 수정의 native 통과로 재사용하지 않는다.

관련 원본은 `native/safari-output-A4.png`, `native/safari-output-JIS.png` 및 `native/visual/2d490516-670e-47db-808b-9a82ddeb42e2/2431d7c3-5203-4e4d-9e10-2f77f13fe49d/`에 있다. 이전 native 자동 visual report의 `human-review`/`pending` placeholder는 덮어쓰지 않았다. 별도 AI 검토와 실제 사용자의 직접 검수를 구분한다.

WebKit 대조에서 소수 CSS zoom만 적용한 경우는 정상이나 SVG 조상의 이동과 물리 mm 배율이 더해지면 HTML clip 좌표가 어긋났다. 단순 SVG 위치/viewBox 보정은 cover 내용이 margin으로 새고 mm SVG를 복구하지 못하여 채택하지 않았다. 최종 원인 대조는 출력 좌표의 block HTML clip/position wrapper와 mm 내부 CSS px 좌표·reciprocal SVG viewport 조합으로 내용을 복구했다. 새 div에는 엔진의 tag reset을 고려하여 명시적인 block layout을 설정했다. 근거는 `paper-diagnosis/diagnosis-summary.json`과 원본 matrix/PNG다.

생산 수정은 직접 foreignObject 경로에 한정했다. 기존 HTML zoom·비균등 residual transform·raster 내부 img decoding 힌트, 원래 foreignObject offset, 기존 reciprocal 엔진 경로, 원본 DOM·보관 SVG·기본 SVG 반환 경로를 유지한다. 공개 SVG root는 mm 치수와 같은 수치 viewBox를 유지한다. 공개 API·의존성·UA 분기·대기 타이머를 추가하지 않았다. 임의 전역 CSS와 `!important` 규칙 전체의 격리는 보증하지 않는다.

## 영구 회귀와 수정 전 재현

새 `test/browser/paper-clip-regression.html`은 대표 명세서의 flex·table·둥근 테두리·중첩 overflow clip·라벨·사선·원 구조를 유지한다. 8×8 단색 라벨 표식을 추가하고 독립 계산한 출력 기하 좌표에서 라벨 표식·사선·원 내부 RGB와 clip 밖 배경을 정확히 검사한다. PNG와 Canvas가 서로 같은지만 비교하지 않는다.

15개 사례는 기본·2배·930×840 custom, A4/JIS 72/300 PPI, margin·letterbox·cover·비균등 stretch·투명 margin 및 SVG mm다. SVG root mm 치수와 같은 수치 viewBox를 직접 검사하고, SVG 내용은 self-contained data URI로 decode하여 Blob SVG readback의 별도 taint 문제와 분리했다. 정상 cover crop 밖 source 표식은 명시적으로 구분하며 margin으로 새는 색은 별도 검사한다. 글꼴 glyph 픽셀 exact 일치나 전체 줄바꿈은 이 RGB 검사가 보증하지 않는다.

최초 clip 밖 표식은 원래 outer inset shadow와 겹쳐 기본 대조도 RGB 1~2 차이로 실패했다. 제품 실패가 아닌 테스트 좌표 계약 오류로 분류했다. 원본 PNG의 x589~592는 정확한 배경색이고 x593부터 shadow gradient였다. inner clip right589 밖의 x590.5로 표식을 옮겨 shadow를 피했으며, 이 점은 clip 제거 시 circle fill 안에 들어가므로 clipping 유실도 검출한다. RGB 허용치는 추가하지 않았다. 독립 검토자가 좌표 근거를 확인했으며 `paper-diagnosis/probe-coordinate-classification.json`에 보존했다.

동일한 수정 전 renderer에서 기본·2배·custom 3/3 PASS, 용지 관련 12/12 FAIL을 확인한 뒤 제품을 수정했다. 근거는 `paper-diagnosis/public-regression/baseline-flat-probe-webkit-dpr1/report.json`이다. 초기 12개 fixture와 해시는 `paper-diagnosis/baseline-12/`에 별도 보존했다. 구현 중 typecheck/build와 WebKit 26.5·Chrome 155.0.8059.85 DPR1/2의 15/15 PASS는 진단으로 기록하고 아래 독립 최종 gate와 구분했다.

서버에는 새 HTML/MJS 두 경로만 명시적 allowlist에 추가했다. 기존 서버 회귀의 네 진입점을 보존하고 다섯 번째로 새 fixture를 검사한다. 첫 제한 환경의 `listen EPERM`은 환경 실패였고 동일 focused 명령은 허용 환경에서 1/1 PASS였다.

## 이전94c19의 독립 자동 검증 기록

당시 검증자는 제품·테스트·관련 설정 1,767개 파일을 동결한 뒤 전체 gate를 각각 한 번 실행했다. 전후 aggregate SHA-256은 `049bce75f1f43deae6cd9c6e3c2a924f5ca86ac6fb7b039f0048a5ef24cc3460`으로 같고 변경·추가는 0개다. 근거는 `native/final-gates/summary.json`과 `freeze-comparison.json`이다. 이후 문서 편집은 이 runtime 동결 결과에 포함하지 않으며 별도 docs 검사를 수행한다.

| 검증 | 실제 결과 |
|---|---|
| `npm run verify` | exit0 · typecheck/build · unit 56/56 · consumer 6/6 · license/docs PASS |
| `npm run test:research` | exit0 · 46/46 PASS |
| 설치 Chrome 155.0.8059.85 headless · DPR1 | engine 6/6 · cold 6/6 · resource 15/15 · output/lifecycle 7/7 · visual automatic 7/7 · paper 15/15 PASS |
| 같은 Chrome · DPR2 | 같은 6개 suite PASS |
| WebKit 26.5 · DPR2 | 같은 6개 suite PASS. native Safari 대체 수용이 아님 |
| lifecycle 반복 | 각 설정 40회 관찰. 장기 heap/native/GPU 누수 부재 증명이 아님 |
| 수정 후 native Safari | Mac 재잠금으로 NOT RUN |
| 현재 Chrome UI 원본/출력 CUA 비교 | 앞선 도구 hang 뒤 Mac 재잠금으로 NOT RUN |
| 실제 사용자 직접 검수 | NOT RUN |

Chrome DPR2 cover의 clip 바로 밖 x27/x555 한 열에 기존과 같은 비백색 18픽셀이 남는다. 최대 RGB 차이는 2/255이고 alpha는 모두255이며 두 픽셀 이상 떨어진 내용 유출은 없다. 이전/후보 진단 PNG 해시는 같다. WebKit의 넓은 원색 도형 유출과 구분하고 픽셀 완전 일치로 표현하지 않는다. 허용치를 추가하거나 전체 margin exact-white를 새 계약으로 만들지 않았다. 근거는 `paper-diagnosis/chrome-dpr2-edge-classification.json`이다.

## 이전94c19의 후속 시각 관찰과 SVG 잔여 범위

독립 검토자는 `native/final-gates/webkit-dpr2-paper/default.png`의 한 줄 라벨과 달리 `A4-72-margin.png`·`A4-72.png`에서 라벨이 `중첩 clip ·` / `border` 두 줄로 표시되는 차이를 관찰했다. JIS B4 72 PPI·SVG A4 margin·cover는 한 줄로 관찰했다. 이번 수정의 도입 여부는 미확정이며 안전한 일반 수정안을 확보하지 못했다. 당시 RGB15/15 PASS와 별도로 P2를 기록했고, 위 새 래스터 분기에서 대표 텍스트·그림자·clip을 함께 복구했다. SVG 줄 배치는 별도 미해결이다.

후속 최소 대조에서 표식이 없는 원래 명세서도 A4 축소 시 같은 두 줄을 만들었고, 같은 검증 SVG에서 새 HTML wrapper를 제거해도 동일했다. 표식·새 wrapper를 원인으로 확정하지 않는다. CSS zoom이 1보다 작을 때 font shaping metric이 달라졌다. 원본 text advance95.101608과 element box95.109375에서 배율0.869354839를 단순 적용한 예상 advance는 약82.677이나, 실제 advance83.960732가 사용 가능한 폭83.4375보다 컸다. zoom 후 computed logical element width95.976326은 문자열 advance가 아니며 두 값을 구분한다. text-rendering 대조와 exact width/right:auto 대조는 복구하지 못했다. CSS transform만 사용하는 대조는 줄바꿈을 복구했으나 clip·그림자 손상으로 기각했으며 이 대조 단계의 생산 소스는94c19로 유지했다.

nested SVG image 대조도 한 줄을 복구했으나 그림자 band 손상이 재발하여 기각했다. `font-optical-sizing:none`은 축소 라벨을 한 줄로 복구했지만 원본 advance95.101624를86.887451로 약8.64% 바꾸고 baseline528픽셀·최대RGB235를 변경하여 기각했다. `opsz12`는 baseline byte를 보존했으나 축소 두 줄은 그대로였다. 진단 변형은 제품에 채택하지 않았으며 생산 수정이나 최종 수용 증거로 계산하지 않는다.

당시 후속 계획의94c19 native 대조는 위49그룹 기록과 실제 줄바꿈 재현으로 이어졌다. 이후 래스터 수정과 전체 gate는 위 새 리비전 기록을 따르며 SVG 전용 회귀는 남아 있다. 자동 RGB 통과만으로 텍스트 재배치 해결을 판정하지 않는다.

[통합 줄바꿈 진단](../../output/verification/2026-10-21-final-c5a6d74d/paper-diagnosis/wrap-diagnosis-summary.json)의 최소 회귀 제안은 장식 표식 없는 tight normal text의 원본 Range 줄 분할을 고정하고, 같은 snapshot의 배율1 미만 public SVG를 격리 문서에서 검사하여 줄 분할과 정규화한 block 기하를 비교하는 것이다. 대표 raster 라벨·그림자 비교도 함께 유지하여 transform-only 수정의 손상을 놓치지 않는다. 기대값을 맞추기 위한 typography 변경은 하지 않는다.

첫 용지 수정 직후에는 Mac 재잠금으로 native 검증이 막혔고 이후94c19의 실제 실행은 위 역사적 기록에 추가됐다. 실제 버전 관찰은 Safari27.0.1·macOS27.0.1 build26A434·DPR2다. 현재 d8349ef의 native 미실행 사유는 위 CUA/SafariDriver 제한이며 WebKit을 대신 사용하지 않는다.

## Governance v1.12 로컬 적용

사용자가 승인한 local-only 경로로 검증한 Governance checkout의 `# Comins Contract v1.12`를 읽었다. 해당 checkout HEAD는 `c1ea9cb08edeecc3912b0d32fc17736f5ad3d006`이며 역할 profile 변경은 로컬 미게시 상태다. 공개 canonical 반영·원격 adoption 완료로 표현하지 않는다.

적용 대상은 `AGENTS.md`와 `.codex/config.toml`의 managed 공통 정책, `.codex/agent-roles.md`, `.codex/agent-handoff.md`, 역할10개 및 설치 receipt다. 적용 시 Module Guidance·managed block 밖 설정·당시 제품 소스21개의 byte를 보존했다. focused guidance/role tests21/21, TOML parse, receipt hash, 보존 검사, diff hygiene가 PASS였다. 근거는 `governance-adoption.json`이다.

설정 파일 설치·TOML 파싱은 repository trust 또는 이미 실행 중인 주 모델 변경을 증명하지 않는다. 오케스트레이터가 명시 배정한 실행 역할은 구현 gpt-6.1-sol/high, 독립 검증 gpt-6.1-sol/medium, 설계·진단·독립 리뷰 gpt-6-astra/high다. 로컬 profile의 파일 존재만으로 실제 모델을 추정한 기록이 아니다.

## 변경 파일과 남은 범위

이번 래스터 수정은 `src/output/svg-renderer.ts`·`src/core/snapshot.ts`의 정확한 OUTPUT_LIMIT 전파, `test/unit/capture-pipeline.test.mjs`·새 `svg-renderer-limits.test.mjs`·`native-downscale-regression.html`/`.mjs`, 서버의 exact 두 경로와 연구 GET fixture 목록이다. 첫 용지 회귀15개와 다른 기존 dirty 변경은 보존했다. 이번 최종 문서 단계는 README·docs/README·output-options/support 국영문 및 생성 국문·CHANGELOG·본 기록만 갱신하며 제품·테스트·설정은 바꾸지 않는다. 문서 동기화/정합성/diff 검사와1,770파일 재해시는 위 별도 문서 검증 기록에 보존하며 전체 verify/research를 재실행하지 않는다.

첫 문서 단계의141개 core 대조와 docs42문서·236링크·26JS·6TS 결과는 `paper-diagnosis/post-documentation-core-freeze.json`의 과거 기록이다. 이번 문서 단계는 새 최종 gate의1,770개 해시를 기준으로 확인하여 이전 결과와 구분한다.

| 조건 | 현재 근거와 남은 경계 |
|---|---|
| G1 자원 취득·network deny | 제한된 resource15 근거이며 모든 엔진 취득 경로 완료를 뜻하지 않는다. |
| G2 DOM 호환성 | 지원 정적 입력과 명시적 거부 경계를 유지한다. 대표 래스터 줄바꿈은 복구했으나 SVG 축소 줄 배치와 새 native 검증은 남아 있다. Shadow/sticky/전체 페이지 동등성을 추가하지 않는다. |
| G3 자원·SVG 격리 | 제한된 CSP/CORS/SVG 사례와 기존 보안 검토 범위이며 완전 보안 감사가 아니다. |
| G4 대형 출력·타일 seam | 현재 단일 출력 API 밖이며 닫지 않는다. 재도입 시 별도 검증한다. |

기존 기준 소스 Standard scan의 확정 보고0·coverage partial과 수정 부분 focused review는 해당 범위의 기록으로 유지한다. iOS·다른 Safari 버전·범용 CSS·모든 메모리 누수 부재·전체 픽셀 exact 동등은 주장하지 않는다. 미해결 SVG 줄 배치, 새 native Safari, 최종 artifact, 원격 CI·필수 정책·게시 승인은 각각 남아 있으며 `releaseReady`는 false다. 최종 pack·commit/push·npm 게시·태그/Release·배포는 수행하지 않았다.
