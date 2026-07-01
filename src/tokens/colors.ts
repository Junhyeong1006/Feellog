/**
 * Feellog 디자인 토큰 — 컬러 ("따뜻한 종이" 팔레트)
 *
 * 출처: 기획 프로토타입(docs/필로그 프로토타입). 크림/베이지 배경 + 콘플라워 블루 +
 * 코랄/민트 포인트. 웹·앱 공통. 다크모드는 Phase 2(라이트 + 고대비만 먼저).
 * 시니어 접근성: 본문 텍스트는 배경 대비 WCAG AA 이상을 목표로 한다.
 */

export const palette = {
  // 브랜드 블루
  blue500: '#5B8DEF', // primary
  blue600: '#3F6FD6', // pressed
  blueTint: '#EEF3FF',

  // 포인트
  coral: '#F4A088',
  coralTint: '#FBE4DB', // 연한 코랄(배지/밴드 배경)
  coralDeep: '#C7623F', // 진한 코랄(코랄 위 텍스트)
  mint: '#DCF1E7',
  mintStrong: '#3FB37F',
  mintDeep: '#2F8A5F',

  // 종이(크림/베이지)
  paper: '#FAF8F3', // 앱 배경
  cream: '#F3F1EA', // 크림 인셋 표면
  cream2: '#F0EEE6',
  beige: '#EDE7DC',
  border: '#E7E1D6',

  // 잉크/그레이
  ink: '#2D2D2D',
  gray600: '#5A6072',
  gray500: '#7A8091',
  gray400: '#8A8F9C',
  gray300: '#9AA0AE',
  gray200: '#B4B8C2',
  white: '#FFFFFF',

  // 상태
  red500: '#E25C5C',
  amber500: '#E9A23B',
} as const;

/**
 * 소셜 로그인 브랜드 색 — 외부 브랜드 가이드 고정값(우리 디자인 시스템 밖).
 * 컴포넌트에서 직접 하드코딩하지 않도록 여기 토큰으로 둔다.
 */
export const brand = {
  kakao: '#FEE500',
  kakaoText: '#191600',
  google: '#FFFFFF',
  googleBorder: '#DADCE0',
  googleText: '#1F1F1F',
  apple: '#000000',
  appleText: '#FFFFFF',
} as const;

export type BrandToken = keyof typeof brand;

/** 의미 기반 컬러(컴포넌트는 이걸 참조. 하드코딩 금지) */
export const colors = {
  primary: palette.blue500,
  primaryPressed: palette.blue600,
  primaryTint: palette.blueTint,
  accentCoral: palette.coral,
  accentMint: palette.mint,
  mint: palette.mintStrong,

  background: palette.paper, // 크림 "종이" 배경
  surface: palette.white, // 흰 카드(부드러운 그림자)
  surfaceInset: palette.cream, // 크림 인셋(입력/구획)
  surfaceAlt: palette.cream2,
  border: palette.border,

  textPrimary: palette.ink,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  onPrimary: palette.white,

  danger: palette.red500,
  success: palette.mintStrong,
  warning: palette.amber500,

  // 보조 버튼('둘러보기')
  secondaryBg: palette.cream2,
  secondaryText: palette.ink,
} as const;

export type ColorToken = keyof typeof colors;
