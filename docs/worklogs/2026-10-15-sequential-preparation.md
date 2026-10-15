# 최초 출시 순차 준비

작업일: 2026-10-15 KST. 사용자 지시 “순서대로 진행”에 따라1번 원문 확인과2번 Git·CI 준비를 수행했다. 실행 모델은 현재 turn 기록 기준 gpt-6.1-sol/high이며 하위 에이전트를 사용하지 않았다.

## 결과와 진행 경계

1번 JIS P0138:1998은 공식 JSA catalog에서 유효 상태를 다시 확인했으나 원문은 확보하지 못했다. 공식 PDF 경로 또는 JISC 로그인 완료 여부를 사용자에게 요청했으며 대체 표만으로 원문 대조를 완료 처리하지 않는다. 유료 구매·접근 제한 우회는 수행하지 않았다.

독립적으로 준비 가능한2번 작업에서 검증 CI·민감정보 규칙·Git 신원 검사와 회귀 검사를 추가했다. 공개 설정 전환·최종 공개 tarball·npm 게시·website 공개 전환·게시 후 확인은 JIS 및 앞선 출시 조건을 충족하기 전 진행하지 않는다. private:true를 유지한다.

## 변경 파일

- .github/workflows/verify.yml: contents:read, credential 비보존·SHA 고정 Actions, Sensitive data·Package 검사. PR SHA는 env를 통해 처리하고 첫 push/수동 실행에서는 전체 이력을 검사한다. 게시 권한·secret은 사용하지 않는다.
- .gitleaks.toml: 기존 Comins 규칙을 참고해 default secret 규칙에 공개 이메일·계정 경로·민감 파일/번호 검사를 추가. scoped npm 좌표 오탐을 제한된 version 형식 예외로 수정했다.
- scripts/check-public-identities.mjs: Governance의 공개 신원 검사 방식을 사용해 author·committer 및 Git revision/조상 관계를 검사한다. 전체 이력 단일 SHA 입력을 추가했다. 이 코드는 저장소 검증 도구이며 npm 배포 파일에는 포함하지 않는다.
- test/unit/public-identities.test.mjs: 허용 신원·불일치·잘못된 revision·역방향 range·비공개 author 회귀4개.
- test/security/sensitive-data.test.mjs: package 좌표 허용·개인 정보 형태 탐지2개. 합성 탐지값은 실행 중 조합하고 임시 파일·scanner 출력을 폐기한다.
- docs/HANDOFF.md·docs/development/next-version-memory.md·docs/worklogs/2026-10-15-initial-scope-cleanup.md: 로컬 계정 경로를 저장소 기준 표기로 정리. 기존 raw 연구 증거는 수정하지 않았다.
- CONTRIBUTING.md·docs/development/{repository-guide,releasing}.md·CHANGELOG.md: 로컬 workflow 추가와 원격 미검증 상태를 구분했다.

## 검증

| 검사 | 결과 | 한계 |
|---|---|---|
| 전체 verify | PASS | typecheck/build/unit52/52/consumer5/5/license. 이번 변경 후 fresh 실행 |
| detector 회귀 | PASS2/2 | npm 좌표 오탐을 먼저 재현한 뒤 수정. private-shaped email/path는 계속 거부 |
| 출시 대상 트리 Gitleaks | PASS | 최초152파일 기준. 문서3곳 계정 경로 정리 후 정확한 대상 복사본 검사. raw 로그·탐지값 폐기 |
| CI 정적 검사 | PASS | YAML 파싱·contents:read·SHA pin·credential 비보존·shell7단계 문법 |
| CI 공급자 pin | 결과는 output의 tool-pins.json 참조 | 공식 Actions commit2개·Gitleaks archive checksum 확인. Linux binary 실행은 하지 않음 |
| CI 도구 Codex Security diff | 완료, 보고 대상 취약점0 | 격리된 고정 복사본의 source3파일·supporting test2파일. 전체 runtime 보안 감사 아님 |
| 원격 CI·필수 검사 설정 | NOT RUN | 파일의 로컬 검증으로 대체하지 않음 |
| 브라우저·성능 | 기존 runtime 동일 범위 재사용 | 새 브라우저 벤치마크 없음 |
| JIS 원문 | INCOMPLETE | 적법한 원문 접근 자료 필요 |

보안 scan ID는 b4818425-0693-4e1a-8fc1-299cb02a8e7a다. baseline94ba2ddaf13f8ddcc85346a289f5eaa3151302cf의 고정된 도구 변경을 검토했으며 source snapshot digest는 codex-security-snapshot/v1:sha256:3d0c9f3e5c977022d21a24742bbabda510500e767332f386829d8040a65d718f다. 원래 checkout의 해당5파일과 byte동일성을 확인해 적용한다. sequential parent 검토이며 독립 reviewer가 아니다. 검사 결과는 Codex Security의 같은 scan에 보존했다.

도구가 측정한 scan 사용량은 전체2,802,244토큰이며 입력2,797,644 중 cached2,763,264, 출력4,600이다. 이는 codex_rollout 기준 집계이며 비용 추정이나 새로 계산한 순수 추론량으로 해석하지 않는다. Daybreak 접근은 미부여로 확인되어 보호된 결과 표시 제한 가능성을 고지했다. 검사 수행 가능 여부나 취약점 판정과 구분한다.

## Git 고정과 남은 작업

기존 AGENTS/.codex 변경과 raw output은 출시 source commit에 포함하지 않는다. 개인 Git 설정은 공개 신원 검사를 통과하지 못했지만 영구 설정을 바꾸지 않고 commit 명령 단위의 공개 handle+noreply 신원을 사용한다. 실제 commit·hook 결과와 revision은 output/release-review/2026-10-15-sequence/release-source.json에 기록한다.

JIS 원문 대조 완료 후 공개 package 설정과 정식 후보를 확정하고, 원격 CI/필수 체크·게시 및 사이트 동기화·게시 후 확인을 해당 승인 범위에서 이어간다. 이번 준비 결과를 공개 배포 완료로 표시하지 않는다. 적용 Contract v1.12는 승인된 로컬 미게시본이다.
