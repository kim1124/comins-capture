# Comins Capture 인계

갱신: 2026-10-15 KST. 최초 배포는 정적 HTMLElement·단일 출력·배율/custom/ISO/JIS 용지 범위입니다. [출시 조건](release-readiness.md)과 현재 docs/guide를 우선합니다.

## 현재 코드

capture·CaptureError·paperSize와 single snapshot toBlob/toCanvas/toSvg/meta/dispose만 유지합니다. crop·타일·partial/failure·lab adapter·Safari 전용 미완성 출력 wrapper는 실제 코드에서 제거했습니다. Playground·예제·타입·consumer/browser fixture를 현재 API에 맞춰 정리했습니다.

자원 deny·resolver·SVG 검증·원본 보존·취소/timeout·dispose·출력 한도는 유지합니다. 미지원 DOM 감지·오류 처리는 기능 구현의 잔재가 아니므로 제거하지 않습니다. 공개 import는 SSR에서 가능하며 capture 실행은 클라이언트 전용입니다.

## 후속 작업

[차기 버전 memory](development/next-version-memory.md)에 제거 항목·미구현 요구·실패 증거와 복구 경로를 기록합니다. 이전 API를 무조건 복원하지 말고 알려진 실패를 먼저 재현하고 별도 승인 범위를 정합니다. 기존 output 연구 증거와 2026-10-13 worklog는 보존합니다.

0.0.1 후보의 현재 검증은 [벤치마크](worklogs/2026-10-15-0.0.1-benchmark.md)와 [후속 확인](worklogs/2026-10-15-release-followup.md)을 확인합니다. 고정 tarball의 실제 Chrome 154.0.8037.98 기능15/15·자원/SVG15/15·반복30회 실패0입니다. 기존 framework4종·SSR/types는 dist43파일 byte동일 범위만 재사용했습니다. Safari shadow/clip은 해결되지 않았으며 정식 지원 제외입니다.

후속 npm audit는 런타임 알려진 취약점0건입니다. 첫 후속 확인 당시 개발 후보 manifest80파일·tarball 해시 불변과 용지24개 방향별 기하를 재확인했습니다. JIS 치수는 공급업체 공개 표와 일치하나 공식 원문 대조가 남습니다. JISC 일반 PDF는 로그인 필요, 공개 음성 PDF는 브라우저 차단으로 열람하지 못했습니다.

그 뒤 package·lockfile 버전을0.0.1로 맞추고 배포 문서를 갱신했습니다. 당시 로컬 tarball57파일은 전체 verify·allow-list·Gitleaks·오프라인 설치/소비 검사를 통과했습니다. runtime64파일(src21/dist43)은 기존 개발 후보와 byte동일입니다. [후보 준비 보고서](worklogs/2026-10-15-0.0.1-candidate-preparation.md)와 output/release-candidate/2026-10-15-0.0.1/candidate-manifest.json은 해당 후보의 고정 기록입니다. 과거 manifest의 전체80파일 동일성 검사는 버전·문서 변경 후 의도적으로 성립하지 않으므로 새 후보에 재적용하지 않습니다.

이후 README·가이드·저장소 문서를 보완했습니다. [전체 문서 목차](README.md)에서 사용자 가이드와 저장소 운영 문서를 구분합니다. 현재 checkout에는 기존57파일 tarball에 없는 문제 해결 가이드와 갱신된 배포 문서가 있으므로 해당 tarball을 현재 checkout 전체와 동일하다고 표시하지 않습니다. 런타임·패키지 설정은 변경하지 않았으며 다음 실제 후보 생성 때 새 문서로 artifact 검증을 수행해야 합니다. 문서 작업에서 기존 후보를 덮어쓰거나 다시 pack하지 않았습니다.

다음 단계는 접근 가능한 공식 JIS 원문으로6개 치수를 확인하고 공개용 private 설정·배포 문서와 Git revision을 최종 고정하는 것입니다. 현재 private:true이며 실제 publish는 별도 승인 단계입니다. 이번 사용 모델은 현재 turn 실행 기록 기준 gpt-6.1-sol/high이며 저장소 기본 medium과 구분합니다.

사용자의 순차 진행 지시 후 JIS 원문은 계속 미확보 상태이며 별도 자료를 요청했습니다. 독립적인2번 작업으로 `.github/workflows/verify.yml`·`.gitleaks.toml`·공개 Git 신원 검사와 회귀 검사를 추가했습니다. 전체 verify(unit52/consumer5/type/build/license)·민감정보 검사2개·출시 대상152파일 Gitleaks·CI 도구 변경 한정 Codex Security 검토를 통과했습니다. 상세 범위는 [순차 준비 기록](worklogs/2026-10-15-sequential-preparation.md)을 따릅니다. Git 고정 대상은 제품·문서·검증 도구이며 기존 AGENTS/.codex 변경은 포함하지 않습니다. 실제 commit 결과는 output/release-review/2026-10-15-sequence/release-source.json에 기록합니다. 원격 CI 실행·필수 체크 활성화는 미확인입니다.

## Git·복구·정책

초기 base HEAD a35dbe2, branch codex-governance-v111. private:true·0.0.1을 유지합니다. 기존 AGENTS/.codex 변경은 별도 작업으로 보존합니다. 승인된 로컬 미게시 Contract v1.12를 적용합니다. 현재 순차 준비의 로컬 commit 결과와 남은 원격 단계는 위 기록을 따릅니다. JIS 미완료로 공개 설정 변경·게시·사이트 공개 전환은 진행하지 않습니다.

정리 전 복구본: output/maintenance/2026-10-15-initial-scope/before-cleanup.tgz. 필요 파일은 별도 임시 디렉터리에 추출해 비교하며 현재 checkout에 전체 덮어쓰지 않습니다.
