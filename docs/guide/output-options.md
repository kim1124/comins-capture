# 단일 출력 옵션

2026-10-15의 0.0.1 후보 구현 기준. 모든 출력은 같은 검증 SVG에서 생성하며 원본 DOM을 다시 캡처하지 않습니다. crop·타일 API는 없습니다.

## 크기·용지

| 출력 | size | 기본값 |
|---|---|---|
| Canvas·PNG·JPEG·WebP | `{kind:'scale', value:number \| 'device'}` | CSS 1배, device는 캡처 당시 DPR |
| 같은 래스터 출력 | `{kind:'pixels', width, height}` | 양의 정수 px |
| 같은 래스터 출력 | `{kind:'paper', name, system?, orientation?, ppi?, marginMm?}` | ISO·portrait·300 PPI·여백 0 |
| SVG 문자열·Blob | `{kind:'css', width, height}` | 원본 CSS 크기 |
| SVG 문자열·Blob | `{kind:'paper', name, system?, orientation?, marginMm?}` | mm 크기·동일 수치 viewBox. PPI 금지 |

name은 A3/A4/A5/B3/B4/B5, system은 iso/jis입니다. marginMm은 top/right/bottom/left 네 값을 모두 받습니다. 래스터는 mm×PPI÷25.4를 반올림하며 A4 300 PPI는 2480×3508 px, 10 mm 여백은 각 118 px입니다. PPI는 픽셀 계산용이며 파일 DPI 메타데이터를 재작성하지 않습니다.

## 배치·포맷

원본 전체 → 출력 크기·용지 여백 → fit·align 순서로 계산합니다. fit 기본 contain, align 기본 `{x:0.5,y:0.5}`입니다. cover는 넘친 부분을 출력 영역에서 자르고 stretch는 축별 배율을 적용합니다. align 값은 0~1입니다.

background 기본 투명, JPEG만 기본 흰색입니다. #RGB/#RGBA/#RRGGBB/#RRGGBBAA, 16개 기본 CSS 색상명(소문자), transparent·null을 받습니다. JPEG의 명시적 투명 배경과 임의 CSS 함수·URL은 거부합니다.

JPEG/WebP quality 기본값은 0.92이며 PNG/SVG에는 지정하지 않습니다. 브라우저 네이티브 인코더가 요청 MIME을 생성하지 못하면 FORMAT_UNSUPPORTED입니다. 다른 형식으로 대체하지 않습니다. SVG는 foreignObject를 포함하며 순수 벡터나 디자인 도구 호환을 보증하지 않습니다.

```js
const png = await snapshot.toBlob({
  format:'png',
  size:{kind:'paper', name:'A4', ppi:300,
    marginMm:{top:10,right:10,bottom:10,left:10}},
  background:'#fff',
});
const svg = await snapshot.toSvg({size:{kind:'paper',name:'A4'}});
```

## 한도·소유권

단일 Canvas는 한 변 8192 px·면적 32,000,000 px 이내입니다. 초과 시 OUTPUT_LIMIT이며 자동 축소·분할하지 않습니다. 반환 Canvas와 소비자가 생성한 Blob URL은 소비자가 해제합니다.

출력 meta는 캡처 meta에 width/height/unit(px·css-px·mm), mime, contentRect를 추가합니다. sourceRect는 원본 CSS 영역입니다. crop·totalWidth·totalHeight·타일 메타데이터는 제거했습니다.

## 검증 경계

2026-10-15 정리 후 고정 후보를 실제 Chrome 154.0.8037.98에서 검증했습니다. 기본·2배·custom·A4·JIS B4와 SVG의 치수·MIME·decode 및 대표 원본/출력 비교를 확인했습니다. Safari의 과거 그림자·clip 재현 실패는 해결 판정을 하지 않았으며 정식 지원에서 제외합니다. 현재 실행 결과와 잔여 조건은 [지원 상태](support.md)를 따릅니다.
