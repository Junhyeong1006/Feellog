/**
 * Feellog 디자인 토큰 — 타이포그래피 (v6 "Figma DS" 정본).
 *
 * 폰트 2종 셀프호스팅(public/fonts, +html.tsx에서 @font-face):
 *  · SUIT — UI 전반(300~800). OFL 1.1.
 *  · Ownglyph brilliant(온글잎 영롱) — 한글 디스플레이/히어로 장식체. 임베딩 허용(파일 수정 금지).
 * 로고(Feellog 손글씨)는 폰트가 아니라 Figma 추출 SVG(components/FeellogLogo)를 쓴다.
 *
 * 스케일: Figma named TEXT styles 실측값 그대로.
 */
import { Platform } from 'react-native';

const SUIT_STACK =
  "SUIT, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif";
const DISPLAY_STACK = "'Ownglyph brilliant', " + SUIT_STACK;

export const fontFamily = {
  base: Platform.select({ web: SUIT_STACK, default: 'SUIT' }) as string,
  /** 손글씨 디스플레이(온보딩 타이틀·홈 카드 타이틀 장식) */
  display: Platform.select({ web: DISPLAY_STACK, default: 'Ownglyph brilliant' }) as string,
} as const;

export const fontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * 텍스트 스타일 프리셋 — Figma Typography/* 스타일 1:1.
 * display만 Ownglyph, 나머지는 SUIT.
 */
export const typography = {
  /** Display2: 온글잎 영롱 36/1.3 — 온보딩·히어로 */
  display: { fontFamily: fontFamily.display, fontSize: 36, lineHeight: 47, fontWeight: fontWeight.regular as '400' },
  /** H1: SUIT 700 32 — 페이지 제목 */
  h1: { fontSize: 32, lineHeight: 45, fontWeight: fontWeight.bold },
  /** H2: SUIT 700 28 — 섹션 제목 */
  h2: { fontSize: 28, lineHeight: 39, fontWeight: fontWeight.bold },
  /** H3: SUIT 600 24 */
  h3: { fontSize: 24, lineHeight: 34, fontWeight: fontWeight.semibold },
  /** Title: SUIT 700 20 */
  title: { fontSize: 20, lineHeight: 30, fontWeight: fontWeight.bold },
  /** Title_w: SUIT 800 20 — CTA 버튼 라벨 */
  titleW: { fontSize: 20, lineHeight: 30, fontWeight: fontWeight.extrabold },
  /** Body Large: SUIT 600 18 */
  bodyLg: { fontSize: 18, lineHeight: 29, fontWeight: fontWeight.semibold },
  /** Body: SUIT 300 16 — 기본 본문(디자인 정본) */
  body: { fontSize: 16, lineHeight: 26, fontWeight: fontWeight.light },
  /** body2: SUIT 700 16 — 본문 강조 */
  body2: { fontSize: 16, lineHeight: 26, fontWeight: fontWeight.bold },
  /** Caption: SUIT 400 14 */
  caption: { fontSize: 14, lineHeight: 21, fontWeight: fontWeight.regular },
  /** Small: SUIT 400 12 — 법적 문구·타임스탬프 */
  small: { fontSize: 12, lineHeight: 17, fontWeight: fontWeight.regular },
} as const;

export type TypographyToken = keyof typeof typography;
