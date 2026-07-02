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

/**
 * 텍스트 스타일 프리셋 — <Text style={typography.body}> 형태로 사용
 * 큰 제목엔 살짝 음수 자간(한글 대형 타이포 관례 — 토스/당근 벤치마킹),
 * 캡션은 500으로 크림 배경 가독성 보강. 본문 18px 하한은 절대 유지.
 */
export const typography = {
  display: { fontSize: 34, lineHeight: 44, fontWeight: fontWeight.bold, letterSpacing: -0.4 },
  h1: { fontSize: 28, lineHeight: 38, fontWeight: fontWeight.bold, letterSpacing: -0.3 },
  h2: { fontSize: 23, lineHeight: 32, fontWeight: fontWeight.bold, letterSpacing: -0.3 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: fontWeight.semibold, letterSpacing: -0.2 },
  bodyLg: { fontSize: 19, lineHeight: 29, fontWeight: fontWeight.regular },
  body: { fontSize: 18, lineHeight: 28, fontWeight: fontWeight.regular }, // 시니어 기본 본문
  caption: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.medium },
} as const;

export type TypographyToken = keyof typeof typography;
