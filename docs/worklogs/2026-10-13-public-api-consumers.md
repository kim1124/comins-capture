# 공개 API·Playground·프레임워크 소비 연결

작업일: 2026-10-13 KST. 로컬 구현·비파괴 검증. npm 미배포, commit/push/publish 미수행.

> 2026-10-13 후속 버전 정정: 아래 원문에 기록한 Chrome 155.0.8059.40은 설치 정보입니다. 실제 소비 결과 JSON의 실행 UA는 `Chrome/154.0.0.0`이며 정확 runtime patch는 미확인입니다. 기존 결과 자체와 원본 JSON은 보존하되 155 실행 지원 주장은 철회합니다. 네이티브 Safari 27.0.1 표기는 유지합니다. 근거: `output/research/release-acceptance-2026-10-13/browser-version-errata.json`. 새 자원/SVG 및 시각 실패 판정은 [후속 리포트](2026-10-13-release-acceptance.md)에 별도로 기록합니다.

## 결과

루트 capture/CaptureError와 snapshot·출력 타입을 Playground 및 네 프레임워크 예제에 연결했다. 실제 tarball 설치본에서 Chrome 155.0.8059.40·네이티브 Safari 27.0.1의 8조합을 통과했다. 전체 브라우저 지원·G1~G4 완료 또는 출시 승인을 뜻하지 않는다.

## 수정과 근거

- src/capture.ts·index.ts·errors.ts: SSR import 안전한 공개 진입점, 정적 HTMLElement·failure:error 제한, 엔진 비노출 타입.
- src/engine/dom-adapter.ts·vendor/snapdom.d.mts: 변수 dynamic import가 consumer esbuild의 엔진 chunk에서 누락되어 Vanilla/React/Vue가 ENGINE_FAILED가 되는 실패를 확인했다. literal import로 엔진을 번들 의존 그래프에 포함했다. 같은 소비 검사의 수정 후 성공으로 확인했다.
- examples/frameworks: capture 결과·AbortController·snapshot·Blob URL을 예제가 소유한다. Svelte의 즉시 클릭에서 tick 이전 target을 전달해 INVALID_TARGET이 발생했다. tick 이후 참조를 읽도록 수정했다. React StrictMode의 effect 재설정·해제도 검사했다.
- playground/app.mjs·index.html·style.css와 scripts/dev-server.mjs: lab adapter 대신 public capture 사용. crop/custom/paper/fit/background와 코드 표시, 취소·dispose·URL revoke 연결.
- test/unit/playground.test.mjs: 이전 lab adapter 및 SVG 크기 무시 계약의 VM fixture 2건이 실패했다. 공개 API 옵션 전달·실패 정리·진행 중 취소의 3건으로 갱신했다. 브라우저 엔진 검증과 구분한다.
- scripts/framework-consumer.mjs·framework-server.mjs, test/frameworks 및 별도 package/lock: tarball 설치·타입·SSR·browser bundle·네이티브 브라우저 결과 저장. root test:frameworks 명령 추가. 프레임워크는 테스트 전용이며 제품 runtime 의존성에 추가하지 않았다.
- README, CHANGELOG, docs/guide, examples 안내: 실제 capture 계약·기본값·미지원 입력·출력·수명주기·재현 명령으로 갱신했다. scripts/engine-supply.mjs provenance 설명도 현재 공개 연결 상태로 수정했다. website 저장소는 변경하지 않았다.

## 검증

| 검사 | 최종 결과 |
|---|---|
| npm run verify | typecheck/build, unit 48/48, consumer 4/4, 라이선스 통과 |
| npm run test:research | 41/41 |
| node --test test/integration/resource-http.test.mjs | 2/2 |
| 설치 tarball 타입·Node SSR | 통과, React/Vue/Svelte 서버 렌더 |
| 실제 Chrome/native Safari | 각 Vanilla/React/Vue/Svelte 4/4 |
| Playground 실제 UI | 두 브라우저 기본 PNG·A4 JPEG·SVG mm·crop/custom·invalid·reset 확인 |
| WebP | Chrome 생성, Safari FORMAT_UNSUPPORTED |
| Playground 취소 | 단위 검사 통과; 실제 브라우저 빠른 취소 버튼 timing은 별도 미실행 |
| 패키지 | files 경계·원문 라이선스·수정본 hash 검사 통과, 추출본 Gitleaks 통과 |

프레임워크마다 PNG 240×120, crop 480×240 및 지정 색상 픽셀, A5 SVG mm, 6타일, dispose 후 typed error, URL revoke, 진행 중 언마운트 취소, 재마운트를 확인했다. React StrictMode cleanup도 확인했다. 원본 전체 화면과 캡처의 픽셀 비교나 메모리 leak 장기 측정은 아니다.

npm install의 네트워크 ENOTFOUND는 실행 환경 실패로 분류하고 중지했다. 캐시의 고정 의존성을 사용하는 npm_config_offline=true로 재현했다. localhost listen EPERM은 허용된 로컬 서버 실행에서 해결했다. 실패/이전 run을 삭제하거나 성공으로 바꾸지 않았다.

## 고정 증거

- 최종 run: `output/framework-consumer/24aa1081-a005-4f23-8c70-38beb780b1f3/`
- tarball: `comins-capture-0.0.0-dev.0.tgz`
- SHA-256: `82b6fa9952c910d183144d835fdce114a887f94b5f94b5354f7b1bc681a3e6a1`
- 소비 결과: 위 run의 `results/*.json`, `manifest.json`, `ssr.log`
- 최종 증거·소스 해시·화면: `output/research/public-api-final/manifest.json` 및 같은 디렉터리
- 첫 실패: `0aeefa05-31c1-4788-8d5e-8fa583075009/results/`; 첫 수정 성공: `62fb4ac0-eb41-4f7c-a567-d838f2baff9a/results/`

이 기록과 HANDOFF는 package files 밖에 있다. 최종 tarball 이후 제품 코드·예제·배포 가이드는 변경하지 않았다.

## Git·정책·남은 범위

시작 HEAD는 a35dbe2(Governance v1.11 공통 지침 적용), branch codex-capture-initial이다. 이전 HANDOFF의 “HEAD 없음”은 현재와 달랐다. 제품 파일은 여전히 untracked이며 보존했다. 시작 시 v1.11 지침을 확인했다. 진행 중 다른 작업의 AGENTS/.codex v1.12 로컬 변경을 발견했고 덮어쓰지 않았다. 미커밋 정책 변경을 공개 적용 완료로 보고하지 않는다.

G1/G2/G3/G4 확대 검증, Edge/Firefox·실제 모바일, 복잡한 실사용 DOM 및 CSS/폰트, 정식 취약점 검토·출시 패키지 검증, website 한·영 문서 동기화가 남아 있다. 이번 Gitleaks는 정식 Codex Security 취약점 감사 대체가 아니다. 정책 commit을 기준으로 한 working-tree 전체 scan은 초기 제품 전체와 별도 거버넌스 작업이 섞이므로 이 변경의 확정 diff scan으로 보고하지 않는다.

native Safari WebP 미지원, 과거 Chrome JIS B4 타일 경계 RGB 최대 1/255 차이와 foreignObject Blob URL의 Canvas 재사용 제약은 유지한다. 과거 Chrome 154 출력 기하 결과를 Chrome 155 전체 회귀 완료로 확대하지 않는다.

검증을 위해 실행한 6004·6005 서버 및 이 작업의 Chrome/Safari 탭을 종료했다. 다른 앱·프로젝트·사용자 탭과 디스크 증거는 보존했다.
