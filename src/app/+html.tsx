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
