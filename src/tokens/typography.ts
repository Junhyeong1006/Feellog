/**
 * Feellog 디자인 토큰 — 타이포그래피
 *
 * 시니어 가독성 우선: 본문 기본 18px(시력 저하 고려), 넉넉한 행간.
 * Phase 1에서 Pretendard 폰트를 번들링할 예정이며, 지금은 시스템 폰트로 폴백한다.
 * (fontFamily를 비워두면 RN/웹 모두 시스템 기본 폰트를 쓴다.)
 */

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** 텍스트 스타일 프리셋 — <Text style={typography.body}> 형태로 사용 */
export const typography = {
  display: { fontSize: 40, lineHeight: 48, fontWeight: fontWeight.bold },
  h1: { fontSize: 32, lineHeight: 42, fontWeight: fontWeight.bold },
  h2: { fontSize: 26, lineHeight: 36, fontWeight: fontWeight.semibold },
  title: { fontSize: 22, lineHeight: 30, fontWeight: fontWeight.semibold },
  bodyLg: { fontSize: 20, lineHeight: 30, fontWeight: fontWeight.regular },
  body: { fontSize: 18, lineHeight: 28, fontWeight: fontWeight.regular }, // 시니어 기본 본문
  caption: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.regular },
} as const;

export type TypographyToken = keyof typeof typography;
