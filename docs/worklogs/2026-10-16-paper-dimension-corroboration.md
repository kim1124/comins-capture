# 0.0.1 공개 자료를 통한 용지 치수 확인

작업일: 2026-10-16 KST. 실행 모델은 gpt-6.1-sol, 추론 수준 high이며 하위 에이전트는 사용하지 않았다. 적용 Contract v1.12는 승인된 로컬 미게시본이다.

## 결론과 수용 기준

사용자의 공개 수치 대체 검증 지시에 따라 JISC 로그인·공식 원문 직접 열람을 0.0.1 용지 치수 항목의 필수 조건에서 제외한다. 업체 공식 공개 자료 간 수치 일치와 실제 구현의 mm·방향·픽셀 변환 검증을 수용 근거로 삼는다. **용지 치수 항목은 완료**이며 원문 직접 열람 미실시 사실은 유지한다. 이전 worklog의 원문 미확보·로그인 요청은 당시 상태이며 현재 차단 조건이 아니다.

JIS 규격 전체 적합성이나 인증을 판정하는 작업은 아니다. 제품은 지정한 mm 치수를 출력 크기로 사용하는 프리셋을 제공한다. 종이의 제조 허용차·물리적 측정 조건을 보증하지 않는다.

## 직접 확인한 공개 자료

- [TAKEO: JIS P0138 치수표](https://takeopaper.com/knowledge/specific): A3/A4/A5/B3/B4/B5 전체 6규격. JIS P0138을 명시한다.
- [후지필름: 용지 치수표](https://www.fujifilm.com/fb/ja/support/colorprint/howto/paper/size): A열·일본 B열 전체 6규격. TAKEO의 값과 모두 일치한다.
- [리코: 사용 가능한 용지의 실측 치수표](https://faq.ricoh.jp/app/answers/detail/a_id/4321/p/2023): A3/A4/A5/B4/B5 5규격의 추가 교차 확인. B3 근거로 사용하지 않는다.

세 자료는 이번 작업에서 로그인 없이 본문을 열람했다. 아래는 portrait 기준 값이며 landscape는 두 변을 바꾼다.

| JIS 이름 | mm | TAKEO·후지필름 | 리코 |
|---|---|---|---|
| A3 | 297×420 | 일치 | 일치 |
| A4 | 210×297 | 일치 | 일치 |
| A5 | 148×210 | 일치 | 일치 |
| B3 | 364×515 | 일치 | 해당 표에 없음 |
| B4 | 257×364 | 일치 | 일치 |
| B5 | 182×257 | 일치 | 일치 |

ISO B3/B4/B5는 각각 353×500, 250×353, 176×250mm로 JIS B와 구분한다. ISO는 [이전 ISO 216:2007 원문 대조 기록](2026-10-15-release-followup.md)의 기준값을 재사용했으며 이번에 원문을 재열람한 것으로 표시하지 않는다. 비공식 규격 재게시 사이트는 이번 수용 근거로 사용하지 않았다.

## 변경과 검증

변경 파일은 docs/release-readiness.md, docs/development/releasing.md, docs/HANDOFF.md, docs/guide/output-options.md 및 이 기록이다. 제품 소스·테스트 계약·의존성·package 설정을 변경하지 않았다. 기존 worklog·후보·artifact는 덮어쓰지 않았다.

로컬 증거: output/release-review/2026-10-16-paper-dimensions/check.mjs 및 status.json. 공개 자료에서 직접 읽은 두 업체의 6규격 값과 리코의 5규격 값을 별도로 기록한 뒤 교차 대조한다. 재실행 명령은 `node output/release-review/2026-10-16-paper-dimensions/check.mjs`이며 이 명령은 저장된 기준값과 현재 구현을 검사하고 외부 페이지를 다시 조회하지 않는다.

- PASS: ISO/JIS 각6규격×portrait/landscape, 총24조합. 공개 paperSize의 300 PPI px, 내부 paperMillimeters의 mm, 실제 출력 경로 planLayout의 raster px·SVG mm 및 단위를 확인했다.
- PASS: src21개·dist43개 총64파일이 기존 벤치마크 manifest의 해시와 일치한다. 이번 문서 변경을 기존 tarball에 포함된 것으로 간주하지 않는다.
- PASS: 기존 geometry·layout 단위 검사7/7과 변경 문서의 상대 링크·표 수치·diff 공백 검사를 수행했다.
- NOT RUN: 전체 npm run verify·새 브라우저 벤치마크·원격 CI·새 tarball 검증. 제품·패키지·테스트 계약 변경이 없어 전체 게이트를 반복하지 않았다. 기존 검증의 범위와 한계는 이전 기록을 따른다.

## 잔여 이슈와 다음 순서

용지 수치가 남은 배포 차단 사유는 아니다. 현재 private:true·0.0.1·미배포 상태이며 공개용 설정·최종 문서를 포함한 artifact와 소스 revision 고정, 원격 CI·필수 체크 확인 및 별도 게시 승인은 남는다. Safari의 알려진 실패와 다른 브라우저의 미검증 상태도 바뀌지 않는다. 이번 작업에서는 commit·원격 쓰기·구매·계정 생성·publish·사이트 변경을 수행하지 않았다.
