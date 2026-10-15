# Changelog

## Unreleased

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
