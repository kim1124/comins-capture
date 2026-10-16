# 최초 배포 범위 코드 정리

작업일: 2026-10-15 KST. 사용자 지시: 구현 도중 중단·미구현된 코드는 제품에서 제거하고 차기 버전 memory로 이월한다. 정리·회귀 검증·memory 저장 완료이며 출시 승인·Safari 품질 해결은 아니다.

## 변경 내용

- 삭제: src/geometry/tiles.ts, src/output/tile.ts, src/engine/snapdom-adapter.ts.
- API·타입: planTiles, snapshot.tiles, CaptureTile/TileOptions, crop 옵션 및 crop/totalWidth/totalHeight meta, failure/allow-partial·partial 성공 경로 제거. runtime export는 capture/CaptureError/paperSize 세 개다.
- 출력: SvgRenderer를 전체 단일 출력 계약으로 정리하고 EngineAdapter의 미사용 raster stub, Safari 전용 미완성 wrapper·타일 좌표 경로 제거. 기본·배율·DPR·custom·용지·fit/align·background와 일반 출력 clipping 유지.
- 자원·수명주기: 사용하지 않는 ResourceKind css/svg와 단순 operation helper 제거. 실제 지원 kind는 image/font. 원본 보존·unsupported 명시 거부·deny/resolver·SVG 검증·취소/timeout/dispose·단일 Canvas 한도 유지.
- Playground: crop 설정·옵션·초기화 코드 제거. 예제·타입/consumer/unit·framework/browser fixture를 현재 API에 맞춰 정리. 타일/viewport 진단 버튼과 미완성 대조 경로 제거.
- 문서: README·CHANGELOG·docs/guide·release-readiness·HANDOFF를 0.0.1 계약으로 갱신. 옛 설계·구현 문서에는 역사 표시를 추가하고 이전 worklog·연구 분석 도구·output 증거는 보존.

변경 파일별 목록·정리 전후 패치·소스 해시는 output/maintenance/2026-10-15-initial-scope/manifest.json 및 cleanup.patch에 기록한다. package.json/lockfile·의존성·AGENTS/.codex는 이번 작업에서 변경하지 않았다.

## 검증

| 검사 | 결과와 근거 |
|---|---|
| 공개 표면 회귀 RED | 기존 dist에서 새 검사 실패: planTiles가 추가로 노출됨. 제거 후 통과 |
| 최종 npm run verify | 통과: typecheck/build, unit 48/48, consumer 5/5, 고정 엔진·라이선스. verify.log |
| npm run test:research | 41/41 통과. 변경하지 않은 연구 도구·기존 증거 회귀이며 현재 제품 브라우저 지원과 구분. research.log |
| 최종 npm_config_offline=true npm run test:frameworks | 타입·package import·React/Vue/Svelte DOM 없는 SSR·browser bundle 통과. frameworks.log |
| 최종 tarball 실제 Chrome | Vanilla/React/Vue/Svelte 4/4. PNG240×120·custom480×240 픽셀·A5 SVG mm·dispose·URL revoke·언마운트 취소·재마운트. React StrictMode 포함 |
| Chrome Playground | crop UI 없음. 기본640×420·2배1280×840·custom800×600 PNG, A4 2480×3508 JPEG, JIS B4 가로4299×3035 JPEG·364×257mm SVG, 잘못된 너비 INVALID_OPTIONS·reset·기본 재출력 확인 |
| 최종 대표 화면 | 64노드 대응·기본/2배 PNG-Canvas 차이0·snapshot/원본 보존·sticky/fixed/scrolled 명시 거부, 총7/7 통과 |
| 원본/2배 CUA 육안 | 명세서의 표·텍스트·색·카드 그림자·둥근 테두리·clip·라벨·사선·원에 눈에 띄는 손상 미관찰. source/capture 화면·판정 보존. 원본 전체 픽셀 exact 판정 아님 |
| 로컬 npm pack | 57파일. 제거 모듈·공개 타일/crop 타입 없음. 연구·테스트·Playground·memory·복구본 배포 제외. package-check.json |
| 변경 파일 hygiene·가이드 링크 | 정리 전 복구본 대비 패치 검사와 실제 배포 파일 내 상대 문서 링크 검사. manifest 참조 |

최종 소비 run은 output/framework-consumer/919bec09-d381-4563-bc95-dff318cfbdc5/이며 manifest·results에 tarball SHA와 실행 UA를 기록한다. 실제 실행 UA는 Chrome/154.0.0.0, 정확 runtime patch는 UA에서 미확인이다. Chrome155·Safari 실행으로 표시하지 않는다.

최종 visual 증거는 output/visual-acceptance/02164784-be15-41fd-bfdf-fd69dd5a0d04/af78b708-209d-4834-bb70-4d3e3a7ad1ac/, 후보 source/dist 해시는 상위 manifest.json이다. 이전 중간 run도 보존한다. Playground·원본/2배 비교 screenshot과 로그는 output/maintenance/2026-10-15-initial-scope/에 있다. 전체 manifest가 최종 파일과 일치하는지 확인한다.

로컬 listen EPERM은 sandbox 환경 실패로 분류하고 허용된 localhost 서버 실행으로 검증했다. 기본 npm cache의 EPERM은 기존 /tmp/comins-capture-public-npm-cache를 사용해 pack에 성공했으며 사용자 cache 소유권은 변경하지 않았다. 초기 CUA label 검색·navigator 조회는 도구 제약이었으며 실제 role locator와 fixture의 UA 기록으로 확인했다. 제품 실패로 분류하지 않는다.

## Memory·복구

저장소의 docs/development/next-version-memory.md와 전역 memory notes/2026-10-15T174100-comins-capture-next-version.md에 이월 요구·실패·재개 조건을 기록했다. 후속 버전 번호·재구현 승인·지원 범위는 확정하지 않았다.

정리 전 원본은 output/maintenance/2026-10-15-initial-scope/before-cleanup.tgz. SHA256 ea50a339851e8f72a28fa1b399ea4f887140dab1d682bf5ae80dd035ee106da8. 제품이 미커밋/untracked이므로 HEAD만으로 복구할 수 없다. 별도 디렉터리에 추출해 필요한 파일만 검토하며 checkout 전체를 덮어쓰지 않는다. 원본 output 연구 증거는 삭제하지 않았다.

## 잔여 범위와 Git

Safari shadow/clip·과거 crop/타일 strict FAIL은 해결되지 않았다. 후속 버전 memory로 이월했으며 현재 코드에서 제거한 사실을 품질 해결로 보고하지 않는다. Edge/Firefox·실제 모바일·범용 자원/보안·장기 leak 검증은 수행하지 않았다. Python workbench는 변경하지 않아 Python 단위 검사는 미실행이다.

용지 규격 공식 원문 대조·최종 출시 후보 수용·website 한영 동기화·정식 취약점 감사·publish는 이번 정리 완료에 포함하지 않는다.

root 저장소 루트, branch codex-governance-v111, HEAD a35dbe2, local private:true·0.0.0-dev.0. 코드·문서는 미커밋/untracked이며 기존 AGENTS/.codex 변경은 보존했다. Contract v1.12는 승인된 로컬 미게시본이다. commit/push/PR/태그/Release/publish/배포는 수행하지 않았다. 검증용 서버와 이번 생성 탭만 종료하고 사용자 탭·프로세스는 보존한다.
