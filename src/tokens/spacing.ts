/**
 * Feellog 디자인 토큰 — 간격/크기 (v6).
 * 4px 베이스. 디자인 기준 폭 360, 웹에서는 최대 480으로 중앙 정렬(모바일 웹앱 — 데스크탑 전용 레이아웃 없음).
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

/** 터치 최소 영역 */
export const MIN_TOUCH_SIZE = 48;

/** 모든 기기에서 동일한 모바일 웹앱 컬럼(디자인 360 기준, 최대 480) */
export const MAX_CONTENT_WIDTH = 480;

/** 디자인 시안 기준 폭(좌표 환산용) */
export const DESIGN_WIDTH = 360;

export type SpacingToken = keyof typeof spacing;
