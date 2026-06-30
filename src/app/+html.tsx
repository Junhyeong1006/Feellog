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
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
