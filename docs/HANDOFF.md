# Comins Capture 인계

갱신: 2026-10-16 KST. 최초 배포는 정적 HTMLElement·단일 출력·배율/custom/ISO/JIS 용지 범위입니다. [출시 조건](release-readiness.md)과 현재 docs/guide를 우선합니다.

## 최신 원격 상태

2026-10-16 최종 거버넌스 점검 후 SECURITY.md·bug/feature Issue Forms·신고/출시 안내를 보완했습니다. 후속 승인으로 PVR·dependency alerts 활성화와 재조회에 성공했고 열린 의존성 알림0건, 검증된 Comins 신원의 기대값 Secrets2개 저장을 확인했습니다. [거버넌스 보완 기록](worklogs/2026-10-16-governance-remediation.md)을 현재 상태로 우선합니다. npm 게시는 보류하며 기존81파일 후보를 보존합니다. 아래의 PR/원격 상태는 과거 작업 기록입니다.

2026-10-16 PR 리뷰에서 엔진 자체 폰트 요청·이미지 압축·큰 PNG 준비 실패를 재현하고 수정했습니다. 최신 검증은 [리뷰 수정 기록](worklogs/2026-10-16-pr-review-fixes.md)과 지원 가이드의 Chrome155 결과를 우선합니다. 과거 Chrome154 byte동일 재사용 조건은 이번 변경에 적용하지 않습니다. 아래 PR 생성 기록은 이전 head의 상태이며 새 head CI와 보호 병합 결과는 후속 운영 기록을 따릅니다.

2026-10-16 [Draft PR #1](https://github.com/kim1124/comins-capture/pull/1)을 생성했습니다. head는 codex-0-0-1-release의1805ae4이며, [실제 GitHub Actions](https://github.com/kim1124/comins-capture/actions/runs/38840611332)에서 Sensitive data·Package가 모두 성공했습니다. 기본 브랜치 codex-governance-v111에 두 검사·앱 ID15368 고정·최신 base 요구·관리자 적용·PR 필수 보호를 설정했습니다. 승인 리뷰어 수는0이며 force push·삭제는 허용하지 않습니다. 기본 브랜치 소스는 a35dbe2 그대로이고 PR은 draft·미병합입니다.

[원격 실행 기록](worklogs/2026-10-16-remote-ci.md)을 현재 상태로 우선합니다. 아래의 원격 실행 미확인 설명은 이전 준비 시점의 기록입니다. 기존 tarball·제품 입력 해시는 그대로이며 후속 운영 기록은 로컬 미커밋입니다. 다음은 PR 리뷰·병합과 별도 첫 게시 승인 단계이며 npm 게시·태그·사이트 배포는 수행하지 않았습니다.

## 현재 코드

capture·CaptureError·paperSize와 single snapshot toBlob/toCanvas/toSvg/meta/dispose만 유지합니다. crop·타일·partial/failure·lab adapter·Safari 전용 미완성 출력 wrapper는 실제 코드에서 제거했습니다. Playground·예제·타입·consumer/browser fixture를 현재 API에 맞춰 정리했습니다.

자원 deny·resolver·SVG 검증·원본 보존·취소/timeout·dispose·출력 한도는 유지합니다. 미지원 DOM 감지·오류 처리는 기능 구현의 잔재가 아니므로 제거하지 않습니다. 공개 import는 SSR에서 가능하며 capture 실행은 클라이언트 전용입니다.

## 후속 작업

[차기 버전 memory](development/next-version-memory.md)에 제거 항목·미구현 요구·실패 증거와 복구 경로를 기록합니다. 이전 API를 무조건 복원하지 말고 알려진 실패를 먼저 재현하고 별도 승인 범위를 정합니다. 기존 output 연구 증거와 2026-10-13 worklog는 보존합니다.

0.0.1 후보의 현재 검증은 [벤치마크](worklogs/2026-10-15-0.0.1-benchmark.md)와 [후속 확인](worklogs/2026-10-15-release-followup.md)을 확인합니다. 고정 tarball의 실제 Chrome 154.0.8037.98 기능15/15·자원/SVG15/15·반복30회 실패0입니다. 기존 framework4종·SSR/types는 dist43파일 byte동일 범위만 재사용했습니다. Safari shadow/clip은 해결되지 않았으며 정식 지원 제외입니다.

2026-10-15 후속 npm audit는 런타임 알려진 취약점0건입니다. 첫 후속 확인 당시 개발 후보 manifest80파일·tarball 해시 불변과 용지24개 방향별 기하를 재확인했습니다. 당시 JIS 공식 원문 대조는 미완료였으며 JISC 일반 PDF는 로그인 필요, 공개 음성 PDF는 브라우저 차단으로 열람하지 못했습니다.

2026-10-16 사용자의 대체 검증 지시에 따라 TAKEO·후지필름 공개 자료에서 JIS 6규격의 치수를 교차 확인하고 ISO/JIS·방향별 24조합 mm·300 PPI px를 재검증했습니다. [공개 자료 대조 기록](worklogs/2026-10-16-paper-dimension-corroboration.md)을 근거로 용지 치수 항목을 완료 처리하며 JISC 로그인은 요구하지 않습니다. JIS 원문 직접 열람 미실시 사실은 보존합니다.

그 뒤 package·lockfile 버전을0.0.1로 맞추고 배포 문서를 갱신했습니다. 당시 로컬 tarball57파일은 전체 verify·allow-list·Gitleaks·오프라인 설치/소비 검사를 통과했습니다. runtime64파일(src21/dist43)은 기존 개발 후보와 byte동일입니다. [후보 준비 보고서](worklogs/2026-10-15-0.0.1-candidate-preparation.md)와 output/release-candidate/2026-10-15-0.0.1/candidate-manifest.json은 해당 후보의 고정 기록입니다. 과거 manifest의 전체80파일 동일성 검사는 버전·문서 변경 후 의도적으로 성립하지 않으므로 새 후보에 재적용하지 않습니다.

이후 README·가이드·저장소 문서를 보완했습니다. [전체 문서 목차](README.md)에서 사용자 가이드와 저장소 운영 문서를 구분합니다. 현재 checkout에는 기존57파일 tarball에 없는 문제 해결 가이드와 갱신된 배포 문서가 있으므로 해당 tarball을 현재 checkout 전체와 동일하다고 표시하지 않습니다. 런타임·패키지 설정은 변경하지 않았으며 다음 실제 후보 생성 때 새 문서로 artifact 검증을 수행해야 합니다. 문서 작업에서 기존 후보를 덮어쓰거나 다시 pack하지 않았습니다.

공개용 package 설정과 Sortable 형식 README·한영 참조10쌍을 준비했습니다. 새 후보81파일은 전체 verify(unit52/consumer6/type/build/license/docs)·추출본 Gitleaks·별도 offline 소비/타입 검사를 통과했습니다. 정확한 후보·검증·소스 고정 결과는 [참조 문서 및 후보 준비 기록](worklogs/2026-10-16-reference-docs-candidate.md)을 확인하고 이후 원격 CI·필수 체크를 확인합니다. 현재 private:false·publishConfig.access:public을 로컬에 준비했으며 실제 publish는 별도 승인 단계입니다. 이번 사용 모델은 현재 turn 실행 기록 기준 gpt-6.1-sol/high이며 저장소 기본 medium과 구분합니다.

2026-10-15 순차 준비 당시 JIS 원문은 미확보 상태로 별도 자료를 요청했습니다. 이 요청은 위 2026-10-16 대체 검증으로 해소했습니다. 독립적인2번 작업으로 `.github/workflows/verify.yml`·`.gitleaks.toml`·공개 Git 신원 검사와 회귀 검사를 추가했습니다. 전체 verify(unit52/consumer5/type/build/license)·민감정보 검사2개·출시 대상152파일 Gitleaks·CI 도구 변경 한정 Codex Security 검토를 통과했습니다. 상세 범위는 [순차 준비 기록](worklogs/2026-10-15-sequential-preparation.md)을 따릅니다. Git 고정 대상은 제품·문서·검증 도구이며 기존 AGENTS/.codex 변경은 포함하지 않습니다. 실제 commit 결과는 output/release-review/2026-10-15-sequence/release-source.json에 기록합니다. 원격 CI 실행·필수 체크 활성화는 미확인입니다.

## Git·복구·정책

초기 base HEAD a35dbe2, 참조 문서 정리 전 로컬 HEAD 1af0fae, branch codex-governance-v111. private:false·0.0.1·미배포 상태입니다. 기존 AGENTS/.codex 변경은 별도 작업으로 보존합니다. 승인된 로컬 미게시 Contract v1.12를 적용합니다. 최신 문서·후보 commit은 output/release-candidate/2026-10-16-0.0.1/candidate-manifest.json의 sourceRevision을 따릅니다. 용지 항목과 로컬 공개용 설정·후보 검증은 완료했으며 원격 CI와 별도 게시 승인 등 다른 출시 조건은 계속 적용합니다.

정리 전 복구본: output/maintenance/2026-10-15-initial-scope/before-cleanup.tgz. 필요 파일은 별도 임시 디렉터리에 추출해 비교하며 현재 checkout에 전체 덮어쓰지 않습니다.
