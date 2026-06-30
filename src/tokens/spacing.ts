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

export type SpacingToken = keyof typeof spacing;
