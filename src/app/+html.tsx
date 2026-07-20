import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * 웹 전용 HTML 셸 (Expo Router). 네이티브에는 영향 없음.
 * - lang="ko", PWA manifest, theme-color(브랜드 블루) 연결.
 * - viewport에 maximum-scale을 두지 않아 핀치 줌(확대)을 허용한다(접근성).
 * - 폰트 셀프호스팅: SUIT 6웨이트(OFL) + 온글잎 영롱(디스플레이, 임베딩 허용·수정 금지).
 */

const FONT_FACES = ['Light:300', 'Regular:400', 'Medium:500', 'SemiBold:600', 'Bold:700', 'ExtraBold:800']
  .map(
    (pair) => {
      const [name, weight] = pair.split(':');
      return `@font-face{font-family:SUIT;font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/suit/SUIT-${name}.woff2) format('woff2');}`;
    },
  )
  .join('\n');

const BASE_CSS = `
${FONT_FACES}
@font-face{font-family:'Ownglyph brilliant';font-style:normal;font-weight:400;font-display:swap;src:url(/fonts/ownglyph/Ownglyph_brilliant-Rg.woff2) format('woff2');}
html, body {
  background-color: #FAFAF8;
  font-family: SUIT, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  word-break: keep-all;
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#5793F4" />
        <link rel="manifest" href="/manifest.json" />

        {/* 검색/공유 미리보기(OG) — 크롤러는 상대 경로를 해석하지 못하므로 절대 URL 필수 */}
        <meta
          name="description"
          content="취미를 찾고, 기록하고, 나누는 공간 — 12개의 질문으로 나의 여가 스타일을 찾아보세요."
        />
        <meta property="og:site_name" content="Feellog · 필로그" />
        <meta property="og:title" content="Feellog · 필로그" />
        <meta
          property="og:description"
          content="나의 여가 스타일을 찾고, 딱 맞는 클래스를 추천받고, 기록하고 나누는 공간."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://feellog.pages.dev" />
        <meta property="og:image" content="https://feellog.pages.dev/icon-512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />

        <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
