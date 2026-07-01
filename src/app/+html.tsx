import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * 웹 전용 HTML 셸 (Expo Router). 네이티브에는 영향 없음.
 * - lang="ko", PWA manifest, theme-color 연결.
 * - viewport에 maximum-scale을 두지 않아 시니어 핀치 줌(확대)을 허용한다(접근성).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#5B8DEF" />
        <link rel="manifest" href="/manifest.json" />

        {/* 본문 Pretendard + 로고 Baloo 2 (웹 CDN). 네이티브는 시스템 폰트로 폴백. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&display=swap"
        />
        {/* 크림 "종이" 배경을 첫 페인트부터 적용(깜빡임 방지) */}
        <style dangerouslySetInnerHTML={{ __html: 'html,body{background-color:#FAF8F3;}' }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
