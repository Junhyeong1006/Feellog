/**
 * Feellog 디자인 토큰 — 컬러
 *
 * 기획 스크린샷(로그인/온보딩/결과 화면)의 파스텔·친근 스타일에서 추출한 근사 팔레트.
 * 웹·앱 공통으로 사용한다. 다크모드는 Phase 2에서 dark 팔레트를 추가한다
 * (지금은 라이트 + 고대비 토글만 지원하기로 비용 검토에서 확정).
 *
 * 시니어 접근성: 본문 텍스트는 배경 대비 WCAG AA(4.5:1) 이상을 목표로 한다.
 */

export const palette = {
  // 브랜드 블루 (로고 'Feellog', 주 버튼 '입장하기')
  blue50: '#EEF3FF',
  blue100: '#D9E3FD',
  blue300: '#A9B8F0', // 온보딩 일러스트 원형(페리윙클)
  blue500: '#5B8DEF', // primary
  blue600: '#3F6FD6', // primary pressed
  blue700: '#2F58B5',

  // 포인트: 코랄(리본)·민트(블록)
  coral400: '#F4A088',
  mint400: '#A8E0C5',

  // 중립
  white: '#FFFFFF',
  gray50: '#F5F6F8',
  gray100: '#EEF0F3',
  gray200: '#E5E7EB',
  gray400: '#9AA0AE',
  gray600: '#5A6072',
  gray900: '#1F2430',

  // 상태
  red500: '#E25C5C', // 에러(로그인 인라인 에러)
  green500: '#3FB37F',
  amber500: '#E9A23B',
} as const;

/** 의미 기반 컬러(컴포넌트는 이걸 참조한다) */
export const colors = {
  primary: palette.blue500,
  primaryPressed: palette.blue600,
  primaryTint: palette.blue50,
  accentPeri: palette.blue300,
  accentCoral: palette.coral400,
  accentMint: palette.mint400,

  background: palette.white,
  surface: palette.gray50,
  surfaceAlt: palette.gray100,
  border: palette.gray200,

  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  onPrimary: palette.white,

  danger: palette.red500,
  success: palette.green500,
  warning: palette.amber500,

  // 보조 버튼('둘러보기')
  secondaryBg: palette.gray100,
  secondaryText: palette.gray900,
} as const;

export type ColorToken = keyof typeof colors;
