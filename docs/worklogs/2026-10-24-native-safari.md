# Native Safari 인수와 pending decode fixture 보완

- 작업일: 2026-10-24 (Asia/Seoul)
- 상태: 제한된 native Safari 검증·로컬 fixture 보완·영향 Chrome/WebKit 회귀 확인 완료. 출시 준비 완료 판정은 아니다.
- 구현 동결: 2026-10-24 08:07:30 KST. native 후속 요약: 08:09:28 KST. Chrome/WebKit 후속 완료: 08:10:51 KST.
- 기준: PR #5 Draft의 head `7d1bf97433edd1d33bcccd43f0a649742c07558e`. 이번 fixture와 본 리포트는 로컬 미커밋 변경이며 해당 PR head에 반영되지 않았다.
- 모델: 구현 Sol 6.1/medium, 독립 native 및 Chrome/WebKit 검증 Sol/high로 배정했다. 실제 런타임 모델 식별 메타데이터는 노출되지 않았다.
- 적용 정책: 승인된 local-only Comins Contract v1.12는 미게시 상태다. 기존 Governance dirty 15파일은 별도 작업으로 보존했다.

## 문제와 관측 원인

실제 macOS Safari 27.0.1 (22625.1.29.11.28)·물리 DPR2·viewport 1512×859에서 11개 authored suite 중 기존 10개는 통과했으나 `native-downscale-regression`이 iframe 180초와 별도 visible 문서 180초 내 완료되지 않았다. 진단 사본은 앞선 13개 조건을 통과한 뒤 `pending decode abort drains without Canvas retention`에서 정지했다. `mockDecodeEntered=false`, `startedPending=true`인 동안 실제 native 이미지 decode는 완료되고 public `toCanvas`도 성공했으나 fixture는 hook 진입 Promise만 무기한 기다렸다. 이는 제품 출력 실패와 구분한 테스트 계약 결함이다.

추가 관찰에서 원본 요소의 document/window realm은 같고, `window.Image`와 `source.ownerDocument.defaultView.Image` 모두 교체한 Mock 생성자와 같았다. 그런데 실제 renderer 이미지 생성은 Mock constructor를 거치지 않았고, 인스턴스의 prototype/decode는 src 설정 전후 모두 native 경로였다. 별도의 no-src subclass 관찰은 정상 동작했으므로 Image subclass 일반 미지원으로 단정하지 않았다. Safari가 이 renderer 경로에서 생성자 교체를 반영하지 않은 사실까지 확인했으며 엔진/JIT 내부 근본 원인은 미확정이다.

원래 실패·진단 raw는 `output/verification/2026-10-24-native-ui/aggregate/report.json`, `standalone/report.json`, `downscale-stage/report.json`, `root-cause/report.json`에 보존했다. 무기한 대기의 집중 Node 재현은 `output/verification/2026-10-24-native-fixture-fix/precondition-before.log`의 기대한 FAIL이다. 이 Node 검사는 native 엔진 원인을 입증하는 검사가 아니라, 출력이 먼저 종료된 경우에도 fixture가 대기하는 계약을 재현한다.

## 최소 변경

변경한 실행 파일은 `test/browser/native-downscale-regression.mjs` 한 개다. 생성자 subclass 교체 대신 해당 pending 구간의 실제 `HTMLImageElement.prototype.decode`를 임시 래핑하여 원본 native 메서드를 올바른 this/인자로 호출하고, 성공 후 기존 entered/gate를 적용했다. 원본 descriptor 전체를 보관하고 `finally`에서 복구하며 gate와 snapshot도 해제한다. public output이 hook 진입보다 먼저 settle되면 명시적인 precondition 실패를 기록하도록 Promise race를 추가했다.

기존 17개 assertion 문장, timeout 100ms, ABORTED/TIMEOUT/DISPOSED 기대 코드, 출력 옵션·픽셀/그림자/clip 비교·Canvas 해제·BUSY/drain 계약은 유지했다. skip·기대값 완화·시간 연장으로 통과시키지 않았다. fixture SHA-256은 변경 전 `30bfacd7e1f88b1d0ca8b6b1774223509b861a1e5b4284dd10b128b18c1ea77b`, 변경 후 `db698d61ae4e9036ea3716871137e6ffa3d46f20867cd6f1f7e8f47cb677854d`다.

제품 src·dist·package 69파일의 전후 해시는 동일했다. 전체 native 검증의 기존 1,764개 입력에서도 변경은 해당 fixture 한 개였으며 제품 코드·의존성·사이트·Governance·원격 Git은 변경하지 않았다. 본 fixture 작업에서 tarball 재생성은 0회다.

## 검증

- 의미 있는 fixture 변경 후 `npm run verify` 1회 PASS: typecheck/build, unit 84/84, consumer 6/6, licenses/docs. 로그: `output/verification/2026-10-24-native-fixture-fix/verify.log`. 문법·diff 검사 PASS와 원본 assertion/옵션 보존·해시 비교는 같은 경로 `handoff.json`을 따른다. Node 집중 재현은 수정 후 `precondition-after.log` PASS로 명시 실패·정리가 동작함을 확인했다.
- 실제 Safari 원본 fixture 재실행 19/19 PASS: pending decode abort/timeout/dispose, drain/BUSY, fractional crop, OUTPUT_LIMIT 및 기존 이미지/clip/그림자/Canvas 해제 조건을 포함한다. 원본 report 완료·error 0과 native UI의 STANDALONE PASS를 확인했다. 증거: `output/verification/2026-10-24-native-ui/final-downscale/report.json`과 이미지 9장.
- 관련 제품·runner가 변하지 않은 기존 10개 native suite PASS는 재사용했고 실패한 suite만 수정 후 재실행했다. 합계는 11 suite/175조건이다: CSS19, engine6, cold image6, resources15, outputs/lifecycle7, visual automatic7, paper clip15, native downscale19, SVG layout7, text-run23, flow51. 모든 suite를 수정 뒤 다시 실행한 결과로 표시하지 않는다.
- native 보충 검증: 실제 Table 0.2.2 CSS 전체 52,731bytes를 주입한 비관련 대상의 320×240 PNG가 clean 대조와 byte 동일하고 원본 DOM도 불변이었다. default 620×560·2배 1240×1120·custom 900×600·A4 2480×3508·JIS B4 1032×729의 PNG/JPEG 치수, 같은 출력의 PNG/Canvas 채널 일치와 SVG의 문서화된 단위를 확인했다. default/A4는 `supplement-first/report.json`의 해당 PASS만, 나머지는 `supplement/report.json`의 PASS를 사용한다. 첫 보충의 INVALID_TARGET/INVALID_OPTIONS 실패는 수정된 검증 입력과 구분하여 보존했다.
- native 화면에서는 대표 원본/default와 2배/custom의 텍스트·표·그림자·clip 보존을 제한적으로 관찰했다. source 스크린샷과 출력의 픽셀 동일성 또는 사용자 직접 인수는 판정하지 않았다. 최종 native 종합 근거: `output/verification/2026-10-24-native-ui/summary.json`.
- 공통 hook 변경의 해당 fixture를 독립 Chrome/WebKit에서 설정별 정확히 1회 재검증했다. 설치 Chrome 155.0.8059.86 DPR1은19/19, DPR2는17/17, WebKit26.5 DPR2는19/19 PASS다. 기존 direct/reciprocal 분기에 따른 조건 수 차이는 그대로이며 조건을 생략하거나 강제하지 않았다. 각 실제 fixture 응답 SHA가 고정 해시와 같고 decode 원본 descriptor 복구·페이지 오류0을 확인했다. 소스·runtime 검증85항목 전후 변경0이며 다른 suite나 전체 verify는 반복하지 않았다. 근거: `output/verification/2026-10-24-native-fixture-fix/chrome-webkit/summary.json`, `run.log`, 브라우저별 JSON 및 `freeze-after-check.json`.

## 별도 artifact 진단과 잔여 조건

이번 fixture 작업 전 별도 생성한 로컬 진단용 0.0.2 artifact는 `output/verification/2026-10-24-artifact-diagnostic/verification/summary.json`에서 독립 검사 PASS를 확인했다. 기존 checker로 83파일 목록·정확 source bytes·추출·추출본 Gitleaks·license·격리 설치/소비·SSR·공개 타입을 검사했고 root dist 45파일이 일치했다. 최초 registry DNS ENOTFOUND 환경 실패와 허용 환경 재실행 PASS는 구분한다. 이는 로컬 diagnostic artifact 결과이며 canonical release artifact가 아니다. fixture 보완 후 다시 pack하지 않았고 검사한 기존 artifact를 최종 workflow artifact 또는 npm/OIDC 게시 provenance의 증명으로 승격하지 않는다.

이번 결과는 실제 Safari 27.0.1·DPR2·정해진 viewport/fixture의 제한적 인수 증거다. 일반 Safari 호환성, 다른 Safari 버전·iOS·물리 모바일·임의 CSS, 모든 SVG 외부 확대의 fidelity와 장기 heap/native/GPU 누수 부재를 보장하지 않는다. bounded Canvas 소유권 검사와 screenshot 관찰을 전체 메모리 증명이나 source 픽셀 exact 동등으로 해석하지 않는다.

최종 canonical package artifact·해당 provenance/보안 조건·게시 신원·registry/OIDC와 원격 workflow의 실제 단계 증거 및 명시적 게시/운영 반영 승인이 남는다. 과거 0.0.1의 예외나 로컬 artifact PASS로 대체하지 않는다. `releaseReady=false`를 유지하며 로컬 fixture/리포트는 현재 PR head와 별도다. 본 작업에서 stage/commit/push/PR 변경·merge·publish/deploy는 수행하지 않았다. 독립 native 검증 소유 탭과 서버는 종료했고 기존 사이트 4328 서버는 보존했다.

후속 문서 정합성: `docs/release-readiness.md`의 상단0.0.2 판정을 2026-10-24 증거로 갱신하고 아래0.0.1 이력과 공식 지원 guide는 보존했다. PR5 head7d1bf974의 기존67파일·OPEN Draft·CI39978904763 Package/Sensitive data SUCCESS와 후속 로컬 미커밋3파일(native-downscale fixture·본 리포트·release-readiness)의 미반영 상태를 구분했다. 기존24/24·CSS56 기록 재사용, native11suite/175의10suite재사용+19재실행, Chrome/WebKit 해당 fixture19/17/19, 진단artifact83파일PASS와canonical/OIDC/identity 미완료를 반영했다. source/Governance/원격은 변경하지 않고 check:docs·diff 검사만 수행하며 새 full verify·browser·pack·stage/commit/push는 실행하지 않았다.
