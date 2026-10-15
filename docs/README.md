# Comins Capture 문서

[Comins 웹사이트](https://comins-website.vercel.app/ko/) · [Capture 소개](https://comins-website.vercel.app/ko/capture/) · [사용 가이드](guide/README.md)

현재 버전은0.0.1 로컬 후보이며 `private:true`·npm 미배포 상태입니다. 현재 구현 계약은 [사용 가이드](guide/README.md), 출시 판정은 [출시 조건](release-readiness.md)을 우선합니다. 과거 연구 문서의 기능 목록이나 성공 기록을 현재 지원 범위로 해석하지 않습니다.

## 사용자를 위한 문서

| 목적 | 문서 | 확인할 예제·결과 |
|---|---|---|
| 설치·첫 캡처·파일 저장 | [시작하기](guide/getting-started.md) | 정적 card를 PNG로 만들고 저장·해제 |
| 공개 함수·타입·오류·소유권 | [API](guide/api.md) | capture·snapshot·paperSize·CaptureError |
| 형식·배율·용지·여백·fit | [출력 옵션](guide/output-options.md) | 기본·2배·800×600·A4·JIS B4 |
| 정적 HTML·이미지·폰트 | [입력과 자원](guide/dom-integration.md) | same-origin 또는 Blob resolver·명시 오류 |
| Vanilla·React·Vue·Svelte 소비 | [프레임워크](guide/frameworks.md) | 렌더 완료·언마운트 취소·URL 정리 |
| 샘플 조작·저장·취소 | [Playground](guide/playground.md) | localhost6004의 형식·크기·배경·초기화 |
| 오류 원인과 조치 | [문제 해결](guide/troubleshooting.md) | code/stage·최소 재현 자료 |
| 실제 검증 환경·제한 | [지원 상태](guide/support.md) | 실제 Chrome·미지원 Safari·잔여 출시 조건 |
| 엔진과 출력 경계 | [구조](guide/architecture.md) | 같은 검증 SVG에서 단일 출력 생성 |

기능별 가이드에서 실제 예제와 검증 근거를 확인할 수 있습니다. Capture의 네 프레임워크는 같은 루트 API를 소비하며 별도 adapter export를 제공하지 않습니다. 웹사이트의 Capture 페이지는 개발 중 소개이고 현재0.0.1 API 원본은 이 저장소의 guide입니다.

## 저장소 작업 문서

| 목적 | 문서 |
|---|---|
| 변경 요청·구현·기여 절차 | [기여 안내](../CONTRIBUTING.md) |
| 디렉터리·명령·검증·증거 보존 | [저장소 안내](development/repository-guide.md) |
| 최초 공개 후보와 승인·게시 후 확인 | [출시 준비](development/releasing.md) |
| 현재0.0.1 범위와 수용 조건 | [출시 조건](release-readiness.md) |
| 작업 재개 시 현재 상태 | [인계](HANDOFF.md) |
| 제거 기능·차기 검토·복구 정보 | [차기 버전 memory](development/next-version-memory.md) |
| 별도 website 문서 동기화 | [사이트 연동](guide/site-integration.md) |

## 현재 품질 근거

- [코드 정리](worklogs/2026-10-15-initial-scope-cleanup.md): 최초 범위 확정과 미완성 코드 제거.
- [벤치마크](worklogs/2026-10-15-0.0.1-benchmark.md): 실제 Chrome 기능·화면·성능·반복 안정성.
- [후속 확인](worklogs/2026-10-15-release-followup.md): 알려진 런타임 취약점0건과 JIS 원문 접근 제한.
- [로컬 후보 준비](worklogs/2026-10-15-0.0.1-candidate-preparation.md): 버전·패키지·라이선스·민감정보·오프라인 소비 검사.

worklog는 해당 시점·artifact의 기록입니다. 그 뒤 문서나 패키지가 바뀌면 이전 tarball을 현재 checkout 전체와 동일하다고 표시하지 않습니다. 원본 로그·화면·해시는 로컬 `output/`에 보존하며 Git/배포파일에 넣지 않습니다.

## 과거 연구·설계 자료

[엔진 채택](engine-adoption.md), [연구](research.md), [과거 API 설계](api-spec.md), [엔진 후속 검토](conditional-adoption-followup.md), `docs/superpowers/`의 계획과 이전 worklog는 설계 배경 및 실패 재현 자료입니다. crop·타일·partial·Safari 보완 등 현재 제거되거나 이월된 항목을 포함합니다. 새 구현에 적용하기 전 현재 가이드와 대조합니다.

`docs/guide`만 사용자 가이드로 npm 패키지에 포함됩니다. 이 목차와 `docs/development`, worklog, 연구 문서는 저장소에서 사용합니다.
