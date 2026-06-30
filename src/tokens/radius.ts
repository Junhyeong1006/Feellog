/**
 * Feellog 디자인 토큰 — 모서리 둥글기
 * 스크린샷의 둥글둥글한 카드/버튼 스타일 반영.
 */

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999, // 캡슐형 버튼('입장하기')
} as const;

export type RadiusToken = keyof typeof radius;
