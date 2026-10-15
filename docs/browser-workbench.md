# 실제 브라우저 공통 검증 화면

작성·검증: 2026-10-02 (Asia/Seoul). 제품 npm 모듈 구현이 아닌, 후보 엔진을 실제 브라우저에서 평가하는 로컬 연구 도구다. 기존 비교 실험과 결과는 보존했다.

## 구현 범위

`output/playwright/workbench/`에 원본 준비 → 캡처 → 원본·PNG 비교 → 관찰 기록 → 실행별 증거 저장 흐름을 추가했다. Vanilla HTML·ES modules·Python 표준 라이브러리만 사용하며 신규 npm 의존성이나 브라우저 설정 변경은 없다.

- 고정 크기 640 × 420 CSS px, `dpr: 1`, `scale: 1`의 PNG 캡처.
- 폼 현재 값·스타일·canvas, 스크롤·sticky, 이미지 동일 출처/CORS 허용/미허용/404/CSP, 폰트 정상/404/로드 후 재요청 실패 등 10개 시나리오.
- 원본 iframe과 결과를 같은 CSS 표시 크기로 비교한다. 창이 좁으면 비교 영역에 스크롤이 생기며 원본을 임의 축소하지 않는다.
- 출력 크기·MIME, 원본 DOM·입력값·선택 상태·포커스 식별·스크롤, 이미지 로드 상태, 폰트 로드 및 결과 내 삽입 단서를 측정한다. 전체 DOM 상태 또는 모든 자원의 완전한 검증은 아니다.
- 이미지 생성·자원 진단·원본 보존·직접 시각 검토를 분리한다. 자동 진단만 통과한 결과는 `review-required`이며, 시각 차이는 최종 `fail`로 기록한다.
- 서버 발급 실행 ID별로 `capture.png`, `report.json`을 저장한다. 기존 실행의 덮어쓰기는 거부한다. 원본 브라우저 화면 스크린샷은 현재 파일로 자동 저장하지 않으며, 이번 직접 비교는 컴퓨터 사용 도구의 화면 관찰과 보고서의 관찰 내용으로 남겼다.
- 원본 준비 때 폰트 200 응답, 캡처 직전에 해당 실행만 503 응답으로 바꾼다. Playwright 요청 가로채기 없이 Safari에서도 동일하게 재현된다. 이는 HTTP 실패 실험이며 이전의 클라이언트 요청 중단과 오류 유형은 다르다.
- 서버는 127.0.0.1에만 바인딩한다. Host·Origin·JSON 요청·전용 헤더를 검사하고, 고정 경로만 제공한다. 결과는 로컬에만 저장하며 임의 웹사이트 캡처·업로드·프록시는 제공하지 않는다.

## 실행

기존에 별도로 준비한 `@zumer/snapdom@3.2.0` 배포 파일과 수정하지 않은 Liberation Sans 폰트 경로를 지정한다. 경로는 아래 플레이스홀더를 실제 환경에 맞춰 바꾼다. 시작 전 엔진의 패키지 버전이 3.2.0인지 확인한다.

```sh
python3 output/playwright/workbench/server.py \
  --snapdom /path/to/snapdom-3.2.0/dist/snapdom.mjs \
  --font /path/to/LiberationSans-Regular.ttf
```

브라우저에서 `http://127.0.0.1:8775`를 연다. 교차 출처 실험은 같은 컴퓨터의 8776 포트를 사용한다. 파일 URL로 직접 열면 실행되지 않는다. 서버 재시작 후에도 저장된 결과 파일은 보존되지만 준비 중인 실행은 다시 시작해야 한다. 서버 세션당 최대 256개 실행을 준비할 수 있다.

브라우저·버전 필드는 운영자가 설치 정보 또는 앱 정보로 확인한 값을 입력한다. 자동 수집한 UA와 구분하여 저장한다. 실행 시점의 최신 정식 버전인지 별도로 대조해야 하며, 이 필드가 최신성이나 브라우저 신원을 자동 인증하지 않는다.

## 직접 검증 결과

Chrome extension 기반 UI 조작과 macOS Safari 앱의 네이티브 UI 조작으로 수행했다. 이번 검증에 headless나 Playwright WebKit을 사용하지 않았다. 측정 당시 두 브라우저의 장치 DPR은 2였고 출력은 합의한 기본값인 1배였다.

| 실제 환경 | 실행·저장 | 관찰 및 판정 |
|---|---:|---|
| Chrome 154.0.8037.93 | 10개 시나리오 | 전부 640 × 420 PNG 생성 및 측정 대상 원본 상태 유지. CORS 미허용·404·CSP·폰트 실패 5개는 자원 진단 실패. 폼 테두리·textarea 표시 차이 직접 관찰. 나머지 9개의 시각 판정은 미검토 상태로 저장. |
| Safari 27.0, build 22625.1.29.11.27 | 4개 시나리오 | 폼·sticky·정상 폰트·폰트 재요청 실패 실행. 전부 PNG 생성. 정상 폰트는 관찰 범위에서 글꼴·문자 폭·배치 유지. 폼의 기본 컨트롤 외형 변경, sticky 머리글 누락, 재요청 실패 후 대체 폰트 출력 직접 확인. |

주요 원본 기록:

- [Chrome 폼](../output/playwright/workbench/results/5dafae8d-c607-4d95-924b-57ef9739dada/report.json)
- [Safari 폼](../output/playwright/workbench/results/2619dca2-0534-451c-bfe9-6d652beeb37e/report.json)
- [Safari sticky 누락](../output/playwright/workbench/results/af362233-efcb-48bd-9213-ace7c28770d7/report.json)
- [Safari 정상 폰트](../output/playwright/workbench/results/6d8f7098-f76a-47f1-8aae-a375d59df0cb/report.json)
- [Safari 폰트 재요청 실패](../output/playwright/workbench/results/4dc6d7d9-7f22-45a3-8629-65d78079aa29/report.json)
- [Chrome 폰트 재요청 실패](../output/playwright/workbench/results/61c18dd9-b7bf-4535-bbd6-6d591ef3f840/report.json)

폰트 재요청 실패 기록은 두 브라우저 모두 `prepare/font/200 → capture/font/503`, `fontLoaded: true`, `fontDataUris: 0`을 포함한다. 엔진 경고만으로 판단하지 않고 검증 도구가 누락을 진단했다. 이 단일 폰트 fixture의 검사를 임의 페이지의 모든 폰트 누락 감지로 일반화하지 않는다.

## 검증 명령 및 결과

```sh
python3 -m unittest discover -s output/playwright/workbench -p 'test_*.py'
node --test output/playwright/workbench/assess.test.mjs
node --check output/playwright/workbench/app.mjs
node --check output/playwright/workbench/fixture.mjs
# 서버 실행 후
python3 output/playwright/workbench/verify_http.py
```

- 저장·실행 격리 6개 테스트 통과.
- 출력·자원·시각 판정 분리 3개 테스트 통과.
- HTTP 출처·Host 경계, 실행별 실패 격리, 중복 arm 및 경로 제한 12개 확인 통과.
- JavaScript 문법 및 Python 컴파일 확인 통과.
- 최초 로컬 서버 실행·HTTP 확인은 실행 환경의 네트워크 제한으로 실패했으며, 허용된 실행 환경에서 같은 명령으로 재확인했다. 제품 오류로 분류하지 않는다.

이는 선택한 로컬 검증 결과다. 정식 npm 패키지 빌드·프레임워크 E2E·전체 보안 스캔 또는 최신 브라우저 전체 지원 인증은 수행하지 않았다.

## 라이선스 및 잔여 범위

SnapDOM 3.2.0(MIT)과 Liberation Sans(OFL-1.1)는 기존 로컬 원본을 읽으며 작업 폴더에 엔진·폰트 파일을 복사하지 않았다. 폰트가 삽입된 SVG도 저장하지 않았다. 이번 산출물은 자체 코드·합성 fixture·PNG·JSON이며, 배포 시 엔진·폰트 동봉 여부가 달라지면 라이선스 조건을 다시 확인해야 한다.

PNG 이외 형식, 배율 조정, 용지 PPI, crop·분할, 긴 페이지, 취소·메모리 한도, Edge·Firefox, 실물 모바일은 이번 첫 검증 화면의 범위에 포함하지 않았다. 기존 제품 요구사항은 그대로 유지한다. 다음 확장에서도 동일 시나리오와 판정 계약을 재사용한다.

SnapDOM은 계속 후보 엔진이다. 실제 Safari 조작 가능성과 실험의 재현성은 확인했지만, 기본 컨트롤 외형·sticky 보존·자원 실패 처리 보완 전에는 제품 엔진 채택 완료로 처리하지 않는다.
