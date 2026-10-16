# Comins 사이트 연동

[Comins 웹사이트](https://comins-website.vercel.app/ko/) · [Capture 소개](https://comins-website.vercel.app/ko/capture/) · [웹사이트 Capture 개요](https://comins-website.vercel.app/ko/docs/capture/overview/)

문서 원본은 이 저장소의 `docs/guide`입니다. 별도 website 저장소의 한·영 가이드와 배포 패키지 기반 예제는 이 계약에 맞춰 동기화해야 합니다. 이번 정리는 capture 저장소에만 적용합니다.

2026-10-15 공개 링크 확인에서 홈페이지·브랜드 심벌·Capture 소개·Capture 개요가 HTTP200으로 응답했습니다. Capture 소개의 제목은 Coming Soon이며 정식 출시나 최신 저장소 문서 동기화를 뜻하지 않습니다. 웹사이트에 남은 개발 로드맵보다 현재 저장소의 [API](api.md)·[지원 상태](support.md)를 구현 기준으로 사용합니다.

- 개발 단계는 미배포·noindex 상태를 유지하며 npm 설치 가능한 버전으로 표시하지 않습니다.
- 공개 예제는 패키지 루트의 capture·CaptureError·paperSize만 사용합니다.
- crop·타일·partial과 내부 adapter deep import를 공식 기능으로 안내하지 않습니다.
- 실제 배포 artifact·버전·소스 commit 확보 후 module catalog·source snapshot·guide sync와 데모 버전을 일치시킵니다.
- 생성된 동기화 파일은 직접 수정하지 않습니다. 사이트 배포는 별도 승인·실행 단계입니다.
