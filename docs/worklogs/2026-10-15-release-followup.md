# 0.0.1 배포 준비 잔여 항목 확인

작업일: 2026-10-15 18:00~18:03 KST. 대상은 기존 0.0.1 범위의 취약점 조회와 JIS 치수 대조다. 제품 소스·의존성·패키지 설정은 변경하지 않았다.

## 결론

**npm 런타임 의존성의 알려진 취약점은0건이다. Chrome 한정 기술 품질 조건부 합격·공개 배포 준비 보류 판정을 유지한다.** JIS 공식 원문 대조가 미완료이며, 공개용 버전·설정·고정 revision과 별도 publish 승인이 남는다.

## 수행·검증 결과

| 확인 항목 | 결과 | 근거·한계 |
|---|---|---|
| 알려진 런타임 취약점 | PASS, 모든 심각도0건 | npm audit --omit=dev --ignore-scripts --json, exit0. 개발 의존성·범용 보안 감사·미공개 취약점 검증은 포함하지 않음 |
| 후보 동일성 | PASS, manifest80파일 및 tarball SHA256 일치 | 기존 source/dist/guide/설정/의존성/라이선스와 비교. 추적하지 않은 파일 전체의 동일성을 뜻하지 않음 |
| 용지 기하 | PASS, 24조합 | ISO/JIS 각6규격×portrait/landscape의 mm와300PPI px를 공개 함수 및 내부 mm 함수로 확인 |
| ISO 원문 치수 | 기존 확인 재사용 | ISO216:2007 Table1/2와6개 규격 일치. 이번에 원문을 재열람한 것으로 표시하지 않음 |
| JIS 공급업체 치수표 | PASS, 6규격 일치 | TAKEO가 JIS P0138로 명시한 공개 표. 규범 원문 열람을 대신하지 않음 |
| JIS 공식 원문 | INCOMPLETE, 접근 환경 제한 | JISC 일반 PDF는 로그인 필요. 로그인 불필요 음성 PDF 링크는 Chrome ERR_BLOCKED_BY_CLIENT로 차단됨. 우회·구매·계정 생성 없음 |

이전 자동 승인 검토는 private 패키지 메타데이터·의존성 트리의 npm registry 전송 가능성 때문에 audit를 거절했다. 해당 데이터·목적지를 설명한 승인 요청 뒤 사용자의 “다음 단계 진행”을 해당 조회 승인으로 해석해 재실행했으며, 이번 실행은 승인되어 정상 완료했다. 이전 실패 기록은 삭제하지 않았다.

고정 후보는 comins-capture-0.0.0-dev.0.tgz, SHA256 ebf14d84ff9f5a310640fc81d39005c7681b90606371599f6c15b58dfc4ada84다. 현재 private:true·0.0.0-dev.0이며 배포 artifact로 승격하지 않았다.

## JIS 대조 근거

[JISC 공식 검색](https://www.jisc.go.jp/app/jis/general/GnrJISSearch.html)에서 P0138을 검색해 상세 화면의 규격명 紙加工仕上寸法, 최신 개정1998-09-20·최신 확인2022-10-20을 확인했다. 로그인 안내와 일반/음성 PDF 링크가 있는 상세 화면을 로컬 jisc-detail.txt·png로 보존했다. 문서 본문을 확보하지 못했으므로 원문 확인 항목을 닫지 않는다.

[TAKEO 공급업체 공개 표](https://takeopaper.com/knowledge/specific)는 JIS P0138의 A3 297×420, A4 210×297, A5 148×210, B3 364×515, B4 257×364, B5 182×257mm를 제시하며 현재 구현과 일치한다. 이 결과는 구현 치수의 외부 교차 확인이다.

ISO의 이전 근거는 [ISO 공식 정보](https://www.iso.org/standard/36631.html)와 [국가표준기관 원문 preview](https://preview.sist.si/sist-preview/36631/c0883203ea25445c9992bb09343620c5/ISO-216-2007.pdf)다.

## 변경 파일·증거

- docs/release-readiness.md: 현재 Chrome·감사·용지 확인 상태 반영.
- docs/HANDOFF.md: 이전 정리 단계의 오래된 현황을 현재 고정 후보 결과로 갱신.
- docs/worklogs/2026-10-15-0.0.1-benchmark.md: 최초 감사 대기 기록을 대체하는 후속 결과 링크 추가. 원본 측정 자료는 보존.
- docs/worklogs/2026-10-15-release-followup.md: 이번 결과와 남은 조건 기록.
- output/release-review/2026-10-15-followup/: npm-audit.json·stderr, check.mjs, status.json, jisc-detail.txt·png. 로컬 증거이며 배포 files 범위 밖이다.

재현 명령: node output/release-review/2026-10-15-followup/check.mjs. 기존 후보 manifest와 tarball이 있어야 하며 후보 동일성·24용지 조합·저장된 감사 결과를 검사한다. registry 조회는 재실행하지 않는다.

## 잔여 리스크·다음 조치

접근 가능한 공식 JIS P0138:1998 원문으로6개 치수를 확인해야 한다. 정상 로그인된 공식 열람 환경 또는 적법하게 확보한 원문이 필요하다. 그 뒤 공개용0.0.1 버전·package 설정·commit 고정과 해당 후보에 대한 영향 검증을 진행할 수 있다. 현재 manifest와 tarball은 개발 후보의 증거이므로 이후 공개 설정 변경에 자동 적용하지 않는다.

이번 변경은 배포에 포함되지 않는 상태 문서·로컬 증거만 해당하므로 전체 verify·브라우저 벤치마크를 반복하지 않았다. 기존 성공은 해시가 같은 범위만 재사용한다. Safari·다른 브라우저·저사양·장기 메모리·범용 보안 감사는 기존 미검증 범위를 유지한다. commit·push·태그·Release·publish·배포는 수행하지 않았다.
