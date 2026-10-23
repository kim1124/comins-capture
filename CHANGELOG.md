# Changelog

## Unreleased

- 2026-10-23: SnapDOM 3.2.0의 문서 전역 scrollbar 계열 CSS 수집을 캡처별 원본 노드 문맥 수집으로 제한했습니다. 확실히 무관한 규칙만 제외하고, 관련·혼합·판정 불가 selector와 원본 meter/progress/slider 수집 범위 및 import/media 직렬화 의미는 유지합니다. 실제 Table CSS의 thumb:hover 회귀를 고정하고 알려진 native pseudo 뒤의 hover/active 상태만 host 상위집합으로 판정합니다. 관련 상태 규칙은 원문을 유지합니다. CSS 변수·URL/SVG 검증을 완화하지 않으며 취소·해제·수집 예산을 적용합니다. 공개 API·엔진 버전·렌더러·사이트는 변경하지 않은 로컬 미게시 후보입니다.

- 2026-10-23: 일반 block의 단일 Text 한 줄·여러 줄 문단으로 SVG 축소 보정을 확장하고, 배율의 CSSOM 직렬화·Float32 정밀도 문제를 보완하는 로컬 후보를 구현했습니다. 원본 used 크기·static inset·relative 위치·전체 줄 rect 변경 감지와 캡처 이후 출력 불변성을 검증하며 PNG 내장·폰트 변경·강제 nowrap은 없습니다. 독립 검토에서 재현한 float·static 페인트 순서 회귀를 보수적 fallback으로 차단했고, 두 단계 IEEE754 상쇄도 추가했습니다. 새 회귀 51개 및 Chrome DPR1·2/WebKit DPR2 총 30/30 suite, unit73·consumer6·타입·빌드·라이선스·research46을 통과했습니다. 초기 문서 링크 실패는 수정 후 해당 검사 PASS, research listen EPERM은 해당 서버 검사만 허용 환경에서 PASS로 확인했습니다. runtime1,924파일 해시가 유지됐고 독립 검토의 추가 actionable 결함은 없습니다. 일반 배율 전체의 상쇄·기존 CSS zoom 박스 양자화·전체 SVG 외부 확대·native Safari 수용은 보장하지 않습니다.

- 2026-10-23: SVG 축소에서 적격한 절대 배치 단일 텍스트의 원본 content box·문자·글꼴 속성을 캡처 시 보관하고, 컨테이너 효과와 텍스트 배율 처리를 분리했습니다. PNG 내장·강제 nowrap·폰트 변경 없이 원본 줄 배치를 보존하는 부분 수정입니다. padding/border·혼합 인라인·여러 줄·RTL·pseudo 등 비적격 구조는 기존 경로를 유지합니다. 래스터·기본 SVG·확대·reciprocal 경로는 유지하며, 일반 HTML 전체의 SVG 품질 및 WebKit의 외부 재확대 clip 문제 해결을 의미하지 않습니다. 신규 SVG 전용 회귀와 불변 metadata 검증을 추가하며 native Safari·최종 수용은 후속입니다.

- 2026-10-21: direct foreignObject/CSS zoom의 래스터 축소에서 원본 배율1 Canvas를 확정한 뒤 축소하여 대표 normal text 줄 배치·그림자·clip을 함께 보존했습니다. 두 축1이하·한 축1미만인 해당 경로만 적용하며 원본 올림 중간 Canvas와 최종 Canvas에 각각8192변·32M면적 한도를 검사하고 OUTPUT_LIMIT을 정확히 전파합니다. 최종 출력이 작아도 중간 한도 초과로 실패할 수 있습니다. 실제 Canvas 해제·10회 반복·소수 source crop·흰색/투명 cover 여백 회귀를 추가했습니다. 독립 verify(unit59/consumer6)·research46 및 Chrome DPR1/2·WebKit의21개 suite를 통과했습니다. 기존 reciprocal PNG7개·비대상 SVG/raster21개의 집중 byte동일성도 확인했습니다. 새 리비전의 native Safari는 CUA 경합·SafariDriver 원격 자동화 비활성으로 미실행이며 SVG 축소 줄 배치는 미해결입니다. SVG PNG내장·최종 pack·출시 수용·원격 게시·배포는 수행하지 않았습니다.

- 2026-10-21: native Safari 용지 출력의 중첩 clip 소실·위치 오류를 WebKit에서 재현하고 direct foreignObject의 출력 좌표 HTML clip/position wrapper와 mm reciprocal viewport로 보완했습니다. 복잡한 용지·cover·stretch·투명 margin·SVG mm 회귀15개를 추가했습니다. 이후 이전94c19의 실제 Safari27.0.1 DPR2는49개 자동 그룹을 통과했으나 A4 라벨 두 줄 재배치가 재현됐습니다. 이 결과는 후속 래스터 축소 수정의 native 통과로 재사용하지 않습니다. 기존 reciprocal 엔진·보관 SVG·기본 SVG 반환·공개 mm/viewBox 계약은 유지합니다.

- 2026-10-21: 승인된 local-only 경로로 Governance v1.12 공통 정책과 역할 설정을 적용했습니다. Module Guidance·managed block 밖 설정·제품 소스는 보존했습니다. 역할 profile은 로컬 미게시 상태이며 설정 파일 검증을 실행 중인 모델의 자동 변경이나 repository trust 활성화로 해석하지 않습니다.

- 2026-10-19: 해제된 snapshot을 보관할 때 내부 SVG·렌더러·정리 콜백이 남던 참조 누수와 동기 SVG/SVG Blob 출력 중 dispose가 TypeError를 발생시키던 문제를 수정했습니다. 강제 GC 참조 회귀와 즉시 취소 회귀를 추가했습니다. 공개 API·의존성 버전은 유지하며 로컬 미게시 변경입니다.

- 2026-10-19: 직접 foreignObject 좌표를 쓰는 엔진 출력의 배율을 HTML zoom으로 적용하여 native macOS Safari 27.0.1·DPR2의 대표 2배 그림자·중첩 clip 손상을 보완했습니다. 원래 reciprocal SVG group/HTML zoom을 쓰는 엔진 경로는 유지합니다. 0.0.2 로컬 후보의 전체 verify와 native Safari 한정 검사, Chrome UA154·Safari의 네 프레임워크 소비를 통과했습니다. 원격 CI·게시·배포는 수행하지 않았습니다.

- 2026-10-19: 추가 native Safari 엔진 경계 검사 4/6에서 축소 PNG/JPEG 누락을 확인했습니다. WebKit의 cold 대조에서 SVG decode와 내부 XHTML img paint 준비 시점 차이를 분리하고 raster용 검증 SVG 복사본에만 `decoding="sync"`를 적용했습니다. 원본 DOM·SVG 출력·공개 API·의존성·대기 시간은 유지합니다. native Safari 후속 검증은 Mac 잠금으로 미실행이며 Safari 호환성·출시 준비 완료를 선언하지 않습니다. 자원 runner의 단계 진단과 cold 이미지 회귀도 추가했습니다.

- 2026-10-16: PR 리뷰에서 확인한 Material Symbols의 기본 deny 우회 폰트 요청, 엔진 재압축에 따른 이미지 검증 불일치, 큰 PNG Base64 검사 스택 초과를 수정했습니다. 회귀6개와 Chrome155 기능·자원 검증 및 벤치마크를 새로 수행했습니다. 공개 API·의존성 버전은 유지합니다.

- 2026-10-16: README를 Sortable 형식의 영문 소개·기능·설치·시작·프레임워크·API·Playground·후보 상태·지원·라이선스 순서로 정리하고 docs/user·docs/ko의 번호별 참조 문서10쌍과 실제 캡처 미리보기를 추가했습니다. 국문 원본 동기화·문서 정합성 명령을 추가하고 verify에 포함했습니다. private:false·publishConfig.access:public과 홈페이지·이슈 메타데이터를 로컬에 준비했습니다. JIS 원문 열람 대기 조건은 공개 자료 대조와24조합 기하 검증으로 해소했습니다. npm 게시·사이트 배포를 뜻하지 않습니다.

- 2026-10-15: Sensitive data·Package 검증 CI와 공개 Git 신원 검사를 추가했습니다. npm 좌표 오탐 회귀 및 개인 정보 형태 탐지 검사를 포함하며 로컬 계정 경로가 있던 저장소 문서3곳을 정리했습니다. 원격 CI 활성화와 npm 게시 완료를 뜻하지 않습니다.

- 2026-10-15: package·lockfile 버전을 0.0.1 로컬 후보로 맞췄습니다. private:true를 유지하며 JIS 공식 원문 확인과 publish 승인은 대기 중입니다. 런타임 변경 없이 배포 문서에 현재 Chrome 검증·벤치마크 및 알려진 취약점 조회 범위를 반영합니다.

- 2026-10-15: 0.0.1을 정적 HTML·단일 출력·크기/용지 API로 정리했습니다. crop·타일·관련 타입/메타데이터·내부 partial/failure·미사용 lab adapter·미완성 Safari 출력 보완 및 진단 UI를 제거하고 예제·검증 fixture·가이드를 동기화했습니다. 기본 출력·자원/SVG 검증·원본 보존·취소/해제는 유지합니다. 후속 요구와 복구 정보는 개발 memory에 기록했습니다. 출시·Safari 품질 해결을 의미하지 않습니다.

### 정리 이전 개발 이력

- 공개 capture/CaptureError와 snapshot·출력 타입을 연결하고 Playground를 같은 API로 전환했습니다. 실제 tarball의 Vanilla/React/Vue/Svelte 소비와 Node SSR을 검사합니다. 소비 번들에서 엔진 chunk가 빠지는 변수 import와 Svelte DOM 참조 전달 시점을 수정했습니다.

- 내부 정적 DOM 자원 수집·이미지/폰트 준비·최종 SVG 검증을 연결했습니다. SVG·Canvas·PNG·JPEG·WebP·타일은 동일한 검증본을 사용하며 미지원 인코더는 명시적으로 거부합니다. Safari의 폰트 속성 직렬화와 소수점 크기·타일 위치를 보완했습니다. 전체 지원 판정은 후속입니다.

- 고정 SnapDOM 3.2.0 최소 수정본의 재현 가능한 내부 공급 경로와 호출별 확장 계약을 추가했습니다. 원문 라이선스·출처·수정 기록·해시를 검증합니다. 후속 내부 DOM 통합에서 수정본 연결과 제한된 Chrome·Safari 검증을 수행했습니다.

- 내부 자원 취득과 capture/snapshot 수명주기를 연결했습니다. 기본 deny·명시 origin·취소/timeout·동시 실행 제한·partial 유지·늦은 결과 정리를 검증했습니다. 후속 공개 API는 제한된 정적 DOM만 받습니다.

- SnapDOM 3.2.0 조건부 채택과 엔진 교체 경계를 구성했습니다.
- ISO/JIS 용지·타일 계산, SSR import 가능한 기초 export, 자원 요청 정책 기초를 추가했습니다.
- 고정 샘플 Playground와 개발 가이드를 추가했습니다. 설정 초기화·사용 안내·API/소스 탐색 및 실행 가능한 기하 예제를 제공합니다.
- 일반 DOM capture/snapshot과 전체 자원/SVG/브라우저 검증은 진행 중입니다. npm 미배포입니다.

- 내부 snapshot에 크기·CSS crop·ISO/JIS 용지·여백·fit/align·배경 옵션을 연결하고, 검증 SVG 기반 전체/타일 출력의 좌표계를 통합했습니다. PNG 인코딩 설정의 중복 검증 오류를 수정했습니다. Chrome JIS 타일의 1/255 경계 차이는 별도 기록하며 전체 브라우저 지원은 후속입니다.
