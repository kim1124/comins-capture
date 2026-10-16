# 0.0.1 PR 리뷰 수정과 재검증

작업일: 2026-10-16 KST. 부모 실행 모델 gpt-6.1-sol/high, 독립 architecture·output 리뷰 gpt-6-astra/high, 실행 환경 사전 점검 gpt-6.1-sol/medium. 승인된 로컬 미게시 Contract v1.12를 적용했다. 유지관리자의 계속 진행 지시로 PR 리뷰·필요 수정·보호 병합을 진행한다. npm 게시·태그·Release·사이트 배포는 별도 승인이다.

## 수정 원인과 범위

고정 head1805ae4의40개 변경 소스 항목과 실제 생성 엔진을 검토했다. 보안 검토 scan6615f017-a154-4665-a254-6c213a087b52는 해당 고정 revision에서 low1건을 기록했다. 이후 수정 검증과 구분하며 기존 sealed 결과를 수정하지 않는다.

1. 허용된 Material Symbols span이 기본 deny에서도 stock 엔진의 Nn→Jl→Yl→FontFace.load 경로를 호출했다. 실제 Chrome에서 고정 Google 폰트 요청1건을 전송 전에 가로채 차단했다. 캡처는 그 뒤 RESOURCE_UNVERIFIABLE로 거부됐다. 임의 목적지·캡처 데이터·인증정보 유출은 입증되지 않았다. 고정 해시 기반 엔진 변환에 Nn no-op을 추가하여 원문 텍스트와 준비 폰트만 유지한다.
2. stock 이미지 압축이 준비 data URL을 바꿔 최종 SVG 검증을 실패시켰다. 축소 JPEG 배경에서 capture 단계 실패를 재현했다. adapter의 compress:false로 준비 바이트를 보존한다. 내부 선언만 보완하고 공개 API는 유지한다.
3. 약3.44MB의 정상 PNG가 Base64 반복 그룹 정규식에서 Chrome의 Maximum call stack size exceeded를 발생시켰다. 패딩·길이·모든 데이터 문자를 직접 검사하도록 변경했다. 독립 리뷰가 발견한 마지막 개행 허용 차이도 수정하고 LF·CR·U+2028·U+2029를 거부하는 사례를 추가했다.

변경 파일: scripts/engine-supply.mjs, src/engine/dom-adapter.ts, src/engine/snapdom-extension.ts, 내부 엔진 선언, 엔진 unit·browser 회귀 fixture, THIRD_PARTY_NOTICES.md, README·지원 가이드·국문 참조 동기화와 운영 기록. 의존성 버전·공개 export는 변경하지 않았다. 기존 AGENTS/.codex 변경은 제외한다.

## 새 검증

| 검사 | 결과 |
| --- | --- |
| 전체 npm run verify | type/build·unit54·consumer6·license·docs PASS |
| 엔진 브라우저 회귀 | 수정 전5/6실패, 수정 후6/6 PASS; FontFace 요청0·외부 요청0 |
| 실제 Chrome155.0.8059.80 기능·오류·수명주기 | 15/15 PASS |
| 자원/SVG·CORS/CSP·deny·resolver·abort·isolation | 15/15 PASS |
| 30회 반복 | 실패0·PNG 해시1종·미해제 Blob URL0·DOM 노드 증가0 |
| Vanilla·React StrictMode·Vue·Svelte | 브라우저4/4, 별도 공개 타입·SSR·bundle PASS |
| 민감정보 detector | 2/2 PASS |
| 독립 수정 리뷰 | Base64 개행 차이 보완 후 최종 blocker 없음 |

Chrome는 macOS의 설치 실행 파일을 headless·DPR2·1440×1100으로 실행했다. 단순5노드·명세서64노드·표145노드 capture→PNG 각10표본 p50/p95는16.6/18.1ms·42.2/47.3ms·71.0/76.2ms다. 과거 Chrome154·수정 전 runtime 측정과 직접 비교하지 않는다. 강제GC·native/GPU·장기 누수·저사양·다른 브라우저는 미검증이다.

원본과 기본·2배·800×600·A4 JPEG·JIS B4 가로 JPEG를 열어 텍스트·색상·표·그림자·clip의 눈에 띄는 손상이 없음을 확인했다. SVG mm·PNG/Canvas 동일성과 용지24조합은 자동 검사를 통과했다. 원본 전체 픽셀 exact 일치는 주장하지 않는다.

증거는 output/release-review/2026-10-16-pr-review, output/benchmarks/2026-10-16-reviewed-final, 자원 장부 batch2d0007f4-4bfe-4ad3-a0e0-7d8d4bb3478b, framework 소비1720da15-11cd-4675-8689-d620993ae1de에 보존한다. 로컬 연구 증거는 배포 패키지에서 제외한다.

## 후보와 다음 상태

과거 후보를 덮어쓰지 않는다. 최종 문서 포함 후보와 소스 해시는 output/release-candidate/2026-10-16-0.0.1-merge/candidate-manifest.json을 따른다. 문서 갱신 이전 reviewed 후보의 runtime64파일과 최종 후보의 동일성을 확인한 범위에서 새 브라우저·성능·프레임워크 증거를 연결한다. artifact allow-list·license·추출본 Gitleaks·문서 링크·offline 소비/타입 검사를 적용한다.

새 head의 필수 Sensitive data·Package 성공을 확인한 뒤 PR #1을 Draft 해제·보호 병합한다. 실제 결과는 후속 운영 기록과 후보 manifest에 남긴다. npm 미게시, Safari shadow/clip 미해결·정식 지원 제외는 유지한다.
