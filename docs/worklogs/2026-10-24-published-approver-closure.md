# 0.0.2 manual publisher의 approver closure 검사 보완

- 작업일: 2026-10-24 (Asia/Seoul).
- 로컬 기준 HEAD: `b5ace31287bf781e109f92b1d9e4b84997c95c7b`.
- 소유 범위: `scripts/check-npm-public-identity.mjs`, 기존 release-controls security test, 본 worklog의3파일. 제품 package/lock/src/dist·기존 Governance·타인 변경은 보존한다.
- 모델: 구현 Sol 6.1/medium, 계획·독립 검토·변경분 보안 및 실제 public gate는 Sol/high로 분리한다. 실제 런타임 모델 식별 메타데이터는 별도로 노출되지 않았다.
- 승인된 local-only Comins Contract v1.12는 미게시 상태다. 사용자의 정확0.0.2 manual-session 예외 및 계속 진행 승인 범위 내에서 closure checker만 보완한다. 새 pack/publish/remote Git/settings 변경은 없다.

## 확인된 문제와 최소 변경

상위 담당자가 읽은 실제 공개0.0.2 metadata에는 승인된 baseline과 일치하는 name/email 두 필드의 approver가 있다. 이 사실은 전달받은 공개 metadata 관측이며 구현 담당자가 실제 registry를 다시 조회한 결과가 아니다. 기존 manual validator는 approver를 무조건 absent/null로 제한하여 이 형태를 거부한다. 기존 default OIDC 검사나0.0.2 전용 opt-in을 완화할 필요는 없다.

TDD 및 코드 리뷰 수용 지침에 따라 실제 validator와 CLI 공유 run의 합성 metadata 계약에서 matching approver가 각각 false/exit1이 되는 RED를 먼저 확인했다. 구현은 validateManualSessionPublishedIdentity 함수 내부에만 적용했다. absent/null은 계속 허용하며, approver가 있으면 비배열 object·정확히 두 own key·각 name/email의 own enumerable 속성·기존 validateCurrentIdentity의 승인된 expected 비교를 모두 통과해야 한다. 상속 값만 있는 객체, own key 누락, 비열거 필드, symbol 또는 provider/token/approver 등 추가 key, 불일치 신원은 거부한다. 신원 normalizer 자체는 변경하지 않았다.

manual npmUser의 trustedPublisher 불허, 단일 maintainer, main publisher, author/contributors 공백 조건,0.0.2 명시 opt-in 및 다른 버전·기본 OIDC provider 정책은 유지한다. 실제 이름/email/credential/값 유래 fingerprint는 source·로그에 기록하지 않는다.

## 검증

증거 위치: `output/verification/2026-10-24-published-approver-closure/implementation/`.

- before.json과 기존 source/test bytes를 보존했다. red.log는 기존 validator와 CLI 공유 run의2개 의미있는 실패를 기록하고 repository 경로는 placeholder로 정리했다.
- focused12/12 PASS: matching/absent/null 허용, wrong name/email·array/string·빈 객체·missing own key·inherited-only·비열거·symbol·추가 provider/credential/approver 거부, opt-in 및 타 mode/version 제한을 확인했다. 신원 fixture는 합성 placeholder만 사용하고 npm query는 경계에서 합성 응답을 주입한다.
- 최종 security 전체42/42 PASS, module verify1회PASS(unit84/consumer6/typecheck/build/licenses/docs), 문법·diff PASS를 확인했다. 배포83/src22/package-lock SHA256는 전후 동일하다. 최종 문서 검사·동결3파일 hash는 handoff와 최종 로그를 따른다. 실제 artifact crypto/registry consumer 재검증은 수행하지 않는다.

## 잔여 상태

로컬 합성 검증은 변경한 closure 검사 계약을 검증한다. 실제 public gate는 source 동결 뒤 독립 검증자가 수행하며 결과를 사전에 PASS로 처리하지 않는다. 이미 수행된 artifact·provenance·consumer 근거는 관련 bytes가 변하지 않는 범위에서 재사용하고 새 tarball을 만들지 않는다. 원격 반영은 독립 review/security/privacy 이후 운영 담당자가 수행한다. 이 checker 보완만으로 release closure 전체 완료를 선언하지 않는다.
