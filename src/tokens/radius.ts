/**
 * Feellog 디자인 토큰 — 모서리 둥글기 (v6 Figma DS).
 * 인풋 8 · 카드 12~24 · 버튼/칩/탭바 = 필(9999). 실측값 기준.
 */

export const radius = {
  sm: 8, // 인풋·작은 칩
  md: 12, // 카드(중)·배너
  lg: 16, // 카드(대)
  xl: 20, // 큰 카드·사진 블록
  xxl: 24, // 시트·플로팅 탭바
  pill: 9999, // CTA·칩·소셜 원형
} as const;

export type RadiusToken = keyof typeof radius;
