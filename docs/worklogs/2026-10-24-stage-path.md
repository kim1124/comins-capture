# npm stage publish의 로컬 artifact 경로 보완

- 작업일: 2026-10-24 (Asia/Seoul)
- 상태: 로컬 최소 수정과 선택 검증 완료. 실제 staging 재시도·공개 게시 미실행.
- 로컬 기준 HEAD: `1797eecb67c0c531e65957173d294b24a0c24f78`. 기존 feature branch 및 Governance dirty15파일은 보존했다.
- 모델: 구현 Sol 6.1/medium, 독립 변경 검토 Sol/high로 배정. 실제 런타임 모델 식별 메타데이터는 제공되지 않았다.
- 정책: 승인된 local-only Comins Contract v1.12는 미게시 상태다. 이번 권한은 로컬 수정·검증에 한정하며 새 branch·stage/commit/push·PR/merge·workflow 실행·pack·publish 권한으로 확대하지 않는다.

## 문제와 원인

기존 canonical workflow run40068002429의 verify-and-pack은 성공했지만 stage 단계는 실패했다. 부모가 민감 값을 제외하고 확인한 로그에서 npm이 `package-artifact/comins-capture-0.0.2.tgz`를 GitHub shorthand로 해석하여 `git ls-remote`를 실행했고, exit128로 artifact upload 전에 종료했다. 제품 capture 결함이나 확인된 OIDC/trust 거부로 분류하지 않는다. 실행 결과는 `output/verification/2026-10-24-stage-execution/executed-result.json`을 따른다.

공식 npm-package-arg13.0.2로 네트워크 없이 같은 argument를 해석한 집중 회귀에서 기존 값은 type=git/hosted=github로 실패하고, `./`를 붙인 값은 type=file로 통과했다. 이는 package specifier 해석 계약의 증거이며 실제 npm stage 성공이나 인증 경로의 실행 증거는 아니다. 신규 의존성을 추가하지 않고 기존 npm 설치에 포함된 공식 라이브러리를 사용했다.

## 최소 변경

- `.github/workflows/publish.yml`: 마지막 stage publish argument만 `"./package-artifact/$PACKAGE_FILE"`로 변경했다. artifact digest·identity 검사, stage 명령·ignore-scripts/access/registry 인자, OIDC·권한·pinning·기존 artifact 전달 방식은 유지했다.
- `test/security/release-controls.test.mjs`: 기존 publication contract case에 stage argument가 위의 정확한 로컬 tarball 경로인지 확인하는 assertion1개를 추가했다. 기존 보안 계약과 기대값은 유지했다.
- 본 worklog만 추가했다. 제품 src/dist/package·사이트·기존 artifact·Governance는 변경하지 않았다.

## 검증과 증거

증거 위치: `output/verification/2026-10-24-stage-path-fix/`.

- before.json과 원본2파일 bytes를 보존했다. 새 worklog는 변경 전 부재로 기록했다.
- 회귀 RED: 새 local-path assertion이 기존 workflow에서 실패했다(`regression-before.log`). 공식 parser도 git/file 불일치로 실패했다(`parser-before.log`).
- 회귀 GREEN: 수정한 workflow argument는 공식 parser에서 file로 해석됐다(`parser-after.log`).
- 선택 전체 gate `node --test test/security/*.test.mjs` 1회 PASS:9/9 (`security-tests.log`).
- `npm run check:docs` 및 `git diff --check` PASS. 이 변경에서 full verify·브라우저·pack·실제 npm stage·원격 workflow를 실행하지 않았다.

## artifact·게시 경계와 다음 단계

이전 정식 workflow가 만든 83파일 artifact는 SHA-256 `90134e44b12abe35ba99cb856072224d2e7ffc13148658a9c4a52278e5715266`이며 별도 독립 검토에서 allow-list·source byte·법적 고지·dist45파일 정합성 검증을 통과했다. 그 artifact와 검증 증거는 그대로 보존했고 새 artifact를 만들거나 교체하지 않았다. 근거: `output/verification/2026-10-24-stage-execution/verification-final.json`.

해당 staging 시도는 upload 전 실패했으므로 stage 완료는0건이며 재시도도0회다. 인증된 pending-stage 전체 목록은 확인되지 않아 registry 전체에 stage가 전혀 없다고 단정하지 않는다. 사용자 공개 승인과 public publish는 모두0회이며0.0.2 공개 게시 완료를 주장하지 않는다. `releaseReady=false`를 유지한다.

다음 단계는 이 고정 diff의 독립 검토다. 원격 반영·보호 병합·같은 artifact를 사용할 수 있는 정확한 stage 재시도 경로 검토와 실행은 별도 명시 승인 대상이다. 이번 로컬 parser/보안 검사 PASS는 staging/OIDC/identity·registry·공개 게시 인수를 대신하지 않는다.
