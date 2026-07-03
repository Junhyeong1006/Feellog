import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * 웹 전용 HTML 셸 (Expo Router). 네이티브에는 영향 없음.
 * - lang="ko", PWA manifest, theme-color 연결.
 * - viewport에 maximum-scale을 두지 않아 시니어 핀치 줌(확대)을 허용한다(접근성).
 * - Pretendard Variable 셀프호스팅(다이내믹 서브셋 — 화면에 쓰인 유니코드 구간만 로드,
 *   첫 화면 기준 200~350KB). 외부 폰트 CDN 의존 없음.
 */

const BASE_CSS = `
html, body {
  background-color: #FFFFFF;
  font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
    'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  word-break: keep-all; /* 한글 어절 단위 줄바꿈 — 시니어 가독성 */
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1E6B4F" />
        <link rel="manifest" href="/manifest.json" />

        {/* 검색/공유 미리보기(OG) — 결과 공유 링크가 예쁘게 펼쳐지도록.
            OG 크롤러(카카오톡/페북 등)는 상대 경로를 해석하지 못하므로 절대 URL 필수.
            도메인은 utils/share.ts absoluteUrl()의 네이티브 폴백과 동일하게 유지할 것. */}
        <meta
          name="description"
          content="취미를 찾고, 기록하고, 나누는 공간 — 12문항 성향 테스트로 나에게 맞는 취미를 찾아보세요."
        />
        <meta property="og:site_name" content="Feellog · 필로그" />
        <meta property="og:title" content="Feellog · 필로그" />
        <meta
          property="og:description"
          content="12문항 성향 테스트로 나의 여가 유형을 알아보고, 취향에 맞는 활동을 추천받아 보세요."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://feellog.pages.dev" />
        <meta property="og:image" content="https://feellog.pages.dev/icon-512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />

        {/* Pretendard Variable 셀프호스팅(public/fonts) — CSS 내부 상대경로가 서브셋 woff2를 참조 */}
        <link rel="stylesheet" href="/fonts/pretendard/pretendardvariable-dynamic-subset.css" />
        <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
