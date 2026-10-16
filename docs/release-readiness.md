# 최초 출시 범위와 완료 기준

갱신: 2026-10-16 KST. 2026-10-13의 0.0.1 범위 축소, 2026-10-15의 중단·미완성 코드 제거 지시, 2026-10-16의 공개 치수 자료를 통한 대체 검증 지시를 적용합니다. 현재 `private:false`, `0.0.1`, 미배포입니다.

## 0.0.1 제품 범위

- 연결된 정적 HTMLElement의 단일 PNG/JPEG·Canvas·foreignObject SVG. WebP는 네이티브 요청 MIME 지원 시 제공하며 미지원은 FORMAT_UNSUPPORTED입니다.
- 기본 CSS 1배·scale·device DPR·custom pixels, ISO/JIS A3/A4/A5/B3/B4/B5, orientation·margin·fit·align·background. 용지는 래스터 기본 300 PPI, SVG mm입니다.
- capture, snapshot toBlob/toCanvas/toSvg/meta/dispose, paperSize, CaptureError와 관련 타입만 공개합니다.
- 원본 보존·일반 lifecycle·unsupported 입력 명시 오류·default deny·SVG 검증·자원 오류·패키지/라이선스 기초 안전성을 유지합니다. 부분 성공·자동 포맷 대체·자동 해상도 축소는 제공하지 않습니다.

## 코드 정리와 후속 범위

crop·planTiles·snapshot.tiles·관련 타입 및 메타데이터, 내부 allow-partial/failure 경로, 미사용 lab adapter, Safari 전용 미완성 출력 wrapper와 타일·그림자 진단 버튼을 제거했습니다. 미지원 입력을 거부하는 검사와 일반 출력 clipping은 보존합니다.

Shadow DOM·sticky/fixed·폼/scroll·전체 페이지, crop·타일 strict 접합·12/50 대형 타일·회전 AA, Safari/Edge/Firefox·실제 모바일, 자체 엔진·PDF·녹화·WebView·의미 단위 분할은 차기 버전 후보입니다. 버전·구현·지원 승인은 미정입니다. [이월 memory와 복구 정보](development/next-version-memory.md)를 따릅니다.

## 검증과 수용

코드·타입·패키지 변경이 끝나면 npm run verify를 한 번 실행하고 실패하거나 영향을 받은 검사만 추가합니다. 연구 mechanics 변경 시 test:research, Python workbench 변경 시 Python 단위 검사를 적용합니다.

실제 Chrome 후보에서 실행 버전을 확인하고 동일 대표 fixture의 원본과 기본·2배·800×600 custom·A4 300 PPI·JIS B4 landscape를 비교합니다. 5개 출력에 PNG/JPEG·Canvas·SVG 계약 확인을 배치하고 치수·텍스트·레이아웃·색·이미지·그림자·clip을 확인합니다. 미세 AA 진단과 육안·기하 손상을 구분합니다. crop·타일과 원본 전체 픽셀 exact 일치는 0.0.1 수용 조건이 아닙니다.

기존 증거는 관련 소스·설정·의존성이 같을 때 해당 범위만 재사용합니다. 정리 후 고정 tarball을 실제 Chrome 154.0.8037.98에서 검증했으며 기능15/15·자원/SVG15/15·반복30회 실패0입니다. 설치 Chrome 155나 다른 브라우저의 지원 증거로 확대하지 않습니다. Safari의 알려진 shadow/clip 실패는 해결 판정 없이 보존하며 정식 지원에서 제외합니다. [벤치마크](worklogs/2026-10-15-0.0.1-benchmark.md)를 따릅니다.

용지 치수는 출처가 명확한 공개 자료의 교차 대조와 mm·방향·픽셀 변환 검증으로 확인합니다. JISC 로그인이나 공식 원문 직접 열람을 필수로 요구하지 않습니다. 후보의 패키지·라이선스·기초 안전성·공개 문서 정합성은 별도 확인합니다. 과거 G1~G4 전체 확대 gate, 범용 보안 감사, 모든 CSS·브라우저 보증은 선언하지 않습니다.

2026-10-15 첫 후속 확인 당시 개발 후보 manifest80파일과 tarball 해시가 벤치마크 당시와 같았습니다. npm 런타임 의존성 감사의 알려진 취약점은0건입니다. ISO6개 규격은 원문 대조 완료, JIS6개 규격은 용지 공급업체 공개 표와 일치하지만 공식 원문 대조는 미완료입니다. JISC 일반 PDF는 로그인 필요, 로그인 불필요 음성 PDF는 브라우저 차단으로 열람하지 못했습니다. [후속 확인 보고서](worklogs/2026-10-15-release-followup.md)에 당시 증거를 기록합니다.

2026-10-16 TAKEO·후지필름 공개 표의 JIS 6규격이 모두 일치하고, 리코 표의 A3/A4/A5/B4/B5도 일치함을 확인했습니다. ISO/JIS 각6규격×2방향의 mm·300 PPI px 검증 24조합을 통과했습니다. **용지 치수 확인 항목은 완료**이며 JIS 원문 직접 열람은 미실시로 기록합니다. 규격 전체 적합성이나 인증을 의미하지 않습니다. [공개 자료 대조 기록](worklogs/2026-10-16-paper-dimension-corroboration.md)을 따릅니다.

후속 로컬 준비에서 package·lockfile 버전을0.0.1로 맞추고 배포 문서를 갱신했습니다. 당시 private:true를 유지했습니다. 새 후보 tarball57파일의 allow-list·Gitleaks·오프라인 설치 및 소비 검사와 전체 verify(unit48/consumer5/type/build/license)를 통과했습니다. src21개·dist43개는 벤치마크 대상과 byte동일하며 브라우저·성능 결과는 그 범위만 재사용합니다. 후보 SHA256·소스 해시는 [0.0.1 후보 준비 보고서](worklogs/2026-10-15-0.0.1-candidate-preparation.md)에 고정합니다. **Chrome 한정 기술 품질 조건부 합격·공개 배포 준비 보류**를 유지하며 현재 공개용 설정(private:false·publishConfig.access:public)은 로컬에 준비했습니다. 최종 문서 포함 artifact·소스 revision 고정·원격 CI 및 publish 승인은 별도 확인합니다.

최초 README·guide 보완은 위57파일 tarball 생성 뒤에 이루어졌으며 당시 runtime·패키지 설정은 같았습니다. 이후 공개용 설정과 한영 문서를 포함한 새 후보를 아래와 같이 준비했습니다. 이전 tarball은 갱신 문서를 포함하지 않습니다. 사용자·저장소 문서의 위치는 [문서 목차](README.md)를 따릅니다.

2026-10-16 README와 번호별 한영 참조10쌍·미리보기를 새81파일 후보에 포함했습니다. 공개용 설정은 private:false·publishConfig.access:public이며 npm 미배포입니다. 전체 verify(unit52/consumer6/type/build/license/docs), 후보 allow-list·추출본 Gitleaks·문서 링크·별도 offline 소비/타입 검사를 통과했습니다. 실제 후보와 소스 고정 정보는 [최신 준비 기록](worklogs/2026-10-16-reference-docs-candidate.md)을 따릅니다. 이후 원격 CI·필수 체크·게시 승인 및 게시 후 확인은 남아 있습니다.

## 증거와 승인 경계

2026-10-13 과거 성공·FAIL은 worklogs/2026-10-13-public-api-consumers.md와 worklogs/2026-10-13-release-acceptance.md 및 output의 원본 증거에 보존합니다. 정리 작업의 검증은 별도 2026-10-15 worklog를 따릅니다.

제품·CI의 로컬 고정 revision은1af0fae이며 현재 브랜치는 codex-governance-v111입니다. 이번 문서 변경은 해당 revision 이후 작업입니다. 정리 전 복구본은 output/maintenance/2026-10-15-initial-scope/before-cleanup.tgz입니다. 기존 AGENTS/.codex 변경은 별도 작업으로 보존합니다. 적용 Contract v1.12는 승인된 로컬 미게시본입니다. push·PR·태그·Release·publish·배포는 별도 승인 단계입니다.
