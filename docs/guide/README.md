# Comins Capture 가이드

[Comins 웹사이트](https://comins-website.vercel.app/ko/) · [Capture 소개](https://comins-website.vercel.app/ko/capture/) · [시작하기](getting-started.md) · [API](api.md)

2026-10-15 정리 기준. 0.0.1 후보 계약이며 패키지는 로컬 `0.0.1`, 미배포입니다.

1. [개발 시작](getting-started.md): 로컬 실행과 사용 순서
2. [Playground](playground.md): 단일 출력·용지·저장·취소
3. [API](api.md): capture·snapshot·용지·오류
4. [출력 옵션](output-options.md): 크기·단위·품질·한도
5. [입력과 자원](dom-integration.md): 정적 HTML 지원·거부 조건
6. [프레임워크](frameworks.md): Vanilla·React·Vue·Svelte 연동
7. [지원과 검증](support.md): 과거 증거·현재 후보·잔여 조건
8. [엔진 구조](architecture.md): 준비·직렬화·검증·출력 경계
9. [사이트 연동](site-integration.md): website 문서 동기화 경계
10. [문제 해결](troubleshooting.md): 오류 코드·자원·출력·해제 및 재현 자료

crop·타일·partial API는 제거했습니다. 아래 가이드와 실제 export를 현재 계약으로 사용합니다.

빠르게 확인하려면 [Playground](playground.md)를 실행하고 기본·2배·사용자 크기·용지 출력을 비교합니다. 애플리케이션 연동은 [Vanilla](frameworks.md#vanilla-javascript)·[React](frameworks.md#react)·[Vue](frameworks.md#vue)·[Svelte](frameworks.md#svelte) 중 사용 환경을 선택합니다. Comins 사이트의 Capture 소개는 개발 중 안내이며 정식 공개 패키지 안내가 아닙니다.
