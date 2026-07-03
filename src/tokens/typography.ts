/**
 * Feellog 디자인 토큰 — 타이포그래피 (v5)
 *
 * Pretendard Variable 셀프호스팅(public/fonts/pretendard, 다이내믹 서브셋 — 화면에 쓰인
 * 유니코드 구간만 로드). 웹은 +html.tsx에서 CSS 로드, 네이티브는 시스템 폰트 자연 폴백.
 *
 * 한국 실서비스 관례(토스·오늘의집 실측): 제목 700·서브 600·본문 400·라벨 500,
 * 큰 글자일수록 음수 자간(옵티컬), 한글 본문 행간 1.5~1.6, word-break: keep-all.
 * 시니어 가독성: 본문 18px 하한 절대 유지, 300 이하 웨이트 금지.
 */
import { Platform } from 'react-native';

const WEB_STACK =
  "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif";

export const fontFamily = {
  // 콤마 폴백 스택은 웹 전용(네이티브 Typeface는 단일명 조회) — Platform 분기 필수
  base: Platform.select({ web: WEB_STACK, default: 'Pretendard' }) as string,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  /** 워드마크·히어로 전용(가변폰트라 정확한 800 렌더) */
  extrabold: '800',
} as const;

/**
 * 텍스트 스타일 프리셋 — <AppText variant="body"> 형태로 사용.
 * letterSpacing은 RN px 단위(em 아님) — 큰 제목일수록 더 조인다.
 * weight 규칙: 화면당 700은 제목 1~2곳, 수치·강조 600, 본문 400, 라벨·캡션 500.
 */
export const typography = {
  display: { fontSize: 32, lineHeight: 42, fontWeight: fontWeight.bold, letterSpacing: -0.8 },
  h1: { fontSize: 26, lineHeight: 36, fontWeight: fontWeight.bold, letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 31, fontWeight: fontWeight.bold, letterSpacing: -0.4 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: fontWeight.semibold, letterSpacing: -0.3 },
  bodyLg: { fontSize: 19, lineHeight: 30, fontWeight: fontWeight.regular, letterSpacing: -0.2 },
  body: { fontSize: 18, lineHeight: 29, fontWeight: fontWeight.regular, letterSpacing: -0.2 }, // 시니어 기본 본문
  caption: { fontSize: 16, lineHeight: 24, fontWeight: fontWeight.medium, letterSpacing: 0 }, // 15→16 시니어 보정
} as const;

export type TypographyToken = keyof typeof typography;
