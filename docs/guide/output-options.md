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

다음은 portrait 기준 mm 치수이며 landscape는 두 변을 바꿉니다. B열은 ISO와 JIS의 치수가 다르므로 system을 구분해야 합니다.

| 이름 | ISO (mm) | JIS (mm) |
|---|---|---|
| A3 | 297×420 | 297×420 |
| A4 | 210×297 | 210×297 |
| A5 | 148×210 | 148×210 |
| B3 | 353×500 | 364×515 |
| B4 | 250×353 | 257×364 |
| B5 | 176×250 | 182×257 |

JIS 치수는 [TAKEO의 JIS P0138 치수표](https://takeopaper.com/knowledge/specific)와 [후지필름의 용지 치수표](https://www.fujifilm.com/fb/ja/support/colorprint/howto/paper/size)를 교차 확인했습니다. ISO는 [ISO 216:2007 공개 preview](https://preview.sist.si/sist-preview/36631/c0883203ea25445c9992bb09343620c5/ISO-216-2007.pdf)의 기존 대조 결과를 사용합니다. 이 표는 출력 크기 프리셋이며 종이의 물리적 허용차·측정 조건을 포함한 규격 전체 적합성이나 인증을 보증하지 않습니다.

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

각 Canvas는 한 변 8192 px·면적 32,000,000 px 이내입니다. 초과 시 OUTPUT_LIMIT이며 자동 축소·분할하지 않습니다. 기존 direct foreignObject/XHTML div·CSS zoom 경로에서 두 축 모두 1 이하이며 적어도 한 축이 1 미만인 래스터 출력은 원본을 배율1 Canvas로 확정한 뒤 축소합니다. 이때 원본의 소수 크기를 각각 올림한 중간 Canvas에도 같은 한도를 할당 전에 검사하므로 최종 출력이 작아도 OUTPUT_LIMIT일 수 있습니다. 실제 이 분기에서만 적용하며 capture 입력 전체의 새 제한은 아닙니다. 소수 원본 크기는 최종 source crop에 유지하고 임시 Canvas는 작업별 finally에서 해제합니다. 기존 reciprocal 경로·실효 배율1·확대는 유지합니다. SVG 축소는 아래 제한된 텍스트 보정을 적용하며, 일반 텍스트 전체의 줄 배치 보존을 보증하지 않습니다. 반환 Canvas와 소비자가 생성한 Blob URL은 소비자가 해제합니다.

출력 meta는 캡처 meta에 width/height/unit(px·css-px·mm), mime, contentRect를 추가합니다. sourceRect는 원본 CSS 영역입니다. crop·totalWidth·totalHeight·타일 메타데이터는 제거했습니다.

## SVG 축소의 제한된 텍스트 보존

2026-10-23 로컬 후보는 직접 foreignObject/CSS zoom SVG 경로의 실효 배율이 두 축 모두 1 미만일 때, 적격한 절대 배치 단일 텍스트와 일반 block의 단일 Text 문단을 원본 배율로 처리한 뒤 기하 축소합니다. mm 출력은 CSS px 환산 후 배율을 판정합니다. 컨테이너의 그림자·클리핑 경로는 유지하며 PNG를 내장하거나 글꼴 크기·폭을 변경하거나 nowrap을 강제하지 않습니다.

적격 범위는 패딩·테두리·요소 자식·생성 콘텐츠·텍스트 효과가 없는 단순 LTR·가로쓰기 텍스트입니다. 절대 배치는 원본 한 줄에 한정하며, 일반 block은 static/relative의 단일 Text 노드로 된 한 줄·여러 줄 문단을 허용합니다. 일반 block은 외부 조상까지 보수적인 block 문맥을 요구하며 flex/grid·table·inline·flow-root·float·다단 등은 보정하지 않습니다. 캡처 내부의 float·음수 margin·박스 밖 효과나 비조상 요소와의 겹침 등 페인트 순서가 달라질 수 있는 문맥도 보정하지 않습니다. 이 조건은 일반 CSS의 효과 영역을 계산하는 기능이 아니며 검증한 제한적 block 문맥만 대상으로 합니다. 혼합 인라인·RTL·원본 transform/zoom 등 비적격 구조에도 기존 경로를 유지합니다. 검사 예산을 초과하면 일반 block 보정을 생략하며 기존 capture 입력 제한은 변경하지 않습니다. fallback 경로의 기존 줄 재배치까지 해결하는 것은 아닙니다. 일반 문단은 원본 used 크기를 유지하고, static의 무시되던 inset을 활성화하지 않으며, 캡처 중 전체 줄 rect 변화도 검사합니다. 원본 배치·글꼴 속성은 캡처 시 불변 데이터로 보관하므로 출력 시 원본 DOM을 다시 읽지 않습니다. 기본 SVG·실효 배율 1·확대·기존 reciprocal 경로·래스터 출력은 이 텍스트 보정의 대상이 아닙니다.

배율 문자열의 CSSOM 반올림을 피하되, 브라우저 내부 수치 연산까지 모든 배율에서 정확하게 상쇄된다고 보장하지 않습니다. 이는 일부 텍스트 재배치의 보완이며 일반 HTML 전체의 완전 벡터 변환이 아닙니다. WebKit에서 기존 SVG를 외부에서 다시 확대할 때 발생하는 그림자·clip 문제도 별도로 남습니다. 실제 지원·검증 범위는 [지원 상태](support.md)를 따릅니다.

## 검증 경계

2026-10-15 정리 후 고정 후보를 실제 Chrome 154.0.8037.98에서 검증했습니다. 기본·2배·custom·A4·JIS B4와 SVG의 치수·MIME·decode 및 대표 원본/출력 비교를 확인했습니다. 당시 Safari는 그림자·clip 재현 실패로 정식 지원에서 제외했습니다. 0.0.2 로컬 후보의 해당 결함 보완과 native macOS Safari 27.0.1 한정 검증 결과는 [지원 상태](support.md)를 따릅니다.
