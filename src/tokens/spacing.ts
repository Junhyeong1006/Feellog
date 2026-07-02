/**
 * Feellog 디자인 토큰 — 간격/크기
 * 4px 베이스 스케일. 시니어 터치 영역 최소 48dp를 별도 상수로 강제한다.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
} as const;

/** 접근성: 터치 가능한 요소의 최소 한 변 길이(시니어 친화). 깎지 말 것. */
export const MIN_TOUCH_SIZE = 48;

/** 모바일 폭 기준 콘텐츠 최대 너비(웹에서 중앙 정렬용) */
export const MAX_CONTENT_WIDTH = 480;

/**
 * 반응형 브레이크포인트(웹 전용 판단은 useBreakpoint에서).
 * desktop 이상에서 사이드바 셸 + 화면별 와이드 레이아웃이 켜진다.
 */
export const BREAKPOINTS = {
  /** 태블릿 이상 — 일부 폭 완화 */
  medium: 768,
  /** 데스크탑 — 사이드바 + 와이드 레이아웃 */
  desktop: 1024,
} as const;

/** 데스크탑 셸의 좌측 사이드바 너비 */
export const SIDEBAR_WIDTH = 264;

/** 화면 성격별 콘텐츠 최대 너비 프리셋 (Screen maxWidth로 전달) */
export const CONTENT_WIDTH = {
  /** 폰 컬럼(기본) — 몰입형 플로우(로그인·테스트 진행 등) */
  phone: MAX_CONTENT_WIDTH,
  /** 집중 카드 1장(추천 피드) */
  focus: 620,
  /** 읽기 컬럼 — 피드·문서·작성 */
  reading: 680,
  /** 넓은 콘텐츠 — 상세·결과 2컬럼 */
  wide: 920,
  /** 대시보드 — 홈 등 그리드 */
  dashboard: 1080,
} as const;

export type SpacingToken = keyof typeof spacing;
