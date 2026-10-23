# SVG 축소 구조 보존 수정

작업일: 2026-10-23 KST. 승인 범위는 PNG 내장 없이 원본 SVG의 HTML 텍스트·도형 구조와 재확대 품질을 보존하는 출력 수정이다. 기존 dirty tree와 10월 21일 래스터 수정은 보존한다. 원격 쓰기·게시·배포는 수행하지 않는다.

## 수정 전 재현

제품 소스 기준은 renderer `d8349ef4a0cba2cfe020c63fade848f891d25d582de6736b1249d38a65630cdd`다. 새 전용 public SVG 회귀에서 Chrome 155.0.8059.85는 7/7 통과했으나 WebKit 26.5는 3개 통과·4개 실패했다. CSS 539 px·A5 가로 용지 여백·cover·stretch에서 원본 한 줄의 문자 분할이 두 줄로 바뀌었으며, decoded SVG에서도 추가 줄의 잉크가 검출됐다. 기존 도형·클리핑·그림자 정상 여부는 줄 배치와 별도로 검사한다. 이 결과는 native Safari 검증이 아니다.

신규 회귀는 원래 명세서 fixture를 그대로 사용하며 `toSvg()`·SVG Blob 일치, 원문 구조·치수·여백, 원본 DOM 및 retained snapshot 불변도 확인한다. 회귀와 진단 원문은 `output/verification/2026-10-23-svg-structure`에 보존한다.

## 기각한 대안

- 원본 배율의 SVG를 기하 변환하는 단순 방식은 텍스트 줄 배치를 유지하지만 WebKit의 그림자·중첩 clip을 손상시킨다.
- 합성 경계 힌트와 identity filter는 이 손상을 해결하지 못했다.
- 원본 SVG를 `feImage`로 합성한 대안은 줄 배치·clip을 복구했지만 4배 재확대에서 고정 해상도 이미지에 가까운 흐림을 보여 기각했다. PNG 데이터가 없거나 SVG 원문을 그대로 내장한다는 사실만으로 벡터 재확대 품질을 판정하지 않는다.

## 구현과 검토 경과

컨테이너의 CSS zoom 효과 경로는 유지하고, 적격한 절대 배치 단일 텍스트에만 역 zoom과 동일 축 기하 축소를 적용하는 부분 구현을 진행했다. 원본 텍스트 기하·글꼴 속성은 inspection에서 원시 값으로 저장하고, node ref·문자 정합을 검증한 뒤 deep freeze하여 출력에 전달한다. 원문 DOM 재독·PNG 내장·강제 nowrap·폭 증가·폰트 변경은 없다. 첫 구현은 고정 SVG 회귀 WebKit 7/7을 통과했다.

독립 검토에서 child의 `all:initial`이 visibility·글자 채움색·마지막 줄 정렬을 초기화하는 회귀 3건을 찾고 실제 WebKit에서 재현했다. `all:unset`으로 상속된 텍스트 속성을 보존하고 비적격 조건을 보완하는 수정 및 별도 영속 브라우저 회귀를 진행한다. 이 중간 상태를 최종 검증 완료로 판정하지 않는다.

부분 구현의 대상은 보수적인 적격 조건을 충족하는 absolute 단일 텍스트 leaf뿐이다. normal flow·중첩 인라인·여러 줄·RTL·pseudo 등에는 기존 경로를 유지한다. 일반 HTML 전체의 SVG 품질 및 기존 WebKit 외부 확대 shadow/clip 오류는 미해결이다. 소스·테스트 최종 동결, 전체 gate, 독립 검토·보안 변경분 검사 및 native Safari는 각각 후속으로 기록한다. 출시 준비 완료로 판정하지 않는다.


## 최종 검증과 잔여 범위

최종 renderer SHA-256은 `9a8a8ab2fb6d57f92480cb7129a93602b5117fbf97ffee036f8a71fb874c21ff`, inspection은 `5360c79709d2c95d93b11759f307443238fe01fb8a8c6b628b1a35c7fecb1032`다. source·test·설정·설치 의존성 등을 포함한 1,922개 파일은 독립 gate 전후 동일하며 aggregate는 `df9991257f8663ef345855db634754aa0e528ae0a7671167539e8b87a5daf2a9`다. 이전 1,770개 동결과는 설치 의존성 포함 범위가 달라 파일 수를 직접 비교하지 않는다.

- `npm run verify`: 타입·빌드·unit 66/66·consumer 6/6·라이선스·문서 PASS.
- research: 서로 다른 46개 PASS. 최초 45 PASS 및 서버 검사 1개의 listen EPERM 환경 실패 후 해당 검사만 허용 환경에서 재실행하여 1 PASS. 성공 항목과 전체 gate를 반복하지 않았다.
- 설치 Chrome 155.0.8059.85 DPR1·DPR2 및 WebKit 26.5 DPR2: 9개 suite씩 총 27/27 PASS. 기존 엔진·cold image·자원·출력수명주기·자동 visual·용지 clip·래스터 축소에 SVG layout 7개와 text-run 23개 회귀를 추가했다.
- 고정 SVG layout rev2의 문자 분할/도형/clip/그림자/여백/보관본 불변 검사를 유지했다. 신규 text-run rev2는 다른 문구·글꼴·소수 치수·숨김·채움색·정렬·비적격 fallback을 검사한다. output Range는 실제 root `getScreenCTM()`의 역변환으로 SVG 논리 단위에 환산하며 원래 x/y/advance/height의 1/64 경계를 유지했다. 임의 2/64 확대는 채택하지 않았다.
- 실제 제품 SVG의 분리된 텍스트 4배 진단에서 native vector oracle 대비 MSE 0.053556, fixed 1x bitmap 확대 대비 189.503941이었다. 기존 출력 대비 변경 665픽셀은 라벨 안에 한정됐고 나머지 shadow/clip 픽셀은 같았다. 이는 전체 SVG 외부 확대의 효과 오류 해결이나 범용 벡터 품질 증거가 아니다.
- 독립 Astra/high 검토: 미해결 actionable finding 0건. 검토자는 증거를 직접 읽었고 전체 검사를 재실행하지 않았다.
- native Safari 27.0.1: 최신 driver status는 ready였으나 session 생성은 Allow remote automation disabled로 거부됐다. 실제 fixture는 NOT RUN이며 설정·권한을 변경하지 않았다. 본인 전용 서버·driver는 모두 종료했다.

인계 원문은 [구현 집중 검증](../../output/verification/2026-10-23-svg-structure/implementation-focused-freeze.json), [독립 최종 gate](../../output/verification/2026-10-23-svg-structure/final-gates/summary.json), [독립 검토](../../output/verification/2026-10-23-svg-structure/review.json)에 보존했다. 문서 숫자 갱신은 runtime 동결 뒤 별도 문서 검사로 확인한다.

보안 변경분 검사 ID는 `f2f22e60-3421-41f6-a0ac-111cf182fc79`다. HEAD `4168276` 대비 최초 working diff의 source/configuration 20개를 검토하여 보고 가능한 finding은 0건이었다. 검사 snapshot digest는 `d5be18ccb3c9750f802bef629c154462d010002eadb14d673ecb045ac0dd1e2e`이며, 검사 중 source는 변하지 않았으나 테스트의 CTM 단위 교정과 후속 문서가 달라졌으므로 coverage는 partial이고 현재 전체 tree 동일성을 주장하지 않는다. 결과는 Codex Security가 생성한 sealed report에 보존하며 이 worklog를 보안 보고서로 대체하지 않는다. 검사 도구 반환 usage는 codex_rollout·threadCount 1 집계로 total 4,720,296 / input 4,709,686 / cached input 4,657,152 tokens이며 독립 비용 추정은 하지 않는다.

역할 배정은 구현 Sol high, 원인·설계·독립 검토 Astra high, 결정적 검증 Sol medium이다. 보안 scan 등록 metadata는 Sol 6.1/medium이다. 설정 파일 변경만으로 주 채팅 모델이 바뀌었다고 주장하지 않는다. Governance v1.12 adoption은 로컬 미게시다.

**부분 수정 완료, 전체 SVG 품질 및 0.0.2 최종 수용은 보류**다. 일반 flow·중첩 인라인·여러 줄·RTL·pseudo 등 비적격 텍스트, WebKit 전체 SVG 외부 재확대 shadow/clip 및 실제 Safari 검증이 남는다. 최종 pack·commit·push·게시·태그/Release·배포는 수행하지 않았다.
