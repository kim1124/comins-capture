# 0.0.2 품질 개선 · 로컬 작업 기록

현재 상태: 추가 native Safari 엔진 검사에서 관찰한 PNG/JPEG 누락을 WebKit에서 재현하여, cold 대조로 확인한 nested image decoding 힌트를 raster 경계에 적용했다. 현재 후보의 전체 gate와 Chrome·WebKit 한정 회귀가 통과했다. native Safari 후속 검증은 Mac 잠금으로 미실행이므로 Safari 호환성·출시 준비 완료로 판정하지 않는다. 아래 과거 통과 결과와 tarball은 그 범위·시점의 증거로 보존한다.

작업일: 2026-10-19 KST. 기준 HEAD는 `4168276aff0c8a6fddb2803142bdd02eb86e55ec`이며 작업 시작 package 버전은 0.0.1이다. 승인 범위는 기존 기능 완성도·메모리 누수·취약점·네이티브 Safari 호환성이다. crop·타일·워터마크 등 신규 기능, 원격 쓰기·commit·게시·배포는 포함하지 않는다. canonical Comins Contract v1.11을 읽고 적용했다. package·lockfile은 0.0.2 로컬 미게시 후보로 맞췄다.

## 확인한 원인과 수정

1. `snapshot.dispose()`가 정리 콜백을 실행해도 snapshot 메서드 closure가 검증 SVG·렌더러·콜백을 계속 참조했다. 소비자가 해제한 snapshot을 보관하면 연결된 대용량 SVG와 DOM/자원 소유권을 수거할 수 없었다. 소유권 묶음을 해제 후 비워 참조를 끊는다. 진행 중 작업이 취소를 무시하면 기존과 같이 종료를 기다린다.
2. `toSvg()` 또는 SVG `toBlob()` 직후 `dispose()`를 호출하면 abort 이벤트가 `active`를 동기적으로 비운 뒤 `active.pending`을 읽어 TypeError가 발생했다. 취소 전에 operation 참조를 로컬에 보존해 취소·반복 해제·DISPOSED 반환 계약을 유지한다.
3. native macOS Safari 27.0.1·DPR2에서 SVG 배율을 적용하면 2배 카드 그림자가 직사각형으로 손상되고 중첩 clip의 라벨·사선·원이 소실됐다. 동일 SVG의 XHTML wrapper CSS zoom2 대조군은 내용을 보존했다. 직접 foreignObject와 XHTML wrapper를 사용하는 구조에서 CSS zoom 능력을 확인해 HTML에 출력 배율을 적용한다. 비균등 stretch는 HTML residual transform을 사용하고 source·clip SVG viewport는 1:1 좌표를 유지한다. reciprocal SVG group/HTML zoom 쌍을 쓰는 기존 엔진 구조는 보존한다. UA 문자열 분기는 추가하지 않았다.

변경 파일: `src/core/snapshot.ts`, `src/output/svg-renderer.ts`, `test/unit/capture-pipeline.test.mjs`, `test/unit/snapshot-retention.test.mjs`, package·lockfile 버전, API·지원 가이드와 생성 국문 참조, README, CHANGELOG, 본 기록. 공개 API·의존성 버전은 바꾸지 않았다. 독립 검증자가 browser fixture와 증거를 소유한다.

## 수행한 진단 검증

- 강제 GC subprocess 회귀: 수정 전 SVG·renderer·정리 소유자 WeakRef 모두 수거되지 않아 FAIL, 수정 후 snapshot을 계속 보관하면서 세 소유자 모두 수거되어 PASS.
- 동기 SVG 출력 직후 해제 회귀: 수정 전 TypeError로 FAIL, 수정 후 SVG 문자열·SVG Blob 모두 DISPOSED로 거부하고 반복 해제 PASS.
- `npm run build` 및 lifecycle·capture-pipeline·snapshot-retention·layout focused unit 24/24 PASS.
- `git diff --check` PASS, `npm run docs:sync` 실행.

현재 진단 대상 `src/core/snapshot.ts` SHA-256은 `18070b249436e630f61100d8a33d40213ae385609fbeb7b848d26be8129d9432`, `src/output/svg-renderer.ts`는 `7f230918e39686ffa4b4a14f6f3338e263387ef08ca13d4b6a0975fbca8fa08a`이다. 이 결과는 구현 중 focused 확인이며 최종 전체 gate·브라우저 acceptance를 대신하지 않는다.

## 보안 기준선과 변경 검토

독립 보안 담당자가 기준 HEAD의 불변 복사본에 Codex Security Standard scan `17cf408e-6744-445b-82ae-d14c7e99c5f2`를 완료했다. 확정 보고 취약점은 0이며 coverage는 partial이다. runtime·URL/resource·CSS/SVG·lifecycle·선택 generated engine·dependency/package/release control의 6개 surface를 검토했으며 docs/research/browser/dev tooling과 upstream 전체 정밀 감사는 제외했다. fresh npm audit 0, Gitleaks 현재 트리 exit0, security 9/9·focused unit 40/40·직접 compiler/engine build·license/hash 검사를 통과했다. 최초 복사본 npm build는 .bin symlink 환경 문제였으며 직접 compiler 실행으로 해결했다.

수정한 snapshot과 renderer의 위 SHA-256에 대한 별도 focused source review는 보안 회귀·추가 확정 결함을 보고하지 않았다. 새로운 URL·실행 sink는 없고 추가 CSS 수치는 검증한 layout plan에서 유래한다. 이 변경 검토와 이전 기준선 Standard partial 결과는 서로 다른 증거이며, 수정한 전체 런타임의 완전 보안 감사를 뜻하지 않는다.

## 최종 로컬 검증과 잔여 한계

독립 검증자의 기존 Safari 실패 기록은 `output/visual-acceptance/3f2856dd-0837-48da-bd36-5d7941914b9e`, CSS zoom2 대조군은 `output/playwright/v002-verification/6e577754-c84b-4a77-a880-5d97e299dc62`에 보존했다. 수정 후보의 제한된 native Safari suite 7/7은 `output/playwright/v002-verification/5c49db96-dce6-4d6f-b034-339a1755def5/report.json`에 있다. 대표 원본/2배 출력 CUA에서 카드 그림자와 중첩 clip 내부 내용 보존을 확인했으나 픽셀 exact 동등을 주장하지 않는다.

source/config/tests/guide를 동결한 0.0.2 후보에 독립 high 검증을 적용했다. 전체 verify type/build·unit 56/56·consumer 6/6·license/docs PASS, native Safari 한정 matrix 7/7 PASS다. 대표 2배 CUA 비교의 그림자·clip 내용 보존은 양성이며 미세 AA/서브픽셀을 포함한 전체 이미지 exact 동등을 뜻하지 않는다.

첫 전체 verify는 unit 56/56을 통과했으나 consumer 5/6에서 package 버전을 0.0.1로 고정한 metadata assertion이 실패했다. 제품 동작이 아닌 버전 변경에 따른 테스트 계약 불일치로 분류했다. 해당 assertion과 후보 테스트명만 정확한 0.0.2로 바꾸고 재동결했다. 실제값을 자기 자신과 비교하는 검사로 약화하지 않았다. 독립 검증자가 전체 gate를 한 번 재실행하여 통과했다.

fresh-cache framework consumer는 `output/framework-consumer/55092786-71fd-4f81-8596-f5ab0908a07f`에서 SSR·public types·bundle build PASS다. Chrome UA154(정확 runtime patch 미확인) 결과 `94d07ed7-0dd6-4d3b-b360-cf93d39a7714`와 native Safari 27.0.1 결과 `b87e9b27-2441-4dc7-bbe2-93e699792db4`는 각각 Vanilla·React·Vue·Svelte 4/4 PASS다. preview 240×120·custom 480×240, dispose·URL revoke·언마운트 취소·재마운트·React StrictMode를 포함한다. 최초 framework 실행의 DNS·기존 cache ENOENT는 환경 오류이며 fresh-cache 실행으로 해소했다.

문서 최종 반영 전 로컬 tarball의 SHA-256은 `b352de3a489824d29a66c11dc1cf2a50b72e11f98fb9919cc2ab74abcbeae1c5`다. inventory 81개 파일·digest·manifest, 추출 파일 81개와 원본 byte 일치, LICENSE·vendor LICENSE·provenance 존재, 추출본 Gitleaks exit0을 확인했다. freeze 장부는 node_modules 제외 source 21·dist 43·test 46·scripts 15·package 2·suite fixture 3의 130개 항목 변경 0을 확인했다. 문서 최종 갱신 뒤에는 runtime gate를 반복하지 않고 docs 검사·diff hygiene와 새 로컬 pack의 artifact identity만 확정한다. 위 tarball을 최종 문서 포함 artifact로 혼동하지 않는다.

추가 Safari 실패 발견 전 문서 반영 시점의 `npm run check:docs`는 문서 42개·언어 10쌍·링크 236개·JS 26개·TS 6개를 통과했고 `git diff --check`도 통과했다. 새 로컬 `output/playwright/v002-verification/comins-capture-0.0.2.tgz`의 SHA-256은 `484e87237b45054432b403703ac58e5ca2034b129ccf30944955dd1248cd17ef`다. 당시 배포 파일 81개 모두 당시 원본과 byte-identical이며 필수 LICENSE·THIRD_PARTY_NOTICES·vendor LICENSE·provenance·엔진 포함, 불필요 경로 제외, vendor SHA/provenance 일치, 추출본 Gitleaks 0건을 확인했다. 본 작업일지는 배포 파일에서 제외되어 이 artifact hash의 기록으로 패키지 내용이 바뀌지 않는다.

이후 추가한 실제 엔진 경계 검사에서 Chrome UA154는 6/6, native Safari 27.0.1은 4/6이다. 실패는 원본 `test/browser/engine-boundaries.mjs`의 downscaled PNG/JPEG root img 두 사례이며, 중앙 pixel alpha 0으로 이미지가 누락됐다. 두 background·두 icon 사례는 통과했다. 원본 fixture를 약화하지 않았다. 제품 출력 결함으로 분류하고, 이전 Safari output matrix 7/7·framework 4/4의 제한된 PASS와 별도 실패로 보존한다.

원인 분리를 위해 output-only image-probe HTML/MJS를 준비했다. 동일 noisy 1000px PNG/JPEG를 100px root img로 렌더링하면서 current 1배/2배, raw SVG, decode 후 250ms 지연, CSS zoom 1배/2배, 이전 renderer 좌표 1배/2배를 비교하도록 했다. native 실행은 `Mac is locked and automatic unlock could not unlock it`으로 수행하지 못했다. 잠금 해제·우회는 시도하지 않는다. 추가 Chrome resource 15 검사는 첫 사례 PASS 뒤 iframe timeout으로 완주하지 못했다. 해당 실행은 최종 자원 15/15 PASS가 아니다.

위 `484e872...17ef` artifact는 이 결함을 지원 문서에 추가하기 전 후보이며 최신 지원 상태를 담은 최종 배포물로 부르지 않는다. source/package/test는 추가 변경하지 않았고, README·지원 문서·CHANGELOG와 본 기록은 미해결 결함·진단 환경 차단을 반영했다. 원인 확인·수정과 관련 재검증 전에는 새 최종 pack을 생성하지 않는다.

자원 byte 한도는 취득 후 적용된다는 SECURITY.md의 기존 경계를 유지한다. streaming 다운로드 제한·iOS Safari·다른 Safari 버전·모든 브라우저·native/GPU 장기 메모리 안정성은 이 결과로 보증하지 않는다. 모든 변경은 로컬 미게시 후보이며 원격 CI·commit/push·npm 게시·태그/Release·배포를 수행하지 않았다.

## 후속 원인 분리와 유지되는 진단 경로

2026-10-19 후속 작업에서 기존 자원 runner를 설치된 Chrome 155.0.8059.80의 headless 실행으로 먼저 검사하여 변경 전 15/15 PASS를 확인했다. 증거는 `output/playwright/v002-resume-verifier/resource-baseline.json`과 `output/research/resource-acceptance/ca00bb13-8d8a-49bf-8730-a2e0789ec774`다. 과거 Chrome UA154 실행의 두 번째 iframe timeout은 재현되지 않았으며, 원인 해결이나 제품 결함 수정으로 판정하지 않는다.

`test/browser/resource-runner-bootstrap.mjs`와 frame 대기 helper를 추가하여 문서 요청·응답, bootstrap, import, setup/capture/save, CSP·console·window 오류와 결과 전달 단계를 기록한다. 45초 한도와 기존 15개 사례·network/SVG/원본 불변·픽셀 assertion은 유지한다. timeout은 navigation/bootstrap/import/case 단계별로 분류하고 결과가 오지 않아도 제한된 loopback 서버에 진단을 보존한다. frame 메시지는 source·origin·run이 모두 맞아야 수락한다. 서버는 fixture·built 파일 allowlist, 기존 CSP, 2개 loopback origin을 유지한다.

추출한 기존 frame 대기 동작에서 단계 기록·timeout 분류 검사 2개가 FAIL했고 navigation error는 완료되지 않았다. 개선한 focused runner·server 회귀는 5/5 PASS다. 최초 샌드박스 실행은 loopback `listen EPERM` 환경 오류였으며 허용 환경에서 같은 검사를 통과했다. `npm run test:research`는 새 5개를 포함하여 46/46 PASS다. 이 결과는 브라우저 실행 결과를 대신하지 않는다.

`test/browser/image-boundary-probe.html`은 동일한 1000px PNG/JPEG를 100px 루트 img·div 내부 img에 사용한다. 직접 raster의 네 RGB 영역을 독립 기준으로 삼고 raw/current/previous SVG, 1배·2배 public 출력, 동일 Image의 즉시·250ms 후 draw, `decoding='sync'`, 세 인자·다섯 인자 drawImage 및 cache nonce 유무를 대조한다. 이전 엔진의 reciprocal SVG scale·HTML zoom 쌍을 보존하며 부모 chain과 wrapper zoom을 기록한다. 250ms 대기는 이 진단 fixture에만 존재한다. 실제 브라우저 결과를 확인하기 전 특정 대조를 원인으로 확정하지 않는다.

리소스 서버에서 `/image-boundary-probe.html?save=1` 또는 `/engine-boundaries.html?save=1`을 열어 실행할 수 있다. 후자는 원래 6개 사례와 중앙 alpha assertion을 유지하며, 실패 시 raw 검증 SVG·실제 renderer 직렬화 SVG·출력 PNG와 SHA-256을 저장한다. 증거 API는 작성 fixture 전용 종류·파일명·파일 수·본문 크기를 제한하고 `output/research/resource-acceptance` 아래에만 쓴다. SVG/base64 원문은 console에 출력하지 않는다.

기존 G1–G4와 현재 범위의 대응은 다음과 같다. 이는 release 조건 면제나 전체 gate 완료 선언이 아니다.

| 조건 | 이번 작업의 관련 증거와 남은 경계 |
|---|---|
| G1 엔진 자원 취득·network deny | public resource 15 사례의 정책·요청 센서. 현재 후보·브라우저별 전체 결과가 필요하다. |
| G2 ID·Shadow·sticky 등 DOM 호환성 | 기존 지원 정적 입력과 명시적 거부 경계를 유지한다. 광범위 DOM·Shadow·sticky 기능 동등성은 이번 품질 수정의 완료 주장에 포함하지 않는다. |
| G3 자원·SVG 활성 내용 격리 | resource 15의 control/probe·CSP/CORS·SVG document/img 사례. 정식 보안 감사 전체 coverage로 확대하지 않는다. |
| G4 대형 출력·타일 seam | crop·타일이 제거된 현재 단일 출력 API의 범위 밖이다. 향후 재도입 시 별도 검증하며 이번 작업에서 닫지 않는다. |

## Cold 이미지 paint 원인과 최소 수정

실제 설치 Chrome 155.0.8059.80은 원본 엔진 6/6을 통과했고, WebKit 26.5는 기존 native Safari와 같은 PNG/JPEG 사례 2개를 실패하여 4/6이었다. 두 browser engine과 native Safari 증거를 구분한다. 같은 Blob을 뒤 사례에서 재사용하는 원래 순서에는 cache warmup이 개입할 수 있으므로 root img에만 한정된 결함임을 확정하지 않는다.

초기 넓은 probe의 `immediate`는 draw 시점이 즉시였으나 pixel readback은 250ms 후였으므로 paint 시점의 원인 증거로 사용하지 않았다. 유지되는 `image-paint-probe`는 동기 readback, 원래 Canvas의 후속 readback, 같은 Image의 후속 재draw를 분리한다. cold PNG byte를 사례마다 바꾼 결과 원래 public Canvas는 즉시·다음 task·250ms 후 모두 투명했고, 같은 Image를 나중에 다시 그릴 때만 네 RGB 영역이 나타났다. 실제 renderer Image의 SVG와 진단 직렬화본은 SHA-256·길이가 같았다. outer Image의 `decoding='sync'`와 렌더 직전 exact nested PNG URI의 추가 decode는 각각 실패했다.

내부 XHTML img의 `decoding="sync"`만 바꾼 cold 단일 대조에서는 최초 public Canvas의 동기 readback부터 네 RGB 영역이 정상인 반면, 같은 DOM parse·serialize만 적용한 음성 대조는 계속 투명했다. 이 근거로 `src/output/svg-renderer.ts`의 `compose`가 raster plan(`unit==='px'`)을 처리할 때 parsed 검증 SVG 복사본의 XHTML namespace img에만 해당 속성을 설정한다. source DOM·보관 SVG·SVG 출력·URL·의존성·타이머는 바꾸지 않았다. 현재 renderer SHA-256은 `a7ff0b65db3f69314dd157c589f114d1dcb5e04d28d3596ec70e8fc4781aaa5a`다.

원래 엔진 6개 사례·alpha assertion을 유지했다. 새 `image-cold-regression` 6개는 독립 byte의 PNG/JPEG img·div 입력, PNG 2배와 투명 PNG를 실제 public API로 출력해 geometry·원본 불변·동기 네 영역 RGBA/RGB를 검사한다. Image subclass·SVG 속성 주입·대기가 없는 회귀다. 진단용 `control=nested-sync`는 수정 뒤에도 음성 대조가 유지되도록 내부 속성을 명시적으로 auto/sync로 바꾸며, 이 주입 진단을 public 무주입 acceptance로 계산하지 않는다.

최소 수정 후 `npm run build`, 새 fixture syntax, `npm run docs:sync`, `npm run check:docs`(42문서·10언어쌍·236링크·26JS·6TS), `git diff --check`가 통과했다. 최종 전체 verify와 관련 browser 결과는 아래 후속 기록에서 별도로 확정한다. native Safari 미실행은 계속 남아 있으며 최종 배포물·게시 완료로 판정하지 않는다.

독립 high 검토에서 새 서버의 engine HTML 진입점이 기존 절대 module 경로를 제공하지 못하는 404를 발견했다. 기존 HTML·assertion을 바꾸지 않고 해당 module 경로 하나만 명시적 allowlist alias로 추가했다. 4개 유지 fixture HTML에서 실제 script src를 추출하여 GET 200을 검사하는 HTTP 회귀를 추가했고, 관련 runner/server 5/5 PASS와 diff hygiene를 확인했다.

## 수정 후보 최종 로컬 결과 · 2026-10-19 11시 KST

현재 상태는 **로컬 구현·검증 PASS, native Safari 수용 대기**다. 최종 상태는 [현재 후보 증거 요약](../../output/playwright/v002-resume-verifier/status-final.json)에 기록한다. 이전 `output/playwright/v002-verification/final-audit-status.json`은 이전 후보의 실패 기록으로 보존하며 덮어쓰지 않았다. 최종 renderer SHA-256은 `a7ff0b65db3f69314dd157c589f114d1dcb5e04d28d3596ec70e8fc4781aaa5a`, snapshot은 `18070b249436e630f61100d8a33d40213ae385609fbeb7b848d26be8129d9432`다.

독립 medium 검증자가 source/dist/test/scripts/docs/package와 fixture 1,849개 파일을 동결한 뒤 전체 gate와 브라우저 검사를 실행했다. 실행 후 비교는 변경 0·추가 0이다. 결과 저장 후 검증자 모델 capacity 오류가 발생하여 해당 역할은 중단했으며, 다른 모델로 검사를 대체하거나 성공한 gate를 재실행하지 않았다. 독립 high 검토자가 저장된 결과와 변경 경계를 확인했다. 아래 결과는 실제 저장한 현재 후보 실행 기록에 근거한다.

| 검증 | 현재 후보 결과 |
|---|---|
| `npm run verify` | typecheck·build·unit 56/56·consumer 6/6·license·docs PASS |
| `npm run test:research` | 허용 환경에서 46/46 PASS. 첫 제한 환경의 45/46은 loopback `listen EPERM`이었으며 제품 실패와 분리 |
| Chrome 155.0.8059.80 · headless · DPR2 | 원본 엔진 6/6, cold 이미지 6/6, 자원/SVG 15/15, 출력·수명주기 7/7, 자동 시각 일관성 7/7 PASS |
| WebKit 26.5 · headless · DPR2 | 동일 다섯 검사 각각 6/6·6/6·15/15·7/7·7/7 PASS. native Safari 지원 증거로 계산하지 않음 |
| 최종 freeze 비교 | 1,849개 검사·변경 0·추가 0. 이후 본 worklog만 결과 기록 |
| native Safari · 현재 수정 후보 | NOT RUN: Mac 잠금. 후속 사용자 환경에서 검사 필요 |

브라우저 원본은 `output/playwright/v002-resume-verifier/browser-final-chrome.json`, `browser-final-webkit.json`이며 전체 gate는 같은 폴더의 `verify-final.log`, `research-final-permitted.log`, 동결 비교는 `final-freeze-comparison.json`에 있다. 두 browser의 resource 증거는 `output/research/resource-acceptance/a52cf467-a9fb-4564-aa74-499f60ff0fd9`다. 출력·수명주기 저장본은 Chrome `c3e86100-fc70-4a4e-a955-7060ae622eff`, WebKit `08a6b56c-0f6f-44b9-be1a-6fb135e679e8` 하위 report이며 각각 40회 반복·URL·listener·DOM 카운터를 포함한다. 장기 heap·native/GPU 수거를 보증하지 않는다.

자동 시각 검사는 Canvas/PNG 일관성·2배 출력·원본 불변·지원하지 않는 sticky/fixed/scrolled 거부를 확인했다. 원본 화면과 출력의 새 CUA·human review는 pending이며 자동 PASS를 전체 픽셀 동등이나 시각 수용 완료로 확대하지 않는다. resource 실행의 예상 CORS/CSP·redirect·abort 오류와 frame 제거 시 diagnostic fetch 취소는 원본 event log에 보존했다. 각 15개 사례의 network/SVG/픽셀 assertion은 모두 통과했다.

실패 음성 대조와 nested sync 양성 대조는 `output/playwright/v002-resume-verifier/paint-probe-nested-sync-webkit.json` 및 `output/research/resource-acceptance/1784fafc-115b-422d-8289-be32214ed33a`에 보존했다. 수정 후 수용에는 이 속성 주입 probe를 사용하지 않았으며 실제 public API의 무주입 cold 회귀를 사용했다.

현재 수정 후보의 native Safari 수용, 새 원본/출력 시각 비교, 최종 패키지·원격 CI·게시 승인은 남아 있다. 이전 framework 4/4 결과는 image decoding 수정 전 기록이며 현재 runtime의 새 browser framework 실행으로 바꾸어 부르지 않는다. Safari 수용 전 최종 pack을 새로 만들지 않았다. 이번 검증자가 시작한 6006/6007·6026/6027·6011·6030 임시 서버는 PID·명령·시작 시각·cwd·listen port를 대조해 해당 프로세스만 정상 종료했다. 기존 6014/6015·6016 서버는 보존했다.
