/**
 * Feellog 디자인 토큰 — 타이포그래피
 *
 * 본문 폰트 Pretendard, 로고 Baloo 2 (프로토타입 기준).
 * 웹은 +html.tsx에서 CDN으로 로드된다. 네이티브 폰트 번들링은 이후 단계에서 추가하며,
 * 그 전까지는 시스템 폰트로 자연 폴백된다(fontFamily 문자열이 없으면 시스템).
 *
 * 시니어 가독성 우선: 본문 기본 18px, 넉넉한 행간. (프로토타입의 작은 px는 축소 미리보기 값)
 */

export const fontFamily = {
  base: 'Pretendard',
  logo: 'Baloo 2',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** 텍스트 스타일 프리셋 — <Text style={typography.body}> 형태로 사용 */
export const typography = {
  display: { fontSize: 40, lineHeight: 48, fontWeight: fontWeight.bold },
  h1: { fontSize: 30, lineHeight: 40, fontWeight: fontWeight.bold },
  h2: { fontSize: 24, lineHeight: 34, fontWeight: fontWeight.semibold },
  title: { fontSize: 20, lineHeight: 28, fontWeight: fontWeight.semibold },
  bodyLg: { fontSize: 19, lineHeight: 29, fontWeight: fontWeight.regular },
  body: { fontSize: 18, lineHeight: 28, fontWeight: fontWeight.regular }, // 시니어 기본 본문
  caption: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.regular },
} as const;

export type TypographyToken = keyof typeof typography;
