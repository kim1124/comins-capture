> 2026-10-15: 이 문서는 정리 이전의 설계·구현 기록입니다. crop·타일·partial 및 실험 어댑터는 현재 코드에서 제거했습니다. 현재 계약은 docs/guide, 차기 재개 정보는 docs/development/next-version-memory.md를 따릅니다.

# 자원 취득과 스냅샷 수명주기 — 내부 통합

초기 기록 기준: 2026-10-04, 로컬 `0.0.0-dev.0`. 공개 npm API 완성이 아닌 내부 구현 단계다.

2026-10-12 후속: 정적 HTML 준비·검증과 동일 검증 SVG의 모든 출력 연결을 구현했습니다. 아래 초기 기록의 미연결 항목은 [현재 DOM 통합 범위](guide/dom-integration.md)로 갱신합니다.

## 구현한 경로

```text
ready → inspect → resolveResources → prepare → engine.capture
  → verify → assertUnchanged → 고정 snapshot
  → toSvg / toBlob / toCanvas / tiles → dispose
```

- `src/core/capture.ts`: `createCapturePipeline`은 필수 inspect/prepare/verify와 엔진을 조립한다. 일반 DOM용 기본 구현은 설치하지 않는다. 검사 생략이나 자동 pass 경로가 없다.
- `src/resources/resolve.ts`: 자원 manifest 의존성을 먼저 확인한 뒤 바이트를 해결한다. 순서는 안전하게 제공된 메모리 Blob → 소비자 resolver → 명시 허용 네트워크다. 누락/순환/중복 ID는 resolver 호출 전에 실패한다. 같은 종류·URL의 바이트는 한 실행 내에서 재사용한다.
- `src/lifecycle/operation.ts`: 취소, 기본 30초 deadline, 늦은 결과 폐기 및 실제 작업 종료 대기를 관리한다. timer와 단조 증가 시계의 경과 시간 검사를 함께 사용한다.
- `src/core/snapshot.ts`: 고정 SVG·원본 크기 래스터·고정 타일 출력의 수명주기를 관리한다. 결과는 같은 snapshotId, 상태 및 정제 진단을 유지한다.
- `src/errors.ts`: 안정적인 코드/단계와 상수 진단을 제공한다. 소비자·엔진 예외의 message/cause를 전달하지 않는다.

`src/index.ts`와 package exports는 바꾸지 않았다. 공개 함수는 여전히 paperSize와 planTiles다. 위 파일의 deep import는 소비자용 계약이 아니다. Playground도 기존 고정 샘플 어댑터를 유지한다.

## 네트워크 계약

기본 deny에서는 메모리나 resolver로 해결되지 않은 자원을 NETWORK_DISABLED로 거부한다. resolver가 undefined를 반환할 때만 명시 허용 네트워크를 검토하며, throw/reject하면 RESOURCE_FAILED로 끝난다.

- same-origin은 입력 문서 URL의 origin 기준이다. 수집기는 원본의 baseURI를 사용해 각 자원 URL을 절대 URL로 만들고, 문서 URL은 별도로 전달해야 한다. `<base>`의 외부 origin을 문서 origin으로 사용해서는 안 된다.
- origin 목록에는 정확한 HTTP(S) origin 문자열만 허용한다. 경로·사용자 정보·다른 프로토콜은 옵션으로 거부한다.
- credentials 기본 omit. 명시적인 same-origin도 교차 출처 요청에는 적용하지 않는다.
- redirect:error, referrerPolicy:no-referrer. HTTP 오류·opaque 응답·예상과 다른 출처 결과를 성공으로 처리하지 않는다.
- 전역 fetch 변경, 프록시, 앱 요청 차단, 캡처 간 공유 캐시는 없다.
- 취득 Blob이 존재한다는 사실은 해당 이미지/폰트/SVG가 안전하거나 올바르게 삽입됐다는 증거가 아니다. prepare/verify 책임으로 유지한다.

## 수명주기와 소유권

같은 Document의 capture 및 같은 snapshot의 출력은 BUSY로 거부한다. capture 완료 후 원래 signal의 abort는 반환된 snapshot에 영향을 주지 않는다. 각 출력은 독립 signal과 timeout을 사용한다.

취소를 무시한 엔진이 실행 중이면 호출자는 ABORTED/TIMEOUT을 받지만, 해당 Document의 잠금과 준비 자원은 실제 작업이 끝날 때까지 유지한다. 늦게 반환된 artifact는 폐기한 다음 잠금을 해제한다. **엔진/콜백이 영원히 끝나지 않으면 잠금도 유지된다.** 강제 중단 가능한 실행 격리 기능은 구현하지 않았다.

타일을 yield한 채 대기 중일 때 abort/timeout이 발생하면, 실제 처리 중인 작업이 없는 경우 BUSY 잠금을 해제한다. 이전 iterator를 재개하면 취소 오류를 반환한다. 중간 break는 즉시 iterator를 정리한다. 이미 반환한 Blob/Canvas/문자열은 소비자 소유이므로 snapshot.dispose로 변경하지 않는다. 아직 전달하지 않은 취소 Canvas는 폐기한다.

일부 결과는 toSvg/toBlob/toCanvas/tiles에서도 partial을 유지한다. 기본 failure:error에서는 부분 snapshot 자체를 반환하지 않는다.

## 이번 출력 구현의 경계

현재 내부 출력은 원본 크기만 처리한다. size/crop/paper/fit/background 옵션을 구현한 것처럼 받아들이지 않는다. 일반 DOM 준비와 함께 해당 레이아웃 계약을 후속 연결한다. JPEG 내부 출력은 흰 배경, JPEG/WebP 품질 기본 0.92이며 실제 Blob MIME과 Canvas 크기를 검사한다.

원본 크기의 소수 CSS 좌표와 브라우저 엔진 반올림, 고해상도 직접 렌더링, 전체 SVG 크기 변환은 아직 브라우저에서 검증하지 않았다. 검사/준비/엔진 double을 사용한 수명주기 테스트를 실제 엔진의 렌더링 검증으로 표시하지 않는다.

## 실행 검증

```sh
npm run verify
node --test test/integration/resource-http.test.mjs
```

두 번째 명령은 임시 localhost HTTP 서버를 사용하므로 listen 권한이 필요하다. 인터넷 요청은 없다.

- unit 29개, consumer 2개, HTTP integration 2개 통과.
- 취소/timeout/late result, 원본 재접근 없는 SVG, partial 전파, MIME/크기 불일치, 반복 dispose, 타일 break와 끝 영역, 옵션 검증을 확인했다.
- 실제 HTTP 요청 장부로 deny 0건, redirect 대상 0건, 허용 요청·404·응답 중 취소를 확인했다. Node fetch 증거이며 브라우저 쿠키·CORS·CSP 검증은 아니다.
- 리뷰에서 종료 직전 취소 및 동기 timeout 문제를 재현한 뒤 RED→GREEN으로 수정했다. yield 대기 잠금과 옵션 오류도 같은 방식으로 수정했다.
- 정식 Codex Security diff scan은 resolvable HEAD 부재로 시작하지 못했다. 별도 소스·테스트 비밀정보 검사와 구분한다.

## 다음 제품 통합

일반 DOM ResourceManifest 수집 → 원본을 변형하지 않는 준비 DOM → 삽입 추적과 SVG 활성 내용/중첩 자원 검증이 필요하다. 이 단계들을 실제 Chrome·Safari에서 검증한 뒤 public capture를 연결한다. 외부 엔진 조건부 채택과 교체 가능한 내부 경계는 유지하며 자체 엔진 구현을 선행하지 않는다.
